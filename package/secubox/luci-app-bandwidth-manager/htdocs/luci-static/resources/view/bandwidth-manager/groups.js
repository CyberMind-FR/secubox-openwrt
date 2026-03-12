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
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

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

	renderStats: function() {
		var c = KissTheme.colors;
		var totalMembers = this.groups.reduce(function(sum, g) { return sum + (g.member_count || 0); }, 0);
		var activeGroups = this.groups.filter(function(g) { return g.enabled; }).length;

		return [
			KissTheme.stat(this.groups.length, 'Total Groups', c.blue),
			KissTheme.stat(activeGroups, 'Active', c.green),
			KissTheme.stat(totalMembers, 'Total Members', c.purple),
			KissTheme.stat(this.clients.length, 'Online Clients', c.cyan)
		];
	},

	renderGroupsGrid: function() {
		var self = this;

		if (this.groups.length === 0) {
			return E('div', {
				'style': 'padding: 40px; text-align: center; color: var(--kiss-muted); background: var(--kiss-bg); border-radius: 10px; border: 1px dashed var(--kiss-line);'
			}, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '\ud83d\udc65'),
				E('div', { 'style': 'font-weight: 600; margin-bottom: 8px;' }, 'No Groups Created'),
				E('div', { 'style': 'font-size: 13px; margin-bottom: 20px;' }, 'Create device groups to apply shared quotas and priorities'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;'
		}, this.groups.map(function(group) {
			var icon = presetIcons[group.name] || '\ud83d\udc65';
			var usagePercent = 0;
			if (group.quota_mb && group.quota_mb > 0) {
				usagePercent = Math.min(100, Math.round((group.used_mb / group.quota_mb) * 100));
			}
			var progressColor = usagePercent > 90 ? 'var(--kiss-red)' : usagePercent > 70 ? 'var(--kiss-orange)' : 'var(--kiss-green)';

			return E('div', {
				'style': 'background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 10px; overflow: hidden;'
			}, [
				// Header
				E('div', { 'style': 'padding: 16px; border-bottom: 1px solid var(--kiss-line);' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
						E('div', {
							'style': 'width: 40px; height: 40px; background: var(--kiss-bg); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;'
						}, icon),
						E('div', { 'style': 'flex: 1;' }, [
							E('div', { 'style': 'font-weight: 600;' }, group.name),
							E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, group.description || 'No description')
						]),
						group.enabled ? KissTheme.badge('Active', 'green') : KissTheme.badge('Disabled', 'red')
					])
				]),

				// Stats
				E('div', { 'style': 'padding: 16px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 16px;' }, [
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 24px; font-weight: 700;' }, String(group.member_count)),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Devices')
						]),
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 24px; font-weight: 700;' }, 'P' + (group.priority || 5)),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Priority')
						]),
						E('div', { 'style': 'text-align: center;' }, [
							E('div', { 'style': 'font-size: 24px; font-weight: 700;' }, group.quota_mb > 0 ? self.formatMB(group.quota_mb) : '\u221e'),
							E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Quota')
						])
					]),

					// Usage Progress
					group.quota_mb > 0 ? E('div', {}, [
						E('div', { 'style': 'display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;' }, [
							E('span', { 'style': 'color: var(--kiss-muted);' }, 'Usage'),
							E('span', {}, self.formatMB(group.used_mb) + ' / ' + self.formatMB(group.quota_mb) + ' (' + usagePercent + '%)')
						]),
						E('div', {
							'style': 'height: 6px; background: var(--kiss-bg); border-radius: 3px; overflow: hidden;'
						}, [
							E('div', {
								'style': 'height: 100%; width: ' + usagePercent + '%; background: ' + progressColor + ';'
							})
						])
					]) : ''
				]),

				// Actions
				E('div', { 'style': 'padding: 12px 16px; background: var(--kiss-bg); display: flex; gap: 8px;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'flex: 1; font-size: 12px;',
						'click': function() { self.showGroupDetails(group.id); }
					}, 'Manage'),
					E('button', {
						'class': 'kiss-btn',
						'style': 'flex: 1; font-size: 12px;',
						'click': function() { self.showEditGroupDialog(group); }
					}, 'Edit'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'font-size: 12px; padding: 6px 12px;',
						'click': function() { self.deleteGroup(group); }
					}, '\u2717')
				])
			]);
		}));
	},

	render: function(data) {
		var self = this;
		this.groups = (data[0] && data[0].groups) || [];
		this.clients = (data[1] && data[1].clients) || [];
		this.classes = (data[2] && data[2].classes) || [];

		poll.add(L.bind(this.pollData, this), 15);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Device Groups'),
					KissTheme.badge(this.groups.length + ' groups', 'blue'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'margin-left: auto;',
						'click': function() { self.showCreateGroupDialog(); }
					}, 'Create Group')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Organize devices into groups for shared quotas and unified QoS policies')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'groups-stats', 'style': 'margin: 20px 0;' },
				this.renderStats()),

			// Groups Grid
			E('div', { 'id': 'groups-container' }, [
				this.renderGroupsGrid()
			])
		];

		return KissTheme.wrap(content, 'admin/services/bandwidth-manager/groups');
	},

	pollData: function() {
		var self = this;
		return callListGroups().then(function(data) {
			self.groups = (data && data.groups) || [];
			var container = document.getElementById('groups-container');
			var statsContainer = document.getElementById('groups-stats');
			if (container) {
				dom.content(container, self.renderGroupsGrid());
			}
			if (statsContainer) {
				dom.content(statsContainer, self.renderStats());
			}
		});
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
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 8px; font-weight: 500;' }, 'Quick Presets'),
				E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 8px;' },
					presets.map(function(preset) {
						return E('button', {
							'class': 'kiss-btn',
							'style': 'display: flex; align-items: center; gap: 6px;',
							'click': function() {
								document.getElementById('group-name').value = preset.name;
								document.getElementById('group-desc').value = preset.desc;
							}
						}, [preset.icon, ' ', preset.name]);
					})
				)
			]),
			E('hr', { 'style': 'margin: 16px 0; border-color: var(--kiss-line);' }),
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Group Name *'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'group-name',
					'placeholder': 'Enter group name',
					'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Description'),
				E('input', {
					'type': 'text',
					'class': 'cbi-input-text',
					'id': 'group-desc',
					'placeholder': 'Optional description',
					'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Shared Quota (MB)'),
					E('input', {
						'type': 'number',
						'id': 'group-quota',
						'value': '0',
						'min': '0',
						'placeholder': '0 = unlimited',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Priority Class'),
					E('select', {
						'id': 'group-priority',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					}, this.classes.map(function(c) {
						return E('option', { 'value': c.priority, 'selected': c.priority === 5 }, c.priority + ' - ' + c.name);
					}))
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Group Name *'),
				E('input', {
					'type': 'text',
					'id': 'edit-group-name',
					'value': group.name,
					'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'margin-bottom: 16px;' }, [
				E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Description'),
				E('input', {
					'type': 'text',
					'id': 'edit-group-desc',
					'value': group.description || '',
					'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
				})
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;' }, [
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Shared Quota (MB)'),
					E('input', {
						'type': 'number',
						'id': 'edit-group-quota',
						'value': group.quota_mb || '0',
						'min': '0',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					})
				]),
				E('div', {}, [
					E('label', { 'style': 'display: block; margin-bottom: 6px;' }, 'Priority Class'),
					E('select', {
						'id': 'edit-group-priority',
						'style': 'width: 100%; padding: 8px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);'
					}, this.classes.map(function(c) {
						return E('option', {
							'value': c.priority,
							'selected': c.priority === (group.priority || 5)
						}, c.priority + ' - ' + c.name);
					}))
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
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
				E('h4', { 'style': 'margin-bottom: 16px;' }, 'Group Members (' + members.length + ')'),

				members.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; margin-bottom: 16px;' }, [
						E('table', { 'class': 'kiss-table' }, [
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
											E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, member.mac)
										]),
										E('td', {}, member.ip || '-'),
										E('td', {}, self.formatMB(member.used_mb || 0)),
										E('td', {}, [
											E('button', {
												'class': 'kiss-btn kiss-btn-red',
												'style': 'font-size: 11px; padding: 4px 8px;',
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
						'style': 'padding: 16px; text-align: center; color: var(--kiss-muted); background: var(--kiss-bg); border-radius: 8px; margin-bottom: 16px;'
					}, 'No devices in this group'),

				E('h4', { 'style': 'margin-bottom: 16px;' }, 'Add Devices'),

				availableClients.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; margin-bottom: 16px;' }, [
						E('table', { 'class': 'kiss-table' }, [
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
											E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, client.mac)
										]),
										E('td', {}, client.ip || '-'),
										E('td', {}, [
											E('button', {
												'class': 'kiss-btn kiss-btn-green',
												'style': 'font-size: 11px; padding: 4px 8px;',
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
						'style': 'padding: 16px; text-align: center; color: var(--kiss-muted); background: var(--kiss-bg); border-radius: 8px; margin-bottom: 16px;'
					}, 'No available devices to add'),

				E('div', { 'style': 'display: flex; justify-content: flex-end;' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Close')
				])
			]);
		});
	},

	deleteGroup: function(group) {
		var self = this;

		ui.showModal('Delete Group', [
			E('p', {}, 'Are you sure you want to delete the group "' + group.name + '"?'),
			E('p', { 'style': 'color: var(--kiss-muted);' }, 'This will not affect the devices in the group.'),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
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
	}
});
