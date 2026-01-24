"""
Metabolizer CMS - SecuBox Blog Management
Main entry point with navigation sidebar
"""
import streamlit as st

st.set_page_config(
    page_title="Metabolizer CMS",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Cyberpunk styling
st.markdown("""
<style>
/* CRT Monitor Effect */
@keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
}

.stApp {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
}

/* Neon glow effect */
h1, h2, h3 {
    color: #ff5f1f !important;
    text-shadow: 0 0 10px rgba(255, 95, 31, 0.5);
}

/* Sidebar styling */
.css-1d391kg {
    background: rgba(10, 10, 20, 0.95);
    border-right: 1px solid #ff5f1f;
}

/* Button styling */
.stButton > button {
    background: transparent;
    border: 1px solid #ff5f1f;
    color: #ff5f1f;
    transition: all 0.3s ease;
}

.stButton > button:hover {
    background: rgba(255, 95, 31, 0.2);
    box-shadow: 0 0 15px rgba(255, 95, 31, 0.3);
}

/* Text area styling */
.stTextArea textarea {
    background: #0a0a0a;
    border: 1px solid #333;
    color: #00ff88;
    font-family: 'Courier New', monospace;
}

/* Success/Error messages */
.stSuccess {
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid #00ff88;
}

.stError {
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid #ff4444;
}

/* Metric styling */
.css-1xarl3l {
    background: rgba(20, 20, 30, 0.8);
    border: 1px solid #333;
    border-radius: 8px;
    padding: 10px;
}

/* Code blocks */
code {
    color: #0ff !important;
    background: rgba(0, 255, 255, 0.1) !important;
}
</style>
""", unsafe_allow_html=True)

# Header
st.title("📝 METABOLIZER CMS")
st.markdown("### Neural Blog Matrix for SecuBox")

# Quick stats in columns
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Status", "ONLINE", delta="Active")
with col2:
    st.metric("Posts", "0", delta=None)
with col3:
    st.metric("Drafts", "0", delta=None)
with col4:
    st.metric("Pipeline", "Ready")

st.divider()

# Navigation info
st.info("""
**Navigation:** Use the sidebar to access different sections:
- **Editor** - Create and edit blog posts with live preview
- **Posts** - Manage published posts
- **Media** - Upload and manage images
- **Settings** - Configure Git and Hexo integration
""")

# Quick actions
st.subheader("Quick Actions")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("📝 New Post", use_container_width=True):
        st.switch_page("pages/1_editor.py")

with col2:
    if st.button("🔄 Sync & Build", use_container_width=True):
        import subprocess
        with st.spinner("Building..."):
            result = subprocess.run(
                ['/usr/sbin/metabolizerctl', 'build'],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                st.success("Build complete!")
            else:
                st.error(f"Build failed: {result.stderr}")

with col3:
    if st.button("🌐 View Blog", use_container_width=True):
        st.markdown("[Open Blog](/blog/)", unsafe_allow_html=True)

# Footer
st.divider()
st.caption("Metabolizer CMS v1.0 | SecuBox Blog Pipeline")
