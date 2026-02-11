'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
    object: 'luci.mirrornet',
    method: 'status',
    expect: {}
});

var callGetIdentity = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_identity',
    expect: {}
});

var callGetPeers = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_peers',
    expect: {}
});

var callGetReputationList = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_reputation_list',
    expect: {}
});

var callGetHealth = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_health',
    expect: {}
});

var callGetMirrors = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_mirrors',
    expect: {}
});

var callGetGossipStats = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_gossip_stats',
    expect: {}
});

var callGetAlerts = rpc.declare({
    object: 'luci.mirrornet',
    method: 'get_alerts',
    params: ['count'],
    expect: {}
});

var callRunHealthCheck = rpc.declare({
    object: 'luci.mirrornet',
    method: 'run_health_check',
    expect: {}
});

var callResetReputation = rpc.declare({
    object: 'luci.mirrornet',
    method: 'reset_reputation',
    params: ['peer_id'],
    expect: {}
});

var callAckAlert = rpc.declare({
    object: 'luci.mirrornet',
    method: 'ack_alert',
    params: ['alert_id'],
    expect: {}
});

function getTrustColor(level) {
    switch (level) {
        case 'excellent': return '#22c55e';
        case 'good': return '#84cc16';
        case 'moderate': return '#eab308';
        case 'low': return '#f97316';
        case 'untrusted': return '#ef4444';
        default: return '#6b7280';
    }
}

function getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#eab308';
    if (score >= 20) return '#f97316';
    return '#ef4444';
}

function formatTimestamp(ts) {
    if (!ts) return '-';
    var d = new Date(ts * 1000);
    return d.toLocaleString();
}

return view.extend({
    load: function() {
        return Promise.all([
            callStatus(),
            callGetIdentity(),
            callGetPeers(),
            callGetReputationList(),
            callGetHealth(),
            callGetMirrors(),
            callGetGossipStats(),
            callGetAlerts(20)
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var identity = data[1] || {};
        var peers = data[2] || [];
        var reputations = data[3] || {};
        var health = data[4] || {};
        var mirrors = data[5] || {};
        var gossipStats = data[6] || {};
        var alerts = data[7] || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'MirrorNet Dashboard'),
            E('div', { 'class': 'cbi-map-descr' },
                'Mesh orchestration, peer reputation, and service mirroring')
        ]);

        // Identity Card
        var identityCard = E('div', {
            'class': 'cbi-section',
            'style': 'background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;'
        }, [
            E('h3', { 'style': 'margin-top: 0; color: white;' }, 'Node Identity'),
            E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;' }, [
                E('div', {}, [
                    E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, 'DID'),
                    E('div', { 'style': 'font-family: monospace; font-size: 14px; word-break: break-all;' },
                        identity.did || status.did || 'Not configured')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, 'Hostname'),
                    E('div', { 'style': 'font-size: 16px; font-weight: bold;' }, identity.hostname || '-')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, 'Role'),
                    E('div', { 'style': 'font-size: 16px; font-weight: bold; text-transform: uppercase;' },
                        status.node_role || 'peer')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, 'Version'),
                    E('div', { 'style': 'font-size: 16px;' }, status.version || identity.version || '-')
                ])
            ])
        ]);
        view.appendChild(identityCard);

        // Status Grid
        var statusGrid = E('div', {
            'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;'
        }, [
            E('div', { 'class': 'cbi-section', 'style': 'text-align: center; padding: 15px;' }, [
                E('div', { 'style': 'font-size: 32px; font-weight: bold; color: #3b82f6;' },
                    String(status.peers || 0)),
                E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Connected Peers')
            ]),
            E('div', { 'class': 'cbi-section', 'style': 'text-align: center; padding: 15px;' }, [
                E('div', { 'style': 'font-size: 32px; font-weight: bold; color: #22c55e;' },
                    String((gossipStats.sent || 0) + (gossipStats.received || 0))),
                E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Gossip Messages')
            ]),
            E('div', { 'class': 'cbi-section', 'style': 'text-align: center; padding: 15px;' }, [
                E('div', { 'style': 'font-size: 32px; font-weight: bold; color: #8b5cf6;' },
                    String((mirrors.services || []).length)),
                E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Mirrored Services')
            ]),
            E('div', { 'class': 'cbi-section', 'style': 'text-align: center; padding: 15px;' }, [
                E('div', { 'style': 'font-size: 32px; font-weight: bold; color: #f59e0b;' },
                    String(health.unacknowledged_alerts || 0)),
                E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Health Alerts')
            ])
        ]);
        view.appendChild(statusGrid);

        // Peer Reputation Section
        var peerSection = E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Peer Reputation'),
            E('div', { 'style': 'overflow-x: auto;' })
        ]);

        var peerList = Array.isArray(peers) ? peers : [];
        if (peerList.length > 0) {
            var peerTable = E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
                E('thead', {}, [
                    E('tr', {}, [
                        E('th', {}, 'Peer'),
                        E('th', {}, 'DID'),
                        E('th', {}, 'Score'),
                        E('th', {}, 'Trust Level'),
                        E('th', {}, 'Actions')
                    ])
                ]),
                E('tbody', {})
            ]);

            peerList.forEach(function(peer) {
                var peerId = peer.did ? peer.did.replace('did:plc:', '') : 'unknown';
                var rep = reputations[peerId] || { score: 50 };
                var score = rep.score || 50;
                var trustLevel = score >= 80 ? 'excellent' :
                                 score >= 60 ? 'good' :
                                 score >= 40 ? 'moderate' :
                                 score >= 20 ? 'low' : 'untrusted';

                var row = E('tr', {}, [
                    E('td', {}, [
                        E('strong', {}, peer.hostname || 'Unknown'),
                        E('br'),
                        E('small', { 'style': 'color: #6b7280;' }, peer.endpoints?.p2p || '-')
                    ]),
                    E('td', { 'style': 'font-family: monospace; font-size: 12px;' },
                        (peer.did || '').substring(0, 24) + '...'),
                    E('td', {}, [
                        E('span', {
                            'style': 'display: inline-block; padding: 2px 8px; border-radius: 4px; background: ' +
                                     getScoreColor(score) + '20; color: ' + getScoreColor(score) + '; font-weight: bold;'
                        }, String(score))
                    ]),
                    E('td', {}, [
                        E('span', {
                            'style': 'display: inline-block; padding: 2px 8px; border-radius: 4px; background: ' +
                                     getTrustColor(trustLevel) + '20; color: ' + getTrustColor(trustLevel) + ';'
                        }, trustLevel)
                    ]),
                    E('td', {}, [
                        E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'style': 'padding: 4px 8px; font-size: 12px;',
                            'click': ui.createHandlerFn(this, function(pid) {
                                return callResetReputation(pid).then(function() {
                                    ui.addNotification(null, E('p', {}, 'Reputation reset for ' + pid));
                                    location.reload();
                                });
                            }, peerId)
                        }, 'Reset')
                    ])
                ]);
                peerTable.querySelector('tbody').appendChild(row);
            });

            peerSection.querySelector('div').appendChild(peerTable);
        } else {
            peerSection.querySelector('div').appendChild(
                E('p', { 'style': 'color: #6b7280; text-align: center; padding: 20px;' },
                    'No peers discovered yet')
            );
        }
        view.appendChild(peerSection);

        // Gossip Stats Section
        var gossipSection = E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Gossip Protocol'),
            E('div', {
                'style': 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;'
            }, [
                E('div', {}, [
                    E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #3b82f6;' },
                        String(gossipStats.sent || 0)),
                    E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Sent')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #22c55e;' },
                        String(gossipStats.received || 0)),
                    E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Received')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #8b5cf6;' },
                        String(gossipStats.forwarded || 0)),
                    E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Forwarded')
                ]),
                E('div', {}, [
                    E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #ef4444;' },
                        String(gossipStats.dropped || 0)),
                    E('div', { 'style': 'font-size: 12px; color: #6b7280;' }, 'Dropped (Dedup)')
                ])
            ])
        ]);
        view.appendChild(gossipSection);

        // Health Alerts Section
        var alertSection = E('div', { 'class': 'cbi-section' }, [
            E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
                E('h3', { 'style': 'margin: 0;' }, 'Health Alerts'),
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'click': ui.createHandlerFn(this, function() {
                        return callRunHealthCheck().then(function(result) {
                            ui.addNotification(null, E('p', {}, 'Health check completed'));
                            location.reload();
                        });
                    })
                }, 'Run Health Check')
            ]),
            E('div', { 'style': 'margin-top: 15px;' })
        ]);

        var alertList = Array.isArray(alerts) ? alerts : [];
        if (alertList.length > 0) {
            var alertTable = E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
                E('thead', {}, [
                    E('tr', {}, [
                        E('th', {}, 'Time'),
                        E('th', {}, 'Peer'),
                        E('th', {}, 'Type'),
                        E('th', {}, 'Message'),
                        E('th', {}, 'Actions')
                    ])
                ]),
                E('tbody', {})
            ]);

            alertList.slice(0, 10).forEach(function(alert) {
                var row = E('tr', { 'style': alert.acknowledged ? 'opacity: 0.5;' : '' }, [
                    E('td', { 'style': 'font-size: 12px;' }, formatTimestamp(alert.timestamp)),
                    E('td', {}, alert.peer_id || '-'),
                    E('td', {}, [
                        E('span', {
                            'class': 'badge',
                            'style': 'background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-size: 11px;'
                        }, alert.type || 'unknown')
                    ]),
                    E('td', {}, alert.message || '-'),
                    E('td', {}, [
                        !alert.acknowledged ? E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'style': 'padding: 2px 8px; font-size: 11px;',
                            'click': ui.createHandlerFn(this, function(id) {
                                return callAckAlert(id).then(function() {
                                    location.reload();
                                });
                            }, alert.id)
                        }, 'Ack') : E('span', { 'style': 'color: #6b7280;' }, 'Acked')
                    ])
                ]);
                alertTable.querySelector('tbody').appendChild(row);
            });

            alertSection.lastChild.appendChild(alertTable);
        } else {
            alertSection.lastChild.appendChild(
                E('p', { 'style': 'color: #22c55e; text-align: center; padding: 20px;' },
                    'No health alerts')
            );
        }
        view.appendChild(alertSection);

        // Mirror Services Section
        var mirrorSection = E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, 'Mirrored Services'),
            E('div', {})
        ]);

        var services = (mirrors.services || []);
        if (services.length > 0) {
            var mirrorTable = E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
                E('thead', {}, [
                    E('tr', {}, [
                        E('th', {}, 'Service'),
                        E('th', {}, 'Port'),
                        E('th', {}, 'Upstreams'),
                        E('th', {}, 'Status')
                    ])
                ]),
                E('tbody', {})
            ]);

            services.forEach(function(svc) {
                var row = E('tr', {}, [
                    E('td', {}, [
                        E('strong', {}, svc.name || 'Unknown'),
                        svc.description ? E('small', { 'style': 'display: block; color: #6b7280;' }, svc.description) : ''
                    ]),
                    E('td', {}, String(svc.port || '-')),
                    E('td', {}, String((svc.mirrors || []).length)),
                    E('td', {}, [
                        E('span', {
                            'style': 'display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-right: 5px;'
                        }),
                        'Active'
                    ])
                ]);
                mirrorTable.querySelector('tbody').appendChild(row);
            });

            mirrorSection.lastChild.appendChild(mirrorTable);
        } else {
            mirrorSection.lastChild.appendChild(
                E('p', { 'style': 'color: #6b7280; text-align: center; padding: 20px;' },
                    'No services configured for mirroring')
            );
        }
        view.appendChild(mirrorSection);

        // Enable polling for real-time updates
        poll.add(L.bind(function() {
            return callGetGossipStats().then(function(stats) {
                // Update gossip stats in UI (simplified)
            });
        }, this), 30);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
