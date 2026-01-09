'use strict';
'require view';
'require ui';
'require network-modes.api as api';
'require network-modes.helpers as helpers';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var nmLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: nmLang });

return view.extend({
	title: _('Multi-WAN Mode'),

	load: function() {
		return api.getMultiWanConfig();
	},

	render: function(data) {
		var cfg = data || {};
		var policy = cfg.policy || {};
		var links = cfg.links || {};
		var candidates = cfg.wan_candidates || [];
		policy.primary = links.primary || policy.primary;
		policy.secondary = links.secondary || policy.secondary;
		policy.mwan3_enabled = links.mwan3_enabled;
		this.lastCandidates = candidates;

		var container = E('div', { 'class': 'network-modes-dashboard multiwan-mode' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('network-modes/dashboard.css') }),
			helpers.createNavigationTabs('multiwan'),
			helpers.createHero({
				icon: '⚡',
				title: _('Multi-WAN Gateway'),
				subtitle: _('Balanced load sharing and automatic failover between two uplinks.'),
				actions: [
					E('button', {
						'class': 'nm-btn nm-btn-primary',
						'data-action': 'multiwan-save',
						'type': 'button'
					}, '💾 ' + _('Save Settings')),
					E('button', {
						'class': 'nm-btn',
						'type': 'button',
						'click': function() {
							window.location.hash = '#admin/secubox/network/network-modes/wizard';
						}
					}, '🧭 ' + _('Mode Wizard'))
				]
			}),
			this.renderLinkStatus(links, candidates),
			this.renderPolicySection(policy),
			this.renderCandidates(candidates)
		]);

		container.querySelectorAll('.nm-toggle-switch').forEach(function(toggle) {
			toggle.addEventListener('click', function() {
				this.classList.toggle('active');
			});
		});

		this.bindActions(container);

		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());
		wrapper.appendChild(container);
		return wrapper;
	},

	renderLinkStatus: function(links, candidates) {
		var primaryInfo = candidates.find(function(item) {
			return item.name === links.primary;
		}) || {};
		var secondaryInfo = candidates.find(function(item) {
			return item.name === links.secondary;
		}) || {};

		return helpers.createSection({
			icon: '🛰️',
			title: _('WAN Links Status'),
			body: [
				E('div', { 'class': 'nm-interfaces-grid' }, [
					this.renderLinkCard(_('Primary Link'), links.primary, primaryInfo.up),
					this.renderLinkCard(_('Secondary Link'), links.secondary, secondaryInfo.up),
					E('div', { 'class': 'nm-interface-card' }, [
						E('div', { 'class': 'nm-interface-icon' }, '⚙️'),
						E('div', { 'class': 'nm-interface-info' }, [
							E('div', { 'class': 'nm-interface-name' }, _('mwan3 integration')),
							E('div', { 'class': 'nm-interface-ip' }, links.mwan3_enabled ? _('Enabled') : _('Disabled'))
						]),
						E('div', { 'class': 'nm-interface-status ' + (links.mwan3_enabled ? 'up' : 'down') })
					])
				])
			]
		});
	},

	renderLinkCard: function(label, iface, up) {
		return E('div', { 'class': 'nm-interface-card' }, [
			E('div', { 'class': 'nm-interface-icon' }, up ? '🟢' : '🔴'),
			E('div', { 'class': 'nm-interface-info' }, [
				E('div', { 'class': 'nm-interface-name' }, label),
				E('div', { 'class': 'nm-interface-ip' }, iface || _('Not set'))
			]),
			E('div', { 'class': 'nm-interface-status ' + (up ? 'up' : 'down') })
		]);
	},

	renderPolicySection: function(policy) {
		var view = helpers.createSection({
			icon: '🧠',
			title: _('Failover & Balancing Policy'),
			body: [
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Policy Profile')),
						E('select', { 'class': 'nm-select', 'id': 'multiwan-policy' }, [
							E('option', { 'value': 'balanced', 'selected': policy.profile === 'balanced' }, _('Balanced')),
							E('option', { 'value': 'failover', 'selected': policy.profile === 'failover' }, _('Failover')),
							E('option', { 'value': 'aggregate', 'selected': policy.profile === 'aggregate' }, _('Aggregate'))
						])
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Health Check Host')),
						E('input', {
							'class': 'nm-input',
							'id': 'multiwan-tracking-host',
							'value': policy.tracking_host || '8.8.8.8'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Check Interval (s)')),
						E('input', {
							'class': 'nm-input',
							'type': 'number',
							'id': 'multiwan-tracking-interval',
							'value': policy.tracking_interval || 30,
							'min': '5'
						})
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Failover Hold Time (s)')),
						E('input', {
							'class': 'nm-input',
							'type': 'number',
							'id': 'multiwan-failover-hold',
							'value': policy.failover_hold || 45,
							'min': '10'
						})
					])
				]),
				E('div', { 'class': 'nm-form-grid' }, [
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Primary Interface')),
						this.createInterfaceSelect('multiwan-primary', policy.primary)
					]),
					E('div', { 'class': 'nm-form-group' }, [
						E('label', { 'class': 'nm-form-label' }, _('Secondary Interface')),
						this.createInterfaceSelect('multiwan-secondary', policy.secondary)
					])
				]),
				E('div', { 'class': 'nm-toggle-list' }, [
					this.renderToggle(_('Load balancing'), _('Use ECMP load sharing across WAN links'), 'multiwan-load-balance', policy.load_balance !== '0'),
					this.renderToggle(_('Enable mwan3 integration'), _('Apply mwan3 policies and tracking'), 'multiwan-mwan3', policy.mwan3_enabled === true || policy.mwan3_enabled === 1 || policy.mwan3_enabled === '1')
				])
			]
		});
		return view;
	},

	renderCandidates: function(candidates) {
		if (!candidates.length)
			return helpers.createSection({
				icon: '📋',
				title: _('Available Interfaces'),
				body: [E('p', { 'class': 'nm-text-muted' }, _('No interfaces detected'))]
			});

		return helpers.createSection({
			icon: '📋',
			title: _('Available Interfaces'),
			body: [
				E('div', { 'class': 'nm-interfaces-grid' },
					candidates.map(function(iface) {
						return E('div', { 'class': 'nm-interface-card' }, [
							E('div', { 'class': 'nm-interface-icon' }, iface.up ? '🟢' : '⚫'),
							E('div', { 'class': 'nm-interface-info' }, [
								E('div', { 'class': 'nm-interface-name' }, iface.name),
								E('div', { 'class': 'nm-interface-ip' }, iface.mac || '')
							]),
							E('div', { 'class': 'nm-interface-status ' + (iface.up ? 'up' : 'down') })
						]);
					}))
			]
		});
	},

	renderToggle: function(title, desc, id, active) {
		return E('div', { 'class': 'nm-toggle' }, [
			E('div', { 'class': 'nm-toggle-info' }, [
				E('span', { 'class': 'nm-toggle-icon' }, '⚙️'),
				E('div', {}, [
					E('div', { 'class': 'nm-toggle-label' }, title),
					E('div', { 'class': 'nm-toggle-desc' }, desc)
				])
			]),
			E('div', {
				'class': 'nm-toggle-switch' + (active ? ' active' : ''),
				'id': id
			})
		]);
	},

	createInterfaceSelect: function(id, selected) {
		var options = this.lastCandidates && this.lastCandidates.length ? this.lastCandidates : [{ name: 'eth1' }];
		return E('select', { 'class': 'nm-select', 'id': id },
			options.map(function(iface) {
				return E('option', { 'value': iface.name, 'selected': iface.name === selected }, iface.name);
			}));
	},

	bindActions: function(container) {
		var saveBtn = container.querySelector('[data-action="multiwan-save"]');
		if (saveBtn)
			saveBtn.addEventListener('click', ui.createHandlerFn(this, 'saveMultiWanSettings', container));
	},

	saveMultiWanSettings: function(container) {
		var payload = {
			wan_primary: (container.querySelector('#multiwan-primary') || {}).value,
			wan_secondary: (container.querySelector('#multiwan-secondary') || {}).value,
			policy: (container.querySelector('#multiwan-policy') || {}).value,
			tracking_host: (container.querySelector('#multiwan-tracking-host') || {}).value,
			tracking_interval: (container.querySelector('#multiwan-tracking-interval') || {}).value,
			failover_hold: (container.querySelector('#multiwan-failover-hold') || {}).value,
			load_balance: helpers.isToggleActive(container.querySelector('#multiwan-load-balance')) ? 1 : 0,
			use_mwan3: helpers.isToggleActive(container.querySelector('#multiwan-mwan3')) ? 1 : 0
		};

		return helpers.persistSettings('multiwan', payload);
	},

	lastCandidates: null,

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
