"""
Services - Exposure and Emancipation Manager
"""
import streamlit as st
import subprocess
import json
import requests

st.set_page_config(page_title="Services - Fabricator", page_icon="🌐", layout="wide")

st.title('🌐 Service Exposure')
st.markdown('Peek, Poke, and Emancipate services')

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

def get_vhosts_from_uci():
    """Get HAProxy vhosts from UCI"""
    vhosts = []
    raw, _ = run_cmd('uci show haproxy 2>/dev/null | grep "=vhost"')
    for line in raw.split('\n'):
        if '=vhost' in line:
            section = line.split('.')[1].split('=')[0]
            domain, _ = run_cmd(f'uci get haproxy.{section}.domain 2>/dev/null')
            backend, _ = run_cmd(f'uci get haproxy.{section}.backend 2>/dev/null')
            ssl, _ = run_cmd(f'uci get haproxy.{section}.ssl 2>/dev/null')
            enabled, _ = run_cmd(f'uci get haproxy.{section}.enabled 2>/dev/null')
            original_backend, _ = run_cmd(f'uci get haproxy.{section}.original_backend 2>/dev/null')
            
            # Check if mitmproxy inspection is active
            mitmproxy_active = backend == 'mitmproxy_inspector'
            actual_backend = original_backend if mitmproxy_active else backend
            
            vhosts.append({
                'section': section,
                'domain': domain,
                'backend': actual_backend,
                'ssl': ssl == '1',
                'enabled': enabled != '0',
                'mitmproxy': mitmproxy_active
            })
    return vhosts

def get_backends_from_uci():
    """Get HAProxy backends from UCI"""
    backends = []
    raw, _ = run_cmd('uci show haproxy 2>/dev/null | grep "=backend"')
    for line in raw.split('\n'):
        if '=backend' in line:
            section = line.split('.')[1].split('=')[0]
            name, _ = run_cmd(f'uci get haproxy.{section}.name 2>/dev/null')
            server, _ = run_cmd(f'uci get haproxy.{section}.server 2>/dev/null')
            mode, _ = run_cmd(f'uci get haproxy.{section}.mode 2>/dev/null')
            
            # Parse server line for port
            port = ''
            if server:
                parts = server.split(':')
                if len(parts) >= 2:
                    port = parts[-1].split()[0]
            
            backends.append({
                'section': section,
                'name': name or section,
                'server': server,
                'port': port,
                'mode': mode or 'http'
            })
    return backends

# Current Exposures (Vhosts)
st.subheader('📡 Current Exposures (HAProxy Vhosts)')

vhosts = get_vhosts_from_uci()

if vhosts:
    for vhost in vhosts:
        if not vhost['domain']:
            continue
        col1, col2, col3, col4 = st.columns([3, 2, 1, 1])
        
        with col1:
            ssl_icon = '🔐' if vhost['ssl'] else '🔓'
            mitmproxy_icon = '🔍' if vhost['mitmproxy'] else ''
            st.markdown(f"**{ssl_icon} {vhost['domain']}** {mitmproxy_icon}")
            st.caption(f"Backend: {vhost['backend']}")
        
        with col2:
            status = '🟢 Active' if vhost['enabled'] else '🔴 Disabled'
            st.markdown(status)
        
        with col3:
            if st.button('🧪 Test', key=f"test_vhost_{vhost['section']}", use_container_width=True):
                proto = 'https' if vhost['ssl'] else 'http'
                url = f"{proto}://{vhost['domain']}"
                code, time_or_err = test_url(url)
                if 200 <= code < 400:
                    st.success(f'{code}')
                elif code >= 400:
                    st.warning(f'{code}')
                else:
                    st.error(f'Fail')
        
        with col4:
            if st.button('🌐 Open', key=f"open_vhost_{vhost['section']}", use_container_width=True):
                proto = 'https' if vhost['ssl'] else 'http'
                st.markdown(f"[Open]({proto}://{vhost['domain']})")
else:
    st.info('No vhosts configured')

st.markdown('---')

# Backends
st.subheader('🔌 HAProxy Backends')

backends = get_backends_from_uci()

if backends:
    for backend in backends:
        col1, col2, col3 = st.columns([2, 3, 1])
        
        with col1:
            st.markdown(f"**{backend['name']}**")
        
        with col2:
            st.caption(f"{backend['server']}")
        
        with col3:
            st.caption(f"Port: {backend['port']}")
else:
    st.info('No backends configured')

st.markdown('---')

# Scan for local services (Peek)
st.subheader('🔍 Peek - Scan Local Services')

if st.button('🔍 Scan Listening Services', type='primary'):
    with st.spinner('Scanning...'):
        services = []
        ports_out, _ = run_cmd('netstat -tlnp 2>/dev/null | grep LISTEN')
        
        for line in ports_out.split('\n'):
            if not line or 'LISTEN' not in line:
                continue
            parts = line.split()
            if len(parts) >= 7:
                addr_port = parts[3]
                proc = parts[6] if len(parts) > 6 else '-'
                if ':' in addr_port:
                    port = addr_port.split(':')[-1]
                    addr = addr_port.rsplit(':', 1)[0] or '0.0.0.0'
                    proc_name = proc.split('/')[1] if '/' in proc else proc
                    services.append({
                        'port': port,
                        'address': addr,
                        'process': proc_name
                    })
        
        if services:
            st.markdown("**Discovered Services:**")
            for svc in sorted(services, key=lambda x: int(x['port']) if x['port'].isdigit() else 0):
                col1, col2, col3, col4 = st.columns([1, 2, 2, 1])
                with col1:
                    st.markdown(f"**:{svc['port']}**")
                with col2:
                    exposable = '✅' if svc['address'] in ['0.0.0.0', '::'] else '⚠️ local'
                    st.write(f"{svc['address']} {exposable}")
                with col3:
                    st.write(svc['process'])
                with col4:
                    if svc['address'] in ['0.0.0.0', '::']:
                        if st.button('📤', key=f"expose_{svc['port']}", use_container_width=True):
                            st.session_state['expose_port'] = svc['port']
        else:
            st.info('No services found')

st.markdown('---')

# Emancipate service
st.subheader('🚀 Emancipate - Expose New Service')

col1, col2 = st.columns(2)

with col1:
    default_port = int(st.session_state.get('expose_port', 8080))
    service_port = st.number_input('Service Port', min_value=1, max_value=65535, value=default_port)
    domain = st.text_input('Domain', placeholder='app.gk2.secubox.in')

with col2:
    channels = st.multiselect('Exposure Channels', 
                               ['DNS/SSL (HAProxy)', 'Tor Hidden Service', 'Mesh (Vortex)'],
                               default=['DNS/SSL (HAProxy)'])

if service_port and domain:
    backend_name = domain.replace('.', '_').replace('-', '_')
    
    if st.button('🚀 EMANCIPATE', type='primary', use_container_width=True):
        with st.spinner('Emancipating...'):
            steps = []
            
            # 1. Create DNS record
            if 'DNS/SSL (HAProxy)' in channels:
                # Extract subdomain
                if '.secubox.in' in domain:
                    subdomain = domain.replace('.secubox.in', '')
                elif '.maegia.tv' in domain:
                    subdomain = domain.replace('.maegia.tv', '')
                else:
                    subdomain = domain.split('.')[0]
                
                out, rc = run_cmd(f'dnsctl add A {subdomain} 82.67.100.75 2>&1')
                steps.append(('DNS Record', rc == 0 or 'already' in out.lower(), out))
                
                # 2. Create HAProxy backend + vhost
                run_cmd(f'uci set haproxy.{backend_name}=backend')
                run_cmd(f'uci set haproxy.{backend_name}.name="{backend_name}"')
                run_cmd(f'uci set haproxy.{backend_name}.mode="http"')
                run_cmd(f'uci set haproxy.{backend_name}.server="srv 192.168.255.1:{service_port} check"')
                run_cmd(f'uci set haproxy.{backend_name}.enabled="1"')
                
                run_cmd(f'uci set haproxy.{backend_name}_vhost=vhost')
                run_cmd(f'uci set haproxy.{backend_name}_vhost.domain="{domain}"')
                run_cmd(f'uci set haproxy.{backend_name}_vhost.backend="{backend_name}"')
                run_cmd(f'uci set haproxy.{backend_name}_vhost.ssl="1"')
                run_cmd(f'uci set haproxy.{backend_name}_vhost.ssl_redirect="1"')
                run_cmd(f'uci set haproxy.{backend_name}_vhost.enabled="1"')
                run_cmd('uci commit haproxy')
                
                out, rc = run_cmd('haproxyctl generate && haproxyctl reload 2>&1')
                steps.append(('HAProxy Vhost', rc == 0, out[-200:] if len(out) > 200 else out))
                
                # 3. SSL Certificate
                out, rc = run_cmd(f'haproxyctl cert add {domain} 2>&1')
                steps.append(('SSL Certificate', 'success' in out.lower() or 'already' in out.lower(), out[-200:] if len(out) > 200 else out))
            
            if 'Tor Hidden Service' in channels:
                out, rc = run_cmd(f'secubox-exposure tor add {domain} {service_port} 2>&1')
                steps.append(('Tor Hidden Service', rc == 0, out))
            
            if 'Mesh (Vortex)' in channels:
                out, rc = run_cmd(f'vortexctl mesh publish {domain} 2>&1')
                steps.append(('Mesh Publish', rc == 0, out))
            
            # Show results
            for step_name, success, output in steps:
                if success:
                    st.success(f'✅ {step_name}')
                else:
                    st.error(f'❌ {step_name}: {output}')
            
            st.markdown(f'**Service exposed at:** [https://{domain}](https://{domain})')
            st.rerun()

st.markdown('---')

# Quick actions
st.subheader('⚡ Quick Actions')
col1, col2, col3 = st.columns(3)

with col1:
    if st.button('🧪 Test All Vhosts', use_container_width=True):
        results = []
        for vhost in vhosts:
            if vhost['domain']:
                proto = 'https' if vhost['ssl'] else 'http'
                url = f"{proto}://{vhost['domain']}"
                code, _ = test_url(url)
                status = '✅' if 200 <= code < 400 else '⚠️' if code >= 400 else '❌'
                results.append(f"{status} {vhost['domain']} ({code})")
        st.code('\n'.join(results))

with col2:
    if st.button('🔄 Reload HAProxy', use_container_width=True):
        run_cmd('haproxyctl reload')
        st.success('HAProxy reloaded!')

with col3:
    if st.button('📊 Regenerate Config', use_container_width=True):
        run_cmd('haproxyctl generate')
        run_cmd('haproxyctl reload')
        st.success('Config regenerated!')
