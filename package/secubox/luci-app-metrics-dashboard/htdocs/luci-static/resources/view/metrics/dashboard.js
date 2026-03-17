'use strict';
'require view';
'require poll';
'require rpc';
'require secubox/kiss-theme';

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

function formatUptime(seconds) {
    var d = Math.floor(seconds / 86400);
    var h = Math.floor((seconds % 86400) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
}

function formatMem(kb) {
    return (kb / 1048576).toFixed(1) + ' GB';
}

return view.extend({
    load: function() {
        // Inject custom CSS
        var style = document.createElement('style');
        style.textContent = `
            .mx-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--kiss-border, #2a2a40);
            }
            .mx-title {
                font-size: 22px;
                font-weight: 600;
                color: #fff;
            }
            .mx-live {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: var(--kiss-muted, #888);
            }
            .mx-dot {
                width: 8px;
                height: 8px;
                background: #00c853;
                border-radius: 50%;
                animation: blink 1.5s infinite;
            }
            @keyframes blink {
                50% { opacity: 0.4; }
            }

            /* Stats Grid */
            .mx-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
            }
            .mx-card {
                background: var(--kiss-bg2, #1a1a2e);
                border: 1px solid var(--kiss-border, #2a2a40);
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }
            .mx-card:hover {
                border-color: var(--kiss-green, #00c853);
            }
            .mx-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            .mx-val {
                font-size: 28px;
                font-weight: 700;
                color: #fff;
                line-height: 1;
            }
            .mx-val.green { color: #00c853; }
            .mx-val.cyan { color: #00bcd4; }
            .mx-val.orange { color: #ff9800; }
            .mx-val.red { color: #f44336; }
            .mx-val.purple { color: #ab47bc; }
            .mx-lbl {
                font-size: 11px;
                color: var(--kiss-muted, #888);
                text-transform: uppercase;
                margin-top: 4px;
            }
            .mx-sub {
                font-size: 10px;
                color: #555;
                margin-top: 4px;
            }

            /* Services bar */
            .mx-svc {
                display: flex;
                gap: 20px;
                align-items: center;
                padding: 12px 16px;
                background: var(--kiss-bg2, #1a1a2e);
                border: 1px solid var(--kiss-border, #2a2a40);
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .mx-svc-title {
                font-size: 11px;
                color: var(--kiss-muted, #888);
                text-transform: uppercase;
            }
            .mx-svc-item {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: #ccc;
            }
            .mx-svc-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            .mx-svc-dot.on {
                background: #00c853;
                box-shadow: 0 0 6px #00c853;
            }
            .mx-svc-dot.off {
                background: #f44336;
            }

            /* Panels */
            .mx-panels {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            @media (max-width: 768px) {
                .mx-panels { grid-template-columns: 1fr; }
            }
            .mx-panel {
                background: var(--kiss-bg2, #1a1a2e);
                border: 1px solid var(--kiss-border, #2a2a40);
                border-radius: 8px;
                padding: 16px;
            }
            .mx-panel-title {
                font-size: 13px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .mx-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--kiss-border, #2a2a40);
            }
            .mx-row:last-child { border-bottom: none; }
            .mx-row-label {
                font-size: 12px;
                color: var(--kiss-muted, #888);
            }
            .mx-row-val {
                font-size: 16px;
                font-weight: 600;
                color: #00bcd4;
            }
        `;
        document.head.appendChild(style);

        return Promise.all([
            callOverview().catch(function() { return {}; }),
            callWafStats().catch(function() { return {}; }),
            callConnections().catch(function() { return {}; })
        ]);
    },

    render: function(data) {
        var o = data[0] || {};
        var w = data[1] || {};
        var c = data[2] || {};

        var memPct = o.mem_pct || 0;
        var memCls = memPct > 85 ? 'red' : (memPct > 70 ? 'orange' : 'green');

        var content = [
            // Header
            E('div', { 'class': 'mx-header' }, [
                E('div', { 'class': 'mx-title' }, 'Metrics Dashboard'),
                E('div', { 'class': 'mx-live' }, [
                    E('span', { 'class': 'mx-dot' }),
                    'LIVE',
                    E('span', { 'id': 'mx-time' }, new Date().toLocaleTimeString())
                ])
            ]),

            // Main stats grid
            E('div', { 'class': 'mx-grid' }, [
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '⏱'),
                    E('div', { 'class': 'mx-val green', 'id': 's-up' }, formatUptime(o.uptime || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'Uptime'),
                    E('div', { 'class': 'mx-sub', 'id': 's-load' }, 'Load: ' + (o.load || '0'))
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '🧠'),
                    E('div', { 'class': 'mx-val ' + memCls, 'id': 's-mem' }, memPct + '%'),
                    E('div', { 'class': 'mx-lbl' }, 'Memory'),
                    E('div', { 'class': 'mx-sub' }, formatMem(o.mem_used_kb || 0) + ' / ' + formatMem(o.mem_total_kb || 0))
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '🌐'),
                    E('div', { 'class': 'mx-val cyan', 'id': 's-vh' }, String(o.vhosts || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'vHosts')
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '🔒'),
                    E('div', { 'class': 'mx-val purple', 'id': 's-cert' }, String(o.certificates || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'SSL Certs')
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '📄'),
                    E('div', { 'class': 'mx-val cyan' }, String(o.metablogs || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'MetaBlogs')
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '🐍'),
                    E('div', { 'class': 'mx-val green' }, String(o.streamlits || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'Streamlits')
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '📦'),
                    E('div', { 'class': 'mx-val purple' }, String(o.lxc_containers || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'LXC')
                ]),
                E('div', { 'class': 'mx-card' }, [
                    E('div', { 'class': 'mx-icon' }, '🔗'),
                    E('div', { 'class': 'mx-val cyan', 'id': 's-tcp' }, String(c.total_tcp || 0)),
                    E('div', { 'class': 'mx-lbl' }, 'TCP Conns')
                ])
            ]),

            // Services bar
            E('div', { 'class': 'mx-svc' }, [
                E('span', { 'class': 'mx-svc-title' }, 'Services'),
                E('div', { 'class': 'mx-svc-item' }, [
                    E('span', { 'class': 'mx-svc-dot ' + (o.haproxy ? 'on' : 'off'), 'id': 'sv-ha' }),
                    'HAProxy'
                ]),
                E('div', { 'class': 'mx-svc-item' }, [
                    E('span', { 'class': 'mx-svc-dot ' + (o.mitmproxy ? 'on' : 'off'), 'id': 'sv-waf' }),
                    'WAF'
                ]),
                E('div', { 'class': 'mx-svc-item' }, [
                    E('span', { 'class': 'mx-svc-dot ' + (o.crowdsec ? 'on' : 'off'), 'id': 'sv-cs' }),
                    'CrowdSec'
                ])
            ]),

            // Panels
            E('div', { 'class': 'mx-panels' }, [
                // WAF Panel
                E('div', { 'class': 'mx-panel' }, [
                    E('div', { 'class': 'mx-panel-title' }, [
                        E('span', {}, '🛡'),
                        'WAF & Security'
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'Active Bans'),
                        E('span', { 'class': 'mx-row-val', 'id': 'w-bans', 'style': (w.active_bans || 0) > 0 ? 'color:#ff9800' : '' }, String(w.active_bans || 0))
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'Alerts (24h)'),
                        E('span', { 'class': 'mx-row-val', 'id': 'w-alerts' }, String(w.alerts_today || 0))
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'WAF Blocked'),
                        E('span', { 'class': 'mx-row-val', 'id': 'w-blocked', 'style': (w.waf_blocked || 0) > 0 ? 'color:#ff9800' : '' }, String(w.waf_blocked || 0))
                    ])
                ]),

                // Connections Panel
                E('div', { 'class': 'mx-panel' }, [
                    E('div', { 'class': 'mx-panel-title' }, [
                        E('span', {}, '🔗'),
                        'Connections'
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'HTTPS (443)'),
                        E('span', { 'class': 'mx-row-val', 'id': 'c-https' }, String(c.https || 0))
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'HTTP (80)'),
                        E('span', { 'class': 'mx-row-val', 'id': 'c-http' }, String(c.http || 0))
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'SSH (22)'),
                        E('span', { 'class': 'mx-row-val', 'id': 'c-ssh' }, String(c.ssh || 0))
                    ]),
                    E('div', { 'class': 'mx-row' }, [
                        E('span', { 'class': 'mx-row-label' }, 'Total TCP'),
                        E('span', { 'class': 'mx-row-val', 'id': 'c-total', 'style': 'color:#ab47bc' }, String(c.total_tcp || 0))
                    ])
                ])
            ])
        ];

        // Setup polling
        poll.add(L.bind(this.pollMetrics, this), 5);

        // Clock
        setInterval(function() {
            var el = document.getElementById('mx-time');
            if (el) el.textContent = new Date().toLocaleTimeString();
        }, 1000);

        return KissTheme.wrap(content, 'admin/status/metrics');
    },

    pollMetrics: function() {
        return Promise.all([
            callOverview(),
            callWafStats(),
            callConnections()
        ]).then(function(data) {
            var o = data[0] || {};
            var w = data[1] || {};
            var c = data[2] || {};

            var upd = {
                's-up': formatUptime(o.uptime || 0),
                's-load': 'Load: ' + (o.load || '0'),
                's-mem': (o.mem_pct || 0) + '%',
                's-vh': String(o.vhosts || 0),
                's-cert': String(o.certificates || 0),
                's-tcp': String(c.total_tcp || 0),
                'w-bans': String(w.active_bans || 0),
                'w-alerts': String(w.alerts_today || 0),
                'w-blocked': String(w.waf_blocked || 0),
                'c-https': String(c.https || 0),
                'c-http': String(c.http || 0),
                'c-ssh': String(c.ssh || 0),
                'c-total': String(c.total_tcp || 0)
            };

            for (var id in upd) {
                var el = document.getElementById(id);
                if (el) el.textContent = upd[id];
            }

            // Service dots
            var ha = document.getElementById('sv-ha');
            var waf = document.getElementById('sv-waf');
            var cs = document.getElementById('sv-cs');
            if (ha) ha.className = 'mx-svc-dot ' + (o.haproxy ? 'on' : 'off');
            if (waf) waf.className = 'mx-svc-dot ' + (o.mitmproxy ? 'on' : 'off');
            if (cs) cs.className = 'mx-svc-dot ' + (o.crowdsec ? 'on' : 'off');
        });
    }
});
