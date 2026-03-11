"""
Authentication module for Streamlit Control
Handles LuCI/ubus session management
"""

import streamlit as st
from typing import Optional
from lib.ubus_client import UbusClient


def get_ubus() -> Optional[UbusClient]:
    """Get authenticated ubus client from session state"""
    if "ubus" in st.session_state and st.session_state.get("authenticated"):
        return st.session_state.ubus
    return None


def require_auth() -> UbusClient:
    """
    Require authentication before showing page content.
    Call this at the top of every page.
    Returns authenticated UbusClient or stops execution.
    """
    # Initialize session state
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    if "ubus" not in st.session_state:
        st.session_state.ubus = UbusClient()

    # Check if already authenticated
    if st.session_state.authenticated:
        # Verify session is still valid
        if st.session_state.ubus.is_authenticated():
            return st.session_state.ubus
        else:
            # Session expired
            st.session_state.authenticated = False

    # Show login form
    show_login()
    st.stop()


def show_login():
    """Display login form"""
    st.set_page_config(
        page_title="SecuBox Control - Login",
        page_icon="🔐",
        layout="centered"
    )

    # Center the login form
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        st.markdown("""
        <div style="text-align:center; margin-bottom:2em;">
            <h1 style="color:#00d4ff;">🔐 SecuBox Control</h1>
            <p style="color:#888;">Streamlit-based System Dashboard</p>
        </div>
        """, unsafe_allow_html=True)

        with st.form("login_form"):
            username = st.text_input(
                "Username",
                value="",
                placeholder="root or SecuBox username"
            )
            password = st.text_input(
                "Password",
                type="password",
                placeholder="Enter password"
            )

            col_a, col_b = st.columns([1, 1])
            with col_b:
                submitted = st.form_submit_button(
                    "Login",
                    type="primary",
                    use_container_width=True
                )

            if submitted:
                if not username or not password:
                    st.error("Please enter username and password")
                else:
                    with st.spinner("Authenticating..."):
                        ubus = UbusClient()
                        if ubus.login(username, password):
                            st.session_state.authenticated = True
                            st.session_state.ubus = ubus
                            st.session_state.username = username
                            st.session_state.is_secubox_user = ubus.is_secubox_user
                            if ubus.is_secubox_user:
                                st.info("Logged in as SecuBox user (limited permissions)")
                            st.rerun()
                        else:
                            st.error("Invalid credentials. Check username and password.")

        st.markdown("""
        <div style="text-align:center; margin-top:2em; color:#666; font-size:0.9em;">
            <p>Login with:</p>
            <p>• <b>root</b> - Full system access</p>
            <p>• <b>SecuBox user</b> - Limited dashboard access</p>
        </div>
        """, unsafe_allow_html=True)


def logout():
    """Logout and clear session"""
    if "ubus" in st.session_state:
        st.session_state.ubus.logout()
    st.session_state.authenticated = False
    st.session_state.pop("ubus", None)
    st.session_state.pop("username", None)
    st.rerun()


def show_user_menu():
    """Show user menu in sidebar"""
    if st.session_state.get("authenticated"):
        username = st.session_state.get("username", "root")
        is_limited = st.session_state.get("is_secubox_user", False)
        role = "Limited" if is_limited else "Admin"
        st.sidebar.markdown(f"👤 **{username}** ({role})")
        if st.sidebar.button("Logout", key="logout_btn"):
            logout()


def can_write() -> bool:
    """
    Check if current user has write permissions.
    SecuBox users (non-root) are read-only.
    """
    return not st.session_state.get("is_secubox_user", False)


def is_admin() -> bool:
    """Check if current user is admin (root or similar)"""
    return not st.session_state.get("is_secubox_user", False)
