'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

var PROFILE_ICONS = {
	'gamepad': { icon: '🎮', color: 'purple' },
	'play': { icon: '▶️', color: 'cyan' },
	'cpu': { icon: '🔌', color: 'green' },
	'briefcase': { icon: '💼', color: 'blue' },
	'child': { icon: '👶', color: 'orange' },
	'tag': { icon: '🏷️', color: 'purple' },
	'shield': { icon: '🛡️', color: 'red' },
	'star': { icon: '⭐', color: 'orange' },
	'home': { icon: '🏠', color: 'cyan' },
	'globe': { icon: '🌐', color: 'purple' }
};

return L.view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	profiles: [],
	assignments: [],
	clients: [],

	load: function() {
		return Promise.all([
			API.listProfiles(),
			API.getBuiltinProfiles(),
			API.listProfileAssignments(),
			API.getUsageRealtime(),
			API.listGroups()
		]);
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var builtinCount = this.profiles.filter(function(p) { return p.builtin; }).length;
		var customCount = this.profiles.length - builtinCount;
		return [
			KissTheme.stat(this.profiles.length, 'Total Profiles', c.blue),
			KissTheme.stat(builtinCount, 'Built-in', c.purple),
			KissTheme.stat(customCount, 'Custom', c.green),
			KissTheme.stat(this.assignments.length, 'Assignments', c.cyan)
		];
	},

	render: function(data) {
		var profiles = (data[0] && data[0].profiles) || [];
		var builtinProfiles = (data[1] && data[1].profiles) || [];
		this.assignments = (data[2] && data[2].assignments) || [];
		this.clients = (data[3] && data[3].clients) || [];
		var groups = (data[4] && data[4].groups) || [];
		var self = this;

		this.profiles = builtinProfiles.concat(profiles);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, _('Device Profiles')),
					KissTheme.badge(this.profiles.length + ' profiles', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					_('Create and manage device profiles with custom QoS settings, bandwidth limits, and latency modes'))
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Quick Actions
			KissTheme.card('Quick Actions',
				E('div', { 'style': 'display: flex; gap: 12px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.showCreateProfileModal(self.clients, groups); }
					}, '+ ' + _('Create Profile')),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() { self.showAssignModal(self.profiles, self.clients); }
					}, '📱 ' + _('Assign to Device'))
				])
			),

			// Profiles Grid
			this.renderProfilesGrid(),

			// Assignments Section
			this.renderAssignmentsSection()
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/profiles');
	},

	renderProfilesGrid: function() {
		var self = this;

		if (this.profiles.length === 0) {
			return KissTheme.card('Profiles',
				E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
					_('No profiles available')));
		}

		var grid = E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;' },
			this.profiles.map(function(profile) {
				return self.renderProfileCard(profile);
			})
		);

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, 'All Profiles'),
				KissTheme.badge(this.profiles.length + ' total', 'purple')
			]),
			grid
		);
	},

	renderProfileCard: function(profile) {
		var self = this;
		var iconInfo = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag'];
		var assignedCount = this.assignments.filter(function(a) {
			return a.profile === profile.id;
		}).length;

		var features = [];
		if (profile.latency_mode === 'ultra') features.push(E('span', {}, '⚡ Ultra'));
		if (profile.isolate) features.push(E('span', {}, '🔒 Isolated'));
		if (profile.content_filter) features.push(E('span', {}, '🛡️ Filtered'));

		return E('div', {
			'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 12px; padding: 16px; border-left: 4px solid var(--kiss-' + iconInfo.color + ');'
		}, [
			// Header
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 12px;' }, [
				E('div', {
					'style': 'width: 44px; height: 44px; background: var(--kiss-bg2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px;'
				}, iconInfo.icon),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
						E('span', { 'style': 'font-weight: 600;' }, profile.name),
						profile.builtin ? KissTheme.badge('Built-in', 'blue') : ''
					]),
					E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, profile.description || _('No description'))
				])
			]),

			// Stats
			E('div', { 'style': 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; background: var(--kiss-bg2); border-radius: 8px; margin-bottom: 12px; text-align: center;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--kiss-purple);' }, String(profile.priority)),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, _('Priority'))
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--kiss-cyan);' }, profile.limit_down > 0 ? this.formatSpeed(profile.limit_down) : '∞'),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, _('Down'))
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--kiss-green);' }, profile.limit_up > 0 ? this.formatSpeed(profile.limit_up) : '∞'),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, _('Up'))
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 16px; font-weight: 700; color: var(--kiss-orange);' }, String(assignedCount)),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted); text-transform: uppercase;' }, _('Devices'))
				])
			]),

			// Features
			features.length > 0 ? E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 12px; font-size: 12px; color: var(--kiss-muted);' }, features) : '',

			// Actions
			E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.showProfileDetails(profile, self.assignments.filter(function(a) { return a.profile === profile.id; })); }
				}, _('View')),
				!profile.builtin ? E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.showEditProfileModal(profile); }
				}, _('Edit')) : '',
				E('button', {
					'class': 'kiss-btn kiss-btn-purple',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.cloneProfile(profile); }
				}, _('Clone')),
				!profile.builtin ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.deleteProfile(profile); }
				}, _('Delete')) : ''
			].filter(Boolean))
		]);
	},

	renderAssignmentsSection: function() {
		var self = this;

		if (this.assignments.length === 0) {
			return '';
		}

		var rows = this.assignments.map(function(assignment) {
			var profile = self.profiles.find(function(p) { return p.id === assignment.profile; });
			var iconInfo = profile ? (PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag']) : PROFILE_ICONS['tag'];

			return E('tr', {}, [
				E('td', { 'style': 'font-weight: 500;' }, assignment.hostname || 'Unknown'),
				E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, assignment.mac),
				E('td', { 'style': 'color: var(--kiss-muted);' }, assignment.ip || '-'),
				E('td', {}, [
					E('span', { 'style': 'display: flex; align-items: center; gap: 6px;' }, [
						E('span', {}, iconInfo.icon),
						assignment.profile_name || assignment.profile
					])
				]),
				E('td', {}, [
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': function() { self.removeAssignment(assignment.mac); }
					}, '✕')
				])
			]);
		});

		return KissTheme.card(
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
				E('span', {}, _('Device Assignments')),
				KissTheme.badge(this.assignments.length + ' devices', 'cyan')
			]),
			E('table', { 'class': 'kiss-table' }, [
				E('thead', {}, [
					E('tr', {}, [
						E('th', {}, _('Device')),
						E('th', {}, _('MAC')),
						E('th', {}, _('IP')),
						E('th', {}, _('Profile')),
						E('th', { 'style': 'width: 60px;' }, '')
					])
				]),
				E('tbody', {}, rows)
			])
		);
	},

	showCreateProfileModal: function(clients, groups) {
		var self = this;
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';

		var body = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Profile Name')),
				E('input', { 'type': 'text', 'id': 'profile-name', 'style': inputStyle, 'placeholder': _('e.g., Gaming PC') })
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Description')),
				E('input', { 'type': 'text', 'id': 'profile-desc', 'style': inputStyle, 'placeholder': _('Optional description') })
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Icon')),
					E('select', { 'id': 'profile-icon', 'style': inputStyle },
						Object.keys(PROFILE_ICONS).map(function(key) {
							return E('option', { 'value': key }, PROFILE_ICONS[key].icon + ' ' + key);
						})
					)
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Color')),
					E('input', { 'type': 'color', 'id': 'profile-color', 'value': '#8b5cf6', 'style': 'width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--kiss-line);' })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Priority (1-8, lower = higher priority)')),
				E('input', { 'type': 'number', 'id': 'profile-priority', 'style': inputStyle, 'min': '1', 'max': '8', 'value': '5' })
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Download Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'profile-limit-down', 'style': inputStyle, 'min': '0', 'value': '0', 'placeholder': '0 = unlimited' })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Upload Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'profile-limit-up', 'style': inputStyle, 'min': '0', 'value': '0', 'placeholder': '0 = unlimited' })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Latency Mode')),
				E('select', { 'id': 'profile-latency', 'style': inputStyle }, [
					E('option', { 'value': 'normal' }, _('Normal')),
					E('option', { 'value': 'low' }, _('Low Latency')),
					E('option', { 'value': 'ultra' }, _('Ultra Low Latency (Gaming)'))
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'profile-isolate' }),
					_('Network Isolation (block LAN communication)')
				])
			])
		]);

		ui.showModal(_('Create New Profile'), [
			body,
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.createProfile(); } }, _('Create Profile'))
			])
		]);
	},

	createProfile: function() {
		var self = this;
		var name = document.getElementById('profile-name').value;
		var description = document.getElementById('profile-desc').value;
		var icon = document.getElementById('profile-icon').value;
		var color = document.getElementById('profile-color').value;
		var priority = parseInt(document.getElementById('profile-priority').value) || 5;
		var limit_down = parseInt(document.getElementById('profile-limit-down').value) || 0;
		var limit_up = parseInt(document.getElementById('profile-limit-up').value) || 0;
		var latency_mode = document.getElementById('profile-latency').value;
		var isolate = document.getElementById('profile-isolate').checked ? '1' : '0';

		if (!name) {
			ui.addNotification(null, E('p', _('Profile name is required')), 'error');
			return;
		}

		API.createProfile(name, description, icon, color, priority, limit_down, limit_up, latency_mode, '', isolate, '').then(function(result) {
			if (result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Profile created successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to create profile')), 'error');
			}
		});
	},

	showEditProfileModal: function(profile) {
		var self = this;
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';

		var body = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Profile Name')),
				E('input', { 'type': 'text', 'id': 'edit-profile-name', 'style': inputStyle, 'value': profile.name })
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Description')),
				E('input', { 'type': 'text', 'id': 'edit-profile-desc', 'style': inputStyle, 'value': profile.description || '' })
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Icon')),
					E('select', { 'id': 'edit-profile-icon', 'style': inputStyle },
						Object.keys(PROFILE_ICONS).map(function(key) {
							return E('option', { 'value': key, 'selected': key === profile.icon }, PROFILE_ICONS[key].icon + ' ' + key);
						})
					)
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Color')),
					E('input', { 'type': 'color', 'id': 'edit-profile-color', 'value': profile.color || '#8b5cf6', 'style': 'width: 100%; height: 38px; border-radius: 6px; border: 1px solid var(--kiss-line);' })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Priority (1-8)')),
				E('input', { 'type': 'number', 'id': 'edit-profile-priority', 'style': inputStyle, 'min': '1', 'max': '8', 'value': String(profile.priority) })
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Download Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'edit-profile-limit-down', 'style': inputStyle, 'min': '0', 'value': String(profile.limit_down) })
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Upload Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'edit-profile-limit-up', 'style': inputStyle, 'min': '0', 'value': String(profile.limit_up) })
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Latency Mode')),
				E('select', { 'id': 'edit-profile-latency', 'style': inputStyle }, [
					E('option', { 'value': 'normal', 'selected': profile.latency_mode === 'normal' }, _('Normal')),
					E('option', { 'value': 'low', 'selected': profile.latency_mode === 'low' }, _('Low Latency')),
					E('option', { 'value': 'ultra', 'selected': profile.latency_mode === 'ultra' }, _('Ultra Low Latency'))
				])
			]),
			E('div', {}, [
				E('label', { 'style': 'display: flex; align-items: center; gap: 8px; cursor: pointer;' }, [
					E('input', { 'type': 'checkbox', 'id': 'edit-profile-isolate', 'checked': profile.isolate }),
					_('Network Isolation')
				])
			])
		]);

		ui.showModal(_('Edit Profile: ') + profile.name, [
			body,
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.updateProfile(profile.id); } }, _('Save Changes'))
			])
		]);
	},

	updateProfile: function(profileId) {
		var self = this;
		var name = document.getElementById('edit-profile-name').value;
		var description = document.getElementById('edit-profile-desc').value;
		var icon = document.getElementById('edit-profile-icon').value;
		var color = document.getElementById('edit-profile-color').value;
		var priority = parseInt(document.getElementById('edit-profile-priority').value) || 5;
		var limit_down = parseInt(document.getElementById('edit-profile-limit-down').value) || 0;
		var limit_up = parseInt(document.getElementById('edit-profile-limit-up').value) || 0;
		var latency_mode = document.getElementById('edit-profile-latency').value;
		var isolate = document.getElementById('edit-profile-isolate').checked ? '1' : '0';

		API.updateProfile(profileId, name, description, icon, color, priority, limit_down, limit_up, latency_mode, '', isolate, '', '1').then(function(result) {
			if (result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Profile updated successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to update profile')), 'error');
			}
		});
	},

	deleteProfile: function(profile) {
		var self = this;
		if (!confirm(_('Delete profile "%s"? This will also remove all device assignments.').format(profile.name))) {
			return;
		}

		API.deleteProfile(profile.id).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Profile deleted')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to delete profile')), 'error');
			}
		});
	},

	cloneProfile: function(profile) {
		var self = this;
		var newName = prompt(_('Enter name for cloned profile:'), profile.name + ' (Copy)');
		if (!newName) return;

		API.cloneProfile(profile.id, newName).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Profile cloned successfully')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to clone profile')), 'error');
			}
		});
	},

	showAssignModal: function(profiles, clients) {
		var self = this;
		var inputStyle = 'width: 100%; padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);';

		var body = E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Select Device')),
				E('select', { 'id': 'assign-device', 'style': inputStyle },
					clients.map(function(client) {
						return E('option', { 'value': client.mac }, (client.hostname || 'Unknown') + ' (' + client.mac + ')');
					})
				)
			]),
			E('div', {}, [
				E('label', { 'style': 'display: block; margin-bottom: 6px; font-weight: 500;' }, _('Select Profile')),
				E('select', { 'id': 'assign-profile', 'style': inputStyle },
					profiles.map(function(profile) {
						var iconInfo = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag'];
						return E('option', { 'value': profile.id }, iconInfo.icon + ' ' + profile.name);
					})
				)
			])
		]);

		ui.showModal(_('Assign Profile to Device'), [
			body,
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() { self.assignProfile(); } }, _('Assign'))
			])
		]);
	},

	assignProfile: function() {
		var mac = document.getElementById('assign-device').value;
		var profileId = document.getElementById('assign-profile').value;

		API.assignProfileToDevice(mac, profileId, 0, 0).then(function(result) {
			if (result.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Profile assigned to device')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to assign profile')), 'error');
			}
		});
	},

	removeAssignment: function(mac) {
		if (!confirm(_('Remove profile assignment for this device?'))) {
			return;
		}

		API.removeProfileAssignment(mac).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', _('Assignment removed')), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', result.message || _('Failed to remove assignment')), 'error');
			}
		});
	},

	showProfileDetails: function(profile, assignments) {
		var iconInfo = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag'];

		var detailRows = [
			{ label: _('Priority'), value: String(profile.priority) },
			{ label: _('Download Limit'), value: profile.limit_down > 0 ? this.formatSpeed(profile.limit_down) : _('Unlimited') },
			{ label: _('Upload Limit'), value: profile.limit_up > 0 ? this.formatSpeed(profile.limit_up) : _('Unlimited') },
			{ label: _('Latency Mode'), value: profile.latency_mode || 'normal' },
			{ label: _('Network Isolation'), value: profile.isolate ? _('Yes') : _('No') },
			{ label: _('Assigned Devices'), value: String(assignments.length) }
		];

		var details = E('div', {}, [
			// Header
			E('div', { 'style': 'display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--kiss-line);' }, [
				E('div', {
					'style': 'width: 64px; height: 64px; background: var(--kiss-bg2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px;'
				}, iconInfo.icon),
				E('div', {}, [
					E('h3', { 'style': 'margin: 0 0 4px 0; font-size: 20px;' }, profile.name),
					E('p', { 'style': 'margin: 0; color: var(--kiss-muted);' }, profile.description || _('No description'))
				])
			]),

			// Details table
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
				detailRows.map(function(row) {
					return E('div', {
						'style': 'display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kiss-line);'
					}, [
						E('span', { 'style': 'color: var(--kiss-muted);' }, row.label),
						E('span', { 'style': 'font-weight: 500;' }, row.value)
					]);
				})
			)
		]);

		if (assignments.length > 0) {
			details.appendChild(E('h4', { 'style': 'margin: 20px 0 12px 0;' }, _('Assigned Devices:')));
			details.appendChild(E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' },
				assignments.map(function(a) {
					return E('div', {
						'style': 'padding: 8px 12px; background: var(--kiss-bg); border-radius: 6px; font-family: monospace; font-size: 13px;'
					}, (a.hostname || 'Unknown') + ' - ' + a.mac);
				})
			));
		}

		ui.showModal(_('Profile Details'), [
			details,
			E('div', { 'style': 'display: flex; justify-content: flex-end; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	formatSpeed: function(kbits) {
		if (kbits >= 1000000) {
			return (kbits / 1000000).toFixed(1) + ' Gbit/s';
		} else if (kbits >= 1000) {
			return (kbits / 1000).toFixed(1) + ' Mbit/s';
		}
		return kbits + ' kbit/s';
	}
});
