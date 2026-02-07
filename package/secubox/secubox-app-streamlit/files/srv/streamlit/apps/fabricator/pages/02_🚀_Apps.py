"""
Apps - Streamlit Application Deployer
"""
import streamlit as st
import subprocess
import json
import requests

st.set_page_config(page_title="Apps - Fabricator", page_icon="🚀", layout="wide")

st.title('🚀 Streamlit Apps')
st.markdown('Deploy and manage Streamlit applications')

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

# List existing instances with test buttons
st.subheader('📱 Running Instances')

instances_raw, _ = run_cmd('uci show streamlit 2>/dev/null | grep "=instance"')
instances = []
for line in instances_raw.split('\n'):
    if '=instance' in line:
        name = line.split('.')[1].split('=')[0]
        port, _ = run_cmd(f'uci get streamlit.{name}.port 2>/dev/null')
        app, _ = run_cmd(f'uci get streamlit.{name}.app 2>/dev/null')
        enabled, _ = run_cmd(f'uci get streamlit.{name}.enabled 2>/dev/null')
        instances.append({'name': name, 'port': port, 'app': app, 'enabled': enabled == '1'})

if instances:
    for inst in instances:
        col1, col2, col3, col4, col5 = st.columns([2, 1, 1, 1, 1])
        
        with col1:
            status = '🟢' if inst['enabled'] else '🔴'
            st.markdown(f"**{status} {inst['name']}** ({inst['app']})")
        
        with col2:
            st.caption(f"Port: {inst['port']}")
        
        with col3:
            if st.button('🧪 Test', key=f"test_{inst['name']}", use_container_width=True):
                url = f"http://127.0.0.1:{inst['port']}/_stcore/health"
                code, time_or_err = test_url(url)
                if code == 200:
                    st.success(f'OK ({time_or_err:.2f}s)')
                else:
                    st.error(f'Failed: {time_or_err}')
        
        with col4:
            if st.button('🔄 Restart', key=f"restart_{inst['name']}", use_container_width=True):
                run_cmd(f"streamlitctl instance stop {inst['name']}")
                run_cmd(f"streamlitctl instance start {inst['name']}")
                st.success('Restarted!')
                st.rerun()
        
        with col5:
            if st.button('🌐 Open', key=f"open_{inst['name']}", use_container_width=True):
                st.markdown(f"[Open in new tab](http://192.168.255.1:{inst['port']})")
else:
    st.info('No instances configured')

st.markdown('---')

# Bulk actions
st.subheader('⚡ Bulk Actions')
col1, col2, col3 = st.columns(3)

with col1:
    if st.button('🧪 Test All Instances', use_container_width=True):
        results = []
        for inst in instances:
            url = f"http://127.0.0.1:{inst['port']}/_stcore/health"
            code, time_or_err = test_url(url)
            status = '✅' if code == 200 else '❌'
            results.append(f"{status} {inst['name']} ({inst['port']})")
        st.code('\n'.join(results))

with col2:
    if st.button('🔄 Restart All', use_container_width=True):
        run_cmd('/etc/init.d/streamlit restart')
        st.success('All instances restarted!')

with col3:
    if st.button('📊 Regenerate Stats', use_container_width=True):
        run_cmd('/usr/sbin/secubox-stats-collector.sh all')
        run_cmd('/usr/sbin/metablogizer-json.sh')
        st.success('Stats regenerated!')

st.markdown('---')

# Deploy new app
st.subheader('➕ Deploy New App')

col1, col2 = st.columns(2)

with col1:
    app_name = st.text_input('App Name', placeholder='my-app')
    app_port = st.number_input('Port', min_value=8500, max_value=8599, value=8520, step=1)
    
with col2:
    deploy_method = st.radio('Deploy Method', ['Upload ZIP', 'From Template', 'Git Clone'])

if deploy_method == 'Upload ZIP':
    uploaded_file = st.file_uploader('Upload ZIP archive', type=['zip'])
    if uploaded_file and app_name:
        if st.button('🚀 Deploy from ZIP', type='primary'):
            with open(f'/tmp/{app_name}.zip', 'wb') as f:
                f.write(uploaded_file.getvalue())
            out, rc = run_cmd(f'streamlitctl app deploy {app_name} /tmp/{app_name}.zip 2>&1')
            if rc == 0:
                run_cmd(f'streamlitctl instance add {app_name} {app_port}')
                run_cmd(f'streamlitctl instance start {app_name}')
                st.success(f'Deployed {app_name} on port {app_port}!')
                st.rerun()
            else:
                st.error(f'Deploy failed: {out}')

elif deploy_method == 'From Template':
    templates = {
        'basic': 'Basic Streamlit app with sidebar',
        'dashboard': 'Dashboard with charts and metrics',
        'form': 'Form-based data entry app',
    }
    template = st.selectbox('Template', list(templates.keys()), format_func=lambda x: templates[x])
    
    if app_name and st.button('🚀 Create from Template', type='primary'):
        run_cmd(f'streamlitctl app create {app_name}')
        run_cmd(f'streamlitctl instance add {app_name} {app_port}')
        run_cmd(f'streamlitctl instance start {app_name}')
        st.success(f'Created {app_name} on port {app_port}!')
        st.rerun()

elif deploy_method == 'Git Clone':
    git_repo = st.text_input('Git Repository URL', placeholder='https://github.com/user/repo.git')
    if app_name and git_repo and st.button('🚀 Clone and Deploy', type='primary'):
        out, rc = run_cmd(f'streamlitctl gitea clone {app_name} {git_repo} 2>&1')
        if rc == 0:
            run_cmd(f'streamlitctl instance add {app_name} {app_port}')
            run_cmd(f'streamlitctl instance start {app_name}')
            st.success(f'Cloned and deployed {app_name}!')
            st.rerun()
        else:
            st.error(f'Clone failed: {out}')

st.markdown('---')

# Emancipate
st.subheader('🌐 Emancipate (Expose to Internet)')

col1, col2 = st.columns(2)
with col1:
    emancipate_instance = st.selectbox('Instance to Emancipate', 
                                        [i['name'] for i in instances] if instances else ['No instances'])
with col2:
    emancipate_domain = st.text_input('Domain (optional)', placeholder='app.gk2.secubox.in')

if emancipate_instance and emancipate_instance != 'No instances':
    if st.button('🚀 Emancipate!', type='primary', use_container_width=True):
        cmd = f'streamlitctl emancipate {emancipate_instance}'
        if emancipate_domain:
            cmd += f' {emancipate_domain}'
        out, rc = run_cmd(cmd + ' 2>&1')
        if 'COMPLETE' in out or rc == 0:
            st.success(f'Emancipated {emancipate_instance}!')
            st.code(out[-500:] if len(out) > 500 else out)
        else:
            st.error(f'Emancipation failed')
            st.code(out)
