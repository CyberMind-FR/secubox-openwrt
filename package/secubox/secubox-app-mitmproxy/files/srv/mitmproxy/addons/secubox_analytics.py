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

# Bot whitelist for legitimate crawlers
WHITELISTED_BOTS = ["googlebot", "bingbot", "yandexbot", "facebookexternalhit", "meta-externalagent", "twitterbot", "linkedinbot", "slackbot", "applebot"]

def is_whitelisted_bot(ua):
    ua_lower = (ua or "").lower()
    return any(bot in ua_lower for bot in WHITELISTED_BOTS)

# GeoIP database path (MaxMind GeoLite2)
GEOIP_DB = "/data/GeoLite2-Country.mmdb"
LOG_FILE = "/var/log/secubox-access.log"
# CrowdSec log - uses /data which is bind-mounted to /srv/mitmproxy on host
# This allows CrowdSec on the host to read threat logs from the container
CROWDSEC_LOG = "/data/threats.log"
ALERTS_FILE = "/tmp/secubox-mitm-alerts.json"
STATS_FILE = "/tmp/secubox-mitm-stats.json"
# Auto-ban request file - host script watches this to trigger CrowdSec bans
AUTOBAN_FILE = "/data/autoban-requests.log"
# Auto-ban config file (written by host from UCI)
AUTOBAN_CONFIG = "/data/autoban.json"

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
    # HTTP clients (often used by scanners)
    'curl', 'wget', 'python-requests', 'python-urllib', 'httpx',
    'go-http-client', 'java/', 'axios', 'node-fetch', 'got/',
    'okhttp', 'apache-httpclient', 'guzzlehttp', 'libwww-perl',

    # ==== VULNERABILITY SCANNERS ====
    'zgrab', 'masscan', 'nmap', 'nikto', 'nuclei', 'sqlmap',
    'censys', 'shodan', 'internetmeasurement', 'binaryedge', 'leakix',
    'onyphe', 'criminalip', 'netcraft', 'greynoise',

    # ==== WEB DIRECTORY SCANNERS ====
    'dirb', 'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'feroxbuster',
    'skipfish', 'whatweb', 'wpscan', 'joomscan', 'droopescan',
    'drupwn', 'cmsmap', 'vbscan',

    # ==== EXPLOITATION TOOLS ====
    'burpsuite', 'owasp', 'acunetix', 'nessus', 'qualys', 'openvas',
    'w3af', 'arachni', 'vega', 'zap', 'appscan',
    'webinspect', 'metasploit', 'hydra', 'medusa', 'cobalt',
    'havij', 'commix', 'tplmap', 'xsstrike', 'dalfox',

    # ==== GENERIC SUSPICIOUS PATTERNS ====
    'scanner', 'exploit', 'attack', 'hack', 'pwn',
    'fuzz', 'brute', 'inject', 'payload', 'pentest',

    # ==== KNOWN BAD BOTS ====
    'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'blexbot',
    'seznambot', 'yandexbot', 'baiduspider', 'sogou',
    'bytespider', 'petalbot', 'dataforseo', 'serpstatbot',

    # ==== EMPTY/SUSPICIOUS USER AGENTS ====
    '-', '', 'mozilla/4.0', 'mozilla/5.0',
]

# Behavioral patterns for bot detection (request path based)
BOT_BEHAVIOR_PATHS = [
    # Credential/config file hunting
    r'/\.git/config', r'/\.git/HEAD', r'/\.gitignore',
    r'/\.env', r'/\.env\.local', r'/\.env\.production',
    r'/\.aws/credentials', r'/\.docker/config\.json',
    r'/wp-config\.php\.bak', r'/config\.php\.old', r'/config\.php\.save',
    r'/\.npmrc', r'/\.pypirc', r'/\.netrc',

    # Admin panel hunting
    r'/administrator', r'/wp-login\.php', r'/wp-admin',
    r'/phpmyadmin', r'/pma', r'/myadmin', r'/mysql',
    r'/cpanel', r'/webmail', r'/admin', r'/manager',
    r'/login', r'/signin', r'/dashboard',

    # Backup file hunting
    r'\.sql\.gz$', r'\.sql\.bz2$', r'\.sql\.zip$',
    r'\.tar\.gz$', r'\.tar\.bz2$', r'\.zip$', r'\.rar$',
    r'\.bak$', r'\.old$', r'\.backup$', r'\.orig$',
    r'/backup', r'/dump', r'/export', r'/db\.sql',

    # Shell/webshell hunting
    r'/c99\.php', r'/r57\.php', r'/shell\.php', r'/cmd\.php',
    r'/exec\.php', r'/webshell', r'/backdoor', r'/b374k',
    r'\.php\?cmd=', r'\.php\?c=', r'\.asp\?cmd=',

    # API/endpoint discovery
    r'/api/v\d+', r'/rest/', r'/graphql', r'/swagger',
    r'/api-docs', r'/_cat/', r'/_cluster/', r'/actuator',
    r'/__debug__', r'/debug/', r'/trace/', r'/metrics',
]

# Rate limiting thresholds for different attack patterns
RATE_LIMITS = {
    'path_scan': {'window': 60, 'max': 20},      # 20 scans per minute
    'auth_attempt': {'window': 60, 'max': 10},   # 10 auth attempts per minute
    'bot_request': {'window': 60, 'max': 30},    # 30 bot requests per minute
    'normal': {'window': 60, 'max': 100},        # 100 normal requests per minute
}

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

# Template Injection (SSTI) patterns
SSTI_PATTERNS = [
    r'\{\{.*\}\}',  # Jinja2/Twig
    r'\$\{.*\}',    # FreeMarker/Velocity
    r'<%.*%>',      # ERB/JSP
    r'#\{.*\}',     # Thymeleaf
    r'\[\[.*\]\]',  # Smarty
]

# Prototype Pollution patterns
PROTO_POLLUTION_PATTERNS = [
    r'__proto__', r'constructor\[', r'prototype\[',
    r'\["__proto__"\]', r'\["constructor"\]', r'\["prototype"\]',
]

# GraphQL abuse patterns
GRAPHQL_ABUSE_PATTERNS = [
    r'__schema', r'__type', r'introspectionQuery',
    r'query\s*\{.*\{.*\{.*\{.*\{',  # Deep nesting
    r'fragment.*on.*\{.*fragment',  # Recursive fragments
]

# JWT/Token patterns
JWT_PATTERNS = [
    r'eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*',  # JWT format
    r'alg.*none',  # Algorithm none attack
    r'"alg"\s*:\s*"none"',
]

# HTTP Request Smuggling patterns
HTTP_SMUGGLING_PATTERNS = [
    r'transfer-encoding:\s*chunked.*content-length:',  # TE.CL conflict
    r'content-length:.*transfer-encoding:\s*chunked',  # CL.TE conflict
    r'transfer-encoding:\s*.*,\s*chunked',  # TE obfuscation
    r'transfer-encoding:\s*chunked\s*,',
    r'\x00.*content-length:',  # Null byte smuggling
    r'0\r\n\r\n',  # Chunked terminator in body
]

# AI/LLM Prompt Injection patterns (emerging threat 2024-2025)
PROMPT_INJECTION_PATTERNS = [
    r'ignore\s+(previous|all|above)\s+instructions?',
    r'disregard\s+(previous|all|above)\s+instructions?',
    r'forget\s+(previous|all|above)\s+instructions?',
    r'new\s+instructions?:',
    r'system\s*prompt:',
    r'<\|im_start\|>',  # ChatML injection
    r'\[INST\]',  # Llama instruction markers
    r'<\|endoftext\|>',  # GPT special tokens
    r'###\s*(Instruction|System|Human|Assistant):',
    r'roleplay\s+as\s+(a\s+)?(?:system|admin|root)',
    r'pretend\s+you\s+are\s+(?:a\s+)?(?:system|admin|root)',
]

# WAF Bypass patterns (2025 techniques)
WAF_BYPASS_PATTERNS = [
    # Unicode normalization attacks
    r'%uff1c',  # Fullwidth <
    r'%uff1e',  # Fullwidth >
    r'%u003c',  # Unicode <
    r'%u003e',  # Unicode >
    r'\xef\xbc\x9c',  # UTF-8 fullwidth <
    r'\xef\xbc\x9e',  # UTF-8 fullwidth >
    # Encoding chains
    r'%25(?:2[0-9a-f]|3[0-9a-f]|4[0-9a-f])',  # Double encoding
    r'%252e%252e',  # Double encoded ..
    # Null byte injection
    r'%00', r'\x00',
    # Case variation bypass
    r'(?:S|s)(?:E|e)(?:L|l)(?:E|e)(?:C|c)(?:T|t)',  # Mixed case SELECT
    # Comment injection
    r'/\*!.*\*/',  # MySQL conditional comments
    r'/\*\+.*\*/',  # Oracle hints
    # HTTP Parameter Pollution
    r'(\?|&)([^=]+)=.*\1\2=',  # Duplicate params
]

# Supply Chain Attack patterns (OWASP A03:2025)
SUPPLY_CHAIN_PATTERNS = [
    # Package manager attacks
    r'npm\s+install.*\|\s*(sh|bash)',
    r'pip\s+install.*--pre',
    r'gem\s+install.*--no-verify',
    # Dependency confusion
    r'@[a-z0-9-]+/[a-z0-9-]+@[0-9]+\.[0-9]+\.[0-9]+-',  # Scoped pre-release
    # CI/CD poisoning
    r'\.github/workflows/.*\.ya?ml',
    r'\.gitlab-ci\.yml',
    r'Jenkinsfile',
    r'\.circleci/config\.yml',
]

# Server-Side Template Injection extended patterns
SSTI_EXTENDED_PATTERNS = [
    # Jinja2/Flask
    r'\{\{\s*config\s*\}\}', r'\{\{\s*self\.__',
    r'\{\{\s*request\s*\}\}', r'__class__.__mro__',
    # Freemarker
    r'<#assign', r'\$\{\.data_model',
    # Velocity
    r'#set\s*\(\s*\$', r'#foreach',
    # Thymeleaf
    r'\[\[\${', r'\$\{T\(java\.lang',
    # Pebble
    r'\{\{\s*beans\s*\}\}',
    # Razor
    r'@\{', r'@Html\.Raw',
]

# API Abuse patterns (expanded)
API_ABUSE_PATTERNS = [
    # Mass assignment
    r'(is_admin|role|admin|privilege|permission)\s*[=:]',
    # BOLA/IDOR
    r'/api/.*/users?/\d+', r'/api/.*/accounts?/\d+',
    r'/v\d+/.*/\d{4,}',  # Sequential IDs
    # Rate limit bypass
    r'x-forwarded-for:.*,.*,',  # Multiple XFF headers
    # Debug endpoints
    r'/debug/', r'/trace/', r'/actuator/', r'/metrics/',
    r'/__debug__/', r'/_profiler/',
]

# Known vulnerability paths (CVE-specific)
# Comprehensive CVE detection patterns for WAF filtering
CVE_PATTERNS = {
    # ============================================================================
    # 2021 CVEs
    # ============================================================================
    # CVE-2021-44228 (Log4Shell) - Apache Log4j RCE
    'CVE-2021-44228': [r'\$\{jndi:', r'\$\{env:', r'\$\{lower:', r'\$\{upper:', r'\$\{base64:'],
    # CVE-2021-41773 / CVE-2021-42013 (Apache path traversal)
    'CVE-2021-41773': [r'\.%2e/', r'%2e\./', r'\.\.%00', r'cgi-bin/\.%2e/', r'/icons/\.%2e/'],
    # CVE-2021-26084 (Confluence OGNL Injection)
    'CVE-2021-26084': [r'/pages/doenterpagevariables\.action', r'queryString=.*ognl'],
    # CVE-2021-34473 (ProxyShell - Exchange)
    'CVE-2021-34473': [r'/autodiscover/autodiscover\.json.*@', r'/mapi/nspi'],
    # CVE-2021-21972 (VMware vCenter RCE)
    'CVE-2021-21972': [r'/ui/vropspluginui/rest/services/uploadova'],
    # CVE-2021-22986 (F5 BIG-IP iControl REST RCE)
    'CVE-2021-22986': [r'/mgmt/tm/util/bash', r'/mgmt/shared/authn/login'],

    # ============================================================================
    # 2022 CVEs
    # ============================================================================
    # CVE-2022-22963 (Spring Cloud Function SpEL Injection)
    'CVE-2022-22963': [r'spring\.cloud\.function\.routing-expression:', r'spring\.cloud\.function\.definition'],
    # CVE-2022-22965 (Spring4Shell)
    'CVE-2022-22965': [r'class\.module\.classLoader', r'class\.module\.classLoader\.resources'],
    # CVE-2022-1388 (F5 BIG-IP Authentication Bypass)
    'CVE-2022-1388': [r'/mgmt/tm/.*\?.*connection.*keep-alive', r'X-F5-Auth-Token:'],
    # CVE-2022-26134 (Confluence OGNL Injection)
    'CVE-2022-26134': [r'/\$\{.*\}/', r'%24%7B.*%7D'],
    # CVE-2022-41040 / CVE-2022-41082 (ProxyNotShell - Exchange)
    'CVE-2022-41040': [r'/autodiscover/autodiscover\.json.*Powershell', r'/owa/.*RemotePS'],
    # CVE-2022-42889 (Apache Commons Text RCE)
    'CVE-2022-42889': [r'\$\{script:', r'\$\{dns:', r'\$\{url:'],
    # CVE-2022-47966 (ManageEngine RCE)
    'CVE-2022-47966': [r'/samlLogin', r'/SamlResponseServlet'],

    # ============================================================================
    # 2023 CVEs
    # ============================================================================
    # CVE-2023-34362 (MOVEit Transfer SQL Injection)
    'CVE-2023-34362': [r'machine2\.aspx', r'/guestaccess\.aspx', r'/human\.aspx'],
    # CVE-2023-22515 (Confluence Privilege Escalation)
    'CVE-2023-22515': [r'/server-info\.action\?bootstrapStatusProvider', r'/setup/setupadministrator\.action'],
    # CVE-2023-22518 (Confluence Authentication Bypass)
    'CVE-2023-22518': [r'/json/setup-restore\.action', r'/json/setup-restore-local\.action'],
    # CVE-2023-46747 (F5 BIG-IP Configuration Utility RCE)
    'CVE-2023-46747': [r'/tmui/login\.jsp.*\;'],
    # CVE-2023-27997 (Fortinet SSL VPN Heap Overflow)
    'CVE-2023-27997': [r'/remote/hostcheck_validate', r'/remote/logincheck'],
    # CVE-2023-20198 (Cisco IOS XE Web UI Command Injection)
    'CVE-2023-20198': [r'/webui/', r'%2F%2e%2e'],
    # CVE-2023-42793 (TeamCity Authentication Bypass)
    'CVE-2023-42793': [r'/app/rest/users/id:\d+/tokens', r'/app/rest/debug/processes'],
    # CVE-2023-4966 (Citrix Bleed)
    'CVE-2023-4966': [r'/oauth/idp/.*\.js', r'/vpn/.*\.xml'],
    # CVE-2023-29357 (SharePoint Privilege Escalation)
    'CVE-2023-29357': [r'/_api/web/siteusers', r'/_vti_bin/client\.svc'],

    # ============================================================================
    # 2024 CVEs
    # ============================================================================
    # CVE-2024-3400 (PAN-OS GlobalProtect Command Injection)
    'CVE-2024-3400': [r'/global-protect/.*\.css\?', r'/ssl-vpn/hipreport\.esp'],
    # CVE-2024-21887 (Ivanti Connect Secure Command Injection)
    'CVE-2024-21887': [r'/api/v1/totp/user-backup-code', r'/api/v1/license/keys-status', r'/dana-na/'],
    # CVE-2024-1709 (ScreenConnect Authentication Bypass)
    'CVE-2024-1709': [r'/SetupWizard\.aspx', r'/SetupWizard\.ashx'],
    # CVE-2024-27198 (TeamCity Authentication Bypass)
    'CVE-2024-27198': [r'/app/rest/users/id:', r'/app/rest/server', r'/res/'],
    # CVE-2024-21762 (Fortinet FortiOS Out-of-Bounds Write)
    'CVE-2024-21762': [r'/webui/.*auth', r'/api/v2/cmdb'],
    # CVE-2024-23897 (Jenkins Arbitrary File Read)
    'CVE-2024-23897': [r'/cli\?remoting=false', r'@/etc/passwd'],
    # CVE-2024-0012 (PAN-OS Management Interface Authentication Bypass)
    'CVE-2024-0012': [r'/php/utils/debug\.php', r'/unauth/'],
    # CVE-2024-9474 (PAN-OS Privilege Escalation)
    'CVE-2024-9474': [r'/php/utils/createRemoteAppwebSession\.php'],
    # CVE-2024-47575 (FortiManager/FortiAnalyzer Unauthenticated RCE)
    'CVE-2024-47575': [r'/jsonrpc', r'FmgAuth'],
    # CVE-2024-20399 (Cisco NX-OS Command Injection)
    'CVE-2024-20399': [r'/api/node/class/', r'/api/node/mo/'],
    # CVE-2024-4577 (PHP-CGI Argument Injection)
    'CVE-2024-4577': [r'\.php\?.*-d.*allow_url_include', r'%AD'],
    # CVE-2024-38856 (Apache OFBiz RCE)
    'CVE-2024-38856': [r'/webtools/control/ProgramExport', r'/webtools/control/SOAPService'],
    # CVE-2024-6387 (OpenSSH RegreSSHion - check headers)
    'CVE-2024-6387': [r'SSH-2\.0-OpenSSH_[89]\.[0-7]'],
    # CVE-2024-23113 (FortiOS Format String)
    'CVE-2024-23113': [r'fgfm_req_', r'fgfmd'],
    # CVE-2024-55591 (FortiOS Authentication Bypass)
    'CVE-2024-55591': [r'/api/v2/authentication', r'LOCAL_ADMIN'],

    # ============================================================================
    # 2025 CVEs (CISA KEV 2025-2026)
    # ============================================================================
    # CVE-2025-15467 (OpenSSL CMS AuthEnvelopedData stack overflow)
    'CVE-2025-15467': [
        r'/smime', r'/s-mime', r'/cms/', r'/pkcs7',
        r'/api/mail', r'/mail/send', r'/email/compose',
        r'/decrypt', r'/verify-signature', r'/enveloped',
    ],
    # CVE-2025-0282 (Ivanti Connect Secure Stack Overflow)
    'CVE-2025-0282': [r'/dana-na/auth/url_default/', r'/dana-ws/saml20\.ws'],
    # CVE-2025-23006 (SonicWall SMA SSRF to RCE)
    'CVE-2025-23006': [r'/cgi-bin/management', r'/cgi-bin/sslvpnclient'],
    # CVE-2025-55182 (React2Shell - React Server Components RCE, CVSS 10.0)
    'CVE-2025-55182': [
        r'__rsc_chunk', r'__rsc', r'_rsc=', r'rsc\?',
        r'x-rsc', r'__react_refresh', r'react-server-dom',
        r'__next_rsc__', r'_next/data/.*\.rsc',
    ],
    # CVE-2025-8110 (Gogs RCE via symlink bypass)
    'CVE-2025-8110': [
        r'/api/v1/repos/.*/git/trees', r'/api/v1/repos/.*/contents',
        r'\.\.%2f', r'\.\.%5c', r'symlink',
    ],
    # CVE-2025-53770 (SharePoint ToolShell RCE)
    'CVE-2025-53770': [
        r'/_layouts/.*toolpart', r'/_vti_bin/webpartpages\.asmx',
        r'/_api/SP\.WebPartBuilder', r'/_api/web/GetFileByServerRelativePath',
    ],
    # CVE-2025-52691 (SmarterMail arbitrary file upload RCE)
    'CVE-2025-52691': [
        r'/interface/web-mail\.aspx', r'/interface/root/upload',
        r'/interface/settings/.*upload', r'/webmail/.*\.ashx.*upload',
    ],
    # CVE-2025-40551 (SolarWinds Web Help Desk deserialization RCE)
    'CVE-2025-40551': [
        r'/helpdesk/', r'/WebHelpDesk/', r'/whd/',
        r'\.doj$', r'java\.io\.ObjectInputStream', r'java\.lang\.Runtime',
    ],
    # CVE-2025-58360 (GeoServer XXE)
    'CVE-2025-58360': [
        r'/geoserver/', r'/wfs\?', r'/wms\?', r'/wcs\?',
        r'GetCapabilities', r'DescribeFeatureType',
    ],
    # CVE-2025-68645 (Zimbra PHP RFI)
    'CVE-2025-68645': [
        r'/zimbraAdmin/', r'/zimlet/', r'/service/soap',
        r'\.php\?.*include', r'\.php\?.*require',
    ],

    # ============================================================================
    # CMS-Specific Vulnerabilities
    # ============================================================================
    # WordPress vulnerabilities
    'wordpress_rce': [
        r'/wp-admin/admin-ajax\.php.*action=.*upload',
        r'/wp-content/plugins/.*/readme\.txt',
        r'/xmlrpc\.php.*methodName.*system\.multicall',
        r'/wp-json/wp/v2/users',
    ],
    # Drupal vulnerabilities (Drupalgeddon)
    'drupal_rce': [
        r'/node/\d+.*#.*render',
        r'/user/register.*mail\[#.*\]',
        r'passthru', r'system\(',
    ],
    # Joomla vulnerabilities
    'joomla_rce': [
        r'/index\.php\?option=com_.*&view=.*&layout=',
        r'/administrator/components/',
    ],

    # ============================================================================
    # Framework-Specific Vulnerabilities
    # ============================================================================
    # Laravel Debug Mode RCE
    'laravel_debug': [r'/_ignition/execute-solution', r'/_ignition/share-report'],
    # Symfony Debug Profiler
    'symfony_debug': [r'/_profiler/', r'/_wdt/'],
    # Django Debug Mode
    'django_debug': [r'/__debug__/', r'/debug/'],
    # Ruby on Rails
    'rails_rce': [r'/assets/\.\./', r'/rails/actions'],
    # Node.js Express
    'express_rce': [r'/\.\./\.\./\.\./etc/passwd'],

    # ============================================================================
    # Database/Cache Vulnerabilities
    # ============================================================================
    # Redis Unauthorized Access
    'redis_unauth': [r':6379/', r'CONFIG\s+SET', r'SLAVEOF'],
    # MongoDB Unauthorized Access
    'mongodb_unauth': [r':27017/', r'/admin\?slaveOk'],
    # Elasticsearch RCE
    'elasticsearch_rce': [r'/_search.*script', r'/_all/_search', r'/_nodes'],
    # Memcached DDoS Amplification
    'memcached_amp': [r':11211/', r'stats\s+slabs'],

    # ============================================================================
    # CI/CD Vulnerabilities
    # ============================================================================
    # GitLab RCE
    'gitlab_rce': [r'/api/v4/projects/.*/repository/files', r'/uploads/'],
    # GitHub Actions Injection
    'github_actions': [r'/\.github/workflows/', r'workflow_dispatch'],
    # Jenkins RCE
    'jenkins_rce': [r'/script', r'/scriptText', r'/descriptorByName/'],

    # ============================================================================
    # Cloud Service Vulnerabilities
    # ============================================================================
    # AWS Metadata SSRF
    'aws_metadata': [r'169\.254\.169\.254', r'/latest/meta-data/', r'/latest/user-data/'],
    # Azure Metadata SSRF
    'azure_metadata': [r'169\.254\.169\.254.*Metadata.*true', r'/metadata/instance'],
    # GCP Metadata SSRF
    'gcp_metadata': [r'metadata\.google\.internal', r'/computeMetadata/v1/'],
}

# Content-Type patterns for CVE-2025-15467 (CMS/S/MIME attacks)
CMS_CONTENT_TYPES = [
    'application/pkcs7-mime',
    'application/pkcs7-signature',
    'application/x-pkcs7-mime',
    'application/x-pkcs7-signature',
    'application/cms',
    'multipart/signed',
]

class SecuBoxAnalytics:
    def __init__(self):
        self.geoip = None
        self.alerts = []
        self.stats = defaultdict(lambda: defaultdict(int))
        self.ip_request_count = defaultdict(list)  # For rate limiting
        self.blocked_ips = set()
        self.autoban_config = {}
        self.autoban_requested = set()  # Track IPs we've already requested to ban
        # Attempt tracking for sensitivity-based auto-ban
        # Structure: {ip: [(timestamp, severity, reason), ...]}
        self.threat_attempts = defaultdict(list)
        self._load_geoip()
        self._load_blocked_ips()
        self._load_autoban_config()
        ctx.log.info("SecuBox Analytics addon v2.2 loaded - Enhanced threat detection with sensitivity-based auto-ban")

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

    def _load_autoban_config(self):
        """Load auto-ban configuration from host"""
        try:
            if os.path.exists(AUTOBAN_CONFIG):
                with open(AUTOBAN_CONFIG, 'r') as f:
                    self.autoban_config = json.load(f)
                    if self.autoban_config.get('enabled'):
                        sensitivity = self.autoban_config.get('sensitivity', 'moderate')
                        ctx.log.info(f"Auto-ban enabled: sensitivity={sensitivity}, min_severity={self.autoban_config.get('min_severity', 'critical')}, duration={self.autoban_config.get('ban_duration', '4h')}")
            else:
                # Default config if file doesn't exist
                self.autoban_config = {
                    'enabled': False,
                    'ban_duration': '4h',
                    'min_severity': 'critical',
                    'ban_cve_exploits': True,
                    'ban_sqli': True,
                    'ban_cmdi': True,
                    'ban_traversal': True,
                    'ban_scanners': True,
                    'ban_rate_limit': False,
                    'whitelist': [],
                    # Sensitivity levels
                    'sensitivity': 'moderate',
                    'moderate_threshold': 3,
                    'moderate_window': 300,
                    'permissive_threshold': 5,
                    'permissive_window': 3600
                }
        except Exception as e:
            ctx.log.warn(f"Could not load auto-ban config: {e}")
            self.autoban_config = {'enabled': False}

    def _clean_old_attempts(self, ip: str, window: int):
        """Remove attempts older than the window for an IP"""
        now = time.time()
        self.threat_attempts[ip] = [
            a for a in self.threat_attempts[ip]
            if now - a[0] < window
        ]

    def _record_attempt(self, ip: str, severity: str, reason: str):
        """Record a threat attempt for an IP"""
        self.threat_attempts[ip].append((time.time(), severity, reason))

    def _check_threshold(self, ip: str, threshold: int, window: int) -> tuple:
        """Check if IP has exceeded attempt threshold within window"""
        self._clean_old_attempts(ip, window)
        attempts = self.threat_attempts[ip]
        if len(attempts) >= threshold:
            reasons = [a[2] for a in attempts[-threshold:]]
            return True, f"Repeated threats ({len(attempts)} in {window}s): {reasons[0]}"
        return False, ''

    def _should_autoban(self, ip: str, scan_result: dict, client_fp: dict, rate_limited: bool) -> tuple:
        """
        Determine if an IP should be auto-banned based on threat detection and sensitivity level.

        Returns: (should_ban: bool, reason: str)

        Sensitivity Levels:
        - aggressive: Ban immediately on first critical threat (CVE, SQLi, CMDi)
        - moderate: Ban after N threats within M minutes (default: 3 in 5 min)
        - permissive: Ban after N threats within M minutes (default: 5 in 1 hour)

        Critical threats (always immediate in aggressive mode):
        - CVE exploits, SQL injection, Command injection, XXE, Log4Shell, SSTI

        Other triggers (follow sensitivity thresholds):
        - XSS, Path traversal, SSRF, LDAP injection
        - Known vulnerability scanners
        - Rate limit exceeded (if enabled)
        """
        if not self.autoban_config.get('enabled'):
            return False, ''

        # Check whitelist
        whitelist = self.autoban_config.get('whitelist', [])
        if isinstance(whitelist, str):
            whitelist = [w.strip() for w in whitelist.split(',') if w.strip()]
        if ip in whitelist:
            return False, ''

        # Skip local IPs
        if ip.startswith(('10.', '172.16.', '172.17.', '172.18.', '172.19.',
                          '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                          '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                          '172.30.', '172.31.', '192.168.', '127.')):
            return False, ''

        # Already requested ban for this IP
        if ip in self.autoban_requested:
            return False, ''

        sensitivity = self.autoban_config.get('sensitivity', 'moderate')
        min_severity = self.autoban_config.get('min_severity', 'critical')
        severity_order = {'low': 0, 'medium': 1, 'high': 2, 'critical': 3}

        # Get threshold settings based on sensitivity
        if sensitivity == 'aggressive':
            threshold = 1  # Immediate ban
            window = 60
        elif sensitivity == 'permissive':
            threshold = int(self.autoban_config.get('permissive_threshold', 5))
            window = int(self.autoban_config.get('permissive_window', 3600))
        else:  # moderate (default)
            threshold = int(self.autoban_config.get('moderate_threshold', 3))
            window = int(self.autoban_config.get('moderate_window', 300))

        threat_detected = False
        threat_reason = ''
        threat_severity = 'medium'
        is_critical_threat = False

        # Check threat patterns
        if scan_result.get('is_scan'):
            threat_severity = scan_result.get('severity', 'medium')
            threat_type = scan_result.get('type', '')
            pattern = scan_result.get('pattern', '')
            category = scan_result.get('category', '')
            cve = scan_result.get('cve', '')

            # Critical threats - always ban immediately in aggressive mode
            # CVE exploits
            if cve and self.autoban_config.get('ban_cve_exploits', True):
                threat_detected = True
                threat_reason = f"CVE exploit attempt: {cve}"
                is_critical_threat = True

            # SQL injection
            elif threat_type == 'injection' and 'sql' in pattern.lower():
                if self.autoban_config.get('ban_sqli', True):
                    threat_detected = True
                    threat_reason = f"SQL injection attempt: {pattern}"
                    is_critical_threat = True

            # Command injection
            elif threat_type == 'injection' and 'command' in pattern.lower():
                if self.autoban_config.get('ban_cmdi', True):
                    threat_detected = True
                    threat_reason = f"Command injection attempt: {pattern}"
                    is_critical_threat = True

            # XXE (critical)
            elif pattern == 'xxe':
                threat_detected = True
                threat_reason = "XXE attack attempt"
                is_critical_threat = True

            # Log4Shell (critical)
            elif pattern == 'log4shell':
                threat_detected = True
                threat_reason = f"Log4Shell attempt: {cve or 'CVE-2021-44228'}"
                is_critical_threat = True

            # SSTI (critical)
            elif pattern == 'ssti':
                threat_detected = True
                threat_reason = "SSTI attack attempt"
                is_critical_threat = True

            # Path traversal (high - follows threshold)
            elif threat_type == 'traversal' or 'traversal' in pattern.lower():
                if self.autoban_config.get('ban_traversal', True):
                    threat_detected = True
                    threat_reason = f"Path traversal attempt: {pattern}"

            # Other threats based on severity threshold
            elif severity_order.get(threat_severity, 0) >= severity_order.get(min_severity, 3):
                threat_detected = True
                threat_reason = f"Threat detected ({threat_severity}): {pattern or category}"

        # Check for known scanners
        if not threat_detected and self.autoban_config.get('ban_scanners', True):
            bot_type = client_fp.get('bot_type', '')
            if bot_type in ['vulnerability_scanner', 'injection_tool', 'exploitation_tool', 'directory_scanner']:
                threat_detected = True
                threat_reason = f"Vulnerability scanner detected: {bot_type}"
                # Scanners are high severity but not critical
                threat_severity = 'high'

        # Rate limit exceeded
        if not threat_detected and rate_limited and self.autoban_config.get('ban_rate_limit', False):
            threat_detected = True
            threat_reason = "Rate limit exceeded"
            threat_severity = 'medium'

        if not threat_detected:
            return False, ''

        # Record the attempt
        self._record_attempt(ip, threat_severity, threat_reason)

        # Decision logic based on sensitivity
        if sensitivity == 'aggressive':
            # Aggressive: ban immediately on first critical threat
            if is_critical_threat:
                return True, threat_reason
            # For non-critical, still check threshold (but threshold=1)
            return self._check_threshold(ip, threshold, window)

        elif sensitivity == 'permissive':
            # Permissive: always require threshold to be met
            return self._check_threshold(ip, threshold, window)

        else:  # moderate
            # Moderate: critical threats ban immediately, others follow threshold
            if is_critical_threat:
                return True, threat_reason
            return self._check_threshold(ip, threshold, window)

    def _request_autoban(self, ip: str, reason: str, severity: str = 'high'):
        """Write auto-ban request for host to process"""
        if ip in self.autoban_requested:
            return

        self.autoban_requested.add(ip)
        duration = self.autoban_config.get('ban_duration', '4h')

        ban_request = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'ip': ip,
            'reason': reason,
            'severity': severity,
            'duration': duration,
            'source': 'waf'
        }

        try:
            with open(AUTOBAN_FILE, 'a') as f:
                f.write(json.dumps(ban_request) + '\n')
            ctx.log.warn(f"AUTO-BAN REQUESTED: {ip} for {duration} - {reason}")
        except Exception as e:
            ctx.log.error(f"Failed to write auto-ban request: {e}")

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

        # Detect bot from user agent
        ua_lower = ua.lower()
        is_bot = any(sig in ua_lower for sig in BOT_SIGNATURES)

        # Additional bot detection heuristics
        bot_type = None
        if is_bot:
            # Categorize the bot
            if any(s in ua_lower for s in ['masscan', 'zgrab', 'censys', 'shodan', 'nmap']):
                bot_type = 'port_scanner'
            elif any(s in ua_lower for s in ['nikto', 'nuclei', 'acunetix', 'nessus', 'qualys']):
                bot_type = 'vulnerability_scanner'
            elif any(s in ua_lower for s in ['dirb', 'gobuster', 'ffuf', 'wfuzz', 'feroxbuster']):
                bot_type = 'directory_scanner'
            elif any(s in ua_lower for s in ['sqlmap', 'havij', 'commix']):
                bot_type = 'injection_tool'
            elif any(s in ua_lower for s in ['wpscan', 'joomscan', 'droopescan', 'cmsmap']):
                bot_type = 'cms_scanner'
            elif any(s in ua_lower for s in ['metasploit', 'cobalt', 'hydra', 'medusa']):
                bot_type = 'exploitation_tool'
            elif any(s in ua_lower for s in ['curl', 'wget', 'python', 'go-http', 'java/']):
                bot_type = 'http_client'
            else:
                bot_type = 'generic_bot'

        # Suspicious UA patterns (empty, minimal, or clearly fake)
        is_suspicious_ua = False
        if not ua or ua == '-' or len(ua) < 10:
            is_suspicious_ua = True
        elif ua.lower() in ['mozilla/4.0', 'mozilla/5.0']:
            is_suspicious_ua = True
        elif not accept_lang and not accept_enc:
            # Real browsers always send these
            is_suspicious_ua = True

        # Parse UA for device info
        device = 'unknown'
        if 'mobile' in ua_lower or 'android' in ua_lower:
            device = 'mobile'
        elif 'iphone' in ua_lower or 'ipad' in ua_lower:
            device = 'ios'
        elif 'windows' in ua_lower:
            device = 'windows'
        elif 'mac' in ua_lower:
            device = 'macos'
        elif 'linux' in ua_lower:
            device = 'linux'

        return {
            'fingerprint': fp_hash,
            'user_agent': ua[:200],
            'is_bot': is_bot,
            'bot_type': bot_type,
            'is_suspicious_ua': is_suspicious_ua,
            'device': device
        }

    def _detect_bot_behavior(self, request: http.Request) -> dict:
        """Detect bot-like behavior based on request patterns"""
        path = request.path.lower()

        for pattern in BOT_BEHAVIOR_PATHS:
            if re.search(pattern, path, re.IGNORECASE):
                # Categorize the behavior
                if any(p in pattern for p in [r'\.git', r'\.env', r'\.aws', r'config', r'credential']):
                    return {
                        'is_bot_behavior': True,
                        'behavior_type': 'config_hunting',
                        'pattern': pattern,
                        'severity': 'high'
                    }
                elif any(p in pattern for p in ['admin', 'login', 'cpanel', 'phpmyadmin']):
                    return {
                        'is_bot_behavior': True,
                        'behavior_type': 'admin_hunting',
                        'pattern': pattern,
                        'severity': 'medium'
                    }
                elif any(p in pattern for p in ['backup', r'\.sql', r'\.tar', r'\.zip', 'dump']):
                    return {
                        'is_bot_behavior': True,
                        'behavior_type': 'backup_hunting',
                        'pattern': pattern,
                        'severity': 'high'
                    }
                elif any(p in pattern for p in ['shell', 'cmd', 'exec', 'backdoor', 'c99', 'r57']):
                    return {
                        'is_bot_behavior': True,
                        'behavior_type': 'shell_hunting',
                        'pattern': pattern,
                        'severity': 'critical'
                    }
                elif any(p in pattern for p in ['api', 'swagger', 'graphql', 'actuator']):
                    return {
                        'is_bot_behavior': True,
                        'behavior_type': 'api_discovery',
                        'pattern': pattern,
                        'severity': 'low'
                    }

        return {'is_bot_behavior': False, 'behavior_type': None, 'pattern': None, 'severity': None}

    def _detect_scan(self, request: http.Request) -> dict:
        """Comprehensive threat detection with categorized patterns"""
        path = request.path.lower()
        full_url = request.pretty_url.lower()
        query = request.query
        body = request.content.decode('utf-8', errors='ignore').lower() if request.content else ''
        content_type = request.headers.get('content-type', '').lower()

        # === CVE-2025-15467 CHECK FIRST (Content-Type based) ===
        # OpenSSL CMS AuthEnvelopedData stack overflow - must check before SSRF
        if any(ct in content_type for ct in CMS_CONTENT_TYPES):
            body_len = len(body) if body else 0
            severity = 'critical' if body_len > 1024 else 'high'
            return {
                'is_scan': True, 'pattern': 'CVE-2025-15467', 'type': 'cve_exploit',
                'severity': severity, 'category': 'cms_attack',
                'cve': 'CVE-2025-15467'
            }

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

        # Check SSRF - only in query parameters and body, not in the target URL itself
        # This prevents false positives when accessing internal services legitimately
        ssrf_targets = [body]
        if query:
            ssrf_targets.extend([str(v) for v in query.values()])
        ssrf_combined = ' '.join(ssrf_targets)
        for pattern in SSRF_PATTERNS:
            if re.search(pattern, ssrf_combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'ssrf', 'type': 'ssrf',
                    'severity': 'high', 'category': 'server_side'
                }

        # Check XXE (in body/headers for XML)
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

        # Check Template Injection (SSTI)
        for pattern in SSTI_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'ssti', 'type': 'injection',
                    'severity': 'critical', 'category': 'template_injection'
                }

        # Check Prototype Pollution
        for pattern in PROTO_POLLUTION_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'prototype_pollution', 'type': 'injection',
                    'severity': 'high', 'category': 'javascript_attack'
                }

        # Check GraphQL abuse (only on graphql endpoints)
        if 'graphql' in path or 'graphql' in content_type:
            for pattern in GRAPHQL_ABUSE_PATTERNS:
                if re.search(pattern, combined, re.IGNORECASE):
                    return {
                        'is_scan': True, 'pattern': 'graphql_abuse', 'type': 'api_abuse',
                        'severity': 'medium', 'category': 'graphql'
                    }

        # Check JWT attacks (alg:none, token in URL)
        for pattern in JWT_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                # alg:none is critical, exposed token is medium
                severity = 'critical' if 'none' in combined.lower() else 'medium'
                return {
                    'is_scan': True, 'pattern': 'jwt_attack', 'type': 'auth_bypass',
                    'severity': severity, 'category': 'authentication'
                }

        # Check HTTP Request Smuggling
        headers_str = ' '.join(f"{k}: {v}" for k, v in request.headers.items()).lower()
        for pattern in HTTP_SMUGGLING_PATTERNS:
            if re.search(pattern, headers_str + ' ' + body, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'http_smuggling', 'type': 'protocol_attack',
                    'severity': 'critical', 'category': 'request_smuggling'
                }

        # Check AI/LLM Prompt Injection
        for pattern in PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'prompt_injection', 'type': 'ai_attack',
                    'severity': 'high', 'category': 'llm_injection'
                }

        # Check WAF Bypass attempts
        for pattern in WAF_BYPASS_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'waf_bypass', 'type': 'evasion',
                    'severity': 'high', 'category': 'waf_bypass'
                }

        # Check Extended SSTI patterns
        for pattern in SSTI_EXTENDED_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'ssti_advanced', 'type': 'injection',
                    'severity': 'critical', 'category': 'template_injection'
                }

        # Check API Abuse patterns
        for pattern in API_ABUSE_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'api_abuse', 'type': 'api_attack',
                    'severity': 'medium', 'category': 'api_security'
                }

        # Check Supply Chain attack patterns (in request bodies/headers)
        for pattern in SUPPLY_CHAIN_PATTERNS:
            if re.search(pattern, combined, re.IGNORECASE):
                return {
                    'is_scan': True, 'pattern': 'supply_chain', 'type': 'supply_chain',
                    'severity': 'high', 'category': 'supply_chain_attack'
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
        bot_behavior_data = entry.get('bot_behavior', {})
        client_data = entry.get('client', {})

        # Skip threat logging for trusted local IPs (green known)
        source_ip = entry.get('client_ip', '')
        is_trusted_local = source_ip.startswith(('192.168.', '10.', '172.16.', '172.17.', '172.18.', '127.'))

        # Log to CrowdSec if any threat indicator is present (skip trusted locals)
        should_log = not is_trusted_local and (
            scan_data.get('is_scan') or
            bot_behavior_data.get('is_bot_behavior') or
            client_data.get('is_bot') or
            entry.get('is_auth_attempt') or
            entry.get('suspicious_headers') or
            entry.get('rate_limit', {}).get('is_limited')
        )
        if should_log:
            try:
                # Determine the primary threat type for categorization
                threat_type = 'suspicious'
                if scan_data.get('is_scan'):
                    threat_type = scan_data.get('type', 'scan')
                elif bot_behavior_data.get('is_bot_behavior'):
                    threat_type = bot_behavior_data.get('behavior_type', 'bot_behavior')
                elif client_data.get('is_bot'):
                    threat_type = client_data.get('bot_type', 'bot')
                elif entry.get('is_auth_attempt'):
                    threat_type = 'auth_attempt'

                # Determine severity
                severity = 'low'
                if scan_data.get('severity'):
                    severity = scan_data.get('severity')
                elif bot_behavior_data.get('severity'):
                    severity = bot_behavior_data.get('severity')
                elif client_data.get('bot_type') in ['exploitation_tool', 'injection_tool']:
                    severity = 'high'
                elif client_data.get('bot_type') in ['vulnerability_scanner', 'directory_scanner']:
                    severity = 'medium'

                cs_entry = {
                    'timestamp': entry['timestamp'],
                    'source_ip': entry['client_ip'],
                    'country': entry['country'],
                    'request': f"{entry['method']} {entry['path']}",
                    'host': entry.get('host', ''),
                    'user_agent': client_data.get('user_agent', ''),
                    'type': threat_type,
                    'pattern': scan_data.get('pattern') or bot_behavior_data.get('pattern', ''),
                    'category': scan_data.get('category') or bot_behavior_data.get('behavior_type', ''),
                    'severity': severity,
                    'cve': scan_data.get('cve', ''),
                    'response_code': entry.get('response', {}).get('status', 0),
                    'fingerprint': client_data.get('fingerprint', ''),
                    'is_bot': client_data.get('is_bot', False),
                    'bot_type': client_data.get('bot_type', ''),
                    'bot_behavior': bot_behavior_data.get('behavior_type', ''),
                    'rate_limited': entry.get('rate_limit', {}).get('is_limited', False),
                    'suspicious_headers': len(entry.get('suspicious_headers', [])) > 0,
                    'suspicious_ua': client_data.get('is_suspicious_ua', False),
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
        # Skip threat detection for whitelisted bots
        user_agent = request.headers.get("user-agent", "")
        if is_whitelisted_bot(user_agent):
            scan_result = {}  # No threat for whitelisted bots
        else:
            scan_result = self._detect_scan(request)
        suspicious_headers = self._detect_suspicious_headers(request)
        rate_limit = self._check_rate_limit(source_ip)
        client_fp = self._get_client_fingerprint(request)
        bot_behavior = self._detect_bot_behavior(request)

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
            'bot_behavior': bot_behavior,
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

        # Log bot behavior detection
        if bot_behavior.get('is_bot_behavior'):
            behavior_type = bot_behavior.get('behavior_type', 'unknown')
            severity = bot_behavior.get('severity', 'medium')

            log_msg = f"BOT BEHAVIOR [{severity.upper()}]: {source_ip} ({entry['country']}) - {behavior_type}"
            log_msg += f" - {request.method} {request.path}"

            if severity in ['critical', 'high']:
                ctx.log.warn(log_msg)
            else:
                ctx.log.info(log_msg)

            self._add_alert({
                'time': entry['timestamp'],
                'ip': source_ip,
                'country': entry['country'],
                'type': 'bot_behavior',
                'behavior_type': behavior_type,
                'severity': severity,
                'path': request.path,
                'method': request.method,
                'host': request.host,
                'bot_type': client_fp.get('bot_type')
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

        # Check for auto-ban
        should_ban, ban_reason = self._should_autoban(
            source_ip,
            scan_result,
            client_fp,
            rate_limit.get('is_limited', False)
        )
        if should_ban:
            self._request_autoban(source_ip, ban_reason, scan_result.get('severity', 'high'))

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
