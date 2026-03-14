'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require dom';
'require secubox/kiss-theme';

var callGetStatus = rpc.declare({
    object: 'luci.reporter',
    method: 'status',
    expect: {}
});

var callListReports = rpc.declare({
    object: 'luci.reporter',
    method: 'list_reports',
    expect: {}
});

var callGenerate = rpc.declare({
    object: 'luci.reporter',
    method: 'generate',
    params: ['type'],
    expect: {}
});

var callSend = rpc.declare({
    object: 'luci.reporter',
    method: 'send',
    params: ['type'],
    expect: {}
});

var callDeleteReport = rpc.declare({
    object: 'luci.reporter',
    method: 'delete_report',
    params: ['filename'],
    expect: {}
});

var callTestEmail = rpc.declare({
    object: 'luci.reporter',
    method: 'test_email',
    expect: {}
});

var callSchedule = rpc.declare({
    object: 'luci.reporter',
    method: 'schedule',
    params: ['type', 'frequency'],
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            callGetStatus(),
            callListReports()
        ]);
    },

    formatTime: function(timestamp) {
        if (!timestamp || timestamp === 0) return 'Never';
        var d = new Date(timestamp * 1000);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },

    formatSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    renderStats: function(status) {
        var c = KissTheme.colors;
        var emailConfigured = status.email && status.email.configured;

        return [
            KissTheme.stat(status.report_count || 0, 'Reports', c.purple),
            KissTheme.stat(
                status.schedules ? (status.schedules.dev !== 'off' ? 'ON' : 'OFF') : 'OFF',
                'Dev Schedule',
                status.schedules && status.schedules.dev !== 'off' ? c.green : c.muted
            ),
            KissTheme.stat(
                status.schedules ? (status.schedules.services !== 'off' ? 'ON' : 'OFF') : 'OFF',
                'Services Schedule',
                status.schedules && status.schedules.services !== 'off' ? c.green : c.muted
            ),
            KissTheme.stat(
                emailConfigured ? 'OK' : 'N/A',
                'Email',
                emailConfigured ? c.green : c.muted
            )
        ];
    },

    renderQuickActions: function() {
        var self = this;

        return E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin-bottom: 24px;' }, [
            // Development Report
            E('div', { 'class': 'kiss-card' }, [
                E('div', { 'style': 'padding: 20px; text-align: center;' }, [
                    E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '📊'),
                    E('h3', { 'style': 'margin: 0 0 8px 0; color: var(--kiss-text);' }, 'Development Status'),
                    E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0 0 16px 0;' },
                        'Roadmap progress, HISTORY.md, WIP items'),
                    E('div', { 'style': 'display: flex; gap: 8px; justify-content: center;' }, [
                        E('button', {
                            'class': 'kiss-btn kiss-btn-purple',
                            'click': function() { self.handleGenerate('dev'); }
                        }, 'Generate'),
                        E('button', {
                            'class': 'kiss-btn',
                            'click': function() { self.handleSend('dev'); }
                        }, 'Send')
                    ])
                ])
            ]),

            // Services Report
            E('div', { 'class': 'kiss-card' }, [
                E('div', { 'style': 'padding: 20px; text-align: center;' }, [
                    E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '🌐'),
                    E('h3', { 'style': 'margin: 0 0 8px 0; color: var(--kiss-text);' }, 'Services Distribution'),
                    E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0 0 16px 0;' },
                        'Tor services, DNS/SSL vhosts, mesh services'),
                    E('div', { 'style': 'display: flex; gap: 8px; justify-content: center;' }, [
                        E('button', {
                            'class': 'kiss-btn kiss-btn-cyan',
                            'click': function() { self.handleGenerate('services'); }
                        }, 'Generate'),
                        E('button', {
                            'class': 'kiss-btn',
                            'click': function() { self.handleSend('services'); }
                        }, 'Send')
                    ])
                ])
            ]),

            // All Reports
            E('div', { 'class': 'kiss-card' }, [
                E('div', { 'style': 'padding: 20px; text-align: center;' }, [
                    E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '📦'),
                    E('h3', { 'style': 'margin: 0 0 8px 0; color: var(--kiss-text);' }, 'Full Report'),
                    E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 0 0 16px 0;' },
                        'Generate both reports at once'),
                    E('div', { 'style': 'display: flex; gap: 8px; justify-content: center;' }, [
                        E('button', {
                            'class': 'kiss-btn kiss-btn-green',
                            'click': function() { self.handleGenerate('all'); }
                        }, 'Generate All'),
                        E('button', {
                            'class': 'kiss-btn',
                            'click': function() { self.handleSend('all'); }
                        }, 'Send All')
                    ])
                ])
            ])
        ]);
    },

    renderReportsList: function(reports) {
        var self = this;

        if (!reports || reports.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, [
                E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '📄'),
                E('p', {}, 'No reports generated yet'),
                E('p', { 'style': 'font-size: 12px;' }, 'Use the buttons above to generate your first report')
            ]);
        }

        // Sort by mtime descending
        reports.sort(function(a, b) { return b.mtime - a.mtime; });

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', {}, 'Report'),
                E('th', {}, 'Type'),
                E('th', {}, 'Size'),
                E('th', {}, 'Generated'),
                E('th', { 'style': 'width: 150px;' }, 'Actions')
            ])),
            E('tbody', { 'id': 'reports-body' }, reports.map(function(r) {
                var typeColor = r.type === 'dev' ? 'purple' : (r.type === 'services' ? 'cyan' : 'muted');
                return E('tr', {}, [
                    E('td', { 'style': 'font-family: monospace;' }, r.filename),
                    E('td', {}, KissTheme.badge(r.type.toUpperCase(), typeColor)),
                    E('td', { 'style': 'color: var(--kiss-muted);' }, self.formatSize(r.size)),
                    E('td', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, self.formatTime(r.mtime)),
                    E('td', {}, [
                        E('a', {
                            'href': r.url,
                            'target': '_blank',
                            'class': 'kiss-btn',
                            'style': 'padding: 4px 12px; font-size: 11px; margin-right: 8px; text-decoration: none;'
                        }, 'View'),
                        E('button', {
                            'class': 'kiss-btn kiss-btn-red',
                            'style': 'padding: 4px 12px; font-size: 11px;',
                            'click': function() { self.handleDelete(r.filename); }
                        }, 'Delete')
                    ])
                ]);
            }))
        ]);
    },

    renderEmailStatus: function(status) {
        var self = this;
        var email = status.email || {};

        if (!email.configured) {
            return E('div', { 'style': 'text-align: center; padding: 24px;' }, [
                E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 12px;' },
                    'Email not configured. Edit /etc/config/secubox-reporter to add SMTP settings.'),
                E('code', { 'style': 'font-size: 11px; color: var(--kiss-cyan);' },
                    'uci set secubox-reporter.email.smtp_server="smtp.example.com"')
            ]);
        }

        return E('div', {}, [
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;' }, [
                E('div', {}, [
                    E('span', { 'style': 'color: var(--kiss-muted); font-size: 11px;' }, 'SMTP Server'),
                    E('div', { 'style': 'font-family: monospace;' }, email.smtp_server || '-')
                ]),
                E('div', {}, [
                    E('span', { 'style': 'color: var(--kiss-muted); font-size: 11px;' }, 'Recipient'),
                    E('div', { 'style': 'font-family: monospace;' }, email.recipient || '-')
                ])
            ]),
            E('button', {
                'class': 'kiss-btn',
                'click': function() { self.handleTestEmail(); }
            }, 'Send Test Email')
        ]);
    },

    renderSchedules: function(status) {
        var self = this;
        var schedules = status.schedules || {};

        return E('div', { 'style': 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;' }, [
            // Dev schedule
            E('div', {}, [
                E('div', { 'style': 'margin-bottom: 8px;' }, [
                    E('span', { 'style': 'font-weight: 600;' }, 'Development Report'),
                    E('span', { 'style': 'margin-left: 8px;' },
                        KissTheme.badge(schedules.dev === 'off' ? 'OFF' : schedules.dev.toUpperCase(),
                            schedules.dev === 'off' ? 'muted' : 'green'))
                ]),
                E('select', {
                    'class': 'kiss-select',
                    'style': 'width: 100%;',
                    'id': 'dev-schedule',
                    'change': function(ev) { self.handleScheduleChange('dev', ev.target.value); }
                }, [
                    E('option', { 'value': 'off', 'selected': schedules.dev === 'off' }, 'Off'),
                    E('option', { 'value': 'daily', 'selected': schedules.dev === 'daily' }, 'Daily (6 AM)'),
                    E('option', { 'value': 'weekly', 'selected': schedules.dev === 'weekly' }, 'Weekly (Monday)')
                ])
            ]),

            // Services schedule
            E('div', {}, [
                E('div', { 'style': 'margin-bottom: 8px;' }, [
                    E('span', { 'style': 'font-weight: 600;' }, 'Services Report'),
                    E('span', { 'style': 'margin-left: 8px;' },
                        KissTheme.badge(schedules.services === 'off' ? 'OFF' : schedules.services.toUpperCase(),
                            schedules.services === 'off' ? 'muted' : 'green'))
                ]),
                E('select', {
                    'class': 'kiss-select',
                    'style': 'width: 100%;',
                    'id': 'services-schedule',
                    'change': function(ev) { self.handleScheduleChange('services', ev.target.value); }
                }, [
                    E('option', { 'value': 'off', 'selected': schedules.services === 'off' }, 'Off'),
                    E('option', { 'value': 'daily', 'selected': schedules.services === 'daily' }, 'Daily (6 AM)'),
                    E('option', { 'value': 'weekly', 'selected': schedules.services === 'weekly' }, 'Weekly (Monday)')
                ])
            ])
        ]);
    },

    handleGenerate: function(type) {
        var self = this;
        var typeLabel = type === 'all' ? 'all reports' : (type + ' report');

        ui.showModal('Generating Report', [
            E('p', { 'class': 'spinning' }, 'Generating ' + typeLabel + '...')
        ]);

        return callGenerate(type).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Report generated successfully'), 'success');
                // Refresh reports list
                return self.refreshReports();
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
            }
        });
    },

    handleSend: function(type) {
        var self = this;
        var typeLabel = type === 'all' ? 'all reports' : (type + ' report');

        ui.showModal('Sending Report', [
            E('p', { 'class': 'spinning' }, 'Generating and sending ' + typeLabel + '...')
        ]);

        return callSend(type).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Report sent successfully'), 'success');
                return self.refreshReports();
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
            }
        });
    },

    handleDelete: function(filename) {
        var self = this;

        if (!confirm('Delete report ' + filename + '?')) {
            return;
        }

        return callDeleteReport(filename).then(function(result) {
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Report deleted'), 'success');
                return self.refreshReports();
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
            }
        });
    },

    handleTestEmail: function() {
        ui.showModal('Testing Email', [
            E('p', { 'class': 'spinning' }, 'Sending test email...')
        ]);

        return callTestEmail().then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', {}, result.message || 'Test email sent'), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
            }
        });
    },

    handleScheduleChange: function(type, frequency) {
        var self = this;

        return callSchedule(type, frequency).then(function(result) {
            if (result.success) {
                ui.addNotification(null, E('p', {},
                    type.charAt(0).toUpperCase() + type.slice(1) + ' schedule set to ' + frequency), 'success');
            } else {
                ui.addNotification(null, E('p', {}, 'Failed: ' + (result.error || 'Unknown error')), 'error');
            }
        });
    },

    refreshReports: function() {
        var self = this;
        return Promise.all([
            callGetStatus(),
            callListReports()
        ]).then(function(data) {
            self.updateDashboard(data[0], data[1]);
        });
    },

    updateDashboard: function(status, reports) {
        // Update stats
        var statsEl = document.getElementById('reporter-stats');
        if (statsEl) {
            dom.content(statsEl, this.renderStats(status));
        }

        // Update reports list
        var reportsEl = document.getElementById('reports-list');
        if (reportsEl) {
            dom.content(reportsEl, this.renderReportsList(reports.reports || []));
        }
    },

    render: function(data) {
        var self = this;
        var status = data[0] || {};
        var reports = data[1] || {};

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px; flex-wrap: wrap;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Report Generator'),
                    KissTheme.badge(status.enabled ? 'ENABLED' : 'DISABLED', status.enabled ? 'green' : 'muted')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
                    'Generate and distribute SecuBox status reports')
            ]),

            // Stats row
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'reporter-stats', 'style': 'margin: 20px 0;' },
                this.renderStats(status)),

            // Quick Actions
            this.renderQuickActions(),

            // Two column layout
            E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
                // Schedules
                KissTheme.card('Scheduled Reports', this.renderSchedules(status)),
                // Email Status
                KissTheme.card('Email Configuration', this.renderEmailStatus(status))
            ]),

            // Reports List
            KissTheme.card('Generated Reports', E('div', { 'id': 'reports-list' },
                this.renderReportsList(reports.reports || []))),

            // Last generated info
            E('div', { 'style': 'margin-top: 16px; color: var(--kiss-muted); font-size: 12px;' }, [
                status.last_reports && status.last_reports.dev_time > 0 ?
                    E('span', {}, 'Last dev report: ' + this.formatTime(status.last_reports.dev_time) + ' | ') : '',
                status.last_reports && status.last_reports.services_time > 0 ?
                    E('span', {}, 'Last services report: ' + this.formatTime(status.last_reports.services_time)) : ''
            ])
        ];

        return KissTheme.wrap(content, 'admin/secubox/system/reporter');
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
