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
        return Promise.all([
            api.getFIMEvents(50),
            api.getFIMConfig()
        ]);
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

    countByType: function(events, type) {
        return events.filter(function(e) { return e.event_type === type; }).length;
    },

    renderStats: function(events) {
        var c = KissTheme.colors;
        return [
            KissTheme.stat(this.countByType(events, 'added'), 'Added', c.green),
            KissTheme.stat(this.countByType(events, 'modified'), 'Modified', c.orange),
            KissTheme.stat(this.countByType(events, 'deleted'), 'Deleted', c.red),
            KissTheme.stat(events.length, 'Total Events', c.cyan)
        ];
    },

    renderConfigCard: function(title, items) {
        if (!items || items.length === 0) {
            return E('div', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, 'None configured');
        }

        var displayItems = items.slice(0, 5).map(function(item) {
            var path = typeof item === 'string' ? item : item.path || JSON.stringify(item);
            return E('div', { 'style': 'font-family: monospace; font-size: 11px; padding: 4px 0; color: var(--kiss-cyan); border-bottom: 1px solid var(--kiss-line);' }, path);
        });

        if (items.length > 5) {
            displayItems.push(E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); font-style: italic; padding-top: 8px;' },
                '... and ' + (items.length - 5) + ' more'
            ));
        }

        return E('div', {}, displayItems);
    },

    renderEventsTable: function(events) {
        var c = KissTheme.colors;
        var self = this;

        if (!events || events.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, 'No file integrity events found');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, E('tr', {}, [
                E('th', { 'style': 'width: 60px;' }, 'Type'),
                E('th', { 'style': 'width: 140px;' }, 'Time'),
                E('th', {}, 'Path'),
                E('th', { 'style': 'width: 80px;' }, 'Mode'),
                E('th', { 'style': 'width: 80px;' }, 'User'),
                E('th', { 'style': 'width: 90px;' }, 'Size')
            ])),
            E('tbody', { 'id': 'fim-body' }, events.map(function(event) {
                var typeColor = event.event_type === 'added' ? c.green :
                    event.event_type === 'deleted' ? c.red : c.orange;
                var typeSymbol = event.event_type === 'added' ? '+' :
                    event.event_type === 'deleted' ? '-' : '~';

                return E('tr', {}, [
                    E('td', {}, E('span', {
                        'style': 'display: inline-block; width: 24px; height: 24px; border-radius: 4px; text-align: center; line-height: 24px; font-weight: bold; background: ' + typeColor + '20; color: ' + typeColor + ';'
                    }, typeSymbol)),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, api.formatTime(event.timestamp)),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-text); word-break: break-all;' }, event.path || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, event.perm || event.mode || '-'),
                    E('td', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, event.uname || event.user || '-'),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px; color: var(--kiss-muted);' }, event.size ? self.formatSize(event.size) : '-')
                ]);
            }))
        ]);
    },

    formatSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    },

    renderLegend: function() {
        var c = KissTheme.colors;
        var types = [
            { symbol: '+', label: 'Added', color: c.green },
            { symbol: '~', label: 'Modified', color: c.orange },
            { symbol: '-', label: 'Deleted', color: c.red }
        ];

        return E('div', { 'style': 'display: flex; gap: 20px; flex-wrap: wrap;' }, types.map(function(t) {
            return E('span', { 'style': 'display: flex; align-items: center; gap: 8px; font-size: 12px;' }, [
                E('span', {
                    'style': 'display: inline-block; width: 20px; height: 20px; border-radius: 4px; text-align: center; line-height: 20px; font-weight: bold; background: ' + t.color + '20; color: ' + t.color + ';'
                }, t.symbol),
                E('span', { 'style': 'color: var(--kiss-muted);' }, t.label)
            ]);
        }));
    },

    handleRefresh: function() {
        var container = document.getElementById('fim-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(E('div', { 'style': 'text-align: center; padding: 32px; color: var(--kiss-muted);' }, [
                E('span', { 'class': 'spinning' }),
                ' Loading...'
            ]));
        }

        var self = this;
        return api.getFIMEvents(50).then(function(data) {
            var events = data.events || [];
            if (container) {
                dom.content(container, self.renderEventsTable(events));
            }
            var statsEl = document.getElementById('fim-stats');
            if (statsEl) {
                dom.content(statsEl, self.renderStats(events));
            }
        });
    },

    render: function(data) {
        var self = this;
        var events = data[0].events || [];
        var config = data[1] || {};

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'File Integrity Monitoring'),
                    KissTheme.badge(events.length + ' events', 'blue')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Track changes to critical files and directories')
            ]),

            // Navigation
            this.renderNav('fim'),

            // Stats row
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'fim-stats', 'style': 'margin: 20px 0;' }, this.renderStats(events)),

            // Config cards
            E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin-bottom: 20px;' }, [
                KissTheme.card('Monitored Directories', this.renderConfigCard('Directories', config.directories)),
                KissTheme.card('Registry Keys', this.renderConfigCard('Registry', config.registry)),
                KissTheme.card('Ignored Paths', this.renderConfigCard('Ignored', config.ignore))
            ]),

            // Refresh button
            E('div', { 'style': 'margin-bottom: 20px;' }, [
                E('button', {
                    'class': 'kiss-btn kiss-btn-blue',
                    'click': function() { self.handleRefresh(); }
                }, 'Refresh')
            ]),

            // Events table
            KissTheme.card('Recent File Changes', E('div', { 'id': 'fim-container' }, this.renderEventsTable(events))),

            // Legend
            KissTheme.card('Event Types', this.renderLegend())
        ];

        poll.add(L.bind(function() { return this.handleRefresh(); }, this), 60);

        return KissTheme.wrap(content, 'admin/services/wazuh/fim');
    }
});
