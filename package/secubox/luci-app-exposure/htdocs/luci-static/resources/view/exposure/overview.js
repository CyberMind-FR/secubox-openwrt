'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.status(),
            api.conflicts()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var conflicts = data[1] || [];

        var services = status.services || {};
        var tor = status.tor || {};
        var ssl = status.ssl || {};

        // Inject CSS
        var cssLink = document.querySelector('link[href*="exposure/dashboard.css"]');
        if (!cssLink) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = L.resource('exposure/dashboard.css');
            document.head.appendChild(link);
        }

        var view = E('div', { 'class': 'exposure-dashboard' }, [
            E('h2', {}, 'Service Exposure Manager'),
            E('p', { 'style': 'color: #8892b0; margin-bottom: 1.5rem;' },
                'Manage port conflicts, Tor hidden services, and HAProxy SSL backends'),

            // Stats cards
            E('div', { 'class': 'exposure-stats' }, [
                E('div', { 'class': 'exposure-stat-card' }, [
                    E('div', { 'class': 'exposure-stat-icon' }, '\ud83d\udd0c'),
                    E('div', { 'class': 'exposure-stat-value' }, String(services.total || 0)),
                    E('div', { 'class': 'exposure-stat-label' }, 'Total Services')
                ]),
                E('div', { 'class': 'exposure-stat-card' }, [
                    E('div', { 'class': 'exposure-stat-icon' }, '\ud83c\udf10'),
                    E('div', { 'class': 'exposure-stat-value' }, String(services.external || 0)),
                    E('div', { 'class': 'exposure-stat-label' }, 'External (0.0.0.0)')
                ]),
                E('div', { 'class': 'exposure-stat-card' }, [
                    E('div', { 'class': 'exposure-stat-icon' }, '\ud83e\uddc5'),
                    E('div', { 'class': 'exposure-stat-value' }, String(tor.count || 0)),
                    E('div', { 'class': 'exposure-stat-label' }, 'Tor Hidden Services')
                ]),
                E('div', { 'class': 'exposure-stat-card' }, [
                    E('div', { 'class': 'exposure-stat-icon' }, '\ud83d\udd12'),
                    E('div', { 'class': 'exposure-stat-value' }, String(ssl.count || 0)),
                    E('div', { 'class': 'exposure-stat-label' }, 'SSL Backends')
                ])
            ]),

            // Conflicts warning
            conflicts.length > 0 ? E('div', { 'class': 'conflict-warning' }, [
                E('div', { 'class': 'conflict-warning-header' }, [
                    '\u26a0\ufe0f Port Conflicts Detected'
                ]),
                E('ul', {},
                    conflicts.map(function(c) {
                        return E('li', {},
                            'Port ' + c.port + ': ' + (c.services || []).join(', ')
                        );
                    })
                )
            ]) : null,

            // Tor Hidden Services section
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83e\uddc5'),
                        'Tor Hidden Services'
                    ]),
                    E('a', {
                        'href': L.url('admin/secubox/network/exposure/tor'),
                        'class': 'btn-action btn-primary'
                    }, 'Manage')
                ]),
                (tor.services && tor.services.length > 0) ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', {}, 'Service'),
                                E('th', {}, 'Onion Address')
                            ])
                        ]),
                        E('tbody', {},
                            tor.services.map(function(svc) {
                                return E('tr', {}, [
                                    E('td', {}, svc.service),
                                    E('td', { 'class': 'onion-address' }, svc.onion)
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83e\uddc5'),
                        E('p', {}, 'No Tor hidden services configured')
                    ])
            ]),

            // SSL Backends section
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83d\udd12'),
                        'HAProxy SSL Backends'
                    ]),
                    E('a', {
                        'href': L.url('admin/secubox/network/exposure/ssl'),
                        'class': 'btn-action btn-primary'
                    }, 'Manage')
                ]),
                (ssl.backends && ssl.backends.length > 0) ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', {}, 'Service'),
                                E('th', {}, 'Domain')
                            ])
                        ]),
                        E('tbody', {},
                            ssl.backends.map(function(b) {
                                return E('tr', {}, [
                                    E('td', {}, b.service),
                                    E('td', {}, b.domain)
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83d\udd12'),
                        E('p', {}, 'No SSL backends configured')
                    ])
            ])
        ].filter(Boolean));

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
