'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require dom';
'require poll';

var callGetSchedules = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_schedules',
	expect: { schedules: [] }
});

var callCreateSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'create_schedule',
	params: ['name', 'enabled', 'days', 'start_time', 'end_time', 'limit_down', 'limit_up', 'priority', 'target', 'target_type'],
	expect: { success: false }
});

var callUpdateSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_schedule',
	params: ['id', 'name', 'enabled', 'days', 'start_time', 'end_time', 'limit_down', 'limit_up', 'priority', 'target', 'target_type'],
	expect: { success: false }
});

var callDeleteSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_schedule',
	params: ['id'],
	expect: { success: false }
});

var callToggleSchedule = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'toggle_schedule',
	params: ['id', 'enabled'],
	expect: { success: false }
});

var callGetDevices = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_clients',
	expect: { clients: [] }
});

var callGetGroups = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_groups',
	expect: { groups: [] }
});

var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var DAY_VALUES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

var CSS = '\
.schedules-container { background: linear-gradient(135deg, #0a0a0f 0%, #050508 100%); border-radius: 12px; padding: 24px; margin: 16px 0; }\
.schedules-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #25252f; }\
.schedules-title { font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\
.schedules-list { display: grid; gap: 12px; }\
.schedule-card { background: #15151a; border: 1px solid #25252f; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; transition: all 0.2s; }\
.schedule-card:hover { border-color: #8b5cf6; }\
.schedule-card.disabled { opacity: 0.5; }\
.schedule-icon { font-size: 32px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: #0a0a0f; border-radius: 8px; }\
.schedule-info { flex: 1; }\
.schedule-name { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; }\
.schedule-time { font-size: 14px; color: #06b6d4; font-family: monospace; margin-bottom: 4px; }\
.schedule-details { font-size: 12px; color: #666; }\
.schedule-days { display: flex; gap: 4px; margin-top: 8px; }\
.day-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; background: #0a0a0f; color: #666; border: 1px solid #25252f; }\
.day-badge.active { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; border-color: transparent; }\
.schedule-limits { text-align: right; min-width: 100px; }\
.limit-value { font-size: 14px; font-weight: 600; color: #10b981; }\
.limit-label { font-size: 10px; color: #666; text-transform: uppercase; }\
.schedule-actions { display: flex; gap: 8px; align-items: center; }\
.toggle-switch { position: relative; width: 48px; height: 24px; }\
.toggle-switch input { opacity: 0; width: 0; height: 0; }\
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #25252f; border-radius: 24px; transition: 0.3s; }\
.toggle-slider:before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #666; border-radius: 50%; transition: 0.3s; }\
.toggle-switch input:checked + .toggle-slider { background: #8b5cf6; }\
.toggle-switch input:checked + .toggle-slider:before { transform: translateX(24px); background: white; }\
.btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }\
.btn-primary { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; }\
.btn-primary:hover { box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }\
.btn-secondary { background: #15151a; color: #ccc; border: 1px solid #25252f; }\
.btn-secondary:hover { background: #25252f; }\
.btn-danger { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }\
.btn-danger:hover { background: rgba(244, 63, 94, 0.3); }\
.btn-icon { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }\
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }\
.modal { background: #0a0a0f; border: 1px solid #25252f; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }\
.modal-header { padding: 20px; border-bottom: 1px solid #25252f; display: flex; justify-content: space-between; align-items: center; }\
.modal-title { font-size: 18px; font-weight: 600; color: #fff; }\
.modal-close { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #15151a; color: #999; cursor: pointer; border: none; }\
.modal-body { padding: 20px; }\
.modal-footer { padding: 16px 20px; border-top: 1px solid #25252f; display: flex; justify-content: flex-end; gap: 12px; }\
.form-group { margin-bottom: 16px; }\
.form-label { display: block; font-size: 13px; font-weight: 600; color: #999; margin-bottom: 8px; text-transform: uppercase; }\
.form-input, .form-select { width: 100%; background: #15151a; border: 1px solid #25252f; border-radius: 6px; padding: 10px 14px; color: #fff; font-size: 14px; box-sizing: border-box; }\
.form-input:focus, .form-select:focus { border-color: #8b5cf6; outline: none; }\
.form-row { display: flex; gap: 16px; }\
.form-row .form-group { flex: 1; }\
.day-selector { display: flex; gap: 8px; flex-wrap: wrap; }\
.day-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: #15151a; color: #666; border: 2px solid #25252f; cursor: pointer; transition: all 0.2s; }\
.day-btn:hover { border-color: #8b5cf6; }\
.day-btn.selected { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; border-color: transparent; }\
.empty-state { text-align: center; padding: 48px; color: #666; }\
.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }\
.quick-presets { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }\
.preset-btn { padding: 6px 12px; background: #15151a; border: 1px solid #25252f; border-radius: 16px; color: #999; font-size: 12px; cursor: pointer; transition: all 0.2s; }\
.preset-btn:hover { border-color: #8b5cf6; color: #fff; }\
';

return view.extend({
	schedules: [],
	devices: [],
	groups: [],

	load: function() {
		return Promise.all([
			callGetSchedules(),
			callGetDevices(),
			callGetGroups()
		]);
	},

	render: function(data) {
		var self = this;
		this.schedules = data[0].schedules || [];
		this.devices = data[1].clients || [];
		this.groups = data[2].groups || [];

		var container = E('div', { 'class': 'cbi-map' }, [
			E('style', {}, CSS),
			E('div', { 'class': 'schedules-container' }, [
				E('div', { 'class': 'schedules-header' }, [
					E('span', { 'class': 'schedules-title' }, 'Time-Based Schedules'),
					E('button', {
						'class': 'btn btn-primary',
						'click': function() { self.showScheduleModal(); }
					}, ['+ New Schedule'])
				]),
				E('div', { 'class': 'schedules-list', 'id': 'schedules-list' },
					this.schedules.length > 0
						? this.schedules.map(function(s) { return self.renderScheduleCard(s); })
						: [this.renderEmptyState()]
				)
			])
		]);

		return container;
	},

	renderScheduleCard: function(schedule) {
		var self = this;
		var days = schedule.days || [];
		var isEnabled = schedule.enabled === '1' || schedule.enabled === true;

		return E('div', {
			'class': 'schedule-card' + (isEnabled ? '' : ' disabled'),
			'data-id': schedule['.name'] || schedule.id
		}, [
			E('div', { 'class': 'schedule-icon' }, this.getScheduleIcon(schedule)),
			E('div', { 'class': 'schedule-info' }, [
				E('div', { 'class': 'schedule-name' }, schedule.name || 'Unnamed Schedule'),
				E('div', { 'class': 'schedule-time' }, (schedule.start_time || '00:00') + ' - ' + (schedule.end_time || '23:59')),
				E('div', { 'class': 'schedule-details' },
					schedule.target_type === 'group' ? 'Group: ' + (schedule.target || 'All') :
					schedule.target_type === 'device' ? 'Device: ' + (schedule.target || 'All') : 'All devices'
				),
				E('div', { 'class': 'schedule-days' },
					DAY_VALUES.map(function(d, i) {
						return E('span', {
							'class': 'day-badge' + (days.indexOf(d) >= 0 ? ' active' : '')
						}, DAYS[i].charAt(0));
					})
				)
			]),
			E('div', { 'class': 'schedule-limits' }, [
				E('div', { 'class': 'limit-value' }, this.formatSpeed(schedule.limit_down || 0)),
				E('div', { 'class': 'limit-label' }, 'Download'),
				E('div', { 'class': 'limit-value', 'style': 'margin-top:8px;color:#06b6d4' }, this.formatSpeed(schedule.limit_up || 0)),
				E('div', { 'class': 'limit-label' }, 'Upload')
			]),
			E('div', { 'class': 'schedule-actions' }, [
				E('label', { 'class': 'toggle-switch' }, [
					E('input', {
						'type': 'checkbox',
						'checked': isEnabled,
						'change': function(ev) {
							self.toggleSchedule(schedule['.name'] || schedule.id, ev.target.checked);
						}
					}),
					E('span', { 'class': 'toggle-slider' })
				]),
				E('button', {
					'class': 'btn btn-icon btn-secondary',
					'title': 'Edit',
					'click': function() { self.showScheduleModal(schedule); }
				}, '\u270E'),
				E('button', {
					'class': 'btn btn-icon btn-danger',
					'title': 'Delete',
					'click': function() { self.deleteSchedule(schedule['.name'] || schedule.id); }
				}, '\u2715')
			])
		]);
	},

	renderEmptyState: function() {
		return E('div', { 'class': 'empty-state' }, [
			E('div', { 'class': 'empty-icon' }, '\u23F0'),
			E('div', { 'style': 'font-size:16px;margin-bottom:8px;color:#999' }, 'No schedules configured'),
			E('div', { 'style': 'font-size:13px' }, 'Create a schedule to apply bandwidth limits at specific times')
		]);
	},

	getScheduleIcon: function(schedule) {
		var startHour = parseInt((schedule.start_time || '00:00').split(':')[0]);
		if (startHour >= 6 && startHour < 12) return '\u2600\uFE0F'; // Morning
		if (startHour >= 12 && startHour < 18) return '\u26C5'; // Afternoon
		if (startHour >= 18 && startHour < 22) return '\uD83C\uDF19'; // Evening
		return '\uD83C\uDF19'; // Night
	},

	formatSpeed: function(kbps) {
		if (!kbps || kbps === 0) return 'Unlimited';
		if (kbps >= 1000) return (kbps / 1000).toFixed(1) + ' Mbps';
		return kbps + ' Kbps';
	},

	showScheduleModal: function(schedule) {
		var self = this;
		var isEdit = !!schedule;
		var selectedDays = (schedule && schedule.days) ? schedule.days.slice() : [];

		var overlay = E('div', { 'class': 'modal-overlay' });
		var modal = E('div', { 'class': 'modal' }, [
			E('div', { 'class': 'modal-header' }, [
				E('span', { 'class': 'modal-title' }, isEdit ? 'Edit Schedule' : 'New Schedule'),
				E('button', { 'class': 'modal-close', 'click': function() { overlay.remove(); } }, '\u2715')
			]),
			E('div', { 'class': 'modal-body' }, [
				E('div', { 'class': 'quick-presets' }, [
					E('button', { 'class': 'preset-btn', 'click': function() {
						document.getElementById('sched-start').value = '22:00';
						document.getElementById('sched-end').value = '06:00';
						document.getElementById('sched-name').value = 'Night Hours';
					}}, 'Night (22:00-06:00)'),
					E('button', { 'class': 'preset-btn', 'click': function() {
						document.getElementById('sched-start').value = '18:00';
						document.getElementById('sched-end').value = '23:00';
						document.getElementById('sched-name').value = 'Peak Hours';
					}}, 'Peak (18:00-23:00)'),
					E('button', { 'class': 'preset-btn', 'click': function() {
						document.getElementById('sched-start').value = '08:00';
						document.getElementById('sched-end').value = '16:00';
						document.getElementById('sched-name').value = 'Work Hours';
					}}, 'Work (08:00-16:00)')
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', { 'class': 'form-label' }, 'Schedule Name'),
					E('input', {
						'type': 'text',
						'class': 'form-input',
						'id': 'sched-name',
						'value': schedule ? schedule.name : '',
						'placeholder': 'e.g., Evening Limit'
					})
				]),
				E('div', { 'class': 'form-row' }, [
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'Start Time'),
						E('input', {
							'type': 'time',
							'class': 'form-input',
							'id': 'sched-start',
							'value': schedule ? schedule.start_time : '00:00'
						})
					]),
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'End Time'),
						E('input', {
							'type': 'time',
							'class': 'form-input',
							'id': 'sched-end',
							'value': schedule ? schedule.end_time : '23:59'
						})
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', { 'class': 'form-label' }, 'Active Days'),
					E('div', { 'class': 'day-selector', 'id': 'day-selector' },
						DAY_VALUES.map(function(d, i) {
							return E('button', {
								'type': 'button',
								'class': 'day-btn' + (selectedDays.indexOf(d) >= 0 ? ' selected' : ''),
								'data-day': d,
								'click': function(ev) {
									ev.target.classList.toggle('selected');
								}
							}, DAYS[i]);
						})
					)
				]),
				E('div', { 'class': 'form-row' }, [
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'Download Limit (Kbps)'),
						E('input', {
							'type': 'number',
							'class': 'form-input',
							'id': 'sched-down',
							'value': schedule ? schedule.limit_down : '',
							'placeholder': '0 = Unlimited'
						})
					]),
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'Upload Limit (Kbps)'),
						E('input', {
							'type': 'number',
							'class': 'form-input',
							'id': 'sched-up',
							'value': schedule ? schedule.limit_up : '',
							'placeholder': '0 = Unlimited'
						})
					])
				]),
				E('div', { 'class': 'form-row' }, [
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'Apply To'),
						E('select', {
							'class': 'form-select',
							'id': 'sched-target-type',
							'change': function(ev) {
								var targetSelect = document.getElementById('sched-target');
								targetSelect.innerHTML = '';
								if (ev.target.value === 'all') {
									targetSelect.style.display = 'none';
								} else if (ev.target.value === 'device') {
									targetSelect.style.display = '';
									self.devices.forEach(function(d) {
										targetSelect.appendChild(E('option', { 'value': d.mac }, d.hostname || d.mac));
									});
								} else if (ev.target.value === 'group') {
									targetSelect.style.display = '';
									self.groups.forEach(function(g) {
										targetSelect.appendChild(E('option', { 'value': g['.name'] || g.name }, g.name));
									});
								}
							}
						}, [
							E('option', { 'value': 'all', 'selected': !schedule || !schedule.target_type || schedule.target_type === 'all' }, 'All Devices'),
							E('option', { 'value': 'device', 'selected': schedule && schedule.target_type === 'device' }, 'Specific Device'),
							E('option', { 'value': 'group', 'selected': schedule && schedule.target_type === 'group' }, 'Device Group')
						])
					]),
					E('div', { 'class': 'form-group' }, [
						E('label', { 'class': 'form-label' }, 'Target'),
						E('select', {
							'class': 'form-select',
							'id': 'sched-target',
							'style': (!schedule || !schedule.target_type || schedule.target_type === 'all') ? 'display:none' : ''
						})
					])
				]),
				E('div', { 'class': 'form-group' }, [
					E('label', { 'class': 'form-label' }, 'Priority'),
					E('select', { 'class': 'form-select', 'id': 'sched-priority' }, [
						E('option', { 'value': '1', 'selected': schedule && schedule.priority === '1' }, 'High'),
						E('option', { 'value': '2', 'selected': !schedule || schedule.priority === '2' || !schedule.priority }, 'Normal'),
						E('option', { 'value': '3', 'selected': schedule && schedule.priority === '3' }, 'Low'),
						E('option', { 'value': '4', 'selected': schedule && schedule.priority === '4' }, 'Bulk')
					])
				])
			]),
			E('div', { 'class': 'modal-footer' }, [
				E('button', { 'class': 'btn btn-secondary', 'click': function() { overlay.remove(); } }, 'Cancel'),
				E('button', { 'class': 'btn btn-primary', 'click': function() { self.saveSchedule(schedule, overlay); } },
					isEdit ? 'Update' : 'Create')
			])
		]);

		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		// Trigger target type change to populate target dropdown
		if (schedule && schedule.target_type && schedule.target_type !== 'all') {
			var event = new Event('change');
			document.getElementById('sched-target-type').dispatchEvent(event);
			if (schedule.target) {
				setTimeout(function() {
					document.getElementById('sched-target').value = schedule.target;
				}, 50);
			}
		}
	},

	saveSchedule: function(existingSchedule, overlay) {
		var self = this;
		var name = document.getElementById('sched-name').value;
		var startTime = document.getElementById('sched-start').value;
		var endTime = document.getElementById('sched-end').value;
		var limitDown = document.getElementById('sched-down').value || '0';
		var limitUp = document.getElementById('sched-up').value || '0';
		var targetType = document.getElementById('sched-target-type').value;
		var target = targetType !== 'all' ? document.getElementById('sched-target').value : '';
		var priority = document.getElementById('sched-priority').value;

		var days = [];
		document.querySelectorAll('#day-selector .day-btn.selected').forEach(function(btn) {
			days.push(btn.dataset.day);
		});

		if (!name) {
			ui.addNotification(null, E('p', 'Please enter a schedule name'), 'warning');
			return;
		}

		if (days.length === 0) {
			ui.addNotification(null, E('p', 'Please select at least one day'), 'warning');
			return;
		}

		var promise;
		if (existingSchedule) {
			promise = callUpdateSchedule(
				existingSchedule['.name'] || existingSchedule.id,
				name, '1', days, startTime, endTime,
				limitDown, limitUp, priority, target, targetType
			);
		} else {
			promise = callCreateSchedule(
				name, '1', days, startTime, endTime,
				limitDown, limitUp, priority, target, targetType
			);
		}

		promise.then(function(res) {
			if (res.success) {
				overlay.remove();
				self.refreshSchedules();
				ui.addNotification(null, E('p', existingSchedule ? 'Schedule updated' : 'Schedule created'), 'success');
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed to save schedule'), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
		});
	},

	toggleSchedule: function(id, enabled) {
		var self = this;
		callToggleSchedule(id, enabled ? '1' : '0').then(function(res) {
			if (res.success) {
				self.refreshSchedules();
			} else {
				ui.addNotification(null, E('p', 'Failed to toggle schedule'), 'error');
			}
		});
	},

	deleteSchedule: function(id) {
		var self = this;
		if (!confirm('Delete this schedule?')) return;

		callDeleteSchedule(id).then(function(res) {
			if (res.success) {
				self.refreshSchedules();
				ui.addNotification(null, E('p', 'Schedule deleted'), 'success');
			} else {
				ui.addNotification(null, E('p', 'Failed to delete schedule'), 'error');
			}
		});
	},

	refreshSchedules: function() {
		var self = this;
		callGetSchedules().then(function(data) {
			self.schedules = data.schedules || [];
			var list = document.getElementById('schedules-list');
			if (list) {
				list.innerHTML = '';
				if (self.schedules.length > 0) {
					self.schedules.forEach(function(s) {
						list.appendChild(self.renderScheduleCard(s));
					});
				} else {
					list.appendChild(self.renderEmptyState());
				}
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
