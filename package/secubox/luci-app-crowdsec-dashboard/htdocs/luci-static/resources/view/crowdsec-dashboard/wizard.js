'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require form';
'require rpc';
'require uci';
'require crowdsec-dashboard/api as API';
'require crowdsec-dashboard/nav as CsNav';
'require secubox-portal/header as SbHeader';

// Hide LuCI tabs immediately
(function() {
	if (typeof document === 'undefined') return;
	var style = document.getElementById('cs-hide-tabs') || document.createElement('style');
	style.id = 'cs-hide-tabs';
	style.textContent = 'ul.tabs, .cbi-tabmenu { display: none !important; }';
	if (!style.parentNode) (document.head || document.documentElement).appendChild(style);
})();

return view.extend({
	// Health check results
	health: {
		crowdsecRunning: false,
		lapiAvailable: false,
		capiConnected: false,
		capiEnrolled: false,
		bouncerRegistered: false,
		bouncerRunning: false,
		nftablesActive: false,
		hubUpToDate: false,
		acquisitionConfigured: false,
		collectionsInstalled: 0,
		checking: true,
		error: null
	},

	// Configuration options (user selections)
	config: {
		// What needs to be fixed (auto-detected)
		needsLapiRepair: false,
		needsCapiRegister: false,
		needsHubUpdate: false,
		needsAcquisition: false,
		needsCollections: false,
		needsBouncer: false,
		needsServices: false,

		// User inputs
		enrollmentKey: '',
		machineName: '',

		// Acquisition options
		syslogEnabled: true,
		firewallEnabled: true,
		sshEnabled: true,
		httpEnabled: false,

		// Collections to install
		selectedCollections: [],
		selectedParsers: [],

		// Bouncer options
		ipv4Enabled: true,
		ipv6Enabled: true,
		updateFrequency: '10s',

		// Apply state
		applying: false,
		applyStep: '',
		applyProgress: 0,
		applyComplete: false,
		applyErrors: []
	},

	load: function() {
		return this.runHealthCheck();
	},

	runHealthCheck: function() {
		var self = this;
		this.health.checking = true;
		this.health.error = null;

		return Promise.all([
			API.getStatus(),
			API.getConsoleStatus(),
			API.getBouncers(),
			API.getFirewallBouncerStatus(),
			API.getCollections()
		]).then(function(results) {
			var status = results[0] || {};
			var consoleStatus = results[1] || {};
			var bouncers = results[2] || {};
			var bouncerStatus = results[3] || {};
			var collections = results[4] || [];

			// Update health status
			self.health.crowdsecRunning = status.crowdsec === 'running';
			self.health.lapiAvailable = status.lapi_status === 'available';
			self.health.capiConnected = status.capi_status === 'connected' || status.capi_status === 'ok';
			self.health.capiEnrolled = consoleStatus.enrolled === true;

			// Check bouncer registration
			var bouncerList = bouncers.bouncers || bouncers || [];
			var firewallBouncer = bouncerList.find(function(b) {
				return b.name === 'crowdsec-firewall-bouncer' || b.name === 'firewall-bouncer';
			});
			self.health.bouncerRegistered = !!firewallBouncer;
			self.health.bouncerRunning = bouncerStatus.running === true;
			self.health.nftablesActive = bouncerStatus.nftables_ipv4 || bouncerStatus.nftables_ipv6;

			// Count installed collections
			self.health.collectionsInstalled = Array.isArray(collections) ?
				collections.filter(function(c) { return c.installed; }).length : 0;

			self.health.checking = false;

			// Determine what needs to be fixed
			self.config.needsLapiRepair = self.health.crowdsecRunning && !self.health.lapiAvailable;
			self.config.needsCapiRegister = !self.health.capiConnected && !self.health.capiEnrolled;
			self.config.needsHubUpdate = self.health.capiConnected; // Only if CAPI works
			self.config.needsCollections = self.health.collectionsInstalled < 3;
			self.config.needsBouncer = !self.health.bouncerRegistered;
			self.config.needsServices = !self.health.bouncerRunning || !self.health.nftablesActive;

			return self.health;
		}).catch(function(err) {
			console.error('[Wizard] Health check error:', err);
			self.health.checking = false;
			self.health.error = err.message;
			return self.health;
		});
	},

	render: function(data) {
		// Initialize theme
		Theme.init();

		// Load CSS
		var head = document.head || document.getElementsByTagName('head')[0];
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('crowdsec-dashboard/wizard.css')
		});
		head.appendChild(cssLink);

		var themeLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('secubox-theme/secubox-theme.css')
		});
		head.appendChild(themeLink);

		// Main wrapper
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var container = E('div', { 'class': 'crowdsec-dashboard wizard-container' });
		container.appendChild(CsNav.renderTabs('wizard'));

		// Render content based on state
		if (this.config.applyComplete) {
			container.appendChild(this.renderComplete());
		} else if (this.config.applying) {
			container.appendChild(this.renderApplying());
		} else {
			container.appendChild(this.renderHealthAndConfig());
		}

		wrapper.appendChild(container);
		return wrapper;
	},

	renderHealthAndConfig: function() {
		var self = this;

		return E('div', { 'class': 'wizard-step' }, [
			// Header
			E('h2', {}, _('CrowdSec Setup Wizard')),
			E('p', {}, _('Health check and configuration in one step.')),

			// Health Check Section
			this.renderHealthCheck(),

			// Separator
			E('hr', { 'style': 'margin: 24px 0; border-color: rgba(255,255,255,0.1);' }),

			// Configuration Section (only if health check passed basic requirements)
			this.health.crowdsecRunning ? this.renderConfigOptions() : E([]),

			// Apply Button
			E('div', { 'class': 'wizard-nav', 'style': 'margin-top: 32px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': function() {
						window.location.href = L.url('admin', 'secubox', 'security', 'crowdsec', 'overview');
					}
				}, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'font-size: 1.1em; padding: 12px 32px;',
					'disabled': !this.health.crowdsecRunning || this.health.checking ? true : null,
					'click': L.bind(this.handleApplyAll, this)
				}, _('Apply Configuration'))
			])
		]);
	},

	renderHealthCheck: function() {
		var self = this;

		var checks = [
			{
				id: 'crowdsec',
				label: _('CrowdSec Service'),
				ok: this.health.crowdsecRunning,
				status: this.health.crowdsecRunning ? _('Running') : _('Stopped'),
				critical: true
			},
			{
				id: 'lapi',
				label: _('Local API (LAPI)'),
				ok: this.health.lapiAvailable,
				status: this.health.lapiAvailable ? _('Available') : _('Unavailable'),
				action: !this.health.lapiAvailable && this.health.crowdsecRunning ? _('Will repair') : null
			},
			{
				id: 'capi',
				label: _('Central API (CAPI)'),
				ok: this.health.capiConnected,
				status: this.health.capiConnected ? _('Connected') : (this.health.capiEnrolled ? _('Enrolled but not connected') : _('Not registered')),
				action: !this.health.capiConnected ? _('Enrollment required') : null
			},
			{
				id: 'bouncer',
				label: _('Firewall Bouncer'),
				ok: this.health.bouncerRegistered && this.health.bouncerRunning,
				status: this.health.bouncerRegistered ?
					(this.health.bouncerRunning ? _('Running') : _('Registered but stopped')) :
					_('Not registered'),
				action: !this.health.bouncerRegistered ? _('Will register') : (!this.health.bouncerRunning ? _('Will start') : null)
			},
			{
				id: 'nftables',
				label: _('nftables Rules'),
				ok: this.health.nftablesActive,
				status: this.health.nftablesActive ? _('Active') : _('Not loaded'),
				action: !this.health.nftablesActive ? _('Will configure') : null
			},
			{
				id: 'collections',
				label: _('Security Collections'),
				ok: this.health.collectionsInstalled >= 3,
				status: _('%d installed').format(this.health.collectionsInstalled),
				action: this.health.collectionsInstalled < 3 ? _('Will install') : null
			}
		];

		return E('div', { 'class': 'health-check-section' }, [
			E('h3', { 'style': 'margin-bottom: 16px; display: flex; align-items: center;' }, [
				E('span', { 'style': 'margin-right: 8px;' }, '🔍'),
				_('Health Check'),
				this.health.checking ? E('span', { 'class': 'spinning', 'style': 'margin-left: 12px; font-size: 14px;' }, '') : E([])
			]),

			E('div', { 'class': 'status-checks', 'style': 'display: grid; gap: 8px;' },
				checks.map(function(check) {
					return E('div', {
						'class': 'check-item',
						'style': 'display: flex; align-items: center; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;'
					}, [
						E('span', {
							'class': 'check-icon',
							'style': 'font-size: 20px; margin-right: 12px; color: ' + (check.ok ? '#22c55e' : (check.critical ? '#ef4444' : '#eab308')) + ';'
						}, check.ok ? '✓' : (check.critical ? '✗' : '⚠')),
						E('div', { 'style': 'flex: 1;' }, [
							E('strong', {}, check.label),
							E('div', { 'style': 'font-size: 0.85em; color: ' + (check.ok ? '#22c55e' : '#94a3b8') + ';' }, check.status)
						]),
						check.action ? E('span', {
							'class': 'badge',
							'style': 'background: rgba(102, 126, 234, 0.2); color: #818cf8; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;'
						}, check.action) : E([])
					]);
				})
			),

			// Error message if any
			this.health.error ? E('div', {
				'style': 'margin-top: 16px; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444;'
			}, this.health.error) : E([]),

			// Refresh button
			E('div', { 'style': 'margin-top: 12px;' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(function() {
						this.runHealthCheck().then(L.bind(function() {
							this.refreshView();
						}, this));
					}, this)
				}, _('Refresh'))
			])
		]);
	},

	renderConfigOptions: function() {
		var self = this;

		return E('div', { 'class': 'config-section' }, [
			E('h3', { 'style': 'margin-bottom: 16px; display: flex; align-items: center;' }, [
				E('span', { 'style': 'margin-right: 8px;' }, '⚙️'),
				_('Configuration Options')
			]),

			// CAPI Enrollment (if needed)
			!this.health.capiConnected ? E('div', {
				'class': 'config-group',
				'style': 'margin-bottom: 20px; padding: 16px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 12px 0; color: #818cf8;' }, _('Console Enrollment (Optional)')),
				E('p', { 'style': 'margin: 0 0 12px 0; font-size: 0.9em; color: #94a3b8;' },
					_('Enroll to receive community blocklists. Leave empty to skip.')),
				E('input', {
					'type': 'text',
					'id': 'enrollment-key',
					'class': 'cbi-input-text',
					'placeholder': _('Enrollment key from app.crowdsec.net'),
					'style': 'width: 100%; padding: 10px; margin-bottom: 8px;',
					'value': this.config.enrollmentKey,
					'input': function(ev) { self.config.enrollmentKey = ev.target.value; }
				}),
				E('input', {
					'type': 'text',
					'id': 'machine-name',
					'class': 'cbi-input-text',
					'placeholder': _('Machine name (optional)'),
					'style': 'width: 100%; padding: 10px;',
					'value': this.config.machineName,
					'input': function(ev) { self.config.machineName = ev.target.value; }
				}),
				E('p', { 'style': 'margin: 8px 0 0 0; font-size: 0.85em; color: #64748b;' }, [
					_('Note: Hub update requires CAPI connection.')
				])
			]) : E([]),

			// Log Acquisition
			E('div', {
				'class': 'config-group',
				'style': 'margin-bottom: 20px; padding: 16px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 12px 0; color: #818cf8;' }, _('Log Sources to Monitor')),
				this.renderToggle('syslog', _('System Syslog'), _('/var/log/messages'), this.config.syslogEnabled),
				this.renderToggle('firewall', _('Firewall Logs'), _('Port scan detection'), this.config.firewallEnabled),
				this.renderToggle('ssh', _('SSH/Dropbear'), _('Brute force detection'), this.config.sshEnabled),
				this.renderToggle('http', _('HTTP Server'), _('Web attacks (if running)'), this.config.httpEnabled)
			]),

			// Collections
			E('div', {
				'class': 'config-group',
				'style': 'margin-bottom: 20px; padding: 16px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 12px 0; color: #818cf8;' }, _('Security Collections to Install')),
				this.renderCollectionToggle('crowdsecurity/linux', _('Base Linux scenarios'), true),
				this.renderCollectionToggle('crowdsecurity/sshd', _('SSH protection'), true),
				this.renderCollectionToggle('crowdsecurity/iptables', _('Firewall log parser'), this.config.firewallEnabled),
				this.renderCollectionToggle('crowdsecurity/http-cve', _('Web CVE protection'), this.config.httpEnabled),
				E('div', { 'style': 'margin-top: 12px;' }, [
					E('strong', { 'style': 'font-size: 0.9em; color: #94a3b8;' }, _('OpenWrt Parsers:')),
				]),
				this.renderCollectionToggle('crowdsecurity/syslog-logs', _('Syslog parser'), true, 'parser'),
				this.renderCollectionToggle('crowdsecurity/dropbear-logs', _('Dropbear SSH parser'), this.config.sshEnabled, 'parser')
			]),

			// Bouncer Options
			E('div', {
				'class': 'config-group',
				'style': 'padding: 16px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 12px 0; color: #818cf8;' }, _('Firewall Bouncer Options')),
				this.renderToggle('ipv4', _('Block IPv4'), _('Enable IPv4 blocking'), this.config.ipv4Enabled),
				this.renderToggle('ipv6', _('Block IPv6'), _('Enable IPv6 blocking'), this.config.ipv6Enabled),
				E('div', { 'style': 'margin-top: 12px;' }, [
					E('label', { 'style': 'display: block; margin-bottom: 4px; font-size: 0.9em;' }, _('Update Frequency:')),
					E('select', {
						'id': 'update-frequency',
						'class': 'cbi-input-select',
						'style': 'width: 100%; padding: 8px;',
						'change': function(ev) { self.config.updateFrequency = ev.target.value; }
					}, [
						E('option', { 'value': '10s', 'selected': this.config.updateFrequency === '10s' }, _('10 seconds (recommended)')),
						E('option', { 'value': '30s', 'selected': this.config.updateFrequency === '30s' }, _('30 seconds')),
						E('option', { 'value': '1m', 'selected': this.config.updateFrequency === '1m' }, _('1 minute'))
					])
				])
			])
		]);
	},

	renderToggle: function(id, label, description, checked) {
		var self = this;
		return E('div', {
			'class': 'toggle-item',
			'data-id': id,
			'data-checked': checked ? '1' : '0',
			'style': 'display: flex; align-items: center; padding: 8px 0; cursor: pointer;',
			'click': function(ev) {
				var el = ev.currentTarget;
				var current = el.getAttribute('data-checked') === '1';
				var newState = !current;
				el.setAttribute('data-checked', newState ? '1' : '0');

				var checkbox = el.querySelector('.toggle-check');
				if (checkbox) {
					checkbox.textContent = newState ? '☑' : '☐';
					checkbox.style.color = newState ? '#22c55e' : '#64748b';
				}

				// Update config
				var configId = el.getAttribute('data-id');
				if (configId === 'syslog') self.config.syslogEnabled = newState;
				else if (configId === 'firewall') self.config.firewallEnabled = newState;
				else if (configId === 'ssh') self.config.sshEnabled = newState;
				else if (configId === 'http') self.config.httpEnabled = newState;
				else if (configId === 'ipv4') self.config.ipv4Enabled = newState;
				else if (configId === 'ipv6') self.config.ipv6Enabled = newState;
			}
		}, [
			E('span', {
				'class': 'toggle-check',
				'style': 'font-size: 22px; margin-right: 12px; color: ' + (checked ? '#22c55e' : '#64748b') + ';'
			}, checked ? '☑' : '☐'),
			E('div', { 'style': 'flex: 1;' }, [
				E('strong', { 'style': 'display: block;' }, label),
				E('span', { 'style': 'font-size: 0.85em; color: #64748b;' }, description)
			])
		]);
	},

	renderCollectionToggle: function(name, description, checked, type) {
		var self = this;
		type = type || 'collection';

		return E('div', {
			'class': 'collection-toggle',
			'data-name': name,
			'data-type': type,
			'data-checked': checked ? '1' : '0',
			'style': 'display: flex; align-items: center; padding: 6px 0; cursor: pointer;',
			'click': function(ev) {
				var el = ev.currentTarget;
				var current = el.getAttribute('data-checked') === '1';
				var newState = !current;
				el.setAttribute('data-checked', newState ? '1' : '0');

				var checkbox = el.querySelector('.toggle-check');
				if (checkbox) {
					checkbox.textContent = newState ? '☑' : '☐';
					checkbox.style.color = newState ? '#22c55e' : '#64748b';
				}
			}
		}, [
			E('span', {
				'class': 'toggle-check',
				'style': 'font-size: 20px; margin-right: 10px; color: ' + (checked ? '#22c55e' : '#64748b') + ';'
			}, checked ? '☑' : '☐'),
			E('div', { 'style': 'flex: 1;' }, [
				E('code', { 'style': 'font-size: 0.9em;' }, name),
				E('span', { 'style': 'margin-left: 8px; font-size: 0.85em; color: #64748b;' }, '— ' + description)
			])
		]);
	},

	renderApplying: function() {
		var progressPercent = Math.round(this.config.applyProgress);

		return E('div', { 'class': 'wizard-step', 'style': 'text-align: center; padding: 48px 24px;' }, [
			E('div', { 'class': 'spinning', 'style': 'font-size: 48px; margin-bottom: 24px;' }, '⚙️'),
			E('h2', {}, _('Applying Configuration...')),
			E('p', { 'style': 'color: #94a3b8; margin-bottom: 24px;' }, this.config.applyStep),

			// Progress bar
			E('div', { 'style': 'max-width: 400px; margin: 0 auto 24px;' }, [
				E('div', {
					'style': 'height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;'
				}, [
					E('div', {
						'style': 'height: 100%; width: ' + progressPercent + '%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s;'
					})
				]),
				E('div', { 'style': 'margin-top: 8px; font-size: 0.9em; color: #64748b;' }, progressPercent + '%')
			]),

			// Errors if any
			this.config.applyErrors.length > 0 ? E('div', {
				'style': 'max-width: 500px; margin: 0 auto; text-align: left; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px;'
			}, [
				E('strong', { 'style': 'color: #ef4444;' }, _('Warnings:')),
				E('ul', { 'style': 'margin: 8px 0 0 0; padding-left: 20px; color: #f87171;' },
					this.config.applyErrors.map(function(err) {
						return E('li', {}, err);
					})
				)
			]) : E([])
		]);
	},

	renderComplete: function() {
		return E('div', { 'class': 'wizard-step wizard-complete', 'style': 'text-align: center;' }, [
			E('div', { 'class': 'success-hero', 'style': 'margin-bottom: 32px;' }, [
				E('div', { 'style': 'font-size: 64px; margin-bottom: 16px;' }, '🎉'),
				E('h2', {}, _('Setup Complete!'))
			]),

			E('p', { 'style': 'color: #94a3b8; margin-bottom: 32px;' },
				_('CrowdSec is now protecting your network.')),

			// Summary of what was done
			E('div', { 'style': 'max-width: 400px; margin: 0 auto 32px; text-align: left;' }, [
				this.health.lapiAvailable ? this.renderCompletedItem(_('LAPI available')) : E([]),
				this.health.capiConnected ? this.renderCompletedItem(_('CAPI connected')) : E([]),
				this.health.bouncerRegistered ? this.renderCompletedItem(_('Bouncer registered')) : E([]),
				this.health.nftablesActive ? this.renderCompletedItem(_('nftables rules active')) : E([]),
				this.health.collectionsInstalled > 0 ?
					this.renderCompletedItem(_('%d collections installed').format(this.health.collectionsInstalled)) : E([])
			]),

			// Errors/warnings if any
			this.config.applyErrors.length > 0 ? E('div', {
				'style': 'max-width: 500px; margin: 0 auto 24px; padding: 16px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; text-align: left;'
			}, [
				E('strong', { 'style': 'color: #eab308;' }, _('Some steps had issues:')),
				E('ul', { 'style': 'margin: 8px 0 0 0; padding-left: 20px; color: #fbbf24;' },
					this.config.applyErrors.map(function(err) {
						return E('li', {}, err);
					})
				)
			]) : E([]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'font-size: 1.1em; padding: 12px 32px;',
					'click': function() {
						window.location.href = L.url('admin', 'secubox', 'security', 'crowdsec', 'overview');
					}
				}, _('Go to Dashboard'))
			])
		]);
	},

	renderCompletedItem: function(text) {
		return E('div', { 'style': 'display: flex; align-items: center; padding: 8px 0;' }, [
			E('span', { 'style': 'color: #22c55e; margin-right: 12px; font-size: 18px;' }, '✓'),
			E('span', {}, text)
		]);
	},

	handleApplyAll: function() {
		var self = this;
		this.config.applying = true;
		this.config.applyProgress = 0;
		this.config.applyErrors = [];
		this.refreshView();

		// Gather selected collections and parsers from DOM
		var collectionToggles = document.querySelectorAll('.collection-toggle[data-type="collection"][data-checked="1"]');
		var parserToggles = document.querySelectorAll('.collection-toggle[data-type="parser"][data-checked="1"]');

		this.config.selectedCollections = Array.from(collectionToggles).map(function(el) {
			return el.getAttribute('data-name');
		});
		this.config.selectedParsers = Array.from(parserToggles).map(function(el) {
			return el.getAttribute('data-name');
		});

		// Get enrollment key
		var keyInput = document.getElementById('enrollment-key');
		var nameInput = document.getElementById('machine-name');
		this.config.enrollmentKey = keyInput ? keyInput.value.trim() : '';
		this.config.machineName = nameInput ? nameInput.value.trim() : '';

		// Define steps
		var steps = [];
		var stepWeight = 0;

		// Step 1: Repair LAPI if needed
		if (this.config.needsLapiRepair) {
			steps.push({ name: 'lapi', label: _('Repairing LAPI...'), weight: 15 });
			stepWeight += 15;
		}

		// Step 2: Enroll CAPI if key provided
		if (this.config.enrollmentKey) {
			steps.push({ name: 'capi', label: _('Enrolling in CrowdSec Console...'), weight: 10 });
			stepWeight += 10;
		}

		// Step 3: Update hub if CAPI available
		if (this.health.capiConnected || this.config.enrollmentKey) {
			steps.push({ name: 'hub', label: _('Updating hub...'), weight: 10 });
			stepWeight += 10;
		}

		// Step 4: Configure acquisition
		steps.push({ name: 'acquisition', label: _('Configuring log acquisition...'), weight: 15 });
		stepWeight += 15;

		// Step 5: Install collections
		if (this.config.selectedCollections.length > 0 || this.config.selectedParsers.length > 0) {
			steps.push({ name: 'collections', label: _('Installing collections...'), weight: 20 });
			stepWeight += 20;
		}

		// Step 6: Configure bouncer
		if (this.config.needsBouncer) {
			steps.push({ name: 'bouncer', label: _('Registering bouncer...'), weight: 15 });
			stepWeight += 15;
		}

		// Step 7: Start services
		steps.push({ name: 'services', label: _('Starting services...'), weight: 15 });
		stepWeight += 15;

		// Normalize weights
		var totalWeight = stepWeight;
		steps.forEach(function(s) {
			s.weight = (s.weight / totalWeight) * 100;
		});

		// Execute steps
		var currentProgress = 0;

		return steps.reduce(function(promise, step) {
			return promise.then(function() {
				self.config.applyStep = step.label;
				self.refreshView();

				return self.executeStep(step.name).then(function(result) {
					currentProgress += step.weight;
					self.config.applyProgress = currentProgress;
					if (result && result.error) {
						self.config.applyErrors.push(step.label + ': ' + result.error);
					}
				}).catch(function(err) {
					currentProgress += step.weight;
					self.config.applyProgress = currentProgress;
					self.config.applyErrors.push(step.label + ': ' + err.message);
				});
			});
		}, Promise.resolve()).then(function() {
			// Final health check
			return self.runHealthCheck();
		}).then(function() {
			self.config.applying = false;
			self.config.applyComplete = true;
			self.refreshView();
		});
	},

	executeStep: function(stepName) {
		var self = this;

		switch (stepName) {
			case 'lapi':
				return API.repairLapi();

			case 'capi':
				return API.consoleEnroll(this.config.enrollmentKey, this.config.machineName);

			case 'hub':
				return API.updateHub().catch(function(err) {
					// Hub update failure is not critical
					return { success: false, error: err.message };
				});

			case 'acquisition':
				return API.configureAcquisition(
					this.config.syslogEnabled ? '1' : '0',
					this.config.firewallEnabled ? '1' : '0',
					this.config.sshEnabled ? '1' : '0',
					this.config.httpEnabled ? '1' : '0',
					'/var/log/messages'
				).catch(function(err) {
					// XHR abort during restart is OK
					if (err.message && err.message.indexOf('abort') !== -1) {
						return { success: true };
					}
					throw err;
				});

			case 'collections':
				// Install collections sequentially
				var items = this.config.selectedCollections.map(function(c) {
					return { type: 'collection', name: c };
				}).concat(this.config.selectedParsers.map(function(p) {
					return { type: 'parser', name: p };
				}));

				return items.reduce(function(promise, item) {
					return promise.then(function() {
						if (item.type === 'collection') {
							return API.installCollection(item.name).catch(function() { return {}; });
						} else {
							return API.installHubItem('parser', item.name).catch(function() { return {}; });
						}
					});
				}, Promise.resolve()).then(function() {
					return { success: true };
				});

			case 'bouncer':
				return API.registerBouncer('crowdsec-firewall-bouncer').then(function(result) {
					if (!result.success) {
						return result;
					}
					// Configure bouncer settings
					return Promise.all([
						API.updateFirewallBouncerConfig('enabled', '1'),
						API.updateFirewallBouncerConfig('ipv4', self.config.ipv4Enabled ? '1' : '0'),
						API.updateFirewallBouncerConfig('ipv6', self.config.ipv6Enabled ? '1' : '0'),
						API.updateFirewallBouncerConfig('update_frequency', self.config.updateFrequency),
						API.updateFirewallBouncerConfig('api_key', result.api_key)
					]).then(function() {
						return { success: true };
					});
				});

			case 'services':
				return API.controlFirewallBouncer('enable').then(function() {
					return API.controlFirewallBouncer('start');
				}).then(function() {
					// Wait for service to start
					return new Promise(function(resolve) { setTimeout(resolve, 2000); });
				}).then(function() {
					return { success: true };
				});

			default:
				return Promise.resolve({ success: true });
		}
	},

	refreshView: function() {
		var container = document.querySelector('.wizard-container');
		if (!container) return;

		// Remove old content (keep nav tabs)
		var tabs = container.querySelector('.cs-nav-tabs');
		while (container.lastChild && container.lastChild !== tabs) {
			container.removeChild(container.lastChild);
		}

		// Render new content
		if (this.config.applyComplete) {
			container.appendChild(this.renderComplete());
		} else if (this.config.applying) {
			container.appendChild(this.renderApplying());
		} else {
			container.appendChild(this.renderHealthAndConfig());
		}
	},

	goToStep: function() {},
	handleSaveAndApply: null,
	handleSave: null,
	handleReset: null
});
