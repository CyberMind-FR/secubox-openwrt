'use strict';
'require view';
'require ui';
'require voip.api as api';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		return Promise.all([
			api.getRecordingStatus(),
			api.listRecordings('')
		]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.enabled ? 'ON' : 'OFF', 'Recording', status.enabled ? c.green : c.red),
			KissTheme.stat(status.total_recordings || 0, 'Total', c.blue),
			KissTheme.stat(status.today_recordings || 0, 'Today', c.purple),
			KissTheme.stat(status.total_size || '0', 'Storage', c.orange)
		];
	},

	renderSettings: function(status) {
		var items = [
			{ label: 'Format', value: status.format || 'wav' },
			{ label: 'Retention', value: (status.retention_days || 30) + ' days' },
			{ label: 'Storage Path', value: status.path || '/srv/voip/recordings' }
		];

		return E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			items.map(function(item) {
				return E('div', { 'style': 'display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kiss-line);' }, [
					E('span', { 'style': 'color: var(--kiss-muted);' }, item.label),
					E('span', { 'style': 'font-family: monospace;' }, item.value)
				]);
			})
		);
	},

	renderRecordingsTable: function(recordings) {
		if (!recordings || !Array.isArray(recordings) || recordings.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
				'No recordings found');
		}

		var self = this;
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Date'),
					E('th', {}, 'Time'),
					E('th', {}, 'Caller'),
					E('th', {}, 'Destination'),
					E('th', {}, 'Size'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {},
				recordings.map(function(rec) {
					var sizeKB = Math.round((rec.size || 0) / 1024);
					var sizeMB = (sizeKB / 1024).toFixed(2);
					var sizeStr = sizeKB > 1024 ? sizeMB + ' MB' : sizeKB + ' KB';

					return E('tr', {}, [
						E('td', {}, rec.date || '-'),
						E('td', {}, rec.time || '-'),
						E('td', { 'style': 'font-family: monospace;' }, rec.caller || '-'),
						E('td', { 'style': 'font-family: monospace;' }, rec.destination || '-'),
						E('td', {}, sizeStr),
						E('td', {}, [
							E('div', { 'style': 'display: flex; gap: 6px;' }, [
								E('button', {
									'class': 'kiss-btn kiss-btn-blue',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': ui.createHandlerFn(self, 'handlePlay', rec.filename),
									'title': 'Play'
								}, '▶'),
								E('button', {
									'class': 'kiss-btn',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': ui.createHandlerFn(self, 'handleDownload', rec.filename),
									'title': 'Download'
								}, '↓'),
								E('button', {
									'class': 'kiss-btn kiss-btn-red',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': ui.createHandlerFn(self, 'handleDelete', rec.filename),
									'title': 'Delete'
								}, '✕')
							])
						])
					]);
				})
			)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var recordings = data[1] || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Call Recordings'),
					KissTheme.badge(status.enabled ? 'RECORDING' : 'DISABLED', status.enabled ? 'green' : 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Manage and playback call recordings')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(status)),

			// Controls
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': ui.createHandlerFn(this, 'handleEnable'),
					'disabled': status.enabled
				}, 'Enable Recording'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': ui.createHandlerFn(this, 'handleDisable'),
					'disabled': !status.enabled
				}, 'Disable Recording'),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': ui.createHandlerFn(this, 'handleCleanup')
				}, 'Cleanup Old')
			]),

			// Two-column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2' }, [
				KissTheme.card('Settings', this.renderSettings(status)),
				KissTheme.card('Audio Player',
					E('div', { 'id': 'audio-player-section' }, [
						E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'Select a recording to play'),
						E('audio', {
							'id': 'audio-player',
							'controls': true,
							'style': 'width: 100%; display: none;'
						}),
						E('p', { 'id': 'audio-filename', 'style': 'margin-top: 8px; font-style: italic; font-size: 12px; color: var(--kiss-muted); display: none;' }, '')
					])
				)
			]),

			// Recordings list with filter
			KissTheme.card('Recent Recordings',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Filter by date:'),
						E('input', {
							'type': 'date',
							'id': 'date-filter',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;',
							'change': ui.createHandlerFn(this, 'handleDateFilter')
						}),
						E('button', {
							'class': 'kiss-btn',
							'click': ui.createHandlerFn(this, 'handleRefresh')
						}, 'Refresh')
					]),
					E('div', { 'id': 'recordings-table' }, [
						this.renderRecordingsTable(recordings)
					])
				])
			)
		];

		return KissTheme.wrap(content, 'admin/services/voip/recordings');
	},

	handleEnable: function() {
		ui.showModal('Enabling...', [E('p', { 'class': 'spinning' }, 'Enabling call recording...')]);
		return api.enableRecording().then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', 'Call recording enabled'));
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + res.output));
			}
			window.location.reload();
		});
	},

	handleDisable: function() {
		ui.showModal('Confirm', [
			E('p', {}, 'Are you sure you want to disable call recording?'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': L.bind(function() {
						ui.hideModal();
						return api.disableRecording().then(function(res) {
							ui.addNotification(null, E('p', 'Call recording disabled'));
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

		ui.showModal('Cleaning up...', [E('p', { 'class': 'spinning' }, 'Deleting old recordings...')]);
		return api.cleanupRecordings(parseInt(days)).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', res.output));
			} else {
				ui.addNotification(null, E('p', 'Cleanup failed: ' + res.output));
			}
			window.location.reload();
		});
	},

	handleDateFilter: function(ev) {
		var dateInput = ev.target.value;
		if (!dateInput) return;

		var date = dateInput.replace(/-/g, '');
		var container = document.getElementById('recordings-table');

		container.innerHTML = '<p style="color: var(--kiss-muted);" class="spinning">Loading...</p>';

		api.listRecordings(date).then(L.bind(function(recordings) {
			container.innerHTML = '';
			container.appendChild(this.renderRecordingsTable(recordings));
		}, this));
	},

	handleRefresh: function() {
		var dateInput = document.getElementById('date-filter');
		var date = dateInput ? dateInput.value.replace(/-/g, '') : '';
		var container = document.getElementById('recordings-table');

		container.innerHTML = '<p style="color: var(--kiss-muted);" class="spinning">Loading...</p>';

		api.listRecordings(date).then(L.bind(function(recordings) {
			container.innerHTML = '';
			container.appendChild(this.renderRecordingsTable(recordings));
		}, this));
	},

	handlePlay: function(filename) {
		var player = document.getElementById('audio-player');
		var filenameEl = document.getElementById('audio-filename');
		var placeholder = player.previousElementSibling;

		filenameEl.textContent = 'Loading ' + filename + '...';
		filenameEl.style.display = 'block';

		api.downloadRecording(filename).then(function(res) {
			if (res.success && res.content) {
				var dataUrl = 'data:audio/wav;base64,' + res.content;
				player.src = dataUrl;
				player.style.display = 'block';
				if (placeholder) placeholder.style.display = 'none';
				filenameEl.textContent = filename;
				player.play();
			} else if (res.success && res.path) {
				filenameEl.textContent = 'File: ' + res.path + ' (too large to play in browser)';
			} else {
				ui.addNotification(null, E('p', 'Failed to load recording: ' + (res.error || 'Unknown error')));
			}
		});
	},

	handleDownload: function(filename) {
		api.downloadRecording(filename).then(function(res) {
			if (res.success && res.content) {
				var link = document.createElement('a');
				link.href = 'data:audio/wav;base64,' + res.content;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} else if (res.success && res.path) {
				ui.addNotification(null, E('p', 'Recording path: ' + res.path));
			} else {
				ui.addNotification(null, E('p', 'Failed to download: ' + (res.error || 'Unknown error')));
			}
		});
	},

	handleDelete: function(filename) {
		ui.showModal('Confirm Delete', [
			E('p', {}, 'Delete recording: ' + filename + '?'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': L.bind(function() {
						ui.hideModal();
						return api.deleteRecording(filename).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', 'Recording deleted'));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', 'Failed to delete: ' + res.output));
							}
						});
					}, this)
				}, 'Delete')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
