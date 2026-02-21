'use strict';
'require view';
'require ui';
'require uci';
'require voip.api as api';

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('voip'),
            api.getExtensions(),
            api.getCalls()
        ]);
    },

    render: function(data) {
        var extensions = data[1] || [];
        var calls = data[2] || [];

        var extOptions = extensions.map(function(ext) {
            return E('option', { 'value': ext.number }, ext.number + ' - ' + ext.name);
        });

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Click to Call'),
            E('p', { 'class': 'cbi-map-descr' },
                'Make calls by selecting your extension and entering the destination number. ' +
                'Your phone will ring first, then connect to the destination.'),

            E('div', { 'class': 'cbi-section' }, [
                E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, 'Your Extension'),
                    E('div', { 'class': 'cbi-value-field' }, [
                        E('select', { 'id': 'from-ext', 'class': 'cbi-input-select' }, extOptions)
                    ])
                ]),
                E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, 'Destination Number'),
                    E('div', { 'class': 'cbi-value-field' }, [
                        E('input', {
                            'type': 'tel',
                            'id': 'to-number',
                            'class': 'cbi-input-text',
                            'placeholder': '+33612345678',
                            'style': 'font-size: 1.5em; padding: 10px;'
                        })
                    ])
                ]),
                E('div', { 'class': 'cbi-value' }, [
                    E('div', { 'class': 'cbi-value-field' }, [
                        E('button', {
                            'class': 'btn cbi-button cbi-button-positive',
                            'style': 'font-size: 1.2em; padding: 15px 40px;',
                            'click': ui.createHandlerFn(this, 'handleCall')
                        }, 'Call')
                    ])
                ])
            ]),

            // Dialpad
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Dialpad'),
                E('div', { 'id': 'dialpad', 'style': 'display: grid; grid-template-columns: repeat(3, 80px); gap: 10px; justify-content: center;' },
                    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(function(digit) {
                        return E('button', {
                            'class': 'btn',
                            'style': 'font-size: 1.5em; padding: 20px;',
                            'click': function() {
                                var input = document.getElementById('to-number');
                                input.value += digit;
                            }
                        }, digit);
                    })
                ),
                E('div', { 'style': 'text-align: center; margin-top: 10px;' }, [
                    E('button', {
                        'class': 'btn cbi-button',
                        'click': function() {
                            var input = document.getElementById('to-number');
                            input.value = input.value.slice(0, -1);
                        }
                    }, 'Backspace'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button',
                        'click': function() {
                            document.getElementById('to-number').value = '';
                        }
                    }, 'Clear')
                ])
            ]),

            // Active calls
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Active Calls'),
                this.renderCallsTable(calls)
            ])
        ]);

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

    handleCall: function() {
        var fromExt = document.getElementById('from-ext').value;
        var toNumber = document.getElementById('to-number').value;

        if (!fromExt) {
            ui.addNotification(null, E('p', 'Please select your extension'), 'error');
            return;
        }

        if (!toNumber) {
            ui.addNotification(null, E('p', 'Please enter a destination number'), 'error');
            return;
        }

        ui.showModal('Calling...', [
            E('p', {}, 'Connecting ' + fromExt + ' to ' + toNumber + '...'),
            E('p', {}, 'Your phone will ring first.')
        ]);

        return api.originateCall(fromExt, toNumber).then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', 'Call initiated'), 'success');
            } else {
                ui.addNotification(null, E('p', 'Call failed: ' + res.output), 'error');
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
