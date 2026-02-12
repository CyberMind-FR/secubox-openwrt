'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callListGroups = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'list_groups',
	expect: { groups: [] }
});

var callGetGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_group',
	params: ['group_id'],
	expect: { success: false }
});

var callCreateGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'create_group',
	params: ['name', 'description', 'quota_mb', 'priority', 'members'],
	expect: { success: false, message: '' }
});

var callUpdateGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'update_group',
	params: ['group_id', 'name', 'description', 'quota_mb', 'priority', 'members'],
	expect: { success: false, message: '' }
});

var callDeleteGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'delete_group',
	params: ['group_id'],
	expect: { success: false, message: '' }
});

var callAddToGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'add_to_group',
	params: ['group_id', 'mac'],
	expect: { success: false, message: '' }
});

var callRemoveFromGroup = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'remove_from_group',
	params: ['group_id', 'mac'],
	expect: { success: false, message: '' }
});

var callGetUsageRealtime = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_usage_realtime',
	expect: { clients: [] }
});

var callGetClasses = rpc.declare({
	object: 'luci.bandwidth-manager',
	method: 'get_classes',
	expect: { classes: [] }
});

return view.extend({
	groups: [],
	clients: [],
	classes: [],

	load: function() {
		return Promise.all([
			callListGroups(),
			callGetUsageRealtime(),
			callGetClasses()
		]);
	},

	render: function(data) {
		var self = this;
		this.groups = (data[0] && data[0].groups) || [];
		this.clients = (data[1] && data[1].clients) || [];
		this.classes = (data[2] && data[2].classes) || [];

		document.body.setAttribute('data-secubox-app', 'bandwidth');

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', { 'class': 'cbi-map-title' }, 'Device Groups'),
			E('div', { 'class': 'cbi-map-descr' },
				'Organize devices into groups for shared quotas and unified QoS policies'),

			// Create Group Button
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'click': function() { self.showCreateGroupDialog(); }
				}, 'Create New Group')
			]),

			// Groups Grid
			E('div', { 'id': 'groups-container' }, [
				this.renderGroupsGrid()
			])
		]);

		poll.add(L.bind(this.pollData, this), 15);

		return KissTheme.wrap([view], 'admin/services/bandwidth-manager/groups');
	},

	pollData: function() {
		var self = this;
		return callListGroups().then(function(data) {
			self.groups = (data && data.groups) || [];
			var container = document.getElementById('groups-container');
			if (container) {
				container.innerHTML = '';
				container.appendChild(self.renderGroupsGrid());
			}
		});
	},

	renderGroupsGrid: function() {
		var self = this;

		if (this.groups.length === 0) {
			return E('div', {
				'style': 'padding: 3rem; text-align: center; color: var(--cyber-text-secondary, #a1a1aa); background: var(--cyber-bg-secondary, #141419); border-radius: 12px; border: 1px dashed var(--cyber-border-subtle, rgba(255,255,255,0.15));'
			}, [
				E('div', { 'style': 'font-size: 3rem; margin-bottom: 1rem;' }, '\ud83d\udc65'),
				E('div', { 'style': 'font-weight: 600; margin-bottom: 0.5rem;' }, 'No Groups Created'),
				E('div', { 'style': 'font-size: 0.875rem;' }, 'Create device groups to apply shared quotas and priorities'),
				E('br'),
				E('button', {
					'class': 'cbi-button cbi-button-add',
					'click': function() { self.showCreateGroupDialog(); }
				}, 'Create First Group')
			]);
		}

		var presetIcons = {
			'Family': '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66',
			'IoT': '\ud83d\udce1',
			'Work': '\ud83d\udcbc',
			'Gaming': '\ud83c\udfae',
			'Kids': '\ud83d\udc76',
			'Guests': '\ud83d\udc64'
		};

		var presetColors = {
			'Family': '#8b5cf6',
			'IoT': '#06b6d4',
			'Work': '#3b82f6',
			'Gaming': '#ec4899',
			'Kids': '#22c55e',
			'Guests': '#f59e0b'
		};

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;'
		}, this.groups.map(function(group) {
			var icon = presetIcons[group.name] || '\ud83d\udc65';
			var color = presetColors[group.name] || '#667eea';

			var usagePercent = 0;
			if (group.quota_mb && group.quota_mb > 0) {
				usagePercent = Math.min(100, Math.round((group.used_mb / group.quota_mb) * 100));
			}

			var progressColor = usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : '#22c55e';

			return E('div', {
				'style': 'background: var(--cyber-bg-secondary, #141419); border: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08)); border-radius: 12px; overflow: hidden; transition: all 0.2s ease;'
			}, [
				// Header
				E('div', {
					'style': 'padding: 1.25rem; border-bottom: 1px solid var(--cyber-border-subtle, rgba(255,255,255,0.08));'
				}, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;' }, [
						E('div', {
							'style': 'width: 44px; height: 44px; background: ' + color + '20; color: ' + color + '; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;'
						}, icon),
						E('div', { 'style': 'flex: 1;' }, [
							E('div', { 'style': 'font-weight: 600; font-size: 1rem;' }, group.name),
							E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary, #71717a);' },
								group.description || 'No description')
						]),
						E('span', {
							'style': 'padding: 0.25rem 0.5rem; font-size: 0.6875rem; font-weight: 600; border-radius: 4px; background: ' + (group.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)') + '; color: ' + (group.enabled ? '#22c55e' : '#ef4444') + ';'
						}, group.enabled ? 'Active' : 'Disabled')
					])
				]),

				// Stats
				E('div', { 'style': 'padding: 1rem 1.25rem;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 1rem;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 1.5rem; font-weight: 700;' }, group.member_count.toString()),
							E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-secondary);' }, 'Devices')
						]),
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 1.5rem; font-weight: 700;' }, 'P' + (group.priority || 5)),
							E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-secondary);' }, 'Priority')
						]),
						E('div', { 'style': 'text-align: right;' }, [
							E('div', { 'style': 'font-size: 1.5rem; font-weight: 700;' },
								group.quota_mb > 0 ? self.formatMB(group.quota_mb) : '\u221e'),
							E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-secondary);' }, 'Quota')
						])
					]),

					// Usage Progress
					group.quota_mb > 0 ? E('div', { 'style': 'margin-bottom: 0.5rem;' }, [
						E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.25rem;' }, [
							E('span', { 'style': 'color: var(--cyber-text-secondary);' }, 'Usage'),
							E('span', {}, self.formatMB(group.used_mb) + ' / ' + self.formatMB(group.quota_mb) + ' (' + usagePercent + '%)')
						]),
						E('div', {
							'style': 'height: 6px; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.05)); border-radius: 3px; overflow: hidden;'
						}, [
							E('div', {
								'style': 'height: 100%; width: ' + usagePercent + '%; background: ' + progressColor + '; transition: width 0.3s ease;'
							})
						])
					]) : null
				]),

				// Actions
				E('div', {
					'style': 'padding: 0.75rem 1.25rem; background: var(--cyber-bg-tertiary, rgba(255,255,255,0.03)); display: flex; gap: 0.5rem;'
				}, [
					E('button', {
						'class': 'cbi-button',
						'style': 'flex: 1; font-size: 0.75rem;',
						'click': function() { self.showGroupDetails(group.id); }
					}, 'Manage'),
					E('button', {
						'class': 'cbi-button',
						'style': 'flex: 1; font-size: 0.75rem;',
						'click': function() { self.showEditGroupDialog(group); }
					}, 'Edit'),
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'style': 'font-size: 0.75rem;',
						'click': function() { self.deleteGroup(group); }
					}, '\u2717')
				])
			]);
		}));
	},

	showCreateGroupDialog: function() {
		var self = this;

		var presets = [
			{ name: 'Family', desc: 'Family members devices', icon: '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66' },
			{ name: 'IoT', desc: 'Smart home devices', icon: '\ud83d\udce1' },
			{ name: 'Work', desc: 'Work/business devices', icon: '\ud83d\udcbc' },
			{ name: 'Gaming', desc: 'Gaming consoles and PCs', icon: '\ud83c\udfae' },
			{ name: 'Kids', desc: 'Children\'s devices', icon: '\ud83d\udc76' },
			{ name: 'Guests', desc: 'Guest network devices', icon: '\ud83d\udc64' }
		];

		ui.showModal('Create Device Group', [
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem; font-weight: 500;' }, 'Quick Presets'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 0.5rem;' },
					presets.map(function(preset) {
						return E('button', {
							'class': 'cbi-button',
							'style': 'display: flex; align-items: center; gap: 0.5rem;',
							'click': function() {
								document.getElementById('group-name').value = preset.name;
								document.getElementById('group-desc').value = preset.desc;
							}
						}, [preset.icon, ' ', preset.name]);
					})
				)
			]),
			E('hr', { 'style': 'margin: 1rem 0; border-color: var(--cyber-border-subtle);' }),
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Group Name *'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'group-name',
					'placeholder': 'Enter group name'
				})
			]),
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Description'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'group-desc',
					'placeholder': 'Optional description'
				})
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Shared Quota (MB)'),
					E('input', {
						'type': 'number',
						'class': 'cbi-input-text',
						'id': 'group-quota',
						'value': '0',
						'min': '0',
						'placeholder': '0 = unlimited'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Priority Class'),
					E('select', { 'class': 'cbi-input-select', 'id': 'group-priority' },
						this.classes.map(function(c) {
							return E('option', { 'value': c.priority, 'selected': c.priority === 5 }, c.priority + ' - ' + c.name);
						})
					)
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var name = document.getElementById('group-name').value.trim();
						var desc = document.getElementById('group-desc').value.trim();
						var quota = parseInt(document.getElementById('group-quota').value) || 0;
						var priority = parseInt(document.getElementById('group-priority').value) || 5;

						if (!name) {
							ui.addNotification(null, E('p', {}, 'Group name is required'), 'error');
							return;
						}

						ui.hideModal();
						callCreateGroup(name, desc, quota, priority, '').then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Group created successfully'), 'success');
								self.pollData();
							} else {
								ui.addNotification(null, E('p', {}, res.message || 'Failed to create group'), 'error');
							}
						});
					}
				}, 'Create Group')
			])
		]);
	},

	showEditGroupDialog: function(group) {
		var self = this;

		ui.showModal('Edit Group: ' + group.name, [
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Group Name *'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'edit-group-name',
					'value': group.name
				})
			]),
			E('div', { 'style': 'margin-bottom: 1rem;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Description'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'edit-group-desc',
					'value': group.description || ''
				})
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Shared Quota (MB)'),
					E('input', {
						'type': 'number',
						'class': 'cbi-input-text',
						'id': 'edit-group-quota',
						'value': group.quota_mb || '0',
						'min': '0'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 0.5rem;' }, 'Priority Class'),
					E('select', { 'class': 'cbi-input-select', 'id': 'edit-group-priority' },
						this.classes.map(function(c) {
							return E('option', {
								'value': c.priority,
								'selected': c.priority === (group.priority || 5)
							}, c.priority + ' - ' + c.name);
						})
					)
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var name = document.getElementById('edit-group-name').value.trim();
						var desc = document.getElementById('edit-group-desc').value.trim();
						var quota = parseInt(document.getElementById('edit-group-quota').value) || 0;
						var priority = parseInt(document.getElementById('edit-group-priority').value) || 5;

						if (!name) {
							ui.addNotification(null, E('p', {}, 'Group name is required'), 'error');
							return;
						}

						ui.hideModal();
						callUpdateGroup(group.id, name, desc, quota, priority, '').then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Group updated successfully'), 'success');
								self.pollData();
							} else {
								ui.addNotification(null, E('p', {}, res.message || 'Failed to update group'), 'error');
							}
						});
					}
				}, 'Save Changes')
			])
		]);
	},

	showGroupDetails: function(groupId) {
		var self = this;

		callGetGroup(groupId).then(function(group) {
			if (!group.success) {
				ui.addNotification(null, E('p', {}, 'Failed to load group details'), 'error');
				return;
			}

			var members = group.members || [];
			var availableClients = self.clients.filter(function(c) {
				return !members.some(function(m) { return m.mac.toLowerCase() === c.mac.toLowerCase(); });
			});

			ui.showModal('Manage Group: ' + group.name, [
				E('h4', { 'style': 'margin-bottom: 1rem;' }, 'Group Members (' + members.length + ')'),

				members.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; margin-bottom: 1rem;' }, [
						E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Device'),
									E('th', {}, 'IP'),
									E('th', {}, 'Usage'),
									E('th', {}, 'Action')
								])
							]),
							E('tbody', {},
								members.map(function(member) {
									return E('tr', {}, [
										E('td', {}, [
											E('div', { 'style': 'font-weight: 500;' }, member.hostname || 'Unknown'),
											E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' }, member.mac)
										]),
										E('td', {}, member.ip || '-'),
										E('td', {}, self.formatMB(member.used_mb || 0)),
										E('td', {}, [
											E('button', {
												'class': 'cbi-button cbi-button-negative',
												'style': 'font-size: 0.75rem; padding: 0.25rem 0.5rem;',
												'click': function() {
													callRemoveFromGroup(groupId, member.mac).then(function(res) {
														if (res.success) {
															ui.hideModal();
															self.showGroupDetails(groupId);
															self.pollData();
														}
													});
												}
											}, 'Remove')
										])
									]);
								})
							)
						])
					]) :
					E('div', {
						'style': 'padding: 1rem; text-align: center; color: var(--cyber-text-secondary); background: var(--cyber-bg-tertiary); border-radius: 8px; margin-bottom: 1rem;'
					}, 'No devices in this group'),

				E('h4', { 'style': 'margin-bottom: 1rem;' }, 'Add Devices'),

				availableClients.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; margin-bottom: 1rem;' }, [
						E('table', { 'class': 'table', 'style': 'width: 100%;' }, [
							E('thead', {}, [
								E('tr', {}, [
									E('th', {}, 'Device'),
									E('th', {}, 'IP'),
									E('th', {}, 'Action')
								])
							]),
							E('tbody', {},
								availableClients.map(function(client) {
									return E('tr', {}, [
										E('td', {}, [
											E('div', { 'style': 'font-weight: 500;' }, client.hostname || 'Unknown'),
											E('div', { 'style': 'font-size: 0.75rem; color: var(--cyber-text-tertiary);' }, client.mac)
										]),
										E('td', {}, client.ip || '-'),
										E('td', {}, [
											E('button', {
												'class': 'cbi-button cbi-button-positive',
												'style': 'font-size: 0.75rem; padding: 0.25rem 0.5rem;',
												'click': function() {
													callAddToGroup(groupId, client.mac).then(function(res) {
														if (res.success) {
															ui.hideModal();
															self.showGroupDetails(groupId);
															self.pollData();
														}
													});
												}
											}, 'Add')
										])
									]);
								})
							)
						])
					]) :
					E('div', {
						'style': 'padding: 1rem; text-align: center; color: var(--cyber-text-secondary); background: var(--cyber-bg-tertiary); border-radius: 8px; margin-bottom: 1rem;'
					}, 'No available devices to add'),

				E('div', { 'class': 'right' }, [
					E('button', {
						'class': 'cbi-button',
						'click': ui.hideModal
					}, 'Close')
				])
			]);
		});
	},

	deleteGroup: function(group) {
		var self = this;

		ui.showModal('Delete Group', [
			E('p', {}, 'Are you sure you want to delete the group "' + group.name + '"?'),
			E('p', { 'style': 'color: var(--cyber-text-secondary);' },
				'This will not affect the devices in the group.'),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						callDeleteGroup(group.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, 'Group deleted'), 'success');
								self.pollData();
							} else {
								ui.addNotification(null, E('p', {}, res.message || 'Failed to delete group'), 'error');
							}
						});
					}
				}, 'Delete')
			])
		]);
	},

	formatMB: function(mb) {
		if (!mb || mb === 0) return '0 MB';
		if (mb >= 1024) {
			return (mb / 1024).toFixed(1) + ' GB';
		}
		return mb + ' MB';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
