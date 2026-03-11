"""
System Management
Packages, Services, Logs
"""

import streamlit as st
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.auth import require_auth, show_user_menu
from lib.widgets import page_header

st.set_page_config(page_title="System - SecuBox Control", page_icon="⚙️", layout="wide")

ubus = require_auth()
st.sidebar.markdown("## 🎛️ SecuBox Control")
show_user_menu()

page_header("System", "Packages, services, logs, backup", "⚙️")

# Tabs
tab1, tab2, tab3 = st.tabs(["📋 System Info", "📦 Packages", "📜 Logs"])

with tab1:
    st.markdown("### System Information")

    board = ubus.system_board()
    info = ubus.system_info()

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Board**")
        st.json({
            "hostname": board.get("hostname", ""),
            "model": board.get("model", ""),
            "board_name": board.get("board_name", ""),
            "kernel": board.get("kernel", ""),
            "system": board.get("system", ""),
        })

    with col2:
        st.markdown("**Resources**")

        memory = info.get("memory", {})
        st.json({
            "uptime": f"{info.get('uptime', 0) // 3600}h",
            "memory_total": f"{memory.get('total', 0) // 1024 // 1024}MB",
            "memory_free": f"{memory.get('free', 0) // 1024 // 1024}MB",
            "load": info.get("load", [0, 0, 0]),
        })

with tab2:
    st.markdown("### Installed Packages")
    st.info("Package management coming in Phase 5")

with tab3:
    st.markdown("### System Logs")

    if st.button("Refresh Logs"):
        st.rerun()

    # Get recent logs via file read
    logs = ubus.file_exec("/usr/bin/logread", ["-l", "50"])
    if logs and logs.get("stdout"):
        st.code(logs["stdout"], language="")
    else:
        st.info("No logs available")
