'use strict';
'require view';
'require ui';
'require rpc';
'require hexojs/api as api';

return view.extend({
	load: function() {
		return Promise.all([
			L.require('secubox/kiss-theme'),
			api.listInstances(),
			api.getStatus(),
			api.getSiteStats(),
			api.listBackups()
		]).then(function(r) {
			return { instances: r[1] || [], status: r[2] || {}, stats: r[3] || {}, backups: r[4] || [] };
		});
	},

	render: function(d) {
		var self = this;
		var K = window.KissTheme;
		K.apply();

		return K.wrap([
			// Header
			K.E('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px' }, [
				K.E('h2', { style: 'margin:0;font-size:24px' }, '📰 HexoJS'),
				K.badge(d.status.running ? 'RUNNING' : 'STOPPED', d.status.running ? 'green' : 'red')
			]),

			// Stats
			K.E('div', { class: 'kiss-grid kiss-grid-4' }, [
				K.stat(d.instances.length, 'Instances', K.colors.cyan),
				K.stat(d.stats.posts || 0, 'Posts', K.colors.green),
				K.stat(d.stats.drafts || 0, 'Drafts', K.colors.yellow),
				K.stat(d.backups.length, 'Backups', K.colors.purple)
			]),

			// Quick Actions
			K.card('⚡ Actions', K.E('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
				K.btn('+ Instance', function() { self.createInstance(); }, 'green'),
				K.btn('🐙 GitHub', function() { self.gitClone('github'); }),
				K.btn('🍵 Gitea', function() { self.gitClone('gitea'); }),
				K.E('a', { class: 'kiss-btn', href: L.url('admin', 'services', 'hexojs', 'editor') }, '✏ Post'),
				K.E('a', { class: 'kiss-btn', href: L.url('admin', 'services', 'hexojs', 'settings') }, '⚙ Settings')
			])),

			// Instances
			K.card('📦 Instances', d.instances.length ? K.E('div', {}, d.instances.map(function(i) {
				return K.E('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--kiss-bg2);border-radius:8px;margin-bottom:8px' }, [
					K.E('div', {}, [
						K.E('strong', {}, i.title || i.name),
						K.badge(i.running ? 'ON' : 'OFF', i.running ? 'green' : 'red'),
						K.E('div', { style: 'font-size:12px;color:var(--kiss-muted);margin-top:4px' }, 'Port: ' + i.port)
					]),
					K.E('div', { style: 'display:flex;gap:4px' }, [
						K.E('button', { class: 'kiss-btn', onClick: function() { self.toggle(i); } }, i.running ? '⏹' : '▶'),
						K.E('button', { class: 'kiss-btn', onClick: function() { self.publish(i.name); } }, '🚀'),
						K.E('button', { class: 'kiss-btn', onClick: function() { self.backup(i.name); } }, '💾'),
						i.running ? K.E('a', { class: 'kiss-btn', href: 'http://' + location.hostname + ':' + i.port, target: '_blank' }, '👁') : null,
						K.E('button', { class: 'kiss-btn kiss-btn-red', onClick: function() { self.deleteInst(i.name); } }, '✕')
					])
				]);
			})) : K.E('div', { style: 'text-align:center;color:var(--kiss-muted);padding:20px' }, 'No instances')),

			// Backups
			K.card('💾 Backups', d.backups.length ? K.E('table', { class: 'kiss-table' }, [
				K.E('thead', {}, K.E('tr', {}, [K.E('th', {}, 'Name'), K.E('th', {}, 'Size'), K.E('th', {}, 'Date'), K.E('th', {}, '')])),
				K.E('tbody', {}, d.backups.map(function(b) {
					return K.E('tr', {}, [
						K.E('td', {}, b.name),
						K.E('td', {}, b.size || '-'),
						K.E('td', {}, b.timestamp ? new Date(b.timestamp * 1000).toLocaleDateString() : '-'),
						K.E('td', { style: 'text-align:right' }, [
							K.E('button', { class: 'kiss-btn', onClick: function() { self.restore(b.name); } }, '↩'),
							K.E('button', { class: 'kiss-btn kiss-btn-red', style: 'margin-left:4px', onClick: function() { self.delBackup(b.name); } }, '✕')
						])
					]);
				}))
			]) : K.E('div', { style: 'text-align:center;color:var(--kiss-muted);padding:20px' }, 'No backups'))
		], 'admin/services/hexojs');
	},

	createInstance: function() {
		var name, title, port;
		ui.showModal('New Instance', [
			E('div', { style: 'margin-bottom:12px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Name'),
				name = E('input', { type: 'text', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'margin-bottom:12px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Title'),
				title = E('input', { type: 'text', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Port'),
				port = E('input', { type: 'number', placeholder: '4000', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-positive', click: function() {
					if (!name.value) return;
					ui.showModal('Creating...', [E('p', { class: 'spinning' }, 'Please wait...')]);
					api.createInstance(name.value, title.value, port.value ? +port.value : null).then(function(r) {
						ui.hideModal();
						r.success ? location.reload() : ui.addNotification(null, E('p', r.error || 'Failed'));
					});
				}}, 'Create')
			])
		]);
	},

	gitClone: function(src) {
		var repo, inst, branch;
		ui.showModal('Clone from ' + src, [
			E('div', { style: 'margin-bottom:12px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Repository URL'),
				repo = E('input', { type: 'text', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'margin-bottom:12px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Instance'),
				inst = E('input', { type: 'text', value: 'default', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'margin-bottom:16px' }, [
				E('label', { style: 'display:block;font-size:12px;color:#94a3b8;margin-bottom:4px' }, 'Branch'),
				branch = E('input', { type: 'text', value: 'main', style: 'width:100%;padding:8px;background:#111827;border:1px solid #1e293b;border-radius:4px;color:#e2e8f0' })
			]),
			E('div', { style: 'display:flex;gap:8px;justify-content:flex-end' }, [
				E('button', { class: 'cbi-button', click: ui.hideModal }, 'Cancel'),
				E('button', { class: 'cbi-button cbi-button-positive', click: function() {
					if (!repo.value) return;
					ui.showModal('Cloning...', [E('p', { class: 'spinning' }, 'Please wait...')]);
					(src === 'github' ? api.gitHubClone : api.gitClone)(repo.value, inst.value, branch.value).then(function(r) {
						ui.hideModal();
						r.success ? location.reload() : ui.addNotification(null, E('p', r.error || 'Failed'));
					});
				}}, 'Clone')
			])
		]);
	},

	toggle: function(i) {
		var fn = i.running ? api.stopInstance : api.startInstance;
		ui.showModal('...', [E('p', { class: 'spinning' }, 'Please wait...')]);
		fn(i.name).then(function() { ui.hideModal(); setTimeout(location.reload.bind(location), 1500); });
	},

	publish: function(n) {
		ui.showModal('Publishing...', [E('p', { class: 'spinning' }, 'Building site...')]);
		api.quickPublish(n).then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', r.success ? 'Published!' : (r.error || 'Failed')));
		});
	},

	backup: function(n) {
		ui.showModal('Backup...', [E('p', { class: 'spinning' }, 'Creating backup...')]);
		api.createBackup(n, null).then(function(r) {
			ui.hideModal();
			r.success ? location.reload() : ui.addNotification(null, E('p', r.error || 'Failed'));
		});
	},

	restore: function(n) {
		if (!confirm('Restore backup "' + n + '"? This will overwrite current data.')) return;
		ui.showModal('Restoring...', [E('p', { class: 'spinning' }, 'Please wait...')]);
		api.restoreBackup(n, 'default').then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', r.success ? 'Restored' : (r.error || 'Failed')));
		});
	},

	delBackup: function(n) {
		if (!confirm('Delete backup "' + n + '"?')) return;
		api.deleteBackup(n).then(function() { location.reload(); });
	},

	deleteInst: function(n) {
		if (!confirm('Delete instance "' + n + '"?')) return;
		api.deleteInstance(n, false).then(function() { location.reload(); });
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
