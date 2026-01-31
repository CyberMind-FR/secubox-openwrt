#!/usr/bin/env python3
"""
SecuBox Analytics Addon for mitmproxy
Advanced threat detection with comprehensive pattern matching
Logs external access attempts with IP, country, user agent, auth attempts, scan detection
Feeds data to CrowdSec for threat detection and blocking
"""

import json
import time
import re
import hashlib
import os
from datetime import datetime
from collections import defaultdict
from mitmproxy import http, ctx
from pathlib import Path

# GeoIP database path (MaxMind GeoLite2)
GEOIP_DB = "/srv/mitmproxy/GeoLite2-Country.mmdb"
LOG_FILE = "/var/log/secubox-access.log"
CROWDSEC_LOG = "/var/log/crowdsec/secubox-mitm.log"
ALERTS_FILE = "/tmp/secubox-mitm-alerts.json"
STATS_FILE = "/tmp/secubox-mitm-stats.json"

# ============================================================================
# THREAT DETECTION PATTERNS
# ============================================================================

# Path-based scan patterns (config files, admin panels, sensitive paths)
PATH_SCAN_PATTERNS = [
    # Configuration files
    r'/\.env', r'/\.git', r'/\.svn', r'/\.hg', r'/\.htaccess', r'/\.htpasswd',
    r'/\.aws', r'/\.ssh', r'/\.bash_history', r'/\.bashrc', r'/\.profile',
    r'/config\.php', r'/config\.yml', r'/config\.json', r'/settings\.py',
    r'/application\.properties', r'/database\.yml', r'/secrets\.yml',
    r'/web\.config', r'/appsettings\.json', r'/\.dockerenv', r'/Dockerfile',
    r'/docker-compose\.yml', r'/\.kube/config', r'/\.kubernetes',

    # Backup files
    r'/backup', r'\.bak$', r'\.old$', r'\.orig$', r'\.save$', r'\.swp$',
    r'/db\.sql', r'\.sql\.gz$', r'/dump\.sql', r'/database\.sql',
    r'\.tar\.gz$', r'\.zip$', r'\.rar$',

    # Admin panels
    r'/wp-admin', r'/wp-login', r'/wp-includes', r'/wp-content',
    r'/phpmyadmin', r'/pma', r'/adminer', r'/mysql', r'/myadmin',
    r'/admin', r'/administrator', r'/manager', r'/cpanel', r'/webmail',
    r'/cgi-bin', r'/fcgi-bin', r'/server-status', r'/server-info',

    # Web shells / backdoors
    r'/shell', r'/cmd', r'/c99', r'/r57', r'/b374k', r'/weevely',
    r'/webshell', r'/backdoor', r'/hack', r'/pwn', r'/exploit',
    r'\.php\d?$.*\?', r'/upload\.php', r'/file\.php', r'/image\.php',

    # Sensitive system paths
    r'/etc/passwd', r'/etc/shadow', r'/etc/hosts', r'/etc/issue',
    r'/proc/self', r'/proc/version', r'/proc/cmdline',
    r'/var/log', r'/var/www', r'/tmp/', r'/dev/null',
    r'/windows/system32', r'/boot\.ini', r'/win\.ini',
]

# SQL Injection patterns
SQL_INJECTION_PATTERNS = [
    # Classic SQL injection
    r"['\"](\s*|\+)or(\s*|\+)['\"]?\d", r"['\"](\s*|\+)or(\s*|\+)['\"]?['\"]",
    r"['\"](\s*|\+)and(\s*|\+)['\"]?\d", r"union(\s+|\+)select",
    r"union(\s+|\+)all(\s+|\+)select", r"select(\s+|\+).+(\s+|\+)from",
    r"insert(\s+|\+)into", r"update(\s+|\+).+(\s+|\+)set",
    r"delete(\s+|\+)from", r"drop(\s+|\+)(table|database|index)",
    r"truncate(\s+|\+)table", r"alter(\s+|\+)table",
    r"exec(\s*|\+)\(", r"execute(\s*|\+)\(",

    # Blind SQL injection
    r"sleep\s*\(\s*\d+\s*\)", r"benchmark\s*\(", r"waitfor\s+delay",
    r"pg_sleep", r"dbms_pipe\.receive_message",

    # Error-based SQL injection
    r"extractvalue\s*\(", r"updatexml\s*\(", r"exp\s*\(~",
    r"geometrycollection\s*\(", r"multipoint\s*\(",

    # MSSQL specific
    r"xp_cmdshell", r"sp_executesql", r"openrowset", r"opendatasource",

    # Comment injection
    r"/\*.*\*/", r"--\s*$", r"#\s*$", r";\s*--",

    # Hex/char encoding
    r"0x[0-9a-fA-F]+", r"char\s*\(\s*\d+", r"concat\s*\(",
]

# XSS (Cross-Site Scripting) patterns
XSS_PATTERNS = [
    r"<script", r"</script>", r"javascript:", r"vbscript:",
    r"onerror\s*=", r"onload\s*=", r"onclick\s*=", r"onmouseover\s*=",
    r"onfocus\s*=", r"onblur\s*=", r"onsubmit\s*=", r"onchange\s*=",
    r"oninput\s*=", r"onkeyup\s*=", r"onkeydown\s*=", r"onkeypress\s*=",
    r"<img[^>]+src\s*=", r"<iframe", r"<object", r"<embed", r"<svg",
    r"<body[^>]+onload", r"<input[^>]+onfocus", r"expression\s*\(",
    r"url\s*\(\s*['\"]?javascript:", r"<link[^>]+href\s*=\s*['\"]?javascript:",
    r"document\.cookie", r"document\.location", r"document\.write",
    r"window\.location", r"eval\s*\(", r"settimeout\s*\(",
    r"setinterval\s*\(", r"new\s+function\s*\(",
]

# Command Injection patterns
CMD_INJECTION_PATTERNS = [
    r";\s*cat\s", r";\s*ls\s", r";\s*id\s*;?", r";\s*whoami",
    r";\s*uname", r";\s*pwd\s*;?", r";\s*wget\s", r";\s*curl\s",
    r"\|\s*cat\s", r"\|\s*ls\s", r"\|\s*id\s", r"\|\s*whoami",
    r"`[^`]+`", r"\$\([^)]+\)", r"\$\{[^}]+\}",
    r"&&\s*(cat|ls|id|whoami|uname|pwd|wget|curl)",
    r"\|\|\s*(cat|ls|id|whoami|uname|pwd)",
    r"/bin/(sh|bash|dash|zsh|ksh|csh)", r"/usr/bin/(perl|python|ruby|php)",
    r"nc\s+-[elp]", r"netcat", r"ncat", r"/dev/(tcp|udp)/",
    r"bash\s+-i", r"python\s+-c", r"perl\s+-e", r"ruby\s+-e",
]

# Path Traversal patterns
PATH_TRAVERSAL_PATTERNS = [
    r"\.\./", r"\.\.\\", r"\.\./\.\./", r"\.\.\\\.\.\\",
    r"%2e%2e/", r"%2e%2e%2f", r"\.%2e/", r"%2e\./",
    r"\.\.%5c", r"%252e%252e", r"..;/", r"..;\\",
    r"\.\.%c0%af", r"\.\.%c1%9c", r"%c0%ae%c0%ae",
    r"file://", r"file:///",
]

# SSRF (Server-Side Request Forgery) patterns
SSRF_PATTERNS = [
    r"(url|uri|path|src|href|redirect|target|link|fetch|load)\s*=\s*['\"]?https?://",
    r"(url|uri|path|src|href|redirect|target|link|fetch|load)\s*=\s*['\"]?file://",
    r"(url|uri|path|src|href|redirect|target|link|fetch|load)\s*=\s*['\"]?ftp://",
    r"(url|uri|path|src|href|redirect|target|link|fetch|load)\s*=\s*['\"]?gopher://",
    r"(url|uri|path|src|href|redirect|target|link|fetch|load)\s*=\s*['\"]?dict://",
    r"127\.0\.0\.1", r"localhost", r"0\.0\.0\.0", r"\[::1\]",
    r"169\.254\.\d+\.\d+", r"10\.\d+\.\d+\.\d+", r"172\.(1[6-9]|2\d|3[01])\.",
    r"192\.168\.\d+\.\d+", r"metadata\.google", r"instance-data",
]

# XXE (XML External Entity) patterns
XXE_PATTERNS = [
    r"<!DOCTYPE[^>]+\[", r"<!ENTITY", r"SYSTEM\s+['\"]",
    r"file://", r"expect://", r"php://", r"data://",
    r"<!DOCTYPE\s+\w+\s+PUBLIC", r"<!DOCTYPE\s+\w+\s+SYSTEM",
]

# LDAP Injection patterns
LDAP_INJECTION_PATTERNS = [
    r"\)\(\|", r"\)\(&", r"\*\)", r"\)\)", r"\(\|", r"\(&",
    r"[\*\(\)\\\x00]", r"objectclass=\*", r"cn=\*", r"uid=\*",
]

# Log4j / JNDI Injection patterns
LOG4J_PATTERNS = [
    r"\$\{jndi:", r"\$\{lower:", r"\$\{upper:", r"\$\{env:",
    r"\$\{sys:", r"\$\{java:", r"\$\{base64:",
    r"ldap://", r"ldaps://", r"rmi://", r"dns://", r"iiop://",
]

AUTH_PATHS = [
    '/login', '/signin', '/auth', '/api/auth', '/oauth', '/token',
    '/session', '/cgi-bin/luci', '/admin', '/authenticate',
    '/api/login', '/api/signin', '/api/token', '/api/session',
    '/user/login', '/account/login', '/wp-login.php',
    '/j_security_check', '/j_spring_security_check',
    '/.well-known/openid-configuration', '/oauth2/authorize',
]

# Bot and scanner signatures
BOT_SIGNATURES = [
    # Generic bots
    'bot', 'crawler', 'spider', 'scraper', 'scan',
    # HTTP clients
    'curl', 'wget', 'python-requests', 'python-urllib', 'httpx',
    'go-http-client', 'java/', 'axios', 'node-fetch', 'got/',
    'okhttp', 'apache-httpclient', 'guzzlehttp', 'libwww-perl',
    # Security scanners
    'zgrab', 'masscan', 'nmap', 'nikto', 'nuclei', 'sqlmap',
    'dirb', 'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'feroxbuster',
    'burpsuite', 'owasp', 'acunetix', 'nessus', 'qualys', 'openvas',
    'w3af', 'arachni', 'skipfish', 'vega', 'zap', 'appscan',
    'webinspect', 'metasploit', 'hydra', 'medusa',
    # Known bad bots
    'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'blexbot',
    'seznambot', 'yandexbot', 'baiduspider', 'sogou',
    # Empty or suspicious UAs
    '-', '', 'mozilla/4.0', 'mozilla/5.0',
]

# Suspicious headers indicating attack tools
SUSPICIOUS_HEADERS = {
    'x-forwarded-for': [r'\d+\.\d+\.\d+\.\d+.*,.*,.*,'],  # Multiple proxies
    'x-originating-ip': [r'.+'],  # Often used by attackers
    'x-remote-ip': [r'.+'],
    'x-remote-addr': [r'.+'],
    'client-ip': [r'.+'],
    'true-client-ip': [r'.+'],
    'x-cluster-client-ip': [r'.+'],
    'x-client-ip': [r'.+'],
    'forwarded': [r'for=.+;.+;.+'],  # Multiple forwards
}

# Known vulnerability paths (CVE-specific)
CVE_PATTERNS = {
    # CVE-2021-44228 (Log4Shell)
    'log4shell': [r'\$\{jndi:', r'\$\{env:', r'\$\{lower:', r'\$\{upper:'],
    # CVE-2021-41773 / CVE-2021-42013 (Apache path traversal)
    'apache_traversal': [r'\.%2e/', r'%2e\./', r'\.\.%00', r'cgi-bin/\.%2e/'],
    # CVE-2022-22963 (Spring Cloud Function)
    'spring_cloud': [r'spring\.cloud\.function\.routing-expression:'],
    # CVE-2022-22965 (Spring4Shell)
    'spring4shell': [r'class\.module\.classLoader'],
    # CVE-2023-34362 (MOVEit)
    'moveit': [r'machine2\.aspx.*\?', r'/guestaccess\.aspx'],
    # CVE-2024-3400 (PAN-OS)
    'panos': [r'/global-protect/.*\.css\?'],
}

class SecuBoxAnalytics:
    def __init__(self):
        self.geoip = None
        self.alerts = []
        self.stats = defaultdict(lambda: defaultdict(int))
        self.ip_request_count = defaultdict(list)  # For rate limiting
        self.blocked_ips = set()
        self._load_geoip()
        self._load_blocked_ips()
        ctx.log.info("SecuBox Analytics addon v2.0 loaded - Enhanced threat detection")

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

    def _load_blocked_ips(self):
        """Load blocked IPs from CrowdSec decisions"""
        try:
            # Read CrowdSec local API decisions
            decisions_file = "/var/lib/crowdsec/data/crowdsec.db"
            if os.path.exists(decisions_file):
                # Just track that file exists - actual blocking via CrowdSec bouncer
                ctx.log.info("CrowdSec decisions database found")
        except Exception as e:
            ctx.log.debug(f"Could not load blocked IPs: {e}")

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
        """Comprehensive threat detection with categorized patterns"""
        path = request.path.lower()
        full_url = request.pretty_url.lower()
        query = request.query
        body = request.content.decode('utf-8', errors='ignore').lower() if request.content else ''

        # Build combined search string
        search_targets = [path, full_url, body]
        if query:
            search_targets.extend([str(v) for v in query.values()])

        combined = ' '.join(search_targets)
        threats = []

        # Check path-based scans
        for pattern in PATH_SCAN_PATTERNS:
            if re.search(pattern, path, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': pattern, 'type': 'path_scan',
                    'severity': 'medium', 'category': 'reconnaissance'
                }

        # Check SQL Injection
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'sql_injection', 'type': 'injection',
                    'severity': 'critical', 'category': 'injection',
                    'matched_pattern': pattern[:50]
                }

        # Check XSS
        for pattern in XSS_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'xss', 'type': 'injection',
                    'severity': 'high', 'category': 'injection',
                    'matched_pattern': pattern[:50]
                }

        # Check Command Injection
        for pattern in CMD_INJECTION_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'command_injection', 'type': 'injection',
                    'severity': 'critical', 'category': 'injection',
                    'matched_pattern': pattern[:50]
                }

        # Check Path Traversal
        for pattern in PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'path_traversal', 'type': 'traversal',
                    'severity': 'high', 'category': 'file_access'
                }

        # Check SSRF
        for pattern in SSRF_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'ssrf', 'type': 'ssrf',
                    'severity': 'high', 'category': 'server_side'
                }

        # Check XXE (in body/headers for XML)
        content_type = request.headers.get('content-type', '').lower()
        if 'xml' in content_type or body.startswith('<?xml'):
            for pattern in XXE_PATTERNS:
                if re.search(pattern, body, re.IGNORECASE):
                    return {
                        'is_scan': True, 'pattern': 'xxe', 'type': 'injection',
                        'severity': 'critical', 'category': 'xml_attack'
                    }

        # Check LDAP Injection
        for pattern in LDAP_INJECTION_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'ldap_injection', 'type': 'injection',
                    'severity': 'high', 'category': 'injection'
                }

        # Check Log4j/JNDI Injection
        for pattern in LOG4J_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'log4shell', 'type': 'injection',
                    'severity': 'critical', 'category': 'rce',
                    'cve': 'CVE-2021-44228'
                }

        # Check known CVE patterns
        for cve_name, patterns in CVE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, combined, re.IGNORECASE):
                    return {
                        'is_scan': True, 'pattern': cve_name, 'type': 'cve_exploit',
                        'severity': 'critical', 'category': 'known_exploit',
                        'cve': cve_name
                    }

        return {'is_scan': False, 'pattern': None, 'type': None, 'severity': None, 'category': None}

    def _detect_suspicious_headers(self, request: http.Request) -> list:
        """Detect suspicious headers that may indicate attack tools"""
        suspicious = []
        for header, patterns in SUSPICIOUS_HEADERS.items():
            value = request.headers.get(header, '')
            if value:
                for pattern in patterns:
                    if re.search(pattern, value, re.IGNORECASE):
                        suspicious.append({
                            'header': header,
                            'value': value[:100],
                            'pattern': pattern
                        })
        return suspicious

    def _check_rate_limit(self, ip: str, window_seconds: int = 60, max_requests: int = 100) -> dict:
        """Check if IP is exceeding rate limits"""
        now = time.time()
        # Clean old entries
        self.ip_request_count[ip] = [ts for ts in self.ip_request_count[ip] if now - ts < window_seconds]
        self.ip_request_count[ip].append(now)

        count = len(self.ip_request_count[ip])
        is_limited = count > max_requests

        if is_limited:
            return {
                'is_limited': True,
                'count': count,
                'window': window_seconds,
                'threshold': max_requests
            }
        return {'is_limited': False, 'count': count}

    def _update_stats(self, entry: dict):
        """Update real-time statistics"""
        country = entry.get('country', 'XX')
        scan_type = entry.get('scan', {}).get('type')
        category = entry.get('scan', {}).get('category')

        self.stats['countries'][country] += 1
        self.stats['total']['requests'] += 1

        if entry.get('client', {}).get('is_bot'):
            self.stats['total']['bots'] += 1

        if scan_type:
            self.stats['threats'][scan_type] += 1
            self.stats['total']['threats'] += 1

        if category:
            self.stats['categories'][category] += 1

        if entry.get('is_auth_attempt'):
            self.stats['total']['auth_attempts'] += 1

        # Write stats periodically (every 100 requests)
        if self.stats['total']['requests'] % 100 == 0:
            try:
                with open(STATS_FILE, 'w') as f:
                    json.dump(dict(self.stats), f)
            except:
                pass

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

        # CrowdSec compatible log (enhanced format)
        scan_data = entry.get('scan', {})
        if scan_data.get('is_scan') or entry.get('is_auth_attempt') or entry.get('suspicious_headers') or entry.get('rate_limit', {}).get('is_limited'):
            try:
                cs_entry = {
                    'timestamp': entry['timestamp'],
                    'source_ip': entry['client_ip'],
                    'country': entry['country'],
                    'request': f"{entry['method']} {entry['path']}",
                    'host': entry.get('host', ''),
                    'user_agent': entry['client'].get('user_agent', ''),
                    'type': scan_data.get('type') or ('auth_attempt' if entry['is_auth_attempt'] else 'suspicious'),
                    'pattern': scan_data.get('pattern', ''),
                    'category': scan_data.get('category', ''),
                    'severity': scan_data.get('severity', 'low'),
                    'cve': scan_data.get('cve', ''),
                    'response_code': entry.get('response', {}).get('status', 0),
                    'fingerprint': entry['client'].get('fingerprint', ''),
                    'is_bot': entry['client'].get('is_bot', False),
                    'rate_limited': entry.get('rate_limit', {}).get('is_limited', False),
                    'suspicious_headers': len(entry.get('suspicious_headers', [])) > 0,
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
        """Process incoming request with enhanced threat detection"""
        request = flow.request
        client_ip = flow.client_conn.peername[0] if flow.client_conn.peername else 'unknown'

        # Get forwarded IP if behind proxy
        forwarded_ip = request.headers.get('x-forwarded-for', '').split(',')[0].strip()
        real_ip = request.headers.get('x-real-ip', '')
        source_ip = forwarded_ip or real_ip or client_ip

        # Determine routing (proxied vs direct)
        routing = self._should_proxy_internal(request, source_ip)

        # Enhanced threat detection
        scan_result = self._detect_scan(request)
        suspicious_headers = self._detect_suspicious_headers(request)
        rate_limit = self._check_rate_limit(source_ip)
        client_fp = self._get_client_fingerprint(request)

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
            'client': client_fp,
            'scan': scan_result,
            'is_auth_attempt': self._is_auth_attempt(request),
            'content_length': len(request.content) if request.content else 0,
            'routing': routing,
            'suspicious_headers': suspicious_headers,
            'rate_limit': rate_limit,
            'headers': {
                'referer': request.headers.get('referer', '')[:200],
                'origin': request.headers.get('origin', ''),
                'cache_control': request.headers.get('cache-control', ''),
                'content_type': request.headers.get('content-type', '')[:100],
            }
        }

        # Add routing header for downstream (HAProxy/Squid)
        if routing['direct']:
            request.headers['x-secubox-direct'] = '1'
            request.headers['cache-control'] = 'no-cache, no-store'
        else:
            request.headers['x-secubox-proxied'] = '1'

        # Add threat indicator headers for downstream processing
        if scan_result.get('is_scan'):
            request.headers['x-secubox-threat'] = scan_result.get('category', 'unknown')
            request.headers['x-secubox-severity'] = scan_result.get('severity', 'medium')

        # Store for response processing
        flow.metadata['secubox_entry'] = entry

        # Update statistics
        self._update_stats(entry)

        # Log and alert based on severity
        if scan_result.get('is_scan'):
            severity = scan_result.get('severity', 'medium')
            pattern = scan_result.get('pattern', 'unknown')
            category = scan_result.get('category', 'unknown')
            cve = scan_result.get('cve', '')

            log_msg = f"THREAT [{severity.upper()}]: {source_ip} ({entry['country']}) - {pattern}"
            if cve:
                log_msg += f" ({cve})"
            log_msg += f" - {request.method} {request.path}"

            if severity == 'critical':
                ctx.log.error(log_msg)
            elif severity == 'high':
                ctx.log.warn(log_msg)
            else:
                ctx.log.info(log_msg)

            self._add_alert({
                'time': entry['timestamp'],
                'ip': source_ip,
                'country': entry['country'],
                'type': 'threat',
                'pattern': pattern,
                'category': category,
                'severity': severity,
                'cve': cve,
                'path': request.path,
                'method': request.method,
                'host': request.host
            })

        # Log suspicious headers
        if suspicious_headers:
            ctx.log.warn(f"SUSPICIOUS HEADERS: {source_ip} - {[h['header'] for h in suspicious_headers]}")
            self._add_alert({
                'time': entry['timestamp'],
                'ip': source_ip,
                'country': entry['country'],
                'type': 'suspicious_headers',
                'headers': suspicious_headers
            })

        # Log rate limit violations
        if rate_limit.get('is_limited'):
            ctx.log.warn(f"RATE LIMIT: {source_ip} ({entry['country']}) - {rate_limit['count']} requests")
            self._add_alert({
                'time': entry['timestamp'],
                'ip': source_ip,
                'country': entry['country'],
                'type': 'rate_limit',
                'count': rate_limit['count']
            })

        # Log auth attempts
        if entry['is_auth_attempt']:
            ctx.log.info(f"AUTH ATTEMPT: {source_ip} ({entry['country']}) - {request.method} {request.path}")

        # Log bot detection
        if client_fp.get('is_bot'):
            ctx.log.info(f"BOT DETECTED: {source_ip} - {client_fp.get('user_agent', '')[:80]}")

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
