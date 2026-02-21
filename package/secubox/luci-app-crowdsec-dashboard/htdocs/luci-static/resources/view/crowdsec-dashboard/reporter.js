'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require rpc';

var callStatus = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'status',
    expect: { }
});

var callHistory = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'history',
    params: ['lines'],
    expect: { }
});

var callCheckIp = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'check_ip',
    params: ['ip'],
    expect: { }
});

var callReport = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'report',
    expect: { }
});

var callSetEnabled = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'set_enabled',
    params: ['enabled'],
    expect: { }
});

var callSetApiKey = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'set_api_key',
    params: ['api_key'],
    expect: { }
});

var callGetConfig = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'get_config',
    expect: { }
});

var callSaveConfig = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'save_config',
    params: ['confidence_threshold', 'categories', 'report_interval', 'max_reports_per_run', 'cooldown_minutes', 'comment_prefix'],
    expect: { }
});

var callLogs = rpc.declare({
    object: 'luci.crowdsec-abuseipdb',
    method: 'logs',
    params: ['lines'],
    expect: { }
});

return view.extend({
    refreshInterval: 30,

    load: function() {
        return Promise.all([
            callStatus(),
            callGetConfig(),
            callHistory(20),
            callLogs(30)
        ]);
    },

    formatTimestamp: function(ts) {
        if (!ts || ts === 0) return 'Never';
        var d = new Date(ts * 1000);
        return d.toLocaleString();
    },

    renderStatusCard: function(status) {
        var enabled = status.enabled === true;
        var apiConfigured = status.api_key_configured === true;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'AbuseIPDB Reporter Status'),
            E('div', { 'class': 'table', 'style': 'margin-bottom: 1em' }, [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'width: 200px; font-weight: bold' }, 'Status'),
                    E('div', { 'class': 'td' }, [
                        E('span', {
                            'style': 'padding: 4px 12px; border-radius: 4px; background: ' +
                                (enabled && apiConfigured ? '#4CAF50' : enabled ? '#FF9800' : '#f44336') + '; color: white;'
                        }, enabled && apiConfigured ? 'Active' : enabled ? 'Enabled (No API Key)' : 'Disabled')
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'API Key'),
                    E('div', { 'class': 'td' }, apiConfigured ? 'Configured' : 'Not configured')
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Pending IPs'),
                    E('div', { 'class': 'td' }, [
                        E('strong', { 'style': 'color: #2196F3' }, (status.pending_ips || 0).toString())
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Reported Today'),
                    E('div', { 'class': 'td' }, [
                        E('strong', { 'style': 'color: #4CAF50' }, (status.reported_today || 0).toString())
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Reported This Week'),
                    E('div', { 'class': 'td' }, (status.reported_week || 0).toString())
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Total Reported'),
                    E('div', { 'class': 'td' }, (status.reported_total || 0).toString())
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Last Report'),
                    E('div', { 'class': 'td' }, this.formatTimestamp(status.last_report))
                ])
            ])
        ]);
    },

    renderControls: function(status, config) {
        var self = this;
        var enabled = status.enabled === true;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Controls'),
            E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1em' }, [
                E('button', {
                    'class': enabled ? 'btn cbi-button-remove' : 'btn cbi-button-apply',
                    'click': ui.createHandlerFn(this, function() {
                        return callSetEnabled(!enabled).then(function() {
                            ui.addNotification(null, E('p', {}, enabled ? 'Reporter disabled' : 'Reporter enabled'));
                            return self.refresh();
                        });
                    })
                }, enabled ? 'Disable' : 'Enable'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'disabled': !enabled || !status.api_key_configured,
                    'click': ui.createHandlerFn(this, function() {
                        ui.showModal('Reporting...', [
                            E('p', { 'class': 'spinning' }, 'Reporting blocked IPs to AbuseIPDB...')
                        ]);
                        return callReport().then(function(res) {
                            ui.hideModal();
                            ui.addNotification(null, E('p', {}, res.message || 'Report started'));
                            setTimeout(function() { self.refresh(); }, 5000);
                        });
                    })
                }, 'Report Now')
            ])
        ]);
    },

    renderApiKeyConfig: function(config) {
        var self = this;
        var input = E('input', {
            'type': 'password',
            'placeholder': 'Enter AbuseIPDB API key...',
            'style': 'width: 400px; margin-right: 10px'
        });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'API Key Configuration'),
            E('p', { 'style': 'color: #888; margin-bottom: 1em' }, [
                'Get your free API key from ',
                E('a', { 'href': 'https://www.abuseipdb.com/account/api', 'target': '_blank' }, 'AbuseIPDB'),
                ' (requires account registration)'
            ]),
            E('div', { 'style': 'display: flex; align-items: center; flex-wrap: wrap; gap: 10px' }, [
                input,
                E('button', {
                    'class': 'btn cbi-button-apply',
                    'click': function() {
                        var key = input.value.trim();
                        if (!key) {
                            ui.addNotification(null, E('p', {}, 'Please enter an API key'));
                            return;
                        }
                        return callSetApiKey(key).then(function(res) {
                            if (res.success) {
                                input.value = '';
                                ui.addNotification(null, E('p', {}, 'API key saved'));
                                return self.refresh();
                            }
                        });
                    }
                }, 'Save Key'),
                config.api_key_set ? E('span', { 'style': 'color: #4CAF50' }, 'Key is configured') : null
            ])
        ]);
    },

    renderCheckIp: function() {
        var input = E('input', {
            'type': 'text',
            'placeholder': 'Enter IP to check...',
            'style': 'width: 200px; margin-right: 10px'
        });
        var result = E('div', { 'id': 'check-result', 'style': 'margin-top: 1em' });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Check IP Reputation'),
            E('div', { 'style': 'display: flex; align-items: center; flex-wrap: wrap; gap: 10px' }, [
                input,
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        var ip = input.value.trim();
                        if (!ip) {
                            result.textContent = 'Please enter an IP';
                            return;
                        }
                        result.innerHTML = '<span class="spinning">Checking...</span>';
                        callCheckIp(ip).then(function(res) {
                            if (res.success) {
                                var scoreColor = res.confidence_score > 75 ? '#f44336' :
                                                 res.confidence_score > 25 ? '#FF9800' : '#4CAF50';
                                result.innerHTML = '<div style="background: #1a1a2e; padding: 1em; border-radius: 4px; margin-top: 1em">' +
                                    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1em">' +
                                    '<div><strong>Confidence Score</strong><br><span style="font-size: 1.5em; color: ' + scoreColor + '">' + res.confidence_score + '%</span></div>' +
                                    '<div><strong>Total Reports</strong><br>' + res.total_reports + '</div>' +
                                    '<div><strong>Country</strong><br>' + res.country + '</div>' +
                                    '<div><strong>ISP</strong><br>' + (res.isp || 'Unknown') + '</div>' +
                                    (res.domain ? '<div><strong>Domain</strong><br>' + res.domain + '</div>' : '') +
                                    (res.last_reported ? '<div><strong>Last Reported</strong><br>' + res.last_reported + '</div>' : '') +
                                    '</div></div>';
                            } else {
                                result.innerHTML = '<span style="color: #f44336">Error: ' + (res.error || 'Check failed') + '</span>';
                            }
                        }).catch(function(e) {
                            result.innerHTML = '<span style="color: #f44336">Error: ' + e.message + '</span>';
                        });
                    }
                }, 'Check')
            ]),
            result
        ]);
    },

    renderHistory: function(history) {
        var entries = (history && history.history) || [];

        var rows = entries.map(function(entry) {
            return E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td', 'style': 'width: 180px' }, entry.timestamp || '?'),
                E('div', { 'class': 'td', 'style': 'width: 150px; font-family: monospace' }, entry.ip || '?'),
                E('div', { 'class': 'td', 'style': 'width: 80px; text-align: center' }, [
                    E('span', {
                        'style': 'padding: 2px 8px; border-radius: 4px; background: ' +
                            (parseInt(entry.score) > 75 ? '#f44336' : parseInt(entry.score) > 25 ? '#FF9800' : '#4CAF50') + '; color: white;'
                    }, entry.score || '?')
                ])
            ]);
        });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Recent Reports'),
            E('div', { 'class': 'table' }, [
                E('div', { 'class': 'tr cbi-section-table-titles' }, [
                    E('div', { 'class': 'th', 'style': 'width: 180px' }, 'Timestamp'),
                    E('div', { 'class': 'th', 'style': 'width: 150px' }, 'IP Address'),
                    E('div', { 'class': 'th', 'style': 'width: 80px; text-align: center' }, 'Score')
                ])
            ].concat(rows.length > 0 ? rows : [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'colspan': '3', 'style': 'color: #888; text-align: center' }, 'No reports yet')
                ])
            ]))
        ]);
    },

    renderLogs: function(logs) {
        var entries = (logs && logs.logs) || [];

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Logs'),
            E('div', {
                'style': 'background: #1a1a2e; color: #0f0; font-family: monospace; padding: 1em; border-radius: 4px; max-height: 250px; overflow-y: auto; font-size: 0.85em'
            }, entries.length > 0 ?
                entries.map(function(line) {
                    var color = '#0f0';
                    if (line.indexOf('[ERROR]') >= 0) color = '#f44336';
                    else if (line.indexOf('[WARN]') >= 0) color = '#FF9800';
                    else if (line.indexOf('[INFO]') >= 0) color = '#00bcd4';
                    else if (line.indexOf('[DEBUG]') >= 0) color = '#888';
                    return E('div', { 'style': 'color: ' + color + '; margin-bottom: 2px' }, line);
                }) :
                E('div', { 'style': 'color: #888' }, 'No log entries')
            )
        ]);
    },

    refresh: function() {
        var self = this;
        return this.load().then(function(data) {
            var container = document.getElementById('reporter-container');
            if (container) {
                dom.content(container, self.renderContent(data));
            }
        });
    },

    renderContent: function(data) {
        var status = data[0] || {};
        var config = data[1] || {};
        var history = data[2] || {};
        var logs = data[3] || {};

        return E('div', {}, [
            E('h2', {}, 'AbuseIPDB Reporter'),
            E('p', { 'style': 'color: #888; margin-bottom: 1em' },
                'Report CrowdSec blocked IPs to AbuseIPDB community database for collaborative threat intelligence.'),
            this.renderStatusCard(status),
            this.renderControls(status, config),
            this.renderApiKeyConfig(config),
            this.renderCheckIp(),
            this.renderHistory(history),
            this.renderLogs(logs)
        ]);
    },

    render: function(data) {
        var self = this;

        poll.add(function() {
            return self.refresh();
        }, this.refreshInterval);

        return E('div', { 'id': 'reporter-container' }, this.renderContent(data));
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
