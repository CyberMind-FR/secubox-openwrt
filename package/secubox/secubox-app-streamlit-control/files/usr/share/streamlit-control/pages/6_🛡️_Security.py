"""
Security Dashboard - Phase 4
WAF, CrowdSec, Firewall with correct data display
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu
from lib.widgets import page_header, badge, status_card, auto_refresh_toggle

st.set_page_config(page_title="Security - SecuBox Control", page_icon="🛡️", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("Security", "WAF status, CrowdSec decisions, firewall", "🛡️")

# Auto-refresh
auto_refresh_toggle("security", intervals=[10, 30, 60])
st.markdown("---")

# Fetch status
with st.spinner("Loading security status..."):
    mitmproxy = ubus.mitmproxy_status()
    crowdsec = ubus.crowdsec_status()

# ==========================================
# Parse mitmproxy WAF status
# ==========================================
waf_running = mitmproxy.get("running", False)
waf_enabled = mitmproxy.get("enabled", False)
waf_threats = mitmproxy.get("threats_today", 0)
waf_autobans = mitmproxy.get("autobans_today", 0)
waf_autobans_total = mitmproxy.get("autobans_total", 0)
waf_autobans_pending = mitmproxy.get("autobans_pending", 0)
waf_autoban_enabled = mitmproxy.get("autoban_enabled", False)
waf_sensitivity = mitmproxy.get("autoban_sensitivity", "moderate")
waf_web_port = mitmproxy.get("web_port", 8088)
waf_proxy_port = mitmproxy.get("proxy_port", 8888)
waf_mode = mitmproxy.get("mode", "regular")

# ==========================================
# Parse CrowdSec status
# ==========================================
# Handle various response formats
cs_state = crowdsec.get("crowdsec", crowdsec.get("status", "unknown"))
if isinstance(cs_state, str):
    cs_running = cs_state.lower() in ("running", "active", "ok")
elif isinstance(cs_state, bool):
    cs_running = cs_state
else:
    cs_running = False

cs_bouncer = crowdsec.get("bouncer", "unknown")
cs_bouncer_running = cs_bouncer.lower() == "running" if isinstance(cs_bouncer, str) else False
cs_decisions = crowdsec.get("total_decisions", crowdsec.get("active_decisions", crowdsec.get("local_decisions", 0)))
cs_alerts = crowdsec.get("alerts_24h", crowdsec.get("alerts", 0))
cs_bouncers = crowdsec.get("bouncer_count", 0)
cs_version = crowdsec.get("version", "unknown")
cs_geoip = crowdsec.get("geoip_enabled", False)

# ==========================================
# Status Overview
# ==========================================
st.markdown("### 📊 Status Overview")
col1, col2, col3, col4 = st.columns(4)

with col1:
    status_card(
        "WAF (mitmproxy)",
        "Running" if waf_running else "Stopped",
        f"Mode: {waf_mode}",
        "🛡️",
        "#10b981" if waf_running else "#ef4444"
    )

with col2:
    status_card(
        "Threats Today",
        f"{waf_threats:,}" if isinstance(waf_threats, int) else str(waf_threats),
        f"{waf_autobans:,} auto-bans" if isinstance(waf_autobans, int) else "0 auto-bans",
        "⚠️",
        "#f59e0b" if waf_threats > 0 else "#10b981"
    )

with col3:
    status_card(
        "CrowdSec",
        "Running" if cs_running else "Stopped",
        f"{cs_decisions} active bans",
        "🚫",
        "#10b981" if cs_running else "#ef4444"
    )

with col4:
    status_card(
        "Bouncer",
        "Running" if cs_bouncer_running else "Stopped",
        f"{cs_bouncers} registered",
        "🔥",
        "#10b981" if cs_bouncer_running else "#ef4444"
    )

st.markdown("---")

# ==========================================
# Detailed Tabs
# ==========================================
tab1, tab2, tab3, tab4 = st.tabs(["🛡️ WAF Status", "📋 WAF Alerts", "🚫 CrowdSec", "📈 Stats"])

with tab1:
    st.markdown("### WAF Configuration")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### Service")
        st.markdown(f"- **Status**: {'🟢 Running' if waf_running else '🔴 Stopped'}")
        st.markdown(f"- **Mode**: {waf_mode}")
        st.markdown(f"- **Proxy Port**: {waf_proxy_port}")
        st.markdown(f"- **Web UI Port**: {waf_web_port}")

        if waf_running:
            st.link_button("🔗 Open Web UI", f"http://192.168.255.1:{waf_web_port}")

    with col2:
        st.markdown("#### Auto-Ban")
        st.markdown(f"- **Enabled**: {'✅ Yes' if waf_autoban_enabled else '❌ No'}")
        st.markdown(f"- **Sensitivity**: {waf_sensitivity}")
        st.markdown(f"- **Total Bans**: {waf_autobans_total:,}")
        st.markdown(f"- **Pending**: {waf_autobans_pending}")

    st.markdown("---")

    # HAProxy Integration
    haproxy_router = mitmproxy.get("haproxy_router_enabled", False)
    haproxy_port = mitmproxy.get("haproxy_listen_port", 22222)

    st.markdown("#### HAProxy Integration")
    if haproxy_router:
        st.success(f"✅ HAProxy inspection enabled on port {haproxy_port}")
    else:
        st.info("HAProxy inspection is disabled")

with tab2:
    st.markdown("### Recent WAF Alerts")

    # Fetch alerts
    alerts = ubus.mitmproxy_threats(limit=50)

    if alerts:
        st.markdown(f"Showing {len(alerts)} recent threats")

        # Table headers
        cols = st.columns([2, 3, 2, 2, 1, 1])
        with cols[0]:
            st.markdown("**Time**")
        with cols[1]:
            st.markdown("**Source IP**")
        with cols[2]:
            st.markdown("**Host**")
        with cols[3]:
            st.markdown("**Type**")
        with cols[4]:
            st.markdown("**Severity**")
        with cols[5]:
            st.markdown("**Country**")

        st.markdown("---")

        for idx, alert in enumerate(alerts[:30]):
            # Parse alert fields
            timestamp = alert.get("timestamp", "")
            if timestamp and "T" in timestamp:
                time_part = timestamp.split("T")[1].split(".")[0] if "T" in timestamp else timestamp[:8]
            else:
                time_part = str(timestamp)[:8]

            source_ip = alert.get("source_ip", alert.get("ip", "-"))
            host = alert.get("host", "-")
            alert_type = alert.get("type", alert.get("pattern", alert.get("category", "-")))
            severity = alert.get("severity", "low").lower()
            country = alert.get("country", "-")

            cols = st.columns([2, 3, 2, 2, 1, 1])

            with cols[0]:
                st.caption(time_part)

            with cols[1]:
                st.code(source_ip, language=None)

            with cols[2]:
                # Truncate long hosts
                if len(host) > 20:
                    host = host[:17] + "..."
                st.caption(host)

            with cols[3]:
                st.caption(alert_type)

            with cols[4]:
                if severity == "critical":
                    st.markdown(badge("error", "CRIT"), unsafe_allow_html=True)
                elif severity == "high":
                    st.markdown(badge("warning", "HIGH"), unsafe_allow_html=True)
                elif severity == "medium":
                    st.markdown(badge("info", "MED"), unsafe_allow_html=True)
                else:
                    st.markdown(badge("success", "LOW"), unsafe_allow_html=True)

            with cols[5]:
                st.caption(country)
    else:
        st.success("✅ No recent threats detected")
        st.caption("The WAF is protecting your services.")

with tab3:
    st.markdown("### CrowdSec Security")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### Engine Status")
        st.markdown(f"- **CrowdSec**: {'🟢 Running' if cs_running else '🔴 Stopped'}")
        st.markdown(f"- **Bouncer**: {'🟢 Running' if cs_bouncer_running else '🔴 Stopped'}")
        st.markdown(f"- **Version**: {cs_version}")
        st.markdown(f"- **GeoIP**: {'✅ Enabled' if cs_geoip else '❌ Disabled'}")

    with col2:
        st.markdown("#### Statistics")
        st.markdown(f"- **Active Decisions**: {cs_decisions}")
        st.markdown(f"- **Alerts (24h)**: {cs_alerts}")
        st.markdown(f"- **Bouncers**: {cs_bouncers}")

    st.markdown("---")

    # Active decisions
    st.markdown("#### Active Bans")
    decisions = ubus.crowdsec_decisions(limit=30)

    if decisions:
        for decision in decisions[:20]:
            col1, col2, col3, col4 = st.columns([2, 3, 2, 1])

            with col1:
                ip = decision.get("value", decision.get("ip", "unknown"))
                st.code(ip, language=None)

            with col2:
                reason = decision.get("reason", decision.get("scenario", ""))
                if len(reason) > 40:
                    reason = reason[:37] + "..."
                st.caption(reason)

            with col3:
                origin = decision.get("origin", decision.get("source", "unknown"))
                if origin == "cscli":
                    st.markdown(badge("warning", "WAF"), unsafe_allow_html=True)
                elif origin == "crowdsec":
                    st.markdown(badge("info", "CAPI"), unsafe_allow_html=True)
                else:
                    st.caption(origin)

            with col4:
                duration = decision.get("duration", decision.get("remaining", ""))
                st.caption(duration)
    else:
        st.success("✅ No active bans")

with tab4:
    st.markdown("### Security Statistics")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("#### WAF Summary")
        st.metric("Threats Today", f"{waf_threats:,}" if isinstance(waf_threats, int) else waf_threats)
        st.metric("Auto-Bans Today", f"{waf_autobans:,}" if isinstance(waf_autobans, int) else waf_autobans)
        st.metric("Total Auto-Bans", f"{waf_autobans_total:,}" if isinstance(waf_autobans_total, int) else waf_autobans_total)
        st.metric("Pending Bans", f"{waf_autobans_pending:,}" if isinstance(waf_autobans_pending, int) else waf_autobans_pending)

    with col2:
        st.markdown("#### CrowdSec Summary")
        st.metric("Active Decisions", cs_decisions)
        st.metric("Alerts (24h)", cs_alerts)
        st.metric("Bouncers", cs_bouncers)
        st.metric("Status", "🟢 Active" if cs_running else "🔴 Inactive")

    st.markdown("---")

    # Raw data for debugging
    with st.expander("🔍 Raw Status Data", expanded=False):
        st.markdown("**mitmproxy response:**")
        st.json(mitmproxy)
        st.markdown("**crowdsec response:**")
        st.json(crowdsec)
