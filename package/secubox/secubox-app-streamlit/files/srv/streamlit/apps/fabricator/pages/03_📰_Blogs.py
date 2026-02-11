"""
Blogs - MetaBlogizer Site Manager
"""
import streamlit as st
import subprocess
import json
import requests

st.set_page_config(page_title="Blogs - Fabricator", page_icon="📰", layout="wide")

st.title('📰 Blog Sites (MetaBlogizer)')
st.markdown('Create and manage static blog sites with Hugo')

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        return result.stdout.strip(), result.returncode
    except Exception as e:
        return str(e), 1

def test_url(url):
    """Test if URL is accessible"""
    try:
        r = requests.get(url, timeout=5, verify=False)
        return r.status_code, r.elapsed.total_seconds()
    except Exception as e:
        return 0, str(e)

def get_sites_from_uci():
    """Get metablogizer sites from UCI config"""
    sites = []
    raw, _ = run_cmd('uci show metablogizer 2>/dev/null | grep "=site"')
    for line in raw.split('\n'):
        if '=site' in line:
            section = line.split('.')[1].split('=')[0]
            name, _ = run_cmd(f'uci get metablogizer.{section}.name 2>/dev/null')
            domain, _ = run_cmd(f'uci get metablogizer.{section}.domain 2>/dev/null')
            port, _ = run_cmd(f'uci get metablogizer.{section}.port 2>/dev/null')
            enabled, _ = run_cmd(f'uci get metablogizer.{section}.enabled 2>/dev/null')
            emancipated, _ = run_cmd(f'uci get metablogizer.{section}.emancipated 2>/dev/null')
            ssl, _ = run_cmd(f'uci get metablogizer.{section}.ssl 2>/dev/null')
            sites.append({
                'section': section,
                'name': name or section.replace('site_', ''),
                'domain': domain,
                'port': port or '8900',
                'enabled': enabled == '1',
                'emancipated': emancipated == '1',
                'ssl': ssl == '1'
            })
    return sites

# List existing sites
st.subheader('📚 Existing Blog Sites')

sites = get_sites_from_uci()

if sites:
    for site in sites:
        col1, col2, col3, col4, col5 = st.columns([3, 2, 1, 1, 1])
        
        with col1:
            status = '🟢' if site['enabled'] else '🔴'
            exposed = '🌐' if site['emancipated'] else '🔒'
            ssl_icon = '🔐' if site['ssl'] else ''
            st.markdown(f"**{status} {site['name']}** {exposed}{ssl_icon}")
            st.caption(f"[{site['domain']}](https://{site['domain']})")
        
        with col2:
            st.caption(f"Port: {site['port']}")
        
        with col3:
            if st.button('🧪 Test', key=f"test_{site['name']}", use_container_width=True):
                url = f"https://{site['domain']}"
                code, time_or_err = test_url(url)
                if 200 <= code < 400:
                    st.success(f'{code} ({time_or_err:.2f}s)')
                else:
                    st.error(f'{code}: {time_or_err}')
        
        with col4:
            if st.button('🔄 Rebuild', key=f"rebuild_{site['name']}", use_container_width=True):
                out, rc = run_cmd(f"metablogizerctl build {site['name']} 2>&1")
                if rc == 0:
                    st.success('Built!')
                else:
                    st.error(f'Failed: {out[:100]}')
        
        with col5:
            if not site['emancipated']:
                if st.button('🚀 Expose', key=f"emancipate_{site['name']}", use_container_width=True):
                    out, rc = run_cmd(f"metablogizerctl emancipate {site['name']} 2>&1")
                    if rc == 0:
                        st.success('Emancipated!')
                        st.rerun()
                    else:
                        st.error(f'Failed')
            else:
                if st.button('🌐 Open', key=f"open_{site['name']}", use_container_width=True):
                    st.markdown(f"[Open](https://{site['domain']})")
else:
    st.info('No blog sites configured. Create one below!')

st.markdown('---')

# Bulk actions
st.subheader('⚡ Bulk Actions')
col1, col2, col3 = st.columns(3)

with col1:
    if st.button('🧪 Test All Sites', use_container_width=True):
        results = []
        for site in sites:
            url = f"https://{site['domain']}"
            code, time_or_err = test_url(url)
            status = '✅' if 200 <= code < 400 else '❌'
            results.append(f"{status} {site['domain']} ({code})")
        st.code('\n'.join(results))

with col2:
    if st.button('🔄 Rebuild All', use_container_width=True):
        for site in sites:
            run_cmd(f"metablogizerctl build {site['name']} 2>&1")
        st.success('All sites rebuilt!')

with col3:
    if st.button('📊 Refresh Stats', use_container_width=True):
        run_cmd('/usr/sbin/metablogizer-json.sh 2>/dev/null')
        st.success('Stats refreshed!')
        st.rerun()

st.markdown('---')

# Create new site
st.subheader('➕ Create New Blog Site')

col1, col2 = st.columns(2)

with col1:
    site_name = st.text_input('Site Name', placeholder='my-blog')
    site_domain = st.text_input('Domain', placeholder='blog.example.com')

with col2:
    site_theme = st.selectbox('Theme', ['ananke', 'papermod', 'terminal', 'blowfish', 'stack'])
    auto_emancipate = st.checkbox('Auto-emancipate (DNS + SSL + HAProxy)', value=True)

if site_name and site_domain:
    if st.button('🚀 Create Blog Site', type='primary'):
        # Create site
        out, rc = run_cmd(f'metablogizerctl create {site_name} {site_domain} 2>&1')
        if rc == 0:
            st.success(f'Created blog site: {site_name}')
            if auto_emancipate:
                out2, rc2 = run_cmd(f'metablogizerctl emancipate {site_name} 2>&1')
                if rc2 == 0:
                    st.success(f'Emancipated: https://{site_domain}')
                else:
                    st.warning(f'Emancipation issue: {out2[:200]}')
            st.rerun()
        else:
            st.error(f'Failed: {out}')

st.markdown('---')

# Upload ZIP for existing site
st.subheader('📦 Upload Content ZIP')

upload_site = st.selectbox('Target Site', [s['name'] for s in sites] if sites else ['No sites'])
uploaded_file = st.file_uploader('Upload Hugo content ZIP', type=['zip'])

if uploaded_file and upload_site and upload_site != 'No sites':
    if st.button('📤 Upload & Deploy'):
        with open(f'/tmp/{upload_site}.zip', 'wb') as f:
            f.write(uploaded_file.getvalue())
        
        # Find site path
        site_path = f"/srv/metablogizer/sites/{upload_site}"
        out, rc = run_cmd(f'unzip -o /tmp/{upload_site}.zip -d {site_path}/ 2>&1')
        if rc == 0:
            # Rebuild
            run_cmd(f'metablogizerctl build {upload_site}')
            st.success('Content deployed and rebuilt!')
            st.rerun()
        else:
            st.error(f'Extract failed: {out}')
