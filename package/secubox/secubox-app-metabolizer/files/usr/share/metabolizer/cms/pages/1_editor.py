"""
Metabolizer CMS - Markdown Editor with Live Preview
"""
import streamlit as st
from datetime import datetime
from pathlib import Path
import subprocess
import os

st.set_page_config(page_title="Editor - Metabolizer", page_icon="✏️", layout="wide")

# Paths
CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
POSTS_PATH = CONTENT_PATH / "_posts"
DRAFTS_PATH = CONTENT_PATH / "_drafts"

# Ensure directories exist
POSTS_PATH.mkdir(parents=True, exist_ok=True)
DRAFTS_PATH.mkdir(parents=True, exist_ok=True)

st.title("✏️ Post Editor")

# Initialize session state
if 'post_content' not in st.session_state:
    st.session_state.post_content = ""
if 'post_title' not in st.session_state:
    st.session_state.post_title = ""

# Two-column layout: Editor | Preview
col_edit, col_preview = st.columns(2)

with col_edit:
    st.subheader("Editor")

    # Front Matter Section
    with st.expander("📋 Front Matter", expanded=True):
        title = st.text_input("Title", value=st.session_state.post_title, key="title_input")

        col1, col2 = st.columns(2)
        with col1:
            date = st.date_input("Date", value=datetime.now())
        with col2:
            time = st.time_input("Time", value=datetime.now().time())

        categories = st.multiselect(
            "Categories",
            ["Security", "Tutorial", "News", "Tech", "Review", "Guide"],
            default=[]
        )

        tags = st.text_input("Tags (comma-separated)", placeholder="linux, security, howto")

        excerpt = st.text_area("Excerpt", height=60, placeholder="Brief summary of the post...")

    # Markdown Content
    st.markdown("**Content (Markdown)**")
    content = st.text_area(
        "content",
        value=st.session_state.post_content,
        height=400,
        placeholder="""Write your post in Markdown...

## Heading

Regular paragraph with **bold** and *italic* text.

```python
# Code block
print("Hello, World!")
```

- List item 1
- List item 2

> Blockquote

[Link text](https://example.com)

![Image alt](/images/example.jpg)
""",
        label_visibility="collapsed"
    )

    # Update session state
    st.session_state.post_content = content
    st.session_state.post_title = title

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
col1, col2, col3, col4 = st.columns(4)

def generate_filename(title, date):
    """Generate Hexo-compatible filename"""
    slug = title.lower().replace(" ", "-").replace("'", "")
    slug = "".join(c for c in slug if c.isalnum() or c == "-")
    return f"{date}-{slug}.md"

def generate_frontmatter(title, date, time, categories, tags, excerpt):
    """Generate YAML front matter without yaml module"""
    lines = ["---"]
    lines.append(f"title: {title}")
    lines.append(f"date: {date} {time.strftime('%H:%M:%S')}")

    if categories:
        lines.append(f"categories: [{', '.join(categories)}]")
    else:
        lines.append("categories: []")

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        lines.append(f"tags: [{', '.join(tag_list)}]")
    else:
        lines.append("tags: []")

    if excerpt:
        lines.append(f"excerpt: \"{excerpt}\"")

    lines.append("---")
    lines.append("")
    return "\n".join(lines)

def save_post(path, title, date, time, categories, tags, excerpt, content):
    """Save post to file"""
    filename = generate_filename(title, date)
    filepath = path / filename

    frontmatter = generate_frontmatter(title, date, time, categories, tags, excerpt)
    full_content = frontmatter + content

    filepath.write_text(full_content)
    return filepath

def git_commit_push(message):
    """Commit and push to Gitea"""
    try:
        subprocess.run(['git', 'add', '-A'], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'commit', '-m', message], cwd=CONTENT_PATH, capture_output=True)
        subprocess.run(['git', 'push', 'origin', 'master'], cwd=CONTENT_PATH, capture_output=True)
    except:
        pass

with col1:
    if st.button("💾 Save Draft", use_container_width=True):
        if title and content:
            filepath = save_post(DRAFTS_PATH, title, date, time, categories, tags, excerpt, content)
            st.success(f"Draft saved: {filepath.name}")
        else:
            st.error("Title and content required")

with col2:
    if st.button("📤 Publish", use_container_width=True, type="primary"):
        if title and content:
            filepath = save_post(POSTS_PATH, title, date, time, categories, tags, excerpt, content)

            # Commit and push
            with st.spinner("Publishing..."):
                git_commit_push(f"Add post: {title}")

            st.success(f"Published: {filepath.name}")
            st.info("Post saved to repository")
        else:
            st.error("Title and content required")

with col3:
    if st.button("🔄 Sync", use_container_width=True):
        with st.spinner("Syncing..."):
            try:
                subprocess.run(['git', 'pull', 'origin', 'master'], cwd=CONTENT_PATH, capture_output=True)
                st.success("Synced!")
            except:
                st.error("Sync failed")

with col4:
    if st.button("🗑️ Clear", use_container_width=True):
        st.session_state.post_content = ""
        st.session_state.post_title = ""
        st.rerun()
