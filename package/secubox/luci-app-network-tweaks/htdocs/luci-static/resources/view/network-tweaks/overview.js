'use strict';
'require view';
'require form';
'require rpc';
'require ui';
'require poll';
'require dom';
'require secubox/kiss-theme';

var callNetworkTweaksStatus = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'getStatus',
	expect: { }
});

var callNetworkTweaksSyncNow = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'syncNow',
	expect: { }
});

var callNetworkTweaksSetConfig = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'setConfig',
	params: ['enabled', 'auto_sync', 'sync_hosts', 'sync_dnsmasq', 'lan_interface', 'default_ip']
});

var callGetNetworkComponents = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'getNetworkComponents',
	expect: { }
});

var callGetCumulativeImpact = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'getCumulativeImpact',
	expect: { }
});

var callCdnCacheStatus = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'status',
	expect: { }
});

var callCdnCacheSetEnabled = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'set_enabled',
	params: ['enabled'],
	expect: { }
});

var callGetWpadStatus = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'getWpadStatus',
	expect: { }
});

var callSetWpadEnabled = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'setWpadEnabled',
	params: ['enabled'],
	expect: { }
});

var callSetComponentEnabled = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'setComponentEnabled',
	params: ['app_id', 'enabled'],
	expect: { }
});

var callGetProxyStatus = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'getProxyStatus',
	expect: { }
});

var callSetAdGuardEnabled = rpc.declare({
	object: 'luci.network-tweaks',
	method: 'setAdGuardEnabled',
	params: ['enabled'],
	expect: { }
});

/**
 * Network Services Dashboard - KISS Style
 * Copyright (C) 2025 CyberMind.fr
 */

return view.extend({
	proxyStatusData: {},
	componentsData: [],
	cumulativeData: {},
	networkModeData: {},

	load: function() {
		return Promise.all([
			callNetworkTweaksStatus(),
			callGetNetworkComponents(),
			callGetCumulativeImpact(),
			callGetProxyStatus()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var componentsResponse = data[1] || {};
		var cumulativeResponse = data[2] || {};
		var proxyStatus = data[3] || {};

		this.componentsData = componentsResponse.components || [];
		this.cumulativeData = cumulativeResponse || {};
		this.networkModeData = componentsResponse.network_mode || {};
		this.proxyStatusData = proxyStatus || {};

		var m, s, o;

		m = new form.Map('network_tweaks', _('Network Services Dashboard'),
			_('Unified network services monitoring with dynamic component discovery and cumulative impact tracking'));

		// Add dashboard section before configuration
		s = m.section(form.NamedSection, '_dashboard', 'dashboard', null);
		s.anonymous = true;
		s.render = L.bind(this.renderDashboard, this);

		// Configuration section
		s = m.section(form.NamedSection, 'global', 'global', _('Configuration'));

		o = s.option(form.Flag, 'enabled', _('Enable Network Tweaks'),
			_('Enable automatic DNS and hosts synchronization'));
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'auto_sync', _('Auto Sync'),
			_('Automatically sync when VHost configuration changes'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'sync_dnsmasq', _('Sync DNSmasq'),
			_('Generate DNSmasq configuration for local domain resolution'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Flag, 'sync_hosts', _('Sync /etc/hosts'),
			_('Update /etc/hosts file with VHost domains'));
		o.default = '1';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'lan_interface', _('LAN Interface'),
			_('Network interface to use for IP address (default: lan)'));
		o.default = 'lan';
		o.placeholder = 'lan';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'default_ip', _('Override IP Address'),
			_('Manually specify IP address (leave empty to auto-detect from LAN interface)'));
		o.placeholder = 'Auto-detect';
		o.datatype = 'ip4addr';
		o.optional = true;
		o.depends('enabled', '1');

		// Start polling for auto-refresh
		poll.add(L.bind(this.pollData, this), 10);

		return m.render().then(function(node) {
			return KissTheme.wrap([node], 'admin/network/network-tweaks');
		});
	},

	renderDashboard: function() {
		var K = KissTheme;
		return K.E('div', { 'class': 'network-tweaks-dashboard' }, [
			this.renderCumulativeImpact(),
			this.renderNetworkModeStatus(),
			this.renderProxySettings(),
			this.renderComponentsGrid(),
			this.renderSyncSection()
		]);
	},

	renderCumulativeImpact: function() {
		var K = KissTheme;
		var cumulative = this.cumulativeData;
		var colors = {
			primary: 'var(--kiss-blue, #3b82f6)',
			info: 'var(--kiss-purple, #6366f1)',
			success: 'var(--kiss-green, #22c55e)',
			warning: 'var(--kiss-yellow, #fbbf24)'
		};

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['📊 ', 'Network Impact Summary']),
			K.E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'gap: 16px;' }, [
				this.renderImpactCard(K, 'Active Components', cumulative.active_components || 0, '🔧', colors.primary),
				this.renderImpactCard(K, 'DNS Entries', cumulative.total_dns_entries || 0, '🌐', colors.info),
				this.renderImpactCard(K, 'Published VHosts', cumulative.total_vhosts || 0, '📡', colors.success),
				this.renderImpactCard(K, 'Exposed Ports', cumulative.total_ports_exposed || 0, '🔌', colors.warning)
			])
		]);
	},

	renderImpactCard: function(K, label, value, icon, color) {
		return K.E('div', {
			'style': 'background: var(--kiss-bg2, #111827); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 20px; text-align: center;'
		}, [
			K.E('div', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, icon),
			K.E('div', { 'style': 'font-size: 32px; font-weight: bold; color: ' + color }, String(value)),
			K.E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-top: 4px;' }, label)
		]);
	},

	renderNetworkModeStatus: function() {
		var K = KissTheme;
		var mode = this.networkModeData;
		var modeId = mode.current_mode || 'unknown';
		var modeName = mode.mode_name || modeId;
		var syncEnabled = mode.sync_enabled || false;

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['🎯 ', 'Network Mode Integration']),
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;' }, [
				K.E('div', { 'style': 'display: flex; align-items: center; gap: 10px;' }, [
					K.E('span', { 'style': 'font-size: 20px;' }, '🎯'),
					K.E('span', { 'style': 'font-size: 16px; font-weight: bold;' }, modeName)
				]),
				K.E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
					K.E('span', { 'style': 'color: var(--kiss-muted); font-size: 13px;' }, 'DNS Sync:'),
					syncEnabled
						? K.E('span', { 'style': 'background: var(--kiss-green); color: #000; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold;' }, 'Enabled')
						: K.E('span', { 'style': 'background: var(--kiss-muted); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 12px;' }, 'Disabled')
				])
			])
		]);
	},

	renderProxySettings: function() {
		var K = KissTheme;
		var self = this;
		var proxy = this.proxyStatusData;
		var cdnCache = proxy.cdn_cache || {};
		var wpad = proxy.wpad || {};
		var adguard = proxy.adguard_home || {};

		var cardStyle = 'background: var(--kiss-bg2, #111827); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 16px;';
		var headerStyle = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
		var infoStyle = 'font-size: 13px; color: var(--kiss-muted); margin-bottom: 12px;';
		var actionsStyle = 'display: flex; gap: 8px;';

		var statusBadge = function(running, text) {
			return K.E('span', {
				'style': 'padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; ' +
					(running ? 'background: var(--kiss-green); color: #000;' : 'background: var(--kiss-red); color: #fff;')
			}, text);
		};

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['🛡️ ', 'DNS & Proxy Services']),
			K.E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'gap: 16px;' }, [
				// AdGuard Home Card
				K.E('div', { 'style': cardStyle }, [
					K.E('div', { 'style': headerStyle }, [
						K.E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							K.E('span', { 'style': 'font-size: 20px;' }, '🛡️'),
							K.E('span', { 'style': 'font-weight: bold;' }, 'AdGuard Home')
						]),
						statusBadge(adguard.running, adguard.running ? 'Running' : 'Stopped')
					]),
					K.E('div', { 'style': infoStyle }, [
						K.E('div', {}, adguard.installed ? 'Web UI: port ' + (adguard.port || 3000) : 'Not installed'),
						K.E('div', {}, adguard.installed ? 'DNS: port ' + (adguard.dns_port || 53) : 'Install via adguardhomectl')
					]),
					K.E('div', { 'style': actionsStyle }, [
						adguard.installed
							? K.E('button', {
								'class': 'kiss-btn ' + (adguard.enabled ? 'kiss-btn-red' : 'kiss-btn-green'),
								'style': 'padding: 6px 12px; font-size: 12px;',
								'click': L.bind(self.handleAdGuardToggle, self)
							}, adguard.enabled ? 'Disable' : 'Enable')
							: K.E('button', {
								'class': 'kiss-btn',
								'style': 'padding: 6px 12px; font-size: 12px; opacity: 0.5;',
								'disabled': 'disabled'
							}, 'Not Installed'),
						adguard.running ? K.E('a', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 6px 12px; font-size: 12px; text-decoration: none;',
							'href': 'http://' + window.location.hostname + ':' + (adguard.port || 3000),
							'target': '_blank'
						}, 'Open UI') : null
					].filter(Boolean))
				]),
				// CDN Cache Card
				K.E('div', { 'style': cardStyle }, [
					K.E('div', { 'style': headerStyle }, [
						K.E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							K.E('span', { 'style': 'font-size: 20px;' }, '📦'),
							K.E('span', { 'style': 'font-weight: bold;' }, 'CDN Cache')
						]),
						statusBadge(cdnCache.running, cdnCache.running ? 'Running' : 'Stopped')
					]),
					K.E('div', { 'style': infoStyle }, [
						K.E('div', {}, cdnCache.listening ? 'Listening on port ' + (cdnCache.port || 3128) : 'Not listening'),
						K.E('div', {}, cdnCache.installed ? 'nginx proxy installed' : 'Not installed')
					]),
					K.E('div', { 'style': actionsStyle },
						cdnCache.installed ? [
							K.E('button', {
								'class': 'kiss-btn ' + (cdnCache.enabled ? 'kiss-btn-red' : 'kiss-btn-green'),
								'style': 'padding: 6px 12px; font-size: 12px;',
								'click': L.bind(self.handleCdnCacheToggle, self)
							}, cdnCache.enabled ? 'Disable' : 'Enable'),
							K.E('button', {
								'class': 'kiss-btn kiss-btn-blue',
								'style': 'padding: 6px 12px; font-size: 12px;',
								'click': L.bind(self.handleCdnCacheRestart, self)
							}, 'Restart')
						] : [
							K.E('button', {
								'class': 'kiss-btn',
								'style': 'padding: 6px 12px; font-size: 12px; opacity: 0.5;',
								'disabled': 'disabled'
							}, 'Not Installed')
						]
					)
				]),
				// WPAD Card
				K.E('div', { 'style': cardStyle }, [
					K.E('div', { 'style': headerStyle }, [
						K.E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							K.E('span', { 'style': 'font-size: 20px;' }, '🌐'),
							K.E('span', { 'style': 'font-weight: bold;' }, 'WPAD Auto-Proxy')
						]),
						statusBadge(wpad.enabled, wpad.enabled ? 'Enabled' : 'Disabled')
					]),
					K.E('div', { 'style': infoStyle }, [
						K.E('div', {}, wpad.dhcp_configured ? 'DHCP Option 252 configured' : 'DHCP not configured'),
						K.E('div', {}, wpad.url ? wpad.url : 'No PAC URL set')
					]),
					K.E('div', { 'style': actionsStyle }, [
						K.E('button', {
							'class': 'kiss-btn ' + (wpad.enabled ? 'kiss-btn-red' : 'kiss-btn-green'),
							'style': 'padding: 6px 12px; font-size: 12px;',
							'click': L.bind(self.handleWpadToggle, self)
						}, wpad.enabled ? 'Disable' : 'Enable')
					])
				])
			])
		]);
	},

	handleCdnCacheToggle: function(ev) {
		var currentEnabled = this.proxyStatusData.cdn_cache?.enabled || false;
		var newEnabled = !currentEnabled;

		ui.showModal(_('Updating...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return callCdnCacheSetEnabled(newEnabled ? 1 : 0).then(L.bind(function() {
			ui.hideModal();
			this.refreshData();
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handleCdnCacheRestart: function(ev) {
		ui.showModal(_('Restarting...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return rpc.declare({
			object: 'luci.cdn-cache',
			method: 'restart',
			expect: { }
		})().then(L.bind(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', _('CDN Cache restarted')), 'info');
			this.refreshData();
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handleWpadToggle: function(ev) {
		var currentEnabled = this.proxyStatusData.wpad?.enabled || false;
		var newEnabled = !currentEnabled;

		ui.showModal(_('Updating...'), [
			E('p', { 'class': 'spinning' }, _('Please wait...'))
		]);

		return callSetWpadEnabled(newEnabled ? 1 : 0).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('WPAD updated')), 'info');
			}
			this.refreshData();
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	handleAdGuardToggle: function(ev) {
		var currentEnabled = this.proxyStatusData.adguard_home?.enabled || false;
		var newEnabled = !currentEnabled;

		ui.showModal(newEnabled ? _('Starting AdGuard Home...') : _('Stopping AdGuard Home...'), [
			E('p', { 'class': 'spinning' }, _('Please wait, this may take a moment...'))
		]);

		return callSetAdGuardEnabled(newEnabled ? 1 : 0).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', result.message || _('AdGuard Home updated')), 'info');
			} else {
				ui.addNotification(null, E('p', _('Error: ') + (result.error || 'Unknown error')), 'error');
			}
			// Delay refresh to allow container to start/stop
			setTimeout(L.bind(this.refreshData, this), 2000);
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	renderComponentsGrid: function() {
		var K = KissTheme;
		var components = this.componentsData;

		if (components.length === 0) {
			return K.E('div', { 'class': 'kiss-card', 'style': 'text-align: center; padding: 40px;' }, [
				K.E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '📭'),
				K.E('p', { 'style': 'color: var(--kiss-muted);' }, 'No network-impacting components detected')
			]);
		}

		return K.E('div', { 'class': 'kiss-card', 'style': 'margin-bottom: 16px;' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['🔧 ', 'Network Services']),
			K.E('div', {
				'class': 'kiss-grid kiss-grid-3',
				'style': 'gap: 16px;',
				'id': 'components-grid'
			}, components.map(L.bind(this.renderComponentCard, this)))
		]);
	},

	renderComponentCard: function(component) {
		var K = KissTheme;
		var self = this;
		var stateLabel = {
			'running': 'Running',
			'stopped': 'Stopped',
			'n/a': 'N/A'
		}[component.service_state] || component.service_state;

		var stateColor = component.service_state === 'running' ? 'var(--kiss-green)' : 'var(--kiss-muted)';
		var impact = component.network_impact || {};

		return K.E('div', {
			'style': 'background: var(--kiss-bg2, #111827); border: 1px solid var(--kiss-line, #1e293b); border-radius: 12px; padding: 16px;',
			'data-component-id': component.id
		}, [
			K.E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;' }, [
				K.E('div', {}, [
					K.E('h4', { 'style': 'margin: 0 0 4px; font-size: 14px;' }, component.name),
					K.E('span', { 'style': 'font-size: 12px; color: ' + stateColor + ';' }, '● ' + stateLabel)
				]),
				K.E('span', {
					'style': 'background: var(--kiss-purple, #6366f1); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px;'
				}, component.install_state)
			]),
			K.E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); margin-bottom: 12px;' }, [
				K.E('div', { 'style': 'display: flex; gap: 16px; flex-wrap: wrap;' }, [
					K.E('span', {}, '🌐 ' + (impact.dns_entries || 0) + ' DNS'),
					K.E('span', {}, '📡 ' + (impact.vhosts || 0) + ' VHosts'),
					K.E('span', {}, '🔌 ' + (impact.ports || 0) + ' ports')
				])
			]),
			K.E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); margin-bottom: 12px;' }, [
				'Contributes: ',
				(component.cumulative_contribution?.dnsmasq_entries || 0) + ' dnsmasq, ' +
				(component.cumulative_contribution?.hosts_entries || 0) + ' hosts'
			]),
			K.E('div', {}, [
				K.E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.showComponentDetails(component.id); }
				}, 'Details')
			])
		]);
	},

	renderSyncSection: function() {
		var K = KissTheme;
		return K.E('div', { 'class': 'kiss-card' }, [
			K.E('div', { 'class': 'kiss-card-title' }, ['🔄 ', 'Manual Synchronization']),
			K.E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px; font-size: 13px;' },
				'Trigger immediate synchronization of DNS and hosts entries'),
			K.E('button', {
				'class': 'kiss-btn kiss-btn-green',
				'style': 'padding: 10px 20px;',
				'click': L.bind(this.handleSyncNow, this)
			}, '🔄 Sync Now')
		]);
	},

	handleSyncNow: function(ev) {
		ui.showModal(_('Synchronizing...'), [
			E('p', { 'class': 'spinning' }, _('Please wait while synchronizing...'))
		]);

		return callNetworkTweaksSyncNow().then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Synchronization completed successfully')), 'info');
				this.refreshData();
			} else {
				ui.addNotification(null, E('p', _('Synchronization failed: ') + (result.error || 'Unknown error')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
		});
	},

	showComponentDetails: function(componentId) {
		var component = this.componentsData.find(function(c) {
			return c.id === componentId;
		});

		if (!component) return;

		var impact = component.network_impact || {};
		var capabilities = component.capabilities || [];

		var content = [
			E('h3', { 'style': 'margin: 0 0 16px; display: flex; align-items: center; gap: 10px;' }, [
				E('span', {}, '🔧'),
				component.name
			]),
			E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Category'),
					E('div', { 'style': 'font-size: 14px;' }, component.category)
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Install State'),
					E('div', { 'style': 'font-size: 14px;' }, component.install_state)
				]),
				E('div', {}, [
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-transform: uppercase;' }, 'Service State'),
					E('div', { 'style': 'font-size: 14px;' }, component.service_state)
				])
			]),
			E('h4', { 'style': 'margin: 0 0 12px; font-size: 14px;' }, '📊 Network Impact'),
			E('div', { 'style': 'display: flex; gap: 20px; margin-bottom: 20px;' }, [
				E('span', {}, '🌐 ' + (impact.dns_entries || 0) + ' DNS entries'),
				E('span', {}, '📡 ' + (impact.vhosts || 0) + ' VHosts'),
				E('span', {}, '🔌 ' + (impact.ports || 0) + ' ports')
			]),
			E('h4', { 'style': 'margin: 0 0 12px; font-size: 14px;' }, '⚡ Capabilities'),
			E('div', { 'style': 'margin-bottom: 20px;' },
				capabilities.length > 0
					? capabilities.map(function(cap) {
						return E('span', {
							'style': 'display: inline-block; background: var(--kiss-purple, #6366f1); color: #fff; padding: 4px 10px; margin: 4px; border-radius: 6px; font-size: 12px;'
						}, cap);
					})
					: E('p', { 'style': 'color: var(--kiss-muted);' }, 'None')
			),
			E('div', { 'style': 'text-align: right;' }, [
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 10px 20px;',
					'click': ui.hideModal
				}, 'Close')
			])
		];

		ui.showModal('Component Details', content, 'cbi-modal');
	},

	pollData: function() {
		return this.refreshData();
	},

	refreshData: function() {
		return Promise.all([
			callGetNetworkComponents(),
			callGetCumulativeImpact(),
			callGetProxyStatus()
		]).then(L.bind(function(data) {
			var componentsResponse = data[0] || {};
			var cumulativeResponse = data[1] || {};
			var proxyStatus = data[2] || {};

			this.componentsData = componentsResponse.components || [];
			this.cumulativeData = cumulativeResponse || {};
			this.networkModeData = componentsResponse.network_mode || {};
			this.proxyStatusData = proxyStatus || {};

			this.updateDisplay();
		}, this));
	},

	updateDisplay: function() {
		var dashboard = document.querySelector('.network-tweaks-dashboard');
		if (!dashboard) return;

		// Re-render dashboard
		dom.content(dashboard, [
			this.renderCumulativeImpact(),
			this.renderNetworkModeStatus(),
			this.renderProxySettings(),
			this.renderComponentsGrid(),
			this.renderSyncSection()
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
