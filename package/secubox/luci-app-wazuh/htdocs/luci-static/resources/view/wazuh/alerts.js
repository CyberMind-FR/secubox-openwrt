'use strict';
'require view';
'require dom';
'require poll';
'require wazuh.api as api';

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return api.getAlerts(50, 0);
    },

    render: function(data) {
        var alerts = data.alerts || [];
        var self = this;

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Wazuh Security Alerts')),
            E('div', { 'class': 'cbi-map-descr' },
                _('Real-time security events from Wazuh SIEM/XDR')
            ),

            // Filter Controls
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'style': 'display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;' }, [
                    E('label', {}, _('Filter by Level:')),
                    E('select', {
                        'id': 'level-filter',
                        'class': 'cbi-input-select',
                        'change': L.bind(this.handleFilterChange, this)
                    }, [
                        E('option', { 'value': '0' }, _('All Levels')),
                        E('option', { 'value': '12' }, _('Critical (12+)')),
                        E('option', { 'value': '9' }, _('High (9+)')),
                        E('option', { 'value': '5' }, _('Medium (5+)')),
                        E('option', { 'value': '1' }, _('Low (1+)'))
                    ]),

                    E('label', { 'style': 'margin-left: 1rem;' }, _('Count:')),
                    E('select', {
                        'id': 'count-filter',
                        'class': 'cbi-input-select',
                        'change': L.bind(this.handleFilterChange, this)
                    }, [
                        E('option', { 'value': '20' }, '20'),
                        E('option', { 'value': '50', 'selected': 'selected' }, '50'),
                        E('option', { 'value': '100' }, '100'),
                        E('option', { 'value': '200' }, '200')
                    ]),

                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'style': 'margin-left: 1rem;',
                        'click': L.bind(this.handleRefresh, this)
                    }, _('Refresh'))
                ])
            ]),

            // Alerts Table
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'id': 'alerts-container' }, [
                    this.renderAlertsTable(alerts)
                ])
            ]),

            // Legend
            E('div', { 'class': 'cbi-section' }, [
                E('h4', {}, _('Severity Legend')),
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    E('span', { 'class': 'badge danger', 'style': 'padding: 0.3rem 0.6rem;' }, _('Critical (12+)')),
                    E('span', { 'class': 'badge warning', 'style': 'padding: 0.3rem 0.6rem;' }, _('High (9-11)')),
                    E('span', { 'class': 'badge notice', 'style': 'padding: 0.3rem 0.6rem;' }, _('Medium (5-8)')),
                    E('span', { 'class': 'badge info', 'style': 'padding: 0.3rem 0.6rem;' }, _('Low (1-4)'))
                ])
            ])
        ]);

        // Setup auto-refresh
        poll.add(L.bind(this.pollAlerts, this), 60);

        return view;
    },

    renderAlertsTable: function(alerts) {
        if (!alerts || alerts.length === 0) {
            return E('div', { 'class': 'cbi-value', 'style': 'text-align: center; padding: 2rem;' },
                _('No alerts found')
            );
        }

        var rows = [
            E('tr', { 'class': 'tr' }, [
                E('th', { 'class': 'th', 'style': 'width: 60px;' }, _('Level')),
                E('th', { 'class': 'th', 'style': 'width: 150px;' }, _('Time')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('Agent')),
                E('th', { 'class': 'th', 'style': 'width: 120px;' }, _('Rule ID')),
                E('th', { 'class': 'th' }, _('Description')),
                E('th', { 'class': 'th', 'style': 'width: 150px;' }, _('Source'))
            ])
        ];

        var self = this;
        alerts.forEach(function(alert) {
            var levelInfo = api.formatLevel(alert.rule_level || 0);
            rows.push(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, [
                    E('span', { 'class': 'badge ' + levelInfo.class }, String(alert.rule_level || 0))
                ]),
                E('td', { 'class': 'td', 'style': 'font-size: 0.85em;' },
                    api.formatTime(alert.timestamp)
                ),
                E('td', { 'class': 'td' }, alert.agent_name || '-'),
                E('td', { 'class': 'td' }, [
                    E('code', {}, alert.rule_id || '-')
                ]),
                E('td', { 'class': 'td' }, alert.rule_description || '-'),
                E('td', { 'class': 'td', 'style': 'font-family: monospace; font-size: 0.85em;' },
                    alert.src_ip || alert.data_srcip || '-'
                )
            ]));
        });

        return E('table', { 'class': 'table' }, rows);
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
            container.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
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
    }
});
