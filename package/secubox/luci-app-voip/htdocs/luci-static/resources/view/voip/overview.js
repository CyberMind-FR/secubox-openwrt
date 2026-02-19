'use strict';
'require view';
'require ui';
'require poll';
'require voip.api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.getStatus(),
            api.getExtensions(),
            api.getCalls(),
            api.getTrunkStatus()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var extensions = data[1] || [];
        var calls = data[2] || [];
        var trunk = data[3] || {};

        var statusClass = status.running ? 'success' : 'danger';
        var statusText = status.running ? 'Running' : 'Stopped';
        var trunkClass = trunk.registered ? 'success' : 'warning';
        var trunkText = trunk.registered ? 'Registered' : 'Not Registered';

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'VoIP PBX'),
            
            // Status cards
            E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 20px; flex-wrap: wrap;' }, [
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Container Status'),
                    E('span', { 'class': 'label ' + statusClass, 'style': 'font-size: 1.2em; padding: 5px 15px;' }, statusText)
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'SIP Trunk'),
                    E('span', { 'class': 'label ' + trunkClass, 'style': 'font-size: 1.2em; padding: 5px 15px;' }, trunkText)
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Extensions'),
                    E('span', { 'style': 'font-size: 2em; font-weight: bold;' }, String(status.extensions || 0))
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Active Calls'),
                    E('span', { 'style': 'font-size: 2em; font-weight: bold;' }, String(status.active_calls || 0))
                ])
            ]),

            // Control buttons
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Container Control'),
                E('div', { 'class': 'cbi-value' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-positive',
                        'click': ui.createHandlerFn(this, 'handleStart'),
                        'disabled': status.running
                    }, 'Start'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button cbi-button-negative',
                        'click': ui.createHandlerFn(this, 'handleStop'),
                        'disabled': !status.running
                    }, 'Stop'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': ui.createHandlerFn(this, 'handleRestart')
                    }, 'Restart'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button',
                        'click': ui.createHandlerFn(this, 'handleReload'),
                        'disabled': !status.running
                    }, 'Reload Config')
                ])
            ]),

            // Active calls
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Active Calls'),
                this.renderCallsTable(calls)
            ]),

            // Extensions summary
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Extensions'),
                this.renderExtensionsTable(extensions)
            ])
        ]);

        poll.add(L.bind(this.pollStatus, this), 5);

        return view;
    },

    renderCallsTable: function(calls) {
        if (!calls || calls.length === 0) {
            return E('p', { 'class': 'cbi-value-description' }, 'No active calls');
        }

        return E('table', { 'class': 'table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Channel'),
                E('th', { 'class': 'th' }, 'State'),
                E('th', { 'class': 'th' }, 'Caller'),
                E('th', { 'class': 'th' }, 'Connected'),
                E('th', { 'class': 'th' }, 'Duration'),
                E('th', { 'class': 'th' }, 'Actions')
            ])
        ].concat(calls.map(function(call) {
            return E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, call.channel),
                E('td', { 'class': 'td' }, call.state),
                E('td', { 'class': 'td' }, call.caller),
                E('td', { 'class': 'td' }, call.connected),
                E('td', { 'class': 'td' }, call.duration),
                E('td', { 'class': 'td' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-remove',
                        'click': ui.createHandlerFn(this, 'handleHangup', call.channel)
                    }, 'Hangup')
                ])
            ]);
        }, this)));
    },

    renderExtensionsTable: function(extensions) {
        if (!extensions || extensions.length === 0) {
            return E('p', { 'class': 'cbi-value-description' }, 'No extensions configured');
        }

        return E('table', { 'class': 'table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Number'),
                E('th', { 'class': 'th' }, 'Name'),
                E('th', { 'class': 'th' }, 'Context'),
                E('th', { 'class': 'th' }, 'Voicemail')
            ])
        ].concat(extensions.map(function(ext) {
            return E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, ext.number),
                E('td', { 'class': 'td' }, ext.name),
                E('td', { 'class': 'td' }, ext.context),
                E('td', { 'class': 'td' }, ext.voicemail ? 'Yes' : 'No')
            ]);
        })));
    },

    pollStatus: function() {
        return api.getStatus().then(L.bind(function(status) {
            // Update status indicators
        }, this));
    },

    handleStart: function() {
        return api.start().then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', 'VoIP started successfully'), 'success');
            } else {
                ui.addNotification(null, E('p', 'Failed to start: ' + res.output), 'error');
            }
            window.location.reload();
        });
    },

    handleStop: function() {
        return api.stop().then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', 'VoIP stopped'), 'success');
            }
            window.location.reload();
        });
    },

    handleRestart: function() {
        ui.showModal('Restarting...', [E('p', 'Please wait...')]);
        return api.restart().then(function(res) {
            ui.hideModal();
            window.location.reload();
        });
    },

    handleReload: function() {
        return api.reload().then(function(res) {
            if (res.success) {
                ui.addNotification(null, E('p', 'Configuration reloaded'), 'success');
            }
        });
    },

    handleHangup: function(channel) {
        return api.hangupCall(channel).then(function(res) {
            ui.addNotification(null, E('p', 'Call terminated'), 'success');
            window.location.reload();
        });
    }
});
