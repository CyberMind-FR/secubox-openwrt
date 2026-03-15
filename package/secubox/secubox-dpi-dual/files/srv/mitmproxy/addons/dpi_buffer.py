#!/usr/bin/env python3
"""
DPI Double Buffer Addon for mitmproxy
Part of secubox-dpi-dual package

Implements the double-buffer pattern:
- Buffer A: Live path, minimal latency (default mitmproxy behavior)
- Buffer B: Copy for deep analysis, async processing

This addon queues requests for asynchronous analysis without
blocking the live traffic path.
"""

import json
import time
import hashlib
import asyncio
from pathlib import Path
from collections import deque
from typing import Optional, Dict, Any
from mitmproxy import http, ctx


class DPIBuffer:
    """Double-buffer for request analysis without blocking live traffic."""

    def __init__(self):
        self.buffer_size = 1000
        self.buffer: deque = deque(maxlen=self.buffer_size)
        self.buffer_dir = Path("/tmp/dpi-buffer")
        self.stats_file = Path("/tmp/secubox/dpi-buffer.json")
        self.analysis_enabled = True
        self.request_count = 0
        self.threat_count = 0

        # Ensure directories exist
        self.buffer_dir.mkdir(parents=True, exist_ok=True)
        self.stats_file.parent.mkdir(parents=True, exist_ok=True)

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

    def configure(self, updated):
        """Apply configuration updates."""
        if "dpi_buffer_size" in updated:
            self.buffer_size = ctx.options.dpi_buffer_size
            # Resize buffer
            new_buffer = deque(self.buffer, maxlen=self.buffer_size)
            self.buffer = new_buffer

        if "dpi_async_analysis" in updated:
            self.analysis_enabled = ctx.options.dpi_async_analysis

    def request(self, flow: http.HTTPFlow):
        """
        Handle incoming request.
        Buffer A: Forward immediately (default mitmproxy behavior)
        Buffer B: Queue for async analysis
        """
        self.request_count += 1

        # Build entry for Buffer B (async analysis)
        entry = self._build_entry(flow)
        self.buffer.append(entry)

        # Queue for async analysis if enabled
        if self.analysis_enabled:
            asyncio.create_task(self._async_analyze(entry))

        # Update stats periodically (every 10 requests)
        if self.request_count % 10 == 0:
            self._write_stats()

    def response(self, flow: http.HTTPFlow):
        """Handle response - update buffer entry with response info."""
        if not flow.request.timestamp_start:
            return

        # Find and update the corresponding entry
        req_hash = self._request_hash(flow)
        for entry in self.buffer:
            if entry.get("req_hash") == req_hash:
                entry["response"] = {
                    "status": flow.response.status_code if flow.response else None,
                    "content_length": len(flow.response.content) if flow.response and flow.response.content else 0,
                    "content_type": flow.response.headers.get("content-type", "") if flow.response else "",
                }
                break

    def _build_entry(self, flow: http.HTTPFlow) -> Dict[str, Any]:
        """Build a buffer entry from a flow."""
        content_hash = None
        if flow.request.content:
            content_hash = hashlib.md5(flow.request.content).hexdigest()

        client_ip = "unknown"
        if flow.client_conn and flow.client_conn.peername:
            client_ip = flow.client_conn.peername[0]

        return {
            "ts": flow.request.timestamp_start,
            "req_hash": self._request_hash(flow),
            "method": flow.request.method,
            "host": flow.request.host,
            "port": flow.request.port,
            "path": flow.request.path,
            "headers": dict(flow.request.headers),
            "content_hash": content_hash,
            "content_length": len(flow.request.content) if flow.request.content else 0,
            "client_ip": client_ip,
            "analyzed": False,
            "threat_score": 0,
        }

    def _request_hash(self, flow: http.HTTPFlow) -> str:
        """Generate a unique hash for a request."""
        key = f"{flow.request.timestamp_start}:{flow.request.host}:{flow.request.path}"
        return hashlib.md5(key.encode()).hexdigest()[:16]

    async def _async_analyze(self, entry: Dict[str, Any]):
        """
        Async analysis pipeline - runs without blocking live traffic.

        Analysis steps:
        1. Pattern matching against known threat signatures
        2. Anomaly scoring based on request characteristics
        3. Rate limiting detection
        4. Write results to analysis log
        """
        try:
            threat_score = 0

            # Simple heuristic analysis (placeholder for more sophisticated detection)
            # Check for common attack patterns in path
            suspicious_patterns = [
                "../", "..\\",  # Path traversal
                "<script", "javascript:",  # XSS
                "SELECT ", "UNION ", "INSERT ",  # SQL injection
                "/etc/passwd", "/etc/shadow",  # LFI
                "cmd=", "exec=", "system(",  # Command injection
            ]

            path_lower = entry.get("path", "").lower()
            for pattern in suspicious_patterns:
                if pattern.lower() in path_lower:
                    threat_score += 20

            # Check for unusual content types in requests
            content_type = entry.get("headers", {}).get("content-type", "")
            if "multipart/form-data" in content_type and entry.get("content_length", 0) > 1000000:
                threat_score += 10  # Large file upload

            # Update entry with analysis results
            entry["analyzed"] = True
            entry["threat_score"] = min(threat_score, 100)

            # Track threats
            if threat_score > 30:
                self.threat_count += 1
                await self._log_threat(entry)

        except Exception as e:
            ctx.log.error(f"DPI Buffer analysis error: {e}")

    async def _log_threat(self, entry: Dict[str, Any]):
        """Log a detected threat to the alerts file."""
        alert_file = Path("/tmp/secubox/waf-alerts.json")
        try:
            alerts = []
            if alert_file.exists():
                alerts = json.loads(alert_file.read_text())

            alert_id = len(alerts) + 1
            alerts.append({
                "id": alert_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "client_ip": entry.get("client_ip"),
                "host": entry.get("host"),
                "path": entry.get("path"),
                "method": entry.get("method"),
                "threat_score": entry.get("threat_score"),
                "rule": "dpi_buffer_analysis",
            })

            # Keep last 1000 alerts
            alerts = alerts[-1000:]
            alert_file.write_text(json.dumps(alerts, indent=2))

        except Exception as e:
            ctx.log.error(f"Failed to log threat: {e}")

    def _write_stats(self):
        """Write buffer statistics to stats file."""
        try:
            stats = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "entries": len(self.buffer),
                "max_size": self.buffer_size,
                "requests_total": self.request_count,
                "threats_detected": self.threat_count,
                "analysis_enabled": self.analysis_enabled,
            }
            self.stats_file.write_text(json.dumps(stats, indent=2))
        except Exception as e:
            ctx.log.error(f"Failed to write stats: {e}")

    def get_context(self, client_ip: str, window_sec: int = 60) -> list:
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


# Mitmproxy addon instance
addons = [DPIBuffer()]
