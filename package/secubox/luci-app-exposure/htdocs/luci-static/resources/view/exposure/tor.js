'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.torList(),
            api.scan()
        ]);
    },

    render: function(data) {
        var torServices = data[0] || [];
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
            E('h2', {}, '\ud83e\uddc5 Tor Hidden Services'),
            E('p', { 'style': 'color: #8892b0; margin-bottom: 1.5rem;' },
                'Expose services on the Tor network with .onion addresses'),

            // Add new service form
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\u2795'),
                        'Add Hidden Service'
                    ])
                ]),
                E('div', { 'class': 'exposure-form' }, [
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Service'),
                        E('select', { 'id': 'new-tor-service' },
                            [E('option', { 'value': '' }, '-- Select --')].concat(
                                allServices.filter(function(s) { return s.external; }).map(function(s) {
                                    var name = s.name || s.process;
                                    return E('option', { 'value': s.process, 'data-port': s.port },
                                        name + ' (:' + s.port + ')');
                                })
                            )
                        )
                    ]),
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Local Port'),
                        E('input', { 'type': 'number', 'id': 'new-tor-port', 'placeholder': '3000' })
                    ]),
                    E('div', { 'class': 'exposure-form-group' }, [
                        E('label', {}, 'Onion Port'),
                        E('input', { 'type': 'number', 'id': 'new-tor-onion-port', 'value': '80' })
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': ui.createHandlerFn(self, 'handleAdd')
                    }, 'Create .onion')
                ])
            ]),

            // Existing services
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83e\uddc5'),
                        'Active Hidden Services (' + torServices.length + ')'
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': function() { location.reload(); }
                    }, 'Refresh')
                ]),

                torServices.length > 0 ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', {}, 'Service'),
                                E('th', {}, 'Onion Address'),
                                E('th', {}, 'Port'),
                                E('th', {}, 'Backend'),
                                E('th', {}, 'Actions')
                            ])
                        ]),
                        E('tbody', {},
                            torServices.map(function(svc) {
                                return E('tr', {}, [
                                    E('td', { 'style': 'font-weight: 600;' }, svc.service),
                                    E('td', {}, [
                                        E('code', { 'class': 'onion-address' }, svc.onion),
                                        E('button', {
                                            'class': 'btn-action',
                                            'style': 'margin-left: 0.5rem; padding: 0.25rem 0.5rem;',
                                            'click': function() {
                                                navigator.clipboard.writeText(svc.onion);
                                                ui.addNotification(null, E('p', {}, 'Copied to clipboard'), 'info');
                                            }
                                        }, '\ud83d\udccb')
                                    ]),
                                    E('td', {}, svc.port || '80'),
                                    E('td', { 'style': 'font-family: monospace;' }, svc.backend || 'N/A'),
                                    E('td', {}, [
                                        E('button', {
                                            'class': 'btn-action btn-danger',
                                            'click': ui.createHandlerFn(self, 'handleRemove', svc.service)
                                        }, 'Remove')
                                    ])
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83e\uddc5'),
                        E('p', {}, 'No Tor hidden services configured'),
                        E('p', { 'style': 'font-size: 0.85rem;' }, 'Select a service above to create a .onion address')
                    ])
            ])
        ]);

        // Wire up service selector
        setTimeout(function() {
            var sel = document.getElementById('new-tor-service');
            var portInput = document.getElementById('new-tor-port');
            if (sel && portInput) {
                sel.addEventListener('change', function() {
                    var opt = sel.options[sel.selectedIndex];
                    portInput.value = opt.dataset.port || '';
                });
            }
        }, 100);

        return view;
    },

    handleAdd: function(ev) {
        var service = document.getElementById('new-tor-service').value;
        var port = parseInt(document.getElementById('new-tor-port').value);
        var onionPort = parseInt(document.getElementById('new-tor-onion-port').value) || 80;

        if (!service) {
            ui.addNotification(null, E('p', {}, 'Please select a service'), 'warning');
            return;
        }

        if (!port) {
            ui.addNotification(null, E('p', {}, 'Please specify the local port'), 'warning');
            return;
        }

        ui.showModal('Creating Hidden Service...', [
            E('p', { 'class': 'spinning' }, 'Please wait, generating .onion address (this may take a moment)...')
        ]);

        api.torAdd(service, port, onionPort).then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', {}, [
                    'Hidden service created! ',
                    E('br'),
                    E('code', { 'style': 'word-break: break-all;' }, res.onion || 'Refresh to see address')
                ]), 'success');
                location.reload();
            } else {
                ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown error')), 'danger');
            }
        }).catch(function(err) {
            ui.hideModal();
            ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'danger');
        });
    },

    handleRemove: function(service, ev) {
        if (!confirm('Remove hidden service for ' + service + '?\n\nThe .onion address will be permanently lost.')) {
            return;
        }

        api.torRemove(service).then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'Hidden service removed'), 'success');
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
