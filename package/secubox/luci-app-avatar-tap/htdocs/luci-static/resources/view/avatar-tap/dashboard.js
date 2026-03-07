'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'status',
    expect: {}
});

var callGetSessions = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'get_sessions',
    params: ['domain', 'limit'],
    expect: {}
});

var callStats = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'stats',
    expect: {}
});

var callStart = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'start',
    expect: {}
});

var callStop = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'stop',
    expect: {}
});

var callReplay = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'replay',
    params: ['id', 'url', 'method'],
    expect: {}
});

var callLabel = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'label',
    params: ['id', 'label'],
    expect: {}
});

var callDelete = rpc.declare({
    object: 'luci.avatar-tap',
    method: 'delete',
    params: ['id'],
    expect: {}
});

function formatTimestamp(ts) {
    if (!ts) return '-';
    var d = new Date(ts * 1000);
    return d.toLocaleString();
}

function truncate(str, len) {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

return view.extend({
    handleStart: function() {
        return callStart().then(function() {
            ui.addNotification(null, E('p', 'Avatar Tap started'), 'success');
            window.location.reload();
        }).catch(function(e) {
            ui.addNotification(null, E('p', 'Failed to start: ' + e.message), 'error');
        });
    },

    handleStop: function() {
        return callStop().then(function() {
            ui.addNotification(null, E('p', 'Avatar Tap stopped'), 'info');
            window.location.reload();
        }).catch(function(e) {
            ui.addNotification(null, E('p', 'Failed to stop: ' + e.message), 'error');
        });
    },

    handleReplay: function(session) {
        var self = this;
        var url = prompt('Enter target URL for replay:', 'https://' + session.domain + (session.path || '/'));
        if (!url) return;

        return callReplay(session.id, url, null).then(function(result) {
            ui.addNotification(null, E('p', ['Replay result: Status ', result.status_code || 'unknown']),
                result.status_code >= 200 && result.status_code < 400 ? 'success' : 'warning');
        }).catch(function(e) {
            ui.addNotification(null, E('p', 'Replay failed: ' + e.message), 'error');
        });
    },

    handleLabel: function(session) {
        var label = prompt('Enter label for session:', session.label || '');
        if (label === null) return;

        return callLabel(session.id, label).then(function() {
            ui.addNotification(null, E('p', 'Session labeled'), 'success');
            window.location.reload();
        });
    },

    handleDelete: function(session) {
        if (!confirm('Delete session #' + session.id + ' for ' + session.domain + '?')) return;

        return callDelete(session.id).then(function() {
            ui.addNotification(null, E('p', 'Session deleted'), 'info');
            window.location.reload();
        });
    },

    load: function() {
        return Promise.all([
            callStatus(),
            callGetSessions(null, 50),
            callStats()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var sessionsData = data[1] || {};
        var stats = data[2] || {};
        var sessions = sessionsData.sessions || [];
        var self = this;

        var statusStyle = status.running
            ? 'background:#2e7d32;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;'
            : 'background:#c62828;color:white;padding:4px 12px;border-radius:4px;font-weight:bold;';

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Avatar Tap - Session Capture & Replay'),

            // Status Card
            E('div', { 'style': 'background:#1a1a2e;color:#eee;padding:20px;border-radius:8px;margin-bottom:20px;' }, [
                E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;' }, [
                    E('div', {}, [
                        E('span', { 'style': statusStyle }, status.running ? 'RUNNING' : 'STOPPED'),
                        E('span', { 'style': 'margin-left:15px;' }, 'Port: ' + (status.port || '8888'))
                    ]),
                    E('div', { 'style': 'display:flex;gap:10px;' }, [
                        status.running
                            ? E('button', { 'class': 'cbi-button cbi-button-negative', 'click': ui.createHandlerFn(this, 'handleStop') }, 'Stop')
                            : E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.createHandlerFn(this, 'handleStart') }, 'Start')
                    ])
                ]),

                // Stats Row
                E('div', { 'style': 'display:flex;gap:40px;margin-top:20px;flex-wrap:wrap;' }, [
                    E('div', {}, [
                        E('div', { 'style': 'font-size:24px;font-weight:bold;color:#4fc3f7;' }, String(stats.total || 0)),
                        E('div', { 'style': 'font-size:12px;color:#888;' }, 'Total Sessions')
                    ]),
                    E('div', {}, [
                        E('div', { 'style': 'font-size:24px;font-weight:bold;color:#81c784;' }, String(stats.domains || 0)),
                        E('div', { 'style': 'font-size:12px;color:#888;' }, 'Domains')
                    ]),
                    E('div', {}, [
                        E('div', { 'style': 'font-size:24px;font-weight:bold;color:#ffb74d;' }, String(stats.replays || 0)),
                        E('div', { 'style': 'font-size:12px;color:#888;' }, 'Replays')
                    ]),
                    E('div', {}, [
                        E('div', { 'style': 'font-size:24px;font-weight:bold;color:#e57373;' }, String(stats.recent || 0)),
                        E('div', { 'style': 'font-size:12px;color:#888;' }, 'Last Hour')
                    ])
                ])
            ]),

            // Sessions Table
            E('h3', { 'style': 'margin-top:30px;' }, 'Captured Sessions'),
            E('div', { 'class': 'table-wrapper' }, [
                E('table', { 'class': 'table', 'style': 'width:100%;' }, [
                    E('thead', {}, [
                        E('tr', { 'class': 'tr table-titles' }, [
                            E('th', { 'class': 'th' }, 'ID'),
                            E('th', { 'class': 'th' }, 'Domain'),
                            E('th', { 'class': 'th' }, 'Path'),
                            E('th', { 'class': 'th' }, 'Method'),
                            E('th', { 'class': 'th' }, 'Captured'),
                            E('th', { 'class': 'th' }, 'Label'),
                            E('th', { 'class': 'th' }, 'Uses'),
                            E('th', { 'class': 'th' }, 'Actions')
                        ])
                    ]),
                    E('tbody', {}, sessions.length > 0
                        ? sessions.map(function(s) {
                            return E('tr', { 'class': 'tr' }, [
                                E('td', { 'class': 'td' }, String(s.id)),
                                E('td', { 'class': 'td', 'style': 'font-family:monospace;' }, truncate(s.domain, 25)),
                                E('td', { 'class': 'td', 'style': 'font-family:monospace;font-size:11px;' }, truncate(s.path, 30)),
                                E('td', { 'class': 'td' }, s.method || 'GET'),
                                E('td', { 'class': 'td', 'style': 'font-size:11px;' }, formatTimestamp(s.captured_at)),
                                E('td', { 'class': 'td' }, s.label || '-'),
                                E('td', { 'class': 'td', 'style': 'text-align:center;' }, String(s.use_count || 0)),
                                E('td', { 'class': 'td' }, [
                                    E('button', {
                                        'class': 'cbi-button cbi-button-action',
                                        'style': 'padding:2px 8px;margin:1px;',
                                        'title': 'Replay session',
                                        'click': ui.createHandlerFn(self, 'handleReplay', s)
                                    }, 'Replay'),
                                    E('button', {
                                        'class': 'cbi-button',
                                        'style': 'padding:2px 8px;margin:1px;',
                                        'title': 'Label session',
                                        'click': ui.createHandlerFn(self, 'handleLabel', s)
                                    }, 'Label'),
                                    E('button', {
                                        'class': 'cbi-button cbi-button-negative',
                                        'style': 'padding:2px 8px;margin:1px;',
                                        'title': 'Delete session',
                                        'click': ui.createHandlerFn(self, 'handleDelete', s)
                                    }, 'Del')
                                ])
                            ]);
                        })
                        : [E('tr', { 'class': 'tr' }, [
                            E('td', { 'class': 'td', 'colspan': '8', 'style': 'text-align:center;padding:20px;color:#888;' },
                              'No sessions captured yet. Start the tap and browse through the proxy.')
                        ])]
                    )
                ])
            ]),

            // Help Section
            E('div', { 'style': 'margin-top:30px;padding:15px;background:#f5f5f5;border-radius:8px;' }, [
                E('h4', { 'style': 'margin-top:0;' }, 'Quick Start'),
                E('ol', { 'style': 'margin:0;padding-left:20px;' }, [
                    E('li', {}, 'Start the tap (default port 8888)'),
                    E('li', {}, 'Configure your browser to use the proxy'),
                    E('li', {}, 'Browse authenticated sites - sessions are captured automatically'),
                    E('li', {}, 'Use "Replay" to re-authenticate with captured credentials')
                ]),
                E('p', { 'style': 'margin-top:15px;margin-bottom:0;font-size:12px;color:#666;' }, [
                    'CLI: ', E('code', {}, 'avatar-tapctl list'), ' | ',
                    E('code', {}, 'avatar-tapctl replay <id> <url>')
                ])
            ])
        ]);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
