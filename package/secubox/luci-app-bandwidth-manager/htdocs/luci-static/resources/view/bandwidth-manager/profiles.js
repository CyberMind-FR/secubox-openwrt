'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require bandwidth-manager/api as API';

var PROFILE_ICONS = {
	'gamepad': { icon: '🎮', color: '#8b5cf6' },
	'play': { icon: '▶️', color: '#06b6d4' },
	'cpu': { icon: '🔌', color: '#10b981' },
	'briefcase': { icon: '💼', color: '#3b82f6' },
	'child': { icon: '👶', color: '#f59e0b' },
	'tag': { icon: '🏷️', color: '#6366f1' },
	'shield': { icon: '🛡️', color: '#ef4444' },
	'star': { icon: '⭐', color: '#eab308' },
	'home': { icon: '🏠', color: '#14b8a6' },
	'globe': { icon: '🌐', color: '#8b5cf6' }
};

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listProfiles(),
			API.getBuiltinProfiles(),
			API.listProfileAssignments(),
			API.getUsageRealtime(),
			API.listGroups()
		]);
	},

	render: function(data) {
		var profiles = (data[0] && data[0].profiles) || [];
		var builtinProfiles = (data[1] && data[1].profiles) || [];
		var assignments = (data[2] && data[2].assignments) || [];
		var clients = (data[3] && data[3].clients) || [];
		var groups = (data[4] && data[4].groups) || [];
		var self = this;

		var allProfiles = builtinProfiles.concat(profiles);

		var v = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('bandwidth-manager/dashboard.css') }),
			E('style', {}, this.getCustomStyles()),
			E('h2', {}, _('Device Profiles')),
			E('div', { 'class': 'cbi-map-descr' }, _('Create and manage device profiles with custom QoS settings, bandwidth limits, and latency modes'))
		]);

		// Quick Actions Bar
		var actionsBar = E('div', { 'class': 'profile-actions' }, [
			E('button', {
				'class': 'bw-btn bw-btn-primary',
				'click': function() { self.showCreateProfileModal(clients, groups); }
			}, [E('span', {}, '+'), ' ' + _('Create Profile')]),
			E('button', {
				'class': 'bw-btn bw-btn-secondary',
				'click': function() { self.showAssignModal(allProfiles, clients); }
			}, [E('span', {}, '📱'), ' ' + _('Assign to Device')])
		]);
		v.appendChild(actionsBar);

		// Profile Cards Grid
		var profilesGrid = E('div', { 'class': 'profiles-grid' });

		allProfiles.forEach(function(profile) {
			var iconInfo = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag'];
			var assignedCount = assignments.filter(function(a) {
				return a.profile === profile.id;
			}).length;

			var profileCard = E('div', {
				'class': 'profile-card' + (profile.builtin ? ' builtin' : ''),
				'style': '--profile-color: ' + (profile.color || iconInfo.color),
				'data-profile-id': profile.id
			}, [
				E('div', { 'class': 'profile-header' }, [
					E('div', { 'class': 'profile-icon' }, iconInfo.icon),
					E('div', { 'class': 'profile-info' }, [
						E('div', { 'class': 'profile-name' }, profile.name),
						E('div', { 'class': 'profile-desc' }, profile.description || _('No description'))
					]),
					profile.builtin ? E('span', { 'class': 'badge badge-info' }, _('Built-in')) : null
				]),
				E('div', { 'class': 'profile-stats' }, [
					E('div', { 'class': 'stat' }, [
						E('span', { 'class': 'stat-value' }, String(profile.priority)),
						E('span', { 'class': 'stat-label' }, _('Priority'))
					]),
					E('div', { 'class': 'stat' }, [
						E('span', { 'class': 'stat-value' }, profile.limit_down > 0 ? self.formatSpeed(profile.limit_down) : '∞'),
						E('span', { 'class': 'stat-label' }, _('Down'))
					]),
					E('div', { 'class': 'stat' }, [
						E('span', { 'class': 'stat-value' }, profile.limit_up > 0 ? self.formatSpeed(profile.limit_up) : '∞'),
						E('span', { 'class': 'stat-label' }, _('Up'))
					]),
					E('div', { 'class': 'stat' }, [
						E('span', { 'class': 'stat-value' }, String(assignedCount)),
						E('span', { 'class': 'stat-label' }, _('Devices'))
					])
				]),
				E('div', { 'class': 'profile-features' }, [
					profile.latency_mode === 'ultra' ? E('span', { 'class': 'feature-badge' }, '⚡ ' + _('Ultra Low Latency')) : null,
					profile.isolate ? E('span', { 'class': 'feature-badge warning' }, '🔒 ' + _('Isolated')) : null,
					profile.content_filter ? E('span', { 'class': 'feature-badge' }, '🛡️ ' + _('Filtered')) : null
				].filter(Boolean)),
				E('div', { 'class': 'profile-actions-row' }, [
					E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm',
						'click': function() { self.showProfileDetails(profile, assignments.filter(function(a) { return a.profile === profile.id; })); }
					}, _('View')),
					!profile.builtin ? E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm',
						'click': function() { self.showEditProfileModal(profile); }
					}, _('Edit')) : null,
					E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm',
						'click': function() { self.cloneProfile(profile); }
					}, _('Clone')),
					!profile.builtin ? E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm btn-danger',
						'click': function() { self.deleteProfile(profile); }
					}, _('Delete')) : null
				].filter(Boolean))
			]);

			profilesGrid.appendChild(profileCard);
		});

		v.appendChild(profilesGrid);

		// Assigned Devices Section
		if (assignments.length > 0) {
			var assignmentsSection = E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Device Assignments')),
				E('div', { 'class': 'assignments-list' })
			]);

			var assignmentsList = assignmentsSection.querySelector('.assignments-list');

			assignments.forEach(function(assignment) {
				var profile = allProfiles.find(function(p) { return p.id === assignment.profile; });
				var iconInfo = profile ? (PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag']) : PROFILE_ICONS['tag'];

				assignmentsList.appendChild(E('div', { 'class': 'assignment-item' }, [
					E('div', { 'class': 'device-info' }, [
						E('div', { 'class': 'device-name' }, assignment.hostname || assignment.mac),
						E('div', { 'class': 'device-mac' }, assignment.mac),
						assignment.ip ? E('div', { 'class': 'device-ip' }, assignment.ip) : null
					]),
					E('div', { 'class': 'assignment-profile', 'style': '--profile-color: ' + (profile ? profile.color : '#6366f1') }, [
						E('span', { 'class': 'profile-icon-sm' }, iconInfo.icon),
						E('span', {}, assignment.profile_name || assignment.profile)
					]),
					E('button', {
						'class': 'bw-btn bw-btn-secondary btn-sm',
						'click': function() { self.removeAssignment(assignment.mac); }
					}, '✕')
				]));
			});

			v.appendChild(assignmentsSection);
		}

		return v;
	},

	showCreateProfileModal: function(clients, groups) {
		var self = this;

		var body = E('div', { 'class': 'profile-form' }, [
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Profile Name')),
				E('input', { 'type': 'text', 'id': 'profile-name', 'class': 'cbi-input-text', 'placeholder': _('e.g., Gaming PC') })
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Description')),
				E('input', { 'type': 'text', 'id': 'profile-desc', 'class': 'cbi-input-text', 'placeholder': _('Optional description') })
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Icon')),
					E('select', { 'id': 'profile-icon', 'class': 'cbi-input-select' },
						Object.keys(PROFILE_ICONS).map(function(key) {
							return E('option', { 'value': key }, PROFILE_ICONS[key].icon + ' ' + key);
						})
					)
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Color')),
					E('input', { 'type': 'color', 'id': 'profile-color', 'value': '#8b5cf6' })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Priority (1-8, lower = higher priority)')),
				E('input', { 'type': 'number', 'id': 'profile-priority', 'class': 'cbi-input-text', 'min': '1', 'max': '8', 'value': '5' })
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Download Limit (kbit/s, 0 = unlimited)')),
					E('input', { 'type': 'number', 'id': 'profile-limit-down', 'class': 'cbi-input-text', 'min': '0', 'value': '0' })
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Upload Limit (kbit/s, 0 = unlimited)')),
					E('input', { 'type': 'number', 'id': 'profile-limit-up', 'class': 'cbi-input-text', 'min': '0', 'value': '0' })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Latency Mode')),
				E('select', { 'id': 'profile-latency', 'class': 'cbi-input-select' }, [
					E('option', { 'value': 'normal' }, _('Normal')),
					E('option', { 'value': 'low' }, _('Low Latency')),
					E('option', { 'value': 'ultra' }, _('Ultra Low Latency (Gaming)'))
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, [
					E('input', { 'type': 'checkbox', 'id': 'profile-isolate' }),
					' ' + _('Network Isolation (block LAN communication)')
				])
			])
		]);

		ui.showModal(_('Create New Profile'), [
			body,
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.createProfile(); }
				}, _('Create Profile'))
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

		var body = E('div', { 'class': 'profile-form' }, [
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Profile Name')),
				E('input', { 'type': 'text', 'id': 'edit-profile-name', 'class': 'cbi-input-text', 'value': profile.name })
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Description')),
				E('input', { 'type': 'text', 'id': 'edit-profile-desc', 'class': 'cbi-input-text', 'value': profile.description || '' })
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Icon')),
					E('select', { 'id': 'edit-profile-icon', 'class': 'cbi-input-select' },
						Object.keys(PROFILE_ICONS).map(function(key) {
							return E('option', { 'value': key, 'selected': key === profile.icon }, PROFILE_ICONS[key].icon + ' ' + key);
						})
					)
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Color')),
					E('input', { 'type': 'color', 'id': 'edit-profile-color', 'value': profile.color || '#8b5cf6' })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Priority (1-8)')),
				E('input', { 'type': 'number', 'id': 'edit-profile-priority', 'class': 'cbi-input-text', 'min': '1', 'max': '8', 'value': String(profile.priority) })
			]),
			E('div', { 'class': 'form-row' }, [
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Download Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'edit-profile-limit-down', 'class': 'cbi-input-text', 'min': '0', 'value': String(profile.limit_down) })
				]),
				E('div', { 'class': 'form-group half' }, [
					E('label', {}, _('Upload Limit (kbit/s)')),
					E('input', { 'type': 'number', 'id': 'edit-profile-limit-up', 'class': 'cbi-input-text', 'min': '0', 'value': String(profile.limit_up) })
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Latency Mode')),
				E('select', { 'id': 'edit-profile-latency', 'class': 'cbi-input-select' }, [
					E('option', { 'value': 'normal', 'selected': profile.latency_mode === 'normal' }, _('Normal')),
					E('option', { 'value': 'low', 'selected': profile.latency_mode === 'low' }, _('Low Latency')),
					E('option', { 'value': 'ultra', 'selected': profile.latency_mode === 'ultra' }, _('Ultra Low Latency'))
				])
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, [
					E('input', { 'type': 'checkbox', 'id': 'edit-profile-isolate', 'checked': profile.isolate }),
					' ' + _('Network Isolation')
				])
			])
		]);

		ui.showModal(_('Edit Profile: ') + profile.name, [
			body,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.updateProfile(profile.id); }
				}, _('Save Changes'))
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

		var body = E('div', { 'class': 'assign-form' }, [
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Select Device')),
				E('select', { 'id': 'assign-device', 'class': 'cbi-input-select' },
					clients.map(function(client) {
						return E('option', { 'value': client.mac }, (client.hostname || 'Unknown') + ' (' + client.mac + ')');
					})
				)
			]),
			E('div', { 'class': 'form-group' }, [
				E('label', {}, _('Select Profile')),
				E('select', { 'id': 'assign-profile', 'class': 'cbi-input-select' },
					profiles.map(function(profile) {
						var iconInfo = PROFILE_ICONS[profile.icon] || PROFILE_ICONS['tag'];
						return E('option', { 'value': profile.id }, iconInfo.icon + ' ' + profile.name);
					})
				)
			])
		]);

		ui.showModal(_('Assign Profile to Device'), [
			body,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-action',
					'click': function() { self.assignProfile(); }
				}, _('Assign'))
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

		var details = E('div', { 'class': 'profile-details' }, [
			E('div', { 'class': 'detail-header', 'style': '--profile-color: ' + (profile.color || iconInfo.color) }, [
				E('span', { 'class': 'profile-icon-lg' }, iconInfo.icon),
				E('div', {}, [
					E('h3', {}, profile.name),
					E('p', {}, profile.description || _('No description'))
				])
			]),
			E('table', { 'class': 'table' }, [
				E('tr', {}, [E('td', {}, _('Priority')), E('td', {}, String(profile.priority))]),
				E('tr', {}, [E('td', {}, _('Download Limit')), E('td', {}, profile.limit_down > 0 ? this.formatSpeed(profile.limit_down) : _('Unlimited'))]),
				E('tr', {}, [E('td', {}, _('Upload Limit')), E('td', {}, profile.limit_up > 0 ? this.formatSpeed(profile.limit_up) : _('Unlimited'))]),
				E('tr', {}, [E('td', {}, _('Latency Mode')), E('td', {}, profile.latency_mode)]),
				E('tr', {}, [E('td', {}, _('Network Isolation')), E('td', {}, profile.isolate ? _('Yes') : _('No'))]),
				E('tr', {}, [E('td', {}, _('Assigned Devices')), E('td', {}, String(assignments.length))])
			])
		]);

		if (assignments.length > 0) {
			details.appendChild(E('h4', {}, _('Assigned Devices:')));
			var deviceList = E('ul', { 'class': 'device-list' });
			assignments.forEach(function(a) {
				deviceList.appendChild(E('li', {}, (a.hostname || 'Unknown') + ' - ' + a.mac));
			});
			details.appendChild(deviceList);
		}

		ui.showModal(_('Profile Details'), [
			details,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
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
	},

	getCustomStyles: function() {
		return `
			.profile-actions { margin-bottom: 20px; display: flex; gap: 12px; }
			.profiles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px; }
			.profile-card { background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 12px; padding: 20px; position: relative; overflow: hidden; transition: all 0.2s; }
			.profile-card::before { content: ""; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--profile-color, #8b5cf6); }
			.profile-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2); }
			.profile-card.builtin { border-style: dashed; }
			.profile-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
			.profile-icon { font-size: 32px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(139, 92, 246, 0.1); border-radius: 12px; }
			.profile-info { flex: 1; }
			.profile-name { font-size: 18px; font-weight: 600; color: #fff; }
			.profile-desc { font-size: 13px; color: #999; margin-top: 4px; }
			.profile-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; padding: 12px; background: var(--bw-dark, #0a0a0f); border-radius: 8px; }
			.stat { text-align: center; }
			.stat-value { display: block; font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
			.stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
			.profile-features { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; min-height: 28px; }
			.feature-badge { font-size: 11px; padding: 4px 8px; background: rgba(139, 92, 246, 0.2); color: #a78bfa; border-radius: 4px; }
			.feature-badge.warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
			.profile-actions-row { display: flex; gap: 8px; flex-wrap: wrap; }
			.btn-sm { padding: 6px 12px; font-size: 12px; }
			.btn-danger { color: #ef4444; }
			.btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
			.badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; text-transform: uppercase; font-weight: 600; }
			.badge-info { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
			.assignments-list { display: grid; gap: 12px; }
			.assignment-item { display: flex; align-items: center; justify-content: space-between; background: var(--bw-light, #15151a); border: 1px solid var(--bw-border, #25252f); border-radius: 8px; padding: 12px 16px; }
			.device-info { flex: 1; }
			.device-name { font-weight: 600; color: #fff; }
			.device-mac { font-family: monospace; font-size: 12px; color: #666; }
			.device-ip { font-size: 12px; color: #999; }
			.assignment-profile { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(139, 92, 246, 0.1); border-radius: 6px; margin: 0 12px; }
			.profile-icon-sm { font-size: 16px; }
			.form-group { margin-bottom: 16px; }
			.form-group label { display: block; margin-bottom: 6px; font-weight: 500; color: #ccc; }
			.form-row { display: flex; gap: 16px; }
			.form-group.half { flex: 1; }
			.profile-details .detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--bw-border, #25252f); }
			.profile-icon-lg { font-size: 48px; }
			.device-list { list-style: none; padding: 0; margin: 0; }
			.device-list li { padding: 8px 12px; background: var(--bw-dark, #0a0a0f); border-radius: 4px; margin-bottom: 8px; font-family: monospace; font-size: 13px; }
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
