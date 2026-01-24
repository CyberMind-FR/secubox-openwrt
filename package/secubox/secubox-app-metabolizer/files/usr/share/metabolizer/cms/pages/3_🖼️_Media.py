"""
Metabolizer CMS - Media Library
"""
import streamlit as st
from pathlib import Path
import subprocess
import os

CONTENT_PATH = Path(os.environ.get('METABOLIZER_CONTENT', '/srv/content'))
MEDIA_PATH = CONTENT_PATH / "images"

st.set_page_config(page_title="Media", page_icon="🖼️", layout="wide")
st.title("🖼️ Media Library")

MEDIA_PATH.mkdir(parents=True, exist_ok=True)

def git_commit(msg):
    subprocess.run(['git', 'add', '-A'], cwd=CONTENT_PATH, capture_output=True)
    subprocess.run(['git', 'commit', '-m', msg], cwd=CONTENT_PATH, capture_output=True)
    subprocess.run(['git', 'push'], cwd=CONTENT_PATH, capture_output=True)

# Upload
st.subheader("📤 Upload")
uploaded = st.file_uploader("Choose images", type=['png', 'jpg', 'jpeg', 'gif', 'webp'], accept_multiple_files=True)

if uploaded:
    for f in uploaded:
        save_path = MEDIA_PATH / f.name
        save_path.write_bytes(f.getbuffer())
        st.success(f"Uploaded: {f.name}")
        st.code(f"![{f.name}](/images/{f.name})")
    git_commit(f"Add {len(uploaded)} images")
    st.rerun()

st.divider()

# Gallery
st.subheader("📁 Library")

images = list(MEDIA_PATH.glob("*"))
images = [i for i in images if i.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']]

if images:
    st.caption(f"{len(images)} files")
    cols = st.columns(4)

    for idx, img in enumerate(sorted(images, key=lambda x: x.stat().st_mtime, reverse=True)):
        col = cols[idx % 4]
        with col:
            try:
                st.image(str(img), use_container_width=True)
            except:
                st.markdown(f"📄 {img.name}")

            size = img.stat().st_size
            size_str = f"{size/1024:.1f}KB" if size < 1024*1024 else f"{size/1024/1024:.1f}MB"
            st.caption(f"{img.name} ({size_str})")

            col1, col2 = st.columns(2)
            with col1:
                if st.button("📋", key=f"copy_{img.name}", help="Copy markdown"):
                    st.code(f"![{img.name}](/images/{img.name})")
            with col2:
                if st.button("🗑️", key=f"del_{img.name}", help="Delete"):
                    img.unlink()
                    git_commit(f"Delete: {img.name}")
                    st.rerun()
else:
    st.info("No images yet. Upload some above!")

# Sync
st.divider()
if st.button("🔄 Sync Media", use_container_width=True):
    git_commit("Sync media")
    st.success("Media synced!")
