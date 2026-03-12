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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	presets: [],
	schedules: [],
	categories: [],
	groups: [],
	clients: [],

	load: function() {
		return Promise.all([
			API.listPresetModes(),
			API.listParentalSchedules(),
			API.getFilterCategories(),
			API.listGroups(),
			API.getUsageRealtime()
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var activePresets = this.presets.filter(function(p) { return p.enabled; }).length;
		var activeSchedules = this.schedules.filter(function(s) { return s.enabled; }).length;
		return [
			KissTheme.stat(this.presets.length, 'Presets', c.purple),
			KissTheme.stat(activePresets, 'Active', activePresets > 0 ? c.green : c.muted),
			KissTheme.stat(this.schedules.length, 'Schedules', c.blue),
			KissTheme.stat(this.categories.length, 'Categories', c.cyan)
		];
	},

	render: function(data) {
		this.presets = (data[0] && data[0].presets) || [];
		this.schedules = (data[1] && data[1].schedules) || [];
		this.categories = (data[2] && data[2].categories) || [];
		this.groups = (data[3] && data[3].groups) || [];
		this.clients = (data[4] && data[4].clients) || [];
		var self = this;

		// Add default presets if none exist
		if (this.presets.length === 0) {
			this.presets = [
				{ id: 'preset_bedtime', name: 'Bedtime', icon: 'moon', enabled: false, action: 'block', builtin: true },
				{ id: 'preset_homework', name: 'Homework', icon: 'book', enabled: false, action: 'filter', builtin: true },
				{ id: 'preset_family', name: 'Family Time', icon: 'users', enabled: false, action: 'filter', builtin: true }
			];
		}

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, _('Parental Controls')),
					KissTheme.badge(this.schedules.length + ' schedules', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					_('Manage internet access schedules, content filtering, and quick preset modes'))
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Presets Section
			this.renderPresetsSection(),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top: 20px;' }, [
				this.renderSchedulesSection(),
				this.renderCategoriesSection()
			]),

			// Weekly Overview
			this.renderWeeklySection()
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/parental-controls');
	},

	renderPresetsSection: function() {
		var self = this;

		var presetCards = E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px;' },
			this.presets.map(function(preset) {
				var icon = PRESET_ICONS[preset.icon] || PRESET_ICONS['clock'];
				var borderColor = preset.enabled ? 'var(--kiss-green)' : 'var(--kiss-line)';

				return E('div', {
					'style': 'background: var(--kiss-bg); border: 2px solid ' + borderColor + '; border-radius: 12px; padding: 20px; text-align: center;'
				}, [
					E('div', { 'style': 'font-size: 40px; margin-bottom: 12px;' }, icon),
					E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, preset.name),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 16px;' },
						preset.action === 'block' ? _('Blocks all access') : _('Content filtered')),
					E('button', {
						'class': preset.enabled ? 'kiss-btn kiss-btn-green' : 'kiss-btn',
						'style': 'width: 100%;',
						'click': function() { self.togglePreset(preset.id, !preset.enabled); }
					}, preset.enabled ? _('Active') : _('Activate'))
				]);
			})
		);

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '⚡ ' + _('Quick Preset Modes')),
				KissTheme.badge(this.presets.filter(function(p) { return p.enabled; }).length + ' active', 'green')
			]),
			presetCards
		);
	},

	renderSchedulesSection: function() {
		var self = this;

		var content;
		if (this.schedules.length === 0) {
			content = E('div', { 'style': 'text-align: center; padding: 30px;' }, [
				E('div', { 'style': 'font-size: 40px; margin-bottom: 12px; opacity: 0.5;' }, '📅'),
				E('p', { 'style': 'color: var(--kiss-muted);' }, _('No schedules configured')),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'margin-top: 12px;',
					'click': function() { self.showCreateScheduleModal(self.groups, self.clients); }
				}, '+ ' + _('Add Schedule'))
			]);
		} else {
			content = E('div', {}, [
				E('div', { 'style': 'margin-bottom: 12px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.showCreateScheduleModal(self.groups, self.clients); }
					}, '+ ' + _('Add Schedule'))
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' },
					this.schedules.map(function(schedule) {
						var daysArray = (schedule.days || '').split(' ').filter(Boolean);
						var borderColor = schedule.active ? 'var(--kiss-orange)' : 'var(--kiss-line)';

						return E('div', {
							'style': 'padding: 16px; background: var(--kiss-bg); border-radius: 8px; border-left: 3px solid ' + borderColor + ';'
						}, [
							E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;' }, [
								E('div', {}, [
									E('div', { 'style': 'font-weight: 600;' }, schedule.name),
									E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, [
										schedule.target_type === 'group' ? '👥 ' : '📱 ',
										schedule.target
									])
								]),
								E('div', { 'style': 'display: flex; gap: 6px;' }, [
									schedule.active ? KissTheme.badge('Active', 'orange') : '',
									KissTheme.badge(schedule.action, schedule.action === 'block' ? 'red' : 'orange')
								])
							]),
							E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;' }, [
								E('span', { 'style': 'color: var(--kiss-muted);' }, '⏰'),
								E('span', {}, schedule.start_time + ' - ' + schedule.end_time)
							]),
							E('div', { 'style': 'display: flex; gap: 4px; margin-bottom: 12px;' },
								DAYS.map(function(day) {
									var isActive = daysArray.indexOf(day) !== -1;
									return E('span', {
										'style': 'width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600;' +
											(isActive ? ' background: var(--kiss-purple); color: white;' : ' background: var(--kiss-bg2); color: var(--kiss-muted);')
									}, DAY_LABELS[day]);
								})
							),
							E('div', { 'style': 'display: flex; gap: 8px;' }, [
								E('button', {
									'class': 'kiss-btn',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': function() { self.showEditScheduleModal(schedule, self.groups, self.clients); }
								}, _('Edit')),
								E('button', {
									'class': 'kiss-btn kiss-btn-red',
									'style': 'padding: 4px 10px; font-size: 11px;',
									'click': function() { self.deleteSchedule(schedule); }
								}, _('Delete'))
							])
						]);
					})
				)
			]);
		}

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '📅 ' + _('Access Schedules')),
				KissTheme.badge(this.schedules.length + ' schedules', 'blue')
			]),
			content
		);
	},

	renderCategoriesSection: function() {
		var self = this;

		if (this.categories.length === 0) {
			return KissTheme.card('🏷️ ' + _('Content Categories'),
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
					_('No filter categories available')));
		}

		var categoriesGrid = E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
			this.categories.map(function(cat) {
				return E('span', {
					'style': 'display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--kiss-bg); border-radius: 6px; font-size: 13px;'
				}, [
					E('span', {}, self.getCategoryIcon(cat.id)),
					cat.name
				]);
			})
		);

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, '🏷️ ' + _('Content Categories')),
				KissTheme.badge(this.categories.length + ' categories', 'cyan')
			]),
			categoriesGrid
		);
	},

	renderWeeklySection: function() {
		var hours = [];
		for (var i = 0; i < 24; i++) hours.push(i);

		var self = this;
		var schedules = this.schedules;

		var rows = DAYS.map(function(day) {
			var cells = hours.map(function(hour) {
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

				return E('div', {
					'style': 'flex: 1; height: 16px;' +
						(isBlocked ? ' background: var(--kiss-red);' : ' background: var(--kiss-bg2);')
				});
			});

			return E('div', { 'style': 'display: flex; gap: 1px;' }, [
				E('div', { 'style': 'width: 30px; font-size: 10px; color: var(--kiss-muted); text-align: center;' }, DAY_LABELS[day]),
				E('div', { 'style': 'flex: 1; display: flex; gap: 1px;' }, cells)
			]);
		});

		return KissTheme.card('📊 ' + _('Weekly Overview'),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 2px;' }, rows)
		);
	},

	togglePreset: function(presetId, enabled) {
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
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';

		var targetOptions = [];
		clients.forEach(function(c) {
			targetOptions.push(E('option', { 'value': c.mac, 'data-type': 'device' }, '📱 ' + (c.hostname || c.mac)));
		});
		groups.forEach(function(g) {
			targetOptions.push(E('option', { 'value': g.id, 'data-type': 'group' }, '👥 ' + g.name));
		});

		var body = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Schedule Name')),
				E('input', { 'type': 'text', 'id': 'schedule-name', 'style': inputStyle, 'placeholder': _('e.g., Bedtime for Kids') })
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Apply To')),
				E('select', { 'id': 'schedule-target', 'style': inputStyle }, targetOptions)
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Action')),
				E('select', { 'id': 'schedule-action', 'style': inputStyle }, [
					E('option', { 'value': 'block' }, _('Block Internet Access')),
					E('option', { 'value': 'throttle' }, _('Throttle Bandwidth'))
				])
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Start Time')),
					E('input', { 'type': 'time', 'id': 'schedule-start', 'style': inputStyle, 'value': '21:00' })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('End Time')),
					E('input', { 'type': 'time', 'id': 'schedule-end', 'style': inputStyle, 'value': '07:00' })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Days')),
				E('div', { 'class': 'days-selector', 'style': 'display: flex; gap: 8px;' },
					DAYS.map(function(day) {
						var isDefault = ['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(day) !== -1;
						return E('label', { 'style': 'display: flex; flex-direction: column; align-items: center; cursor: pointer;' }, [
							E('input', { 'type': 'checkbox', 'value': day, 'checked': isDefault, 'style': 'margin-bottom: 4px;' }),
							E('span', {
								'style': 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--kiss-bg); border-radius: 50%; font-size: 12px; font-weight: 600;'
							}, DAY_LABELS[day])
						]);
					})
				)
			])
		]);

		ui.showModal(_('Create Schedule'), [
			body,
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.createSchedule(); } }, _('Create'))
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
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';
		var daysArray = (schedule.days || '').split(' ').filter(Boolean);

		var targetOptions = [];
		clients.forEach(function(c) {
			targetOptions.push(E('option', { 'value': c.mac, 'data-type': 'device', 'selected': schedule.target === c.mac }, '📱 ' + (c.hostname || c.mac)));
		});
		groups.forEach(function(g) {
			targetOptions.push(E('option', { 'value': g.id, 'data-type': 'group', 'selected': schedule.target === g.id }, '👥 ' + g.name));
		});

		var body = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Schedule Name')),
				E('input', { 'type': 'text', 'id': 'edit-schedule-name', 'style': inputStyle, 'value': schedule.name })
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Apply To')),
				E('select', { 'id': 'edit-schedule-target', 'style': inputStyle }, targetOptions)
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Action')),
				E('select', { 'id': 'edit-schedule-action', 'style': inputStyle }, [
					E('option', { 'value': 'block', 'selected': schedule.action === 'block' }, _('Block Internet Access')),
					E('option', { 'value': 'throttle', 'selected': schedule.action === 'throttle' }, _('Throttle Bandwidth'))
				])
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Start Time')),
					E('input', { 'type': 'time', 'id': 'edit-schedule-start', 'style': inputStyle, 'value': schedule.start_time })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('End Time')),
					E('input', { 'type': 'time', 'id': 'edit-schedule-end', 'style': inputStyle, 'value': schedule.end_time })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Days')),
				E('div', { 'class': 'days-selector', 'style': 'display: flex; gap: 8px;' },
					DAYS.map(function(day) {
						var isActive = daysArray.indexOf(day) !== -1;
						return E('label', { 'style': 'display: flex; flex-direction: column; align-items: center; cursor: pointer;' }, [
							E('input', { 'type': 'checkbox', 'value': day, 'checked': isActive, 'style': 'margin-bottom: 4px;' }),
							E('span', {
								'style': 'width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--kiss-bg); border-radius: 50%; font-size: 12px; font-weight: 600;'
							}, DAY_LABELS[day])
						]);
					})
				)
			])
		]);

		ui.showModal(_('Edit Schedule'), [
			body,
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.updateSchedule(schedule.id); } }, _('Save'))
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

	getCategoryIcon: function(catId) {
		var icons = {
			'adult': '🔞', 'gambling': '🎰', 'gaming': '🎮', 'social': '💬',
			'streaming': '📺', 'education': '📚', 'news': '📰', 'shopping': '🛒',
			'finance': '💰', 'health': '🏥', 'travel': '✈️', 'technology': '💻',
			'sports': '⚽', 'entertainment': '🎬', 'reference': '📖', 'downloads': '📥'
		};
		return icons[catId] || '📁';
	}
});
