"""
Metabolizer CMS - Markdown Editor
"""
import streamlit as st
from datetime import datetime
from pathlib import Path
import subprocess
import os

CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

st.set_page_config(page_title="Editor", page_icon="✏️", layout="wide")

# Ensure directories exist
POSTS_PATH.mkdir(parents=True, exist_ok=True)
DRAFTS_PATH.mkdir(parents=True, exist_ok=True)

st.title("✏️ Post Editor")

# Session state
if 'content' not in st.session_state:
    st.session_state.content = ""
if 'title' not in st.session_state:
    st.session_state.title = ""

# Layout
col_edit, col_preview = st.columns(2)

with col_edit:
    st.subheader("Write")

    # Metadata
    title = st.text_input("Title", value=st.session_state.title)

    col1, col2 = st.columns(2)
    with col1:
        date = st.date_input("Date", value=datetime.now())
    with col2:
        categories = st.multiselect("Categories",
            ["Tech", "Security", "Tutorial", "News", "Review"], default=[])

    tags = st.text_input("Tags", placeholder="tag1, tag2, tag3")
    excerpt = st.text_area("Excerpt", height=60, placeholder="Brief description...")

    # Content
    content = st.text_area("Content (Markdown)", value=st.session_state.content,
        height=350, placeholder="Write your post here...")

    st.session_state.content = content
    st.session_state.title = title

with col_preview:
    st.subheader("Preview")

    if title:
        st.markdown(f"# {title}")
        st.caption(f"📅 {date} | 🏷️ {', '.join(categories) if categories else 'Uncategorized'}")
        if excerpt:
            st.info(excerpt)
        st.divider()

    if content:
        st.markdown(content)
    else:
        st.markdown("*Start typing to see preview...*")

# Actions
st.divider()

def make_slug(text):
    return "".join(c if c.isalnum() else "-" for c in text.lower()).strip("-")

def make_frontmatter():
    lines = ["---", f"title: \"{title}\"", f"date: {date}"]
    if categories:
        lines.append(f"categories: [{', '.join(categories)}]")
    if tags:
        lines.append(f"tags: [{', '.join(t.strip() for t in tags.split(','))}]")
    if excerpt:
        lines.append(f"excerpt: \"{excerpt}\"")
    lines.extend(["---", ""])
    return "\n".join(lines)

def save_file(path):
    filename = f"{date}-{make_slug(title)}.md"
    filepath = path / filename
    filepath.write_text(make_frontmatter() + content)
    return filepath

def git_push(msg):
    try:
        subprocess.run(['git', 'add', '-A'], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'commit', '-m', msg], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'push'], cwd=CONTENT_PATH, capture_output=True)
        return True
    except:
        return False

col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button("💾 Save Draft", use_container_width=True):
        if title and content:
            fp = save_file(DRAFTS_PATH)
            st.success(f"Saved: {fp.name}")
        else:
            st.error("Title and content required")

with col2:
    if st.button("📤 Publish", use_container_width=True, type="primary"):
        if title and content:
            fp = save_file(POSTS_PATH)
            with st.spinner("Publishing..."):
                git_push(f"Add: {title}")
            st.success(f"Published: {fp.name}")
        else:
            st.error("Title and content required")

with col3:
    if st.button("🔄 Sync", use_container_width=True):
        subprocess.run(['git', 'pull'], cwd=CONTENT_PATH, capture_output=True)
        st.success("Synced!")

with col4:
    if st.button("🗑️ Clear", use_container_width=True):
        st.session_state.content = ""
        st.session_state.title = ""
        st.rerun()
