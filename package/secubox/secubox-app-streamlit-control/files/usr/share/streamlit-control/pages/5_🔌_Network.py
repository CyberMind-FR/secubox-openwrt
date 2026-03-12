"""
Network Management - Phase 3
HAProxy, WireGuard, DNS with auto-refresh
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu, can_write
from lib.widgets import page_header, badge, auto_refresh_toggle

st.set_page_config(page_title="Network - SecuBox Control", page_icon="🔌", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Network", "HAProxy vhosts, WireGuard, DNS management", "🔌")

# Auto-refresh
auto_refresh_toggle("network", intervals=[30, 60, 120])
st.markdown("---")

# Permission check
has_write = can_write()

# Tabs
tab1, tab2, tab3 = st.tabs(["🌐 HAProxy Vhosts", "🔒 WireGuard", "📡 DNS"])

with tab1:
    st.markdown("### HAProxy Virtual Hosts")

    # Fetch HAProxy status
    with st.spinner("Loading HAProxy status..."):
        haproxy_status = ubus.haproxy_status()
        vhosts = ubus.haproxy_list_vhosts()

    # Status summary
    hp_running = haproxy_status.get("running", haproxy_status.get("haproxy_running", False))
    vhost_count = haproxy_status.get("vhost_count", len(vhosts))

    col1, col2, col3 = st.columns(3)
    with col1:
        if hp_running:
            st.success("🟢 HAProxy Running")
        else:
            st.error("🔴 HAProxy Stopped")
    with col2:
        st.metric("Vhosts", vhost_count)
    with col3:
        backend_count = haproxy_status.get("backend_count", 0)
        st.metric("Backends", backend_count)

    st.markdown("---")

    # Search filter
    search = st.text_input("Filter vhosts", key="vhost_search", placeholder="Type to filter by domain...")

    if vhosts:
        # Filter if search provided
        if search:
            search_lower = search.lower()
            vhosts = [v for v in vhosts if search_lower in v.get("domain", "").lower()]

        st.markdown(f"**Showing {len(vhosts)} vhosts**")
        st.markdown("---")

        # Table header
        col1, col2, col3, col4 = st.columns([3, 2, 1, 1])
        with col1:
            st.markdown("**Domain**")
        with col2:
            st.markdown("**Backend**")
        with col3:
            st.markdown("**SSL**")
        with col4:
            st.markdown("**Status**")

        for vhost in vhosts[:100]:  # Limit display
            domain = vhost.get("domain", "unknown")
            backend = vhost.get("backend", "")
            ssl = vhost.get("ssl", False)
            enabled = vhost.get("enabled", True)
            waf_bypass = vhost.get("waf_bypass", False)

            col1, col2, col3, col4 = st.columns([3, 2, 1, 1])

            with col1:
                if enabled:
                    st.markdown(f"[{domain}](https://{domain})")
                else:
                    st.markdown(f"~~{domain}~~")

            with col2:
                st.caption(f"→ {backend}")

            with col3:
                if ssl:
                    cert_status = vhost.get("cert_status", "valid")
                    if cert_status == "valid":
                        st.markdown(badge("ssl_ok"), unsafe_allow_html=True)
                    elif cert_status == "expiring":
                        st.markdown(badge("ssl_warn"), unsafe_allow_html=True)
                    else:
                        st.markdown(badge("ssl_none"), unsafe_allow_html=True)
                else:
                    st.markdown(badge("ssl_none", "No SSL"), unsafe_allow_html=True)

            with col4:
                badges = []
                if enabled:
                    badges.append(badge("running", "On"))
                else:
                    badges.append(badge("stopped", "Off"))
                if waf_bypass:
                    badges.append(badge("warning", "WAF↷"))
                st.markdown(" ".join(badges), unsafe_allow_html=True)

        if len(vhosts) > 100:
            st.caption(f"... and {len(vhosts) - 100} more")

    else:
        st.info("No vhosts configured")

with tab2:
    st.markdown("### WireGuard VPN")

    # Try to get WireGuard status via RPCD
    try:
        wg_status = ubus.call("luci.wireguard", "status") or {}
        wg_interfaces = wg_status.get("interfaces", [])
    except:
        wg_interfaces = []

    if wg_interfaces:
        for iface in wg_interfaces:
            name = iface.get("name", "wg0")
            public_key = iface.get("public_key", "")
            listen_port = iface.get("listen_port", 0)
            peers = iface.get("peers", [])

            st.markdown(f"#### Interface: {name}")

            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"- **Port**: {listen_port}")
                st.markdown(f"- **Peers**: {len(peers)}")
            with col2:
                if public_key:
                    st.code(public_key[:20] + "...", language=None)

            if peers:
                st.markdown("**Peers:**")
                for peer in peers:
                    peer_name = peer.get("name", peer.get("public_key", "")[:8])
                    endpoint = peer.get("endpoint", "N/A")
                    last_handshake = peer.get("last_handshake", 0)

                    col1, col2, col3 = st.columns([2, 2, 1])
                    with col1:
                        st.write(peer_name)
                    with col2:
                        st.caption(endpoint)
                    with col3:
                        if last_handshake > 0:
                            st.markdown(badge("running", "Online"), unsafe_allow_html=True)
                        else:
                            st.markdown(badge("stopped", "Offline"), unsafe_allow_html=True)

            st.markdown("---")
    else:
        st.info("No WireGuard interfaces configured or RPCD handler not available")
        st.caption("Configure WireGuard via LuCI → Network → Interfaces or CLI")

        # Show command hint
        with st.expander("Quick Setup Commands"):
            st.code("""
# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Create interface via UCI
uci set network.wg0=interface
uci set network.wg0.proto='wireguard'
uci set network.wg0.private_key='YOUR_PRIVATE_KEY'
uci set network.wg0.listen_port='51820'
uci commit network
/etc/init.d/network reload
            """, language="bash")

with tab3:
    st.markdown("### DNS Configuration")

    # Try to get DNS status
    try:
        dns_status = ubus.call("luci.dns-provider", "status") or {}
    except:
        dns_status = {}

    if dns_status:
        provider = dns_status.get("provider", "Unknown")
        zones = dns_status.get("zones", [])

        st.markdown(f"**Provider**: {provider}")

        if zones:
            st.markdown("**Zones:**")
            for zone in zones:
                st.write(f"- {zone}")
    else:
        st.info("DNS provider integration available via secubox-app-dns-provider")
        st.caption("Configure DNS API credentials for automated DNS management")

        # Show supported providers
        with st.expander("Supported DNS Providers"):
            st.markdown("""
            - **OVH** - API key authentication
            - **Cloudflare** - API token or global key
            - **Gandi** - Personal Access Token
            - **DigitalOcean** - API token

            Configure via: `dnsctl provider add <name>`
            """)
