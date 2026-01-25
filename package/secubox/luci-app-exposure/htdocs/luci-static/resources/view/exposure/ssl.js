'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.sslList(),
            api.scan()
        ]);
    },

    render: function(data) {
        var sslBackends = data[0] || [];
        var allServices = data[1] || [];
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
            E('h2', {}, '\ud83d\udd12 HAProxy SSL Backends'),
            E('p', { 'style': 'color: #8892b0; margin-bottom: 1.5rem;' },
                'Configure HTTPS reverse proxy for your services'),

            // Add new backend form
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\u2795'),
                        'Add SSL Backend'
                    ])
                ]),
                E('div', { 'class': 'exposure-form' }, [
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Service'),
                        E('select', { 'id': 'new-ssl-service' },
                            [E('option', { 'value': '' }, '-- Select --')].concat(
                                allServices.filter(function(s) { return s.external; }).map(function(s) {
                                    var name = s.name || s.process;
                                    return E('option', {
                                        'value': s.process,
                                        'data-port': s.port,
                                        'data-name': name.toLowerCase().replace(/\s+/g, '')
                                    }, name + ' (:' + s.port + ')');
                                })
                            )
                        )
                    ]),
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Domain'),
                        E('input', {
                            'type': 'text',
                            'id': 'new-ssl-domain',
                            'placeholder': 'service.example.com'
                        })
                    ]),
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Backend Port'),
                        E('input', { 'type': 'number', 'id': 'new-ssl-port', 'placeholder': '3000' })
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': ui.createHandlerFn(self, 'handleAdd')
                    }, 'Add Backend')
                ])
            ]),

            // Info box
            E('div', {
                'class': 'exposure-section',
                'style': 'background: rgba(0, 212, 255, 0.1); border-color: #00d4ff;'
            }, [
                E('p', { 'style': 'margin: 0; color: #ccd6f6;' }, [
                    E('strong', {}, '\u2139\ufe0f SSL Certificate: '),
                    'After adding a backend, upload the SSL certificate to ',
                    E('code', {}, '/srv/lxc/haproxy/rootfs/etc/haproxy/certs/'),
                    '. The certificate file should be named ',
                    E('code', {}, 'domain.pem'),
                    ' and contain both the certificate and private key.'
                ])
            ]),

            // Existing backends
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83d\udd12'),
                        'Active SSL Backends (' + sslBackends.length + ')'
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': function() { location.reload(); }
                    }, 'Refresh')
                ]),

                sslBackends.length > 0 ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', {}, 'Service'),
                                E('th', {}, 'Domain'),
                                E('th', {}, 'Backend'),
                                E('th', {}, 'Actions')
                            ])
                        ]),
                        E('tbody', {},
                            sslBackends.map(function(b) {
                                return E('tr', {}, [
                                    E('td', { 'style': 'font-weight: 600;' }, b.service),
                                    E('td', {}, [
                                        E('a', {
                                            'href': 'https://' + b.domain,
                                            'target': '_blank',
                                            'style': 'color: #00d4ff;'
                                        }, b.domain),
                                        E('span', { 'style': 'margin-left: 0.5rem;' }, '\ud83d\udd17')
                                    ]),
                                    E('td', { 'style': 'font-family: monospace;' }, b.backend || 'N/A'),
                                    E('td', {}, [
                                        E('button', {
                                            'class': 'btn-action btn-danger',
                                            'click': ui.createHandlerFn(self, 'handleRemove', b.service)
                                        }, 'Remove')
                                    ])
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83d\udd12'),
                        E('p', {}, 'No SSL backends configured'),
                        E('p', { 'style': 'font-size: 0.85rem;' }, 'Select a service above to add HTTPS access')
                    ])
            ])
        ]);

        // Wire up service selector
        setTimeout(function() {
            var sel = document.getElementById('new-ssl-service');
            var portInput = document.getElementById('new-ssl-port');
            var domainInput = document.getElementById('new-ssl-domain');
            if (sel && portInput) {
                sel.addEventListener('change', function() {
                    var opt = sel.options[sel.selectedIndex];
                    portInput.value = opt.dataset.port || '';
                    if (opt.dataset.name) {
                        domainInput.placeholder = opt.dataset.name + '.example.com';
                    }
                });
            }
        }, 100);

        return view;
    },

    handleAdd: function(ev) {
        var service = document.getElementById('new-ssl-service').value;
        var domain = document.getElementById('new-ssl-domain').value;
        var port = parseInt(document.getElementById('new-ssl-port').value);

        if (!service) {
            ui.addNotification(null, E('p', {}, 'Please select a service'), 'warning');
            return;
        }

        if (!domain) {
            ui.addNotification(null, E('p', {}, 'Please enter a domain'), 'warning');
            return;
        }

        if (!port) {
            ui.addNotification(null, E('p', {}, 'Please specify the backend port'), 'warning');
            return;
        }

        api.sslAdd(service, domain, port).then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', {}, [
                    'SSL backend configured for ',
                    E('strong', {}, domain),
                    E('br'),
                    'Remember to upload the SSL certificate!'
                ]), 'success');
                location.reload();
            } else {
                ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'danger');
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'danger');
        });
    },

    handleRemove: function(service, ev) {
        if (!confirm('Remove SSL backend for ' + service + '?')) {
            return;
        }

        api.sslRemove(service).then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'SSL backend removed'), 'success');
                location.reload();
            } else {
                ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'danger');
            }
        });
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
