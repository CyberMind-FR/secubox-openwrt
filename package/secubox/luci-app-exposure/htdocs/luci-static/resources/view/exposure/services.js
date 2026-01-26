'use strict';
'require view';
'require dom';
'require ui';
'require exposure/api as api';

/**
 * Unified Service Exposure Manager
 * Toggle Tor Hidden Services and SSL/HAProxy exposure with checkboxes
 */

return view.extend({
    load: function() {
        return Promise.all([
            api.scan(),
            api.getConfig(),
            api.torList(),
            api.sslList()
        ]);
    },

    render: function(data) {
        var scanResult = data[0] || {};
        var configResult = data[1] || {};
        var torResult = data[2] || {};
        var sslResult = data[3] || {};

        var services = Array.isArray(scanResult) ? scanResult : (scanResult.services || []);
        var knownServices = Array.isArray(configResult) ? configResult : (configResult.known_services || []);
        var torServices = Array.isArray(torResult) ? torResult : (torResult.services || []);
        var sslBackends = Array.isArray(sslResult) ? sslResult : (sslResult.backends || []);
        var self = this;

        // Build lookup maps for current exposure status
        var torByService = {};
        torServices.forEach(function(t) {
            torByService[t.service] = t;
        });

        var sslByService = {};
        sslBackends.forEach(function(s) {
            sslByService[s.service] = s;
        });

        // Inject CSS
        var cssLink = document.querySelector('link[href*="exposure/dashboard.css"]');
        if (!cssLink) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = L.resource('exposure/dashboard.css');
            document.head.appendChild(link);
        }

        // Filter to only external services (exposable)
        var exposableServices = services.filter(function(svc) {
            return svc.external;
        });

        var view = E('div', { 'class': 'exposure-dashboard' }, [
            E('h2', {}, 'Service Exposure Manager'),
            E('p', { 'style': 'color: #8892b0; margin-bottom: 1.5rem;' },
                'Enable or disable exposure of local services via Tor Hidden Services (.onion) or SSL Web (HAProxy)'),

            // Stats bar
            E('div', { 'class': 'exposure-stats', 'style': 'display: flex; gap: 1rem; margin-bottom: 1.5rem;' }, [
                E('div', { 'class': 'stat-card', 'style': 'flex: 1; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 1rem; border-radius: 8px; border: 1px solid #333;' }, [
                    E('div', { 'style': 'font-size: 2rem; font-weight: bold; color: #64ffda;' }, String(exposableServices.length)),
                    E('div', { 'style': 'color: #8892b0; font-size: 0.875rem;' }, 'Exposable Services')
                ]),
                E('div', { 'class': 'stat-card', 'style': 'flex: 1; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 1rem; border-radius: 8px; border: 1px solid #9b59b6;' }, [
                    E('div', { 'style': 'font-size: 2rem; font-weight: bold; color: #9b59b6;' }, String(torServices.length)),
                    E('div', { 'style': 'color: #8892b0; font-size: 0.875rem;' }, 'Tor Hidden Services')
                ]),
                E('div', { 'class': 'stat-card', 'style': 'flex: 1; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 1rem; border-radius: 8px; border: 1px solid #27ae60;' }, [
                    E('div', { 'style': 'font-size: 2rem; font-weight: bold; color: #27ae60;' }, String(sslBackends.length)),
                    E('div', { 'style': 'color: #8892b0; font-size: 0.875rem;' }, 'SSL Backends')
                ])
            ]),

            // Main table
            E('div', { 'class': 'exposure-section' }, [
                E('div', { 'class': 'exposure-section-header' }, [
                    E('div', { 'class': 'exposure-section-title' }, [
                        E('span', { 'class': 'icon' }, '\ud83d\udd0c'),
                        'Service Exposure Control'
                    ]),
                    E('button', {
                        'class': 'btn-action btn-primary',
                        'click': function() { location.reload(); }
                    }, '\u21bb Refresh')
                ]),

                exposableServices.length > 0 ?
                    E('table', { 'class': 'exposure-table' }, [
                        E('thead', {}, [
                            E('tr', {}, [
                                E('th', { 'style': 'width: 60px;' }, 'Port'),
                                E('th', {}, 'Service'),
                                E('th', { 'style': 'width: 80px;' }, 'Process'),
                                E('th', { 'style': 'width: 120px; text-align: center;' }, [
                                    E('span', { 'style': 'color: #9b59b6;' }, '\ud83e\uddc5 Tor')
                                ]),
                                E('th', { 'style': 'width: 120px; text-align: center;' }, [
                                    E('span', { 'style': 'color: #27ae60;' }, '\ud83d\udd12 SSL')
                                ]),
                                E('th', { 'style': 'width: 200px;' }, 'Details')
                            ])
                        ]),
                        E('tbody', {},
                            exposableServices.map(function(svc) {
                                var serviceName = self.getServiceName(svc);
                                var torInfo = torByService[serviceName];
                                var sslInfo = sslByService[serviceName];
                                var isTorEnabled = !!torInfo;
                                var isSslEnabled = !!sslInfo;

                                return E('tr', { 'data-service': serviceName, 'data-port': svc.port }, [
                                    E('td', { 'style': 'font-weight: 600; font-family: monospace;' }, String(svc.port)),
                                    E('td', {}, [
                                        E('strong', {}, svc.name || svc.process),
                                        svc.name !== svc.process ? E('small', { 'style': 'color: #8892b0; display: block;' }, svc.process) : null
                                    ]),
                                    E('td', { 'style': 'font-family: monospace; font-size: 0.8rem; color: #8892b0;' }, svc.process),
                                    // Tor checkbox
                                    E('td', { 'style': 'text-align: center;' }, [
                                        E('label', { 'class': 'toggle-switch' }, [
                                            E('input', {
                                                'type': 'checkbox',
                                                'checked': isTorEnabled,
                                                'data-service': serviceName,
                                                'data-port': svc.port,
                                                'data-type': 'tor',
                                                'change': ui.createHandlerFn(self, 'handleToggleTor', svc, serviceName, isTorEnabled)
                                            }),
                                            E('span', { 'class': 'toggle-slider tor-slider' })
                                        ])
                                    ]),
                                    // SSL checkbox
                                    E('td', { 'style': 'text-align: center;' }, [
                                        E('label', { 'class': 'toggle-switch' }, [
                                            E('input', {
                                                'type': 'checkbox',
                                                'checked': isSslEnabled,
                                                'data-service': serviceName,
                                                'data-port': svc.port,
                                                'data-type': 'ssl',
                                                'change': ui.createHandlerFn(self, 'handleToggleSsl', svc, serviceName, isSslEnabled, sslInfo)
                                            }),
                                            E('span', { 'class': 'toggle-slider ssl-slider' })
                                        ])
                                    ]),
                                    // Details column
                                    E('td', { 'style': 'font-size: 0.8rem;' }, [
                                        torInfo ? E('div', { 'style': 'color: #9b59b6; margin-bottom: 2px;' }, [
                                            E('code', { 'style': 'font-size: 0.7rem;' }, (torInfo.onion || '').substring(0, 20) + '...')
                                        ]) : null,
                                        sslInfo ? E('div', { 'style': 'color: #27ae60;' }, [
                                            E('code', { 'style': 'font-size: 0.7rem;' }, sslInfo.domain || 'N/A')
                                        ]) : null,
                                        !torInfo && !sslInfo ? E('span', { 'style': 'color: #666;' }, 'Not exposed') : null
                                    ])
                                ]);
                            })
                        )
                    ]) :
                    E('div', { 'class': 'exposure-empty' }, [
                        E('div', { 'class': 'icon' }, '\ud83d\udd0c'),
                        E('p', {}, 'No exposable services detected'),
                        E('small', {}, 'Services bound to 0.0.0.0 or :: will appear here')
                    ]),

                // Toggle switch styles
                E('style', {}, `
                    .toggle-switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 26px;
                    }
                    .toggle-switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }
                    .toggle-slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #333;
                        transition: 0.3s;
                        border-radius: 26px;
                    }
                    .toggle-slider:before {
                        position: absolute;
                        content: "";
                        height: 20px;
                        width: 20px;
                        left: 3px;
                        bottom: 3px;
                        background-color: #666;
                        transition: 0.3s;
                        border-radius: 50%;
                    }
                    input:checked + .toggle-slider {
                        background-color: #1a1a2e;
                    }
                    input:checked + .toggle-slider:before {
                        transform: translateX(24px);
                    }
                    input:checked + .tor-slider {
                        background-color: rgba(155, 89, 182, 0.3);
                        border: 1px solid #9b59b6;
                    }
                    input:checked + .tor-slider:before {
                        background-color: #9b59b6;
                    }
                    input:checked + .ssl-slider {
                        background-color: rgba(39, 174, 96, 0.3);
                        border: 1px solid #27ae60;
                    }
                    input:checked + .ssl-slider:before {
                        background-color: #27ae60;
                    }
                    .toggle-slider:hover {
                        border: 1px solid #555;
                    }
                `)
            ])
        ]);

        return view;
    },

    getServiceName: function(svc) {
        var name = svc.name ? svc.name.toLowerCase().replace(/\s+/g, '') : svc.process;
        // Clean up common variations
        return name.replace(/[^a-z0-9]/g, '');
    },

    handleToggleTor: function(svc, serviceName, wasEnabled, ev) {
        var self = this;
        var checkbox = ev.target;
        var isNowChecked = checkbox.checked;

        if (isNowChecked && !wasEnabled) {
            // Enable Tor - show config dialog
            ui.showModal('Enable Tor Hidden Service', [
                E('p', {}, 'Create a .onion address for ' + (svc.name || svc.process)),
                E('div', { 'style': 'margin: 1rem 0;' }, [
                    E('div', { 'style': 'margin-bottom: 0.5rem;' }, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Service Name'),
                        E('input', {
                            'type': 'text',
                            'id': 'tor-svc-name',
                            'value': serviceName,
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ]),
                    E('div', { 'style': 'margin-bottom: 0.5rem;' }, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Local Port'),
                        E('input', {
                            'type': 'number',
                            'id': 'tor-local-port',
                            'value': svc.port,
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Onion Port (public)'),
                        E('input', {
                            'type': 'number',
                            'id': 'tor-onion-port',
                            'value': '80',
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ])
                ]),
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px;' }, [
                    E('button', {
                        'class': 'btn',
                        'click': function() {
                            checkbox.checked = false;
                            ui.hideModal();
                        }
                    }, 'Cancel'),
                    E('button', {
                        'class': 'btn cbi-button-action',
                        'click': function() {
                            var name = document.getElementById('tor-svc-name').value;
                            var localPort = parseInt(document.getElementById('tor-local-port').value);
                            var onionPort = parseInt(document.getElementById('tor-onion-port').value);

                            ui.hideModal();
                            ui.showModal('Creating Hidden Service...', [
                                E('p', { 'class': 'spinning' }, 'Generating .onion address...')
                            ]);

                            api.torAdd(name, localPort, onionPort).then(function(res) {
                                ui.hideModal();
                                if (res.success) {
                                    ui.addNotification(null, E('p', {}, [
                                        'Tor hidden service enabled: ',
                                        E('code', {}, res.onion || 'Created')
                                    ]), 'success');
                                    location.reload();
                                } else {
                                    checkbox.checked = false;
                                    ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
                                }
                            });
                        }
                    }, 'Enable Tor')
                ])
            ]);
        } else if (!isNowChecked && wasEnabled) {
            // Disable Tor
            ui.showModal('Disable Tor Hidden Service', [
                E('p', {}, 'Remove the .onion address for ' + serviceName + '?'),
                E('p', { 'style': 'color: #e74c3c;' }, 'Warning: The onion address will be permanently deleted.'),
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                    E('button', {
                        'class': 'btn',
                        'click': function() {
                            checkbox.checked = true;
                            ui.hideModal();
                        }
                    }, 'Cancel'),
                    E('button', {
                        'class': 'btn cbi-button-negative',
                        'click': function() {
                            ui.hideModal();
                            api.torRemove(serviceName).then(function(res) {
                                if (res.success) {
                                    ui.addNotification(null, E('p', {}, 'Tor hidden service disabled'), 'success');
                                    location.reload();
                                } else {
                                    checkbox.checked = true;
                                    ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
                                }
                            });
                        }
                    }, 'Disable Tor')
                ])
            ]);
        }
    },

    handleToggleSsl: function(svc, serviceName, wasEnabled, sslInfo, ev) {
        var self = this;
        var checkbox = ev.target;
        var isNowChecked = checkbox.checked;

        if (isNowChecked && !wasEnabled) {
            // Enable SSL - show config dialog
            ui.showModal('Enable SSL/HAProxy Backend', [
                E('p', {}, 'Configure HTTPS reverse proxy for ' + (svc.name || svc.process)),
                E('div', { 'style': 'margin: 1rem 0;' }, [
                    E('div', { 'style': 'margin-bottom: 0.5rem;' }, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Service Name'),
                        E('input', {
                            'type': 'text',
                            'id': 'ssl-svc-name',
                            'value': serviceName,
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ]),
                    E('div', { 'style': 'margin-bottom: 0.5rem;' }, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Domain (FQDN)'),
                        E('input', {
                            'type': 'text',
                            'id': 'ssl-domain',
                            'placeholder': serviceName + '.example.com',
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ]),
                    E('div', {}, [
                        E('label', { 'style': 'display: block; margin-bottom: 4px; color: #ccc;' }, 'Backend Port'),
                        E('input', {
                            'type': 'number',
                            'id': 'ssl-port',
                            'value': svc.port,
                            'style': 'width: 100%; padding: 8px; background: #1a1a2e; border: 1px solid #333; color: #fff; border-radius: 4px;'
                        })
                    ])
                ]),
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px;' }, [
                    E('button', {
                        'class': 'btn',
                        'click': function() {
                            checkbox.checked = false;
                            ui.hideModal();
                        }
                    }, 'Cancel'),
                    E('button', {
                        'class': 'btn cbi-button-action',
                        'click': function() {
                            var name = document.getElementById('ssl-svc-name').value;
                            var domain = document.getElementById('ssl-domain').value;
                            var port = parseInt(document.getElementById('ssl-port').value);

                            if (!domain) {
                                ui.addNotification(null, E('p', {}, 'Domain is required'), 'warning');
                                return;
                            }

                            ui.hideModal();
                            api.sslAdd(name, domain, port).then(function(res) {
                                if (res.success) {
                                    ui.addNotification(null, E('p', {}, 'SSL backend configured for ' + domain), 'success');
                                    location.reload();
                                } else {
                                    checkbox.checked = false;
                                    ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
                                }
                            });
                        }
                    }, 'Enable SSL')
                ])
            ]);
        } else if (!isNowChecked && wasEnabled) {
            // Disable SSL
            var domain = sslInfo ? sslInfo.domain : serviceName;
            ui.showModal('Disable SSL Backend', [
                E('p', {}, 'Remove HAProxy backend for ' + serviceName + '?'),
                sslInfo && sslInfo.domain ? E('p', { 'style': 'color: #8892b0;' }, 'Domain: ' + sslInfo.domain) : null,
                E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 1rem;' }, [
                    E('button', {
                        'class': 'btn',
                        'click': function() {
                            checkbox.checked = true;
                            ui.hideModal();
                        }
                    }, 'Cancel'),
                    E('button', {
                        'class': 'btn cbi-button-negative',
                        'click': function() {
                            ui.hideModal();
                            api.sslRemove(serviceName).then(function(res) {
                                if (res.success) {
                                    ui.addNotification(null, E('p', {}, 'SSL backend disabled'), 'success');
                                    location.reload();
                                } else {
                                    checkbox.checked = true;
                                    ui.addNotification(null, E('p', {}, 'Error: ' + (res.error || 'Unknown')), 'danger');
                                }
                            });
                        }
                    }, 'Disable SSL')
                ])
            ]);
        }
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
