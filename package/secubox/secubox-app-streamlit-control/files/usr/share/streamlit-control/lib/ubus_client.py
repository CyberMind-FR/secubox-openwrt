"""
Ubus JSON-RPC Client for OpenWrt
Provides Python interface to RPCD/ubus endpoints
"""

import requests
import urllib3
from typing import Any, Dict, List, Optional
import time

# Disable SSL warnings for self-signed certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class UbusClient:
    """JSON-RPC client for OpenWrt ubus"""

    def __init__(self, host: str = "192.168.255.1", port: int = 443, use_ssl: bool = True):
        protocol = "https" if use_ssl else "http"
        self.url = f"{protocol}://{host}:{port}/ubus"
        self.session_id = "00000000000000000000000000000000"
        self.username = None
        self._request_id = 0
        self.verify_ssl = False  # Allow self-signed certs
        self._secubox_token = None  # Token for SecuBox users
        self._is_secubox_user = False

        # Create session with proper settings
        self._session = requests.Session()
        self._session.verify = False
        self._session.trust_env = False  # Ignore proxy env vars

    def _next_id(self) -> int:
        self._request_id += 1
        return self._request_id

    def login(self, username: str, password: str) -> bool:
        """
        Authenticate and get session ID.
        Supports both system users (root) and SecuBox managed users.
        """
        # Try system user login first (root, admin, etc.)
        result = self.call("session", "login", {
            "username": username,
            "password": password
        })
        if result and "ubus_rpc_session" in result:
            self.session_id = result["ubus_rpc_session"]
            self.username = username
            self._is_secubox_user = False
            return True

        # Try SecuBox user authentication if system login fails
        result = self.call("luci.secubox-users", "authenticate", {
            "username": username,
            "password": password
        })
        if result and result.get("success") and "token" in result:
            # SecuBox users get a custom token
            self._secubox_token = result["token"]
            self.username = result.get("username", username)
            self._is_secubox_user = True
            # Use anonymous session for ubus calls (limited permissions)
            # The token validates the user identity for audit purposes
            return True

        return False

    @property
    def is_secubox_user(self) -> bool:
        """Check if logged in as SecuBox managed user (limited permissions)"""
        return self._is_secubox_user

    def logout(self) -> bool:
        """Destroy session"""
        try:
            self.call("session", "destroy", {"session": self.session_id})
            self.session_id = "00000000000000000000000000000000"
            self.username = None
            return True
        except:
            return False

    def is_authenticated(self) -> bool:
        """Check if session is still valid"""
        if self.session_id == "00000000000000000000000000000000":
            return False
        result = self.call("session", "access", {
            "scope": "ubus",
            "object": "system",
            "function": "board"
        })
        return result is not None and result.get("access", False)

    def call(self, obj: str, method: str, params: Dict = None, timeout: int = 30) -> Any:
        """Make ubus JSON-RPC call"""
        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "call",
            "params": [self.session_id, obj, method, params or {}]
        }
        try:
            resp = self._session.post(
                self.url,
                json=payload,
                timeout=timeout,
                verify=False
            )
            data = resp.json()
            if "result" in data and len(data["result"]) > 1:
                return data["result"][1]
            elif "result" in data and data["result"][0] == 0:
                return {}  # Success with no data
            return None
        except requests.exceptions.Timeout:
            return {"error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return {"error": "Connection failed"}
        except Exception as e:
            return {"error": str(e)}

    # ==========================================
    # System Methods
    # ==========================================

    def system_board(self) -> Dict:
        """Get system board info"""
        return self.call("system", "board") or {}

    def system_info(self) -> Dict:
        """Get system info (memory, uptime, load)"""
        return self.call("system", "info") or {}

    def file_read(self, path: str) -> Optional[str]:
        """Read file contents"""
        result = self.call("file", "read", {"path": path})
        return result.get("data") if result else None

    def file_exec(self, command: str, params: List[str] = None) -> Dict:
        """Execute command"""
        return self.call("file", "exec", {
            "command": command,
            "params": params or []
        }) or {}

    # ==========================================
    # Metablogizer Methods
    # ==========================================

    def metablogizer_status(self) -> Dict:
        """Get metablogizer status"""
        return self.call("luci.metablogizer", "status") or {}

    def metablogizer_list_sites(self) -> List[Dict]:
        """List all metablogizer sites"""
        result = self.call("luci.metablogizer", "list_sites")
        return result.get("sites", []) if result else []

    def metablogizer_exposure_status(self) -> List[Dict]:
        """Get exposure status for all sites"""
        result = self.call("luci.metablogizer", "get_sites_exposure_status")
        return result.get("sites", []) if result else []

    def metablogizer_create_site(self, name: str, domain: str, description: str = "") -> Dict:
        """Create a new site"""
        return self.call("luci.metablogizer", "create_site", {
            "name": name,
            "domain": domain,
            "gitea_repo": "",
            "ssl": "1",
            "description": description
        }) or {}

    def metablogizer_delete_site(self, site_id: str) -> Dict:
        """Delete a site"""
        return self.call("luci.metablogizer", "delete_site", {"id": site_id}) or {}

    def metablogizer_emancipate(self, site_id: str) -> Dict:
        """Expose site with HAProxy + SSL"""
        return self.call("luci.metablogizer", "emancipate", {"id": site_id}) or {}

    def metablogizer_emancipate_status(self, job_id: str) -> Dict:
        """Check emancipate job status"""
        return self.call("luci.metablogizer", "emancipate_status", {"job_id": job_id}) or {}

    def metablogizer_unpublish(self, site_id: str) -> Dict:
        """Unpublish site"""
        return self.call("luci.metablogizer", "unpublish_site", {"id": site_id}) or {}

    def metablogizer_health_check(self, site_id: str) -> Dict:
        """Check site health"""
        return self.call("luci.metablogizer", "check_site_health", {"id": site_id}) or {}

    def metablogizer_repair(self, site_id: str) -> Dict:
        """Repair site"""
        return self.call("luci.metablogizer", "repair_site", {"id": site_id}) or {}

    def metablogizer_set_auth(self, site_id: str, auth_required: bool) -> Dict:
        """Set authentication requirement"""
        return self.call("luci.metablogizer", "set_auth_required", {
            "id": site_id,
            "auth_required": "1" if auth_required else "0"
        }) or {}

    def metablogizer_upload_file(self, site_id: str, filename: str, content: str) -> Dict:
        """Upload file to site (base64 content)"""
        return self.call("luci.metablogizer", "upload_file", {
            "id": site_id,
            "filename": filename,
            "content": content
        }) or {}

    # ==========================================
    # LXC Container Methods (via secubox-portal)
    # ==========================================

    def lxc_list(self) -> List[Dict]:
        """List LXC containers via secubox-portal"""
        result = self.call("luci.secubox-portal", "get_containers")
        containers = result.get("containers", []) if result else []
        # Normalize state format (secubox-portal uses lowercase)
        for c in containers:
            if "state" in c:
                c["state"] = c["state"].upper()
        return containers

    def lxc_info(self, name: str) -> Dict:
        """Get container info (basic)"""
        containers = self.lxc_list()
        for c in containers:
            if c.get("name") == name:
                return c
        return {}

    def lxc_start(self, name: str) -> Dict:
        """Start container (requires root session)"""
        return self.call("file", "exec", {
            "command": "/usr/bin/lxc-start",
            "params": ["-n", name]
        }) or {}

    def lxc_stop(self, name: str) -> Dict:
        """Stop container (requires root session)"""
        return self.call("file", "exec", {
            "command": "/usr/bin/lxc-stop",
            "params": ["-n", name]
        }) or {}

    # ==========================================
    # HAProxy Methods
    # ==========================================

    def haproxy_status(self) -> Dict:
        """Get HAProxy status"""
        return self.call("luci.haproxy", "status") or {}

    def haproxy_list_vhosts(self) -> List[Dict]:
        """List HAProxy vhosts"""
        result = self.call("luci.haproxy", "list_vhosts")
        return result.get("vhosts", []) if result else []

    # ==========================================
    # Mitmproxy WAF Methods
    # ==========================================

    def mitmproxy_status(self) -> Dict:
        """Get mitmproxy WAF status"""
        return self.call("luci.mitmproxy", "status") or {}

    def mitmproxy_threats(self, limit: int = 20) -> List[Dict]:
        """Get recent threats"""
        result = self.call("luci.mitmproxy", "get_threats", {"limit": limit})
        return result.get("threats", []) if result else []

    # ==========================================
    # CrowdSec Methods (via crowdsec-dashboard)
    # ==========================================

    def crowdsec_status(self) -> Dict:
        """Get CrowdSec status"""
        return self.call("luci.crowdsec-dashboard", "status") or {}

    def crowdsec_decisions(self, limit: int = 20) -> List[Dict]:
        """Get active decisions"""
        result = self.call("luci.crowdsec", "get_decisions", {"limit": limit})
        return result.get("decisions", []) if result else []

    # ==========================================
    # Streamlit Forge Methods
    # ==========================================

    def streamlit_list(self) -> List[Dict]:
        """List Streamlit apps"""
        result = self.call("luci.streamlit-forge", "list")
        return result.get("apps", []) if result else []

    def streamlit_status(self, app_id: str) -> Dict:
        """Get Streamlit app status"""
        return self.call("luci.streamlit-forge", "status", {"id": app_id}) or {}
