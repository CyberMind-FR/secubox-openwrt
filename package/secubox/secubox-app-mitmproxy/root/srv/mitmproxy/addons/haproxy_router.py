#!/usr/bin/env python3
"""
HAProxy Backend Router for mitmproxy
Routes incoming requests from HAProxy to actual backends based on Host header
Works with secubox_analytics.py for threat detection
"""

import json
import os
import subprocess
from mitmproxy import http, ctx
from mitmproxy.net.server_spec import ServerSpec
from mitmproxy.connection import Address

# Backend routing configuration file
ROUTES_FILE = "/data/haproxy-routes.json"

# 404 page HTML - shown when no route is found
# NEVER fallback to LuCI - return proper 404 instead
NOT_FOUND_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAF Says NO - SecuBox</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a1a0a 100%);
            color: #0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            overflow: hidden;
        }
        .matrix-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 0, 0.03) 2px,
                rgba(0, 255, 0, 0.03) 4px
            );
            pointer-events: none;
            animation: scan 8s linear infinite;
        }
        @keyframes scan { from { background-position: 0 0; } to { background-position: 0 100vh; } }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 700px;
            position: relative;
            z-index: 10;
        }
        .skull {
            font-size: 5rem;
            animation: pulse 2s ease-in-out infinite;
            text-shadow: 0 0 20px #f00, 0 0 40px #f00;
        }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        h1 {
            font-size: 3rem;
            margin: 0.5rem 0;
            color: #f00;
            text-shadow: 0 0 10px #f00, 0 0 20px #800;
            animation: glitch 0.5s infinite;
        }
        @keyframes glitch {
            0%, 90%, 100% { transform: translateX(0); }
            92% { transform: translateX(-2px); }
            94% { transform: translateX(2px); }
            96% { transform: translateX(-1px); }
            98% { transform: translateX(1px); }
        }
        h2 {
            font-size: 1.2rem;
            color: #0f0;
            margin: 1rem 0;
        }
        .domain {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #0f0;
            padding: 0.8rem 1.5rem;
            border-radius: 4px;
            font-family: monospace;
            font-size: 1.1rem;
            display: inline-block;
            margin: 1rem 0;
            color: #ff0;
        }
        .waf-layers {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 1.5rem 0;
            flex-wrap: wrap;
        }
        .layer {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #f00;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            color: #f88;
        }
        .message {
            color: #888;
            line-height: 1.8;
            margin: 1rem 0;
        }
        .quote {
            font-style: italic;
            color: #0f0;
            margin: 1.5rem 0;
            padding: 1rem;
            border-left: 3px solid #0f0;
            text-align: left;
        }
        .footer {
            margin-top: 2rem;
            font-size: 0.8rem;
            color: #444;
        }
        a { color: #0f0; text-decoration: none; }
        a:hover { text-decoration: underline; color: #0ff; }
    </style>
</head>
<body>
    <div class="matrix-bg"></div>
    <div class="container">
        <div class="skull">&#128128;</div>
        <h1>WAF SAYS NO</h1>
        <h2>// REQUEST TERMINATED //</h2>
        <p class="domain">{domain}</p>

        <div class="waf-layers">
            <span class="layer">HAProxy &#128683;</span>
            <span class="layer">CrowdSec &#128683;</span>
            <span class="layer">mitmproxy &#128683;</span>
            <span class="layer">SecuBox &#128683;</span>
        </div>

        <p class="message">
            Your request has been inspected by <strong>4 layers of WAF</strong>
            and found to be going... absolutely nowhere.<br><br>
            This domain either doesn't exist, or the backend decided to take a coffee break.
        </p>

        <div class="quote">
            "You shall not pass!"<br>
            <small>- Every WAF ever, probably</small>
        </div>

        <p class="message">
            <strong>Possible reasons:</strong><br>
            &#x2022; The service isn't configured<br>
            &#x2022; The backend is having an existential crisis<br>
            &#x2022; You're lost on the internet (happens to the best of us)
        </p>

        <div class="footer">
            <a href="https://secubox.in">&#128737; SecuBox Multi-Layer WAF Gateway</a>
        </div>
    </div>
</body>
</html>
"""

class HaproxyRouter:
    def __init__(self):
        self.routes = {}
        self._routes_mtime = 0
        self._check_interval = 1  # Check file every request for immediate route updates
        self._request_count = 0
        self._load_routes()
        ctx.log.info(f"HAProxy Router loaded with {len(self.routes)} routes")

    def _load_routes(self):
        """Load routing table from JSON file"""
        if os.path.exists(ROUTES_FILE):
            try:
                self._routes_mtime = os.path.getmtime(ROUTES_FILE)
                with open(ROUTES_FILE, 'r') as f:
                    self.routes = json.load(f)
                ctx.log.info(f"Loaded routes: {list(self.routes.keys())}")
            except Exception as e:
                ctx.log.error(f"Failed to load routes: {e}")
                self.routes = {}
        else:
            ctx.log.warn(f"Routes file not found: {ROUTES_FILE}")
            self._generate_default_routes()

    def _check_reload_routes(self):
        """Check if routes file has changed and reload if needed"""
        try:
            if os.path.exists(ROUTES_FILE):
                mtime = os.path.getmtime(ROUTES_FILE)
                if mtime > self._routes_mtime:
                    ctx.log.info("Routes file changed, reloading...")
                    self._load_routes()
        except Exception as e:
            ctx.log.error(f"Error checking routes file: {e}")

    def _generate_default_routes(self):
        """Generate default routes from UCI if available"""
        self.routes = {
            # Format: "hostname": ["ip", port]
            "blog.cybermind.fr": ["192.168.255.1", 4000],
            "devel.cybermind.fr": ["192.168.255.1", 3000],
            "devel.maegia.tv": ["192.168.255.1", 3000],
            "play.cybermind.fr": ["192.168.255.1", 8501],
            "crt.cybermind.fr": ["192.168.255.1", 8502],
            "secubox.maegia.tv": ["127.0.0.1", 8081],
            "glances.maegia.tv": ["192.168.255.1", 61208],
            "factory.maegia.tv": ["192.168.255.1", 7331],
            "meet.maegia.tv": ["127.0.0.1", 8443],
        }
        # Save for next time
        try:
            with open(ROUTES_FILE, 'w') as f:
                json.dump(self.routes, f, indent=2)
        except:
            pass

    def _get_backend(self, host: str) -> tuple | None:
        """Get backend address for hostname. Returns None if not found."""
        # Remove port from host if present
        hostname = host.split(':')[0].lower()

        # 1. Try exact match first
        if hostname in self.routes:
            backend = self.routes[hostname]
            # NEVER route to 8081 (LuCI) - treat as missing route
            if backend[1] == 8081:
                ctx.log.warn(f"Route for {hostname} points to 8081 (LuCI), treating as missing")
                return None
            return (backend[0], backend[1])

        # 2. Try wildcard matching - collect all wildcard patterns
        # Support both "*.domain" and ".domain" formats
        wildcards = []
        for pattern, backend in self.routes.items():
            if pattern.startswith('*.'):
                # Standard wildcard: *.gk2.secubox.in
                suffix = pattern[1:]  # Keep the dot: .gk2.secubox.in
                wildcards.append((suffix, backend))
            elif pattern.startswith('.'):
                # HAProxy-style wildcard: .gk2.secubox.in
                suffix = pattern  # Already has dot: .gk2.secubox.in
                wildcards.append((suffix, backend))

        # Sort by suffix length descending - longest (most specific) first
        wildcards.sort(key=lambda x: len(x[0]), reverse=True)

        for suffix, backend in wildcards:
            if hostname.endswith(suffix):
                # NEVER route to 8081 (LuCI) - treat as missing route
                if backend[1] == 8081:
                    ctx.log.warn(f"Wildcard route for {hostname} points to 8081 (LuCI), treating as missing")
                    return None
                return (backend[0], backend[1])

        ctx.log.warn(f"No route found for {hostname}")
        return None

    def request(self, flow: http.HTTPFlow):
        """Route request to appropriate backend"""
        # Periodically check if routes file has changed
        self._request_count += 1
        if self._request_count >= self._check_interval:
            self._request_count = 0
            self._check_reload_routes()

        host = flow.request.host_header or flow.request.host
        backend = self._get_backend(host)

        # If no backend found, return 404 - NEVER fallback to LuCI
        if backend is None:
            ctx.log.warn(f"404: No backend for {host}")
            flow.response = http.Response.make(
                404,
                NOT_FOUND_HTML.format(domain=host).encode('utf-8'),
                {"Content-Type": "text/html; charset=utf-8"}
            )
            flow.metadata['original_host'] = host
            flow.metadata['backend'] = "404_NOT_FOUND"
            return

        # Save original Host header before routing
        original_host_header = flow.request.headers.get("Host", host)

        # Set the upstream server (changes internal routing destination)
        flow.request.host = backend[0]
        flow.request.port = backend[1]

        # CRITICAL: Restore original Host header for backend validation
        # Many backends (PeerTube OAuth, etc.) validate Host header against config
        flow.request.headers["Host"] = original_host_header

        # Log routing decision
        ctx.log.debug(f"ROUTE: {host} -> {backend[0]}:{backend[1]} (Host: {original_host_header})")

        # Store original host for analytics
        flow.metadata['original_host'] = host
        flow.metadata['backend'] = f"{backend[0]}:{backend[1]}"


def generate_routes_from_uci():
    """Generate routes JSON from HAProxy UCI config"""
    routes = {}

    try:
        # Get vhosts
        result = subprocess.run(
            ['uci', 'show', 'haproxy'],
            capture_output=True, text=True
        )

        vhosts = {}
        backends = {}

        for line in result.stdout.split('\n'):
            # Parse vhost domains
            if '=vhost' in line:
                vhost_name = line.split('=')[0].split('.')[1]
                vhosts[vhost_name] = {}
            elif '.domain=' in line:
                parts = line.split('=')
                vhost_name = parts[0].split('.')[1]
                domain = parts[1].strip("'")
                if vhost_name in vhosts:
                    vhosts[vhost_name]['domain'] = domain
            elif '.backend=' in line and '=vhost' not in line:
                parts = line.split('=')
                vhost_name = parts[0].split('.')[1]
                backend_name = parts[1].strip("'")
                if vhost_name in vhosts:
                    vhosts[vhost_name]['backend'] = backend_name

            # Parse backend servers
            if '=backend' in line:
                backend_name = line.split('=')[0].split('.')[1]
                backends[backend_name] = {}
            elif '.server=' in line:
                parts = line.split('=')
                backend_name = parts[0].split('.')[1]
                server_spec = parts[1].strip("'")
                # Parse "name ip:port check"
                server_parts = server_spec.split()
                if len(server_parts) >= 2:
                    addr = server_parts[1]
                    if ':' in addr:
                        ip, port = addr.rsplit(':', 1)
                        backends[backend_name] = {'ip': ip, 'port': int(port)}

        # Build routes
        for vhost_name, vhost in vhosts.items():
            if 'domain' in vhost and 'backend' in vhost:
                backend_name = vhost['backend']
                if backend_name in backends:
                    backend = backends[backend_name]
                    routes[vhost['domain']] = [backend.get('ip', '127.0.0.1'), backend.get('port', 80)]

        return routes
    except Exception as e:
        print(f"Error generating routes: {e}")
        return {}


if __name__ == "__main__":
    # CLI tool to generate routes
    routes = generate_routes_from_uci()
    print(json.dumps(routes, indent=2))


addons = [HaproxyRouter()]
