"""
Metabolizer CMS - Post Management
"""
import streamlit as st
from pathlib import Path
from datetime import datetime
import subprocess
import os
import re

st.set_page_config(page_title="Posts - Metabolizer", page_icon="📚", layout="wide")

# Paths
CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

st.title("📚 Post Management")

def parse_frontmatter(filepath):
    """Parse YAML front matter from markdown file (without yaml module)"""
    try:
        content = filepath.read_text()
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                fm_text = parts[1].strip()
                body = parts[2].strip()

                # Simple parsing
                fm = {}
                for line in fm_text.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        # Handle arrays
                        if value.startswith('[') and value.endswith(']'):
                            value = [v.strip().strip('"\'') for v in value[1:-1].split(',') if v.strip()]
                        elif value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        fm[key] = value
                return fm, body
    except Exception as e:
        pass
    return {}, ""

def get_posts(path):
    """Get all posts from a directory"""
    posts = []
    if path.exists():
        for f in sorted(path.glob("*.md"), reverse=True):
            fm, body = parse_frontmatter(f)
            posts.append({
                'filename': f.name,
                'path': f,
                'title': fm.get('title', f.stem),
                'date': fm.get('date', ''),
                'categories': fm.get('categories', []),
                'tags': fm.get('tags', []),
                'excerpt': fm.get('excerpt', body[:150] + '...' if len(body) > 150 else body),
                'body': body
            })
    return posts

def git_commit_push(message):
    """Commit and push to Gitea"""
    try:
        subprocess.run(['git', 'add', '-A'], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'commit', '-m', message], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'push', 'origin', 'master'], cwd=CONTENT_PATH, capture_output=True)
    except:
        pass

# Tabs for Published and Drafts
tab1, tab2 = st.tabs(["📰 Published", "📝 Drafts"])

with tab1:
    posts = get_posts(POSTS_PATH)

    if not posts:
        st.info("No published posts yet. Create your first post in the Editor!")
    else:
        st.write(f"**{len(posts)} published posts**")

        for post in posts:
            with st.expander(f"📄 {post['title']}", expanded=False):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.caption(f"📅 {post['date']}")
                    if post['categories']:
                        cats = post['categories'] if isinstance(post['categories'], list) else [post['categories']]
                        st.caption(f"📁 {', '.join(cats)}")
                    if post['tags']:
                        tags = post['tags'] if isinstance(post['tags'], list) else [post['tags']]
                        st.caption(f"🏷️ {', '.join(tags)}")
                    st.markdown(post['excerpt'])

                with col2:
                    if st.button("✏️ Edit", key=f"edit_{post['filename']}"):
                        st.session_state.post_title = post['title']
                        st.session_state.post_content = post['body']
                        st.switch_page("pages/1_editor.py")

                    if st.button("🗑️ Delete", key=f"del_{post['filename']}"):
                        post['path'].unlink()
                        git_commit_push(f"Delete post: {post['title']}")
                        st.success(f"Deleted: {post['filename']}")
                        st.rerun()

                    if st.button("📥 Unpublish", key=f"unpub_{post['filename']}"):
                        DRAFTS_PATH.mkdir(parents=True, exist_ok=True)
                        new_path = DRAFTS_PATH / post['filename']
                        post['path'].rename(new_path)
                        git_commit_push(f"Unpublish: {post['title']}")
                        st.success(f"Moved to drafts")
                        st.rerun()

with tab2:
    drafts = get_posts(DRAFTS_PATH)

    if not drafts:
        st.info("No drafts. Save a draft from the Editor!")
    else:
        st.write(f"**{len(drafts)} drafts**")

        for draft in drafts:
            with st.expander(f"📝 {draft['title']}", expanded=False):
                col1, col2 = st.columns([3, 1])

                with col1:
                    st.caption(f"📅 {draft['date']}")
                    st.markdown(draft['excerpt'])

                with col2:
                    if st.button("✏️ Edit", key=f"edit_draft_{draft['filename']}"):
                        st.session_state.post_title = draft['title']
                        st.session_state.post_content = draft['body']
                        st.switch_page("pages/1_editor.py")

                    if st.button("📤 Publish", key=f"pub_{draft['filename']}"):
                        POSTS_PATH.mkdir(parents=True, exist_ok=True)
                        new_path = POSTS_PATH / draft['filename']
                        draft['path'].rename(new_path)
                        git_commit_push(f"Publish: {draft['title']}")
                        st.success(f"Published!")
                        st.rerun()

                    if st.button("🗑️ Delete", key=f"del_draft_{draft['filename']}"):
                        draft['path'].unlink()
                        st.success(f"Deleted")
                        st.rerun()

# Sync action
st.divider()
col1, col2 = st.columns(2)

with col1:
    if st.button("🔄 Sync from Git", use_container_width=True):
        with st.spinner("Syncing..."):
            try:
                subprocess.run(['git', 'pull', 'origin', 'master'], cwd=CONTENT_PATH, capture_output=True)
                st.success("Synced!")
                st.rerun()
            except:
                st.error("Sync failed")

with col2:
    if st.button("📤 Push to Git", use_container_width=True):
        with st.spinner("Pushing..."):
            git_commit_push("Update posts")
            st.success("Pushed!")
