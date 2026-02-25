'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

// ============================================================================
// RPC Declarations
// ============================================================================

var callGetStatus = rpc.declare({
	object: 'luci.cloner',
	method: 'status',
	expect: { }
});

var callListImages = rpc.declare({
	object: 'luci.cloner',
	method: 'list_images',
	expect: { images: [] }
});

var callListTokens = rpc.declare({
	object: 'luci.cloner',
	method: 'list_tokens',
	expect: { tokens: [] }
});

var callListClones = rpc.declare({
	object: 'luci.cloner',
	method: 'list_clones',
	expect: { clones: [] }
});

var callGenerateToken = rpc.declare({
	object: 'luci.cloner',
	method: 'generate_token',
	params: ['auto_approve']
});

var callBuildImage = rpc.declare({
	object: 'luci.cloner',
	method: 'build_image',
	params: ['device_type']
});

var callListDevices = rpc.declare({
	object: 'luci.cloner',
	method: 'list_devices',
	expect: { devices: [] }
});

var callTftpStart = rpc.declare({
	object: 'luci.cloner',
	method: 'tftp_start'
});

var callTftpStop = rpc.declare({
	object: 'luci.cloner',
	method: 'tftp_stop'
});

var callDeleteToken = rpc.declare({
	object: 'luci.cloner',
	method: 'delete_token',
	params: ['token']
});

var callDeleteImage = rpc.declare({
	object: 'luci.cloner',
	method: 'delete_image',
	params: ['name']
});

var callGetBuildProgress = rpc.declare({
	object: 'luci.cloner',
	method: 'build_progress',
	expect: { }
});

var callGetBuildLog = rpc.declare({
	object: 'luci.cloner',
	method: 'build_log',
	params: ['lines', 'offset'],
	expect: { }
});

var callSerialPorts = rpc.declare({
	object: 'luci.cloner',
	method: 'serial_ports',
	expect: { ports: [] }
});

var callSerialStart = rpc.declare({
	object: 'luci.cloner',
	method: 'serial_start',
	params: ['port']
});

var callSerialStop = rpc.declare({
	object: 'luci.cloner',
	method: 'serial_stop'
});

var callSerialRead = rpc.declare({
	object: 'luci.cloner',
	method: 'serial_read',
	params: ['lines'],
	expect: { }
});

var callSerialWrite = rpc.declare({
	object: 'luci.cloner',
	method: 'serial_write',
	params: ['port', 'command']
});

var callHistoryList = rpc.declare({
	object: 'luci.cloner',
	method: 'history_list',
	expect: { history: [] }
});

var callHistoryClear = rpc.declare({
	object: 'luci.cloner',
	method: 'history_clear'
});

var callStorageInfo = rpc.declare({
	object: 'luci.cloner',
	method: 'storage_info',
	expect: { }
});

var callImageDetails = rpc.declare({
	object: 'luci.cloner',
	method: 'image_details',
	params: ['name'],
	expect: { }
});

var callImageRename = rpc.declare({
	object: 'luci.cloner',
	method: 'image_rename',
	params: ['old_name', 'new_name']
});

var callListRemotes = rpc.declare({
	object: 'luci.cloner',
	method: 'list_remotes',
	expect: { remotes: [] }
});

var callAddRemote = rpc.declare({
	object: 'luci.cloner',
	method: 'add_remote',
	params: ['ip', 'name', 'token']
});

var callRemoveRemote = rpc.declare({
	object: 'luci.cloner',
	method: 'remove_remote',
	params: ['ip']
});

var callRemoteStatus = rpc.declare({
	object: 'luci.cloner',
	method: 'remote_status',
	params: ['ip'],
	expect: { }
});

var callRemoteUpload = rpc.declare({
	object: 'luci.cloner',
	method: 'remote_upload',
	params: ['ip', 'image']
});

var callRemoteFlash = rpc.declare({
	object: 'luci.cloner',
	method: 'remote_flash',
	params: ['ip', 'image', 'keep_settings', 'token']
});

var callScanNetwork = rpc.declare({
	object: 'luci.cloner',
	method: 'scan_network',
	expect: { devices: [] }
});

// Factory Auto-Provisioning RPC
var callPendingDevices = rpc.declare({
	object: 'luci.cloner',
	method: 'pending_devices',
	expect: { devices: [] }
});

var callApproveDevice = rpc.declare({
	object: 'luci.cloner',
	method: 'approve_device',
	params: ['device_id', 'profile']
});

var callRejectDevice = rpc.declare({
	object: 'luci.cloner',
	method: 'reject_device',
	params: ['device_id', 'reason']
});

var callBulkTokens = rpc.declare({
	object: 'luci.cloner',
	method: 'bulk_tokens',
	params: ['count', 'profile', 'ttl'],
	expect: { tokens: [] }
});

var callInventory = rpc.declare({
	object: 'luci.cloner',
	method: 'inventory',
	expect: { inventory: [] }
});

var callListProfiles = rpc.declare({
	object: 'luci.cloner',
	method: 'list_profiles',
	expect: { profiles: [] }
});

var callDiscoveryStatus = rpc.declare({
	object: 'luci.cloner',
	method: 'discovery_status',
	expect: { }
});

var callToggleDiscovery = rpc.declare({
	object: 'luci.cloner',
	method: 'toggle_discovery',
	params: ['enabled']
});

// ============================================================================
// Helpers
// ============================================================================

function fmtSize(bytes) {
	if (!bytes || bytes === 0) return '-';
	var u = ['B', 'KB', 'MB', 'GB'];
	var i = 0;
	while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++; }
	return bytes.toFixed(1) + ' ' + u[i];
}

function fmtDate(iso) {
	if (!iso) return '-';
	var d = new Date(iso);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5);
}

function fmtRelative(iso) {
	if (!iso) return '-';
	var d = new Date(iso);
	var now = new Date();
	var diff = Math.floor((now - d) / 1000);
	if (diff < 60) return diff + 's ago';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	return Math.floor(diff / 86400) + 'd ago';
}

function atob_safe(str) {
	try {
		return atob(str);
	} catch (e) {
		return '';
	}
}

// ============================================================================
// Main View
// ============================================================================

return view.extend({
	// State
	status: {},
	images: [],
	tokens: [],
	clones: [],
	devices: [],
	buildProgress: null,
	storage: {},
	history: [],
	serialPorts: [],
	serialBuffer: '',
	selectedPort: null,
	currentTab: 'overview',
	buildLogOffset: 0,
	remotes: [],
	scannedDevices: [],
	// Factory state
	pendingDevices: [],
	hwInventory: [],
	profiles: [],
	discoveryStatus: {},
	generatedTokens: [],

	load: function() {
		return Promise.all([
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones(),
			callListDevices(),
			callGetBuildProgress().catch(function() { return {}; }),
			callStorageInfo().catch(function() { return {}; }),
			callHistoryList().catch(function() { return []; }),
			callSerialPorts().catch(function() { return []; }),
			callListRemotes().catch(function() { return []; }),
			// Factory data
			callPendingDevices().catch(function() { return []; }),
			callInventory().catch(function() { return []; }),
			callListProfiles().catch(function() { return []; }),
			callDiscoveryStatus().catch(function() { return {}; })
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.images = data[1] || [];
		this.tokens = data[2] || [];
		this.clones = data[3] || [];
		this.devices = data[4] || [];
		this.buildProgress = data[5] || {};
		this.storage = data[6] || {};
		this.history = data[7] || [];
		this.serialPorts = data[8] || [];
		this.remotes = data[9] || [];
		// Factory data
		this.pendingDevices = data[10] || [];
		this.hwInventory = data[11] || [];
		this.profiles = data[12] || [];
		this.discoveryStatus = data[13] || {};

		var tabs = [
			{ id: 'overview', label: 'Overview', icon: '🎛️' },
			{ id: 'factory', label: 'Factory', icon: '🏭' },
			{ id: 'remotes', label: 'Remotes', icon: '🌐' },
			{ id: 'build', label: 'Build', icon: '🔨' },
			{ id: 'console', label: 'Console', icon: '📟' },
			{ id: 'history', label: 'History', icon: '📜' },
			{ id: 'images', label: 'Images', icon: '💾' }
		];

		var content = [
			// Header
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;' }, [
				E('div', {}, [
					E('h1', { 'style': 'font-size:28px;font-weight:700;margin:0;display:flex;align-items:center;gap:12px;' }, [
						'🔄 Cloning Station'
					]),
					E('p', { 'style': 'color:var(--kiss-muted);margin:6px 0 0;' }, 'Build, deploy, and manage SecuBox clone images')
				]),
				E('div', { 'style': 'display:flex;gap:8px;' }, [
					KissTheme.badge(this.status.device_type || 'unknown', 'blue'),
					KissTheme.badge(this.status.tftp_running ? 'TFTP ON' : 'TFTP OFF',
						this.status.tftp_running ? 'green' : 'red')
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

		poll.add(L.bind(this.refresh, this), 5);
		return KissTheme.wrap(content, 'admin/secubox/system/cloner');
	},

	switchTab: function(tabId) {
		this.currentTab = tabId;
		var tabContent = document.getElementById('tab-content');
		if (tabContent) {
			dom.content(tabContent, this.renderTabContent());
		}
		// Update tab buttons
		document.querySelectorAll('.kiss-tab').forEach(function(btn) {
			btn.classList.toggle('kiss-tab-active', btn.dataset.tab === tabId);
		});
	},

	renderTabContent: function() {
		switch (this.currentTab) {
			case 'factory': return this.renderFactoryTab();
			case 'remotes': return this.renderRemotesTab();
			case 'build': return this.renderBuildTab();
			case 'console': return this.renderConsoleTab();
			case 'history': return this.renderHistoryTab();
			case 'images': return this.renderImagesTab();
			default: return this.renderOverviewTab();
		}
	},

	// ========================================================================
	// Overview Tab
	// ========================================================================

	renderOverviewTab: function() {
		var self = this;

		return E('div', {}, [
			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'id': 'stats-grid', 'style': 'margin-bottom:24px;' }, [
				KissTheme.stat(this.images.length, 'Images', 'var(--kiss-blue)'),
				KissTheme.stat(this.tokens.length, 'Tokens', 'var(--kiss-purple)'),
				KissTheme.stat(this.status.clone_count || 0, 'Clones', 'var(--kiss-green)'),
				KissTheme.stat(this.status.tftp_running ? 'Active' : 'Idle', 'TFTP', this.status.tftp_running ? 'var(--kiss-green)' : 'var(--kiss-muted)')
			]),

			// Quick Actions
			KissTheme.card([
				E('span', {}, '⚡ Quick Actions')
			], E('div', { 'style': 'display:flex;gap:12px;flex-wrap:wrap;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.switchTab('build'); }
				}, ['🔨 ', 'Build Image']),
				E('button', {
					'class': 'kiss-btn ' + (this.status.tftp_running ? 'kiss-btn-red' : 'kiss-btn-green'),
					'click': function() { self.handleTftp(!self.status.tftp_running); }
				}, [this.status.tftp_running ? '⏹️ Stop TFTP' : '▶️ Start TFTP']),
				E('button', {
					'class': 'kiss-btn',
					'click': function() { self.handleNewToken(); }
				}, ['🎟️ ', 'New Token']),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.handleAutoToken(); }
				}, ['✅ ', 'Auto-Approve Token'])
			])),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-top:16px;' }, [
				// Tokens
				KissTheme.card([
					E('span', {}, '🎟️ Clone Tokens'),
					E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.tokens.length + ' active')
				], E('div', { 'id': 'tokens-container' }, this.renderTokens())),

				// Storage Info
				KissTheme.card([
					E('span', {}, '💽 Storage'),
					E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, fmtSize(this.storage.available_bytes) + ' free')
				], this.renderStorageInfo())
			]),

			// TFTP Instructions (if running)
			this.status.tftp_running ? this.renderTftpInstructions() : null,

			// Cloned Devices
			KissTheme.card([
				E('span', {}, '📡 Cloned Devices'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, (this.status.clone_count || 0) + ' registered')
			], E('div', { 'id': 'clones-container' }, this.renderClones()))
		].filter(Boolean));
	},

	renderStorageInfo: function() {
		var s = this.storage;
		var total = (s.clone_dir_bytes || 0) + (s.tftp_dir_bytes || 0);
		var avail = s.available_bytes || 1;
		var usedPct = Math.min(100, Math.round((total / (total + avail)) * 100));

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' }, [
			E('div', { 'style': 'display:flex;justify-content:space-between;font-size:13px;' }, [
				E('span', {}, 'Clone Dir'),
				E('span', { 'style': 'color:var(--kiss-cyan);' }, fmtSize(s.clone_dir_bytes))
			]),
			E('div', { 'style': 'display:flex;justify-content:space-between;font-size:13px;' }, [
				E('span', {}, 'TFTP Dir'),
				E('span', { 'style': 'color:var(--kiss-cyan);' }, fmtSize(s.tftp_dir_bytes))
			]),
			E('div', { 'class': 'kiss-progress', 'style': 'height:8px;margin-top:8px;' }, [
				E('div', { 'class': 'kiss-progress-fill', 'style': 'width:' + usedPct + '%;background:var(--kiss-blue);' })
			]),
			E('div', { 'style': 'text-align:center;font-size:11px;color:var(--kiss-muted);' },
				fmtSize(total) + ' used / ' + fmtSize(avail) + ' available')
		]);
	},

	renderTokens: function() {
		var self = this;
		if (!this.tokens.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '🎟️'),
				E('div', {}, 'No tokens'),
				E('div', { 'style': 'font-size:12px;margin-top:4px;' }, 'Generate a token for new devices')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:6px;' },
			this.tokens.map(function(tok) {
				var isAuto = tok.auto_approve;
				var isUsed = tok.used;
				return E('div', {
					'style': 'display:flex;align-items:center;gap:10px;padding:10px;background:var(--kiss-bg2);border-radius:6px;border:1px solid var(--kiss-line);' + (isUsed ? 'opacity:0.5;' : '')
				}, [
					E('div', { 'style': 'font-family:monospace;font-size:12px;flex:1;color:var(--kiss-cyan);' }, tok.token_short || tok.token.slice(0, 12) + '...'),
					isAuto ? E('span', { 'style': 'font-size:10px;padding:2px 6px;background:rgba(0,200,83,0.2);color:var(--kiss-green);border-radius:4px;' }, 'AUTO') : null,
					isUsed ? E('span', { 'style': 'font-size:10px;color:var(--kiss-muted);' }, 'used') : null,
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:4px 8px;font-size:11px;',
						'data-token': tok.token,
						'click': function(ev) { self.handleDeleteToken(ev); }
					}, '✕')
				].filter(Boolean));
			})
		);
	},

	renderTftpInstructions: function() {
		var ip = this.status.lan_ip || '192.168.255.1';
		var cmds = [
			'setenv serverip ' + ip,
			'setenv ipaddr 192.168.255.100',
			'dhcp',
			'tftpboot 0x6000000 secubox-clone.img',
			'mmc dev 1',
			'mmc write 0x6000000 0 ${filesize}',
			'reset'
		].join('\n');

		return E('div', { 'class': 'kiss-card kiss-panel-green', 'style': 'margin-top:16px;' }, [
			E('div', { 'class': 'kiss-card-title' }, '📟 U-Boot Flash Commands'),
			E('p', { 'style': 'color:var(--kiss-muted);font-size:13px;margin-bottom:12px;' },
				'Run these commands in U-Boot (Marvell>> prompt) on the target device:'),
			E('pre', { 'style': 'background:#000;color:#0f0;padding:16px;border-radius:8px;font-size:12px;overflow-x:auto;margin:0;' }, cmds),
			E('button', {
				'class': 'kiss-btn',
				'style': 'margin-top:12px;',
				'click': function() {
					navigator.clipboard.writeText(cmds);
					ui.addNotification(null, E('p', 'Commands copied to clipboard'), 'info');
				}
			}, ['📋 ', 'Copy Commands'])
		]);
	},

	renderClones: function() {
		if (!this.clones.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '📡'),
				E('div', {}, 'No clones registered yet')
			]);
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Device'),
				E('th', {}, 'IP'),
				E('th', {}, 'Status')
			])),
			E('tbody', {}, this.clones.map(function(c) {
				var statusColor = c.status === 'active' ? 'var(--kiss-green)' : 'var(--kiss-yellow)';
				return E('tr', {}, [
					E('td', { 'style': 'font-family:monospace;' }, c.name || c.info || '-'),
					E('td', {}, c.ip || '-'),
					E('td', {}, E('span', { 'style': 'color:' + statusColor + ';' }, c.status || 'pending'))
				]);
			}))
		]);
	},

	// ========================================================================
	// Factory Tab
	// ========================================================================

	renderFactoryTab: function() {
		var self = this;
		var disco = this.discoveryStatus || {};
		var pendingCount = this.pendingDevices.length;
		var inventoryCount = this.hwInventory.length;
		var profileCount = this.profiles.length;

		return E('div', {}, [
			// Stats Grid
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin-bottom:24px;' }, [
				KissTheme.stat(disco.enabled ? '🟢 ON' : '🔴 OFF', 'Discovery', disco.enabled ? 'var(--kiss-green)' : 'var(--kiss-red)'),
				KissTheme.stat(pendingCount, 'Pending', pendingCount > 0 ? 'var(--kiss-yellow)' : 'var(--kiss-muted)'),
				KissTheme.stat(inventoryCount, 'Inventory', 'var(--kiss-blue)'),
				KissTheme.stat(profileCount, 'Profiles', 'var(--kiss-purple)')
			]),

			// Two column layout
			E('div', { 'class': 'kiss-grid kiss-grid-2', 'style': 'margin-bottom:16px;' }, [
				// Discovery Mode Toggle
				KissTheme.card([
					E('span', {}, '🔍 Discovery Mode')
				], E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' }, [
					E('div', { 'style': 'display:flex;align-items:center;gap:12px;' }, [
						E('span', { 'style': 'font-size:40px;' }, disco.enabled ? '🟢' : '🔴'),
						E('div', {}, [
							E('div', { 'style': 'font-weight:600;font-size:16px;' }, disco.enabled ? 'Zero-Touch Active' : 'Discovery Disabled'),
							E('div', { 'style': 'font-size:12px;color:var(--kiss-muted);' }, disco.enabled ? 'Listening for new devices' : 'No auto-provisioning')
						])
					]),
					E('div', { 'style': 'display:flex;gap:8px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'disabled': disco.enabled,
							'style': disco.enabled ? 'opacity:0.5;' : '',
							'click': function() { self.handleToggleDiscovery(true); }
						}, '▶️ Enable'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'disabled': !disco.enabled,
							'style': !disco.enabled ? 'opacity:0.5;' : '',
							'click': function() { self.handleToggleDiscovery(false); }
						}, '⏹️ Disable')
					]),
					disco.last_scan ? E('div', { 'style': 'font-size:11px;color:var(--kiss-muted);' }, 'Last scan: ' + fmtRelative(disco.last_scan)) : null
				].filter(Boolean))),

				// Bulk Token Generator
				KissTheme.card([
					E('span', {}, '🎟️ Bulk Token Generator')
				], E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' }, [
					E('div', { 'style': 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;' }, [
						E('input', {
							'id': 'bulk-token-count',
							'type': 'number',
							'min': '1',
							'max': '50',
							'value': '10',
							'placeholder': 'Count',
							'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);width:80px;'
						}),
						E('select', {
							'id': 'bulk-token-profile',
							'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);min-width:150px;'
						}, this.profiles.length ?
							this.profiles.map(function(p) { return E('option', { 'value': p.id }, p.name); }) :
							[E('option', { 'value': 'default' }, 'Default Profile')]
						),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': function() { self.handleGenerateBulkTokens(); }
						}, '🎟️ Generate')
					]),
					E('div', { 'id': 'generated-tokens-container' }, this.renderGeneratedTokens())
				]))
			]),

			// Pending Devices
			KissTheme.card([
				E('span', {}, '⏳ Pending Devices'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, pendingCount + ' awaiting approval')
			], E('div', { 'id': 'pending-devices-container' }, this.renderPendingDevices())),

			// Hardware Inventory
			KissTheme.card([
				E('span', {}, '📦 Hardware Inventory'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, inventoryCount + ' devices')
			], E('div', { 'id': 'inventory-container' }, this.renderInventory()))
		]);
	},

	renderPendingDevices: function() {
		var self = this;

		if (!this.pendingDevices.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '✅'),
				E('div', {}, 'No pending devices'),
				E('div', { 'style': 'font-size:12px;margin-top:4px;' }, 'New devices will appear here for approval')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:8px;' },
			this.pendingDevices.map(function(dev) {
				return E('div', {
					'style': 'display:flex;align-items:center;gap:12px;padding:12px;background:var(--kiss-bg2);border-radius:8px;border:1px solid var(--kiss-line);'
				}, [
					E('span', { 'style': 'font-size:24px;' }, '📱'),
					E('div', { 'style': 'flex:1;' }, [
						E('div', { 'style': 'font-weight:600;' }, dev.hostname || 'Unknown Device'),
						E('div', { 'style': 'font-size:12px;color:var(--kiss-muted);display:flex;gap:12px;' }, [
							E('span', {}, '🔗 ' + (dev.mac || '-')),
							E('span', {}, '📍 ' + (dev.ip || '-')),
							E('span', {}, '📱 ' + (dev.model || 'Unknown'))
						])
					]),
					E('select', {
						'class': 'device-profile-select',
						'data-device-id': dev.id,
						'style': 'padding:6px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:4px;color:var(--kiss-text);font-size:12px;'
					}, self.profiles.length ?
						self.profiles.map(function(p) { return E('option', { 'value': p.id }, p.name); }) :
						[E('option', { 'value': 'default' }, 'Default')]
					),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding:6px 12px;font-size:12px;',
						'data-device-id': dev.id,
						'click': function(ev) { self.handleApproveDevice(ev); }
					}, '✅'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:6px 12px;font-size:12px;',
						'data-device-id': dev.id,
						'click': function(ev) { self.handleRejectDevice(ev); }
					}, '❌')
				]);
			})
		);
	},

	renderGeneratedTokens: function() {
		if (!this.generatedTokens.length) {
			return E('div', { 'style': 'text-align:center;padding:16px;color:var(--kiss-muted);font-size:12px;' },
				'Generate tokens to see them here');
		}

		var self = this;
		return E('div', { 'style': 'display:flex;flex-direction:column;gap:6px;' }, [
			E('div', { 'style': 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;' }, [
				E('span', { 'style': 'font-size:12px;color:var(--kiss-muted);' }, this.generatedTokens.length + ' tokens generated'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:4px 8px;font-size:11px;',
					'click': function() { self.handleCopyAllTokens(); }
				}, '📋 Copy All')
			]),
			E('div', { 'style': 'max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;' },
				this.generatedTokens.map(function(tok) {
					return E('div', {
						'style': 'font-family:monospace;font-size:11px;padding:6px 8px;background:var(--kiss-bg);border-radius:4px;color:var(--kiss-cyan);word-break:break-all;'
					}, tok);
				})
			)
		]);
	},

	renderInventory: function() {
		if (!this.hwInventory.length) {
			return E('div', { 'style': 'text-align:center;padding:30px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:32px;margin-bottom:8px;' }, '📦'),
				E('div', {}, 'No devices in inventory'),
				E('div', { 'style': 'font-size:12px;margin-top:4px;' }, 'Discovered hardware will appear here')
			]);
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'ID'),
				E('th', {}, 'MAC'),
				E('th', {}, 'Model'),
				E('th', {}, 'CPU'),
				E('th', {}, 'RAM'),
				E('th', {}, 'Storage'),
				E('th', {}, 'Collected')
			])),
			E('tbody', {}, this.hwInventory.map(function(dev) {
				return E('tr', {}, [
					E('td', { 'style': 'font-family:monospace;font-size:11px;' }, dev.id || '-'),
					E('td', { 'style': 'font-family:monospace;font-size:11px;' }, dev.mac || '-'),
					E('td', {}, dev.model || '-'),
					E('td', {}, dev.cpu || '-'),
					E('td', {}, dev.ram ? fmtSize(dev.ram) : '-'),
					E('td', {}, dev.storage ? fmtSize(dev.storage) : '-'),
					E('td', { 'style': 'font-size:11px;' }, dev.collected ? fmtRelative(dev.collected) : '-')
				]);
			}))
		]);
	},

	handleToggleDiscovery: function(enabled) {
		var self = this;
		callToggleDiscovery(enabled).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', enabled ? 'Discovery mode enabled' : 'Discovery mode disabled'), 'info');
				self.refreshFactory();
			} else {
				ui.addNotification(null, E('p', res.error || 'Failed to toggle discovery'), 'error');
			}
		});
	},

	handleApproveDevice: function(ev) {
		var self = this;
		var deviceId = ev.currentTarget.dataset.deviceId;
		var row = ev.currentTarget.closest('div[style*="background:var(--kiss-bg2)"]');
		var profileSelect = row ? row.querySelector('.device-profile-select') : null;
		var profile = profileSelect ? profileSelect.value : 'default';

		callApproveDevice(deviceId, profile).then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', 'Device approved and provisioned'), 'info');
				self.refreshFactory();
			} else {
				ui.addNotification(null, E('p', res.error || 'Approval failed'), 'error');
			}
		});
	},

	handleRejectDevice: function(ev) {
		var self = this;
		var deviceId = ev.currentTarget.dataset.deviceId;

		if (confirm('Reject this device? It will need to reconnect to request provisioning again.')) {
			callRejectDevice(deviceId, 'Manual rejection').then(function(res) {
				if (res.success) {
					ui.addNotification(null, E('p', 'Device rejected'), 'info');
					self.refreshFactory();
				} else {
					ui.addNotification(null, E('p', res.error || 'Rejection failed'), 'error');
				}
			});
		}
	},

	handleGenerateBulkTokens: function() {
		var self = this;
		var countEl = document.getElementById('bulk-token-count');
		var profileEl = document.getElementById('bulk-token-profile');
		var count = parseInt(countEl ? countEl.value : '10', 10);
		var profile = profileEl ? profileEl.value : 'default';

		if (count < 1 || count > 50) {
			ui.addNotification(null, E('p', 'Count must be between 1 and 50'), 'warning');
			return;
		}

		ui.addNotification(null, E('p', 'Generating ' + count + ' tokens...'), 'info');

		callBulkTokens(count, profile, 86400).then(function(tokens) {
			self.generatedTokens = tokens || [];
			var container = document.getElementById('generated-tokens-container');
			if (container) {
				dom.content(container, self.renderGeneratedTokens());
			}
			if (self.generatedTokens.length) {
				ui.addNotification(null, E('p', 'Generated ' + self.generatedTokens.length + ' tokens'), 'info');
			} else {
				ui.addNotification(null, E('p', 'No tokens generated'), 'warning');
			}
		});
	},

	handleCopyAllTokens: function() {
		if (!this.generatedTokens.length) return;
		var text = this.generatedTokens.join('\n');
		navigator.clipboard.writeText(text).then(function() {
			ui.addNotification(null, E('p', 'All tokens copied to clipboard'), 'info');
		});
	},

	refreshFactory: function() {
		var self = this;
		return Promise.all([
			callPendingDevices().catch(function() { return []; }),
			callInventory().catch(function() { return []; }),
			callListProfiles().catch(function() { return []; }),
			callDiscoveryStatus().catch(function() { return {}; })
		]).then(function(data) {
			self.pendingDevices = data[0] || [];
			self.hwInventory = data[1] || [];
			self.profiles = data[2] || [];
			self.discoveryStatus = data[3] || {};

			// Re-render Factory tab if active
			if (self.currentTab === 'factory') {
				var tabContent = document.getElementById('tab-content');
				if (tabContent) {
					dom.content(tabContent, self.renderFactoryTab());
				}
			}
		});
	},

	// ========================================================================
	// Remotes Tab
	// ========================================================================

	renderRemotesTab: function() {
		var self = this;

		return E('div', {}, [
			// Add Remote Form
			KissTheme.card([
				E('span', {}, '➕ Add Remote Device')
			], E('div', {}, [
				E('div', { 'style': 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;' }, [
					E('input', {
						'id': 'remote-ip',
						'type': 'text',
						'placeholder': 'IP Address (e.g., 192.168.255.125)',
						'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);width:200px;'
					}),
					E('input', {
						'id': 'remote-name',
						'type': 'text',
						'placeholder': 'Name (e.g., moka1)',
						'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);width:150px;'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.handleAddRemote(); }
					}, '➕ Add'),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() { self.handleScanNetwork(); }
					}, '🔍 Scan Network')
				]),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:12px;margin-top:12px;margin-bottom:0;' },
					'Add remote SecuBox devices for network-based flashing. Requires SSH key authentication.')
			])),

			// Scanned Devices (if any)
			this.scannedDevices.length ? KissTheme.card([
				E('span', {}, '🔍 Discovered Devices'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.scannedDevices.length + ' found')
			], E('div', { 'style': 'display:flex;flex-direction:column;gap:8px;' },
				this.scannedDevices.map(function(dev) {
					return E('div', {
						'style': 'display:flex;align-items:center;gap:12px;padding:10px;background:var(--kiss-bg2);border-radius:6px;'
					}, [
						E('span', { 'style': 'font-size:20px;' }, dev.ssh_ok ? '✅' : '⚠️'),
						E('div', { 'style': 'flex:1;' }, [
							E('div', { 'style': 'font-weight:600;' }, dev.hostname || 'Unknown'),
							E('div', { 'style': 'font-size:12px;color:var(--kiss-muted);' }, dev.ip)
						]),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-ip': dev.ip,
							'data-name': dev.hostname,
							'click': function(ev) {
								document.getElementById('remote-ip').value = ev.currentTarget.dataset.ip;
								document.getElementById('remote-name').value = ev.currentTarget.dataset.name;
							}
						}, '➕ Add')
					]);
				})
			)) : null,

			// Configured Remotes
			KissTheme.card([
				E('span', {}, '🌐 Remote Devices'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.remotes.length + ' configured')
			], E('div', { 'id': 'remotes-list' }, this.renderRemotesList()))
		].filter(Boolean));
	},

	renderRemotesList: function() {
		var self = this;

		if (!this.remotes.length) {
			return E('div', { 'style': 'text-align:center;padding:40px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:48px;margin-bottom:12px;' }, '🌐'),
				E('div', { 'style': 'font-size:16px;' }, 'No remote devices configured'),
				E('div', { 'style': 'font-size:12px;margin-top:8px;' }, 'Add a remote device to flash images over the network')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' },
			this.remotes.map(function(remote) {
				return E('div', {
					'style': 'display:flex;align-items:center;gap:16px;padding:16px;background:var(--kiss-bg2);border-radius:10px;border:1px solid var(--kiss-line);'
				}, [
					E('div', { 'style': 'font-size:36px;' }, remote.online ? '🟢' : '🔴'),
					E('div', { 'style': 'flex:1;' }, [
						E('div', { 'style': 'font-weight:600;font-size:16px;' }, remote.name),
						E('div', { 'style': 'font-size:13px;color:var(--kiss-muted);display:flex;gap:16px;' }, [
							E('span', {}, '📍 ' + remote.ip),
							E('span', {}, remote.online ? '✅ Online' : '❌ Offline'),
							remote.token ? E('span', { 'style': 'color:var(--kiss-cyan);' }, '🎟️ ' + remote.token) : null
						].filter(Boolean))
					]),
					E('div', { 'style': 'display:flex;gap:8px;flex-wrap:wrap;' }, [
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-ip': remote.ip,
							'click': function(ev) { self.handleRemoteStatus(ev.currentTarget.dataset.ip); }
						}, '📊 Status'),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-ip': remote.ip,
							'data-name': remote.name,
							'click': function(ev) { self.showFlashModal(ev.currentTarget.dataset.ip, ev.currentTarget.dataset.name); }
						}, '🚀 Flash'),
						E('a', {
							'class': 'kiss-btn',
							'style': 'padding:6px 12px;font-size:12px;text-decoration:none;',
							'href': 'http://' + remote.ip + '/cgi-bin/luci/',
							'target': '_blank'
						}, '🔗 LuCI'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-ip': remote.ip,
							'click': function(ev) { self.handleRemoveRemote(ev.currentTarget.dataset.ip); }
						}, '✕')
					])
				]);
			})
		);
	},

	showFlashModal: function(ip, name) {
		var self = this;

		// Build image options
		var imageOptions = this.images.map(function(img) {
			return E('option', { 'value': img.name }, img.name + ' (' + img.size + ')');
		});

		// Build token options
		var tokenOptions = [E('option', { 'value': '' }, '-- No token --')].concat(
			this.tokens.map(function(tok) {
				return E('option', { 'value': tok.token }, (tok.auto_approve ? '✅ ' : '') + tok.token.slice(0, 16) + '...');
			})
		);

		ui.showModal('Flash ' + name + ' (' + ip + ')', [
			E('div', { 'style': 'margin-bottom:16px;' }, [
				E('label', { 'style': 'display:block;margin-bottom:8px;font-weight:600;' }, 'Select Image:'),
				E('select', {
					'id': 'flash-image',
					'style': 'width:100%;padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);'
				}, imageOptions.length ? imageOptions : [E('option', {}, 'No images available')])
			]),
			E('div', { 'style': 'margin-bottom:16px;' }, [
				E('label', { 'style': 'display:block;margin-bottom:8px;font-weight:600;' }, 'Clone Token (for mesh join):'),
				E('select', {
					'id': 'flash-token',
					'style': 'width:100%;padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);'
				}, tokenOptions)
			]),
			E('div', { 'style': 'margin-bottom:16px;' }, [
				E('label', { 'style': 'display:flex;align-items:center;gap:8px;' }, [
					E('input', { 'id': 'flash-keep-settings', 'type': 'checkbox' }),
					E('span', {}, 'Keep settings (not recommended for cloning)')
				])
			]),
			E('div', { 'style': 'background:var(--kiss-bg2);padding:12px;border-radius:6px;margin-bottom:16px;' }, [
				E('div', { 'style': 'font-weight:600;color:var(--kiss-yellow);margin-bottom:8px;' }, '⚠️ Warning'),
				E('div', { 'style': 'font-size:13px;color:var(--kiss-muted);' }, [
					'This will upload the selected image to the remote device and trigger sysupgrade. ',
					'The device will reboot and may take several minutes to come back online. ',
					'If a token is selected, it will be injected for automatic mesh join.'
				])
			]),
			E('div', { 'class': 'right', 'style': 'display:flex;gap:8px;justify-content:flex-end;' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var image = document.getElementById('flash-image')?.value;
						var token = document.getElementById('flash-token')?.value;
						var keepSettings = document.getElementById('flash-keep-settings')?.checked;
						self.handleRemoteFlash(ip, image, token, keepSettings);
					}
				}, '🚀 Flash Now')
			])
		]);
	},

	handleAddRemote: function() {
		var self = this;
		var ip = document.getElementById('remote-ip')?.value;
		var name = document.getElementById('remote-name')?.value;

		if (!ip) {
			ui.addNotification(null, E('p', 'IP address required'), 'warning');
			return;
		}

		callAddRemote(ip, name || ip, '').then(function(res) {
			if (res.success) {
				ui.addNotification(null, E('p', res.message), 'info');
				document.getElementById('remote-ip').value = '';
				document.getElementById('remote-name').value = '';
				self.refreshRemotes();
			} else {
				ui.addNotification(null, E('p', res.error), 'error');
			}
		});
	},

	handleRemoveRemote: function(ip) {
		var self = this;
		if (confirm('Remove remote device ' + ip + '?')) {
			callRemoveRemote(ip).then(function(res) {
				if (res.success) {
					ui.addNotification(null, E('p', res.message), 'info');
					self.refreshRemotes();
				} else {
					ui.addNotification(null, E('p', res.error), 'error');
				}
			});
		}
	},

	handleRemoteStatus: function(ip) {
		callRemoteStatus(ip).then(function(res) {
			if (res.success) {
				ui.showModal('Device Status: ' + ip, [
					E('table', { 'style': 'width:100%;' }, [
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Hostname:'), E('td', {}, res.hostname)]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Model:'), E('td', {}, res.model)]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Version:'), E('td', {}, res.version)]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Uptime:'), E('td', {}, Math.floor(res.uptime / 3600) + 'h ' + Math.floor((res.uptime % 3600) / 60) + 'm')]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'LuCI:'), E('td', {}, res.luci_accessible ? '✅ Accessible' : '❌ Not accessible')])
					]),
					E('div', { 'class': 'right', 'style': 'margin-top:20px;' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
					])
				]);
			} else {
				ui.addNotification(null, E('p', res.error), 'error');
			}
		});
	},

	handleRemoteFlash: function(ip, image, token, keepSettings) {
		var self = this;
		ui.hideModal();

		if (!image) {
			ui.addNotification(null, E('p', 'No image selected'), 'warning');
			return;
		}

		ui.addNotification(null, E('p', '🚀 Uploading and flashing ' + image + ' to ' + ip + '...'), 'info');

		callRemoteFlash(ip, image, keepSettings, token).then(function(res) {
			if (res.success) {
				ui.showModal('Flash Initiated', [
					E('div', { 'style': 'text-align:center;padding:20px;' }, [
						E('div', { 'style': 'font-size:48px;margin-bottom:16px;' }, '🚀'),
						E('div', { 'style': 'font-size:18px;font-weight:600;margin-bottom:12px;' }, 'Flashing in Progress'),
						E('div', { 'style': 'color:var(--kiss-muted);' }, res.message),
						E('div', { 'style': 'margin-top:16px;padding:12px;background:var(--kiss-bg2);border-radius:6px;' }, [
							E('div', { 'style': 'font-size:13px;' }, 'The device will reboot and come back online in 2-5 minutes.'),
							E('div', { 'style': 'font-size:13px;margin-top:8px;' }, [
								'Check status at: ',
								E('a', { 'href': 'http://' + ip + '/', 'target': '_blank' }, 'http://' + ip + '/')
							])
						])
					]),
					E('div', { 'class': 'right', 'style': 'margin-top:20px;' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'OK')
					])
				]);
				self.refreshRemotes();
			} else {
				ui.addNotification(null, E('p', 'Flash failed: ' + res.error), 'error');
			}
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Flash error: ' + err), 'error');
		});
	},

	handleScanNetwork: function() {
		var self = this;
		ui.addNotification(null, E('p', '🔍 Scanning network for devices...'), 'info');

		callScanNetwork().then(function(devices) {
			self.scannedDevices = devices || [];
			if (self.scannedDevices.length) {
				ui.addNotification(null, E('p', 'Found ' + self.scannedDevices.length + ' devices'), 'info');
			} else {
				ui.addNotification(null, E('p', 'No devices found'), 'warning');
			}
			// Re-render tab
			var tabContent = document.getElementById('tab-content');
			if (tabContent && self.currentTab === 'remotes') {
				dom.content(tabContent, self.renderRemotesTab());
			}
		});
	},

	refreshRemotes: function() {
		var self = this;
		callListRemotes().then(function(remotes) {
			self.remotes = remotes || [];
			var container = document.getElementById('remotes-list');
			if (container) dom.content(container, self.renderRemotesList());
		});
	},

	// ========================================================================
	// Build Tab
	// ========================================================================

	renderBuildTab: function() {
		var self = this;
		var p = this.buildProgress || {};
		var isBuilding = !!p.building;

		// Build button attributes - only set disabled when building
		var selectAttrs = {
			'id': 'device-type-select',
			'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);font-size:14px;min-width:250px;cursor:pointer;'
		};
		var buttonAttrs = {
			'class': 'kiss-btn kiss-btn-blue',
			'style': 'cursor:pointer;',
			'click': function() { self.handleBuild(); }
		};
		if (isBuilding) {
			selectAttrs.disabled = true;
			buttonAttrs.disabled = true;
		}

		return E('div', {}, [
			// Build Controls
			KissTheme.card([
				E('span', {}, '🔨 Build Clone Image')
			], E('div', {}, [
				E('div', { 'style': 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;' }, [
					E('select', selectAttrs, this.devices.map(function(dev) {
						return E('option', { 'value': dev.id }, dev.name + ' (' + dev.cpu + ')');
					})),
					E('button', buttonAttrs, isBuilding ? ['⏳ ', 'Building...'] : ['🔨 ', 'Start Build']),
					isBuilding ? E('span', { 'style': 'color:var(--kiss-yellow);font-size:13px;' }, '⚠️ Build in progress...') : null
				].filter(Boolean)),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:12px;margin-top:12px;margin-bottom:0;' },
					'Building uses OpenWrt ASU API and may take several minutes.')
			])),

			// Build Progress
			isBuilding || p.stage ? this.renderBuildProgress() : null,

			// Build Log
			KissTheme.card([
				E('span', {}, '📄 Build Log'),
				E('div', { 'style': 'margin-left:auto;display:flex;gap:8px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding:4px 10px;font-size:11px;',
						'click': function() { self.refreshBuildLog(); }
					}, '🔄 Refresh'),
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding:4px 10px;font-size:11px;',
						'click': function() { self.clearBuildLog(); }
					}, '🗑️ Clear')
				])
			], E('div', { 'id': 'build-log-container' }, this.renderBuildLog()))
		].filter(Boolean));
	},

	renderBuildProgress: function() {
		var p = this.buildProgress || {};
		var pct = p.progress || 0;
		var stage = p.stage || 'unknown';

		var stageInfo = {
			'initializing': { icon: '⏳', color: 'var(--kiss-muted)' },
			'downloading': { icon: '📥', color: 'var(--kiss-blue)' },
			'building': { icon: '🔨', color: 'var(--kiss-yellow)' },
			'packaging': { icon: '📦', color: 'var(--kiss-purple)' },
			'complete': { icon: '✅', color: 'var(--kiss-green)' },
			'failed': { icon: '❌', color: 'var(--kiss-red)' }
		};
		var info = stageInfo[stage] || stageInfo['initializing'];

		return E('div', { 'class': 'kiss-card', 'style': 'margin-top:16px;border-left:4px solid ' + info.color + ';' }, [
			E('div', { 'style': 'display:flex;align-items:center;gap:12px;margin-bottom:12px;' }, [
				E('span', { 'style': 'font-size:24px;' }, info.icon),
				E('div', {}, [
					E('div', { 'style': 'font-weight:600;' }, stage.charAt(0).toUpperCase() + stage.slice(1)),
					E('div', { 'style': 'font-size:12px;color:var(--kiss-muted);' }, pct + '% complete')
				])
			]),
			E('div', { 'class': 'kiss-progress', 'style': 'height:12px;' }, [
				E('div', { 'class': 'kiss-progress-fill', 'style': 'width:' + pct + '%;background:' + info.color + ';transition:width 0.5s;' })
			]),
			p.log ? E('div', { 'style': 'margin-top:12px;font-family:monospace;font-size:11px;color:var(--kiss-muted);white-space:pre-wrap;' }, p.log) : null
		].filter(Boolean));
	},

	renderBuildLog: function() {
		return E('pre', {
			'id': 'build-log',
			'style': 'background:#0a0a0a;color:#0f0;padding:16px;border-radius:8px;font-size:11px;height:300px;overflow-y:auto;margin:0;font-family:monospace;white-space:pre-wrap;word-break:break-all;'
		}, '(No build log yet. Start a build to see output here.)');
	},

	refreshBuildLog: function() {
		var self = this;
		callGetBuildLog(100, 0).then(function(res) {
			var logEl = document.getElementById('build-log');
			if (logEl && res.exists) {
				var content = atob_safe(res.content || '');
				logEl.textContent = content || '(Empty log)';
				logEl.scrollTop = logEl.scrollHeight;
			}
		});
	},

	clearBuildLog: function() {
		var logEl = document.getElementById('build-log');
		if (logEl) logEl.textContent = '(Log cleared)';
	},

	// ========================================================================
	// Console Tab
	// ========================================================================

	renderConsoleTab: function() {
		var self = this;

		return E('div', {}, [
			// Port Selection
			KissTheme.card([
				E('span', {}, '📟 Serial Console')
			], E('div', {}, [
				E('div', { 'style': 'display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px;' }, [
					E('select', {
						'id': 'serial-port-select',
						'style': 'padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);font-size:14px;min-width:200px;',
						'change': function(ev) { self.selectedPort = ev.target.value; }
					}, this.serialPorts.length ? this.serialPorts.map(function(p) {
						return E('option', { 'value': p.path }, p.name + (p.in_use ? ' (in use)' : ''));
					}) : [E('option', { 'value': '' }, 'No serial ports found')]),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() { self.refreshSerialPorts(); }
					}, '🔄 Refresh'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() { self.startSerialRead(); }
					}, '▶️ Start'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'click': function() { self.stopSerialRead(); }
					}, '⏹️ Stop')
				]),
				E('p', { 'style': 'color:var(--kiss-muted);font-size:12px;margin:0;' },
					'Connect to serial port to monitor U-Boot and clone flash progress'),
				E('div', { 'id': 'serial-status', 'style': 'margin-top:8px;font-weight:600;' }, '🔴 Stopped')
			])),

			// Console Output
			KissTheme.card([
				E('span', {}, '📺 Output'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'margin-left:auto;padding:4px 10px;font-size:11px;',
					'click': function() { self.clearConsole(); }
				}, '🗑️ Clear')
			], E('pre', {
				'id': 'serial-console',
				'style': 'background:#000;color:#0f0;padding:16px;border-radius:8px;font-size:12px;height:400px;overflow-y:auto;margin:0;font-family:monospace;white-space:pre-wrap;'
			}, this.serialBuffer || '(Waiting for serial data...)')),

			// Command Input
			KissTheme.card([
				E('span', {}, '⌨️ Send Command')
			], E('div', { 'style': 'display:flex;gap:12px;' }, [
				E('input', {
					'id': 'serial-cmd-input',
					'type': 'text',
					'placeholder': 'Enter command...',
					'style': 'flex:1;padding:10px;background:var(--kiss-bg2);border:1px solid var(--kiss-line);border-radius:6px;color:var(--kiss-text);font-family:monospace;',
					'keypress': function(ev) {
						if (ev.key === 'Enter') self.sendSerialCommand();
					}
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': function() { self.sendSerialCommand(); }
				}, '📤 Send')
			]))
		]);
	},

	refreshSerialPorts: function() {
		var self = this;
		callSerialPorts().then(function(ports) {
			self.serialPorts = ports || [];
			var select = document.getElementById('serial-port-select');
			if (select) {
				dom.content(select, self.serialPorts.length ? self.serialPorts.map(function(p) {
					return E('option', { 'value': p.path }, p.name + (p.in_use ? ' (in use)' : ''));
				}) : [E('option', { 'value': '' }, 'No serial ports found')]);
			}
		});
	},

	startSerialRead: function() {
		var self = this;
		var port = document.getElementById('serial-port-select')?.value;
		if (!port) {
			ui.addNotification(null, E('p', 'No serial port selected'), 'warning');
			return;
		}
		this.selectedPort = port;

		// Start the background serial monitor
		callSerialStart(port).then(function(res) {
			if (res.success) {
				self.serialReadActive = true;
				self.serialBuffer = '';
				ui.addNotification(null, E('p', 'Serial monitor started on ' + port), 'info');
				self.pollSerial();
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
	},

	stopSerialRead: function() {
		var self = this;
		this.serialReadActive = false;
		callSerialStop().then(function(res) {
			ui.addNotification(null, E('p', 'Serial monitor stopped'), 'info');
		});
	},

	pollSerial: function() {
		var self = this;
		if (!this.serialReadActive) return;

		callSerialRead(200).then(function(res) {
			if (res.data) {
				var text = atob_safe(res.data);
				if (text) {
					self.serialBuffer = text; // Replace with full log content
					var consoleEl = document.getElementById('serial-console');
					if (consoleEl) {
						consoleEl.textContent = self.serialBuffer || '(Waiting for data...)';
						consoleEl.scrollTop = consoleEl.scrollHeight;
					}
				}
			}
			// Update status indicator
			var statusEl = document.getElementById('serial-status');
			if (statusEl) {
				statusEl.textContent = res.running ? '🟢 Running' : '🔴 Stopped';
			}
			// Continue polling
			if (self.serialReadActive) {
				setTimeout(function() { self.pollSerial(); }, 1000);
			}
		}).catch(function() {
			if (self.serialReadActive) {
				setTimeout(function() { self.pollSerial(); }, 2000);
			}
		});
	},

	clearConsole: function() {
		this.serialBuffer = '';
		var consoleEl = document.getElementById('serial-console');
		if (consoleEl) consoleEl.textContent = '(Console cleared)';
	},

	sendSerialCommand: function() {
		var self = this;
		var input = document.getElementById('serial-cmd-input');
		var port = this.selectedPort || document.getElementById('serial-port-select')?.value;
		if (!input || !input.value || !port) return;

		var cmd = input.value;
		callSerialWrite(port, cmd).then(function(res) {
			if (res.success) {
				// Append to buffer locally for immediate feedback
				self.serialBuffer += '\n[TX] ' + cmd + '\n';
				var consoleEl = document.getElementById('serial-console');
				if (consoleEl) {
					consoleEl.textContent = self.serialBuffer;
					consoleEl.scrollTop = consoleEl.scrollHeight;
				}
			} else {
				ui.addNotification(null, E('p', 'Failed: ' + (res.error || 'unknown')), 'error');
			}
		});
		input.value = '';
	},

	// ========================================================================
	// History Tab
	// ========================================================================

	renderHistoryTab: function() {
		var self = this;

		return E('div', {}, [
			KissTheme.card([
				E('span', {}, '📜 Clone History'),
				E('div', { 'style': 'margin-left:auto;display:flex;gap:8px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding:4px 10px;font-size:11px;',
						'click': function() { self.refreshHistory(); }
					}, '🔄 Refresh'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:4px 10px;font-size:11px;',
						'click': function() { self.clearHistory(); }
					}, '🗑️ Clear All')
				])
			], E('div', { 'id': 'history-container' }, this.renderHistory()))
		]);
	},

	renderHistory: function() {
		if (!this.history.length) {
			return E('div', { 'style': 'text-align:center;padding:40px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:48px;margin-bottom:12px;' }, '📜'),
				E('div', { 'style': 'font-size:16px;' }, 'No clone history yet'),
				E('div', { 'style': 'font-size:12px;margin-top:8px;' }, 'Clone operations will be recorded here')
			]);
		}

		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Device'),
				E('th', {}, 'Image'),
				E('th', {}, 'Token'),
				E('th', {}, 'Status')
			])),
			E('tbody', {}, this.history.map(function(h) {
				var statusColors = {
					'success': 'var(--kiss-green)',
					'failed': 'var(--kiss-red)',
					'pending': 'var(--kiss-yellow)',
					'building': 'var(--kiss-blue)'
				};
				var color = statusColors[h.status] || 'var(--kiss-muted)';
				return E('tr', {}, [
					E('td', { 'style': 'font-size:12px;' }, fmtRelative(h.timestamp)),
					E('td', { 'style': 'font-family:monospace;font-size:12px;' }, h.device || '-'),
					E('td', {}, h.image || '-'),
					E('td', { 'style': 'font-family:monospace;font-size:11px;color:var(--kiss-cyan);' }, h.token || '-'),
					E('td', {}, E('span', { 'style': 'color:' + color + ';font-weight:600;' }, h.status || 'unknown'))
				]);
			}))
		]);
	},

	refreshHistory: function() {
		var self = this;
		callHistoryList().then(function(history) {
			self.history = history || [];
			var container = document.getElementById('history-container');
			if (container) dom.content(container, self.renderHistory());
		});
	},

	clearHistory: function() {
		var self = this;
		if (confirm('Clear all clone history?')) {
			callHistoryClear().then(function() {
				self.history = [];
				var container = document.getElementById('history-container');
				if (container) dom.content(container, self.renderHistory());
				ui.addNotification(null, E('p', 'History cleared'), 'info');
			});
		}
	},

	// ========================================================================
	// Images Tab
	// ========================================================================

	renderImagesTab: function() {
		var self = this;

		return E('div', {}, [
			// Storage Overview
			KissTheme.card([
				E('span', {}, '💽 Storage Overview')
			], this.renderStorageInfo()),

			// Images List
			KissTheme.card([
				E('span', {}, '💾 Clone Images'),
				E('span', { 'style': 'margin-left:auto;font-size:12px;color:var(--kiss-muted);' }, this.images.length + ' images')
			], E('div', { 'id': 'images-manager' }, this.renderImagesManager()))
		]);
	},

	renderImagesManager: function() {
		var self = this;

		if (!this.images.length) {
			return E('div', { 'style': 'text-align:center;padding:40px;color:var(--kiss-muted);' }, [
				E('div', { 'style': 'font-size:48px;margin-bottom:12px;' }, '💾'),
				E('div', { 'style': 'font-size:16px;' }, 'No images yet'),
				E('div', { 'style': 'font-size:12px;margin-top:8px;' }, 'Build an image to get started')
			]);
		}

		return E('div', { 'style': 'display:flex;flex-direction:column;gap:12px;' },
			this.images.map(function(img) {
				return E('div', {
					'style': 'display:flex;align-items:center;gap:16px;padding:16px;background:var(--kiss-bg2);border-radius:10px;border:1px solid var(--kiss-line);'
				}, [
					E('div', { 'style': 'font-size:36px;' }, '📦'),
					E('div', { 'style': 'flex:1;' }, [
						E('div', { 'style': 'font-weight:600;font-size:14px;margin-bottom:4px;' }, img.name),
						E('div', { 'style': 'font-size:12px;color:var(--kiss-muted);display:flex;gap:16px;' }, [
							E('span', {}, '📱 ' + (img.device || 'unknown')),
							E('span', {}, '📏 ' + (img.size || '-')),
							img.tftp_ready ? E('span', { 'style': 'color:var(--kiss-green);' }, '✓ TFTP Ready') :
								E('span', { 'style': 'color:var(--kiss-yellow);' }, '⏳ Not in TFTP')
						])
					]),
					E('div', { 'style': 'display:flex;gap:8px;' }, [
						E('button', {
							'class': 'kiss-btn',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-name': img.name,
							'click': function(ev) { self.showImageDetails(ev.currentTarget.dataset.name); }
						}, '🔍 Details'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding:6px 12px;font-size:12px;',
							'data-name': img.name,
							'click': function(ev) { self.handleDeleteImage(ev.currentTarget.dataset.name); }
						}, '🗑️ Delete')
					])
				]);
			})
		);
	},

	showImageDetails: function(name) {
		callImageDetails(name).then(function(res) {
			if (res.found) {
				ui.showModal('Image Details: ' + name, [
					E('table', { 'style': 'width:100%;' }, [
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Path:'), E('td', { 'style': 'font-family:monospace;' }, res.path)]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Size:'), E('td', {}, fmtSize(res.size_bytes))]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Modified:'), E('td', {}, fmtDate(res.modified))]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Checksum:'), E('td', { 'style': 'font-family:monospace;font-size:11px;' }, res.checksum)]),
						E('tr', {}, [E('td', { 'style': 'font-weight:600;padding:8px 0;' }, 'Valid:'), E('td', {}, res.valid ? '✅ Yes' : '⚠️ Unknown format')])
					]),
					E('div', { 'class': 'right', 'style': 'margin-top:20px;' }, [
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'Close')
					])
				]);
			} else {
				ui.addNotification(null, E('p', 'Image not found'), 'error');
			}
		});
	},

	handleDeleteImage: function(name) {
		var self = this;
		if (confirm('Delete image: ' + name + '?')) {
			callDeleteImage(name).then(function(res) {
				if (res.success) {
					ui.addNotification(null, E('p', 'Image deleted'), 'info');
					self.refresh();
				} else {
					ui.addNotification(null, E('p', 'Delete failed: ' + (res.message || 'unknown')), 'error');
				}
			});
		}
	},

	// ========================================================================
	// Action Handlers
	// ========================================================================

	handleBuild: function() {
		var self = this;
		var deviceType = document.getElementById('device-type-select')?.value;
		if (!deviceType) {
			ui.addNotification(null, E('p', 'Select a device type'), 'warning');
			return;
		}

		ui.addNotification(null, E('p', '🔨 Building image for ' + deviceType + '...'), 'info');
		callBuildImage(deviceType).then(function(res) {
			ui.addNotification(null, E('p', res.message || 'Build started'), res.success ? 'info' : 'warning');
			self.refresh();
		});
	},

	handleTftp: function(start) {
		var self = this;
		var fn = start ? callTftpStart : callTftpStop;
		fn().then(function(res) {
			ui.addNotification(null, E('p', res.message || (start ? 'TFTP started' : 'TFTP stopped')), 'info');
			self.refresh();
		});
	},

	handleNewToken: function() {
		var self = this;
		callGenerateToken(false).then(function(res) {
			if (res.success) {
				ui.showModal('Token Generated', [
					E('p', { 'style': 'color:var(--kiss-muted);' }, 'New clone token:'),
					E('pre', { 'style': 'background:var(--kiss-bg2);color:var(--kiss-cyan);padding:12px;border-radius:6px;word-break:break-all;font-size:12px;' }, res.token),
					E('p', { 'style': 'color:var(--kiss-yellow);font-size:12px;' }, '⚠️ Requires manual approval when used'),
					E('div', { 'class': 'right', 'style': 'margin-top:15px;' }, [
						E('button', { 'class': 'cbi-button', 'click': function() {
							navigator.clipboard.writeText(res.token);
							ui.addNotification(null, E('p', 'Copied!'), 'info');
						} }, '📋 Copy'),
						' ',
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'OK')
					])
				]);
				self.refresh();
			}
		});
	},

	handleAutoToken: function() {
		var self = this;
		callGenerateToken(true).then(function(res) {
			if (res.success) {
				ui.showModal('Auto-Approve Token', [
					E('p', { 'style': 'color:var(--kiss-muted);' }, 'Auto-approve token created:'),
					E('pre', { 'style': 'background:rgba(0,200,83,0.1);color:var(--kiss-green);padding:12px;border-radius:6px;word-break:break-all;font-size:12px;border:1px solid rgba(0,200,83,0.3);' }, res.token),
					E('p', { 'style': 'color:var(--kiss-green);font-size:12px;' }, '✅ Devices using this token auto-join without approval'),
					E('div', { 'class': 'right', 'style': 'margin-top:15px;' }, [
						E('button', { 'class': 'cbi-button', 'click': function() {
							navigator.clipboard.writeText(res.token);
							ui.addNotification(null, E('p', 'Copied!'), 'info');
						} }, '📋 Copy'),
						' ',
						E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.hideModal }, 'OK')
					])
				]);
				self.refresh();
			}
		});
	},

	handleDeleteToken: function(ev) {
		var token = ev.currentTarget.dataset.token;
		var self = this;
		if (confirm('Delete this token?')) {
			callDeleteToken(token).then(function() {
				self.refresh();
			});
		}
	},

	// ========================================================================
	// Refresh
	// ========================================================================

	refresh: function() {
		var self = this;
		var promises = [
			callGetStatus(),
			callListImages(),
			callListTokens(),
			callListClones(),
			callGetBuildProgress().catch(function() { return {}; }),
			callStorageInfo().catch(function() { return {}; })
		];

		// Include factory data when on factory tab
		if (self.currentTab === 'factory') {
			promises.push(
				callPendingDevices().catch(function() { return []; }),
				callDiscoveryStatus().catch(function() { return {}; })
			);
		}

		return Promise.all(promises).then(function(data) {
			self.status = data[0] || {};
			self.images = data[1] || [];
			self.tokens = data[2] || [];
			self.clones = data[3] || [];
			self.buildProgress = data[4] || {};
			self.storage = data[5] || {};

			// Factory data if available
			if (self.currentTab === 'factory' && data.length > 6) {
				self.pendingDevices = data[6] || [];
				self.discoveryStatus = data[7] || {};
			}

			// Only update current tab content
			var tabContent = document.getElementById('tab-content');
			if (tabContent) {
				dom.content(tabContent, self.renderTabContent());
			}

			// Auto-refresh build log if on build tab and building
			if (self.currentTab === 'build' && self.buildProgress.building) {
				self.refreshBuildLog();
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
