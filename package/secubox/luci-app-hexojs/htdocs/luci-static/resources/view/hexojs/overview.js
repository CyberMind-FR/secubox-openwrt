'use strict';
'require view';
'require poll';
'require ui';
'require rpc';
'require hexojs/api as api';

return view.extend({
	pollInterval: 10,

	load: function() {
		return Promise.all([
			api.listInstances(),
			api.getStatus(),
			api.getSiteStats(),
			api.listBackups()
		]).then(function(results) {
			return {
				instances: results[0] || [],
				status: results[1] || {},
				stats: results[2] || {},
				backups: results[3] || []
			};
		});
	},

	css: function() {
		return `
:root { --k-bg:#0d1117; --k-surface:#161b22; --k-card:#1c2128; --k-line:#30363d;
        --k-text:#e6edf3; --k-muted:#8b949e; --k-accent:#58a6ff; --k-green:#3fb950;
        --k-red:#f85149; --k-yellow:#d29922; --k-purple:#a371f7; }
.k-wrap { max-width:1200px; margin:0 auto; padding:20px; color:var(--k-text); font-family:system-ui,-apple-system,sans-serif; }
.k-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
.k-title { font-size:24px; font-weight:600; display:flex; align-items:center; gap:12px; }
.k-title span { color:var(--k-accent); }
.k-badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:500; }
.k-badge-green { background:rgba(63,185,80,0.15); color:var(--k-green); }
.k-badge-red { background:rgba(248,81,73,0.15); color:var(--k-red); }
.k-grid { display:grid; gap:16px; margin-bottom:24px; }
.k-grid-4 { grid-template-columns:repeat(4,1fr); }
.k-stat { background:var(--k-card); border:1px solid var(--k-line); border-radius:8px; padding:20px; text-align:center; }
.k-stat-value { font-size:32px; font-weight:700; color:var(--k-accent); }
.k-stat-label { color:var(--k-muted); font-size:13px; margin-top:4px; }
.k-card { background:var(--k-card); border:1px solid var(--k-line); border-radius:8px; padding:20px; margin-bottom:16px; }
.k-card-title { font-size:14px; font-weight:600; color:var(--k-muted); margin-bottom:16px; text-transform:uppercase; letter-spacing:0.5px; }
.k-actions { display:flex; gap:8px; flex-wrap:wrap; }
.k-btn { padding:8px 16px; border-radius:6px; border:1px solid var(--k-line); background:var(--k-surface);
         color:var(--k-text); cursor:pointer; font-size:13px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
.k-btn:hover { border-color:var(--k-accent); color:var(--k-accent); }
.k-btn-green { background:var(--k-green); border-color:var(--k-green); color:#fff; }
.k-btn-green:hover { background:#2ea043; }
.k-btn-sm { padding:6px 10px; font-size:12px; }
.k-table { width:100%; border-collapse:collapse; }
.k-table th { text-align:left; padding:12px; color:var(--k-muted); font-size:12px; text-transform:uppercase;
              border-bottom:1px solid var(--k-line); }
.k-table td { padding:12px; border-bottom:1px solid var(--k-line); }
.k-table tr:hover { background:var(--k-surface); }
.k-instance { display:flex; justify-content:space-between; align-items:center; padding:16px;
              background:var(--k-surface); border-radius:8px; margin-bottom:8px; }
.k-instance-info h4 { margin:0 0 4px; font-size:15px; }
.k-instance-info p { margin:0; color:var(--k-muted); font-size:13px; }
.k-instance-actions { display:flex; gap:6px; }
.k-empty { text-align:center; padding:40px; color:var(--k-muted); }
@media(max-width:768px) { .k-grid-4{grid-template-columns:repeat(2,1fr);} }
`;
	},

	handleCreateInstance: function() {
		var nameInput, titleInput, portInput;
		ui.showModal(_('New Instance'), [
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Name'),
				nameInput = E('input', { type: 'text', placeholder: 'myblog', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Title'),
				titleInput = E('input', { type: 'text', placeholder: 'My Blog', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Port (auto)'),
				portInput = E('input', { type: 'number', placeholder: '4000', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-positive', click: function() {
					var name = nameInput.value.trim();
					if (!name) return;
					ui.showModal(_('Creating...'), [E('p', { class: 'spinning' }, 'Creating instance...')]);
					api.createInstance(name, titleInput.value || null, portInput.value ? parseInt(portInput.value) : null).then(function(r) {
						ui.hideModal();
						if (r.success) window.location.reload();
						else ui.addNotification(null, E('p', r.error || 'Failed'));
					});
				}}, 'Create')
			])
		]);
	},

	handleGitClone: function(source) {
		var repoInput, instInput, branchInput;
		var title = source === 'github' ? 'Clone from GitHub' : 'Clone from Gitea';
		ui.showModal(_(title), [
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Repository URL'),
				repoInput = E('input', { type: 'text', placeholder: source === 'github' ? 'https://github.com/user/repo' : 'http://gitea.local/user/repo', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Instance'),
				instInput = E('input', { type: 'text', placeholder: 'default', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;margin-bottom:4px;color:#8b949e;font-size:13px' }, 'Branch'),
				branchInput = E('input', { type: 'text', placeholder: 'main', style: 'width:100%;padding:8px;border-radius:4px;border:1px solid #30363d;background:#161b22;color:#e6edf3' })
			]),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-positive', click: function() {
					var repo = repoInput.value.trim();
					if (!repo) return;
					ui.showModal(_('Cloning...'), [E('p', { class: 'spinning' }, 'Cloning repository...')]);
					var fn = source === 'github' ? api.gitHubClone : api.gitClone;
					fn(repo, instInput.value || 'default', branchInput.value || 'main').then(function(r) {
						ui.hideModal();
						if (r.success) window.location.reload();
						else ui.addNotification(null, E('p', r.error || 'Clone failed'));
					});
				}}, 'Clone')
			])
		]);
	},

	handleBackup: function(instance) {
		ui.showModal(_('Backup'), [E('p', { class: 'spinning' }, 'Creating backup...')]);
		api.createBackup(instance, null).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', 'Backup created: ' + (r.name || 'success')));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', r.error || 'Backup failed'));
			}
		});
	},

	handleRestore: function(name) {
		ui.showModal(_('Restore'), [
			E('p', {}, 'Restore backup "' + name + '"?'),
			E('p', { style: 'color:#d29922' }, 'This will overwrite current data!'),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-negative', click: function() {
					ui.showModal(_('Restoring...'), [E('p', { class: 'spinning' }, 'Restoring...')]);
					api.restoreBackup(name, 'default').then(function(r) {
						ui.hideModal();
						if (r.success) ui.addNotification(null, E('p', 'Restored'));
						else ui.addNotification(null, E('p', r.error || 'Failed'));
					});
				}}, 'Restore')
			])
		]);
	},

	handleDeleteBackup: function(name) {
		ui.showModal(_('Delete Backup'), [
			E('p', {}, 'Delete backup "' + name + '"?'),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-negative', click: function() {
					api.deleteBackup(name).then(function() { ui.hideModal(); window.location.reload(); });
				}}, 'Delete')
			])
		]);
	},

	handleToggle: function(inst) {
		var action = inst.running ? api.stopInstance : api.startInstance;
		var msg = inst.running ? 'Stopping...' : 'Starting...';
		ui.showModal(_(msg), [E('p', { class: 'spinning' }, msg)]);
		action(inst.name).then(function(r) {
			ui.hideModal();
			setTimeout(function() { window.location.reload(); }, 1500);
		});
	},

	handleDelete: function(name) {
		ui.showModal(_('Delete Instance'), [
			E('p', {}, 'Delete instance "' + name + '"?'),
			E('label', { style: 'display:block;margin:12px 0' }, [
				E('input', { type: 'checkbox', id: 'del-data' }),
				E('span', { style: 'margin-left:8px' }, 'Also delete data')
			]),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end;margin-top:20px' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-negative', click: function() {
					var delData = document.getElementById('del-data').checked;
					api.deleteInstance(name, delData).then(function() { ui.hideModal(); window.location.reload(); });
				}}, 'Delete')
			])
		]);
	},

	handleQuickPublish: function(instance) {
		ui.showModal(_('Publishing'), [E('p', { class: 'spinning' }, 'Building and publishing...')]);
		api.quickPublish(instance).then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', r.success ? 'Published!' : (r.error || 'Failed')));
		});
	},

	handleServiceToggle: function(status) {
		var action = status.running ? api.serviceStop : api.serviceStart;
		var msg = status.running ? 'Stopping...' : 'Starting...';
		ui.showModal(_(msg), [E('p', { class: 'spinning' }, msg)]);
		action().then(function() { ui.hideModal(); setTimeout(function() { window.location.reload(); }, 2000); });
	},

	render: function(data) {
		var self = this;
		var instances = data.instances || [];
		var status = data.status || {};
		var stats = data.stats || {};
		var backups = data.backups || [];

		return E('div', { class: 'k-wrap' }, [
			E('style', {}, this.css()),

			// Header
			E('div', { class: 'k-header' }, [
				E('div', { class: 'k-title' }, ['📝 Hexo ', E('span', {}, 'CMS')]),
				E('button', {
					class: 'k-btn ' + (status.running ? 'k-btn-green' : ''),
					click: function() { self.handleServiceToggle(status); }
				}, status.running ? '● Running' : '○ Stopped')
			]),

			// Stats
			E('div', { class: 'k-grid k-grid-4' }, [
				E('div', { class: 'k-stat' }, [E('div', { class: 'k-stat-value' }, String(instances.length)), E('div', { class: 'k-stat-label' }, 'Instances')]),
				E('div', { class: 'k-stat' }, [E('div', { class: 'k-stat-value' }, String(stats.posts || 0)), E('div', { class: 'k-stat-label' }, 'Posts')]),
				E('div', { class: 'k-stat' }, [E('div', { class: 'k-stat-value' }, String(stats.drafts || 0)), E('div', { class: 'k-stat-label' }, 'Drafts')]),
				E('div', { class: 'k-stat' }, [E('div', { class: 'k-stat-value' }, String(backups.length)), E('div', { class: 'k-stat-label' }, 'Backups')])
			]),

			// Quick Actions
			E('div', { class: 'k-card' }, [
				E('div', { class: 'k-card-title' }, 'Quick Actions'),
				E('div', { class: 'k-actions' }, [
					E('button', { class: 'k-btn k-btn-green', click: function() { self.handleCreateInstance(); } }, '+ New Instance'),
					E('button', { class: 'k-btn', click: function() { self.handleGitClone('github'); } }, '🐙 GitHub'),
					E('button', { class: 'k-btn', click: function() { self.handleGitClone('gitea'); } }, '🍵 Gitea'),
					E('a', { class: 'k-btn', href: L.url('admin', 'services', 'hexojs', 'editor') }, '✏ New Post'),
					E('a', { class: 'k-btn', href: L.url('admin', 'services', 'hexojs', 'settings') }, '⚙ Settings')
				])
			]),

			// Instances
			E('div', { class: 'k-card' }, [
				E('div', { class: 'k-card-title' }, 'Instances'),
				instances.length > 0
					? E('div', {}, instances.map(function(inst) {
						return E('div', { class: 'k-instance' }, [
							E('div', { class: 'k-instance-info' }, [
								E('h4', {}, [
									inst.title || inst.name,
									E('span', { class: 'k-badge ' + (inst.running ? 'k-badge-green' : 'k-badge-red'), style: 'margin-left:8px' },
										inst.running ? 'Running' : 'Stopped')
								]),
								E('p', {}, 'Port: ' + inst.port + (inst.domain ? ' · ' + inst.domain : ''))
							]),
							E('div', { class: 'k-instance-actions' }, [
								E('button', { class: 'k-btn k-btn-sm', title: inst.running ? 'Stop' : 'Start',
									click: function() { self.handleToggle(inst); } }, inst.running ? '⏹' : '▶'),
								E('button', { class: 'k-btn k-btn-sm', title: 'Publish',
									click: function() { self.handleQuickPublish(inst.name); } }, '🚀'),
								E('button', { class: 'k-btn k-btn-sm', title: 'Backup',
									click: function() { self.handleBackup(inst.name); } }, '💾'),
								E('a', { class: 'k-btn k-btn-sm', title: 'Editor',
									href: L.url('admin', 'services', 'hexojs', 'editor') + '?instance=' + inst.name }, '✏'),
								inst.running ? E('a', { class: 'k-btn k-btn-sm', title: 'Preview', target: '_blank',
									href: 'http://' + window.location.hostname + ':' + inst.port }, '👁') : '',
								E('button', { class: 'k-btn k-btn-sm', title: 'Delete', style: 'color:#f85149',
									click: function() { self.handleDelete(inst.name); } }, '✕')
							])
						]);
					}))
					: E('div', { class: 'k-empty' }, 'No instances yet')
			]),

			// Backups
			E('div', { class: 'k-card' }, [
				E('div', { class: 'k-card-title' }, 'Backups'),
				backups.length > 0
					? E('table', { class: 'k-table' }, [
						E('thead', {}, E('tr', {}, [
							E('th', {}, 'Name'),
							E('th', {}, 'Size'),
							E('th', {}, 'Date'),
							E('th', { style: 'text-align:right' }, 'Actions')
						])),
						E('tbody', {}, backups.map(function(bk) {
							return E('tr', {}, [
								E('td', {}, bk.name),
								E('td', {}, bk.size || '-'),
								E('td', {}, bk.timestamp ? new Date(bk.timestamp * 1000).toLocaleDateString() : '-'),
								E('td', { style: 'text-align:right' }, [
									E('button', { class: 'k-btn k-btn-sm', click: function() { self.handleRestore(bk.name); } }, '↩'),
									E('button', { class: 'k-btn k-btn-sm', style: 'color:#f85149;margin-left:4px',
										click: function() { self.handleDeleteBackup(bk.name); } }, '✕')
								])
							]);
						}))
					])
					: E('div', { class: 'k-empty' }, 'No backups yet')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
