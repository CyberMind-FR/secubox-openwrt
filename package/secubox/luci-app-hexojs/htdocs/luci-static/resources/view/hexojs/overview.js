'use strict';
'require view';
'require poll';
'require ui';
'require rpc';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Hexo CMS'),
	pollInterval: 10,
	pollActive: true,
	currentInstance: null,

	load: function() {
		return Promise.all([
			api.listInstances(),
			api.getStatus(),
			api.getSiteStats(),
			api.listBackups()
		]).then(function(results) {
			return {
				instances: results[0].instances || [],
				status: results[1],
				stats: results[2],
				backups: results[3].backups || []
			};
		});
	},

	// ─── Instance Management ───
	handleCreateInstance: function() {
		var self = this;
		ui.showModal(_('Create Instance'), [
			E('div', { 'class': 'k-form' }, [
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Name (lowercase, no spaces)')),
					E('input', { 'type': 'text', 'id': 'new-instance-name', 'placeholder': 'myblog',
						'pattern': '^[a-z][a-z0-9_]*$', 'style': 'width: 100%' })
				]),
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Title')),
					E('input', { 'type': 'text', 'id': 'new-instance-title', 'placeholder': 'My Blog',
						'style': 'width: 100%' })
				]),
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Port (auto if empty)')),
					E('input', { 'type': 'number', 'id': 'new-instance-port', 'placeholder': '4000',
						'style': 'width: 100%' })
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'style': 'margin-left: 8px',
					'click': function() {
						var name = document.getElementById('new-instance-name').value;
						var title = document.getElementById('new-instance-title').value;
						var port = document.getElementById('new-instance-port').value;
						if (!name) { ui.addNotification(null, E('p', _('Name required')), 'error'); return; }
						ui.showModal(_('Creating...'), [E('p', { 'class': 'spinning' }, _('Creating instance...'))]);
						api.createInstance(name, title || null, port ? parseInt(port) : null).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', _('Instance created: %s').format(name)), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', r.error || _('Failed')), 'error');
							}
						});
					}
				}, _('Create'))
			])
		]);
	},

	handleDeleteInstance: function(name) {
		var self = this;
		ui.showModal(_('Delete Instance'), [
			E('p', {}, _('Delete instance "%s"?').format(name)),
			E('label', { 'style': 'display: block; margin: 12px 0' }, [
				E('input', { 'type': 'checkbox', 'id': 'delete-data-check' }),
				E('span', { 'style': 'margin-left: 8px' }, _('Also delete site data'))
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-negative', 'style': 'margin-left: 8px',
					'click': function() {
						var deleteData = document.getElementById('delete-data-check').checked;
						ui.showModal(_('Deleting...'), [E('p', { 'class': 'spinning' }, _('Deleting...'))]);
						api.deleteInstance(name, deleteData).then(function() {
							ui.hideModal();
							window.location.reload();
						});
					}
				}, _('Delete'))
			])
		]);
	},

	handleToggleInstance: function(inst) {
		var self = this;
		var action = inst.running ? api.stopInstance : api.startInstance;
		var msg = inst.running ? _('Stopping...') : _('Starting...');
		ui.showModal(msg, [E('p', { 'class': 'spinning' }, msg)]);
		action(inst.name).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message), 'info');
				setTimeout(function() { window.location.reload(); }, 1500);
			} else {
				ui.addNotification(null, E('p', r.error || _('Failed')), 'error');
			}
		});
	},

	// ─── Backup/Restore ───
	handleBackup: function(instance) {
		ui.showModal(_('Create Backup'), [E('p', { 'class': 'spinning' }, _('Creating backup...'))]);
		api.createBackup(instance || 'default', null).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', _('Backup created: %s').format(r.name)), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', r.error || _('Backup failed')), 'error');
			}
		});
	},

	handleRestore: function(backupName, instance) {
		ui.showModal(_('Restore Backup'), [
			E('p', {}, _('Restore backup "%s"?').format(backupName)),
			E('p', { 'style': 'color: var(--k-warning)' }, _('This will overwrite current site data!')),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-action', 'style': 'margin-left: 8px',
					'click': function() {
						ui.showModal(_('Restoring...'), [E('p', { 'class': 'spinning' }, _('Restoring...'))]);
						api.restoreBackup(backupName, instance || 'default').then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', _('Backup restored')), 'info');
							} else {
								ui.addNotification(null, E('p', r.error || _('Restore failed')), 'error');
							}
						});
					}
				}, _('Restore'))
			])
		]);
	},

	handleDeleteBackup: function(name) {
		ui.showModal(_('Delete Backup'), [
			E('p', {}, _('Delete backup "%s"?').format(name)),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-negative', 'style': 'margin-left: 8px',
					'click': function() {
						api.deleteBackup(name).then(function(r) {
							ui.hideModal();
							if (r.success) window.location.reload();
						});
					}
				}, _('Delete'))
			])
		]);
	},

	// ─── GitHub/Gitea Clone ───
	handleGitClone: function(source) {
		var self = this;
		var title = source === 'github' ? _('Clone from GitHub') : _('Clone from Gitea');
		ui.showModal(title, [
			E('div', { 'class': 'k-form' }, [
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Repository URL')),
					E('input', { 'type': 'text', 'id': 'clone-repo', 'style': 'width: 100%',
						'placeholder': source === 'github' ? 'https://github.com/user/repo.git' : 'http://gitea.local/user/repo.git' })
				]),
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Instance (existing or new)')),
					E('input', { 'type': 'text', 'id': 'clone-instance', 'style': 'width: 100%',
						'placeholder': 'default' })
				]),
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Branch')),
					E('input', { 'type': 'text', 'id': 'clone-branch', 'style': 'width: 100%',
						'placeholder': 'main' })
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'style': 'margin-left: 8px',
					'click': function() {
						var repo = document.getElementById('clone-repo').value;
						var instance = document.getElementById('clone-instance').value || 'default';
						var branch = document.getElementById('clone-branch').value || 'main';
						if (!repo) { ui.addNotification(null, E('p', _('Repo URL required')), 'error'); return; }
						ui.showModal(_('Cloning...'), [E('p', { 'class': 'spinning' }, _('Cloning repository...'))]);
						var cloneFn = source === 'github' ? api.gitHubClone : api.gitClone;
						cloneFn(repo, instance, branch).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', r.message || _('Clone successful')), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', r.error || _('Clone failed')), 'error');
							}
						});
					}
				}, _('Clone'))
			])
		]);
	},

	// ─── Quick Publish ───
	handleQuickPublish: function(instance) {
		ui.showModal(_('Quick Publish'), [
			E('p', { 'class': 'spinning' }, _('Building and publishing...'))
		]);
		api.quickPublish(instance || 'default').then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', _('Published successfully!')), 'info');
			} else {
				ui.addNotification(null, E('p', r.error || _('Publish failed')), 'error');
			}
		});
	},

	// ─── Gitea Push ───
	handleGiteaPush: function(instance) {
		ui.showModal(_('Push to Gitea'), [
			E('div', { 'class': 'k-form' }, [
				E('div', { 'class': 'k-form-group' }, [
					E('label', {}, _('Commit Message')),
					E('input', { 'type': 'text', 'id': 'push-message', 'style': 'width: 100%',
						'placeholder': 'Update content' })
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 16px' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				E('button', { 'class': 'cbi-button cbi-button-positive', 'style': 'margin-left: 8px',
					'click': function() {
						var msg = document.getElementById('push-message').value || 'Update from SecuBox';
						ui.showModal(_('Pushing...'), [E('p', { 'class': 'spinning' }, _('Pushing to Gitea...'))]);
						api.giteaPush(instance || 'default', msg).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', r.message || _('Push successful')), 'info');
							} else {
								ui.addNotification(null, E('p', r.error || _('Push failed')), 'error');
							}
						});
					}
				}, _('Push'))
			])
		]);
	},

	// ─── Service Control ───
	handleServiceToggle: function(status) {
		var self = this;
		var action = status.running ? api.serviceStop : api.serviceStart;
		var msg = status.running ? _('Stopping...') : _('Starting...');
		ui.showModal(msg, [E('p', { 'class': 'spinning' }, msg)]);
		action().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message), 'info');
				setTimeout(function() { window.location.reload(); }, 2000);
			}
		});
	},

	// ─── Render ───
	render: function(data) {
		var self = this;
		var instances = data.instances || [];
		var status = data.status || {};
		var stats = data.stats || {};
		var backups = data.backups || [];

		// ─── Stat Card Helper ───
		var statCard = function(icon, value, label, color) {
			return E('div', { 'class': 'k-stat' }, [
				E('div', { 'class': 'k-stat-icon', 'style': 'color: ' + (color || 'var(--k-accent)') }, icon),
				E('div', { 'class': 'k-stat-value' }, String(value)),
				E('div', { 'class': 'k-stat-label' }, label)
			]);
		};

		// ─── Instance Card Helper ───
		var instanceCard = function(inst) {
			var statusColor = inst.running ? 'var(--k-green)' : 'var(--k-muted)';
			var statusText = inst.running ? _('Running') : _('Stopped');
			return E('div', { 'class': 'k-card', 'style': 'border-left: 3px solid ' + statusColor },
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center' }, [
					E('div', {}, [
						E('div', { 'class': 'k-card-title', 'style': 'margin-bottom: 4px' }, [
							inst.title || inst.name,
							E('span', { 'class': 'k-badge', 'style': 'margin-left: 8px; background: ' + statusColor }, statusText)
						]),
						E('div', { 'style': 'color: var(--k-muted); font-size: 12px' }, [
							'Port: ', String(inst.port),
							inst.domain ? [' | ', E('a', { 'href': 'https://' + inst.domain, 'target': '_blank' }, inst.domain)] : ''
						])
					]),
					E('div', { 'style': 'display: flex; gap: 8px' }, [
						E('button', {
							'class': 'k-btn k-btn-sm ' + (inst.running ? 'k-btn-danger' : 'k-btn-success'),
							'click': function() { self.handleToggleInstance(inst); }
						}, inst.running ? '\u25A0' : '\u25B6'),
						E('button', { 'class': 'k-btn k-btn-sm', 'title': _('Quick Publish'),
							'click': function() { self.handleQuickPublish(inst.name); }
						}, '\uD83D\uDE80'),
						E('button', { 'class': 'k-btn k-btn-sm', 'title': _('Backup'),
							'click': function() { self.handleBackup(inst.name); }
						}, '\uD83D\uDCBE'),
						E('a', { 'class': 'k-btn k-btn-sm', 'title': _('Editor'),
							'href': L.url('admin', 'services', 'hexojs', 'editor') + '?instance=' + inst.name
						}, '\u270F'),
						inst.running ? E('a', { 'class': 'k-btn k-btn-sm', 'title': _('Preview'),
							'href': 'http://' + window.location.hostname + ':' + inst.port,
							'target': '_blank'
						}, '\uD83D\uDC41') : '',
						E('button', { 'class': 'k-btn k-btn-sm k-btn-danger', 'title': _('Delete'),
							'click': function() { self.handleDeleteInstance(inst.name); }
						}, '\u2715')
					])
				])
			);
		};

		// ─── Backup Row Helper ───
		var backupRow = function(bk) {
			var date = bk.timestamp ? new Date(bk.timestamp * 1000).toLocaleString() : '-';
			return E('tr', {}, [
				E('td', {}, bk.name),
				E('td', {}, bk.size),
				E('td', {}, date),
				E('td', { 'style': 'text-align: right' }, [
					E('button', { 'class': 'k-btn k-btn-sm', 'click': function() { self.handleRestore(bk.name); } }, '\u21BA'),
					E('button', { 'class': 'k-btn k-btn-sm k-btn-danger', 'style': 'margin-left: 4px',
						'click': function() { self.handleDeleteBackup(bk.name); }
					}, '\u2715')
				])
			]);
		};

		// ─── Main Layout ───
		var content = [
			// Header
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px' }, [
				E('div', {}, [
					E('h2', { 'style': 'margin: 0' }, ['\uD83D\uDCDD ', _('Hexo CMS')]),
					E('p', { 'style': 'color: var(--k-muted); margin: 4px 0 0' }, _('Multi-instance static site generator'))
				]),
				E('div', { 'style': 'display: flex; gap: 8px' }, [
					E('button', {
						'class': 'k-btn ' + (status.running ? 'k-btn-danger' : 'k-btn-success'),
						'click': function() { self.handleServiceToggle(status); }
					}, status.running ? ['\u25A0 ', _('Stop Container')] : ['\u25B6 ', _('Start Container')])
				])
			]),

			// Stats Grid
			E('div', { 'class': 'k-grid k-grid-4', 'style': 'margin-bottom: 20px' }, [
				statCard('\uD83D\uDCE6', instances.length, _('Instances'), 'var(--k-blue)'),
				statCard('\uD83D\uDCDD', stats.posts || 0, _('Posts'), 'var(--k-green)'),
				statCard('\uD83D\uDCCB', stats.drafts || 0, _('Drafts'), 'var(--k-yellow)'),
				statCard('\uD83D\uDCBE', backups.length, _('Backups'), 'var(--k-purple)')
			]),

			// Quick Actions
			E('div', { 'class': 'k-card', 'style': 'margin-bottom: 20px' }, [
				E('div', { 'class': 'k-card-title' }, ['\u26A1 ', _('Quick Actions')]),
				E('div', { 'style': 'display: flex; gap: 8px; flex-wrap: wrap' }, [
					E('button', { 'class': 'k-btn k-btn-success', 'click': function() { self.handleCreateInstance(); } },
						['\u2795 ', _('New Instance')]),
					E('button', { 'class': 'k-btn', 'click': function() { self.handleGitClone('github'); } },
						['\uD83D\uDC19 ', _('Clone from GitHub')]),
					E('button', { 'class': 'k-btn', 'click': function() { self.handleGitClone('gitea'); } },
						['\uD83C\uDF75 ', _('Clone from Gitea')]),
					E('a', { 'class': 'k-btn', 'href': L.url('admin', 'services', 'hexojs', 'editor') },
						['\u270F ', _('New Post')]),
					E('a', { 'class': 'k-btn', 'href': L.url('admin', 'services', 'hexojs', 'settings') },
						['\u2699 ', _('Settings')])
				])
			]),

			// Instances Section
			E('div', { 'class': 'k-card', 'style': 'margin-bottom: 20px' }, [
				E('div', { 'class': 'k-card-title' }, ['\uD83D\uDCE6 ', _('Instances')]),
				instances.length > 0
					? E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px' },
						instances.map(instanceCard))
					: E('div', { 'class': 'k-empty' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 12px' }, '\uD83D\uDCE6'),
						E('p', {}, _('No instances yet. Create your first instance!')),
						E('button', { 'class': 'k-btn k-btn-success', 'click': function() { self.handleCreateInstance(); } },
							['\u2795 ', _('Create Instance')])
					])
			]),

			// Backups Section
			E('div', { 'class': 'k-card' }, [
				E('div', { 'class': 'k-card-title' }, ['\uD83D\uDCBE ', _('Backups')]),
				backups.length > 0
					? E('table', { 'class': 'k-table' }, [
						E('thead', {}, E('tr', {}, [
							E('th', {}, _('Name')),
							E('th', {}, _('Size')),
							E('th', {}, _('Date')),
							E('th', { 'style': 'text-align: right' }, _('Actions'))
						])),
						E('tbody', {}, backups.map(backupRow))
					])
					: E('div', { 'class': 'k-empty' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 12px' }, '\uD83D\uDCBE'),
						E('p', {}, _('No backups yet.'))
					])
			])
		];

		return KissTheme.wrap(content, 'admin/services/hexojs');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
