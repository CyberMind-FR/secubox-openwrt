'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.scan(),
            api.getConfig()
        ]);
    },

    render: function(data) {
        var services = data[0] || [];
        var config = data[1] || [];
        var self = this;

        // Inject CSS
        var cssLink = document.querySelector('link[href*="exposure/dashboard.css"]');
        if (!cssLink) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = L.resource('exposure/dashboard.css');
            document.head.appendChild(link);
        }

        var view = E('div', { 'class': 'exposure-dashboard' }, [
            E('h2', {}, 'Listening Services'),
            E('p', { 'style': 'color: #8892b0; margin-bottom: 1.5rem;' },
                'All services currently listening on network ports'),

            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83d\udd0c'),
                        'Active Services (' + services.length + ')'
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': function() { location.reload(); }
                    }, 'Refresh')
                ]),

                services.length > 0 ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', {}, 'Port'),
                                E('th', {}, 'Service'),
                                E('th', {}, 'Process'),
                                E('th', {}, 'Address'),
                                E('th', {}, 'Status'),
                                E('th', {}, 'Actions')
                            ])
                        ]),
                        E('tbody', {},
                            services.map(function(svc) {
                                var isKnown = config.find(function(k) {
                                    return k.actual_port == svc.port;
                                });

                                return E('tr', {}, [
                                    E('td', { 'style': 'font-weight: 600;' }, String(svc.port)),
                                    E('td', {}, svc.name || svc.process),
                                    E('td', { 'style': 'font-family: monospace; color: #8892b0;' }, svc.process),
                                    E('td', { 'style': 'font-family: monospace;' }, svc.address),
                                    E('td', {}, [
                                        E('span', {
                                            'class': 'badge ' + (svc.external ? 'badge-external' : 'badge-local')
                                        }, svc.external ? 'External' : 'Local')
                                    ]),
                                    E('td', {}, [
                                        svc.external ? E('button', {
                                            'class': 'btn-action btn-tor',
                                            'style': 'margin-right: 0.5rem;',
                                            'click': ui.createHandlerFn(self, 'handleAddTor', svc)
                                        }, '\ud83e\uddc5 Tor') : null,
                                        svc.external ? E('button', {
                                            'class': 'btn-action btn-ssl',
                                            'click': ui.createHandlerFn(self, 'handleAddSsl', svc)
                                        }, '\ud83d\udd12 SSL') : null
                                    ].filter(Boolean))
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83d\udd0c'),
                        E('p', {}, 'No listening services detected')
                    ])
            ])
        ]);

        return view;
    },

    handleAddTor: function(svc, ev) {
        var self = this;
        var serviceName = svc.name ? svc.name.toLowerCase().replace(/\s+/g, '') : svc.process;

        ui.showModal('Add Tor Hidden Service', [
            E('p', {}, 'Create a .onion address for ' + (svc.name || svc.process)),
            E('div', { 'class': 'exposure-form', 'style': 'flex-direction: column; align-items: stretch;' }, [
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Service Name'),
                    E('input', {
                        'type': 'text',
                        'id': 'tor-service-name',
                        'value': serviceName,
                        'style': 'width: 100%;'
                    })
                ]),
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Local Port'),
                    E('input', {
                        'type': 'number',
                        'id': 'tor-local-port',
                        'value': svc.port,
                        'style': 'width: 100%;'
                    })
                ]),
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Onion Port (public)'),
                    E('input', {
                        'type': 'number',
                        'id': 'tor-onion-port',
                        'value': '80',
                        'style': 'width: 100%;'
                    })
                ])
            ]),
            E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        var name = document.getElementById('tor-service-name').value;
                        var localPort = parseInt(document.getElementById('tor-local-port').value);
                        var onionPort = parseInt(document.getElementById('tor-onion-port').value);

                        ui.hideModal();
                        ui.showModal('Creating Hidden Service...', [
                            E('p', { 'class': 'spinning' }, 'Please wait, generating .onion address...')
                        ]);

                        api.torAdd(name, localPort, onionPort).then(function(res) {
                            ui.hideModal();
                            if (res.success) {
                                ui.addNotification(null, E('p', {}, [
                                    'Hidden service created! ',
                                    E('br'),
                                    E('code', {}, res.onion || 'Check Tor tab for address')
                                ]), 'success');
                            } else {
                                ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'danger');
                            }
                        });
                    }
                }, 'Create')
            ])
        ]);
    },

    handleAddSsl: function(svc, ev) {
        var serviceName = svc.name ? svc.name.toLowerCase().replace(/\s+/g, '') : svc.process;

        ui.showModal('Add SSL Backend', [
            E('p', {}, 'Configure HAProxy SSL reverse proxy for ' + (svc.name || svc.process)),
            E('div', { 'class': 'exposure-form', 'style': 'flex-direction: column; align-items: stretch;' }, [
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Service Name'),
                    E('input', {
                        'type': 'text',
                        'id': 'ssl-service-name',
                        'value': serviceName,
                        'style': 'width: 100%;'
                    })
                ]),
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Domain'),
                    E('input', {
                        'type': 'text',
                        'id': 'ssl-domain',
                        'placeholder': serviceName + '.example.com',
                        'style': 'width: 100%;'
                    })
                ]),
                E('div', { 'class': 'exposure-form-group' }, [
                    E('label', {}, 'Backend Port'),
                    E('input', {
                        'type': 'number',
                        'id': 'ssl-port',
                        'value': svc.port,
                        'style': 'width: 100%;'
                    })
                ])
            ]),
            E('div', { 'class': 'right', 'style': 'margin-top: 1rem;' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        var name = document.getElementById('ssl-service-name').value;
                        var domain = document.getElementById('ssl-domain').value;
                        var port = parseInt(document.getElementById('ssl-port').value);

                        if (!domain) {
                            ui.addNotification(null, E('p', {}, 'Domain is required'), 'danger');
                            return;
                        }

                        ui.hideModal();
                        api.sslAdd(name, domain, port).then(function(res) {
                            if (res.success) {
                                ui.addNotification(null, E('p', {}, 'SSL backend configured for ' + domain), 'success');
                            } else {
                                ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'danger');
                            }
                        });
                    }
                }, 'Configure')
            ])
        ]);
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
