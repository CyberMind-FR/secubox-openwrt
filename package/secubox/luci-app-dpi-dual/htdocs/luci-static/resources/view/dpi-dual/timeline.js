'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callGetTimeline = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_timeline',
    params: ['limit'],
    expect: {}
});

var callGetCorrelationStats = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_correlation_stats',
    expect: {}
});

var callGetIPContext = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_ip_context',
    params: ['ip'],
    expect: {}
});

var callSearchCorrelations = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'search_correlations',
    params: ['ip', 'limit'],
    expect: {}
});

var callBanIP = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'ban_ip',
    params: ['ip', 'duration'],
    expect: {}
});

function formatTime(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    return d.toLocaleString();
}

function getEventColor(event_type) {
    switch (event_type) {
        case 'waf_block': return '#ff4d4d';
        case 'waf_alert': return '#ffa500';
        case 'crowdsec_ban': return '#ff6b6b';
        case 'dpi_threat': return '#00a0ff';
        case 'scanner': return '#ff00ff';
        default: return '#808090';
    }
}

function getScoreColor(score) {
    if (score >= 70) return '#ff4d4d';
    if (score >= 40) return '#ffa500';
    return '#00d4aa';
}

function createStatCard(label, value, color) {
    return E('div', {
        'style': 'background:#1a1a24;padding:1rem;border-radius:8px;text-align:center;min-width:120px;'
    }, [
        E('div', {
            'style': 'font-size:2rem;font-weight:700;color:' + (color || '#00d4aa') + ';font-family:monospace;'
        }, String(value)),
        E('div', {
            'style': 'font-size:0.8rem;color:#808090;text-transform:uppercase;margin-top:4px;'
        }, label)
    ]);
}

function createTimelineEntry(entry, self) {
    var color = getEventColor(entry.event_type);
    var scoreColor = getScoreColor(entry.threat_score || 0);

    return E('div', {
        'class': 'timeline-entry',
        'style': 'background:#12121a;border-radius:8px;padding:1rem;margin:0.5rem 0;' +
                 'border-left:4px solid ' + color + ';position:relative;'
    }, [
        // Timeline dot
        E('div', {
            'style': 'position:absolute;left:-8px;top:50%;transform:translateY(-50%);' +
                     'width:12px;height:12px;border-radius:50%;background:' + color + ';' +
                     'box-shadow:0 0 8px ' + color + ';'
        }),

        // Header row
        E('div', {
            'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;'
        }, [
            E('div', { 'style': 'display:flex;align-items:center;gap:10px;' }, [
                E('span', {
                    'style': 'font-family:monospace;font-size:1.1rem;color:#00a0ff;cursor:pointer;',
                    'click': function() {
                        self.showIPContext(entry.ip);
                    }
                }, entry.ip || '-'),
                E('span', {
                    'style': 'background:' + color + '22;color:' + color +
                             ';padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;'
                }, entry.event_type || 'unknown')
            ]),
            E('span', { 'style': 'color:#808090;font-size:0.8rem;' }, formatTime(entry.timestamp))
        ]),

        // Details row
        E('div', { 'style': 'display:flex;gap:1rem;flex-wrap:wrap;' }, [
            E('div', {}, [
                E('span', { 'style': 'color:#606070;font-size:0.75rem;' }, 'Reason: '),
                E('span', { 'style': 'color:#fff;' }, entry.reason || '-')
            ]),
            E('div', {}, [
                E('span', { 'style': 'color:#606070;font-size:0.75rem;' }, 'Threat: '),
                E('span', {
                    'style': 'color:' + scoreColor + ';font-weight:600;'
                }, String(entry.threat_score || 0))
            ]),
            E('div', {}, [
                E('span', { 'style': 'color:#606070;font-size:0.75rem;' }, 'Reputation: '),
                E('span', { 'style': 'color:#ffa500;font-weight:600;' }, String(entry.reputation_score || 0))
            ]),
            entry.crowdsec_status === 'banned' ?
                E('span', {
                    'style': 'background:#ff4d4d22;color:#ff4d4d;padding:2px 8px;border-radius:10px;font-size:0.75rem;'
                }, '🚫 BANNED') : null
        ].filter(Boolean)),

        // Action buttons
        E('div', { 'style': 'margin-top:0.5rem;display:flex;gap:8px;' }, [
            E('button', {
                'class': 'btn cbi-button',
                'style': 'font-size:0.75rem;padding:4px 10px;',
                'click': function() {
                    self.showIPContext(entry.ip);
                }
            }, '🔍 Context'),
            entry.crowdsec_status !== 'banned' ?
                E('button', {
                    'class': 'btn cbi-button cbi-button-negative',
                    'style': 'font-size:0.75rem;padding:4px 10px;',
                    'click': function() {
                        self.banIP(entry.ip);
                    }
                }, '🚫 Ban') : null
        ].filter(Boolean))
    ]);
}

return view.extend({
    selectedIP: null,

    load: function() {
        return Promise.all([
            callGetTimeline(50).catch(function() { return { entries: [] }; }),
            callGetCorrelationStats().catch(function() { return {}; })
        ]);
    },

    showIPContext: function(ip) {
        var self = this;

        ui.showModal('IP Context: ' + ip, [
            E('div', { 'style': 'min-width:500px;' }, [
                E('div', { 'id': 'ip-context-loading', 'style': 'text-align:center;padding:2rem;' },
                    E('em', {}, 'Loading context...'))
            ]),
            E('div', { 'class': 'right' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Close')
            ])
        ]);

        callGetIPContext(ip).then(function(ctx) {
            var content = E('div', {}, [
                E('div', { 'style': 'margin-bottom:1rem;' }, [
                    E('strong', {}, 'IP: '),
                    E('span', { 'style': 'font-family:monospace;color:#00a0ff;' }, ctx.ip || ip),
                    E('span', { 'style': 'margin-left:1rem;' }, [
                        E('strong', {}, 'Reputation: '),
                        E('span', {
                            'style': 'color:' + getScoreColor(ctx.reputation_score || 0) + ';font-weight:600;'
                        }, String(ctx.reputation_score || 0))
                    ]),
                    E('span', { 'style': 'margin-left:1rem;' }, [
                        E('strong', {}, 'CrowdSec: '),
                        E('span', {
                            'style': 'color:' + (ctx.crowdsec_status === 'banned' ? '#ff4d4d' : '#00d4aa') + ';'
                        }, ctx.crowdsec_status || 'clean')
                    ])
                ]),

                ctx.context && ctx.context.mitm_requests && ctx.context.mitm_requests.length > 0 ?
                    E('div', { 'style': 'margin-bottom:1rem;' }, [
                        E('h4', { 'style': 'color:#00d4aa;margin-bottom:0.5rem;' }, 'MITM Requests'),
                        E('div', { 'style': 'max-height:150px;overflow-y:auto;background:#1a1a24;padding:8px;border-radius:6px;' },
                            ctx.context.mitm_requests.map(function(req) {
                                return E('div', { 'style': 'font-family:monospace;font-size:0.8rem;margin:2px 0;' },
                                    (req.method || 'GET') + ' ' + (req.host || '') + (req.path || '/'));
                            })
                        )
                    ]) : null,

                ctx.context && ctx.context.waf_alerts && ctx.context.waf_alerts.length > 0 ?
                    E('div', { 'style': 'margin-bottom:1rem;' }, [
                        E('h4', { 'style': 'color:#ffa500;margin-bottom:0.5rem;' }, 'WAF Alerts'),
                        E('div', { 'style': 'max-height:150px;overflow-y:auto;background:#1a1a24;padding:8px;border-radius:6px;' },
                            ctx.context.waf_alerts.map(function(alert) {
                                return E('div', { 'style': 'font-family:monospace;font-size:0.8rem;margin:2px 0;' },
                                    '[Score: ' + (alert.threat_score || 0) + '] ' + (alert.path || '/'));
                            })
                        )
                    ]) : null

            ].filter(Boolean));

            var loadingEl = document.getElementById('ip-context-loading');
            if (loadingEl) {
                loadingEl.parentNode.replaceChild(content, loadingEl);
            }
        });
    },

    banIP: function(ip) {
        var self = this;

        if (!confirm('Ban IP ' + ip + ' for 4 hours?')) {
            return;
        }

        callBanIP(ip, '4h').then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', res.message), 'info');
                window.location.reload();
            } else {
                ui.addNotification(null, E('p', 'Error: ' + (res.error || 'Unknown')), 'error');
            }
        });
    },

    render: function(data) {
        var timeline = data[0] || {};
        var stats = data[1] || {};
        var self = this;

        var entries = timeline.entries || [];

        var view = E('div', { 'class': 'cbi-map', 'style': 'background:#0a0a12;min-height:100vh;' }, [
            // Header
            E('div', { 'style': 'text-align:center;padding:1rem 0;' }, [
                E('h1', {
                    'style': 'font-size:1.8rem;font-weight:700;background:linear-gradient(90deg,#ffa500,#ff6b6b);' +
                             '-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0;'
                }, 'Correlation Timeline'),
                E('div', { 'style': 'color:#606070;margin-top:4px;' },
                    'Threat correlation across MITM + TAP streams')
            ]),

            // Stats row
            E('div', {
                'style': 'display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem;'
            }, [
                createStatCard('Total', stats.total_correlations || 0, '#00d4aa'),
                createStatCard('High Threat', stats.high_threat_count || 0, '#ff4d4d'),
                createStatCard('Banned IPs', stats.banned_ips || 0, '#ff6b6b'),
                createStatCard('Unique IPs', stats.unique_ips || 0, '#00a0ff')
            ]),

            // Search bar
            E('div', { 'style': 'display:flex;gap:8px;justify-content:center;margin-bottom:1rem;' }, [
                E('input', {
                    'type': 'text',
                    'id': 'search-ip',
                    'placeholder': 'Search by IP...',
                    'style': 'background:#1a1a24;border:1px solid #2a2a3a;border-radius:6px;' +
                             'padding:8px 12px;color:#fff;width:200px;'
                }),
                E('button', {
                    'class': 'btn cbi-button cbi-button-apply',
                    'click': function() {
                        var ip = document.getElementById('search-ip').value;
                        if (ip) {
                            callSearchCorrelations(ip, 50).then(function(res) {
                                ui.addNotification(null, E('p', 'Found ' + (res.results || []).length + ' correlations'), 'info');
                            });
                        }
                    }
                }, '🔍 Search')
            ]),

            // Timeline
            E('div', { 'style': 'max-width:800px;margin:0 auto;padding:0 1rem;position:relative;' }, [
                // Vertical line
                E('div', {
                    'style': 'position:absolute;left:calc(1rem - 2px);top:0;bottom:0;width:4px;' +
                             'background:linear-gradient(to bottom,#2a2a3a,transparent);border-radius:2px;'
                }),

                // Timeline entries
                E('div', { 'style': 'padding-left:1.5rem;' },
                    entries.length > 0 ?
                        entries.reverse().map(function(entry) {
                            return createTimelineEntry(entry, self);
                        }) :
                        E('div', { 'style': 'text-align:center;color:#606070;padding:2rem;' },
                            'No correlation events yet')
                )
            ])
        ]);

        // Auto-refresh
        poll.add(L.bind(function() {
            return callGetTimeline(50).then(function() {
                // Refresh handled by poll
            });
        }, this), 30);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
