"""
SecuBox Streamlit - Default Demo App
CyberMind Neural Data Platform
"""
import streamlit as st
import time
from datetime import datetime

# Page config
st.set_page_config(
    page_title="SecuBox Streamlit",
    page_icon="⚡",
    layout="wide"
)

# Cyberpunk CSS
st.markdown("""
<style>
.stApp {
    background-color: #0a0a0f;
    background-image:
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
}

h1 {
    color: #0ff !important;
    text-shadow: 0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff;
    font-family: 'Courier New', monospace !important;
    letter-spacing: 3px;
}

h3 {
    color: #0ff !important;
    text-shadow: 0 0 5px #0ff;
}

.stMetric {
    background: rgba(0, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 255, 0.2);
    border-radius: 10px;
    padding: 10px;
}

.stMetric label {
    color: #0ff !important;
}

.stMetric [data-testid="stMetricValue"] {
    color: #fff !important;
    text-shadow: 0 0 5px #0ff;
}

.stAlert {
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid #0ff;
}

.stButton button {
    background: linear-gradient(135deg, #0ff, #00a0a0);
    color: #000;
    border: none;
    font-weight: bold;
    text-transform: uppercase;
}

.stButton button:hover {
    box-shadow: 0 0 20px #0ff;
}

/* CRT scanline effect */
.stApp::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.1) 0px,
        rgba(0, 0, 0, 0.1) 1px,
        transparent 1px,
        transparent 2px
    );
    z-index: 1000;
}
</style>
""", unsafe_allow_html=True)

# Header
st.title("⚡ SECUBOX STREAMLIT ⚡")
st.markdown("### Neural Data App Platform")

# Metrics row
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Status", "ONLINE", delta="Active")

with col2:
    st.metric("Platform", "SecuBox", delta="v1.0")

with col3:
    st.metric("Python", "3.12", delta="Latest")

with col4:
    current_time = datetime.now().strftime("%H:%M:%S")
    st.metric("System Time", current_time)

st.divider()

# Info section
col_left, col_right = st.columns(2)

with col_left:
    st.markdown("### System Info")
    st.info("""
    **Streamlit Data Platform**

    Deploy your Python data apps with ease:
    - Interactive dashboards
    - Data visualization
    - Machine learning demos
    - Real-time analytics

    Manage apps via LuCI dashboard.
    """)

with col_right:
    st.markdown("### Quick Start")
    st.code("""
# Deploy a new app
streamlitctl app add myapp /path/to/app.py

# Switch active app
streamlitctl app run myapp

# List all apps
streamlitctl app list
    """, language="bash")

st.divider()

# Interactive demo
st.markdown("### Interactive Demo")

demo_col1, demo_col2 = st.columns(2)

with demo_col1:
    st.markdown("#### Data Generator")
    num_points = st.slider("Data Points", 10, 100, 50)

    import random
    data = [random.randint(0, 100) for _ in range(num_points)]
    st.line_chart(data)

with demo_col2:
    st.markdown("#### User Input")
    user_name = st.text_input("Enter your name", "CyberMind")

    if st.button("Greet"):
        st.success(f"Welcome to SecuBox, {user_name}! ⚡")

# Footer
st.divider()
st.markdown("""
<div style="text-align: center; color: #0ff; font-family: 'Courier New', monospace;">
    <small>SecuBox Streamlit Platform | CyberMind Studio | 2025</small>
</div>
""", unsafe_allow_html=True)
