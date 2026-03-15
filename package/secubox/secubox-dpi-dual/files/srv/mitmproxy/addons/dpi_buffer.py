#!/usr/bin/env python3
"""
DPI Double Buffer Addon for mitmproxy - Phase 2
Part of secubox-dpi-dual package

Implements the double-buffer pattern:
- Buffer A: Live path, minimal latency (default mitmproxy behavior)
- Buffer B: Copy for deep analysis, async processing

Features:
- Ring buffer with configurable size
- Async threat analysis without blocking
- Request replay capability for forensic analysis
- Context gathering for correlated threat investigation
- Stats endpoint for monitoring
"""

import json
import time
import hashlib
import asyncio
import re
from pathlib import Path
from collections import deque
from typing import Optional, Dict, Any, List
from mitmproxy import http, ctx
from mitmproxy.net.http import Response


class DPIBuffer:
    """Double-buffer for request analysis without blocking live traffic."""

    def __init__(self):
        self.buffer_size = 1000
        self.buffer: deque = deque(maxlen=self.buffer_size)
        self.buffer_dir = Path("/tmp/dpi-buffer")
        self.stats_file = Path("/tmp/secubox/dpi-buffer.json")
        self.alerts_file = Path("/tmp/secubox/waf-alerts.json")
        self.replay_queue_file = Path("/tmp/dpi-buffer/replay-queue.json")
        self.analysis_enabled = True
        self.replay_enabled = True
        self.request_count = 0
        self.threat_count = 0
        self.blocked_count = 0

        # Threat detection patterns
        self.threat_patterns = {
            "path_traversal": [
                r"\.\./", r"\.\.\\", r"%2e%2e[/\\]", r"%252e%252e",
            ],
            "xss": [
                r"<script", r"javascript:", r"onerror\s*=", r"onload\s*=",
                r"<img[^>]+onerror", r"<svg[^>]+onload",
            ],
            "sqli": [
                r"(?i)union\s+select", r"(?i)insert\s+into", r"(?i)drop\s+table",
                r"(?i)or\s+1\s*=\s*1", r"(?i)'\s*or\s+'", r";\s*--",
            ],
            "lfi": [
                r"/etc/passwd", r"/etc/shadow", r"/proc/self",
                r"php://filter", r"php://input",
            ],
            "rce": [
                r"(?i)cmd\s*=", r"(?i)exec\s*=", r"system\s*\(",
                r"\$\{.*\}", r"`[^`]+`", r"\|\s*\w+",
            ],
            "ssrf": [
                r"(?i)url\s*=\s*https?://", r"(?i)file://", r"(?i)gopher://",
                r"169\.254\.169\.254", r"127\.0\.0\.1", r"localhost",
            ],
        }

        # Compile patterns for performance
        self.compiled_patterns = {}
        for category, patterns in self.threat_patterns.items():
            self.compiled_patterns[category] = [
                re.compile(p, re.IGNORECASE) for p in patterns
            ]

        # Ensure directories exist
        self.buffer_dir.mkdir(parents=True, exist_ok=True)
        self.stats_file.parent.mkdir(parents=True, exist_ok=True)

        # Initialize replay queue
        if not self.replay_queue_file.exists():
            self.replay_queue_file.write_text("[]")

    def load(self, loader):
        """Load configuration from mitmproxy options."""
        loader.add_option(
            name="dpi_buffer_size",
            typespec=int,
            default=1000,
            help="Size of the request buffer for async analysis",
        )
        loader.add_option(
            name="dpi_async_analysis",
            typespec=bool,
            default=True,
            help="Enable asynchronous request analysis",
        )
        loader.add_option(
            name="dpi_replay_enabled",
            typespec=bool,
            default=True,
            help="Enable request replay capability",
        )
        loader.add_option(
            name="dpi_block_threats",
            typespec=bool,
            default=False,
            help="Block requests that match threat patterns (careful!)",
        )

    def configure(self, updated):
        """Apply configuration updates."""
        if "dpi_buffer_size" in updated:
            self.buffer_size = ctx.options.dpi_buffer_size
            new_buffer = deque(self.buffer, maxlen=self.buffer_size)
            self.buffer = new_buffer

        if "dpi_async_analysis" in updated:
            self.analysis_enabled = ctx.options.dpi_async_analysis

        if "dpi_replay_enabled" in updated:
            self.replay_enabled = ctx.options.dpi_replay_enabled

    def request(self, flow: http.HTTPFlow):
        """
        Handle incoming request.
        Buffer A: Forward immediately (default mitmproxy behavior)
        Buffer B: Queue for async analysis
        """
        self.request_count += 1

        # Build entry for Buffer B (async analysis)
        entry = self._build_entry(flow)

        # Quick synchronous threat check (for blocking mode)
        threat_result = self._quick_threat_check(entry)
        entry["threat_categories"] = threat_result["categories"]
        entry["threat_score"] = threat_result["score"]

        # Block if enabled and high threat score
        if ctx.options.dpi_block_threats and threat_result["score"] >= 50:
            self.blocked_count += 1
            flow.response = Response.make(
                403,
                b"Request blocked by DPI analysis",
                {"Content-Type": "text/plain"}
            )
            entry["blocked"] = True
            self._log_threat_sync(entry)
            return

        # Add to buffer
        self.buffer.append(entry)

        # Queue for async deep analysis if enabled
        if self.analysis_enabled:
            asyncio.create_task(self._async_analyze(entry))

        # Update stats periodically
        if self.request_count % 10 == 0:
            self._write_stats()

    def response(self, flow: http.HTTPFlow):
        """Handle response - update buffer entry with response info."""
        if not flow.request.timestamp_start:
            return

        req_hash = self._request_hash(flow)
        for entry in self.buffer:
            if entry.get("req_hash") == req_hash:
                entry["response"] = {
                    "status": flow.response.status_code if flow.response else None,
                    "content_length": len(flow.response.content) if flow.response and flow.response.content else 0,
                    "content_type": flow.response.headers.get("content-type", "") if flow.response else "",
                    "latency_ms": int((time.time() - entry["ts"]) * 1000),
                }
                break

    def _build_entry(self, flow: http.HTTPFlow) -> Dict[str, Any]:
        """Build a buffer entry from a flow."""
        content_hash = None
        content_preview = None
        if flow.request.content:
            content_hash = hashlib.md5(flow.request.content).hexdigest()
            # Store first 500 bytes for analysis
            content_preview = flow.request.content[:500].decode('utf-8', errors='replace')

        client_ip = "unknown"
        if flow.client_conn and flow.client_conn.peername:
            client_ip = flow.client_conn.peername[0]

        # Extract query parameters
        query_params = {}
        if "?" in flow.request.path:
            query_string = flow.request.path.split("?", 1)[1]
            for param in query_string.split("&"):
                if "=" in param:
                    key, value = param.split("=", 1)
                    query_params[key] = value

        return {
            "ts": flow.request.timestamp_start,
            "req_hash": self._request_hash(flow),
            "method": flow.request.method,
            "host": flow.request.host,
            "port": flow.request.port,
            "path": flow.request.path,
            "query_params": query_params,
            "headers": dict(flow.request.headers),
            "content_hash": content_hash,
            "content_preview": content_preview,
            "content_length": len(flow.request.content) if flow.request.content else 0,
            "client_ip": client_ip,
            "user_agent": flow.request.headers.get("user-agent", ""),
            "analyzed": False,
            "threat_score": 0,
            "threat_categories": [],
            "blocked": False,
        }

    def _request_hash(self, flow: http.HTTPFlow) -> str:
        """Generate a unique hash for a request."""
        key = f"{flow.request.timestamp_start}:{flow.request.host}:{flow.request.path}"
        return hashlib.md5(key.encode()).hexdigest()[:16]

    def _quick_threat_check(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """Quick synchronous threat check for blocking decisions."""
        score = 0
        categories = []

        # Check path + query string
        full_path = entry.get("path", "")
        content = entry.get("content_preview", "") or ""

        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                if pattern.search(full_path) or pattern.search(content):
                    if category not in categories:
                        categories.append(category)
                        score += 25
                    break

        # Additional heuristics
        headers = entry.get("headers", {})

        # Suspicious user agent
        ua = entry.get("user_agent", "").lower()
        suspicious_ua = ["sqlmap", "nikto", "nmap", "masscan", "zgrab", "gobuster"]
        if any(s in ua for s in suspicious_ua):
            categories.append("scanner")
            score += 30

        # Missing or suspicious headers
        if not ua or len(ua) < 10:
            score += 5

        # Large POST without content-type
        if entry.get("method") == "POST" and entry.get("content_length", 0) > 0:
            if "content-type" not in [k.lower() for k in headers.keys()]:
                score += 10

        return {"score": min(score, 100), "categories": categories}

    async def _async_analyze(self, entry: Dict[str, Any]):
        """
        Async analysis pipeline - runs without blocking live traffic.
        Deep analysis including:
        - Pattern matching with context
        - Rate limiting detection
        - Behavioral analysis
        """
        try:
            # Deep pattern analysis already done in quick check
            # Here we can add more expensive analysis

            # Check for rate limiting patterns
            client_ip = entry.get("client_ip")
            recent_from_ip = self.get_context(client_ip, window_sec=10)
            if len(recent_from_ip) > 20:
                entry["threat_categories"].append("rate_limit")
                entry["threat_score"] = min(entry["threat_score"] + 20, 100)

            # Mark as analyzed
            entry["analyzed"] = True

            # Log if threat detected
            if entry["threat_score"] > 30:
                self.threat_count += 1
                await self._log_threat(entry)

        except Exception as e:
            ctx.log.error(f"DPI Buffer analysis error: {e}")

    def _log_threat_sync(self, entry: Dict[str, Any]):
        """Synchronous threat logging for blocked requests."""
        try:
            alerts = []
            if self.alerts_file.exists():
                try:
                    alerts = json.loads(self.alerts_file.read_text())
                except:
                    alerts = []

            alert_id = len(alerts) + 1
            alerts.append({
                "id": alert_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "client_ip": entry.get("client_ip"),
                "host": entry.get("host"),
                "path": entry.get("path"),
                "method": entry.get("method"),
                "threat_score": entry.get("threat_score"),
                "categories": entry.get("threat_categories", []),
                "blocked": entry.get("blocked", False),
                "rule": "dpi_buffer_analysis",
            })

            alerts = alerts[-1000:]
            self.alerts_file.write_text(json.dumps(alerts, indent=2))
        except Exception as e:
            ctx.log.error(f"Failed to log threat: {e}")

    async def _log_threat(self, entry: Dict[str, Any]):
        """Log a detected threat to the alerts file."""
        self._log_threat_sync(entry)

    def _write_stats(self):
        """Write buffer statistics to stats file."""
        try:
            # Calculate threat distribution
            threat_dist = {}
            high_threat_count = 0
            for e in self.buffer:
                for cat in e.get("threat_categories", []):
                    threat_dist[cat] = threat_dist.get(cat, 0) + 1
                if e.get("threat_score", 0) > 30:
                    high_threat_count += 1

            # Top hosts
            host_counts = {}
            for e in self.buffer:
                host = e.get("host", "unknown")
                host_counts[host] = host_counts.get(host, 0) + 1
            top_hosts = sorted(host_counts.items(), key=lambda x: x[1], reverse=True)[:10]

            stats = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "entries": len(self.buffer),
                "max_size": self.buffer_size,
                "requests_total": self.request_count,
                "threats_detected": self.threat_count,
                "blocked_count": self.blocked_count,
                "high_threat_in_buffer": high_threat_count,
                "threat_distribution": threat_dist,
                "top_hosts": dict(top_hosts),
                "analysis_enabled": self.analysis_enabled,
                "replay_enabled": self.replay_enabled,
            }
            self.stats_file.write_text(json.dumps(stats, indent=2))
        except Exception as e:
            ctx.log.error(f"Failed to write stats: {e}")

    def get_context(self, client_ip: str, window_sec: int = 60) -> List[Dict]:
        """
        Get recent requests from the same IP for context on alerts.
        Used by the correlation engine to gather context around threat events.
        """
        now = time.time()
        return [
            e for e in self.buffer
            if e.get("client_ip") == client_ip
            and now - e.get("ts", 0) < window_sec
        ]

    def get_replay_candidates(self, client_ip: str = None,
                               min_threat_score: int = 0,
                               limit: int = 100) -> List[Dict]:
        """Get requests suitable for replay analysis."""
        candidates = []
        for e in self.buffer:
            if client_ip and e.get("client_ip") != client_ip:
                continue
            if e.get("threat_score", 0) < min_threat_score:
                continue
            candidates.append({
                "req_hash": e.get("req_hash"),
                "ts": e.get("ts"),
                "method": e.get("method"),
                "host": e.get("host"),
                "path": e.get("path"),
                "threat_score": e.get("threat_score"),
                "categories": e.get("threat_categories", []),
            })
            if len(candidates) >= limit:
                break
        return candidates

    def queue_replay(self, req_hash: str) -> bool:
        """Queue a request for replay analysis."""
        if not self.replay_enabled:
            return False

        # Find the request in buffer
        entry = None
        for e in self.buffer:
            if e.get("req_hash") == req_hash:
                entry = e
                break

        if not entry:
            return False

        try:
            queue = []
            if self.replay_queue_file.exists():
                queue = json.loads(self.replay_queue_file.read_text())

            # Add to queue with replay metadata
            replay_entry = {
                "queued_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "original_ts": entry.get("ts"),
                "method": entry.get("method"),
                "host": entry.get("host"),
                "path": entry.get("path"),
                "headers": entry.get("headers"),
                "content_preview": entry.get("content_preview"),
                "req_hash": req_hash,
                "status": "pending",
            }
            queue.append(replay_entry)
            queue = queue[-100:]  # Keep last 100

            self.replay_queue_file.write_text(json.dumps(queue, indent=2))
            return True
        except Exception as e:
            ctx.log.error(f"Failed to queue replay: {e}")
            return False


# Mitmproxy addon instance
addons = [DPIBuffer()]
