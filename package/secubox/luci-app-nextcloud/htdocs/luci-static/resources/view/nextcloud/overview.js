'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

// ============================================================================
// RPC Declarations
// ============================================================================

var callStatus = rpc.declare({
	object: 'luci.nextcloud',
	method: 'status',
	expect: {}
});

var callGetConfig = rpc.declare({
	object: 'luci.nextcloud',
	method: 'get_config',
	expect: {}
});

var callInstall = rpc.declare({
	object: 'luci.nextcloud',
	method: 'install',
	expect: {}
});

var callStart = rpc.declare({
	object: 'luci.nextcloud',
	method: 'start',
	expect: {}
});

var callStop = rpc.declare({
	object: 'luci.nextcloud',
	method: 'stop',
	expect: {}
});

var callRestart = rpc.declare({
	object: 'luci.nextcloud',
	method: 'restart',
	expect: {}
});

var callUpdate = rpc.declare({
	object: 'luci.nextcloud',
	method: 'update',
	expect: {}
});

var callBackup = rpc.declare({
	object: 'luci.nextcloud',
	method: 'backup',
	params: ['name'],
	expect: {}
});

var callRestore = rpc.declare({
	object: 'luci.nextcloud',
	method: 'restore',
	params: ['name'],
	expect: {}
});

var callListBackups = rpc.declare({
	object: 'luci.nextcloud',
	method: 'list_backups',
	expect: { backups: [] }
});

var callSSLEnable = rpc.declare({
	object: 'luci.nextcloud',
	method: 'ssl_enable',
	params: ['domain'],
	expect: {}
});

var callSSLDisable = rpc.declare({
	object: 'luci.nextcloud',
	method: 'ssl_disable',
	expect: {}
});

var callLogs = rpc.declare({
	object: 'luci.nextcloud',
	method: 'logs',
	expect: {}
});

// ============================================================================
// Helpers
// ============================================================================

function fmtDate(timestamp) {
	if (!timestamp) return '-';
	var d = new Date(timestamp * 1000);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5);
}

function fmtRelative(timestamp) {
	if (!timestamp) return '-';
	var d = new Date(timestamp * 1000);
	var now = new Date();
	var diff = Math.floor((now - d) / 1000);
	if (diff < 60) return diff + 's ago';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	return Math.floor(diff / 86400) + 'd ago';
}

// ============================================================================
// Main View
// ============================================================================

return view.extend({
	status: {},
	config: {},
	backups: [],
	currentTab: 'overview',

	load: function() {
		return Promise.all([
			callStatus(),
			callGetConfig(),
			callListBackups().catch(function() { return { backups: [] }; })
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.config = data[1] || {};
		this.backups = (data[2] || {}).backups || [];

		// Not installed - show install view
		if (!this.status.installed) {
			return this.renderInstallView();
		}

		// Tab navigation
		var tabs = [
			{ id: 'overview', label: 'Overview', icon: '🎛️' },
			{ id: 'backups', label: 'Backups', icon: '💾' },
			{ id: 'ssl', label: 'SSL', icon: '🔒' },
			{ id: 'logs', label: 'Logs', icon: '📜' }
		];

		var content = [
			// Header
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;' }, [
				E('div', {}, [
					E('h1', { 'style': 'font-size:28px;font-weight:700;margin:0;display:flex;align-items:center;gap:12px;' }, [
						'☁️ Nextcloud'
					]),
					E('p', { 'style': 'color:var(--kiss-muted);margin:6px 0 0;' }, 'Self-hosted file sync and collaboration platform')
				]),
				E('div', { 'style': 'display:flex;gap:8px;' }, [
					KissTheme.badge(this.status.version || 'N/A', 'blue'),
					KissTheme.badge(this.status.running ? 'Running' : 'Stopped',
						this.status.running ? 'green' : 'red')
				])
			]),

			// Tab Navigation
			E('div', { 'class': 'kiss-tabs', 'style': 'margin-bottom:20px;' },
				tabs.map(function(tab) {
					return E('button', {
						'class': 'kiss-tab' + (self.currentTab === tab.id ? ' kiss-tab-active' : ''),
						'data-tab': tab.id,
						'click': function() { self.switchTab(tab.id); }
					}, [tab.icon + ' ' + tab.label]);
				})
			),

			// Tab Content
			E('div', { 'id': 'tab-content' }, this.renderTabContent())
		];

		poll.add(L.bind(this.refresh, this), 10);
		return KissTheme.wrap(content, 'admin/secubox/services/nextcloud');
	},

	switchTab: function(tabId) {
		this.currentTab = tabId;
		var tabContent = document.getElementById('tab-content');
		if (tabContent) {
			dom.content(tabContent, this.renderTabContent());
		}
		document.querySelectorAll('.kiss-tab').forEach(function(btn) {
			btn.classList.toggle('kiss-tab-active', btn.dataset.tab === tabId);
		});
	},

	renderTabContent: function() {
		switch (this.currentTab) {
			case 'backups': return this.renderBackupsTab();
			case 'ssl': return this.renderSSLTab();
			case 'logs': return this.renderLogsTab();
			default: return this.renderOverviewTab();
		}
	},

	// ========================================================================
	// Install View
	// ========================================================================

	renderInstallView: function() {
		var self = this;

		var content = [
			E('div', { 'style': 'text-align:center;padding:60px 20px;' }, [
				E('div', { 'style': 'font-size:80px;margin-bottom:24px;' }, '☁️'),
				E('h1', { 'style': 'font-size:32px;margin:0 0 12px;' }, 'Nextcloud'),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:18px;max-width:500px;margin:0 auto 32px;' },
					'Self-hosted productivity platform with file sync, calendar, contacts, and more.'),

				E('div', { 'style': 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;max-width:600px;margin:0 auto 40px;' }, [
					this.featureCard('📁', 'File Sync'),
					this.featureCard('📅', 'Calendar'),
					this.featureCard('👥', 'Contacts'),
					this.featureCard('📝', 'Documents'),
					this.featureCard('📷', 'Photos'),
					this.featureCard('🔐', 'E2E Encryption')
				]),

				E('div', { 'style': 'background:var(--kiss-bg2);border-radius:12px;padding:20px;max-width:500px;margin:0 auto 32px;text-align:left;' }, [
					E('div', { 'style': 'font-weight:600;margin-bottom:12px;' }, '📦 What will be installed:'),
					E('ul', { 'style': 'margin:0;padding-left:20px;color:var(--kiss-muted);font-size:14px;' }, [
						E('li', {}, 'Debian 12 LXC container'),
						E('li', {}, 'Nextcloud with PHP 8.2'),
						E('li', {}, 'MariaDB database'),
						E('li', {}, 'Redis caching'),
						E('li', {}, 'Nginx web server')
					])
				]),

				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'font-size:18px;padding:16px 48px;',
					'click': function() { self.handleInstall(); }
				}, '🚀 Install Nextcloud')
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/services/nextcloud');
	},

	featureCard: function(icon, label) {
		return E('div', { 'style': 'background:var(--kiss-bg2);border-radius:10px;padding:16px;text-align:center;' }, [
			E('div', { 'style': 'font-size:28px;margin-bottom:8px;' }, icon),
			E('div', { 'style': 'font-size:13px;font-weight:500;' }, label)
		]);
	},

	// ========================================================================
	// Overview Tab
	// ========================================================================

	renderOverviewTab: function() {
		var self = this;
		var s = this.status;

		return E('div', {}, [
			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom:24px;' }, [
				KissTheme.stat(s.running ? 'Online' : 'Offline', 'Status', s.running ? 'var(--kiss-green)' : 'var(--kiss-red)'),
				KissTheme.stat(s.version || 'N/A', 'Version', 'var(--kiss-blue)'),
				KissTheme.stat(s.user_count || 0, 'Users', 'var(--kiss-purple)'),
				KissTheme.stat(s.disk_used || '0B', 'Storage', 'var(--kiss-cyan)')
			]),

			// Quick Actions
			KissTheme.card([
				E('span', {}, '⚡ Quick Actions')
			], E('div', { 'style': 'display:flex;gap:12px;flex-wrap:wrap;' }, [
				E('button', {
					'class': 'kiss-btn ' + (s.running ? 'kiss-btn-red' : 'kiss-btn-green'),
					'click': function() { self.handleToggle(); }
				}, s.running ? ['⏹️ ', 'Stop'] : ['▶️ ', 'Start']),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleRestart(); },
					'disabled': !s.running
				}, ['🔄 ', 'Restart']),
				s.web_accessible ? E('a', {
					'href': s.web_url,
					'target': '_blank',
					'class': 'kiss-btn kiss-btn-blue'
				}, ['🌐 ', 'Open Nextcloud']) : null,
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleUpdate(); }
				}, ['⬆️ ', 'Update']),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleQuickBackup(); }
				}, ['💾 ', 'Backup Now'])
			].filter(Boolean))),

			// Service Info
			KissTheme.card([
				E('span', {}, 'ℹ️ Service Information')
			], E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'gap:16px;' }, [
				E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' }, [
					this.infoRow('Container', s.container_name || 'nextcloud'),
					this.infoRow('HTTP Port', s.http_port || 8080),
					this.infoRow('Domain', s.domain || 'cloud.local'),
					this.infoRow('Data Path', s.data_path || '/srv/nextcloud')
				]),
				E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' }, [
					this.infoRow('SSL', s.ssl_enabled ? '✅ Enabled' : '❌ Disabled'),
					this.infoRow('SSL Domain', s.ssl_domain || '-'),
					this.infoRow('Web Accessible', s.web_accessible ? '✅ Yes' : '❌ No'),
					this.infoRow('Enabled', s.enabled ? '✅ Yes' : '❌ No')
				])
			])),

			// Web Access Card
			s.running && s.web_url ? KissTheme.card([
				E('span', {}, '🌐 Web Interface')
			], E('div', { 'style': 'display:flex;align-items:center;gap:16px;' }, [
				E('div', { 'style': 'flex:1;' }, [
					E('div', { 'style': 'font-size:14px;color:var(--kiss-muted);margin-bottom:4px;' }, 'Access your Nextcloud at:'),
					E('div', { 'style': 'font-family:monospace;font-size:16px;color:var(--kiss-cyan);' }, s.web_url)
				]),
				E('a', {
					'href': s.web_url,
					'target': '_blank',
					'class': 'kiss-btn kiss-btn-green'
				}, ['🔗 ', 'Open'])
			])) : null
		].filter(Boolean));
	},

	infoRow: function(label, value) {
		return E('div', { 'style': 'display:flex;justify-content:space-between;padding:8px;background:var(--kiss-bg2);border-radius:6px;' }, [
			E('span', { 'style': 'color:var(--kiss-muted);' }, label),
			E('span', { 'style': 'font-weight:500;' }, String(value))
		]);
	},

	// ========================================================================
	// Backups Tab
	// ========================================================================

	renderBackupsTab: function() {
		var self = this;

		return E('div', {}, [
			// Create Backup
			KissTheme.card([
				E('span', {}, '➕ Create Backup')
			], E('div', { 'style': 'display:flex;gap:12px;align-items:center;' }, [
				E('input', {
					'id': 'backup-name',
					'type': 'text',
					'placeholder': 'Backup name (optional)',
					'style': 'flex:1;padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var name = document.getElementById('backup-name')?.value || '';
						self.handleBackup(name);
					}
				}, ['💾 ', 'Create Backup'])
			])),

			// Backup List
			KissTheme.card([
				E('span', {}, '📦 Available Backups'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.backups.length + ' backups')
			], E('div', { 'id': 'backups-list' }, this.renderBackupsList()))
		]);
	},

	renderBackupsList: function() {
		var self = this;

		if (!this.backups.length) {
			return E('div', { 'style': 'text-align:center;padding:40px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:48px;margin-bottom:12px;' }, '💾'),
				E('div', { 'style': 'font-size:16px;' }, 'No backups yet'),
				E('div', { 'style': 'font-size:12px;margin-top:8px;' }, 'Create a backup to protect your data')
			]);
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Name'),
				E('th', {}, 'Size'),
				E('th', {}, 'Date'),
				E('th', {}, 'Actions')
			])),
			E('tbody', {}, this.backups.map(function(b) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family:monospace;' }, b.name),
					E('td', {}, b.size || '-'),
					E('td', {}, fmtRelative(b.timestamp)),
					E('td', {}, E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'style': 'padding:4px 10px;font-size:11px;',
						'data-name': b.name,
						'click': function(ev) { self.handleRestore(ev.currentTarget.dataset.name); }
					}, '⬇️ Restore'))
				]);
			}))
		]);
	},

	// ========================================================================
	// SSL Tab
	// ========================================================================

	renderSSLTab: function() {
		var self = this;
		var s = this.status;

		return E('div', {}, [
			// SSL Status
			KissTheme.card([
				E('span', {}, '🔒 SSL Status')
			], E('div', { 'style': 'display:flex;align-items:center;gap:16px;' }, [
				E('div', { 'style': 'font-size:48px;' }, s.ssl_enabled ? '🔐' : '🔓'),
				E('div', { 'style': 'flex:1;' }, [
					E('div', { 'style': 'font-size:20px;font-weight:600;' }, s.ssl_enabled ? 'SSL Enabled' : 'SSL Disabled'),
					s.ssl_enabled && s.ssl_domain ? E('div', { 'style': 'color:var(--kiss-muted);margin-top:4px;' }, 'Domain: ' + s.ssl_domain) : null
				]),
				s.ssl_enabled ? E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() { self.handleSSLDisable(); }
				}, '🔓 Disable SSL') : null
			].filter(Boolean))),

			// Enable SSL Form
			!s.ssl_enabled ? KissTheme.card([
				E('span', {}, '🌐 Enable SSL via HAProxy')
			], E('div', {}, [
				E('p', { 'style': 'color:var(--kiss-muted);margin-bottom:16px;' },
					'Configure HTTPS access with automatic Let\'s Encrypt certificates via HAProxy.'),
				E('div', { 'style': 'display:flex;gap:12px;align-items:center;' }, [
					E('input', {
						'id': 'ssl-domain',
						'type': 'text',
						'placeholder': 'cloud.example.com',
						'style': 'flex:1;padding:12px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);font-size:14px;'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							var domain = document.getElementById('ssl-domain')?.value;
							if (domain) self.handleSSLEnable(domain);
							else ui.addNotification(null, E('p', 'Enter a domain name'), 'warning');
						}
					}, ['🔐 ', 'Enable SSL'])
				]),
				E('div', { 'style': 'margin-top:16px;padding:12px;background:var(--kiss-bg2);border-radius:6px;' }, [
					E('div', { 'style': 'font-weight:600;margin-bottom:8px;color:var(--kiss-yellow);' }, '⚠️ Prerequisites:'),
					E('ul', { 'style': 'margin:0;padding-left:20px;color:var(--kiss-muted);font-size:13px;' }, [
						E('li', {}, 'Domain must point to this server\'s public IP'),
						E('li', {}, 'Port 80 and 443 must be accessible'),
						E('li', {}, 'HAProxy must be installed and running')
					])
				])
			])) : null
		].filter(Boolean));
	},

	// ========================================================================
	// Logs Tab
	// ========================================================================

	renderLogsTab: function() {
		var self = this;

		return E('div', {}, [
			KissTheme.card([
				E('span', {}, '📜 Installation/Operation Logs'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'margin-left:auto;padding:4px 10px;font-size:11px;',
					'click': function() { self.refreshLogs(); }
				}, '🔄 Refresh')
			], E('pre', {
				'id': 'logs-content',
				'style': 'background:#0a0a0a;color:#0f0;padding:16px;border-radius:8px;font-size:11px;height:400px;overflow-y:auto;margin:0;font-family:monospace;white-space:pre-wrap;'
			}, '(Loading logs...)'))
		]);
	},

	// ========================================================================
	// Action Handlers
	// ========================================================================

	handleInstall: function() {
		var self = this;
		ui.showModal('Installing Nextcloud', [
			E('div', { 'style': 'text-align:center;padding:20px;' }, [
				E('div', { 'class': 'spinning', 'style': 'font-size:48px;' }, '⏳'),
				E('p', { 'style': 'margin-top:16px;' }, 'Installing Nextcloud LXC container...'),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;' }, 'This may take several minutes. Please wait.')
			])
		]);

		callInstall().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'Installation started'), 'info');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleToggle: function() {
		var self = this;
		var running = this.status.running;

		ui.showModal(running ? 'Stopping...' : 'Starting...', [
			E('p', { 'class': 'spinning' }, (running ? 'Stopping' : 'Starting') + ' Nextcloud...')
		]);

		var fn = running ? callStop : callStart;
		fn().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', running ? 'Nextcloud stopped' : 'Nextcloud started'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleRestart: function() {
		var self = this;
		ui.showModal('Restarting...', [
			E('p', { 'class': 'spinning' }, 'Restarting Nextcloud...')
		]);

		callRestart().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', 'Nextcloud restarted'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleUpdate: function() {
		var self = this;
		ui.showModal('Updating Nextcloud', [
			E('div', { 'style': 'text-align:center;padding:20px;' }, [
				E('div', { 'class': 'spinning', 'style': 'font-size:48px;' }, '⬆️'),
				E('p', { 'style': 'margin-top:16px;' }, 'Updating Nextcloud...'),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;' }, 'This may take a few minutes.')
			])
		]);

		callUpdate().then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'Update started'), 'info');
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleQuickBackup: function() {
		this.handleBackup('');
	},

	handleBackup: function(name) {
		var self = this;
		ui.showModal('Creating Backup', [
			E('p', { 'class': 'spinning' }, 'Creating backup...')
		]);

		callBackup(name || null).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', 'Backup created: ' + (r.backup_name || 'done')), 'info');
				self.refreshBackups();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleRestore: function(name) {
		var self = this;
		if (!confirm('Restore from backup "' + name + '"? This will stop Nextcloud and may take several minutes.')) {
			return;
		}

		ui.showModal('Restoring Backup', [
			E('div', { 'style': 'text-align:center;padding:20px;' }, [
				E('div', { 'class': 'spinning', 'style': 'font-size:48px;' }, '⬇️'),
				E('p', { 'style': 'margin-top:16px;' }, 'Restoring from ' + name + '...'),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;' }, 'This may take several minutes.')
			])
		]);

		callRestore(name).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'Restore started'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleSSLEnable: function(domain) {
		var self = this;
		ui.showModal('Enabling SSL', [
			E('p', { 'class': 'spinning' }, 'Configuring SSL for ' + domain + '...')
		]);

		callSSLEnable(domain).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', r.message || 'SSL enabled'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Error: ' + e.message), 'error');
		});
	},

	handleSSLDisable: function() {
		var self = this;
		if (!confirm('Disable SSL? HTTPS access will no longer work.')) {
			return;
		}

		callSSLDisable().then(function(r) {
			if (r.success) {
				ui.addNotification(null, E('p', 'SSL disabled'), 'info');
				self.refresh();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (r.error || 'Unknown')), 'error');
			}
		});
	},

	refreshBackups: function() {
		var self = this;
		callListBackups().then(function(data) {
			self.backups = (data || {}).backups || [];
			var container = document.getElementById('backups-list');
			if (container) dom.content(container, self.renderBackupsList());
		});
	},

	refreshLogs: function() {
		callLogs().then(function(data) {
			var logs = (data.logs || '').replace(/\|/g, '\n');
			var el = document.getElementById('logs-content');
			if (el) {
				el.textContent = logs || '(No logs available)';
				el.scrollTop = el.scrollHeight;
			}
		});
	},

	// ========================================================================
	// Refresh
	// ========================================================================

	refresh: function() {
		var self = this;
		return Promise.all([
			callStatus(),
			callListBackups().catch(function() { return { backups: [] }; })
		]).then(function(data) {
			self.status = data[0] || {};
			self.backups = (data[1] || {}).backups || [];

			// Update tab content
			var tabContent = document.getElementById('tab-content');
			if (tabContent) {
				dom.content(tabContent, self.renderTabContent());
			}

			// Refresh logs if on logs tab
			if (self.currentTab === 'logs') {
				self.refreshLogs();
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
