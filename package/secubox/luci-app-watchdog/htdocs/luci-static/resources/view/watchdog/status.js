'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require dom';

var callGetStatus = rpc.declare({
    object: 'luci.watchdog',
    method: 'status',
    expect: {}
});

var callGetLogs = rpc.declare({
    object: 'luci.watchdog',
    method: 'get_logs',
    params: ['lines'],
    expect: {}
});

var callRestartContainer = rpc.declare({
    object: 'luci.watchdog',
    method: 'restart_container',
    params: ['name'],
    expect: {}
});

var callRestartService = rpc.declare({
    object: 'luci.watchdog',
    method: 'restart_service',
    params: ['name'],
    expect: {}
});

var callCheck = rpc.declare({
    object: 'luci.watchdog',
    method: 'check',
    expect: {}
});

var callClearLogs = rpc.declare({
    object: 'luci.watchdog',
    method: 'clear_logs',
    expect: {}
});

function renderStatusBadge(state, critical) {
    var color = state === 'running' ? '#00ff88' : (critical ? '#ff0066' : '#ffaa00');
    var text = state === 'running' ? 'RUNNING' : 'STOPPED';
    return E('span', {
        'style': 'background: ' + color + '; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;'
    }, text);
}

function renderHealthBadge(healthy) {
    var color = healthy ? '#00ff88' : '#ff0066';
    var text = healthy ? 'HEALTHY' : 'UNHEALTHY';
    return E('span', {
        'style': 'background: ' + color + '; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;'
    }, text);
}

function renderCriticalBadge(critical) {
    if (!critical) return '';
    return E('span', {
        'style': 'background: #ff0066; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;'
    }, 'CRITICAL');
}

return view.extend({
    load: function() {
        return Promise.all([
            callGetStatus(),
            callGetLogs(30)
        ]);
    },

    pollStatus: function() {
        var self = this;
        poll.add(function() {
            return callGetStatus().then(function(status) {
                self.updateDashboard(status);
            });
        }, 10);
    },

    updateDashboard: function(status) {
        // Update watchdog status
        var watchdogStatus = document.getElementById('watchdog-status');
        if (watchdogStatus) {
            var running = status.running;
            watchdogStatus.innerHTML = '';
            watchdogStatus.appendChild(E('span', {
                'style': 'color: ' + (running ? '#00ff88' : '#ff0066') + '; font-weight: bold;'
            }, running ? 'ACTIVE' : 'INACTIVE'));
        }

        // Update containers
        var containersTable = document.getElementById('containers-body');
        if (containersTable && status.containers) {
            containersTable.innerHTML = '';
            status.containers.forEach(function(c) {
                var row = E('tr', {}, [
                    E('td', {}, c.name),
                    E('td', {}, [renderStatusBadge(c.state, c.critical), renderCriticalBadge(c.critical)]),
                    E('td', {}, c.pid > 0 ? String(c.pid) : '-'),
                    E('td', {}, [
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'click': ui.createHandlerFn(this, 'handleRestartContainer', c.name),
                            'style': 'padding: 2px 8px; font-size: 11px;'
                        }, 'Restart')
                    ])
                ]);
                containersTable.appendChild(row);
            });
        }

        // Update services
        var servicesTable = document.getElementById('services-body');
        if (servicesTable && status.services) {
            servicesTable.innerHTML = '';
            status.services.forEach(function(s) {
                var row = E('tr', {}, [
                    E('td', {}, s.name),
                    E('td', {}, s.process),
                    E('td', {}, [renderStatusBadge(s.state, s.critical), renderCriticalBadge(s.critical)]),
                    E('td', {}, s.pid > 0 ? String(s.pid) : '-'),
                    E('td', {}, [
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'click': ui.createHandlerFn(this, 'handleRestartService', s.name),
                            'style': 'padding: 2px 8px; font-size: 11px;'
                        }, 'Restart')
                    ])
                ]);
                servicesTable.appendChild(row);
            });
        }

        // Update endpoints
        var endpointsTable = document.getElementById('endpoints-body');
        if (endpointsTable && status.endpoints) {
            endpointsTable.innerHTML = '';
            status.endpoints.forEach(function(e) {
                var row = E('tr', {}, [
                    E('td', {}, e.name),
                    E('td', {}, e.host),
                    E('td', {}, 'HTTP ' + e.code),
                    E('td', {}, renderHealthBadge(e.healthy))
                ]);
                endpointsTable.appendChild(row);
            });
        }
    },

    handleRestartContainer: function(name) {
        var self = this;
        ui.showModal('Restarting Container', [
            E('p', { 'class': 'spinning' }, 'Restarting ' + name + '...')
        ]);

        return callRestartContainer(name).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Container ' + name + ' restarted successfully'), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed to restart ' + name + ': ' + (result.error || 'Unknown error')), 'error');
            }
            return callGetStatus().then(function(status) {
                self.updateDashboard(status);
            });
        });
    },

    handleRestartService: function(name) {
        var self = this;
        ui.showModal('Restarting Service', [
            E('p', { 'class': 'spinning' }, 'Restarting ' + name + '...')
        ]);

        return callRestartService(name).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Service ' + name + ' restarted successfully'), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed to restart ' + name + ': ' + (result.error || 'Unknown error')), 'error');
            }
            return callGetStatus().then(function(status) {
                self.updateDashboard(status);
            });
        });
    },

    handleRunCheck: function() {
        var self = this;
        ui.showModal('Running Health Check', [
            E('p', { 'class': 'spinning' }, 'Running health check with auto-recovery...')
        ]);

        return callCheck().then(function(result) {
            ui.hideModal();
            ui.addNotification(null, E('p', {}, 'Health check completed'), 'success');
            return callGetStatus().then(function(status) {
                self.updateDashboard(status);
            });
        });
    },

    handleClearLogs: function() {
        return callClearLogs().then(function() {
            ui.addNotification(null, E('p', {}, 'Logs cleared'), 'success');
            var logsArea = document.getElementById('logs-area');
            if (logsArea) {
                logsArea.value = '';
            }
        });
    },

    handleRefreshLogs: function() {
        return callGetLogs(50).then(function(result) {
            var logsArea = document.getElementById('logs-area');
            if (logsArea && result.lines) {
                logsArea.value = result.lines.join('\n');
                logsArea.scrollTop = logsArea.scrollHeight;
            }
        });
    },

    render: function(data) {
        var status = data[0] || {};
        var logs = data[1] || {};
        var self = this;

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'SecuBox Watchdog'),
            E('div', { 'class': 'cbi-map-descr' }, 'Service health monitoring and auto-recovery dashboard'),

            // Status overview
            E('div', { 'class': 'cbi-section', 'style': 'background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 20px;' }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
                    E('div', {}, [
                        E('span', { 'style': 'color: #888;' }, 'Watchdog Status: '),
                        E('span', { 'id': 'watchdog-status', 'style': 'color: ' + (status.running ? '#00ff88' : '#ff0066') + '; font-weight: bold;' },
                            status.running ? 'ACTIVE' : 'INACTIVE'),
                        E('span', { 'style': 'color: #888; margin-left: 20px;' }, 'Check Interval: '),
                        E('span', { 'style': 'color: #00ffff;' }, (status.interval || 60) + 's')
                    ]),
                    E('div', {}, [
                        E('button', {
                            'class': 'cbi-button cbi-button-action',
                            'click': ui.createHandlerFn(this, 'handleRunCheck')
                        }, 'Run Check Now')
                    ])
                ])
            ]),

            // Containers section
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'LXC Containers'),
                E('table', { 'class': 'table cbi-section-table' }, [
                    E('thead', {}, [
                        E('tr', { 'class': 'tr table-titles' }, [
                            E('th', { 'class': 'th' }, 'Container'),
                            E('th', { 'class': 'th' }, 'Status'),
                            E('th', { 'class': 'th' }, 'PID'),
                            E('th', { 'class': 'th' }, 'Actions')
                        ])
                    ]),
                    E('tbody', { 'id': 'containers-body' },
                        (status.containers || []).map(function(c) {
                            return E('tr', { 'class': 'tr' }, [
                                E('td', { 'class': 'td' }, c.name),
                                E('td', { 'class': 'td' }, [renderStatusBadge(c.state, c.critical), renderCriticalBadge(c.critical)]),
                                E('td', { 'class': 'td' }, c.pid > 0 ? String(c.pid) : '-'),
                                E('td', { 'class': 'td' }, [
                                    E('button', {
                                        'class': 'cbi-button cbi-button-action',
                                        'click': ui.createHandlerFn(self, 'handleRestartContainer', c.name),
                                        'style': 'padding: 2px 8px; font-size: 11px;'
                                    }, 'Restart')
                                ])
                            ]);
                        })
                    )
                ])
            ]),

            // Services section
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Host Services'),
                E('table', { 'class': 'table cbi-section-table' }, [
                    E('thead', {}, [
                        E('tr', { 'class': 'tr table-titles' }, [
                            E('th', { 'class': 'th' }, 'Service'),
                            E('th', { 'class': 'th' }, 'Process'),
                            E('th', { 'class': 'th' }, 'Status'),
                            E('th', { 'class': 'th' }, 'PID'),
                            E('th', { 'class': 'th' }, 'Actions')
                        ])
                    ]),
                    E('tbody', { 'id': 'services-body' },
                        (status.services || []).map(function(s) {
                            return E('tr', { 'class': 'tr' }, [
                                E('td', { 'class': 'td' }, s.name),
                                E('td', { 'class': 'td' }, s.process),
                                E('td', { 'class': 'td' }, [renderStatusBadge(s.state, s.critical), renderCriticalBadge(s.critical)]),
                                E('td', { 'class': 'td' }, s.pid > 0 ? String(s.pid) : '-'),
                                E('td', { 'class': 'td' }, [
                                    E('button', {
                                        'class': 'cbi-button cbi-button-action',
                                        'click': ui.createHandlerFn(self, 'handleRestartService', s.name),
                                        'style': 'padding: 2px 8px; font-size: 11px;'
                                    }, 'Restart')
                                ])
                            ]);
                        })
                    )
                ])
            ]),

            // Endpoints section
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'HTTPS Endpoints'),
                E('table', { 'class': 'table cbi-section-table' }, [
                    E('thead', {}, [
                        E('tr', { 'class': 'tr table-titles' }, [
                            E('th', { 'class': 'th' }, 'Name'),
                            E('th', { 'class': 'th' }, 'Host'),
                            E('th', { 'class': 'th' }, 'Response'),
                            E('th', { 'class': 'th' }, 'Health')
                        ])
                    ]),
                    E('tbody', { 'id': 'endpoints-body' },
                        (status.endpoints || []).map(function(e) {
                            return E('tr', { 'class': 'tr' }, [
                                E('td', { 'class': 'td' }, e.name),
                                E('td', { 'class': 'td' }, e.host),
                                E('td', { 'class': 'td' }, 'HTTP ' + e.code),
                                E('td', { 'class': 'td' }, renderHealthBadge(e.healthy))
                            ]);
                        })
                    )
                ])
            ]),

            // Logs section
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
                    E('h3', {}, 'Alert Logs'),
                    E('div', {}, [
                        E('button', {
                            'class': 'cbi-button',
                            'click': ui.createHandlerFn(this, 'handleRefreshLogs'),
                            'style': 'margin-right: 8px;'
                        }, 'Refresh'),
                        E('button', {
                            'class': 'cbi-button cbi-button-negative',
                            'click': ui.createHandlerFn(this, 'handleClearLogs')
                        }, 'Clear')
                    ])
                ]),
                E('textarea', {
                    'id': 'logs-area',
                    'readonly': 'readonly',
                    'style': 'width: 100%; height: 200px; background: #0f0f1a; color: #00ff88; font-family: monospace; font-size: 12px; border: 1px solid #333; border-radius: 4px; padding: 8px;'
                }, (logs.lines || []).join('\n'))
            ])
        ]);

        // Start polling
        this.pollStatus();

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
