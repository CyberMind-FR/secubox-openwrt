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
            api.getFIMEvents(50),
            api.getFIMConfig()
        ]);
    },

    render: function(data) {
        var events = data[0].events || [];
        var config = data[1] || {};

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('File Integrity Monitoring')),
            E('div', { 'class': 'cbi-map-descr' },
                _('Track changes to critical files and directories')
            ),

            // FIM Configuration Summary
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Monitored Paths')),
                E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 1rem;' }, [
                    this.renderConfigCard('Directories', config.directories || [], 'folder'),
                    this.renderConfigCard('Registry Keys', config.registry || [], 'key'),
                    this.renderConfigCard('Ignored Paths', config.ignore || [], 'blocked')
                ])
            ]),

            // Statistics
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Event Statistics')),
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    this.renderStatCard('Added', this.countByType(events, 'added'), 'success'),
                    this.renderStatCard('Modified', this.countByType(events, 'modified'), 'warning'),
                    this.renderStatCard('Deleted', this.countByType(events, 'deleted'), 'danger'),
                    this.renderStatCard('Total Events', events.length, 'info')
                ])
            ]),

            // FIM Events Table
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, _('Recent File Changes')),
                E('div', { 'style': 'margin-bottom: 1rem;' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': L.bind(this.handleRefresh, this)
                    }, _('Refresh'))
                ]),
                E('div', { 'id': 'fim-events-container' }, [
                    this.renderEventsTable(events)
                ])
            ]),

            // Event Type Legend
            E('div', { 'class': 'cbi-section' }, [
                E('h4', {}, _('Event Types')),
                E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
                    E('span', {}, [
                        E('span', { 'class': 'badge success', 'style': 'margin-right: 0.5rem;' }, '+'),
                        _('Added')
                    ]),
                    E('span', {}, [
                        E('span', { 'class': 'badge warning', 'style': 'margin-right: 0.5rem;' }, '~'),
                        _('Modified')
                    ]),
                    E('span', {}, [
                        E('span', { 'class': 'badge danger', 'style': 'margin-right: 0.5rem;' }, '-'),
                        _('Deleted')
                    ])
                ])
            ])
        ]);

        poll.add(L.bind(this.pollEvents, this), 60);

        return view;
    },

    renderConfigCard: function(title, items, icon) {
        var content = items.length > 0
            ? items.slice(0, 5).map(function(item) {
                return E('div', { 'style': 'font-family: monospace; font-size: 0.85em; padding: 0.2rem 0;' },
                    typeof item === 'string' ? item : item.path || JSON.stringify(item)
                );
              })
            : [E('div', { 'style': 'color: var(--text-color-low);' }, _('None configured'))];

        if (items.length > 5) {
            content.push(E('div', { 'style': 'color: var(--text-color-low); font-style: italic;' },
                _('... and %d more').format(items.length - 5)
            ));
        }

        return E('div', {
            'style': 'flex: 1; min-width: 250px; background: var(--background-color-high); padding: 1rem; border-radius: 8px;'
        }, [
            E('div', { 'style': 'font-weight: bold; margin-bottom: 0.5rem;' }, title),
            E('div', {}, content)
        ]);
    },

    renderStatCard: function(label, count, badgeClass) {
        return E('div', {
            'style': 'text-align: center; padding: 1rem; background: var(--background-color-high); border-radius: 8px; min-width: 100px;'
        }, [
            E('div', { 'style': 'font-size: 2em; font-weight: bold;' }, String(count)),
            E('div', { 'class': 'badge ' + badgeClass }, label)
        ]);
    },

    countByType: function(events, type) {
        return events.filter(function(e) { return e.event_type === type; }).length;
    },

    renderEventsTable: function(events) {
        if (!events || events.length === 0) {
            return E('div', { 'class': 'cbi-value', 'style': 'text-align: center; padding: 2rem;' },
                _('No file integrity events found')
            );
        }

        var rows = [
            E('tr', { 'class': 'tr' }, [
                E('th', { 'class': 'th', 'style': 'width: 60px;' }, _('Type')),
                E('th', { 'class': 'th', 'style': 'width: 150px;' }, _('Time')),
                E('th', { 'class': 'th' }, _('Path')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('Mode')),
                E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('User')),
                E('th', { 'class': 'th', 'style': 'width: 120px;' }, _('Size'))
            ])
        ];

        events.forEach(function(event) {
            var typeClass = event.event_type === 'added' ? 'success' :
                           (event.event_type === 'deleted' ? 'danger' : 'warning');
            var typeSymbol = event.event_type === 'added' ? '+' :
                            (event.event_type === 'deleted' ? '-' : '~');

            rows.push(E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, [
                    E('span', { 'class': 'badge ' + typeClass }, typeSymbol)
                ]),
                E('td', { 'class': 'td', 'style': 'font-size: 0.85em;' },
                    api.formatTime(event.timestamp)
                ),
                E('td', { 'class': 'td', 'style': 'font-family: monospace; word-break: break-all;' },
                    event.path || '-'
                ),
                E('td', { 'class': 'td', 'style': 'font-family: monospace;' },
                    event.perm || event.mode || '-'
                ),
                E('td', { 'class': 'td' }, event.uname || event.user || '-'),
                E('td', { 'class': 'td', 'style': 'font-family: monospace;' },
                    event.size ? this.formatSize(event.size) : '-'
                )
            ]));
        }, this);

        return E('table', { 'class': 'table' }, rows);
    },

    formatSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    },

    handleRefresh: function() {
        var container = document.getElementById('fim-events-container');
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
        }

        var self = this;
        return api.getFIMEvents(50).then(function(data) {
            var events = data.events || [];
            if (container) {
                dom.content(container, self.renderEventsTable(events));
            }
        });
    },

    pollEvents: function() {
        return this.handleRefresh();
    }
});
