"""
KISS-themed UI widgets for Streamlit Control
Inspired by luci-app-metablogizer design
"""

import streamlit as st
from typing import List, Dict, Callable, Optional, Any
import io

# Try to import qrcode, fallback gracefully
try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False


# ==========================================
# Status Badges
# ==========================================

BADGE_STYLES = {
    "running": ("Running", "#d4edda", "#155724"),
    "stopped": ("Stopped", "#f8d7da", "#721c24"),
    "ssl_ok": ("SSL OK", "#d4edda", "#155724"),
    "ssl_warn": ("SSL Warn", "#fff3cd", "#856404"),
    "ssl_none": ("No SSL", "#f8d7da", "#721c24"),
    "private": ("Private", "#e2e3e5", "#383d41"),
    "auth": ("Auth", "#cce5ff", "#004085"),
    "waf": ("WAF", "#d1ecf1", "#0c5460"),
    "error": ("Error", "#f8d7da", "#721c24"),
    "warning": ("Warning", "#fff3cd", "#856404"),
    "success": ("OK", "#d4edda", "#155724"),
    "info": ("Info", "#cce5ff", "#004085"),
    "empty": ("Empty", "#fff3cd", "#856404"),
}


def badge(status: str, label: str = None) -> str:
    """
    Return HTML for a colored status badge.

    Args:
        status: Badge type (running, stopped, ssl_ok, etc.)
        label: Optional custom label (overrides default)
    """
    default_label, bg, color = BADGE_STYLES.get(
        status, ("Unknown", "#f8f9fa", "#6c757d")
    )
    text = label or default_label
    return f'<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:{bg};color:{color};font-size:0.85em;margin-right:4px">{text}</span>'


def badges_html(*args) -> str:
    """Combine multiple badges into HTML string"""
    return "".join(args)


def show_badge(status: str, label: str = None):
    """Display a single badge using st.markdown"""
    st.markdown(badge(status, label), unsafe_allow_html=True)


# ==========================================
# Status Cards
# ==========================================

def status_card(title: str, value: Any, subtitle: str = "", icon: str = "", color: str = "#00d4ff"):
    """
    Display a metric card with KISS styling.
    """
    st.markdown(f"""
    <div style="
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 1em;
        text-align: center;
    ">
        <div style="font-size:2em; color:{color};">{icon} {value}</div>
        <div style="font-size:1.1em; font-weight:500; margin-top:0.3em;">{title}</div>
        <div style="font-size:0.85em; color:#888;">{subtitle}</div>
    </div>
    """, unsafe_allow_html=True)


def metric_row(metrics: List[Dict]):
    """
    Display a row of metric cards.

    Args:
        metrics: List of dicts with keys: title, value, subtitle, icon, color
    """
    cols = st.columns(len(metrics))
    for col, m in zip(cols, metrics):
        with col:
            status_card(
                title=m.get("title", ""),
                value=m.get("value", ""),
                subtitle=m.get("subtitle", ""),
                icon=m.get("icon", ""),
                color=m.get("color", "#00d4ff")
            )


# ==========================================
# Data Tables
# ==========================================

def status_table(
    data: List[Dict],
    columns: Dict[str, str],
    badge_columns: Dict[str, Callable] = None,
    key_prefix: str = "table"
):
    """
    Display a data table with status badges.

    Args:
        data: List of row dicts
        columns: Map of key -> display name
        badge_columns: Map of key -> function(value) returning badge HTML
        key_prefix: Unique prefix for widget keys
    """
    if not data:
        st.info("No data to display")
        return

    # Build header
    header_cols = st.columns(len(columns))
    for i, (key, name) in enumerate(columns.items()):
        header_cols[i].markdown(f"**{name}**")

    st.markdown("---")

    # Build rows
    for idx, row in enumerate(data):
        row_cols = st.columns(len(columns))
        for i, (key, name) in enumerate(columns.items()):
            value = row.get(key, "")

            # Apply badge function if defined
            if badge_columns and key in badge_columns:
                html = badge_columns[key](value, row)
                row_cols[i].markdown(html, unsafe_allow_html=True)
            else:
                row_cols[i].write(value)


# ==========================================
# Action Buttons
# ==========================================

def action_button(
    label: str,
    key: str,
    style: str = "default",
    icon: str = "",
    help: str = None,
    disabled: bool = False
) -> bool:
    """
    Styled action button.

    Args:
        style: default, primary, danger, warning
    """
    button_type = "primary" if style == "primary" else "secondary"
    full_label = f"{icon} {label}".strip() if icon else label
    return st.button(full_label, key=key, type=button_type, help=help, disabled=disabled)


def action_buttons_row(actions: List[Dict], row_data: Dict, key_prefix: str):
    """
    Display a row of action buttons.

    Args:
        actions: List of {label, callback, style, icon, help}
        row_data: Data to pass to callbacks
        key_prefix: Unique key prefix
    """
    cols = st.columns(len(actions))
    for i, action in enumerate(actions):
        with cols[i]:
            key = f"{key_prefix}_{action['label']}_{i}"
            if action_button(
                label=action.get("label", ""),
                key=key,
                style=action.get("style", "default"),
                icon=action.get("icon", ""),
                help=action.get("help")
            ):
                if "callback" in action:
                    action["callback"](row_data)


# ==========================================
# Modals / Dialogs
# ==========================================

def confirm_dialog(
    title: str,
    message: str,
    confirm_label: str = "Confirm",
    cancel_label: str = "Cancel",
    danger: bool = False
) -> Optional[bool]:
    """
    Show confirmation dialog.
    Returns True if confirmed, False if cancelled, None if not interacted.
    """
    with st.expander(title, expanded=True):
        st.warning(message) if danger else st.info(message)
        col1, col2 = st.columns(2)
        with col1:
            if st.button(cancel_label, key=f"cancel_{title}"):
                return False
        with col2:
            btn_type = "primary" if not danger else "primary"
            if st.button(confirm_label, key=f"confirm_{title}", type=btn_type):
                return True
    return None


# ==========================================
# QR Code & Sharing
# ==========================================

def qr_code_image(url: str, size: int = 200):
    """Generate and display QR code for URL"""
    if not HAS_QRCODE:
        st.warning("QR code library not available")
        st.code(url)
        return

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    st.image(buf, width=size)


def share_buttons(url: str, title: str = ""):
    """Display social sharing buttons"""
    from urllib.parse import quote

    encoded_url = quote(url)
    encoded_title = quote(title) if title else ""

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.link_button(
            "Twitter",
            f"https://twitter.com/intent/tweet?url={encoded_url}&text={encoded_title}",
            use_container_width=True
        )
    with col2:
        st.link_button(
            "Telegram",
            f"https://t.me/share/url?url={encoded_url}&text={encoded_title}",
            use_container_width=True
        )
    with col3:
        st.link_button(
            "WhatsApp",
            f"https://wa.me/?text={encoded_title}%20{encoded_url}",
            use_container_width=True
        )
    with col4:
        st.link_button(
            "Email",
            f"mailto:?subject={encoded_title}&body={encoded_url}",
            use_container_width=True
        )


def share_modal(url: str, title: str = "Share"):
    """Complete share modal with QR and social buttons"""
    with st.expander(f"📤 {title}", expanded=False):
        st.text_input("URL", value=url, key=f"share_url_{url}", disabled=True)

        col1, col2 = st.columns([1, 2])
        with col1:
            qr_code_image(url, size=150)
        with col2:
            st.markdown("**Share via:**")
            share_buttons(url, title)

        if st.button("📋 Copy URL", key=f"copy_{url}"):
            st.code(url)
            st.success("URL displayed - copy from above")


# ==========================================
# Health Check Display
# ==========================================

def health_status_item(label: str, status: str, detail: str = ""):
    """Display single health check item"""
    if status in ("ok", "valid", "running"):
        icon = "✓"
        color = "green"
    elif status in ("error", "failed", "stopped"):
        icon = "✗"
        color = "red"
    elif status in ("warning", "expiring"):
        icon = "!"
        color = "orange"
    else:
        icon = "○"
        color = "gray"

    detail_text = f" ({detail})" if detail else ""
    st.markdown(f":{color}[{icon} **{label}**: {status}{detail_text}]")


def health_check_panel(health: Dict):
    """Display health check results panel"""
    st.markdown("### Health Check Results")

    checks = [
        ("Backend", health.get("backend_status", "unknown")),
        ("Frontend", health.get("frontend_status", "unknown")),
        ("SSL", health.get("ssl_status", "unknown"), health.get("ssl_days_remaining", "")),
        ("Content", "ok" if health.get("has_content") else "empty"),
    ]

    for check in checks:
        label = check[0]
        status = check[1]
        detail = check[2] if len(check) > 2 else ""
        health_status_item(label, str(status), str(detail) if detail else "")


# ==========================================
# Progress & Loading
# ==========================================

def async_operation(title: str, operation: Callable, *args, **kwargs):
    """
    Run async operation with progress display.
    Returns operation result.
    """
    with st.spinner(title):
        result = operation(*args, **kwargs)
    return result


# ==========================================
# Page Layout Helpers
# ==========================================

def page_header(title: str, description: str = "", icon: str = ""):
    """Standard page header"""
    st.markdown(f"# {icon} {title}" if icon else f"# {title}")
    if description:
        st.markdown(f"*{description}*")
    st.markdown("---")


def section_header(title: str, description: str = ""):
    """Section header within page"""
    st.markdown(f"### {title}")
    if description:
        st.caption(description)


# ==========================================
# Auto-refresh Component
# ==========================================

def auto_refresh_toggle(key: str = "auto_refresh", intervals: List[int] = None):
    """
    Display auto-refresh toggle and interval selector.

    Args:
        key: Session state key prefix
        intervals: List of refresh intervals in seconds

    Returns:
        Tuple of (enabled, interval_seconds)
    """
    import time

    if intervals is None:
        intervals = [5, 10, 30, 60]

    col1, col2, col3 = st.columns([1, 1, 2])

    with col1:
        enabled = st.toggle("Auto-refresh", key=f"{key}_enabled")

    with col2:
        if enabled:
            interval_labels = {5: "5s", 10: "10s", 30: "30s", 60: "1m"}
            interval = st.selectbox(
                "Interval",
                options=intervals,
                format_func=lambda x: interval_labels.get(x, f"{x}s"),
                key=f"{key}_interval",
                label_visibility="collapsed"
            )
        else:
            interval = 30

    with col3:
        if st.button("🔄 Refresh Now", key=f"{key}_manual"):
            st.rerun()

    # Handle auto-refresh
    if enabled:
        # Store last refresh time
        last_key = f"{key}_last_refresh"
        now = time.time()

        if last_key not in st.session_state:
            st.session_state[last_key] = now

        elapsed = now - st.session_state[last_key]
        if elapsed >= interval:
            st.session_state[last_key] = now
            time.sleep(0.1)  # Brief pause to prevent tight loop
            st.rerun()

        # Show countdown
        remaining = max(0, interval - elapsed)
        st.caption(f"Next refresh in {int(remaining)}s")

    return enabled, interval


def search_filter(items: List[Dict], search_key: str, search_fields: List[str]) -> List[Dict]:
    """
    Filter items based on search query stored in session state.

    Args:
        items: List of dicts to filter
        search_key: Session state key for search query
        search_fields: List of dict keys to search in

    Returns:
        Filtered list of items
    """
    query = st.session_state.get(search_key, "").lower().strip()

    if not query:
        return items

    filtered = []
    for item in items:
        for field in search_fields:
            value = str(item.get(field, "")).lower()
            if query in value:
                filtered.append(item)
                break

    return filtered


def filter_toolbar(key_prefix: str, filter_options: Dict[str, List[str]] = None):
    """
    Display search box and optional filter dropdowns.

    Args:
        key_prefix: Unique prefix for session state keys
        filter_options: Dict of filter_name -> list of options

    Returns:
        Dict with search query and selected filters
    """
    cols = st.columns([3] + [1] * len(filter_options or {}))

    with cols[0]:
        search = st.text_input(
            "Search",
            key=f"{key_prefix}_search",
            placeholder="Type to filter...",
            label_visibility="collapsed"
        )

    filters = {"search": search}

    if filter_options:
        for i, (name, options) in enumerate(filter_options.items(), 1):
            with cols[i]:
                selected = st.selectbox(
                    name,
                    options=["All"] + options,
                    key=f"{key_prefix}_filter_{name}",
                    label_visibility="collapsed"
                )
                filters[name] = selected if selected != "All" else None

    return filters


# ==========================================
# Container Card Component
# ==========================================

def container_card(
    name: str,
    state: str,
    memory_mb: int = 0,
    cpu_pct: float = 0,
    ip: str = "",
    actions_enabled: bool = True,
    key_prefix: str = ""
):
    """
    Display a container card with status and actions.

    Returns dict with triggered actions.
    """
    is_running = state == "RUNNING"
    state_color = "#10b981" if is_running else "#6b7280"

    with st.container():
        col1, col2, col3, col4 = st.columns([3, 1, 1, 2])

        with col1:
            st.markdown(f"**{name}**")
            if ip:
                st.caption(f"IP: {ip}")

        with col2:
            if is_running:
                st.markdown(badge("running"), unsafe_allow_html=True)
            else:
                st.markdown(badge("stopped"), unsafe_allow_html=True)

        with col3:
            if memory_mb > 0:
                st.caption(f"{memory_mb}MB")
            if cpu_pct > 0:
                st.caption(f"{cpu_pct:.1f}%")

        with col4:
            actions = {}
            if actions_enabled:
                c1, c2, c3 = st.columns(3)
                with c1:
                    if is_running:
                        if st.button("⏹️", key=f"{key_prefix}_stop_{name}", help="Stop"):
                            actions["stop"] = True
                    else:
                        if st.button("▶️", key=f"{key_prefix}_start_{name}", help="Start"):
                            actions["start"] = True
                with c2:
                    if st.button("🔄", key=f"{key_prefix}_restart_{name}", help="Restart"):
                        actions["restart"] = True
                with c3:
                    if st.button("ℹ️", key=f"{key_prefix}_info_{name}", help="Info"):
                        actions["info"] = True
            else:
                st.caption("View only")

            return actions
