'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require dom';
'require secubox/kiss-theme';

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

return view.extend({
    load: function() {
        return Promise.all([
            callGetStatus(),
            callGetLogs(30)
        ]);
    },

    renderStats: function(status) {
        var c = KissTheme.colors;
        var containers = status.containers || [];
        var services = status.services || [];
        var endpoints = status.endpoints || [];

        var containersUp = containers.filter(function(c) { return c.state === 'running'; }).length;
        var servicesUp = services.filter(function(s) { return s.state === 'running'; }).length;
        var endpointsHealthy = endpoints.filter(function(e) { return e.healthy; }).length;
        var critical = containers.filter(function(c) { return c.critical && c.state !== 'running'; }).length +
                       services.filter(function(s) { return s.critical && s.state !== 'running'; }).length;

        return [
            KissTheme.stat(containersUp + '/' + containers.length, 'Containers', containersUp === containers.length ? c.green : c.orange),
            KissTheme.stat(servicesUp + '/' + services.length, 'Services', servicesUp === services.length ? c.green : c.orange),
            KissTheme.stat(endpointsHealthy + '/' + endpoints.length, 'Endpoints', endpointsHealthy === endpoints.length ? c.green : c.orange),
            KissTheme.stat(critical, 'Critical', critical > 0 ? c.red : c.muted)
        ];
    },

    renderContainers: function(containers) {
        var self = this;
        if (!containers || containers.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No containers configured');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', {}, 'Container'),
                E('th', {}, 'Status'),
                E('th', {}, 'PID'),
                E('th', { 'style': 'width: 100px;' }, 'Actions')
            ])),
            E('tbody', { 'id': 'containers-body' }, containers.map(function(c) {
                var isRunning = c.state === 'running';
                return E('tr', {}, [
                    E('td', {}, [
                        E('span', { 'style': 'font-weight: 600;' }, c.name),
                        c.critical ? E('span', { 'style': 'margin-left: 8px; font-size: 10px; color: var(--kiss-red);' }, 'CRITICAL') : ''
                    ]),
                    E('td', {}, KissTheme.badge(isRunning ? 'RUNNING' : 'STOPPED', isRunning ? 'green' : 'red')),
                    E('td', { 'style': 'font-family: monospace; color: var(--kiss-muted);' }, c.pid > 0 ? String(c.pid) : '-'),
                    E('td', {}, E('button', {
                        'class': 'kiss-btn',
                        'style': 'padding: 4px 12px; font-size: 11px;',
                        'click': function() { self.handleRestartContainer(c.name); }
                    }, 'Restart'))
                ]);
            }))
        ]);
    },

    renderServices: function(services) {
        var self = this;
        if (!services || services.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No services configured');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', {}, 'Service'),
                E('th', {}, 'Process'),
                E('th', {}, 'Status'),
                E('th', {}, 'PID'),
                E('th', { 'style': 'width: 100px;' }, 'Actions')
            ])),
            E('tbody', { 'id': 'services-body' }, services.map(function(s) {
                var isRunning = s.state === 'running';
                return E('tr', {}, [
                    E('td', {}, [
                        E('span', { 'style': 'font-weight: 600;' }, s.name),
                        s.critical ? E('span', { 'style': 'margin-left: 8px; font-size: 10px; color: var(--kiss-red);' }, 'CRITICAL') : ''
                    ]),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, s.process),
                    E('td', {}, KissTheme.badge(isRunning ? 'RUNNING' : 'STOPPED', isRunning ? 'green' : 'red')),
                    E('td', { 'style': 'font-family: monospace; color: var(--kiss-muted);' }, s.pid > 0 ? String(s.pid) : '-'),
                    E('td', {}, E('button', {
                        'class': 'kiss-btn',
                        'style': 'padding: 4px 12px; font-size: 11px;',
                        'click': function() { self.handleRestartService(s.name); }
                    }, 'Restart'))
                ]);
            }))
        ]);
    },

    renderEndpoints: function(endpoints) {
        if (!endpoints || endpoints.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No endpoints configured');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', {}, 'Name'),
                E('th', {}, 'Host'),
                E('th', {}, 'Response'),
                E('th', {}, 'Health')
            ])),
            E('tbody', { 'id': 'endpoints-body' }, endpoints.map(function(e) {
                return E('tr', {}, [
                    E('td', { 'style': 'font-weight: 600;' }, e.name),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-cyan);' }, e.host),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px;' }, 'HTTP ' + e.code),
                    E('td', {}, KissTheme.badge(e.healthy ? 'HEALTHY' : 'UNHEALTHY', e.healthy ? 'green' : 'red'))
                ]);
            }))
        ]);
    },

    renderLogs: function(logs) {
        var self = this;
        var lines = (logs && logs.lines) || [];
        return E('div', {}, [
            E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px;' }, [
                E('button', {
                    'class': 'kiss-btn',
                    'click': function() { self.handleRefreshLogs(); }
                }, 'Refresh'),
                E('button', {
                    'class': 'kiss-btn kiss-btn-red',
                    'click': function() { self.handleClearLogs(); }
                }, 'Clear')
            ]),
            E('div', {
                'id': 'logs-area',
                'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 11px; color: var(--kiss-green); max-height: 250px; overflow-y: auto; white-space: pre-wrap;'
            }, lines.join('\n') || 'No logs available')
        ]);
    },

    handleRestartContainer: function(name) {
        var self = this;
        ui.showModal('Restarting Container', [
            E('p', { 'class': 'spinning' }, 'Restarting ' + name + '...')
        ]);

        return callRestartContainer(name).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Container ' + name + ' restarted'), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
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
                ui.addNotification(null, E('p', {}, 'Service ' + name + ' restarted'), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
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
                logsArea.textContent = 'No logs available';
            }
        });
    },

    handleRefreshLogs: function() {
        return callGetLogs(50).then(function(result) {
            var logsArea = document.getElementById('logs-area');
            if (logsArea && result.lines) {
                logsArea.textContent = result.lines.join('\n');
                logsArea.scrollTop = logsArea.scrollHeight;
            }
        });
    },

    updateDashboard: function(status) {
        var self = this;
        var c = KissTheme.colors;

        // Update stats
        var statsEl = document.getElementById('watchdog-stats');
        if (statsEl) {
            dom.content(statsEl, this.renderStats(status));
        }

        // Update containers
        var containersEl = document.getElementById('containers-body');
        if (containersEl && status.containers) {
            dom.content(containersEl.parentNode.parentNode, this.renderContainers(status.containers));
        }

        // Update services
        var servicesEl = document.getElementById('services-body');
        if (servicesEl && status.services) {
            dom.content(servicesEl.parentNode.parentNode, this.renderServices(status.services));
        }

        // Update endpoints
        var endpointsEl = document.getElementById('endpoints-body');
        if (endpointsEl && status.endpoints) {
            dom.content(endpointsEl.parentNode.parentNode, this.renderEndpoints(status.endpoints));
        }
    },

    render: function(data) {
        var self = this;
        var status = data[0] || {};
        var logs = data[1] || {};
        var c = KissTheme.colors;

        var isRunning = status.running;

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px; flex-wrap: wrap;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SecuBox Watchdog'),
                    KissTheme.badge(isRunning ? 'ACTIVE' : 'INACTIVE', isRunning ? 'green' : 'red'),
                    E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, 'Interval: ' + (status.interval || 60) + 's')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Service health monitoring and auto-recovery')
            ]),

            // Stats row
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'watchdog-stats', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

            // Quick Actions
            E('div', { 'style': 'margin-bottom: 20px;' }, [
                E('button', {
                    'class': 'kiss-btn kiss-btn-green',
                    'click': function() { self.handleRunCheck(); }
                }, 'Run Health Check Now')
            ]),

            // Two column layout
            E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
                // Containers
                KissTheme.card('LXC Containers', E('div', { 'id': 'containers-card' }, this.renderContainers(status.containers))),
                // Services
                KissTheme.card('Host Services', E('div', { 'id': 'services-card' }, this.renderServices(status.services)))
            ]),

            // Endpoints
            KissTheme.card('HTTPS Endpoints', E('div', { 'id': 'endpoints-card' }, this.renderEndpoints(status.endpoints))),

            // Logs
            KissTheme.card('Alert Logs', this.renderLogs(logs))
        ];

        // Start polling
        poll.add(function() {
            return callGetStatus().then(function(status) {
                self.updateDashboard(status);
            });
        }, 10);

        return KissTheme.wrap(content, 'admin/system/watchdog/status');
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
