"""
APPNAME - Data Viewer Template
CSV/Excel data explorer with filtering and visualization
Created with Streamlit Forge
"""
import streamlit as st
import pandas as pd
import io

st.set_page_config(
    page_title="APPNAME Data Viewer",
    page_icon="📁",
    layout="wide"
)

st.title("📁 APPNAME Data Viewer")
st.markdown("Upload and explore CSV or Excel files")

# File upload
uploaded_file = st.file_uploader(
    "Choose a file",
    type=['csv', 'xlsx', 'xls'],
    help="Upload CSV or Excel file"
)

if uploaded_file is not None:
    # Load data
    try:
        if uploaded_file.name.endswith('.csv'):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)

        st.success(f"Loaded {len(df):,} rows × {len(df.columns)} columns")

        # Data info
        with st.expander("📊 Data Info", expanded=False):
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Rows", f"{len(df):,}")
            with col2:
                st.metric("Columns", len(df.columns))
            with col3:
                st.metric("Memory", f"{df.memory_usage(deep=True).sum() / 1024:.1f} KB")

            st.subheader("Column Types")
            st.dataframe(pd.DataFrame({
                'Column': df.columns,
                'Type': df.dtypes.astype(str),
                'Non-Null': df.count().values,
                'Null': df.isnull().sum().values
            }), use_container_width=True)

        # Filtering
        st.sidebar.header("Filters")

        # Column filter
        selected_cols = st.sidebar.multiselect(
            "Select Columns",
            df.columns.tolist(),
            default=df.columns.tolist()[:10]  # First 10 by default
        )

        # Row filter
        st.sidebar.subheader("Row Filters")
        filters = {}

        for col in selected_cols[:5]:  # Filter on first 5 selected columns
            if df[col].dtype == 'object':
                unique_vals = df[col].dropna().unique()
                if len(unique_vals) <= 20:
                    selected = st.sidebar.multiselect(
                        f"{col}",
                        unique_vals,
                        key=f"filter_{col}"
                    )
                    if selected:
                        filters[col] = selected
            elif df[col].dtype in ['int64', 'float64']:
                min_val = float(df[col].min())
                max_val = float(df[col].max())
                if min_val != max_val:
                    range_val = st.sidebar.slider(
                        f"{col}",
                        min_val, max_val,
                        (min_val, max_val),
                        key=f"filter_{col}"
                    )
                    if range_val != (min_val, max_val):
                        filters[col] = range_val

        # Apply filters
        filtered_df = df[selected_cols].copy()
        for col, filter_val in filters.items():
            if isinstance(filter_val, list):
                filtered_df = filtered_df[filtered_df[col].isin(filter_val)]
            elif isinstance(filter_val, tuple):
                filtered_df = filtered_df[
                    (filtered_df[col] >= filter_val[0]) &
                    (filtered_df[col] <= filter_val[1])
                ]

        # Tabs for different views
        tab1, tab2, tab3 = st.tabs(["📋 Table", "📊 Charts", "📈 Statistics"])

        with tab1:
            st.subheader(f"Data ({len(filtered_df):,} rows)")
            st.dataframe(filtered_df, use_container_width=True, height=400)

            # Download filtered data
            csv = filtered_df.to_csv(index=False)
            st.download_button(
                "⬇️ Download Filtered Data",
                csv,
                f"filtered_{uploaded_file.name.rsplit('.', 1)[0]}.csv",
                "text/csv"
            )

        with tab2:
            st.subheader("Quick Visualizations")

            # Get numeric columns
            numeric_cols = filtered_df.select_dtypes(include=['int64', 'float64']).columns.tolist()

            if numeric_cols:
                col1, col2 = st.columns(2)

                with col1:
                    chart_col = st.selectbox("Select column for histogram", numeric_cols)
                    st.bar_chart(filtered_df[chart_col].value_counts().head(20))

                with col2:
                    if len(numeric_cols) >= 2:
                        x_col = st.selectbox("X axis", numeric_cols, index=0)
                        y_col = st.selectbox("Y axis", numeric_cols, index=min(1, len(numeric_cols)-1))
                        st.scatter_chart(filtered_df[[x_col, y_col]])
            else:
                st.info("No numeric columns for visualization")

        with tab3:
            st.subheader("Statistical Summary")
            st.dataframe(filtered_df.describe(), use_container_width=True)

            # Correlation matrix for numeric columns
            if len(numeric_cols) >= 2:
                st.subheader("Correlation Matrix")
                corr = filtered_df[numeric_cols].corr()
                st.dataframe(corr.style.background_gradient(cmap='coolwarm'), use_container_width=True)

    except Exception as e:
        st.error(f"Error loading file: {str(e)}")

else:
    # Sample data option
    st.info("👆 Upload a file to get started, or try with sample data below")

    if st.button("Load Sample Data"):
        sample_data = pd.DataFrame({
            'Name': ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
            'Age': [25, 30, 35, 28, 32],
            'City': ['Paris', 'London', 'Berlin', 'Paris', 'London'],
            'Score': [85.5, 92.0, 78.5, 88.0, 95.5]
        })
        st.session_state['sample_loaded'] = True
        st.dataframe(sample_data)

# Footer
st.markdown("---")
st.caption("APPNAME Data Viewer | Built with Streamlit Forge")
