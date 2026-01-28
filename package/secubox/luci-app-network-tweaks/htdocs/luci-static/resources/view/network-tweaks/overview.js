'use strict';
'require view';
'require form';
'require rpc';
'require ui';
'require poll';
'require dom';

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

return view.extend({
	proxyStatusData: {},
	componentsData: [],
	cumulativeData: {},
	networkModeData: {},

	load: function() {
		// Load CSS
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('network-tweaks/dashboard.css')
		});
		document.head.appendChild(cssLink);

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

		return m.render();
	},

	renderDashboard: function() {
		return E('div', { 'class': 'network-tweaks-dashboard' }, [
			this.renderCumulativeImpact(),
			this.renderNetworkModeStatus(),
			this.renderProxySettings(),
			this.renderComponentsGrid(),
			this.renderSyncSection()
		]);
	},

	renderCumulativeImpact: function() {
		var cumulative = this.cumulativeData;

		return E('div', { 'class': 'cumulative-impact-section' }, [
			E('h3', {}, _('Network Impact Summary')),
			E('div', { 'class': 'impact-grid' }, [
				this.renderImpactCard(
					_('Active Components'),
					cumulative.active_components || 0,
					'\ud83d\udd27',
					'primary'
				),
				this.renderImpactCard(
					_('DNS Entries'),
					cumulative.total_dns_entries || 0,
					'\ud83c\udf10',
					'info'
				),
				this.renderImpactCard(
					_('Published VHosts'),
					cumulative.total_vhosts || 0,
					'\ud83d\udce1',
					'success'
				),
				this.renderImpactCard(
					_('Exposed Ports'),
					cumulative.total_ports_exposed || 0,
					'\ud83d\udd0c',
					'warning'
				)
			])
		]);
	},

	renderImpactCard: function(label, value, icon, color) {
		return E('div', { 'class': 'impact-card impact-' + color }, [
			E('div', { 'class': 'impact-icon' }, icon),
			E('div', { 'class': 'impact-value' }, String(value)),
			E('div', { 'class': 'impact-label' }, label)
		]);
	},

	renderNetworkModeStatus: function() {
		var mode = this.networkModeData;
		var modeId = mode.current_mode || 'unknown';
		var modeName = mode.mode_name || modeId;
		var syncEnabled = mode.sync_enabled || false;

		return E('div', { 'class': 'network-mode-status' }, [
			E('h3', {}, _('Network Mode Integration')),
			E('div', { 'class': 'mode-info' }, [
				E('div', { 'class': 'mode-indicator' }, [
					E('span', { 'class': 'mode-icon' }, '\ud83c\udfaf'),
					E('span', { 'class': 'mode-name' }, modeName)
				]),
				E('div', { 'class': 'sync-status' }, [
					E('span', { 'class': 'status-label' }, _('DNS Sync: ')),
					E('span', { 'class': 'status-value' },
						syncEnabled ? _('Enabled') : _('Disabled'))
				])
			])
		]);
	},

	renderProxySettings: function() {
		var proxy = this.proxyStatusData;
		var cdnCache = proxy.cdn_cache || {};
		var wpad = proxy.wpad || {};
		var adguard = proxy.adguard_home || {};

		var cdnStatusClass = cdnCache.running ? 'status-running' : 'status-stopped';
		var cdnStatusText = cdnCache.running ? _('Running') : _('Stopped');
		var cdnListeningText = cdnCache.listening ?
			_('Listening on port ') + (cdnCache.port || 3128) :
			_('Not listening');

		var wpadStatusClass = wpad.enabled ? 'status-running' : 'status-stopped';
		var wpadStatusText = wpad.enabled ? _('Enabled') : _('Disabled');

		var adguardStatusClass = adguard.running ? 'status-running' : 'status-stopped';
		var adguardStatusText = adguard.running ? _('Running') : _('Stopped');

		return E('div', { 'class': 'proxy-settings-section' }, [
			E('h3', {}, _('DNS & Proxy Services')),
			E('div', { 'class': 'proxy-grid', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' }, [
				// AdGuard Home Card
				E('div', { 'class': 'proxy-card', 'style': 'background: #16213e; border-radius: 8px; padding: 1rem; border: 1px solid #333;' }, [
					E('div', { 'class': 'proxy-header', 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' }, [
							E('span', { 'style': 'font-size: 1.5em;' }, '\ud83d\udee1\ufe0f'),
							E('span', { 'style': 'font-weight: bold;' }, _('AdGuard Home'))
						]),
						E('span', {
							'class': 'status-badge ' + adguardStatusClass,
							'style': 'padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em; ' +
								(adguard.running ? 'background: #22c55e;' : 'background: #ef4444;')
						}, adguardStatusText)
					]),
					E('div', { 'class': 'proxy-info', 'style': 'font-size: 0.9em; color: #888; margin-bottom: 0.75rem;' }, [
						E('div', {}, adguard.installed ?
							_('Web UI: port ') + (adguard.port || 3000) :
							_('Not installed')),
						E('div', {}, adguard.installed ?
							_('DNS: port ') + (adguard.dns_port || 53) :
							_('Install via adguardhomectl'))
					]),
					E('div', { 'class': 'proxy-actions', 'style': 'display: flex; gap: 0.5rem;' }, [
						E('button', {
							'class': 'btn cbi-button',
							'click': L.bind(this.handleAdGuardToggle, this),
							'disabled': !adguard.installed
						}, adguard.enabled ? _('Disable') : _('Enable')),
						adguard.running ? E('a', {
							'class': 'btn cbi-button',
							'href': 'http://' + window.location.hostname + ':' + (adguard.port || 3000),
							'target': '_blank'
						}, _('Open UI')) : null
					].filter(Boolean))
				]),
				// CDN Cache Card
				E('div', { 'class': 'proxy-card', 'style': 'background: #16213e; border-radius: 8px; padding: 1rem; border: 1px solid #333;' }, [
					E('div', { 'class': 'proxy-header', 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' }, [
							E('span', { 'style': 'font-size: 1.5em;' }, '\ud83d\udce6'),
							E('span', { 'style': 'font-weight: bold;' }, _('CDN Cache'))
						]),
						E('span', {
							'class': 'status-badge ' + cdnStatusClass,
							'style': 'padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em; ' +
								(cdnCache.running ? 'background: #22c55e;' : 'background: #ef4444;')
						}, cdnStatusText)
					]),
					E('div', { 'class': 'proxy-info', 'style': 'font-size: 0.9em; color: #888; margin-bottom: 0.75rem;' }, [
						E('div', {}, cdnListeningText),
						E('div', {}, cdnCache.installed ? _('nginx proxy installed') : _('Not installed'))
					]),
					E('div', { 'class': 'proxy-actions', 'style': 'display: flex; gap: 0.5rem;' }, [
						E('button', {
							'class': 'btn cbi-button',
							'click': L.bind(this.handleCdnCacheToggle, this),
							'disabled': !cdnCache.installed
						}, cdnCache.enabled ? _('Disable') : _('Enable')),
						E('button', {
							'class': 'btn cbi-button',
							'click': L.bind(this.handleCdnCacheRestart, this),
							'disabled': !cdnCache.installed
						}, _('Restart'))
					])
				]),
				// WPAD Card
				E('div', { 'class': 'proxy-card', 'style': 'background: #16213e; border-radius: 8px; padding: 1rem; border: 1px solid #333;' }, [
					E('div', { 'class': 'proxy-header', 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 0.5rem;' }, [
							E('span', { 'style': 'font-size: 1.5em;' }, '\ud83c\udf10'),
							E('span', { 'style': 'font-weight: bold;' }, _('WPAD Auto-Proxy'))
						]),
						E('span', {
							'class': 'status-badge ' + wpadStatusClass,
							'style': 'padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8em; ' +
								(wpad.enabled ? 'background: #22c55e;' : 'background: #ef4444;')
						}, wpadStatusText)
					]),
					E('div', { 'class': 'proxy-info', 'style': 'font-size: 0.9em; color: #888; margin-bottom: 0.75rem;' }, [
						E('div', {}, wpad.dhcp_configured ? _('DHCP Option 252 configured') : _('DHCP not configured')),
						E('div', {}, wpad.url ? wpad.url : _('No PAC URL set'))
					]),
					E('div', { 'class': 'proxy-actions', 'style': 'display: flex; gap: 0.5rem;' }, [
						E('button', {
							'class': 'btn cbi-button',
							'click': L.bind(this.handleWpadToggle, this)
						}, wpad.enabled ? _('Disable') : _('Enable'))
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
		var components = this.componentsData;

		if (components.length === 0) {
			return E('div', { 'class': 'empty-state' }, [
				E('p', {}, _('No network-impacting components detected'))
			]);
		}

		return E('div', { 'class': 'components-grid-section' }, [
			E('h3', {}, _('Network Services')),
			E('div', {
				'class': 'components-grid',
				'id': 'components-grid'
			}, components.map(L.bind(this.renderComponentCard, this)))
		]);
	},

	renderComponentCard: function(component) {
		var statusClass = 'status-' + component.service_state.replace('/', '\\/');
		var stateLabel = {
			'running': _('Running'),
			'stopped': _('Stopped'),
			'n/a': _('N/A')
		}[component.service_state] || component.service_state;

		var impact = component.network_impact || {};

		return E('div', {
			'class': 'component-card ' + statusClass,
			'data-component-id': component.id
		}, [
			E('div', { 'class': 'component-header' }, [
				E('div', { 'class': 'component-title' }, [
					E('h4', {}, component.name),
					E('span', { 'class': 'component-status ' + statusClass }, stateLabel)
				]),
				E('span', {
					'class': 'install-badge install-' + component.install_state.replace('/', '\\/')
				}, component.install_state)
			]),
			E('div', { 'class': 'component-impact' }, [
				E('div', { 'class': 'impact-row' }, [
					E('span', { 'class': 'impact-icon' }, '\ud83c\udf10'),
					E('span', { 'class': 'impact-text' },
						(impact.dns_entries || 0) + ' ' + _('DNS entries'))
				]),
				E('div', { 'class': 'impact-row' }, [
					E('span', { 'class': 'impact-icon' }, '\ud83d\udce1'),
					E('span', { 'class': 'impact-text' },
						(impact.vhosts || 0) + ' ' + _('VHosts'))
				]),
				E('div', { 'class': 'impact-row' }, [
					E('span', { 'class': 'impact-icon' }, '\ud83d\udd0c'),
					E('span', { 'class': 'impact-text' },
						(impact.ports || 0) + ' ' + _('ports'))
				])
			]),
			E('div', { 'class': 'component-contribution' }, [
				E('small', {}, _('Contributes: ')),
				E('span', {},
					(component.cumulative_contribution?.dnsmasq_entries || 0) + ' dnsmasq, ' +
					(component.cumulative_contribution?.hosts_entries || 0) + ' hosts')
			]),
			E('div', { 'class': 'component-actions' }, [
				E('button', {
					'class': 'btn',
					'click': L.bind(function(componentId, ev) {
						this.showComponentDetails(componentId);
					}, this, component.id)
				}, _('Details'))
			])
		]);
	},

	renderSyncSection: function() {
		return E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2rem;' }, [
			E('h3', {}, _('Manual Synchronization')),
			E('div', { 'class': 'cbi-section-descr' },
				_('Trigger immediate synchronization of DNS and hosts entries')),
			E('button', {
				'class': 'btn cbi-button-apply',
				'click': L.bind(this.handleSyncNow, this)
			}, _('Sync Now'))
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
			E('h3', {}, component.name),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, _('Category: ')),
				E('span', {}, component.category)
			]),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, _('Install State: ')),
				E('span', {}, component.install_state)
			]),
			E('div', { 'style': 'margin: 1rem 0;' }, [
				E('strong', {}, _('Service State: ')),
				E('span', {}, component.service_state)
			]),
			E('h4', {}, _('Network Impact')),
			E('ul', {}, [
				E('li', {}, _('DNS Entries: ') + (impact.dns_entries || 0)),
				E('li', {}, _('VHosts: ') + (impact.vhosts || 0)),
				E('li', {}, _('Ports: ') + (impact.ports || 0))
			]),
			E('h4', {}, _('Capabilities')),
			E('div', {},
				capabilities.length > 0
					? capabilities.map(function(cap) {
						return E('span', {
							'style': 'display: inline-block; background: #e9ecef; padding: 0.25rem 0.5rem; margin: 0.25rem; border-radius: 4px; font-size: 0.875rem;'
						}, cap);
					})
					: E('p', {}, _('None'))
			),
			E('div', { 'class': 'right', 'style': 'margin-top: 2rem;' }, [
				E('button', {
					'class': 'btn cbi-button',
					'click': ui.hideModal
				}, _('Close'))
			])
		];

		ui.showModal(_('Component Details'), content, 'cbi-modal');
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
