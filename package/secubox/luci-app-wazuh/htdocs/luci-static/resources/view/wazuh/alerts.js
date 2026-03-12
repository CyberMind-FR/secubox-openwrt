'use strict';
'require view';
'require dom';
'require poll';
'require wazuh.api as api';
'require secubox/kiss-theme';

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return api.getAlerts(50, 0);
    },

    renderNav: function(active) {
        var tabs = [
            { name: 'Overview', path: 'admin/services/wazuh/overview' },
            { name: 'Alerts', path: 'admin/services/wazuh/alerts' },
            { name: 'File Integrity', path: 'admin/services/wazuh/fim' },
            { name: 'Agents', path: 'admin/services/wazuh/agents' }
        ];

        return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
            var isActive = tab.path.indexOf(active) !== -1;
            return E('a', {
                'href': L.url(tab.path),
                'class': 'kiss-tab' + (isActive ? ' active' : '')
            }, tab.name);
        }));
    },

    renderFilters: function() {
        var self = this;
        return E('div', { 'style': 'display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 20px;' }, [
            E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
                E('label', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, 'Level:'),
                E('select', {
                    'id': 'level-filter',
                    'class': 'kiss-select',
                    'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 6px 12px; border-radius: 6px;',
                    'change': function() { self.handleFilterChange(); }
                }, [
                    E('option', { 'value': '0' }, 'All Levels'),
                    E('option', { 'value': '12' }, 'Critical (12+)'),
                    E('option', { 'value': '9' }, 'High (9+)'),
                    E('option', { 'value': '5' }, 'Medium (5+)'),
                    E('option', { 'value': '1' }, 'Low (1+)')
                ])
            ]),
            E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
                E('label', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, 'Count:'),
                E('select', {
                    'id': 'count-filter',
                    'class': 'kiss-select',
                    'style': 'background: var(--kiss-card); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 6px 12px; border-radius: 6px;'
                }, [
                    E('option', { 'value': '20' }, '20'),
                    E('option', { 'value': '50', 'selected': 'selected' }, '50'),
                    E('option', { 'value': '100' }, '100'),
                    E('option', { 'value': '200' }, '200')
                ])
            ]),
            E('button', {
                'class': 'kiss-btn kiss-btn-blue',
                'click': function() { self.handleRefresh(); }
            }, 'Refresh')
        ]);
    },

    renderAlertsTable: function(alerts) {
        var c = KissTheme.colors;
        if (!alerts || alerts.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, 'No alerts found');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', { 'style': 'width: 60px;' }, 'Level'),
                E('th', { 'style': 'width: 140px;' }, 'Time'),
                E('th', { 'style': 'width: 100px;' }, 'Agent'),
                E('th', { 'style': 'width: 100px;' }, 'Rule ID'),
                E('th', {}, 'Description'),
                E('th', { 'style': 'width: 140px;' }, 'Source')
            ])),
            E('tbody', {}, alerts.map(function(alert) {
                var level = alert.rule_level || 0;
                var levelColor = level >= 12 ? c.red : level >= 9 ? c.orange : level >= 5 ? c.yellow : c.muted;
                var levelLabel = level >= 12 ? 'CRIT' : level >= 9 ? 'HIGH' : level >= 5 ? 'MED' : 'LOW';

                return E('tr', {}, [
                    E('td', {}, E('span', {
                        'style': 'display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ' + levelColor + '20; color: ' + levelColor + ';'
                    }, String(level))),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, api.formatTime(alert.timestamp)),
                    E('td', { 'style': 'font-size: 12px;' }, alert.agent_name || '-'),
                    E('td', {}, E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px; font-size: 11px;' }, alert.rule_id || '-')),
                    E('td', { 'style': 'font-size: 12px; color: var(--kiss-text);' }, alert.rule_description || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-cyan);' }, alert.src_ip || alert.data_srcip || '-')
                ]);
            }))
        ]);
    },

    renderLegend: function() {
        var c = KissTheme.colors;
        var levels = [
            { label: 'Critical (12+)', color: c.red },
            { label: 'High (9-11)', color: c.orange },
            { label: 'Medium (5-8)', color: c.yellow },
            { label: 'Low (1-4)', color: c.muted }
        ];

        return E('div', { 'style': 'display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 0;' }, levels.map(function(l) {
            return E('span', { 'style': 'display: flex; align-items: center; gap: 6px; font-size: 12px;' }, [
                E('span', { 'style': 'width: 12px; height: 12px; border-radius: 3px; background: ' + l.color + ';' }),
                E('span', { 'style': 'color: var(--kiss-muted);' }, l.label)
            ]);
        }));
    },

    handleFilterChange: function() {
        this.handleRefresh();
    },

    handleRefresh: function() {
        var levelEl = document.getElementById('level-filter');
        var countEl = document.getElementById('count-filter');
        var level = levelEl ? parseInt(levelEl.value) : 0;
        var count = countEl ? parseInt(countEl.value) : 50;

        var container = document.getElementById('alerts-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, [
                E('span', { 'class': 'spinning' }),
                ' Loading alerts...'
            ]));
        }

        var self = this;
        return api.getAlerts(count, level).then(function(data) {
            var alerts = data.alerts || [];
            if (container) {
                dom.content(container, self.renderAlertsTable(alerts));
            }
        });
    },

    pollAlerts: function() {
        return this.handleRefresh();
    },

    render: function(data) {
        var alerts = data.alerts || [];
        var self = this;

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Security Alerts'),
                    KissTheme.badge(alerts.length + ' events', 'blue')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Real-time security events from Wazuh SIEM/XDR')
            ]),

            // Navigation
            this.renderNav('alerts'),

            // Filters
            this.renderFilters(),

            // Alerts table card
            KissTheme.card('Alert Events', E('div', { 'id': 'alerts-container' }, this.renderAlertsTable(alerts))),

            // Legend
            KissTheme.card('Severity Legend', this.renderLegend())
        ];

        // Setup auto-refresh
        poll.add(L.bind(this.pollAlerts, this), 60);

        return KissTheme.wrap(content, 'admin/services/wazuh/alerts');
    }
});
