'use strict';
'require view';
'require ui';
'require voip.api as api';

return view.extend({
    load: function() {
        return Promise.all([
            api.getRecordingStatus(),
            api.listRecordings('')
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var recordings = data[1] || [];

        var enabledClass = status.enabled ? 'success' : 'warning';
        var enabledText = status.enabled ? 'Enabled' : 'Disabled';

        var view = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, 'Call Recordings'),

            // Status cards
            E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 20px; flex-wrap: wrap;' }, [
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Recording Status'),
                    E('span', { 'class': 'label ' + enabledClass, 'style': 'font-size: 1.2em; padding: 5px 15px;' }, enabledText)
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Total Recordings'),
                    E('span', { 'style': 'font-size: 2em; font-weight: bold;' }, String(status.total_recordings || 0))
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Today'),
                    E('span', { 'style': 'font-size: 2em; font-weight: bold;' }, String(status.today_recordings || 0))
                ]),
                E('div', { 'class': 'cbi-value', 'style': 'flex: 1; min-width: 200px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;' }, [
                    E('h3', {}, 'Storage Used'),
                    E('span', { 'style': 'font-size: 1.5em; font-weight: bold;' }, String(status.total_size || '0'))
                ])
            ]),

            // Control buttons
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Recording Control'),
                E('div', { 'class': 'cbi-value' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-positive',
                        'click': ui.createHandlerFn(this, 'handleEnable'),
                        'disabled': status.enabled
                    }, 'Enable Recording'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button cbi-button-negative',
                        'click': ui.createHandlerFn(this, 'handleDisable'),
                        'disabled': !status.enabled
                    }, 'Disable Recording'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': ui.createHandlerFn(this, 'handleCleanup')
                    }, 'Cleanup Old Recordings')
                ])
            ]),

            // Settings info
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Settings'),
                E('table', { 'class': 'table' }, [
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, 'Format'),
                        E('td', { 'class': 'td' }, status.format || 'wav')
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, 'Retention'),
                        E('td', { 'class': 'td' }, (status.retention_days || 30) + ' days')
                    ]),
                    E('tr', { 'class': 'tr' }, [
                        E('td', { 'class': 'td', 'style': 'font-weight: bold;' }, 'Storage Path'),
                        E('td', { 'class': 'td' }, status.path || '/srv/voip/recordings')
                    ])
                ])
            ]),

            // Recordings list
            E('div', { 'class': 'cbi-section' }, [
                E('h3', {}, 'Recent Recordings'),
                E('div', { 'class': 'cbi-value', 'style': 'margin-bottom: 10px;' }, [
                    E('label', {}, 'Filter by date: '),
                    E('input', {
                        'type': 'date',
                        'id': 'date-filter',
                        'change': ui.createHandlerFn(this, 'handleDateFilter')
                    }),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button',
                        'click': ui.createHandlerFn(this, 'handleRefresh')
                    }, 'Refresh')
                ]),
                E('div', { 'id': 'recordings-table' }, [
                    this.renderRecordingsTable(recordings)
                ])
            ]),

            // Audio player
            E('div', { 'class': 'cbi-section', 'id': 'audio-player-section', 'style': 'display: none;' }, [
                E('h3', {}, 'Audio Player'),
                E('audio', {
                    'id': 'audio-player',
                    'controls': true,
                    'style': 'width: 100%;'
                }),
                E('p', { 'id': 'audio-filename', 'style': 'margin-top: 5px; font-style: italic;' }, '')
            ])
        ]);

        return view;
    },

    renderRecordingsTable: function(recordings) {
        if (!recordings || !Array.isArray(recordings) || recordings.length === 0) {
            return E('p', { 'class': 'cbi-value-description' }, 'No recordings found');
        }

        return E('table', { 'class': 'table' }, [
            E('tr', { 'class': 'tr table-titles' }, [
                E('th', { 'class': 'th' }, 'Date'),
                E('th', { 'class': 'th' }, 'Time'),
                E('th', { 'class': 'th' }, 'Caller'),
                E('th', { 'class': 'th' }, 'Destination'),
                E('th', { 'class': 'th' }, 'Size'),
                E('th', { 'class': 'th' }, 'Actions')
            ])
        ].concat(recordings.map(function(rec) {
            var sizeKB = Math.round((rec.size || 0) / 1024);
            var sizeMB = (sizeKB / 1024).toFixed(2);
            var sizeStr = sizeKB > 1024 ? sizeMB + ' MB' : sizeKB + ' KB';

            return E('tr', { 'class': 'tr' }, [
                E('td', { 'class': 'td' }, rec.date || '-'),
                E('td', { 'class': 'td' }, rec.time || '-'),
                E('td', { 'class': 'td' }, rec.caller || '-'),
                E('td', { 'class': 'td' }, rec.destination || '-'),
                E('td', { 'class': 'td' }, sizeStr),
                E('td', { 'class': 'td' }, [
                    E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': ui.createHandlerFn(this, 'handlePlay', rec.filename),
                        'title': 'Play'
                    }, '▶'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button',
                        'click': ui.createHandlerFn(this, 'handleDownload', rec.filename),
                        'title': 'Download'
                    }, '↓'),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button cbi-button-remove',
                        'click': ui.createHandlerFn(this, 'handleDelete', rec.filename),
                        'title': 'Delete'
                    }, '✕')
                ])
            ]);
        }, this)));
    },

    handleEnable: function() {
        ui.showModal('Enabling...', [E('p', 'Enabling call recording...')]);
        return api.enableRecording().then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', 'Call recording enabled'), 'success');
            } else {
                ui.addNotification(null, E('p', 'Failed: ' + res.output), 'error');
            }
            window.location.reload();
        });
    },

    handleDisable: function() {
        return ui.showModal('Confirm', [
            E('p', 'Are you sure you want to disable call recording?'),
            E('div', { 'class': 'right' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                ' ',
                E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': L.bind(function() {
                        ui.hideModal();
                        return api.disableRecording().then(function(res) {
                            ui.addNotification(null, E('p', 'Call recording disabled'), 'success');
                            window.location.reload();
                        });
                    }, this)
                }, 'Disable')
            ])
        ]);
    },

    handleCleanup: function() {
        var days = prompt('Delete recordings older than how many days?', '30');
        if (!days) return;

        ui.showModal('Cleaning up...', [E('p', 'Deleting old recordings...')]);
        return api.cleanupRecordings(parseInt(days)).then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', res.output), 'success');
            } else {
                ui.addNotification(null, E('p', 'Cleanup failed: ' + res.output), 'error');
            }
            window.location.reload();
        });
    },

    handleDateFilter: function(ev) {
        var dateInput = ev.target.value;
        if (!dateInput) return;

        var date = dateInput.replace(/-/g, '');
        var container = document.getElementById('recordings-table');

        container.innerHTML = '<p>Loading...</p>';

        api.listRecordings(date).then(L.bind(function(recordings) {
            container.innerHTML = '';
            container.appendChild(this.renderRecordingsTable(recordings));
        }, this));
    },

    handleRefresh: function() {
        var dateInput = document.getElementById('date-filter');
        var date = dateInput ? dateInput.value.replace(/-/g, '') : '';
        var container = document.getElementById('recordings-table');

        container.innerHTML = '<p>Loading...</p>';

        api.listRecordings(date).then(L.bind(function(recordings) {
            container.innerHTML = '';
            container.appendChild(this.renderRecordingsTable(recordings));
        }, this));
    },

    handlePlay: function(filename) {
        var playerSection = document.getElementById('audio-player-section');
        var player = document.getElementById('audio-player');
        var filenameEl = document.getElementById('audio-filename');

        playerSection.style.display = 'none';
        filenameEl.textContent = 'Loading ' + filename + '...';

        api.downloadRecording(filename).then(function(res) {
            if (res.success && res.content) {
                // Create a data URL from base64 content
                var dataUrl = 'data:audio/wav;base64,' + res.content;
                player.src = dataUrl;
                filenameEl.textContent = filename;
                playerSection.style.display = 'block';
                player.play();
            } else if (res.success && res.path) {
                // File too large for base64, show path
                filenameEl.textContent = 'File: ' + res.path + ' (too large to play in browser)';
                playerSection.style.display = 'block';
            } else {
                ui.addNotification(null, E('p', 'Failed to load recording: ' + (res.error || 'Unknown error')), 'error');
            }
        });
    },

    handleDownload: function(filename) {
        api.downloadRecording(filename).then(function(res) {
            if (res.success && res.content) {
                // Create download link from base64
                var link = document.createElement('a');
                link.href = 'data:audio/wav;base64,' + res.content;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (res.success && res.path) {
                ui.addNotification(null, E('p', 'Recording path: ' + res.path), 'info');
            } else {
                ui.addNotification(null, E('p', 'Failed to download: ' + (res.error || 'Unknown error')), 'error');
            }
        });
    },

    handleDelete: function(filename) {
        return ui.showModal('Confirm Delete', [
            E('p', 'Delete recording: ' + filename + '?'),
            E('div', { 'class': 'right' }, [
                E('button', {
                    'class': 'btn',
                    'click': ui.hideModal
                }, 'Cancel'),
                ' ',
                E('button', {
                    'class': 'btn cbi-button-negative',
                    'click': L.bind(function() {
                        ui.hideModal();
                        return api.deleteRecording(filename).then(function(res) {
                            if (res.success) {
                                ui.addNotification(null, E('p', 'Recording deleted'), 'success');
                                window.location.reload();
                            } else {
                                ui.addNotification(null, E('p', 'Failed to delete: ' + res.output), 'error');
                            }
                        });
                    }, this)
                }, 'Delete')
            ])
        ]);
    }
});
