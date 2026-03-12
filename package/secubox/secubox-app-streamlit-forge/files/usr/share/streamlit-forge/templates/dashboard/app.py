"""
APPNAME - Dashboard Template
Multi-page dashboard with metrics, charts, and data tables
Created with Streamlit Forge
"""
import streamlit as st
import pandas as pd
import random
from datetime import datetime, timedelta

st.set_page_config(
    page_title="APPNAME Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 0.5rem;
        color: white;
    }
    .stMetric {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar Navigation
st.sidebar.title("APPNAME")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigation",
    ["Overview", "Analytics", "Data", "Settings"]
)

st.sidebar.markdown("---")
st.sidebar.caption(f"Last updated: {datetime.now().strftime('%H:%M:%S')}")

# Generate sample data
@st.cache_data
def generate_sample_data():
    dates = pd.date_range(end=datetime.now(), periods=30, freq='D')
    return pd.DataFrame({
        'date': dates,
        'users': [random.randint(100, 500) for _ in range(30)],
        'revenue': [random.randint(1000, 5000) for _ in range(30)],
        'orders': [random.randint(50, 200) for _ in range(30)]
    })

data = generate_sample_data()

# Pages
if page == "Overview":
    st.title("📊 Dashboard Overview")

    # Metrics row
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total Users", f"{data['users'].sum():,}", "+12%")
    with col2:
        st.metric("Revenue", f"${data['revenue'].sum():,}", "+8%")
    with col3:
        st.metric("Orders", f"{data['orders'].sum():,}", "+15%")
    with col4:
        st.metric("Avg Order", f"${data['revenue'].sum() // data['orders'].sum()}", "-2%")

    st.markdown("---")

    # Charts
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Users Over Time")
        st.line_chart(data.set_index('date')['users'])

    with col2:
        st.subheader("Revenue Over Time")
        st.area_chart(data.set_index('date')['revenue'])

elif page == "Analytics":
    st.title("📈 Analytics")

    tab1, tab2, tab3 = st.tabs(["Trends", "Comparison", "Forecast"])

    with tab1:
        st.subheader("30-Day Trends")
        metric = st.selectbox("Select Metric", ["users", "revenue", "orders"])
        st.line_chart(data.set_index('date')[metric])

    with tab2:
        st.subheader("Metric Comparison")
        st.bar_chart(data.set_index('date')[['users', 'orders']])

    with tab3:
        st.subheader("Simple Forecast")
        st.info("Forecast feature coming soon...")

elif page == "Data":
    st.title("📋 Data Explorer")

    st.subheader("Raw Data")
    st.dataframe(data, use_container_width=True)

    st.subheader("Summary Statistics")
    st.write(data.describe())

    # Download button
    csv = data.to_csv(index=False)
    st.download_button(
        "Download CSV",
        csv,
        "data.csv",
        "text/csv"
    )

elif page == "Settings":
    st.title("⚙️ Settings")

    st.subheader("Display Settings")
    theme = st.selectbox("Theme", ["Light", "Dark", "Auto"])
    refresh_rate = st.slider("Auto-refresh (seconds)", 0, 60, 30)

    st.subheader("Data Settings")
    date_range = st.slider("Date Range (days)", 7, 90, 30)

    if st.button("Save Settings"):
        st.success("Settings saved!")

# Footer
st.markdown("---")
st.caption("APPNAME Dashboard | Built with Streamlit Forge")
