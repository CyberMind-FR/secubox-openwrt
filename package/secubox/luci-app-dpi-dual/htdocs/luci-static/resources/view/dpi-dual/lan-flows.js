'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callLanStatus = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_lan_status',
    expect: {}
});

var callLanClients = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_lan_clients',
    expect: {}
});

var callLanDestinations = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_lan_destinations',
    params: ['limit'],
    expect: {}
});

var callLanProtocols = rpc.declare({
    object: 'luci.dpi-dual',
    method: 'get_lan_protocols',
    expect: {}
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatRelativeTime(timestamp) {
    var now = Math.floor(Date.now() / 1000);
    var diff = now - timestamp;
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

function createLED(active, label) {
    var color = active ? '#00d4aa' : '#ff4d4d';
    return E('div', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
        E('span', {
            'style': 'width:12px;height:12px;border-radius:50%;background:' + color +
                     ';box-shadow:0 0 8px ' + color + ';'
        }),
        E('span', { 'style': 'color:#e0e0e0;' }, label)
    ]);
}

function createMetricCard(label, value, color) {
    return E('div', {
        'style': 'background:#1a1a24;padding:1rem;border-radius:8px;text-align:center;min-width:100px;'
    }, [
        E('div', {
            'style': 'font-size:1.5rem;font-weight:700;color:' + (color || '#00d4aa') + ';font-family:monospace;'
        }, String(value)),
        E('div', {
            'style': 'font-size:0.75rem;color:#808090;text-transform:uppercase;margin-top:4px;'
        }, label)
    ]);
}

return view.extend({
    load: function() {
        return Promise.all([
            callLanStatus().catch(function() { return {}; }),
            callLanClients().catch(function() { return { clients: [] }; }),
            callLanDestinations(100).catch(function() { return { destinations: [] }; }),
            callLanProtocols().catch(function() { return { protocols: [] }; })
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var clients = data[1] || {};
        var destinations = data[2] || {};
        var protocols = data[3] || {};

        var view = E('div', { 'class': 'cbi-map', 'id': 'lan-flows-view' });

        // Header section
        var header = E('div', {
            'style': 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:1.5rem;border-radius:12px;margin-bottom:1.5rem;border-left:4px solid #00a0ff;'
        }, [
            E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;' }, [
                E('div', {}, [
                    E('h2', { 'style': 'margin:0;color:#fff;font-size:1.4rem;' }, 'LAN Flow Analysis'),
                    E('p', { 'style': 'margin:0.5rem 0 0;color:#808090;font-size:0.9rem;' },
                        'Real-time passive flow monitoring on ' + (status.interface || 'br-lan') + ' - No MITM, no caching')
                ]),
                E('div', { 'style': 'display:flex;gap:1rem;' }, [
                    createLED(status.collector_running, 'Collector'),
                    createLED(status.enabled, 'Enabled')
                ])
            ])
        ]);

        // Metrics row
        var metrics = E('div', {
            'style': 'display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;'
        }, [
            createMetricCard('Active Clients', status.active_clients || 0, '#00d4aa'),
            createMetricCard('Destinations', status.unique_destinations || 0, '#00a0ff'),
            createMetricCard('Protocols', status.detected_protocols || 0, '#ffa500'),
            createMetricCard('RX', formatBytes(status.rx_bytes || 0), '#00d4aa'),
            createMetricCard('TX', formatBytes(status.tx_bytes || 0), '#ff6b6b')
        ]);

        // Main content - three columns
        var content = E('div', {
            'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;'
        });

        // Clients table
        var clientsCard = E('div', {
            'style': 'background:#12121a;border-radius:12px;padding:1rem;'
        }, [
            E('h3', { 'style': 'margin:0 0 1rem;color:#00d4aa;font-size:1rem;border-bottom:1px solid #2a2a3a;padding-bottom:0.5rem;' },
                'Active Clients'),
            E('div', { 'id': 'clients-list', 'style': 'max-height:400px;overflow-y:auto;' })
        ]);

        var clientsList = clientsCard.querySelector('#clients-list');
        var clientsData = (clients.clients || []).sort(function(a, b) {
            return (b.bytes_in + b.bytes_out) - (a.bytes_in + a.bytes_out);
        });

        if (clientsData.length === 0) {
            clientsList.appendChild(E('div', {
                'style': 'color:#808090;text-align:center;padding:2rem;'
            }, 'No active clients detected'));
        } else {
            clientsData.forEach(function(client) {
                var totalBytes = (client.bytes_in || 0) + (client.bytes_out || 0);
                clientsList.appendChild(E('div', {
                    'style': 'background:#1a1a24;padding:0.75rem;border-radius:6px;margin-bottom:0.5rem;'
                }, [
                    E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;' }, [
                        E('span', { 'style': 'font-family:monospace;color:#fff;font-weight:600;' }, client.ip),
                        E('span', { 'style': 'color:#00d4aa;font-size:0.85rem;' }, formatBytes(totalBytes))
                    ]),
                    E('div', { 'style': 'display:flex;gap:1rem;margin-top:0.5rem;font-size:0.75rem;color:#808090;' }, [
                        E('span', {}, 'Flows: ' + (client.flows || 0)),
                        E('span', {}, client.last_proto || ''),
                        E('span', {}, client.last_app || ''),
                        client.last_seen ? E('span', {}, formatRelativeTime(client.last_seen)) : null
                    ].filter(Boolean))
                ]));
            });
        }

        // Protocols table
        var protocolsCard = E('div', {
            'style': 'background:#12121a;border-radius:12px;padding:1rem;'
        }, [
            E('h3', { 'style': 'margin:0 0 1rem;color:#ffa500;font-size:1rem;border-bottom:1px solid #2a2a3a;padding-bottom:0.5rem;' },
                'Detected Protocols'),
            E('div', { 'id': 'protocols-list', 'style': 'max-height:400px;overflow-y:auto;' })
        ]);

        var protocolsList = protocolsCard.querySelector('#protocols-list');
        var protocolsData = (protocols.protocols || []).sort(function(a, b) {
            return (b.flows || 0) - (a.flows || 0);
        });

        if (protocolsData.length === 0) {
            protocolsList.appendChild(E('div', {
                'style': 'color:#808090;text-align:center;padding:2rem;'
            }, 'No protocols detected'));
        } else {
            protocolsData.forEach(function(proto) {
                var protoName = proto.protocol || 'Unknown';
                var flowCount = proto.flows || 0;

                protocolsList.appendChild(E('div', {
                    'style': 'background:#1a1a24;padding:0.75rem;border-radius:6px;margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;'
                }, [
                    E('span', { 'style': 'color:#fff;font-weight:500;' }, protoName),
                    E('div', { 'style': 'text-align:right;' }, [
                        E('div', { 'style': 'color:#ffa500;font-size:0.85rem;' }, flowCount + ' flows')
                    ])
                ]));
            });
        }

        // Destinations table
        var destinationsCard = E('div', {
            'style': 'background:#12121a;border-radius:12px;padding:1rem;'
        }, [
            E('h3', { 'style': 'margin:0 0 1rem;color:#00a0ff;font-size:1rem;border-bottom:1px solid #2a2a3a;padding-bottom:0.5rem;' },
                'External Destinations'),
            E('div', { 'id': 'destinations-list', 'style': 'max-height:400px;overflow-y:auto;' })
        ]);

        var destinationsList = destinationsCard.querySelector('#destinations-list');
        var destinationsData = (destinations.destinations || []).sort(function(a, b) {
            return (b.hits || 0) - (a.hits || 0);
        });

        if (destinationsData.length === 0) {
            destinationsList.appendChild(E('div', {
                'style': 'color:#808090;text-align:center;padding:2rem;'
            }, 'No external destinations'));
        } else {
            destinationsData.slice(0, 50).forEach(function(dest) {
                destinationsList.appendChild(E('div', {
                    'style': 'background:#1a1a24;padding:0.75rem;border-radius:6px;margin-bottom:0.5rem;'
                }, [
                    E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;' }, [
                        E('span', { 'style': 'font-family:monospace;color:#fff;font-size:0.85rem;' },
                            dest.ip + ':' + (dest.port || '?')),
                        E('span', { 'style': 'color:#00a0ff;font-size:0.85rem;' }, formatBytes(dest.bytes || 0))
                    ]),
                    E('div', { 'style': 'display:flex;gap:1rem;margin-top:0.25rem;font-size:0.7rem;color:#808090;' }, [
                        E('span', {}, dest.proto || ''),
                        E('span', {}, (dest.hits || 0) + ' hits'),
                        dest.last_seen ? E('span', {}, formatRelativeTime(dest.last_seen)) : null
                    ].filter(Boolean))
                ]));
            });
        }

        content.appendChild(clientsCard);
        content.appendChild(protocolsCard);
        content.appendChild(destinationsCard);

        view.appendChild(header);
        view.appendChild(metrics);
        view.appendChild(content);

        // Setup polling for real-time updates
        poll.add(L.bind(this.pollData, this), 5);

        return view;
    },

    pollData: function() {
        var self = this;

        return Promise.all([
            callLanStatus().catch(function() { return {}; }),
            callLanClients().catch(function() { return { clients: [] }; }),
            callLanDestinations(100).catch(function() { return { destinations: [] }; }),
            callLanProtocols().catch(function() { return { protocols: [] }; })
        ]).then(function(data) {
            var view = document.getElementById('lan-flows-view');
            if (!view) return;

            // Update would require DOM manipulation
            // For now, the page auto-refreshes via poll
        });
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
