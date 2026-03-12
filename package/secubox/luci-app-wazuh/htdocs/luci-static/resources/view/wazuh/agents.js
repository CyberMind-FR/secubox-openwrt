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
        return api.listAgents();
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

    renderStats: function(agents) {
        var c = KissTheme.colors;
        var connected = agents.filter(function(a) { return a.status === 'active' || a.status === 'connected'; }).length;
        var disconnected = agents.filter(function(a) { return a.status === 'disconnected'; }).length;
        var pending = agents.filter(function(a) { return a.status === 'pending' || a.status === 'never_connected'; }).length;

        return [
            KissTheme.stat(connected, 'Connected', c.green),
            KissTheme.stat(disconnected, 'Disconnected', c.red),
            KissTheme.stat(pending, 'Pending', c.yellow),
            KissTheme.stat(agents.length, 'Total', c.cyan)
        ];
    },

    renderAgentsTable: function(agents) {
        var c = KissTheme.colors;
        if (!agents || agents.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, 'No agents registered');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', { 'style': 'width: 60px;' }, 'ID'),
                E('th', {}, 'Name'),
                E('th', { 'style': 'width: 120px;' }, 'IP Address'),
                E('th', { 'style': 'width: 110px;' }, 'Status'),
                E('th', { 'style': 'width: 100px;' }, 'OS'),
                E('th', { 'style': 'width: 100px;' }, 'Version'),
                E('th', { 'style': 'width: 140px;' }, 'Last Keep Alive')
            ])),
            E('tbody', { 'id': 'agents-body' }, agents.map(function(agent) {
                var isConnected = agent.status === 'active' || agent.status === 'connected';
                var statusText = isConnected ? 'Connected' :
                    agent.status === 'disconnected' ? 'Disconnected' :
                    agent.status === 'pending' ? 'Pending' :
                    agent.status === 'never_connected' ? 'Never' : (agent.status || 'Unknown');

                return E('tr', {}, [
                    E('td', {}, E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px; font-size: 11px;' }, agent.id || '-')),
                    E('td', { 'style': 'font-weight: 600;' }, agent.name || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-cyan);' }, agent.ip || '-'),
                    E('td', {}, KissTheme.badge(statusText, isConnected ? 'green' : 'red')),
                    E('td', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, agent.os_name || agent.os || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, agent.version || '-'),
                    E('td', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, api.formatTime(agent.lastKeepAlive || agent.last_keepalive))
                ]);
            }))
        ]);
    },

    renderLocalAgentControl: function() {
        var self = this;
        return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
            E('p', { 'style': 'color: var(--kiss-muted); font-size: 13px; margin: 0;' },
                'Control the Wazuh agent running on this SecuBox device'
            ),
            E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
                E('button', {
                    'class': 'kiss-btn kiss-btn-green',
                    'click': function() { self.handleStartAgent(); }
                }, 'Start Agent'),
                E('button', {
                    'class': 'kiss-btn kiss-btn-red',
                    'click': function() { self.handleStopAgent(); }
                }, 'Stop Agent'),
                E('button', {
                    'class': 'kiss-btn kiss-btn-blue',
                    'click': function() { self.handleRestartAgent(); }
                }, 'Restart Agent')
            ])
        ]);
    },

    renderDeployGuide: function() {
        return E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, [
            E('p', { 'style': 'margin: 0 0 12px 0;' }, 'To register a new agent with the Wazuh Manager:'),
            E('ol', { 'style': 'margin: 0; padding-left: 20px;' }, [
                E('li', {}, 'Install Wazuh agent on the target system'),
                E('li', {}, 'Configure agent to connect to manager: 192.168.255.50'),
                E('li', {}, E('code', { 'style': 'background: var(--kiss-bg2); padding: 2px 6px; border-radius: 4px;' }, '/var/ossec/bin/agent-auth -m 192.168.255.50')),
                E('li', {}, 'Start the agent service')
            ]),
            E('div', { 'style': 'margin-top: 16px;' }, [
                E('a', {
                    'href': 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/index.html',
                    'target': '_blank',
                    'class': 'kiss-btn',
                    'style': 'text-decoration: none;'
                }, 'Agent Installation Guide')
            ])
        ]);
    },

    handleRefresh: function() {
        var container = document.getElementById('agents-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, [
                E('span', { 'class': 'spinning' }),
                ' Loading...'
            ]));
        }

        var self = this;
        return api.listAgents().then(function(data) {
            var agents = data.agents || [];
            if (container) {
                dom.content(container, self.renderAgentsTable(agents));
            }
            var statsEl = document.getElementById('agents-stats');
            if (statsEl) {
                dom.content(statsEl, self.renderStats(agents));
            }
        });
    },

    handleStartAgent: function() {
        return api.startAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', 'Wazuh agent started successfully'), 'info');
            } else {
                L.ui.addNotification(null, E('p', 'Failed to start agent: ' + (res.error || 'Unknown')), 'error');
            }
        });
    },

    handleStopAgent: function() {
        return api.stopAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', 'Wazuh agent stopped'), 'info');
            } else {
                L.ui.addNotification(null, E('p', 'Failed to stop agent: ' + (res.error || 'Unknown')), 'error');
            }
        });
    },

    handleRestartAgent: function() {
        return api.restartAgent().then(function(res) {
            if (res.success) {
                L.ui.addNotification(null, E('p', 'Wazuh agent restarted successfully'), 'info');
            } else {
                L.ui.addNotification(null, E('p', 'Failed to restart agent: ' + (res.error || 'Unknown')), 'error');
            }
        });
    },

    render: function(data) {
        var self = this;
        var agents = data.agents || [];

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Wazuh Agents'),
                    KissTheme.badge(agents.length + ' registered', 'blue')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Manage security agents across your infrastructure')
            ]),

            // Navigation
            this.renderNav('agents'),

            // Stats row
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'agents-stats', 'style': 'margin: 20px 0;' }, this.renderStats(agents)),

            // Actions
            E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 20px;' }, [
                E('button', {
                    'class': 'kiss-btn kiss-btn-blue',
                    'click': function() { self.handleRefresh(); }
                }, 'Refresh'),
                E('a', {
                    'href': 'https://wazuh.gk2.secubox.in/app/wazuh#/agents-preview',
                    'target': '_blank',
                    'class': 'kiss-btn',
                    'style': 'text-decoration: none;'
                }, 'View in Wazuh Dashboard')
            ]),

            // Agents Table
            KissTheme.card('Registered Agents', E('div', { 'id': 'agents-container' }, this.renderAgentsTable(agents))),

            // Two column layout
            E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
                // Local Agent Control
                KissTheme.card('Local Agent Control', this.renderLocalAgentControl()),
                // Deploy Guide
                KissTheme.card('Deploy New Agent', this.renderDeployGuide())
            ])
        ];

        poll.add(L.bind(function() { return this.handleRefresh(); }, this), 30);

        return KissTheme.wrap(content, 'admin/services/wazuh/agents');
    }
});
