'use strict';
'require view';
'require ui';
'require rpc';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

var PRESET_ICONS = {
	'moon': '🌙',
	'book': '📚',
	'users': '👨‍👩‍👧‍👦',
	'clock': '⏰',
	'shield': '🛡️',
	'ban': '🚫'
};

var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
var DAY_LABELS = { 'mon': 'M', 'tue': 'T', 'wed': 'W', 'thu': 'T', 'fri': 'F', 'sat': 'S', 'sun': 'S' };

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listPresetModes(),
			API.listParentalSchedules(),
			API.getFilterCategories(),
			API.listGroups(),
			API.getUsageRealtime()
		]);
	},

	render: function(data) {
		var presets = (data[0] && data[0].presets) || [];
		var schedules = (data[1] && data[1].schedules) || [];
		var categories = (data[2] && data[2].categories) || [];
		var groups = (data[3] && data[3].groups) || [];
		var clients = (data[4] && data[4].clients) || [];
		var self = this;

		var v = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('bandwidth-manager/dashboard.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('bandwidth-manager/parental.css') }),
			E('style', {}, this.getCustomStyles()),
			E('h2', {}, _('Parental Controls')),
			E('div', { 'class': 'cbi-map-descr' }, _('Manage internet access schedules, content filtering, and quick preset modes for family devices'))
		]);

		// Quick Preset Modes
		var presetsSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Quick Preset Modes')),
			E('p', { 'class': 'section-desc' }, _('Activate a preset to instantly apply predefined rules. Only one preset can be active at a time.'))
		]);

		var presetsGrid = E('div', { 'class': 'presets-grid' });

		// Add default presets if none exist
		var displayPresets = presets.length > 0 ? presets : [
			{ id: 'preset_bedtime', name: 'Bedtime', icon: 'moon', enabled: false, action: 'block', blocked_categories: 'all', builtin: true },
			{ id: 'preset_homework', name: 'Homework', icon: 'book', enabled: false, action: 'filter', allowed_categories: 'education reference', blocked_categories: 'gaming social streaming', builtin: true },
			{ id: 'preset_family', name: 'Family Time', icon: 'users', enabled: false, action: 'filter', allowed_categories: 'streaming education', blocked_categories: 'adult gambling', builtin: true }
		];

		displayPresets.forEach(function(preset) {
			var icon = PRESET_ICONS[preset.icon] || PRESET_ICONS['clock'];
			var presetCard = E('div', {
				'class': 'preset-card' + (preset.enabled ? ' active' : ''),
				'data-preset-id': preset.id
			}, [
				E('div', { 'class': 'preset-icon' }, icon),
				E('div', { 'class': 'preset-name' }, preset.name),
				E('div', { 'class': 'preset-action' }, preset.action === 'block' ? _('Blocks all access') : _('Content filtered')),
				E('label', { 'class': 'preset-toggle' }, [
					E('input', {
						'type': 'checkbox',
						'checked': preset.enabled,
						'change': function(ev) { self.togglePreset(preset.id, ev.target.checked); }
					}),
					E('span', { 'class': 'toggle-slider' })
				])
			]);
			presetsGrid.appendChild(presetCard);
		});

		presetsSection.appendChild(presetsGrid);
		v.appendChild(presetsSection);

		// Schedules Section
		var schedulesSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Access Schedules')),
			E('div', { 'class': 'section-actions' }, [
				E('button', {
					'class': 'bw-btn bw-btn-primary',
					'click': function() { self.showCreateScheduleModal(groups, clients); }
				}, [E('span', {}, '+'), ' ' + _('Add Schedule')])
			])
		]);

		if (schedules.length > 0) {
			var schedulesGrid = E('div', { 'class': 'schedules-grid' });

			schedules.forEach(function(schedule) {
				var daysArray = (schedule.days || '').split(' ').filter(Boolean);

				var scheduleCard = E('div', {
					'class': 'schedule-card' + (schedule.active ? ' active-now' : ''),
					'data-schedule-id': schedule.id
				}, [
					E('div', { 'class': 'schedule-header' }, [
						E('div', { 'class': 'schedule-info' }, [
							E('div', { 'class': 'schedule-name' }, schedule.name),
							E('div', { 'class': 'schedule-target' }, [
								E('span', { 'class': 'target-type' }, schedule.target_type === 'group' ? '👥' : '📱'),
								' ' + schedule.target
							])
						]),
						E('label', { 'class': 'schedule-toggle' }, [
							E('input', {
								'type': 'checkbox',
								'checked': schedule.enabled,
								'change': function(ev) { self.toggleSchedule(schedule.id, ev.target.checked); }
							}),
							E('span', { 'class': 'toggle-slider' })
						])
					]),
					E('div', { 'class': 'schedule-time' }, [
						E('span', { 'class': 'time-icon' }, '⏰'),
						E('span', {}, schedule.start_time + ' - ' + schedule.end_time)
					]),
					E('div', { 'class': 'schedule-days' },
						DAYS.map(function(day) {
							return E('span', {
								'class': 'day-badge' + (daysArray.indexOf(day) !== -1 ? ' active' : '')
							}, DAY_LABELS[day]);
						})
					),
					E('div', { 'class': 'schedule-action-badge' }, [
						schedule.action === 'block' ?
							E('span', { 'class': 'badge badge-danger' }, '🚫 ' + _('Block')) :
							E('span', { 'class': 'badge badge-warning' }, '⚠️ ' + _('Throttle'))
					]),
					schedule.active ? E('div', { 'class': 'active-indicator' }, _('Active Now')) : null,
					E('div', { 'class': 'schedule-actions' }, [
						E('button', {
							'class': 'bw-btn bw-btn-secondary btn-sm',
							'click': function() { self.showEditScheduleModal(schedule, groups, clients); }
						}, _('Edit')),
						E('button', {
							'class': 'bw-btn bw-btn-secondary btn-sm btn-danger',
							'click': function() { self.deleteSchedule(schedule); }
						}, _('Delete'))
					])
				].filter(Boolean));

				schedulesGrid.appendChild(scheduleCard);
			});

			schedulesSection.appendChild(schedulesGrid);
		} else {
			schedulesSection.appendChild(E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-icon' }, '📅'),
				E('p', {}, _('No schedules configured')),
				E('p', { 'class': 'empty-hint' }, _('Create schedules to automatically control internet access during specific times'))
			]));
		}

		v.appendChild(schedulesSection);

		// Weekly Schedule Visual
		var weeklySection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Weekly Overview')),
			this.renderWeeklyGrid(schedules)
		]);
		v.appendChild(weeklySection);

		// Content Filter Categories
		var filterSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Content Filter Categories')),
			E('p', { 'class': 'section-desc' }, _('Categories that can be blocked or allowed in schedules and presets'))
		]);

		var categoriesGrid = E('div', { 'class': 'categories-grid' });
		categories.forEach(function(cat) {
			categoriesGrid.appendChild(E('div', { 'class': 'category-badge' }, [
				E('span', { 'class': 'category-icon' }, self.getCategoryIcon(cat.id)),
				E('span', {}, cat.name)
			]));
		});

		filterSection.appendChild(categoriesGrid);
		v.appendChild(filterSection);

		return KissTheme.wrap([v], 'admin/services/bandwidth-manager/parental-controls');
	},

	togglePreset: function(presetId, enabled) {
		var self = this;
		API.activatePresetMode(presetId, enabled ? 1 : 0).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', enabled ? _('Preset activated') : _('Preset deactivated')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to toggle preset')), 'error');
			}
		});
	},

	toggleSchedule: function(scheduleId, enabled) {
		API.toggleParentalSchedule(scheduleId, enabled ? 1 : 0).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Schedule updated')), 'success');
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to update schedule')), 'error');
			}
		});
	},

	showCreateScheduleModal: function(groups, clients) {
		var self = this;

		var targetOptions = [];
		clients.forEach(function(c) {
			targetOptions.push(E('option', { 'value': c.mac, 'data-type': 'device' }, '📱 ' + (c.hostname || c.mac)));
		});
		groups.forEach(function(g) {
			targetOptions.push(E('option', { 'value': g.id, 'data-type': 'group' }, '👥 ' + g.name));
		});

		var body = E('div', { 'class': 'schedule-form' }, [
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Schedule Name')),
				E('input', { 'type': 'text', 'id': 'schedule-name', 'class': 'cbi-input-text', 'placeholder': _('e.g., Bedtime for Kids') })
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Apply To')),
				E('select', { 'id': 'schedule-target', 'class': 'cbi-input-select' }, targetOptions)
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Action')),
				E('select', { 'id': 'schedule-action', 'class': 'cbi-input-select' }, [
					E('option', { 'value': 'block' }, _('Block Internet Access')),
					E('option', { 'value': 'throttle' }, _('Throttle Bandwidth'))
				])
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Start Time')),
					E('input', { 'type': 'time', 'id': 'schedule-start', 'class': 'cbi-input-text', 'value': '21:00' })
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('End Time')),
					E('input', { 'type': 'time', 'id': 'schedule-end', 'class': 'cbi-input-text', 'value': '07:00' })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Days')),
				E('div', { 'class': 'days-selector' },
					DAYS.map(function(day) {
						return E('label', { 'class': 'day-checkbox' }, [
							E('input', { 'type': 'checkbox', 'value': day, 'checked': ['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(day) !== -1 }),
							E('span', {}, DAY_LABELS[day])
						]);
					})
				)
			])
		]);

		ui.showModal(_('Create Schedule'), [
			body,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.createSchedule(); }
				}, _('Create'))
			])
		]);
	},

	createSchedule: function() {
		var name = document.getElementById('schedule-name').value;
		var targetSelect = document.getElementById('schedule-target');
		var target = targetSelect.value;
		var targetType = targetSelect.options[targetSelect.selectedIndex].getAttribute('data-type');
		var action = document.getElementById('schedule-action').value;
		var startTime = document.getElementById('schedule-start').value;
		var endTime = document.getElementById('schedule-end').value;

		var days = [];
		document.querySelectorAll('.days-selector input:checked').forEach(function(cb) {
			days.push(cb.value);
		});

		if (!name) {
			ui.addNotification(null, E('p', _('Schedule name is required')), 'error');
			return;
		}

		if (days.length === 0) {
			ui.addNotification(null, E('p', _('Select at least one day')), 'error');
			return;
		}

		API.createParentalSchedule(name, targetType, target, action, startTime, endTime, days.join(' ')).then(function(result) {
			if (result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Schedule created')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to create schedule')), 'error');
			}
		});
	},

	showEditScheduleModal: function(schedule, groups, clients) {
		var self = this;
		var daysArray = (schedule.days || '').split(' ').filter(Boolean);

		var targetOptions = [];
		clients.forEach(function(c) {
			targetOptions.push(E('option', {
				'value': c.mac,
				'data-type': 'device',
				'selected': schedule.target === c.mac
			}, '📱 ' + (c.hostname || c.mac)));
		});
		groups.forEach(function(g) {
			targetOptions.push(E('option', {
				'value': g.id,
				'data-type': 'group',
				'selected': schedule.target === g.id
			}, '👥 ' + g.name));
		});

		var body = E('div', { 'class': 'schedule-form' }, [
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Schedule Name')),
				E('input', { 'type': 'text', 'id': 'edit-schedule-name', 'class': 'cbi-input-text', 'value': schedule.name })
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Apply To')),
				E('select', { 'id': 'edit-schedule-target', 'class': 'cbi-input-select' }, targetOptions)
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Action')),
				E('select', { 'id': 'edit-schedule-action', 'class': 'cbi-input-select' }, [
					E('option', { 'value': 'block', 'selected': schedule.action === 'block' }, _('Block Internet Access')),
					E('option', { 'value': 'throttle', 'selected': schedule.action === 'throttle' }, _('Throttle Bandwidth'))
				])
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Start Time')),
					E('input', { 'type': 'time', 'id': 'edit-schedule-start', 'class': 'cbi-input-text', 'value': schedule.start_time })
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('End Time')),
					E('input', { 'type': 'time', 'id': 'edit-schedule-end', 'class': 'cbi-input-text', 'value': schedule.end_time })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Days')),
				E('div', { 'class': 'days-selector' },
					DAYS.map(function(day) {
						return E('label', { 'class': 'day-checkbox' }, [
							E('input', { 'type': 'checkbox', 'value': day, 'checked': daysArray.indexOf(day) !== -1 }),
							E('span', {}, DAY_LABELS[day])
						]);
					})
				)
			])
		]);

		ui.showModal(_('Edit Schedule'), [
			body,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.updateSchedule(schedule.id); }
				}, _('Save'))
			])
		]);
	},

	updateSchedule: function(scheduleId) {
		var name = document.getElementById('edit-schedule-name').value;
		var targetSelect = document.getElementById('edit-schedule-target');
		var target = targetSelect.value;
		var targetType = targetSelect.options[targetSelect.selectedIndex].getAttribute('data-type');
		var action = document.getElementById('edit-schedule-action').value;
		var startTime = document.getElementById('edit-schedule-start').value;
		var endTime = document.getElementById('edit-schedule-end').value;

		var days = [];
		document.querySelectorAll('.days-selector input:checked').forEach(function(cb) {
			days.push(cb.value);
		});

		API.updateParentalSchedule(scheduleId, name, targetType, target, action, startTime, endTime, days.join(' '), 1).then(function(result) {
			if (result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Schedule updated')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to update schedule')), 'error');
			}
		});
	},

	deleteSchedule: function(schedule) {
		if (!confirm(_('Delete schedule "%s"?').format(schedule.name))) {
			return;
		}

		API.deleteParentalSchedule(schedule.id).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Schedule deleted')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to delete schedule')), 'error');
			}
		});
	},

	renderWeeklyGrid: function(schedules) {
		var hours = [];
		for (var i = 0; i < 24; i++) {
			hours.push(i);
		}

		var grid = E('div', { 'class': 'weekly-grid' }, [
			E('div', { 'class': 'grid-header' }, [
				E('div', { 'class': 'grid-corner' }),
				hours.map(function(h) {
					return E('div', { 'class': 'hour-label' }, h % 6 === 0 ? String(h).padStart(2, '0') : '');
				})
			].flat())
		]);

		var self = this;
		DAYS.forEach(function(day, dayIndex) {
			var row = E('div', { 'class': 'grid-row' }, [
				E('div', { 'class': 'day-label' }, DAY_LABELS[day])
			]);

			hours.forEach(function(hour) {
				var isBlocked = false;
				schedules.forEach(function(s) {
					if (!s.enabled) return;
					var daysArray = (s.days || '').split(' ');
					if (daysArray.indexOf(day) === -1) return;

					var start = parseInt(s.start_time.split(':')[0]);
					var end = parseInt(s.end_time.split(':')[0]);

					if (start < end) {
						if (hour >= start && hour < end) isBlocked = true;
					} else {
						if (hour >= start || hour < end) isBlocked = true;
					}
				});

				row.appendChild(E('div', {
					'class': 'hour-cell' + (isBlocked ? ' blocked' : '')
				}));
			});

			grid.appendChild(row);
		});

		return grid;
	},

	getCategoryIcon: function(catId) {
		var icons = {
			'adult': '🔞', 'gambling': '🎰', 'gaming': '🎮', 'social': '💬',
			'streaming': '📺', 'education': '📚', 'news': '📰', 'shopping': '🛒',
			'finance': '💰', 'health': '🏥', 'travel': '✈️', 'technology': '💻',
			'sports': '⚽', 'entertainment': '🎬', 'reference': '📖', 'downloads': '📥'
		};
		return icons[catId] || '📁';
	},

	getCustomStyles: function() {
		return `
			.section-desc { color: #999; font-size: 14px; margin-bottom: 16px; }
			.section-actions { margin-bottom: 16px; }
			.presets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
			.preset-card { background: var(--bw-light, #15151a); border: 2px solid var(--bw-border, #25252f); border-radius: 12px; padding: 20px; text-align: center; transition: all 0.2s; }
			.preset-card.active { border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
			.preset-icon { font-size: 48px; margin-bottom: 12px; }
			.preset-name { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 4px; }
			.preset-action { font-size: 12px; color: #999; margin-bottom: 16px; }
			.preset-toggle, .schedule-toggle { position: relative; display: inline-block; width: 48px; height: 24px; }
			.preset-toggle input, .schedule-toggle input { opacity: 0; width: 0; height: 0; }
			.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: var(--bw-border, #25252f); border-radius: 24px; transition: 0.3s; }
			.toggle-slider::before { content: ""; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
			input:checked + .toggle-slider { background: #10b981; }
			input:checked + .toggle-slider::before { transform: translateX(24px); }
			.schedules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
			.schedule-card { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 16px; position: relative; }
			.schedule-card.active-now { border-color: #f59e0b; }
			.schedule-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
			.schedule-name { font-size: 16px; font-weight: 600; color: #fff; }
			.schedule-target { font-size: 13px; color: #999; margin-top: 4px; }
			.schedule-time { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #ccc; margin-bottom: 12px; }
			.time-icon { font-size: 16px; }
			.schedule-days { display: flex; gap: 4px; margin-bottom: 12px; }
			.day-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; background: var(--bw-dark, #0a0a0f); color: #666; border: 1px solid var(--bw-border, #25252f); }
			.day-badge.active { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; border: none; }
			.schedule-action-badge { margin-bottom: 12px; }
			.badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
			.badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
			.badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
			.active-indicator { position: absolute; top: 12px; right: 12px; font-size: 11px; color: #f59e0b; font-weight: 600; animation: pulse 2s infinite; }
			.schedule-actions { display: flex; gap: 8px; }
			.btn-sm { padding: 6px 12px; font-size: 12px; }
			.btn-danger { color: #ef4444; }
			.empty-state { text-align: center; padding: 40px; color: #999; }
			.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
			.empty-hint { font-size: 13px; color: #666; }
			.weekly-grid { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 8px; overflow: hidden; }
			.grid-header, .grid-row { display: flex; }
			.grid-corner, .day-label { width: 40px; flex-shrink: 0; padding: 8px; font-size: 11px; font-weight: 600; color: #999; display: flex; align-items: center; justify-content: center; }
			.hour-label { flex: 1; padding: 4px; font-size: 10px; color: #666; text-align: center; }
			.hour-cell { flex: 1; height: 20px; background: var(--bw-dark, #0a0a0f); border: 1px solid var(--bw-border, #25252f); }
			.hour-cell.blocked { background: rgba(239, 68, 68, 0.4); }
			.categories-grid { display: flex; flex-wrap: wrap; gap: 8px; }
			.category-badge { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 6px; font-size: 13px; color: #ccc; }
			.category-icon { font-size: 16px; }
			.form-group { margin-bottom: 16px; }
			.form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #ccc; }
			.form-row { display: flex; gap: 16px; }
			.form-group.half { flex: 1; }
			.days-selector { display: flex; gap: 8px; }
			.day-checkbox { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
			.day-checkbox input { margin-bottom: 4px; }
			.day-checkbox span { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bw-dark, #0a0a0f); border: 1px solid var(--bw-border, #25252f); border-radius: 50%; font-size: 12px; font-weight: 600; color: #666; }
			.day-checkbox input:checked + span { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; border: none; }
			@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
