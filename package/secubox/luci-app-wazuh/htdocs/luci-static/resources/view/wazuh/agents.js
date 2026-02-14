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
        return api.listAgents();
    },

    render: function(data) {
        var agents = data.agents || [];

        // Calculate statistics
        var connected = agents.filter(function(a) { return a.status === 'active' || a.status === 'connected'; }).length;
        var disconnected = agents.filter(function(a) { return a.status === 'disconnected'; }).length;
        var pending = agents.filter(function(a) { return a.status === 'pending' || a.status === 'never_connected'; }).length;

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Wazuh Agents')),
            E('div', { 'class': 'cbi-map-descr' },
                _('Manage security agents across your infrastructure')
            ),

            // Agent Statistics
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Agent Status Summary')),
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    this.renderStatCard('Connected', connected, 'success'),
                    this.renderStatCard('Disconnected', disconnected, 'danger'),
                    this.renderStatCard('Pending', pending, 'warning'),
                    this.renderStatCard('Total', agents.length, 'info')
                ])
            ]),

            // Actions
            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': L.bind(this.handleRefresh, this)
                    }, _('Refresh')),
                    E('a', {
                        'href': 'https://wazuh.gk2.secubox.in/app/wazuh#/agents-preview',
                        'target': '_blank',
                        'class': 'btn cbi-button'
                    }, _('View in Wazuh Dashboard'))
                ])
            ]),

            // Agents Table
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Registered Agents')),
                E('div', { 'id': 'agents-container' }, [
                    this.renderAgentsTable(agents)
                ])
            ]),

            // Local Agent Quick Actions
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Local Agent Control')),
                E('div', { 'class': 'cbi-value', 'style': 'background: var(--background-color-high); padding: 1rem; border-radius: 8px;' }, [
                    E('p', { 'style': 'margin-bottom: 1rem;' },
                        _('Control the Wazuh agent running on this SecuBox device')
                    ),
                    E('div', { 'style': 'display: flex; gap: 0.5rem; flex-wrap: wrap;' }, [
                        E('button', {
                            'class': 'btn cbi-button cbi-button-apply',
                            'click': L.bind(this.handleStartAgent, this)
                        }, _('Start Agent')),
                        E('button', {
                            'class': 'btn cbi-button cbi-button-remove',
                            'click': L.bind(this.handleStopAgent, this)
                        }, _('Stop Agent')),
                        E('button', {
                            'class': 'btn cbi-button cbi-button-action',
                            'click': L.bind(this.handleRestartAgent, this)
                        }, _('Restart Agent'))
                    ])
                ])
            ]),

            // Agent Installation Guide
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Deploy New Agent')),
                E('div', { 'style': 'background: var(--background-color-high); padding: 1rem; border-radius: 8px;' }, [
                    E('p', {}, _('To register a new agent with the Wazuh Manager:')),
                    E('ol', { 'style': 'margin: 1rem 0; padding-left: 1.5rem;' }, [
                        E('li', {}, _('Install Wazuh agent on the target system')),
                        E('li', {}, _('Configure agent to connect to manager: 192.168.255.50')),
                        E('li', {}, _('Register with: /var/ossec/bin/agent-auth -m 192.168.255.50')),
                        E('li', {}, _('Start the agent service'))
                    ]),
                    E('div', { 'style': 'margin-top: 1rem;' }, [
                        E('a', {
                            'href': 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/index.html',
                            'target': '_blank',
                            'class': 'btn cbi-button'
                        }, _('Agent Installation Guide'))
                    ])
                ])
            ])
        ]);

        poll.add(L.bind(this.pollAgents, this), 30);

        return view;
    },

    renderStatCard: function(label, count, badgeClass) {
        return E('div', {
            'style': 'text-align: center; padding: 1rem; background: var(--background-color-high); border-radius: 8px; min-width: 120px;'
        }, [
            E('div', { 'style': 'font-size: 2.5em; font-weight: bold;' }, String(count)),
            E('div', { 'class': 'badge ' + badgeClass, 'style': 'font-size: 0.9em;' }, label)
        ]);
    },

    renderAgentsTable: function(agents) {
        if (!agents || agents.length === 0) {
            return E('div', { 'class': 'cbi-value', 'style': 'text-align: center; padding: 2rem;' },
                _('No agents registered')
            );
        }

        var rows = [
            E('tr', { 'class': 'tr' }, [
                E('th', { 'class': 'th', 'style': 'width: 60px;' }, _('ID')),
                E('th', { 'class': 'th' }, _('Name')),
                E('th', { 'class': 'th', 'style': 'width: 120px;' }, _('IP Address')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('Status')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('OS')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('Version')),
                E('th', { 'class': 'th', 'style': 'width: 150px;' }, _('Last Keep Alive'))
            ])
        ];

        agents.forEach(function(agent) {
            var statusClass = (agent.status === 'active' || agent.status === 'connected') ? 'success' :
                             (agent.status === 'disconnected' ? 'danger' : 'warning');
            var statusText = agent.status === 'active' ? 'Connected' :
                            (agent.status === 'connected' ? 'Connected' :
                            (agent.status === 'disconnected' ? 'Disconnected' :
                            (agent.status === 'pending' ? 'Pending' :
                            (agent.status === 'never_connected' ? 'Never Connected' : agent.status || 'Unknown'))));

            rows.push(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, [
                    E('code', {}, agent.id || '-')
                ]),
                E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, agent.name || '-'),
                E('td', { 'class': 'td', 'style': 'font-family: monospace;' }, agent.ip || '-'),
                E('td', { 'class': 'td' }, [
                    E('span', { 'class': 'badge ' + statusClass }, statusText)
                ]),
                E('td', { 'class': 'td', 'style': 'font-size: 0.85em;' },
                    agent.os_name || agent.os || '-'
                ),
                E('td', { 'class': 'td', 'style': 'font-family: monospace; font-size: 0.85em;' },
                    agent.version || '-'
                ),
                E('td', { 'class': 'td', 'style': 'font-size: 0.85em;' },
                    api.formatTime(agent.lastKeepAlive || agent.last_keepalive)
                )
            ]));
        });

        return E('table', { 'class': 'table' }, rows);
    },

    handleRefresh: function() {
        var container = document.getElementById('agents-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
        }

        var self = this;
        return api.listAgents().then(function(data) {
            var agents = data.agents || [];
            if (container) {
                dom.content(container, self.renderAgentsTable(agents));
            }
        });
    },

    handleStartAgent: function() {
        return api.startAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', _('Wazuh agent started successfully')), 'info');
            } else {
                L.ui.addNotification(null, E('p', _('Failed to start agent: %s').format(res.error || 'Unknown error')), 'error');
            }
        });
    },

    handleStopAgent: function() {
        return api.stopAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', _('Wazuh agent stopped')), 'info');
            } else {
                L.ui.addNotification(null, E('p', _('Failed to stop agent: %s').format(res.error || 'Unknown error')), 'error');
            }
        });
    },

    handleRestartAgent: function() {
        return api.restartAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', _('Wazuh agent restarted successfully')), 'info');
            } else {
                L.ui.addNotification(null, E('p', _('Failed to restart agent: %s').format(res.error || 'Unknown error')), 'error');
            }
        });
    },

    pollAgents: function() {
        return this.handleRefresh();
    }
});
