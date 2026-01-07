'use strict';
'require view';
'require ui';
'require form';
'require rpc';
'require uci';
'require crowdsec-dashboard.api as API';

return view.extend({
	wizardData: {
		currentStep: 1,
		totalSteps: 6,

		// Step 1 data
		crowdsecRunning: false,
		lapiAvailable: false,

		// Step 2 data
		hubUpdating: false,
		hubUpdated: false,

		// Step 3 data
		collections: [],
		installing: false,
		installed: false,
		installStatus: '',
		installedCount: 0,

		// Step 4 data
		configuring: false,
		bouncerConfigured: false,
		apiKey: '',

		// Step 5 data
		starting: false,
		enabling: false,
		enabled: false,
		running: false,
		nftablesActive: false,
		lapiConnected: false,

		// Step 6 data
		blockedIPs: 0,
		activeDecisions: 0
	},

	load: function() {
		return Promise.all([
			API.getStatus(),
			API.checkWizardNeeded()
		]).then(L.bind(function(results) {
			var status = results[0];
			var wizardNeeded = results[1];

			// Update wizard data from status
			this.wizardData.crowdsecRunning = status && status.crowdsec === 'running';
			this.wizardData.lapiAvailable = status && status.lapi_status === 'available';

			return {
				status: status,
				wizardNeeded: wizardNeeded
			};
		}, this));
	},

	render: function(data) {
		// Load wizard CSS
		var head = document.head || document.getElementsByTagName('head')[0];
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('crowdsec-dashboard/wizard.css')
		});
		head.appendChild(cssLink);

		var container = E('div', { 'class': 'wizard-container' });

		// Create stepper
		container.appendChild(this.createStepper());

		// Create step content
		container.appendChild(this.renderCurrentStep(data));

		return container;
	},

	createStepper: function() {
		var steps = [
			{ number: 1, title: _('Welcome') },
			{ number: 2, title: _('Update Hub') },
			{ number: 3, title: _('Install Packs') },
			{ number: 4, title: _('Configure Bouncer') },
			{ number: 5, title: _('Enable Services') },
			{ number: 6, title: _('Complete') }
		];

		var stepper = E('div', { 'class': 'wizard-stepper' });

		steps.forEach(L.bind(function(step) {
			var classes = ['wizard-step-indicator'];
			if (step.number < this.wizardData.currentStep) {
				classes.push('complete');
			} else if (step.number === this.wizardData.currentStep) {
				classes.push('active');
			}

			var indicator = E('div', { 'class': classes.join(' ') }, [
				E('div', { 'class': 'wizard-step-index' },
					step.number < this.wizardData.currentStep ? '✓' : step.number.toString()
				),
				E('div', { 'class': 'wizard-step-title' }, step.title)
			]);

			stepper.appendChild(indicator);
		}, this));

		return stepper;
	},

	renderCurrentStep: function(data) {
		switch (this.wizardData.currentStep) {
			case 1:
				return this.renderStep1(data);
			case 2:
				return this.renderStep2(data);
			case 3:
				return this.renderStep3(data);
			case 4:
				return this.renderStep4(data);
			case 5:
				return this.renderStep5(data);
			case 6:
				return this.renderStep6(data);
			default:
				return E('div', {}, _('Invalid step'));
		}
	},

	renderStep1: function(data) {
		console.log('[Wizard] renderStep1 data:', data);
		var status = data ? data.status : {};
		console.log('[Wizard] status:', status);
		var crowdsecRunning = status && status.crowdsec === 'running';
		var lapiAvailable = status && status.lapi_status === 'available';
		console.log('[Wizard] crowdsecRunning:', crowdsecRunning, 'lapiAvailable:', lapiAvailable);

		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Welcome to CrowdSec Setup')),
			E('p', {}, _('This wizard will help you set up CrowdSec security suite with firewall bouncer protection.')),

			// Status checks
			E('div', { 'class': 'status-checks' }, [
				E('div', { 'class': 'check-item' }, [
					E('span', { 'class': 'check-icon' + (crowdsecRunning ? ' success' : ' error') },
						crowdsecRunning ? '✓' : '✗'),
					E('span', {}, _('CrowdSec Service')),
					E('span', { 'class': 'badge badge-' + (crowdsecRunning ? 'success' : 'error') },
						crowdsecRunning ? _('RUNNING') : _('STOPPED'))
				]),
				E('div', { 'class': 'check-item' }, [
					E('span', { 'class': 'check-icon' + (lapiAvailable ? ' success' : ' error') },
						lapiAvailable ? '✓' : '✗'),
					E('span', {}, _('Local API (LAPI)')),
					E('span', { 'class': 'badge badge-' + (lapiAvailable ? 'success' : 'error') },
						lapiAvailable ? _('AVAILABLE') : _('UNAVAILABLE'))
				])
			]),

			// Info box
			E('div', { 'class': 'info-box' }, [
				E('h4', {}, _('What will be configured:')),
				E('ul', {}, [
					E('li', {}, _('Update CrowdSec hub with latest collections')),
					E('li', {}, _('Install essential security scenarios')),
					E('li', {}, _('Register and configure firewall bouncer')),
					E('li', {}, _('Enable automatic IP blocking via nftables')),
					E('li', {}, _('Start all services'))
				])
			]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(function() {
						window.location.href = L.url('admin', 'secubox', 'security', 'crowdsec', 'overview');
					}, this)
				}, _('Cancel')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'disabled': (!crowdsecRunning || !lapiAvailable) ? true : null,
					'click': L.bind(function(ev) {
						console.log('[Wizard] Next button clicked!');
						ev.preventDefault();
						ev.stopPropagation();
						this.goToStep(2);
					}, this)
				}, _('Next →'))
			])
		]);
	},

	renderStep2: function(data) {
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Update CrowdSec Hub')),
			E('p', {}, _('Fetching the latest security collections from CrowdSec hub...')),

			E('div', { 'id': 'hub-update-status', 'class': 'status-area' }, [
				this.wizardData.hubUpdating ?
					E('div', { 'class': 'spinning' }, _('Updating hub...')) :
					this.wizardData.hubUpdated ?
						E('div', { 'class': 'success-message' }, [
							E('span', { 'class': 'check-icon success' }, '✓'),
							_('Hub updated successfully!')
						]) :
						E('div', {}, _('Ready to update hub'))
			]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 1)
				}, _('← Back')),
				this.wizardData.hubUpdated ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 3)
					}, _('Next →')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleUpdateHub, this)
					}, _('Update Hub'))
			])
		]);
	},

	renderStep3: function(data) {
		var recommendedCollections = [
			{ name: 'crowdsecurity/linux', description: 'Base Linux scenarios', preselected: true },
			{ name: 'crowdsecurity/ssh-bf', description: 'SSH brute force protection', preselected: true },
			{ name: 'crowdsecurity/http-cve', description: 'Web CVE protection', preselected: true },
			{ name: 'crowdsecurity/whitelist-good-actors', description: 'Whitelist known good bots', preselected: false }
		];

		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Install Security Collections')),
			E('p', {}, _('Select collections to install. Recommended collections are pre-selected.')),

			E('div', { 'class': 'collections-list' },
				recommendedCollections.map(L.bind(function(collection) {
					var checkboxId = 'collection-' + collection.name.replace('/', '-');

					return E('div', { 'class': 'collection-item' }, [
						E('label', { 'class': 'cyber-checkbox', 'for': checkboxId }, [
							E('input', {
								'type': 'checkbox',
								'id': checkboxId,
								'checked': collection.preselected ? 'checked' : null,
								'data-collection': collection.name
							}),
							E('div', { 'class': 'collection-info' }, [
								E('strong', {}, collection.name),
								E('div', { 'class': 'collection-desc' }, collection.description)
							])
						])
					]);
				}, this))
			),

			// Install progress
			this.wizardData.installing ?
				E('div', { 'class': 'install-progress' }, [
					E('div', { 'class': 'spinning' }),
					E('p', {}, _('Installing collections...')),
					E('div', { 'id': 'install-status' }, this.wizardData.installStatus || '')
				]) : E([]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 2),
					'disabled': this.wizardData.installing
				}, _('← Back')),
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 4),
					'disabled': this.wizardData.installing
				}, _('Skip')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': L.bind(this.handleInstallCollections, this),
					'disabled': this.wizardData.installing || this.wizardData.installed
				}, this.wizardData.installed ? _('Installed ✓') : _('Install Selected'))
			])
		]);
	},

	renderStep4: function(data) {
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Configure Firewall Bouncer')),
			E('p', {}, _('The firewall bouncer will automatically block malicious IPs using nftables.')),

			// Configuration options
			E('div', { 'class': 'config-section' }, [
				E('div', { 'class': 'config-group' }, [
					E('label', {}, [
						E('input', {
							'type': 'checkbox',
							'id': 'bouncer-ipv4',
							'checked': true
						}),
						' ',
						_('Enable IPv4 blocking')
					])
				]),
				E('div', { 'class': 'config-group' }, [
					E('label', {}, [
						E('input', {
							'type': 'checkbox',
							'id': 'bouncer-ipv6',
							'checked': true
						}),
						' ',
						_('Enable IPv6 blocking')
					])
				]),
				E('div', { 'class': 'config-group' }, [
					E('label', {}, _('Update Frequency:')),
					E('select', { 'id': 'bouncer-frequency', 'class': 'cbi-input-select' }, [
						E('option', { 'value': '10s', 'selected': true }, _('10 seconds (recommended)')),
						E('option', { 'value': '30s' }, _('30 seconds')),
						E('option', { 'value': '1m' }, _('1 minute'))
					])
				])
			]),

			// Registration status
			this.wizardData.bouncerConfigured ?
				E('div', { 'class': 'success-message' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					_('Firewall bouncer configured successfully!')
				]) :
				this.wizardData.configuring ?
					E('div', { 'class': 'spinning' }, _('Configuring bouncer...')) :
					null,

			// API key display (if registered)
			this.wizardData.apiKey ?
				E('div', { 'class': 'api-key-display' }, [
					E('strong', {}, _('API Key generated:')),
					E('code', { 'id': 'bouncer-api-key' }, this.wizardData.apiKey),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							var key = document.getElementById('bouncer-api-key').textContent;
							navigator.clipboard.writeText(key);
							ui.addNotification(null, E('p', _('API key copied')), 'info');
						}
					}, _('Copy'))
				]) : null,

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 3),
					'disabled': this.wizardData.configuring
				}, _('← Back')),
				this.wizardData.bouncerConfigured ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 5)
					}, _('Next →')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleConfigureBouncer, this),
						'disabled': this.wizardData.configuring
					}, _('Configure Bouncer'))
			])
		]);
	},

	renderStep5: function(data) {
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Enable & Start Services')),
			E('p', {}, _('Starting the firewall bouncer service and verifying operation...')),

			// Service startup progress
			E('div', { 'class': 'service-status' }, [
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('Enable at boot:')),
					E('span', { 'class': 'status-value' + (this.wizardData.enabled ? ' success' : '') },
						this.wizardData.enabled ? _('Enabled ✓') : this.wizardData.enabling ? _('Enabling...') : _('Not enabled'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('Service status:')),
					E('span', { 'class': 'status-value' + (this.wizardData.running ? ' success' : '') },
						this.wizardData.running ? _('Running ✓') : this.wizardData.starting ? _('Starting...') : _('Stopped'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('nftables rules:')),
					E('span', { 'class': 'status-value' + (this.wizardData.nftablesActive ? ' success' : '') },
						this.wizardData.nftablesActive ? _('Loaded ✓') : _('Not loaded'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('LAPI connection:')),
					E('span', { 'class': 'status-value' + (this.wizardData.lapiConnected ? ' success' : '') },
						this.wizardData.lapiConnected ? _('Connected ✓') : _('Not connected'))
				])
			]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 4),
					'disabled': this.wizardData.starting
				}, _('← Back')),
				(this.wizardData.enabled && this.wizardData.running && this.wizardData.nftablesActive && this.wizardData.lapiConnected) ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 6)
					}, _('Next →')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleStartServices, this),
						'disabled': this.wizardData.starting
					}, _('Start Services'))
			])
		]);
	},

	renderStep6: function(data) {
		return E('div', { 'class': 'wizard-step wizard-complete' }, [
			E('div', { 'class': 'success-hero' }, [
				E('div', { 'class': 'success-icon' }, '🎉'),
				E('h2', {}, _('Setup Complete!'))
			]),

			E('p', { 'class': 'text-center' }, _('CrowdSec is now protecting your network.')),

			// Summary
			E('div', { 'class': 'summary-grid' }, [
				E('div', { 'class': 'summary-item' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					E('div', {}, [
						E('strong', {}, _('CrowdSec Service')),
						E('div', { 'class': 'summary-desc' }, _('Running and monitoring'))
					])
				]),
				E('div', { 'class': 'summary-item' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					E('div', {}, [
						E('strong', {}, _('Hub Updated')),
						E('div', { 'class': 'summary-desc' }, _('Latest collections available'))
					])
				]),
				E('div', { 'class': 'summary-item' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					E('div', {}, [
						E('strong', {}, _('Collections Installed')),
						E('div', { 'class': 'summary-desc' },
							_('%d security packs active').format(this.wizardData.installedCount || 0))
					])
				]),
				E('div', { 'class': 'summary-item' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					E('div', {}, [
						E('strong', {}, _('Firewall Bouncer')),
						E('div', { 'class': 'summary-desc' }, _('Blocking malicious IPs'))
					])
				]),
				E('div', { 'class': 'summary-item' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					E('div', {}, [
						E('strong', {}, _('nftables Rules')),
						E('div', { 'class': 'summary-desc' }, _('IPv4 and IPv6 protection active'))
					])
				])
			]),

			// Current stats
			E('div', { 'class': 'stats-box' }, [
				E('h4', {}, _('Current Status')),
				E('div', { 'class': 'stats-row' }, [
					E('div', { 'class': 'stat' }, [
						E('div', { 'class': 'stat-value' }, (this.wizardData.blockedIPs || 0).toString()),
						E('div', { 'class': 'stat-label' }, _('IPs Blocked'))
					]),
					E('div', { 'class': 'stat' }, [
						E('div', { 'class': 'stat-value' }, (this.wizardData.activeDecisions || 0).toString()),
						E('div', { 'class': 'stat-label' }, _('Active Decisions'))
					]),
					E('div', { 'class': 'stat' }, [
						E('div', { 'class': 'stat-value' }, (this.wizardData.installedCount || 0).toString()),
						E('div', { 'class': 'stat-label' }, _('Scenarios'))
					])
				])
			]),

			// Next steps
			E('div', { 'class': 'info-box' }, [
				E('h4', {}, _('Next Steps')),
				E('ul', {}, [
					E('li', {}, _('View real-time decisions in the Decisions tab')),
					E('li', {}, _('Monitor alerts in the Alerts tab')),
					E('li', {}, _('Check blocked IPs in the Bouncers tab')),
					E('li', {}, _('Review metrics in the Metrics tab'))
				])
			]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'style': 'font-size: 16px; padding: 12px 24px;',
					'click': function() {
						window.location.href = L.url('admin', 'secubox', 'security', 'crowdsec', 'overview');
					}
				}, _('Go to Dashboard →'))
			])
		]);
	},

	goToStep: function(stepNumber) {
		this.wizardData.currentStep = stepNumber;
		this.refreshView();
	},

	refreshView: function() {
		var container = document.querySelector('.wizard-container');
		if (container) {
			// Update stepper
			var stepper = this.createStepper();
			container.replaceChild(stepper, container.firstChild);

			// Update step content
			this.load().then(L.bind(function(data) {
				var stepContent = this.renderCurrentStep(data);
				container.replaceChild(stepContent, container.lastChild);
			}, this));
		}
	},

	handleUpdateHub: function() {
		console.log('[Wizard] handleUpdateHub called');
		this.wizardData.hubUpdating = true;
		this.refreshView();

		return API.updateHub().then(L.bind(function(result) {
			console.log('[Wizard] updateHub result:', result);
			this.wizardData.hubUpdating = false;
			this.wizardData.hubUpdated = result.success;

			if (result.success) {
				ui.addNotification(null, E('p', _('Hub updated successfully')), 'info');
				return API.getCollections();
			} else {
				ui.addNotification(null, E('p', result.error || _('Hub update failed')), 'error');
				return null;
			}
		}, this)).then(L.bind(function(collections) {
			console.log('[Wizard] getCollections result:', collections);
			if (collections) {
				this.wizardData.collections = collections;
			}
			this.refreshView();
		}, this)).catch(L.bind(function(error) {
			console.error('[Wizard] Hub update error:', error);
			this.wizardData.hubUpdating = false;
			this.wizardData.hubUpdated = false;
			ui.addNotification(null, E('p', _('Hub update failed: ') + error.message), 'error');
			this.refreshView();
		}, this));
	},

	handleInstallCollections: function() {
		var checkboxes = document.querySelectorAll('[data-collection]');
		var selected = Array.from(checkboxes)
			.filter(function(cb) { return cb.checked; })
			.map(function(cb) { return cb.dataset.collection; });

		if (selected.length === 0) {
			this.goToStep(4);
			return;
		}

		this.wizardData.installing = true;
		this.wizardData.installStatus = _('Installing 0 of %d collections...').format(selected.length);
		this.refreshView();

		// Install collections sequentially
		var installPromises = selected.reduce(L.bind(function(promise, collection, index) {
			return promise.then(L.bind(function() {
				this.wizardData.installStatus = _('Installing %d of %d: %s').format(index + 1, selected.length, collection);
				this.refreshView();
				return API.installCollection(collection);
			}, this));
		}, this), Promise.resolve());

		return installPromises.then(L.bind(function() {
			this.wizardData.installing = false;
			this.wizardData.installed = true;
			this.wizardData.installedCount = selected.length;
			ui.addNotification(null, E('p', _('Installed %d collections').format(selected.length)), 'info');
			this.refreshView();

			// Auto-advance after 2 seconds
			setTimeout(L.bind(function() { this.goToStep(4); }, this), 2000);
		}, this)).catch(L.bind(function(err) {
			this.wizardData.installing = false;
			ui.addNotification(null, E('p', _('Installation failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleConfigureBouncer: function() {
		this.wizardData.configuring = true;
		this.refreshView();

		var ipv4 = document.getElementById('bouncer-ipv4').checked;
		var ipv6 = document.getElementById('bouncer-ipv6').checked;
		var frequency = document.getElementById('bouncer-frequency').value;

		// Step 1: Register bouncer
		return API.registerBouncer('crowdsec-firewall-bouncer').then(L.bind(function(result) {
			if (!result.success) {
				throw new Error(result.error || 'Bouncer registration failed');
			}

			this.wizardData.apiKey = result.api_key;

			// Step 2: Configure UCI settings
			var configPromises = [
				API.updateFirewallBouncerConfig('enabled', '1'),
				API.updateFirewallBouncerConfig('ipv4', ipv4 ? '1' : '0'),
				API.updateFirewallBouncerConfig('ipv6', ipv6 ? '1' : '0'),
				API.updateFirewallBouncerConfig('update_frequency', frequency),
				API.updateFirewallBouncerConfig('api_key', result.api_key)
			];

			return Promise.all(configPromises);
		}, this)).then(L.bind(function() {
			this.wizardData.configuring = false;
			this.wizardData.bouncerConfigured = true;
			ui.addNotification(null, E('p', _('Bouncer configured successfully')), 'info');
			this.refreshView();

			// Auto-advance after 2 seconds
			setTimeout(L.bind(function() { this.goToStep(5); }, this), 2000);
		}, this)).catch(L.bind(function(err) {
			this.wizardData.configuring = false;
			ui.addNotification(null, E('p', _('Configuration failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleStartServices: function() {
		this.wizardData.starting = true;
		this.wizardData.enabling = true;
		this.refreshView();

		// Step 1: Enable service
		return API.controlFirewallBouncer('enable').then(L.bind(function(result) {
			this.wizardData.enabling = false;
			this.wizardData.enabled = result.success;
			this.refreshView();

			// Step 2: Start service
			return API.controlFirewallBouncer('start');
		}, this)).then(L.bind(function(result) {
			this.wizardData.running = result.success;
			this.refreshView();

			// Step 3: Wait 3 seconds for service to initialize
			return new Promise(function(resolve) { setTimeout(resolve, 3000); });
		}, this)).then(L.bind(function() {
			// Step 4: Check status
			return API.getFirewallBouncerStatus();
		}, this)).then(L.bind(function(status) {
			this.wizardData.nftablesActive = status.nftables_ipv4 || status.nftables_ipv6;
			this.wizardData.starting = false;

			// Step 5: Verify LAPI connection (check if bouncer pulled decisions)
			return API.getBouncers();
		}, this)).then(L.bind(function(bouncers) {
			var bouncer = (bouncers || []).find(function(b) {
				return b.name === 'crowdsec-firewall-bouncer';
			});

			this.wizardData.lapiConnected = bouncer && bouncer.last_pull;
			this.refreshView();

			if (this.wizardData.enabled && this.wizardData.running &&
				this.wizardData.nftablesActive && this.wizardData.lapiConnected) {
				ui.addNotification(null, E('p', _('Services started successfully!')), 'info');
				// Auto-advance after 2 seconds
				setTimeout(L.bind(function() { this.goToStep(6); }, this), 2000);
			} else {
				ui.addNotification(null, E('p', _('Service startup incomplete. Check status and retry.')), 'warning');
			}
		}, this)).catch(L.bind(function(err) {
			this.wizardData.starting = false;
			ui.addNotification(null, E('p', _('Service start failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleSaveAndApply: null,
	handleSave: null,
	handleReset: null
});
