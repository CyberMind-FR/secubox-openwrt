#!/usr/bin/env python3
"""
SecuBox Analytics Addon for mitmproxy
Logs external access attempts with IP, country, user agent, auth attempts, scan detection
Feeds data to CrowdSec for threat detection
"""

import json
import time
import re
import hashlib
import os
from datetime import datetime
from mitmproxy import http, ctx
from pathlib import Path

# GeoIP database path (MaxMind GeoLite2)
GEOIP_DB = "/srv/mitmproxy/GeoLite2-Country.mmdb"
LOG_FILE = "/var/log/secubox-access.log"
CROWDSEC_LOG = "/var/log/crowdsec/secubox-mitm.log"
ALERTS_FILE = "/tmp/secubox-mitm-alerts.json"

# Suspicious patterns
SCAN_PATTERNS = [
    r'/\.env', r'/\.git', r'/wp-admin', r'/wp-login', r'/phpmyadmin',
    r'/admin', r'/administrator', r'/xmlrpc\.php', r'/wp-content/uploads',
    r'/\.aws', r'/\.ssh', r'/config\.php', r'/backup', r'/db\.sql',
    r'/shell', r'/cmd', r'/exec', r'/eval', r'\.\./', r'/etc/passwd',
    r'/proc/self', r'<script', r'union\s+select', r';\s*drop\s+table',
]

AUTH_PATHS = [
    '/login', '/signin', '/auth', '/api/auth', '/oauth', '/token',
    '/session', '/cgi-bin/luci', '/admin'
]

BOT_SIGNATURES = [
    'bot', 'crawler', 'spider', 'scan', 'curl', 'wget', 'python-requests',
    'go-http-client', 'java/', 'zgrab', 'masscan', 'nmap', 'nikto'
]

class SecuBoxAnalytics:
    def __init__(self):
        self.geoip = None
        self.alerts = []
        self._load_geoip()
        ctx.log.info("SecuBox Analytics addon loaded")

    def _load_geoip(self):
        """Load GeoIP database if available"""
        try:
            import geoip2.database
            if os.path.exists(GEOIP_DB):
                self.geoip = geoip2.database.Reader(GEOIP_DB)
                ctx.log.info(f"GeoIP database loaded: {GEOIP_DB}")
        except ImportError:
            ctx.log.warn("geoip2 not available - country detection disabled")
        except Exception as e:
            ctx.log.warn(f"Failed to load GeoIP: {e}")

    def _get_country(self, ip: str) -> str:
        """Get country code from IP"""
        if not self.geoip or ip.startswith(('10.', '172.16.', '192.168.', '127.')):
            return 'LOCAL'
        try:
            response = self.geoip.country(ip)
            return response.country.iso_code or 'XX'
        except:
            return 'XX'

    def _get_client_fingerprint(self, request: http.Request) -> dict:
        """Generate client fingerprint from headers"""
        ua = request.headers.get('user-agent', '')
        accept = request.headers.get('accept', '')
        accept_lang = request.headers.get('accept-language', '')
        accept_enc = request.headers.get('accept-encoding', '')

        # Create fingerprint hash
        fp_str = f"{ua}|{accept}|{accept_lang}|{accept_enc}"
        fp_hash = hashlib.md5(fp_str.encode()).hexdigest()[:12]

        # Detect bot
        is_bot = any(sig in ua.lower() for sig in BOT_SIGNATURES)

        # Parse UA for device info
        device = 'unknown'
        if 'mobile' in ua.lower() or 'android' in ua.lower():
            device = 'mobile'
        elif 'iphone' in ua.lower() or 'ipad' in ua.lower():
            device = 'ios'
        elif 'windows' in ua.lower():
            device = 'windows'
        elif 'mac' in ua.lower():
            device = 'macos'
        elif 'linux' in ua.lower():
            device = 'linux'

        return {
            'fingerprint': fp_hash,
            'user_agent': ua[:200],
            'is_bot': is_bot,
            'device': device
        }

    def _detect_scan(self, request: http.Request) -> dict:
        """Detect scan/attack patterns"""
        path = request.path.lower()
        full_url = request.pretty_url.lower()

        for pattern in SCAN_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return {'is_scan': True, 'pattern': pattern, 'type': 'path_scan'}
            if re.search(pattern, full_url, re.IGNORECASE):
                return {'is_scan': True, 'pattern': pattern, 'type': 'url_scan'}

        # Check for SQL injection
        if re.search(r"['\";\-\-]|union|select|insert|drop|update|delete", full_url, re.I):
            return {'is_scan': True, 'pattern': 'sql_injection', 'type': 'injection'}

        # Check for XSS
        if re.search(r"<script|javascript:|onerror=|onload=", full_url, re.I):
            return {'is_scan': True, 'pattern': 'xss', 'type': 'injection'}

        return {'is_scan': False, 'pattern': None, 'type': None}

    def _is_auth_attempt(self, request: http.Request) -> bool:
        """Check if request is authentication attempt"""
        path = request.path.lower()
        return any(auth_path in path for auth_path in AUTH_PATHS)

    def _log_entry(self, entry: dict):
        """Write log entry to files"""
        line = json.dumps(entry)

        # Main access log
        try:
            with open(LOG_FILE, 'a') as f:
                f.write(line + '\n')
        except Exception as e:
            ctx.log.error(f"Failed to write access log: {e}")

        # CrowdSec compatible log (if scan/suspicious)
        if entry.get('scan', {}).get('is_scan') or entry.get('is_auth_attempt'):
            try:
                cs_entry = {
                    'timestamp': entry['timestamp'],
                    'source_ip': entry['client_ip'],
                    'country': entry['country'],
                    'request': f"{entry['method']} {entry['path']}",
                    'user_agent': entry['client'].get('user_agent', ''),
                    'type': entry['scan'].get('type') or ('auth_attempt' if entry['is_auth_attempt'] else 'access'),
                    'pattern': entry['scan'].get('pattern', '')
                }
                with open(CROWDSEC_LOG, 'a') as f:
                    f.write(json.dumps(cs_entry) + '\n')
            except Exception as e:
                ctx.log.error(f"Failed to write CrowdSec log: {e}")

    def _add_alert(self, alert: dict):
        """Add security alert"""
        self.alerts.append(alert)
        # Keep last 100 alerts
        self.alerts = self.alerts[-100:]
        try:
            with open(ALERTS_FILE, 'w') as f:
                json.dump(self.alerts, f)
        except:
            pass

    def _is_cache_refresh(self, request: http.Request) -> bool:
        """Check if request should bypass cache for refresh"""
        # Cache-Control: no-cache or max-age=0
        cache_control = request.headers.get('cache-control', '').lower()
        if 'no-cache' in cache_control or 'max-age=0' in cache_control:
            return True

        # Pragma: no-cache
        if request.headers.get('pragma', '').lower() == 'no-cache':
            return True

        # Custom header for forced refresh
        if request.headers.get('x-secubox-refresh', '') == '1':
            return True

        # If-None-Match or If-Modified-Since (conditional refresh)
        if request.headers.get('if-none-match') or request.headers.get('if-modified-since'):
            return True

        return False

    def _should_proxy_internal(self, request: http.Request, source_ip: str) -> dict:
        """Determine if request stays internal (proxied) or goes direct"""
        is_refresh = self._is_cache_refresh(request)
        is_internal = source_ip.startswith(('10.', '172.16.', '192.168.', '127.'))

        # Internal requests always proxied unless refresh
        if is_internal:
            return {'proxied': not is_refresh, 'reason': 'internal', 'direct': is_refresh}

        # External requests: proxied through cache, refresh goes direct
        return {
            'proxied': not is_refresh,
            'reason': 'cache_refresh' if is_refresh else 'external_cached',
            'direct': is_refresh
        }

    def request(self, flow: http.HTTPFlow):
        """Process incoming request"""
        request = flow.request
        client_ip = flow.client_conn.peername[0] if flow.client_conn.peername else 'unknown'

        # Get forwarded IP if behind proxy
        forwarded_ip = request.headers.get('x-forwarded-for', '').split(',')[0].strip()
        real_ip = request.headers.get('x-real-ip', '')
        source_ip = forwarded_ip or real_ip or client_ip

        # Determine routing (proxied vs direct)
        routing = self._should_proxy_internal(request, source_ip)

        # Build log entry
        entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'ts': int(time.time()),
            'client_ip': source_ip,
            'proxy_ip': client_ip,
            'country': self._get_country(source_ip),
            'method': request.method,
            'host': request.host,
            'path': request.path,
            'query': request.query.get('q', '')[:100] if request.query else '',
            'client': self._get_client_fingerprint(request),
            'scan': self._detect_scan(request),
            'is_auth_attempt': self._is_auth_attempt(request),
            'content_length': len(request.content) if request.content else 0,
            'routing': routing,
            'headers': {
                'referer': request.headers.get('referer', '')[:200],
                'origin': request.headers.get('origin', ''),
                'cache_control': request.headers.get('cache-control', ''),
            }
        }

        # Add routing header for downstream (HAProxy/Squid)
        if routing['direct']:
            request.headers['x-secubox-direct'] = '1'
            request.headers['cache-control'] = 'no-cache, no-store'
        else:
            request.headers['x-secubox-proxied'] = '1'

        # Store for response processing
        flow.metadata['secubox_entry'] = entry

        # Log scan attempts immediately
        if entry['scan']['is_scan']:
            ctx.log.warn(f"SCAN DETECTED: {source_ip} ({entry['country']}) - {entry['scan']['pattern']} - {request.path}")
            self._add_alert({
                'time': entry['timestamp'],
                'ip': source_ip,
                'country': entry['country'],
                'type': 'scan',
                'pattern': entry['scan']['pattern'],
                'path': request.path
            })

        # Log auth attempts
        if entry['is_auth_attempt']:
            ctx.log.info(f"AUTH ATTEMPT: {source_ip} ({entry['country']}) - {request.method} {request.path}")

    def response(self, flow: http.HTTPFlow):
        """Process response to complete log entry"""
        entry = flow.metadata.get('secubox_entry', {})
        if not entry:
            return

        response = flow.response

        # CDN Cache detection
        cache_status = response.headers.get('x-cache', '') or response.headers.get('x-cache-status', '')
        cache_hit = 'HIT' in cache_status.upper() if cache_status else None
        cdn_cache = response.headers.get('x-cdn-cache', '')
        squid_cache = response.headers.get('x-squid-cache', '')

        entry['response'] = {
            'status': response.status_code,
            'content_length': len(response.content) if response.content else 0,
            'content_type': response.headers.get('content-type', '')[:50]
        }

        # CDN/Cache info
        entry['cache'] = {
            'status': cache_status,
            'hit': cache_hit,
            'cdn': cdn_cache,
            'squid': squid_cache,
            'age': response.headers.get('age', ''),
            'cache_control': response.headers.get('cache-control', '')[:100],
            'etag': response.headers.get('etag', '')[:50],
            'via': response.headers.get('via', '')[:100]
        }

        # Calculate response time
        entry['response_time_ms'] = int((time.time() - entry['ts']) * 1000)

        # Log cache stats
        if cache_hit is not None:
            ctx.log.debug(f"CACHE {'HIT' if cache_hit else 'MISS'}: {entry['path']} ({entry['response_time_ms']}ms)")

        # Log failed auth attempts (4xx on auth paths)
        if entry['is_auth_attempt'] and 400 <= response.status_code < 500:
            ctx.log.warn(f"AUTH FAILED: {entry['client_ip']} ({entry['country']}) - {response.status_code}")
            self._add_alert({
                'time': entry['timestamp'],
                'ip': entry['client_ip'],
                'country': entry['country'],
                'type': 'auth_failed',
                'status': response.status_code,
                'path': entry['path']
            })

        self._log_entry(entry)


addons = [SecuBoxAnalytics()]
