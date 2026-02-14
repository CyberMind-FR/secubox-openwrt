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
        return Promise.all([
            api.getOverview(),
            api.getAlertSummary(),
            api.getCrowdSecCorrelation()
        ]);
    },

    render: function(data) {
        var overview = data[0] || {};
        var alerts = data[1] || {};
        var crowdsec = data[2] || {};

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Wazuh SIEM Dashboard')),
            E('div', { 'class': 'cbi-map-descr' },
                _('Security Information and Event Management powered by Wazuh XDR')
            ),

            // Status Cards Row
            E('div', { 'class': 'cbi-section', 'style': 'display: flex; flex-wrap: wrap; gap: 1rem;' }, [
                // Agent Status Card
                this.renderStatusCard(
                    'Agent Status',
                    overview.agent ? (overview.agent.connected ? 'Connected' : (overview.agent.running ? 'Running' : 'Stopped')) : 'Unknown',
                    overview.agent && overview.agent.connected ? 'success' : (overview.agent && overview.agent.running ? 'warning' : 'danger'),
                    'Local security agent monitoring this device'
                ),

                // Manager Status Card
                this.renderStatusCard(
                    'Manager Status',
                    overview.manager ? (overview.manager.running ? 'Running' : 'Stopped') : 'Unknown',
                    overview.manager && overview.manager.running ? 'success' : 'danger',
                    'Central SIEM manager in LXC container'
                ),

                // Indexer Status Card
                this.renderStatusCard(
                    'Indexer Health',
                    overview.manager ? (overview.manager.indexer_status || 'Unknown') : 'Unknown',
                    overview.manager && overview.manager.indexer_status === 'green' ? 'success' :
                    (overview.manager && overview.manager.indexer_status === 'yellow' ? 'warning' : 'danger'),
                    'OpenSearch cluster for alert storage'
                ),

                // CrowdSec Integration Card
                this.renderStatusCard(
                    'CrowdSec Integration',
                    crowdsec.crowdsec_running ? 'Active' : 'Inactive',
                    crowdsec.crowdsec_running ? 'success' : 'notice',
                    crowdsec.active_decisions + ' active ban decisions'
                )
            ]),

            // Alert Summary Section
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Alert Summary')),
                E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 1rem;' }, [
                    this.renderAlertBadge('Critical', alerts.critical || 0, 'danger'),
                    this.renderAlertBadge('High', alerts.high || 0, 'warning'),
                    this.renderAlertBadge('Medium', alerts.medium || 0, 'notice'),
                    this.renderAlertBadge('Low', alerts.low || 0, 'info'),
                    this.renderAlertBadge('Total', alerts.total || 0, 'secondary')
                ])
            ]),

            // Quick Actions Section
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Quick Actions')),
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    E('a', {
                        'href': 'https://wazuh.gk2.secubox.in',
                        'target': '_blank',
                        'class': 'btn cbi-button cbi-button-action'
                    }, _('Open Wazuh Dashboard')),

                    E('button', {
                        'class': 'btn cbi-button cbi-button-apply',
                        'click': L.bind(this.handleRestartAgent, this)
                    }, _('Restart Agent')),

                    E('a', {
                        'href': L.url('admin/services/wazuh/alerts'),
                        'class': 'btn cbi-button'
                    }, _('View Alerts')),

                    E('a', {
                        'href': L.url('admin/services/wazuh/fim'),
                        'class': 'btn cbi-button'
                    }, _('File Integrity'))
                ])
            ]),

            // Security Layers Info
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Security Layers (SysWarden-Inspired)')),
                E('table', { 'class': 'table' }, [
                    E('tr', { 'class': 'tr' }, [
                        E('th', { 'class': 'th' }, _('Layer')),
                        E('th', { 'class': 'th' }, _('Component')),
                        E('th', { 'class': 'th' }, _('Function')),
                        E('th', { 'class': 'th' }, _('Status'))
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td' }, _('Layer 1: Firewall')),
                        E('td', { 'class': 'td' }, _('Vortex Firewall + nftables')),
                        E('td', { 'class': 'td' }, _('Kernel-level IP blocking')),
                        E('td', { 'class': 'td' }, E('span', { 'class': 'badge success' }, _('Active')))
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td' }, _('Layer 2: IPS')),
                        E('td', { 'class': 'td' }, _('CrowdSec + Bouncer')),
                        E('td', { 'class': 'td' }, _('Behavior-based threat detection')),
                        E('td', { 'class': 'td' }, E('span', {
                            'class': 'badge ' + (crowdsec.crowdsec_running ? 'success' : 'danger')
                        }, crowdsec.crowdsec_running ? _('Active') : _('Inactive')))
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td' }, _('Layer 3: SIEM/XDR')),
                        E('td', { 'class': 'td' }, _('Wazuh Manager')),
                        E('td', { 'class': 'td' }, _('Log analysis, FIM, threat correlation')),
                        E('td', { 'class': 'td' }, E('span', {
                            'class': 'badge ' + (overview.manager && overview.manager.running ? 'success' : 'danger')
                        }, overview.manager && overview.manager.running ? _('Active') : _('Inactive')))
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td' }, _('Layer 4: WAF')),
                        E('td', { 'class': 'td' }, _('mitmproxy + HAProxy')),
                        E('td', { 'class': 'td' }, _('Web application firewall')),
                        E('td', { 'class': 'td' }, E('span', { 'class': 'badge success' }, _('Active')))
                    ])
                ])
            ])
        ]);

        // Setup polling for real-time updates
        poll.add(L.bind(this.pollStatus, this), 30);

        return view;
    },

    renderStatusCard: function(title, status, statusClass, description) {
        return E('div', {
            'class': 'cbi-value',
            'style': 'flex: 1; min-width: 200px; background: var(--background-color-high); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--' + statusClass + '-color, #666);'
        }, [
            E('div', { 'style': 'font-weight: bold; margin-bottom: 0.5rem;' }, title),
            E('div', {
                'class': 'badge ' + statusClass,
                'style': 'font-size: 1.2em; padding: 0.3rem 0.6rem;'
            }, status),
            E('div', { 'style': 'font-size: 0.85em; color: var(--text-color-low); margin-top: 0.5rem;' }, description)
        ]);
    },

    renderAlertBadge: function(label, count, badgeClass) {
        return E('div', {
            'style': 'text-align: center; padding: 0.5rem 1rem; background: var(--background-color-high); border-radius: 8px; min-width: 80px;'
        }, [
            E('div', { 'style': 'font-size: 1.5em; font-weight: bold;' }, String(count)),
            E('div', { 'class': 'badge ' + badgeClass }, label)
        ]);
    },

    handleRestartAgent: function() {
        var self = this;
        return api.restartAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', _('Wazuh agent restarted successfully')), 'info');
            } else {
                L.ui.addNotification(null, E('p', _('Failed to restart agent')), 'error');
            }
            return self.load().then(L.bind(self.render, self));
        });
    },

    pollStatus: function() {
        return api.getOverview().then(L.bind(function(overview) {
            // Update status indicators
            var agentBadge = document.querySelector('.cbi-section .badge');
            if (agentBadge && overview.agent) {
                agentBadge.textContent = overview.agent.connected ? 'Connected' :
                    (overview.agent.running ? 'Running' : 'Stopped');
            }
        }, this));
    }
});
