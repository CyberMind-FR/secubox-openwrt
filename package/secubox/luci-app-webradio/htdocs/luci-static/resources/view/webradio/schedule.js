'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require uci';
'require secubox/kiss-theme';

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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callSchedules(),
			callCurrentShow(),
			uci.load('webradio')
		]);
	},

	renderStats: function(scheduleCount, currentShow, schedulingEnabled) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(currentShow.name || 'Default', 'Now Playing', c.green),
			KissTheme.stat(scheduleCount, 'Schedules', c.blue),
			KissTheme.stat(schedulingEnabled ? 'On' : 'Off', 'Auto-Switch', schedulingEnabled ? c.purple : c.muted)
		];
	},

	renderScheduleTable: function(schedules) {
		if (!schedules || schedules.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' },
				'No schedules configured. Add a schedule above to create a programming grid.');
		}

		var self = this;
		var rows = schedules.map(function(sched) {
			return E('tr', {}, [
				E('td', { 'style': 'width: 40px;' }, [
					E('input', {
						'type': 'checkbox',
						'checked': sched.enabled,
						'data-slot': sched.slot,
						'change': function(ev) {
							self.handleToggleEnabled(sched.slot, ev.target.checked);
						}
					})
				]),
				E('td', { 'style': 'font-weight: 600;' }, sched.name),
				E('td', {}, sched.start_time + ' - ' + (sched.end_time || '...')),
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatDays(sched.days)),
				E('td', {}, sched.playlist || '-'),
				E('td', { 'style': 'color: var(--kiss-muted);' }, sched.jingle_before || '-'),
				E('td', { 'style': 'width: 80px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(self, 'handleDelete', sched.slot)
					}, 'Delete')
				])
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'On'),
					E('th', {}, 'Name'),
					E('th', {}, 'Time'),
					E('th', {}, 'Days'),
					E('th', {}, 'Playlist'),
					E('th', {}, 'Jingle'),
					E('th', {}, 'Action')
				])
			]),
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var scheduleData = data[0] || {};
		var currentShow = data[1] || {};
		var schedules = scheduleData.schedules || [];
		var schedulingEnabled = scheduleData.scheduling_enabled;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Programming Schedule'),
					KissTheme.badge(schedules.length + ' Shows', 'cyan')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Schedule automated show changes and playlist rotations')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(schedules.length, currentShow, schedulingEnabled)),

			// Current show info
			KissTheme.card('Now Playing',
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
					E('div', {}, [
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Show'),
						E('div', { 'style': 'font-weight: 600; font-size: 16px;' }, currentShow.name || 'Default')
					]),
					currentShow.playlist ? E('div', {}, [
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Playlist'),
						E('div', {}, currentShow.playlist)
					]) : '',
					currentShow.start ? E('div', {}, [
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 4px;' }, 'Started'),
						E('div', {}, currentShow.start)
					]) : ''
				])
			),

			// Scheduling settings
			KissTheme.card('Scheduling Settings',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
							E('input', {
								'type': 'checkbox',
								'id': 'scheduling-enabled',
								'checked': schedulingEnabled
							}),
							E('span', {}, 'Automatically switch shows based on schedule')
						])
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Timezone'),
						E('select', {
							'id': 'timezone',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px; max-width: 250px;'
						}, [
							E('option', { 'value': 'UTC', 'selected': scheduleData.timezone === 'UTC' }, 'UTC'),
							E('option', { 'value': 'Europe/Paris', 'selected': scheduleData.timezone === 'Europe/Paris' }, 'Europe/Paris'),
							E('option', { 'value': 'Europe/London', 'selected': scheduleData.timezone === 'Europe/London' }, 'Europe/London'),
							E('option', { 'value': 'America/New_York', 'selected': scheduleData.timezone === 'America/New_York' }, 'America/New_York'),
							E('option', { 'value': 'America/Los_Angeles', 'selected': scheduleData.timezone === 'America/Los_Angeles' }, 'America/Los_Angeles'),
							E('option', { 'value': 'Asia/Tokyo', 'selected': scheduleData.timezone === 'Asia/Tokyo' }, 'Asia/Tokyo')
						])
					]),
					E('div', { 'style': 'display: flex; gap: 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': ui.createHandlerFn(this, 'handleSaveSettings')
						}, 'Save Settings'),
						E('button', {
							'class': 'kiss-btn',
							'click': ui.createHandlerFn(this, 'handleGenerateCron')
						}, 'Regenerate Cron')
					])
				])
			),

			// Add new schedule
			KissTheme.card('Add New Schedule',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Show Name'),
							E('input', {
								'type': 'text',
								'id': 'new-name',
								'placeholder': 'Morning Show',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Start Time'),
							E('input', {
								'type': 'time',
								'id': 'new-start',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'End Time'),
							E('input', {
								'type': 'time',
								'id': 'new-end',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Playlist'),
							E('input', {
								'type': 'text',
								'id': 'new-playlist',
								'placeholder': 'morning_mix',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						])
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Days'),
						E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' },
							Object.keys(DAYS).map(function(d) {
								return E('label', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
									E('input', {
										'type': 'checkbox',
										'class': 'day-checkbox',
										'data-day': d,
										'checked': true
									}),
									E('span', { 'style': 'font-size: 13px;' }, DAYS[d])
								]);
							})
						)
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'align-self: flex-start;',
						'click': ui.createHandlerFn(this, 'handleAddSchedule')
					}, 'Add Schedule')
				])
			),

			// Schedule list
			KissTheme.card('Scheduled Shows (' + schedules.length + ')', this.renderScheduleTable(schedules))
		];

		return KissTheme.wrap(content, 'admin/services/webradio/schedule');
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
	}
});
