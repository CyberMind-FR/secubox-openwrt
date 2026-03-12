"""
APPNAME - Basic Streamlit App
Created with Streamlit Forge
"""
import streamlit as st

st.set_page_config(
    page_title="APPNAME",
    page_icon="🚀",
    layout="wide"
)

st.title("APPNAME")

st.markdown("""
Welcome to your new Streamlit app!

Edit this file to customize your application.
""")

# Sidebar
st.sidebar.header("Settings")
name = st.sidebar.text_input("Your name", "World")

# Main content
st.header(f"Hello, {name}!")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Quick Start")
    st.markdown("""
    1. Edit `app.py` to add your content
    2. Add dependencies to `requirements.txt`
    3. Run `streamlitctl restart APPNAME`
    """)

with col2:
    st.subheader("Resources")
    st.markdown("""
    - [Streamlit Docs](https://docs.streamlit.io)
    - [Streamlit Gallery](https://streamlit.io/gallery)
    - [Streamlit Forge Guide](/docs)
    """)

# Footer
st.markdown("---")
st.caption("Created with Streamlit Forge | SecuBox")
