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
DEFAULT_BACKEND = ("127.0.0.1", 8081)  # LuCI fallback

class HaproxyRouter:
    def __init__(self):
        self.routes = {}
        self._routes_mtime = 0
        self._check_interval = 10  # Check file every N requests
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

    def _get_backend(self, host: str) -> tuple:
        """Get backend address for hostname"""
        # Remove port from host if present
        hostname = host.split(':')[0].lower()

        # 1. Try exact match first
        if hostname in self.routes:
            backend = self.routes[hostname]
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
                return (backend[0], backend[1])

        ctx.log.warn(f"No route for {hostname}, using default")
        return DEFAULT_BACKEND

    def request(self, flow: http.HTTPFlow):
        """Route request to appropriate backend"""
        # Periodically check if routes file has changed
        self._request_count += 1
        if self._request_count >= self._check_interval:
            self._request_count = 0
            self._check_reload_routes()

        host = flow.request.host_header or flow.request.host
        backend = self._get_backend(host)

        # Set the upstream server
        flow.request.host = backend[0]
        flow.request.port = backend[1]

        # Log routing decision
        ctx.log.debug(f"ROUTE: {host} -> {backend[0]}:{backend[1]}")

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
