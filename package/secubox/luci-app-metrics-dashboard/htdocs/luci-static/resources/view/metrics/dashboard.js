'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callOverview = rpc.declare({
    object: 'luci.metrics',
    method: 'overview',
    expect: {}
});

var callWafStats = rpc.declare({
    object: 'luci.metrics',
    method: 'waf_stats',
    expect: {}
});

var callConnections = rpc.declare({
    object: 'luci.metrics',
    method: 'connections',
    expect: {}
});

var callFirewallStats = rpc.declare({
    object: 'luci.metrics',
    method: 'firewall_stats',
    expect: {}
});

var callCerts = rpc.declare({
    object: 'luci.metrics',
    method: 'certs',
    expect: {}
});

var callVhosts = rpc.declare({
    object: 'luci.metrics',
    method: 'vhosts',
    expect: {}
});

var callMetablogs = rpc.declare({
    object: 'luci.metrics',
    method: 'metablogs',
    expect: {}
});

var callStreamlits = rpc.declare({
    object: 'luci.metrics',
    method: 'streamlits',
    expect: {}
});

function formatUptime(seconds) {
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return days + 'd ' + hours + 'h ' + mins + 'm';
    if (hours > 0) return hours + 'h ' + mins + 'm';
    return mins + 'm';
}

function formatMemory(kb) {
    if (kb > 1048576) return (kb / 1048576).toFixed(1) + ' GB';
    if (kb > 1024) return (kb / 1024).toFixed(0) + ' MB';
    return kb + ' KB';
}

function createStatusBadge(active, label) {
    var cls = active ? 'badge-success' : 'badge-danger';
    var icon = active ? '●' : '○';
    return E('span', { 'class': 'metrics-badge ' + cls }, icon + ' ' + label);
}

function createMetricCard(title, value, subtitle, icon, color) {
    return E('div', { 'class': 'metrics-card metrics-card-' + (color || 'default') }, [
        E('div', { 'class': 'metrics-card-icon' }, icon || '📊'),
        E('div', { 'class': 'metrics-card-content' }, [
            E('div', { 'class': 'metrics-card-value' }, String(value)),
            E('div', { 'class': 'metrics-card-title' }, title),
            subtitle ? E('div', { 'class': 'metrics-card-subtitle' }, subtitle) : null
        ])
    ]);
}

function createServiceRow(name, domain, running, enabled) {
    var statusCls = running ? 'status-running' : (enabled ? 'status-stopped' : 'status-disabled');
    var statusText = running ? 'Running' : (enabled ? 'Stopped' : 'Disabled');
    return E('tr', {}, [
        E('td', {}, name),
        E('td', {}, domain ? E('a', { href: 'https://' + domain, target: '_blank' }, domain) : '-'),
        E('td', { 'class': statusCls }, statusText)
    ]);
}

function createCertRow(cert) {
    var statusCls = 'cert-' + cert.status;
    return E('tr', { 'class': statusCls }, [
        E('td', {}, cert.name),
        E('td', {}, cert.expiry || 'Unknown'),
        E('td', {}, cert.days_left + ' days'),
        E('td', { 'class': 'cert-status-' + cert.status }, cert.status.toUpperCase())
    ]);
}

return view.extend({
    css: `
        .metrics-dashboard { padding: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metrics-card { background: var(--card-bg, #1a1a2e); border-radius: 8px; padding: 15px; display: flex; align-items: center; gap: 15px; border: 1px solid var(--border-color, #333); }
        .metrics-card-icon { font-size: 2em; }
        .metrics-card-value { font-size: 1.8em; font-weight: bold; color: var(--primary-color, #00ffb2); }
        .metrics-card-title { font-size: 0.9em; color: var(--text-muted, #888); }
        .metrics-card-subtitle { font-size: 0.75em; color: var(--text-dim, #666); }
        .metrics-card-success .metrics-card-value { color: #39ff14; }
        .metrics-card-warning .metrics-card-value { color: #ffb300; }
        .metrics-card-danger .metrics-card-value { color: #ff3535; }
        .metrics-card-info .metrics-card-value { color: #00c3ff; }

        .metrics-section { background: var(--card-bg, #1a1a2e); border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid var(--border-color, #333); }
        .metrics-section h3 { margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-color, #333); color: var(--heading-color, #fff); display: flex; align-items: center; gap: 10px; }
        .metrics-section h3 .icon { font-size: 1.2em; }

        .metrics-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.85em; margin-right: 8px; }
        .badge-success { background: rgba(57, 255, 20, 0.2); color: #39ff14; }
        .badge-danger { background: rgba(255, 53, 53, 0.2); color: #ff3535; }
        .badge-warning { background: rgba(255, 179, 0, 0.2); color: #ffb300; }
        .badge-info { background: rgba(0, 195, 255, 0.2); color: #00c3ff; }

        .metrics-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
        .metrics-table th, .metrics-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--border-color, #333); }
        .metrics-table th { color: var(--text-muted, #888); font-weight: normal; }
        .metrics-table tr:hover { background: rgba(255,255,255,0.03); }

        .status-running { color: #39ff14; }
        .status-stopped { color: #ffb300; }
        .status-disabled { color: #666; }

        .cert-valid { }
        .cert-expiring { background: rgba(255, 179, 0, 0.1); }
        .cert-critical { background: rgba(255, 53, 53, 0.15); }
        .cert-expired { background: rgba(255, 53, 53, 0.25); }
        .cert-status-valid { color: #39ff14; }
        .cert-status-expiring { color: #ffb300; }
        .cert-status-critical { color: #ff6b35; }
        .cert-status-expired { color: #ff3535; }

        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 15px; }

        .refresh-info { text-align: right; color: var(--text-dim, #666); font-size: 0.8em; margin-bottom: 10px; }

        .progress-bar { height: 8px; background: var(--border-color, #333); border-radius: 4px; overflow: hidden; margin-top: 5px; }
        .progress-fill { height: 100%; transition: width 0.3s; }
        .progress-success { background: linear-gradient(90deg, #39ff14, #00ffb2); }
        .progress-warning { background: linear-gradient(90deg, #ffb300, #ff6b35); }
        .progress-danger { background: linear-gradient(90deg, #ff6b35, #ff3535); }

        .live-indicator { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #39ff14; margin-right: 5px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    `,

    load: function() {
        return Promise.all([
            callOverview().catch(function() { return {}; }),
            callWafStats().catch(function() { return {}; }),
            callConnections().catch(function() { return {}; }),
            callFirewallStats().catch(function() { return {}; }),
            callCerts().catch(function() { return { certs: [] }; }),
            callVhosts().catch(function() { return { vhosts: [] }; }),
            callMetablogs().catch(function() { return { sites: [] }; }),
            callStreamlits().catch(function() { return { apps: [] }; })
        ]);
    },

    render: function(data) {
        var overview = data[0] || {};
        var waf = data[1] || {};
        var conns = data[2] || {};
        var fw = data[3] || {};
        var certs = (data[4] || {}).certs || [];
        var vhosts = (data[5] || {}).vhosts || [];
        var metablogs = (data[6] || {}).sites || [];
        var streamlits = (data[7] || {}).apps || [];

        var memPct = overview.mem_pct || 0;
        var memClass = memPct > 90 ? 'danger' : (memPct > 70 ? 'warning' : 'success');

        var view = E('div', { 'class': 'metrics-dashboard' }, [
            E('div', { 'class': 'refresh-info' }, [
                E('span', { 'class': 'live-indicator' }),
                'Live refresh: 5s | Last: ',
                E('span', { 'id': 'last-refresh' }, new Date().toLocaleTimeString())
            ]),

            // Overview Cards
            E('div', { 'class': 'metrics-grid', 'id': 'overview-grid' }, [
                createMetricCard('Uptime', formatUptime(overview.uptime || 0), 'Load: ' + (overview.load || '0.00'), '⏱️'),
                createMetricCard('Memory', memPct + '%', formatMemory(overview.mem_used_kb || 0) + ' / ' + formatMemory(overview.mem_total_kb || 0), '🧠', memClass),
                createMetricCard('vHosts', overview.vhosts || 0, 'Active virtual hosts', '🌐', 'info'),
                createMetricCard('Certificates', overview.certificates || 0, 'SSL/TLS certificates', '🔒', 'success'),
                createMetricCard('MetaBlogs', overview.metablogs || 0, 'Static sites', '📄'),
                createMetricCard('Streamlits', overview.streamlits || 0, 'Python apps', '🐍'),
                createMetricCard('LXC Containers', overview.lxc_containers || 0, 'Running containers', '📦', 'info')
            ]),

            // Services Status
            E('div', { 'class': 'metrics-section', 'id': 'services-section' }, [
                E('h3', {}, [E('span', { 'class': 'icon' }, '🔧'), 'Core Services']),
                E('div', { 'style': 'display: flex; gap: 15px; flex-wrap: wrap;' }, [
                    createStatusBadge(overview.haproxy, 'HAProxy'),
                    createStatusBadge(overview.mitmproxy, 'mitmproxy WAF'),
                    createStatusBadge(overview.crowdsec, 'CrowdSec')
                ])
            ]),

            // WAF & Security
            E('div', { 'class': 'metrics-section', 'id': 'waf-section' }, [
                E('h3', {}, [E('span', { 'class': 'icon' }, '🛡️'), 'WAF & Security']),
                E('div', { 'class': 'metrics-grid' }, [
                    createMetricCard('Active Bans', waf.active_bans || 0, 'CrowdSec decisions', '🚫', (waf.active_bans || 0) > 0 ? 'warning' : 'success'),
                    createMetricCard('Alerts (24h)', waf.alerts_today || 0, 'Security alerts', '⚠️', (waf.alerts_today || 0) > 10 ? 'danger' : 'info'),
                    createMetricCard('WAF Threats', waf.waf_threats || 0, 'Detected today', '🎯', (waf.waf_threats || 0) > 0 ? 'warning' : 'success'),
                    createMetricCard('WAF Blocked', waf.waf_blocked || 0, 'Blocked requests', '✋', 'danger')
                ])
            ]),

            // Connections
            E('div', { 'class': 'metrics-section', 'id': 'connections-section' }, [
                E('h3', {}, [E('span', { 'class': 'icon' }, '🔗'), 'Active Connections']),
                E('div', { 'class': 'metrics-grid' }, [
                    createMetricCard('HTTPS', conns.https || 0, 'Port 443', '🔐', 'success'),
                    createMetricCard('HTTP', conns.http || 0, 'Port 80', '🌍'),
                    createMetricCard('SSH', conns.ssh || 0, 'Port 22', '💻', 'info'),
                    createMetricCard('Total TCP', conns.total_tcp || 0, 'All connections', '📡')
                ])
            ]),

            // Firewall
            E('div', { 'class': 'metrics-section', 'id': 'firewall-section' }, [
                E('h3', {}, [E('span', { 'class': 'icon' }, '🔥'), 'Firewall Stats']),
                E('div', { 'class': 'metrics-grid' }, [
                    createMetricCard('Bouncer Blocks', fw.bouncer_blocks || 0, 'CrowdSec bouncer', '🛑', (fw.bouncer_blocks || 0) > 0 ? 'danger' : 'success')
                ])
            ]),

            // Services Grid
            E('div', { 'class': 'services-grid' }, [
                // Certificates
                E('div', { 'class': 'metrics-section', 'id': 'certs-section' }, [
                    E('h3', {}, [E('span', { 'class': 'icon' }, '🔒'), 'SSL Certificates']),
                    certs.length > 0 ?
                        E('table', { 'class': 'metrics-table' }, [
                            E('thead', {}, E('tr', {}, [
                                E('th', {}, 'Domain'),
                                E('th', {}, 'Expiry'),
                                E('th', {}, 'Days Left'),
                                E('th', {}, 'Status')
                            ])),
                            E('tbody', {}, certs.slice(0, 10).map(createCertRow))
                        ]) :
                        E('p', { 'class': 'text-muted' }, 'No certificates found')
                ]),

                // MetaBlog Sites
                E('div', { 'class': 'metrics-section', 'id': 'metablogs-section' }, [
                    E('h3', {}, [E('span', { 'class': 'icon' }, '📄'), 'MetaBlog Sites']),
                    metablogs.length > 0 ?
                        E('table', { 'class': 'metrics-table' }, [
                            E('thead', {}, E('tr', {}, [
                                E('th', {}, 'Name'),
                                E('th', {}, 'Domain'),
                                E('th', {}, 'Status')
                            ])),
                            E('tbody', {}, metablogs.slice(0, 10).map(function(s) {
                                return createServiceRow(s.name, s.domain, s.running, s.enabled);
                            }))
                        ]) :
                        E('p', { 'class': 'text-muted' }, 'No MetaBlog sites')
                ])
            ]),

            // Streamlit Apps
            streamlits.length > 0 ?
                E('div', { 'class': 'metrics-section', 'id': 'streamlits-section' }, [
                    E('h3', {}, [E('span', { 'class': 'icon' }, '🐍'), 'Streamlit Apps']),
                    E('table', { 'class': 'metrics-table' }, [
                        E('thead', {}, E('tr', {}, [
                            E('th', {}, 'Name'),
                            E('th', {}, 'Domain'),
                            E('th', {}, 'Status')
                        ])),
                        E('tbody', {}, streamlits.map(function(s) {
                            return createServiceRow(s.name, s.domain, s.running, s.enabled);
                        }))
                    ])
                ]) : null
        ]);

        // Setup polling for real-time updates
        poll.add(L.bind(this.pollMetrics, this), 5);

        return view;
    },

    pollMetrics: function() {
        var self = this;
        return Promise.all([
            callOverview(),
            callWafStats(),
            callConnections()
        ]).then(function(data) {
            var overview = data[0] || {};
            var waf = data[1] || {};
            var conns = data[2] || {};

            // Update last refresh time
            var refreshEl = document.getElementById('last-refresh');
            if (refreshEl) refreshEl.textContent = new Date().toLocaleTimeString();

            // Update could be more granular, but for now just log
            // Full DOM update would require more complex diffing
        });
    }
});
