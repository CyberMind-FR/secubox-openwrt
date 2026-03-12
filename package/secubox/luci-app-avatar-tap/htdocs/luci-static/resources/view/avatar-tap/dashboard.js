'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

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

    renderStats: function(stats) {
        var c = KissTheme.colors;
        return [
            KissTheme.stat(stats.total || 0, 'Total Sessions', c.blue),
            KissTheme.stat(stats.domains || 0, 'Domains', c.green),
            KissTheme.stat(stats.replays || 0, 'Replays', c.orange),
            KissTheme.stat(stats.recent || 0, 'Last Hour', c.red)
        ];
    },

    renderControls: function(status) {
        var self = this;
        return E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
            E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
                KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red'),
                E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'Port: ' + (status.port || '8888'))
            ]),
            E('div', { 'style': 'display: flex; gap: 8px;' }, [
                status.running
                    ? E('button', { 'class': 'kiss-btn kiss-btn-red', 'click': ui.createHandlerFn(this, 'handleStop') }, 'Stop')
                    : E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': ui.createHandlerFn(this, 'handleStart') }, 'Start')
            ])
        ]);
    },

    renderSessionsTable: function(sessions) {
        var self = this;

        if (sessions.length === 0) {
            return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
                'No sessions captured yet. Start the tap and browse through the proxy.');
        }

        return E('table', { 'class': 'kiss-table' }, [
            E('thead', {}, [
                E('tr', {}, [
                    E('th', {}, 'ID'),
                    E('th', {}, 'Domain'),
                    E('th', {}, 'Path'),
                    E('th', {}, 'Method'),
                    E('th', {}, 'Captured'),
                    E('th', {}, 'Label'),
                    E('th', {}, 'Uses'),
                    E('th', {}, 'Actions')
                ])
            ]),
            E('tbody', {}, sessions.map(function(s) {
                return E('tr', {}, [
                    E('td', {}, String(s.id)),
                    E('td', { 'style': 'font-family: monospace; font-size: 11px;' }, truncate(s.domain, 25)),
                    E('td', { 'style': 'font-family: monospace; font-size: 10px; color: var(--kiss-muted);' }, truncate(s.path, 30)),
                    E('td', {}, [KissTheme.badge(s.method || 'GET', s.method === 'POST' ? 'orange' : 'blue')]),
                    E('td', { 'style': 'font-size: 10px; color: var(--kiss-muted);' }, formatTimestamp(s.captured_at)),
                    E('td', {}, s.label || '-'),
                    E('td', { 'style': 'text-align: center;' }, String(s.use_count || 0)),
                    E('td', {}, [
                        E('div', { 'style': 'display: flex; gap: 4px;' }, [
                            E('button', {
                                'class': 'kiss-btn kiss-btn-green',
                                'style': 'padding: 2px 8px; font-size: 10px;',
                                'click': ui.createHandlerFn(self, 'handleReplay', s)
                            }, 'Replay'),
                            E('button', {
                                'class': 'kiss-btn',
                                'style': 'padding: 2px 8px; font-size: 10px;',
                                'click': ui.createHandlerFn(self, 'handleLabel', s)
                            }, 'Label'),
                            E('button', {
                                'class': 'kiss-btn kiss-btn-red',
                                'style': 'padding: 2px 8px; font-size: 10px;',
                                'click': ui.createHandlerFn(self, 'handleDelete', s)
                            }, 'Del')
                        ])
                    ])
                ]);
            }))
        ]);
    },

    renderQuickStart: function() {
        return E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
            E('ol', { 'style': 'margin: 0; padding-left: 20px; font-size: 12px; color: var(--kiss-muted);' }, [
                E('li', {}, 'Start the tap (default port 8888)'),
                E('li', {}, 'Configure your browser to use the proxy'),
                E('li', {}, 'Browse authenticated sites - sessions are captured automatically'),
                E('li', {}, 'Use "Replay" to re-authenticate with captured credentials')
            ]),
            E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, [
                'CLI: ',
                E('code', { 'style': 'background: var(--kiss-bg); padding: 2px 6px; border-radius: 4px;' }, 'avatar-tapctl list'),
                ' | ',
                E('code', { 'style': 'background: var(--kiss-bg); padding: 2px 6px; border-radius: 4px;' }, 'avatar-tapctl replay <id> <url>')
            ])
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var sessionsData = data[1] || {};
        var stats = data[2] || {};
        var sessions = sessionsData.sessions || [];

        var content = [
            // Header
            E('div', { 'style': 'margin-bottom: 24px;' }, [
                E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
                    E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Avatar Tap'),
                    KissTheme.badge(status.running ? 'RUNNING' : 'STOPPED', status.running ? 'green' : 'red')
                ]),
                E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Session Capture & Replay')
            ]),

            // Stats
            E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(stats)),

            // Two-column layout
            E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
                KissTheme.card('Controls', this.renderControls(status)),
                KissTheme.card('Quick Start', this.renderQuickStart())
            ]),

            // Sessions table
            KissTheme.card('Captured Sessions (' + sessions.length + ')', this.renderSessionsTable(sessions))
        ];

        return KissTheme.wrap(content, 'admin/services/avatar-tap/dashboard');
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
