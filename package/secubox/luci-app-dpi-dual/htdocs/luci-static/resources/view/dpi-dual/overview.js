'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callStatus = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'status',
    expect: {}
});

var callGetFlows = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_flows',
    expect: {}
});

var callGetThreats = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_threats',
    params: ['limit'],
    expect: {}
});

var callGetCorrelation = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_correlation',
    params: ['limit'],
    expect: {}
});

var callStart = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'start',
    expect: {}
});

var callStop = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'stop',
    expect: {}
});

var callRestart = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'restart',
    expect: {}
});

var callCorrelateIP = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'correlate_ip',
    params: ['ip'],
    expect: {}
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTimestamp(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    return d.toLocaleTimeString();
}

function createStatusLED(running) {
    var color = running ? '#00d4aa' : '#ff4d4d';
    var label = running ? 'RUNNING' : 'STOPPED';
    return E('span', {
        'style': 'display:inline-flex;align-items:center;gap:6px;'
    }, [
        E('span', {
            'style': 'width:12px;height:12px;border-radius:50%;background:' + color +
                     ';box-shadow:0 0 8px ' + color + ';'
        }),
        E('span', { 'style': 'font-weight:600;color:' + color + ';' }, label)
    ]);
}

function createCard(title, icon, content, borderColor) {
    return E('div', {
        'class': 'cbi-section',
        'style': 'background:#12121a;border-radius:12px;padding:1rem;margin:0.5rem 0;' +
                 'border-left:4px solid ' + (borderColor || '#2a2a3a') + ';'
    }, [
        E('div', {
            'style': 'display:flex;align-items:center;gap:8px;margin-bottom:0.8rem;'
        }, [
            E('span', { 'style': 'font-size:1.3rem;' }, icon),
            E('span', { 'style': 'font-size:1.1rem;font-weight:600;color:#fff;' }, title)
        ]),
        E('div', {}, content)
    ]);
}

function createMetric(label, value, color) {
    return E('div', {
        'style': 'background:#1a1a24;padding:0.6rem 1rem;border-radius:8px;text-align:center;min-width:80px;'
    }, [
        E('div', {
            'style': 'font-size:1.5rem;font-weight:700;color:' + (color || '#00d4aa') + ';font-family:monospace;'
        }, String(value)),
        E('div', {
            'style': 'font-size:0.7rem;color:#808090;text-transform:uppercase;margin-top:2px;'
        }, label)
    ]);
}

function createThreatRow(threat) {
    var scoreColor = threat.threat_score > 70 ? '#ff4d4d' :
                     threat.threat_score > 40 ? '#ffa500' : '#00d4aa';

    return E('tr', {}, [
        E('td', { 'style': 'padding:8px;color:#808090;' }, formatTimestamp(threat.timestamp)),
        E('td', { 'style': 'padding:8px;font-family:monospace;color:#00a0ff;' }, threat.client_ip || '-'),
        E('td', { 'style': 'padding:8px;' }, threat.host || '-'),
        E('td', { 'style': 'padding:8px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' },
            threat.path || '-'),
        E('td', { 'style': 'padding:8px;' }, (threat.categories || []).join(', ') || '-'),
        E('td', { 'style': 'padding:8px;text-align:center;' },
            E('span', {
                'style': 'background:' + scoreColor + '22;color:' + scoreColor +
                         ';padding:2px 8px;border-radius:10px;font-weight:600;'
            }, String(threat.threat_score || 0))
        ),
        E('td', { 'style': 'padding:8px;text-align:center;' },
            threat.blocked ?
                E('span', { 'style': 'color:#ff4d4d;' }, '🚫') :
                E('span', { 'style': 'color:#808090;' }, '-')
        )
    ]);
}

return view.extend({
    load: function() {
        return Promise.all([
            callStatus().catch(function() { return {}; }),
            callGetFlows().catch(function() { return {}; }),
            callGetThreats(20).catch(function() { return { alerts: [] }; }),
            callGetCorrelation(10).catch(function() { return { correlated: [] }; })
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var flows = data[1] || {};
        var threats = data[2] || {};
        var correlation = data[3] || {};

        var mitm = status.mitm_stream || {};
        var tap = status.tap_stream || {};
        var corr = status.correlation || {};

        var view = E('div', { 'class': 'cbi-map', 'style': 'background:#0a0a12;min-height:100vh;' }, [
            // Header
            E('div', { 'style': 'text-align:center;padding:1rem 0;' }, [
                E('h1', {
                    'style': 'font-size:1.8rem;font-weight:700;background:linear-gradient(90deg,#00d4aa,#00a0ff);' +
                             '-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;'
                }, 'DPI Dual-Stream'),
                E('div', { 'style': 'color:#606070;margin-top:4px;' },
                    'Mode: ' + (status.mode || 'dual').toUpperCase())
            ]),

            // Action buttons
            E('div', { 'style': 'display:flex;gap:8px;justify-content:center;margin-bottom:1rem;' }, [
                E('button', {
                    'class': 'btn cbi-button cbi-button-apply',
                    'click': ui.createHandlerFn(this, function() {
                        return callStart().then(function() {
                            ui.addNotification(null, E('p', 'DPI started'), 'info');
                            window.location.reload();
                        });
                    })
                }, '▶ Start'),
                E('button', {
                    'class': 'btn cbi-button cbi-button-reset',
                    'click': ui.createHandlerFn(this, function() {
                        return callStop().then(function() {
                            ui.addNotification(null, E('p', 'DPI stopped'), 'info');
                            window.location.reload();
                        });
                    })
                }, '⏹ Stop'),
                E('button', {
                    'class': 'btn cbi-button',
                    'click': ui.createHandlerFn(this, function() {
                        return callRestart().then(function() {
                            ui.addNotification(null, E('p', 'DPI restarted'), 'info');
                            window.location.reload();
                        });
                    })
                }, '🔄 Restart')
            ]),

            // Stream status cards
            E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;' }, [
                // MITM Stream Card
                createCard('MITM Stream', '🔍', E('div', {}, [
                    E('div', { 'style': 'margin-bottom:0.8rem;' }, createStatusLED(mitm.running)),
                    E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;' }, [
                        createMetric('Buffer', mitm.buffer_entries || 0, '#00d4aa'),
                        createMetric('Threats', mitm.threats_detected || 0, '#ffa500'),
                        createMetric('Blocked', mitm.blocked_count || 0, '#ff4d4d')
                    ])
                ]), mitm.running ? '#00d4aa' : '#ff4d4d'),

                // TAP Stream Card
                createCard('TAP Stream', '📡', E('div', {}, [
                    E('div', { 'style': 'margin-bottom:0.8rem;' }, createStatusLED(tap.running)),
                    E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;' }, [
                        createMetric('Interface', tap.interface || 'tap0', tap.interface_up ? '#00d4aa' : '#808090'),
                        createMetric('RX', formatBytes(tap.rx_bytes || 0), '#00a0ff'),
                        createMetric('TX', formatBytes(tap.tx_bytes || 0), '#00a0ff'),
                        createMetric('Flows/min', tap.flows_1min || 0, '#00d4aa')
                    ])
                ]), tap.running ? '#00d4aa' : '#ff4d4d'),

                // Correlation Card
                createCard('Correlation Engine', '🔗', E('div', {}, [
                    E('div', { 'style': 'margin-bottom:0.8rem;' }, createStatusLED(corr.running)),
                    E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;' }, [
                        createMetric('Correlated', corr.threats_correlated || 0, '#ffa500')
                    ]),
                    E('div', { 'style': 'margin-top:0.8rem;' }, [
                        E('input', {
                            'type': 'text',
                            'id': 'correlate-ip',
                            'placeholder': 'IP to correlate...',
                            'style': 'background:#1a1a24;border:1px solid #2a2a3a;border-radius:6px;' +
                                     'padding:6px 10px;color:#fff;width:140px;margin-right:8px;'
                        }),
                        E('button', {
                            'class': 'btn cbi-button',
                            'click': ui.createHandlerFn(this, function() {
                                var ip = document.getElementById('correlate-ip').value;
                                if (ip) {
                                    return callCorrelateIP(ip).then(function(res) {
                                        ui.addNotification(null, E('p', res.message || 'Correlation triggered'), 'info');
                                    });
                                }
                            })
                        }, 'Correlate')
                    ])
                ]), corr.running ? '#00d4aa' : '#808090')
            ]),

            // Threats Table
            createCard('Recent Threats', '⚠️', E('div', {}, [
                E('div', { 'style': 'color:#808090;margin-bottom:8px;' },
                    'Total alerts: ' + (threats.total || 0)),
                E('div', { 'style': 'overflow-x:auto;' }, [
                    E('table', {
                        'style': 'width:100%;border-collapse:collapse;font-size:0.85rem;'
                    }, [
                        E('thead', {}, [
                            E('tr', { 'style': 'border-bottom:1px solid #2a2a3a;' }, [
                                E('th', { 'style': 'padding:8px;text-align:left;color:#808090;' }, 'Time'),
                                E('th', { 'style': 'padding:8px;text-align:left;color:#808090;' }, 'Client IP'),
                                E('th', { 'style': 'padding:8px;text-align:left;color:#808090;' }, 'Host'),
                                E('th', { 'style': 'padding:8px;text-align:left;color:#808090;' }, 'Path'),
                                E('th', { 'style': 'padding:8px;text-align:left;color:#808090;' }, 'Categories'),
                                E('th', { 'style': 'padding:8px;text-align:center;color:#808090;' }, 'Score'),
                                E('th', { 'style': 'padding:8px;text-align:center;color:#808090;' }, 'Blocked')
                            ])
                        ]),
                        E('tbody', {},
                            ((threats.alerts || []).slice(-15).reverse()).map(createThreatRow)
                        )
                    ])
                ])
            ]), '#ffa500'),

            // Flow Protocols
            flows.protocols ? createCard('Protocol Distribution', '📊', E('div', {}, [
                E('div', { 'style': 'display:flex;flex-wrap:wrap;gap:8px;' },
                    Object.entries(flows.protocols || {}).slice(0, 10).map(function(entry) {
                        return E('div', {
                            'style': 'background:#1a1a24;padding:6px 12px;border-radius:6px;'
                        }, [
                            E('span', { 'style': 'color:#00d4aa;font-weight:600;' }, entry[0]),
                            E('span', { 'style': 'color:#808090;margin-left:6px;' }, '(' + entry[1] + ')')
                        ]);
                    })
                )
            ]), '#00a0ff') : E('div')
        ]);

        // Auto-refresh every 10 seconds
        poll.add(L.bind(function() {
            return Promise.all([
                callStatus().catch(function() { return {}; }),
                callGetThreats(20).catch(function() { return { alerts: [] }; })
            ]).then(L.bind(function(data) {
                // Update would require DOM manipulation - for now just log
                // Full implementation would update metrics in place
            }, this));
        }, this), 10);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
