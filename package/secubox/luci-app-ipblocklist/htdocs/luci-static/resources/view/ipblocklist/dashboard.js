'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require ipblocklist.api as api';

return view.extend({
    refreshInterval: 30,
    statusData: null,

    load: function() {
        return Promise.all([
            api.getStatus(),
            api.getSources(),
            api.getWhitelist(),
            api.getLogs(20)
        ]);
    },

    formatBytes: function(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatTimestamp: function(ts) {
        if (!ts || ts === 0) return 'Never';
        var d = new Date(ts * 1000);
        return d.toLocaleString();
    },

    renderStatusCard: function(status) {
        var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;
        var entryCount = parseInt(status.entry_count) || 0;
        var maxEntries = parseInt(status.max_entries) || 200000;
        var memoryBytes = parseInt(status.memory_bytes) || 0;
        var usagePercent = maxEntries > 0 ? Math.round((entryCount / maxEntries) * 100) : 0;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Status'),
            E('div', { 'class': 'table', 'style': 'margin-bottom: 1em' }, [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'width: 200px; font-weight: bold' }, 'Service Status'),
                    E('div', { 'class': 'td' }, [
                        E('span', {
                            'class': enabled ? 'badge success' : 'badge warning',
                            'style': 'padding: 4px 12px; border-radius: 4px; background: ' + (enabled ? '#4CAF50' : '#FF9800') + '; color: white;'
                        }, enabled ? 'Enabled' : 'Disabled')
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Blocked IPs'),
                    E('div', { 'class': 'td' }, [
                        E('strong', { 'style': 'font-size: 1.2em; color: #f44336' }, entryCount.toLocaleString()),
                        E('span', { 'style': 'color: #888; margin-left: 8px' }, '/ ' + maxEntries.toLocaleString() + ' (' + usagePercent + '%)')
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Memory Usage'),
                    E('div', { 'class': 'td' }, this.formatBytes(memoryBytes))
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Firewall Backend'),
                    E('div', { 'class': 'td' }, status.firewall_backend || 'Unknown')
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Last Update'),
                    E('div', { 'class': 'td' }, this.formatTimestamp(status.last_update))
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Sources'),
                    E('div', { 'class': 'td' }, (status.source_count || 0) + ' configured')
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'font-weight: bold' }, 'Whitelist'),
                    E('div', { 'class': 'td' }, (status.whitelist_count || 0) + ' entries')
                ])
            ])
        ]);
    },

    renderControls: function(status) {
        var self = this;
        var enabled = status.enabled === true || status.enabled === '1' || status.enabled === 1;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Controls'),
            E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1em' }, [
                E('button', {
                    'class': enabled ? 'btn cbi-button-remove' : 'btn cbi-button-apply',
                    'click': ui.createHandlerFn(this, function() {
                        return api.setEnabled(!enabled).then(function() {
                            ui.addNotification(null, E('p', {}, enabled ? 'IP Blocklist disabled' : 'IP Blocklist enabled'));
                            return self.refresh();
                        });
                    })
                }, enabled ? 'Disable' : 'Enable'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': ui.createHandlerFn(this, function() {
                        ui.showModal('Updating...', [
                            E('p', { 'class': 'spinning' }, 'Downloading and applying blocklists...')
                        ]);
                        return api.update().then(function(res) {
                            ui.hideModal();
                            ui.addNotification(null, E('p', {}, res.message || 'Update started'));
                            setTimeout(function() { self.refresh(); }, 3000);
                        });
                    })
                }, 'Update Now'),
                E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': ui.createHandlerFn(this, function() {
                        ui.showModal('Confirm Flush', [
                            E('p', {}, 'This will remove all IPs from the blocklist. Continue?'),
                            E('div', { 'class': 'right' }, [
                                E('button', {
                                    'class': 'btn',
                                    'click': ui.hideModal
                                }, 'Cancel'),
                                ' ',
                                E('button', {
                                    'class': 'btn cbi-button-negative',
                                    'click': function() {
                                        ui.hideModal();
                                        return api.flush().then(function(res) {
                                            ui.addNotification(null, E('p', {}, res.message || 'Blocklist flushed'));
                                            return self.refresh();
                                        });
                                    }
                                }, 'Flush')
                            ])
                        ]);
                    })
                }, 'Flush')
            ])
        ]);
    },

    renderTestIp: function() {
        var self = this;
        var input = E('input', {
            'type': 'text',
            'placeholder': 'Enter IP address...',
            'style': 'width: 200px; margin-right: 10px'
        });
        var result = E('span', { 'id': 'test-result', 'style': 'margin-left: 10px' });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Test IP'),
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
                        result.textContent = 'Testing...';
                        api.testIp(ip).then(function(res) {
                            if (res.blocked) {
                                result.innerHTML = '<span style="color: #f44336; font-weight: bold">BLOCKED</span>';
                            } else {
                                result.innerHTML = '<span style="color: #4CAF50; font-weight: bold">ALLOWED</span>';
                            }
                        }).catch(function(e) {
                            result.textContent = 'Error: ' + e.message;
                        });
                    }
                }, 'Test'),
                result
            ])
        ]);
    },

    renderSources: function(sources) {
        var self = this;
        var sourceList = (sources && sources.sources) || [];
        var input = E('input', {
            'type': 'text',
            'placeholder': 'https://...',
            'style': 'flex: 1; min-width: 300px; margin-right: 10px'
        });

        var rows = sourceList.map(function(src) {
            return E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td', 'style': 'word-break: break-all' }, src),
                E('div', { 'class': 'td', 'style': 'width: 80px; text-align: right' }, [
                    E('button', {
                        'class': 'btn cbi-button-remove',
                        'style': 'padding: 2px 8px',
                        'click': function() {
                            return api.removeSource(src).then(function() {
                                ui.addNotification(null, E('p', {}, 'Source removed'));
                                return self.refresh();
                            });
                        }
                    }, 'Remove')
                ])
            ]);
        });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Blocklist Sources'),
            E('div', { 'class': 'table' }, rows.length > 0 ? rows : [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'color: #888' }, 'No sources configured')
                ])
            ]),
            E('div', { 'style': 'display: flex; align-items: center; margin-top: 1em; flex-wrap: wrap; gap: 10px' }, [
                input,
                E('button', {
                    'class': 'btn cbi-button-add',
                    'click': function() {
                        var url = input.value.trim();
                        if (!url || !url.startsWith('http')) {
                            ui.addNotification(null, E('p', {}, 'Please enter a valid URL'));
                            return;
                        }
                        return api.addSource(url).then(function() {
                            input.value = '';
                            ui.addNotification(null, E('p', {}, 'Source added'));
                            return self.refresh();
                        });
                    }
                }, 'Add Source')
            ])
        ]);
    },

    renderWhitelist: function(whitelist) {
        var self = this;
        var entries = (whitelist && whitelist.entries) || [];
        var input = E('input', {
            'type': 'text',
            'placeholder': 'IP or CIDR (e.g., 192.168.1.0/24)',
            'style': 'width: 200px; margin-right: 10px'
        });

        var rows = entries.map(function(entry) {
            return E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td' }, entry),
                E('div', { 'class': 'td', 'style': 'width: 80px; text-align: right' }, [
                    E('button', {
                        'class': 'btn cbi-button-remove',
                        'style': 'padding: 2px 8px',
                        'click': function() {
                            return api.removeWhitelist(entry).then(function() {
                                ui.addNotification(null, E('p', {}, 'Entry removed from whitelist'));
                                return self.refresh();
                            });
                        }
                    }, 'Remove')
                ])
            ]);
        });

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Whitelist (Excluded IPs)'),
            E('div', { 'class': 'table' }, rows.length > 0 ? rows : [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td', 'style': 'color: #888' }, 'No whitelist entries')
                ])
            ]),
            E('div', { 'style': 'display: flex; align-items: center; margin-top: 1em; flex-wrap: wrap; gap: 10px' }, [
                input,
                E('button', {
                    'class': 'btn cbi-button-add',
                    'click': function() {
                        var entry = input.value.trim();
                        if (!entry) {
                            ui.addNotification(null, E('p', {}, 'Please enter an IP or CIDR'));
                            return;
                        }
                        return api.addWhitelist(entry).then(function() {
                            input.value = '';
                            ui.addNotification(null, E('p', {}, 'Added to whitelist'));
                            return self.refresh();
                        });
                    }
                }, 'Add')
            ])
        ]);
    },

    renderLogs: function(logs) {
        var logEntries = (logs && logs.logs) || [];

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Recent Activity'),
            E('div', {
                'style': 'background: #1a1a2e; color: #0f0; font-family: monospace; padding: 1em; border-radius: 4px; max-height: 300px; overflow-y: auto; font-size: 0.85em'
            }, logEntries.length > 0 ?
                logEntries.map(function(line) {
                    var color = '#0f0';
                    if (line.indexOf('[ERROR]') >= 0) color = '#f44336';
                    else if (line.indexOf('[WARN]') >= 0) color = '#FF9800';
                    else if (line.indexOf('[INFO]') >= 0) color = '#00bcd4';
                    return E('div', { 'style': 'color: ' + color + '; margin-bottom: 2px' }, line);
                }) :
                E('div', { 'style': 'color: #888' }, 'No log entries yet')
            )
        ]);
    },

    refresh: function() {
        var self = this;
        return this.load().then(function(data) {
            var container = document.getElementById('ipblocklist-container');
            if (container) {
                dom.content(container, self.renderContent(data));
            }
        });
    },

    renderContent: function(data) {
        var status = data[0] || {};
        var sources = data[1] || {};
        var whitelist = data[2] || {};
        var logs = data[3] || {};

        return E('div', {}, [
            E('h2', {}, 'IP Blocklist'),
            E('p', { 'style': 'color: #888; margin-bottom: 1em' },
                'Pre-emptive static threat defense layer. Blocks known malicious IPs at kernel level before CrowdSec reactive analysis.'),
            this.renderStatusCard(status),
            this.renderControls(status),
            this.renderTestIp(),
            this.renderSources(sources),
            this.renderWhitelist(whitelist),
            this.renderLogs(logs)
        ]);
    },

    render: function(data) {
        var self = this;

        poll.add(function() {
            return self.refresh();
        }, this.refreshInterval);

        return E('div', { 'id': 'ipblocklist-container' }, this.renderContent(data));
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
