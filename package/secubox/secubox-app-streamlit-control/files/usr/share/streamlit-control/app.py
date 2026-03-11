"""
SecuBox Control - Streamlit-based LuCI Dashboard
Main application entry point
"""

import streamlit as st
import sys
import os

# Add lib to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib.auth import require_auth, show_user_menu, can_write
from lib.widgets import page_header, metric_row, badge, status_card, auto_refresh_toggle

# Page configuration
st.set_page_config(
    page_title="SecuBox Control",
    page_icon="🎛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for KISS theme
st.markdown("""
<style>
    /* Dark theme adjustments */
    .stApp {
        background-color: #0a0a1a;
    }

    /* Card styling */
    .status-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 1em;
        margin: 0.5em 0;
    }

    /* Badge styling */
    .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.85em;
        margin-right: 4px;
    }

    /* Table styling */
    .data-table {
        width: 100%;
        border-collapse: collapse;
    }
    .data-table th, .data-table td {
        padding: 0.75em;
        text-align: left;
        border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    /* Button styling */
    .action-btn {
        padding: 0.25em 0.5em;
        margin: 2px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.2);
        background: transparent;
        color: inherit;
        cursor: pointer;
    }
    .action-btn:hover {
        background: rgba(255,255,255,0.1);
    }

    /* Sidebar styling */
    .css-1d391kg {
        background-color: #0f0f2a;
    }

    /* Hide Streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}

    /* Primary accent color */
    .stButton>button[kind="primary"] {
        background-color: #00d4ff;
        color: #000;
    }
</style>
""", unsafe_allow_html=True)

# Require authentication
ubus = require_auth()

# Check if limited user
is_limited = st.session_state.get("is_secubox_user", False)

# Sidebar
st.sidebar.markdown("## 🎛️ SecuBox Control")
st.sidebar.markdown("---")
show_user_menu()
st.sidebar.markdown("---")

# Navigation hint
st.sidebar.markdown("""
**Navigation**
- Use sidebar menu for pages
- Or keyboard: `Ctrl+K`
""")

# Show banner for limited users
if is_limited:
    st.warning("👤 Logged in as SecuBox user with limited permissions. For full access, login as root.")

# Main content - Home Dashboard
page_header("Dashboard", "System overview and quick actions", "🏠")

# Auto-refresh toggle
auto_refresh_toggle("dashboard", intervals=[10, 30, 60])
st.markdown("")

# Fetch system data
with st.spinner("Loading system info..."):
    board_info = ubus.system_board()
    system_info = ubus.system_info()

# System info cards
col1, col2, col3, col4 = st.columns(4)

# Uptime
uptime_seconds = system_info.get("uptime", 0)
uptime_days = uptime_seconds // 86400
uptime_hours = (uptime_seconds % 86400) // 3600
uptime_str = f"{uptime_days}d {uptime_hours}h"

with col1:
    status_card(
        title="Uptime",
        value=uptime_str,
        subtitle="System running",
        icon="⏱️",
        color="#10b981"
    )

# Memory
memory = system_info.get("memory", {})
mem_total = memory.get("total", 1)
mem_free = memory.get("free", 0) + memory.get("buffered", 0) + memory.get("cached", 0)
mem_used_pct = int(100 * (mem_total - mem_free) / mem_total) if mem_total else 0

with col2:
    status_card(
        title="Memory",
        value=f"{mem_used_pct}%",
        subtitle=f"{(mem_total - mem_free) // 1024 // 1024}MB used",
        icon="🧠",
        color="#f59e0b" if mem_used_pct > 80 else "#00d4ff"
    )

# Load average
load = system_info.get("load", [0, 0, 0])
load_1m = load[0] / 65536 if load else 0

with col3:
    status_card(
        title="Load",
        value=f"{load_1m:.2f}",
        subtitle="1 min average",
        icon="📊",
        color="#ef4444" if load_1m > 2 else "#00d4ff"
    )

# Board info
hostname = board_info.get("hostname", "secubox")
model = board_info.get("model", "Unknown")

with col4:
    status_card(
        title="Host",
        value=hostname,
        subtitle=model[:30],
        icon="🖥️",
        color="#7c3aed"
    )

st.markdown("---")

# Service Status Section
st.markdown("### 🔧 Services")

# Fetch service statuses
with st.spinner("Loading services..."):
    try:
        lxc_containers = ubus.lxc_list()
    except:
        lxc_containers = []

    try:
        mitmproxy_status = ubus.mitmproxy_status()
    except:
        mitmproxy_status = {}

    try:
        haproxy_status = ubus.haproxy_status()
    except:
        haproxy_status = {}

# Count running containers
running_containers = sum(1 for c in lxc_containers if c.get("state") == "RUNNING")
total_containers = len(lxc_containers)

# Service cards row
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="status-card">
        <div style="font-size:1.5em;">📦 Containers</div>
        <div style="font-size:2em; color:#00d4ff;">{running_containers}/{total_containers}</div>
        <div style="color:#888;">Running / Total</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    waf_running = mitmproxy_status.get("running", False)
    waf_color = "#10b981" if waf_running else "#ef4444"
    waf_text = "Running" if waf_running else "Stopped"
    st.markdown(f"""
    <div class="status-card">
        <div style="font-size:1.5em;">🛡️ WAF</div>
        <div style="font-size:2em; color:{waf_color};">{waf_text}</div>
        <div style="color:#888;">mitmproxy-in</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    haproxy_running = haproxy_status.get("running", False)
    hp_color = "#10b981" if haproxy_running else "#ef4444"
    hp_text = "Running" if haproxy_running else "Stopped"
    vhost_count = haproxy_status.get("vhost_count", 0)
    st.markdown(f"""
    <div class="status-card">
        <div style="font-size:1.5em;">🌐 HAProxy</div>
        <div style="font-size:2em; color:{hp_color};">{hp_text}</div>
        <div style="color:#888;">{vhost_count} vhosts</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="status-card">
        <div style="font-size:1.5em;">🔒 SSL</div>
        <div style="font-size:2em; color:#10b981;">Active</div>
        <div style="color:#888;">Let's Encrypt</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("---")

# Quick Actions Section
st.markdown("### ⚡ Quick Actions")

col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button("🌐 Manage Sites", use_container_width=True):
        st.switch_page("pages/2_🌐_Sites.py")

with col2:
    if st.button("📦 Containers", use_container_width=True):
        st.switch_page("pages/4_📦_Containers.py")

with col3:
    if st.button("🛡️ Security", use_container_width=True):
        st.switch_page("pages/6_🛡️_Security.py")

with col4:
    if st.button("⚙️ System", use_container_width=True):
        st.switch_page("pages/7_⚙️_System.py")

st.markdown("---")

# Container List (Quick View)
if lxc_containers:
    st.markdown("### 📦 Container Status")

    # Sort by state (running first)
    sorted_containers = sorted(
        lxc_containers,
        key=lambda x: (0 if x.get("state") == "RUNNING" else 1, x.get("name", ""))
    )

    for container in sorted_containers[:8]:  # Show top 8
        name = container.get("name", "unknown")
        state = container.get("state", "UNKNOWN")

        col1, col2, col3 = st.columns([3, 1, 1])

        with col1:
            st.write(f"**{name}**")

        with col2:
            if state == "RUNNING":
                st.markdown(badge("running"), unsafe_allow_html=True)
            else:
                st.markdown(badge("stopped"), unsafe_allow_html=True)

        with col3:
            if can_write():
                if state == "RUNNING":
                    if st.button("Stop", key=f"stop_{name}", type="secondary"):
                        with st.spinner(f"Stopping {name}..."):
                            ubus.lxc_stop(name)
                        st.rerun()
                else:
                    if st.button("Start", key=f"start_{name}", type="primary"):
                        with st.spinner(f"Starting {name}..."):
                            ubus.lxc_start(name)
                        st.rerun()
            else:
                st.caption("View only")

    if len(lxc_containers) > 8:
        st.caption(f"... and {len(lxc_containers) - 8} more containers")

# Footer
st.markdown("---")
st.caption("SecuBox Control v1.0 - Streamlit-based Dashboard")
