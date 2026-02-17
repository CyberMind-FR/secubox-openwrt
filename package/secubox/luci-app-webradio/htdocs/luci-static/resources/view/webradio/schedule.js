'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';

var callSchedules = rpc.declare({
	object: 'luci.webradio',
	method: 'schedules',
	expect: {}
});

var callCurrentShow = rpc.declare({
	object: 'luci.webradio',
	method: 'current_show',
	expect: {}
});

var callAddSchedule = rpc.declare({
	object: 'luci.webradio',
	method: 'add_schedule',
	params: ['name', 'start_time', 'end_time', 'days', 'playlist', 'jingle_before'],
	expect: {}
});

var callUpdateSchedule = rpc.declare({
	object: 'luci.webradio',
	method: 'update_schedule',
	params: ['slot', 'enabled', 'name', 'start_time', 'end_time', 'days', 'playlist', 'jingle_before'],
	expect: {}
});

var callDeleteSchedule = rpc.declare({
	object: 'luci.webradio',
	method: 'delete_schedule',
	params: ['slot'],
	expect: {}
});

var callGenerateCron = rpc.declare({
	object: 'luci.webradio',
	method: 'generate_cron',
	expect: {}
});

var DAYS = {
	'0': 'Sun',
	'1': 'Mon',
	'2': 'Tue',
	'3': 'Wed',
	'4': 'Thu',
	'5': 'Fri',
	'6': 'Sat'
};

function formatDays(days) {
	if (!days) return 'Every day';
	if (days === '0123456') return 'Every day';
	if (days === '12345') return 'Weekdays';
	if (days === '06') return 'Weekends';

	return days.split('').map(function(d) {
		return DAYS[d] || d;
	}).join(', ');
}

return view.extend({
	load: function() {
		return Promise.all([
			callSchedules(),
			callCurrentShow(),
			uci.load('webradio')
		]);
	},

	render: function(data) {
		var self = this;
		var scheduleData = data[0] || {};
		var currentShow = data[1] || {};
		var schedules = scheduleData.schedules || [];

		var content = [
			E('h2', {}, 'Programming Schedule'),

			// Current show info
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Now Playing'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Show'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('span', { 'style': 'font-weight: bold; font-size: 1.1em;' },
							currentShow.name || 'Default')
					])
				]),
				currentShow.playlist ? E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Playlist'),
					E('div', { 'class': 'cbi-value-field' }, currentShow.playlist)
				]) : '',
				currentShow.start ? E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Started'),
					E('div', { 'class': 'cbi-value-field' }, currentShow.start)
				]) : ''
			]),

			// Scheduling settings
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Scheduling Settings'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Enable Scheduling'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'checkbox',
							'id': 'scheduling-enabled',
							'checked': scheduleData.scheduling_enabled
						}),
						E('span', { 'style': 'margin-left: 10px;' },
							'Automatically switch shows based on schedule')
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Timezone'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'timezone', 'class': 'cbi-input-select' }, [
							E('option', { 'value': 'UTC', 'selected': scheduleData.timezone === 'UTC' }, 'UTC'),
							E('option', { 'value': 'Europe/Paris', 'selected': scheduleData.timezone === 'Europe/Paris' }, 'Europe/Paris'),
							E('option', { 'value': 'Europe/London', 'selected': scheduleData.timezone === 'Europe/London' }, 'Europe/London'),
							E('option', { 'value': 'America/New_York', 'selected': scheduleData.timezone === 'America/New_York' }, 'America/New_York'),
							E('option', { 'value': 'America/Los_Angeles', 'selected': scheduleData.timezone === 'America/Los_Angeles' }, 'America/Los_Angeles'),
							E('option', { 'value': 'Asia/Tokyo', 'selected': scheduleData.timezone === 'Asia/Tokyo' }, 'Asia/Tokyo')
						])
					])
				]),
				E('div', { 'style': 'display: flex; gap: 10px; margin-top: 10px;' }, [
					E('button', {
						'class': 'btn cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleSaveSettings')
					}, 'Save Settings'),
					E('button', {
						'class': 'btn cbi-button-neutral',
						'click': ui.createHandlerFn(this, 'handleGenerateCron')
					}, 'Regenerate Cron')
				])
			]),

			// Add new schedule
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Add New Schedule'),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Show Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'new-name',
							'class': 'cbi-input-text',
							'placeholder': 'Morning Show',
							'style': 'width: 250px;'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Start Time'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'time',
							'id': 'new-start',
							'class': 'cbi-input-text'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'End Time'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'time',
							'id': 'new-end',
							'class': 'cbi-input-text'
						})
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Days'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('div', { 'style': 'display: flex; gap: 10px; flex-wrap: wrap;' },
							Object.keys(DAYS).map(function(d) {
								return E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
									E('input', {
										'type': 'checkbox',
										'class': 'day-checkbox',
										'data-day': d,
										'checked': true
									}),
									DAYS[d]
								]);
							})
						)
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Playlist'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', {
							'type': 'text',
							'id': 'new-playlist',
							'class': 'cbi-input-text',
							'placeholder': 'morning_mix',
							'style': 'width: 200px;'
						}),
						E('p', { 'style': 'color: #666; font-size: 0.9em;' },
							'Playlist name (without .m3u extension)')
					])
				]),
				E('button', {
					'class': 'btn cbi-button-positive',
					'style': 'margin-top: 10px;',
					'click': ui.createHandlerFn(this, 'handleAddSchedule')
				}, 'Add Schedule')
			]),

			// Schedule list
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Scheduled Shows (' + schedules.length + ')'),
				this.renderScheduleTable(schedules)
			])
		];

		return E('div', { 'class': 'cbi-map' }, content);
	},

	renderScheduleTable: function(schedules) {
		if (!schedules || schedules.length === 0) {
			return E('p', { 'style': 'color: #666;' },
				'No schedules configured. Add a schedule above to create a programming grid.');
		}

		var self = this;
		var rows = schedules.map(function(sched) {
			var statusStyle = sched.enabled
				? 'background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px;'
				: 'background: #9e9e9e; color: white; padding: 2px 8px; border-radius: 3px;';

			return E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td', 'style': 'width: 30px;' }, [
					E('input', {
						'type': 'checkbox',
						'checked': sched.enabled,
						'data-slot': sched.slot,
						'change': function(ev) {
							self.handleToggleEnabled(sched.slot, ev.target.checked);
						}
					})
				]),
				E('div', { 'class': 'td', 'style': 'font-weight: bold;' }, sched.name),
				E('div', { 'class': 'td' }, sched.start_time + ' - ' + (sched.end_time || '...')),
				E('div', { 'class': 'td' }, formatDays(sched.days)),
				E('div', { 'class': 'td' }, sched.playlist || '-'),
				E('div', { 'class': 'td' }, sched.jingle_before || '-'),
				E('div', { 'class': 'td', 'style': 'width: 80px;' }, [
					E('button', {
						'class': 'btn cbi-button-remove',
						'style': 'padding: 2px 8px;',
						'click': ui.createHandlerFn(self, 'handleDelete', sched.slot)
					}, 'Delete')
				])
			]);
		});

		return E('div', { 'class': 'table' }, [
			E('div', { 'class': 'tr cbi-section-table-titles' }, [
				E('div', { 'class': 'th' }, 'On'),
				E('div', { 'class': 'th' }, 'Name'),
				E('div', { 'class': 'th' }, 'Time'),
				E('div', { 'class': 'th' }, 'Days'),
				E('div', { 'class': 'th' }, 'Playlist'),
				E('div', { 'class': 'th' }, 'Jingle'),
				E('div', { 'class': 'th' }, 'Action')
			])
		].concat(rows));
	},

	handleSaveSettings: function() {
		var enabled = document.getElementById('scheduling-enabled').checked;
		var timezone = document.getElementById('timezone').value;

		uci.set('webradio', 'scheduling', 'scheduling');
		uci.set('webradio', 'scheduling', 'enabled', enabled ? '1' : '0');
		uci.set('webradio', 'scheduling', 'timezone', timezone);

		return uci.save().then(function() {
			return uci.apply();
		}).then(function() {
			if (enabled) {
				return callGenerateCron();
			}
		}).then(function() {
			ui.addNotification(null, E('p', 'Settings saved'));
		});
	},

	handleGenerateCron: function() {
		ui.showModal('Generating Cron', [
			E('p', { 'class': 'spinning' }, 'Generating cron schedule...')
		]);

		return callGenerateCron().then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Cron schedule regenerated'));
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleAddSchedule: function() {
		var name = document.getElementById('new-name').value;
		var start_time = document.getElementById('new-start').value;
		var end_time = document.getElementById('new-end').value;
		var playlist = document.getElementById('new-playlist').value;

		if (!name || !start_time) {
			ui.addNotification(null, E('p', 'Name and start time are required'), 'warning');
			return;
		}

		// Collect selected days
		var days = '';
		document.querySelectorAll('.day-checkbox:checked').forEach(function(cb) {
			days += cb.dataset.day;
		});

		ui.showModal('Adding Schedule', [
			E('p', { 'class': 'spinning' }, 'Creating schedule...')
		]);

		return callAddSchedule(name, start_time, end_time, days, playlist, '').then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Schedule added: ' + name));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleToggleEnabled: function(slot, enabled) {
		return callUpdateSchedule(slot, enabled, null, null, null, null, null, null).then(function(res) {
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Schedule ' + (enabled ? 'enabled' : 'disabled')));
			}
		});
	},

	handleDelete: function(slot) {
		if (!confirm('Delete this schedule?')) return;

		ui.showModal('Deleting', [
			E('p', { 'class': 'spinning' }, 'Removing schedule...')
		]);

		return callDeleteSchedule(slot).then(function(res) {
			ui.hideModal();
			if (res.result === 'ok') {
				ui.addNotification(null, E('p', 'Schedule deleted'));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
