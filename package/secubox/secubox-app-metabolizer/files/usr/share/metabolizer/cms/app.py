"""
Metabolizer CMS - SecuBox Blog Management
Multi-page Streamlit app for blog content management
"""
import streamlit as st
import os
from pathlib import Path

# Configuration
CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))

st.set_page_config(
    page_title="Metabolizer CMS",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
.stApp { background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); }
h1, h2, h3 { color: #58a6ff !important; }
.stMetric { background: rgba(22, 27, 34, 0.8); border-radius: 8px; padding: 10px; }
.stButton>button { border: 1px solid #30363d; background: #21262d; color: #c9d1d9; }
.stButton>button:hover { background: #30363d; border-color: #58a6ff; }
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/blog.png", width=64)
    st.title("Metabolizer")
    st.caption("SecuBox Blog CMS")
    st.divider()

    # Content path status
    if CONTENT_PATH.exists():
        post_count = len(list((CONTENT_PATH / "_posts").glob("*.md"))) if (CONTENT_PATH / "_posts").exists() else 0
        draft_count = len(list((CONTENT_PATH / "_drafts").glob("*.md"))) if (CONTENT_PATH / "_drafts").exists() else 0
        st.success(f"📁 Content: {post_count} posts, {draft_count} drafts")
    else:
        st.warning("📁 Content path not found")

    st.divider()
    st.caption("v1.0.0 | CyberMind Studio")

# Main content
st.title("📝 Metabolizer CMS")
st.markdown("### Blog Content Management System")

# Status cards
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Status", "ONLINE", delta="Active")

with col2:
    posts = len(list((CONTENT_PATH / "_posts").glob("*.md"))) if (CONTENT_PATH / "_posts").exists() else 0
    st.metric("Published", posts)

with col3:
    drafts = len(list((CONTENT_PATH / "_drafts").glob("*.md"))) if (CONTENT_PATH / "_drafts").exists() else 0
    st.metric("Drafts", drafts)

with col4:
    git_ok = (CONTENT_PATH / ".git").exists()
    st.metric("Git", "Connected" if git_ok else "Not Init")

st.divider()

# Quick start guide
st.subheader("🚀 Quick Start")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    **Navigation** (use sidebar pages):
    - **✏️ Editor** - Create new posts with live preview
    - **📚 Posts** - Manage published posts and drafts
    - **🖼️ Media** - Upload and manage images
    - **⚙️ Settings** - Git sync and configuration
    """)

with col2:
    st.markdown("""
    **Workflow**:
    1. Write posts in the **Editor**
    2. Save as draft or publish directly
    3. Posts sync to **Gitea** repository
    4. **HexoJS** generates static site
    5. View blog at `/blog/`
    """)

st.divider()

# Recent activity
st.subheader("📋 Recent Posts")

posts_path = CONTENT_PATH / "_posts"
if posts_path.exists():
    posts = sorted(posts_path.glob("*.md"), reverse=True)[:5]
    if posts:
        for post in posts:
            with st.container():
                cols = st.columns([4, 1])
                with cols[0]:
                    st.markdown(f"📄 **{post.stem}**")
                with cols[1]:
                    st.caption(post.stat().st_mtime)
    else:
        st.info("No posts yet. Create your first post in the Editor!")
else:
    st.warning("Content directory not initialized. Go to Settings to set up.")

# Footer
st.divider()
st.caption("Metabolizer CMS | Powered by Streamlit + Gitea + HexoJS")
