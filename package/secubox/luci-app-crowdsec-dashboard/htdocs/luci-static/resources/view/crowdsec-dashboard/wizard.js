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
	wizardData: {
		currentStep: 1,
		totalSteps: 8,

		// Step 1 data
		crowdsecRunning: false,
		lapiAvailable: false,
		lapiRepairing: false,
		lapiRepairAttempted: false,

		// Step 2 data (Console Enrollment)
		consoleEnrolled: false,
		enrolling: false,
		enrollmentKey: '',
		machineName: '',

		// Step 3 data (Hub Update)
		hubUpdating: false,
		hubUpdated: false,

		// Step 4 data (Log Acquisition)
		acquisitionConfigured: false,
		acquisitionConfiguring: false,
		syslogEnabled: true,
		firewallEnabled: true,
		sshEnabled: true,
		httpEnabled: false,
		syslogPath: '/var/log/messages',

		// Step 5 data (Collections)
		collections: [],
		installing: false,
		installed: false,
		installStatus: '',
		installedCount: 0,

		// Step 6 data (Bouncer)
		configuring: false,
		bouncerConfigured: false,
		apiKey: '',
		resetting: false,

		// Step 7 data (Services)
		starting: false,
		enabling: false,
		enabled: false,
		running: false,
		nftablesActive: false,
		lapiConnected: false,

		// Step 8 data (Complete)
		blockedIPs: 0,
		activeDecisions: 0
	},

	load: function() {
		return Promise.all([
			API.getStatus(),
			API.checkWizardNeeded(),
			API.getConsoleStatus()
		]).then(L.bind(function(results) {
			var status = results[0];
			var wizardNeeded = results[1];
			var consoleStatus = results[2];

			// Update wizard data from status
			this.wizardData.crowdsecRunning = status && status.crowdsec === 'running';
			this.wizardData.lapiAvailable = status && status.lapi_status === 'available';
			this.wizardData.consoleEnrolled = consoleStatus && consoleStatus.enrolled;

			// Auto-repair LAPI if CrowdSec is running but LAPI is not available
			if (this.wizardData.crowdsecRunning && !this.wizardData.lapiAvailable && !this.wizardData.lapiRepairAttempted) {
				console.log('[Wizard] LAPI unavailable, triggering auto-repair...');
				this.wizardData.lapiRepairing = true;
				this.wizardData.lapiRepairAttempted = true;

				return API.repairLapi().then(L.bind(function(repairResult) {
					console.log('[Wizard] LAPI repair result:', repairResult);
					this.wizardData.lapiRepairing = false;

					if (repairResult && repairResult.success) {
						ui.addNotification(null, E('p', _('LAPI auto-repaired successfully')), 'success');
						// Re-fetch status after repair
						return API.getStatus().then(L.bind(function(newStatus) {
							this.wizardData.crowdsecRunning = newStatus && newStatus.crowdsec === 'running';
							this.wizardData.lapiAvailable = newStatus && newStatus.lapi_status === 'available';
							return {
								status: newStatus,
								wizardNeeded: wizardNeeded,
								consoleStatus: consoleStatus,
								repaired: true
							};
						}, this));
					} else {
						console.log('[Wizard] LAPI repair failed:', repairResult);
						return {
							status: status,
							wizardNeeded: wizardNeeded,
							consoleStatus: consoleStatus,
							repairFailed: true
						};
					}
				}, this));
			}

			return {
				status: status,
				wizardNeeded: wizardNeeded,
				consoleStatus: consoleStatus
			};
		}, this));
	},

	render: function(data) {
		// Initialize theme
		Theme.init();

		// Load wizard CSS
		var head = document.head || document.getElementsByTagName('head')[0];
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('crowdsec-dashboard/wizard.css')
		});
		head.appendChild(cssLink);

		// Load SecuBox theme CSS
		var themeLink = E('link', {
			'rel': 'stylesheet',
			'type': 'text/css',
			'href': L.resource('secubox-theme/secubox-theme.css')
		});
		head.appendChild(themeLink);

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });

		// Add SecuBox global header
		wrapper.appendChild(SbHeader.render());

		var container = E('div', { 'class': 'crowdsec-dashboard wizard-container' });

		// Add navigation tabs
		container.appendChild(CsNav.renderTabs('wizard'));

		// Create stepper
		container.appendChild(this.createStepper());

		// Create step content
		container.appendChild(this.renderCurrentStep(data));

		wrapper.appendChild(container);

		return wrapper;
	},

	createStepper: function() {
		var steps = [
			{ number: 1, title: _('Welcome') },
			{ number: 2, title: _('Console') },
			{ number: 3, title: _('Update Hub') },
			{ number: 4, title: _('Log Sources') },
			{ number: 5, title: _('Install Packs') },
			{ number: 6, title: _('Configure Bouncer') },
			{ number: 7, title: _('Enable Services') },
			{ number: 8, title: _('Complete') }
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
				return this.renderStep2Console(data);
			case 3:
				return this.renderStep3Hub(data);
			case 4:
				return this.renderStep4Acquisition(data);
			case 5:
				return this.renderStep5Collections(data);
			case 6:
				return this.renderStep6Bouncer(data);
			case 7:
				return this.renderStep7Services(data);
			case 8:
				return this.renderStep8Complete(data);
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
		var lapiRepairing = this.wizardData.lapiRepairing;
		var repaired = data && data.repaired;
		var repairFailed = data && data.repairFailed;
		console.log('[Wizard] crowdsecRunning:', crowdsecRunning, 'lapiAvailable:', lapiAvailable, 'repairing:', lapiRepairing);

		// Determine LAPI status display
		var lapiStatusText = lapiAvailable ? _('AVAILABLE') : (lapiRepairing ? _('REPAIRING...') : _('UNAVAILABLE'));
		var lapiStatusClass = lapiAvailable ? 'success' : (lapiRepairing ? 'warning' : 'error');
		var lapiIconClass = lapiAvailable ? ' success' : (lapiRepairing ? ' warning' : ' error');
		var lapiIcon = lapiAvailable ? '✓' : (lapiRepairing ? '⟳' : '✗');

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
					E('span', { 'class': 'check-icon' + lapiIconClass + (lapiRepairing ? ' spinning' : '') },
						lapiIcon),
					E('span', {}, _('Local API (LAPI)')),
					E('span', { 'class': 'badge badge-' + lapiStatusClass },
						lapiStatusText)
				])
			]),

			// Repair status message
			repaired ? E('div', { 'class': 'success-message', 'style': 'margin: 16px 0; padding: 12px; background: rgba(34, 197, 94, 0.15); border-radius: 8px; color: #16a34a;' }, [
				E('span', { 'style': 'margin-right: 8px;' }, '✓'),
				_('LAPI was automatically repaired!')
			]) : E([]),

			// Manual repair button if auto-repair failed
			(repairFailed || (!lapiAvailable && !lapiRepairing && this.wizardData.lapiRepairAttempted)) ?
				E('div', { 'style': 'margin: 16px 0; padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);' }, [
					E('p', { 'style': 'margin: 0 0 12px 0; color: #dc2626;' },
						_('LAPI auto-repair failed. You can try manual repair or check the CrowdSec logs.')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleManualRepair, this)
					}, _('Retry Repair'))
				]) : E([]),

			// Info box
			E('div', { 'class': 'info-box' }, [
				E('h4', {}, _('What will be configured:')),
				E('ul', {}, [
					E('li', {}, _('Enroll in CrowdSec Console for community blocklists')),
					E('li', {}, _('Update CrowdSec hub with latest collections')),
					E('li', {}, _('Install essential security scenarios')),
					E('li', {}, _('Register and configure firewall bouncer')),
					E('li', {}, _('Enable automatic IP blocking via nftables'))
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
					'disabled': (!crowdsecRunning || !lapiAvailable || lapiRepairing) ? true : null,
					'click': L.bind(function(ev) {
						console.log('[Wizard] Next button clicked!');
						ev.preventDefault();
						ev.stopPropagation();
						this.goToStep(2);
					}, this)
				}, _('Next'))
			])
		]);
	},

	renderStep2Console: function(data) {
		var consoleStatus = data && data.consoleStatus ? data.consoleStatus : {};
		var enrolled = consoleStatus.enrolled || this.wizardData.consoleEnrolled;

		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('CrowdSec Console Enrollment')),
			E('p', {}, _('Connect to CrowdSec Console to receive community blocklists and monitor your security.')),

			// Benefits
			E('div', { 'class': 'info-box', 'style': 'margin-bottom: 24px;' }, [
				E('h4', {}, _('Benefits of enrolling:')),
				E('ul', {}, [
					E('li', {}, _('Access to community-curated blocklists')),
					E('li', {}, _('Real-time threat intelligence sharing')),
					E('li', {}, _('Centralized monitoring dashboard')),
					E('li', {}, _('Free tier available'))
				])
			]),

			// Enrollment status
			enrolled ?
				E('div', { 'class': 'success-message', 'style': 'margin: 24px 0; padding: 16px; background: rgba(34, 197, 94, 0.15); border-radius: 8px;' }, [
					E('span', { 'class': 'check-icon success', 'style': 'font-size: 24px; margin-right: 12px;' }, '✓'),
					E('div', { 'style': 'display: inline-block;' }, [
						E('strong', { 'style': 'display: block; color: #16a34a;' }, _('Already enrolled!')),
						E('span', { 'style': 'color: #15803d; font-size: 0.9em;' },
							_('Your instance is connected to CrowdSec Console'))
					])
				]) :
				E('div', { 'class': 'enrollment-form', 'style': 'margin: 24px 0;' }, [
					// Enrollment key input
					E('div', { 'class': 'form-group', 'style': 'margin-bottom: 16px;' }, [
						E('label', { 'style': 'display: block; margin-bottom: 8px; font-weight: 500;' },
							_('Enrollment Key')),
						E('input', {
							'type': 'text',
							'id': 'console-enrollment-key',
							'class': 'cbi-input-text',
							'placeholder': _('Paste your enrollment key from console.crowdsec.net'),
							'style': 'width: 100%; padding: 12px; font-family: monospace;'
						}),
						E('p', { 'style': 'margin-top: 8px; color: var(--cyber-text-secondary, #666); font-size: 0.9em;' }, [
							_('Get your key from '),
							E('a', {
								'href': 'https://app.crowdsec.net/security-engines',
								'target': '_blank',
								'style': 'color: var(--cyber-accent-primary, #667eea);'
							}, 'app.crowdsec.net')
						])
					]),

					// Machine name (optional)
					E('div', { 'class': 'form-group', 'style': 'margin-bottom: 16px;' }, [
						E('label', { 'style': 'display: block; margin-bottom: 8px; font-weight: 500;' },
							_('Machine Name (optional)')),
						E('input', {
							'type': 'text',
							'id': 'console-machine-name',
							'class': 'cbi-input-text',
							'placeholder': _('e.g., secubox-router'),
							'style': 'width: 100%; padding: 12px;'
						})
					]),

					// Enrolling status
					this.wizardData.enrolling ?
						E('div', { 'style': 'text-align: center; padding: 16px;' }, [
							E('div', { 'class': 'spinning' }),
							E('p', {}, _('Enrolling...'))
						]) : E([]),

					// Enroll button
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'width: 100%; padding: 12px; font-size: 1em;',
						'disabled': this.wizardData.enrolling ? true : null,
						'click': L.bind(this.handleConsoleEnroll, this)
					}, _('Enroll in CrowdSec Console'))
				]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 1)
				}, _('Back')),
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 3),
					'disabled': this.wizardData.enrolling ? true : null
				}, enrolled ? _('Next') : _('Skip'))
			])
		]);
	},

	renderStep3Hub: function(data) {
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
					'click': L.bind(this.goToStep, this, 2)
				}, _('Back')),
				this.wizardData.hubUpdated ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 4)
					}, _('Next')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleUpdateHub, this)
					}, _('Update Hub'))
			])
		]);
	},

	renderStep4Acquisition: function(data) {
		var self = this;
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Configure Log Acquisition')),
			E('p', {}, _('Select which log sources CrowdSec should monitor for security threats.')),

			// Info box about log acquisition
			E('div', { 'class': 'info-box', 'style': 'margin-bottom: 24px;' }, [
				E('h4', {}, _('About Log Acquisition')),
				E('p', { 'style': 'margin: 0; font-size: 0.9em; color: var(--cyber-text-secondary, #94a3b8);' },
					_('CrowdSec analyzes logs to detect malicious activity. Enable the log sources relevant to your setup.'))
			]),

			// Log source toggles
			E('div', { 'class': 'config-section' }, [
				// Syslog
				E('div', {
					'class': 'config-group',
					'id': 'acq-syslog',
					'data-checked': this.wizardData.syslogEnabled ? '1' : '0',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						self.wizardData.syslogEnabled = newState;
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: ' + (this.wizardData.syslogEnabled ? '#22c55e' : '#94a3b8') + '; min-width: 24px;'
					}, this.wizardData.syslogEnabled ? '☑' : '☐'),
					E('div', { 'style': 'flex: 1;' }, [
						E('strong', {}, _('System Syslog')),
						E('div', { 'style': 'font-size: 0.85em; color: var(--cyber-text-secondary, #94a3b8);' },
							_('Monitor /var/log/messages for system events'))
					])
				]),

				// Firewall logs
				E('div', {
					'class': 'config-group',
					'id': 'acq-firewall',
					'data-checked': this.wizardData.firewallEnabled ? '1' : '0',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						self.wizardData.firewallEnabled = newState;
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: ' + (this.wizardData.firewallEnabled ? '#22c55e' : '#94a3b8') + '; min-width: 24px;'
					}, this.wizardData.firewallEnabled ? '☑' : '☐'),
					E('div', { 'style': 'flex: 1;' }, [
						E('strong', {}, _('Firewall Logs')),
						E('div', { 'style': 'font-size: 0.85em; color: var(--cyber-text-secondary, #94a3b8);' },
							_('Monitor iptables/nftables for port scans (requires iptables collection)'))
					])
				]),

				// SSH/Dropbear logs
				E('div', {
					'class': 'config-group',
					'id': 'acq-ssh',
					'data-checked': this.wizardData.sshEnabled ? '1' : '0',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						self.wizardData.sshEnabled = newState;
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: ' + (this.wizardData.sshEnabled ? '#22c55e' : '#94a3b8') + '; min-width: 24px;'
					}, this.wizardData.sshEnabled ? '☑' : '☐'),
					E('div', { 'style': 'flex: 1;' }, [
						E('strong', {}, _('SSH/Dropbear Logs')),
						E('div', { 'style': 'font-size: 0.85em; color: var(--cyber-text-secondary, #94a3b8);' },
							_('Detect SSH brute force attacks (via syslog)'))
					])
				]),

				// HTTP logs
				E('div', {
					'class': 'config-group',
					'id': 'acq-http',
					'data-checked': this.wizardData.httpEnabled ? '1' : '0',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						self.wizardData.httpEnabled = newState;
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: ' + (this.wizardData.httpEnabled ? '#22c55e' : '#94a3b8') + '; min-width: 24px;'
					}, this.wizardData.httpEnabled ? '☑' : '☐'),
					E('div', { 'style': 'flex: 1;' }, [
						E('strong', {}, _('HTTP Server Logs')),
						E('div', { 'style': 'font-size: 0.85em; color: var(--cyber-text-secondary, #94a3b8);' },
							_('Monitor uHTTPd/nginx web server (disabled by default)'))
					])
				]),

				// Note about OpenWrt log handling
				E('div', { 'class': 'info-box', 'style': 'margin-top: 16px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border: 1px solid rgba(102, 126, 234, 0.3);' }, [
					E('p', { 'style': 'margin: 0; font-size: 0.9em; color: var(--cyber-text-secondary, #94a3b8);' }, [
						E('strong', { 'style': 'color: var(--cyber-accent-primary, #667eea);' }, _('Note: ')),
						_('OpenWrt uses logread command instead of log files. CrowdSec will stream logs via "logread -f". All enabled sources (syslog, SSH, firewall) share the same log stream.')
					])
				])
			]),

			// Configuration status
			this.wizardData.acquisitionConfigured ?
				E('div', { 'class': 'success-message', 'style': 'margin-top: 16px;' }, [
					E('span', { 'class': 'check-icon success' }, '✓'),
					_('Log acquisition configured successfully!')
				]) :
				this.wizardData.acquisitionConfiguring ?
					E('div', { 'class': 'spinning', 'style': 'margin-top: 16px;' }, _('Configuring acquisition...')) :
					E([]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 3),
					'disabled': this.wizardData.acquisitionConfiguring ? true : null
				}, _('Back')),
				this.wizardData.acquisitionConfigured ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 5)
					}, _('Next')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleConfigureAcquisition, this),
						'disabled': this.wizardData.acquisitionConfiguring ? true : null
					}, _('Apply Configuration'))
			])
		]);
	},

	renderStep5Collections: function(data) {
		var recommendedCollections = [
			{ name: 'crowdsecurity/linux', description: 'Base Linux scenarios (SSH, syslog)', preselected: true },
			{ name: 'crowdsecurity/iptables', description: 'Firewall log parser (port scan detection)', preselected: this.wizardData.firewallEnabled },
			{ name: 'crowdsecurity/ssh-bf', description: 'SSH brute force protection', preselected: true },
			{ name: 'crowdsecurity/http-cve', description: 'Web CVE protection', preselected: this.wizardData.httpEnabled },
			{ name: 'crowdsecurity/whitelist-good-actors', description: 'Whitelist known good bots', preselected: false }
		];

		// OpenWrt-specific parsers for log sources
		var recommendedParsers = [
			{ name: 'crowdsecurity/dropbear-logs', description: 'Dropbear SSH daemon logs (OpenWrt)', preselected: this.wizardData.sshEnabled },
			{ name: 'crowdsecurity/syslog-logs', description: 'Generic syslog parser', preselected: this.wizardData.syslogEnabled }
		];

		var renderCheckboxItem = function(item, type) {
			var attrs = {
				'class': 'collection-item',
				'data-type': type,
				'data-name': item.name,
				'data-checked': item.preselected ? '1' : '0',
				'style': 'display: flex; align-items: center; cursor: pointer;',
				'click': function(ev) {
					var el = ev.currentTarget;
					var currentState = el.getAttribute('data-checked') === '1';
					var newState = !currentState;
					el.setAttribute('data-checked', newState ? '1' : '0');
					var checkbox = el.querySelector('.checkbox-indicator');
					if (checkbox) {
						checkbox.textContent = newState ? '☑' : '☐';
						checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
					}
				}
			};
			return E('div', attrs, [
				E('span', {
					'class': 'checkbox-indicator',
					'style': 'display: inline-block; font-size: 28px; margin-right: 16px; user-select: none; color: ' + (item.preselected ? '#22c55e' : '#94a3b8') + '; line-height: 1; min-width: 28px;'
				}, item.preselected ? '☑' : '☐'),
				E('div', { 'class': 'collection-info', 'style': 'flex: 1;' }, [
					E('strong', {}, item.name),
					E('div', { 'class': 'collection-desc' }, item.description)
				])
			]);
		};

		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Install Security Collections & Parsers')),
			E('p', {}, _('Select collections and parsers to install. Recommended items are pre-selected based on your log configuration.')),

			// Collections section
			E('h3', { 'style': 'margin-top: 20px; margin-bottom: 12px; font-size: 1.1em; color: #94a3b8;' }, [
				E('span', { 'style': 'margin-right: 8px;' }, '📦'),
				_('Collections')
			]),
			E('div', { 'class': 'collections-list' },
				recommendedCollections.map(function(c) { return renderCheckboxItem(c, 'collection'); })
			),

			// Parsers section
			E('h3', { 'style': 'margin-top: 24px; margin-bottom: 12px; font-size: 1.1em; color: #94a3b8;' }, [
				E('span', { 'style': 'margin-right: 8px;' }, '📝'),
				_('OpenWrt Parsers')
			]),
			E('div', { 'class': 'collections-list' },
				recommendedParsers.map(function(p) { return renderCheckboxItem(p, 'parser'); })
			),

			// Install progress
			this.wizardData.installing ?
				E('div', { 'class': 'install-progress' }, [
					E('div', { 'class': 'spinning' }),
					E('p', {}, _('Installing...')),
					E('div', { 'id': 'install-status' }, this.wizardData.installStatus || '')
				]) : E([]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 4),
					'disabled': this.wizardData.installing ? true : null
				}, _('Back')),
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 6),
					'disabled': this.wizardData.installing ? true : null
				}, _('Skip')),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': L.bind(this.handleInstallCollections, this),
					'disabled': (this.wizardData.installing || this.wizardData.installed) ? true : null
				}, this.wizardData.installed ? _('Installed') : _('Install Selected'))
			])
		]);
	},

	renderStep6Bouncer: function(data) {
		var self = this;
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Configure Firewall Bouncer')),
			E('p', {}, _('The firewall bouncer will automatically block malicious IPs using nftables.')),

			// Recovery mode warning/option
			E('div', { 'id': 'recovery-mode-section', 'class': 'config-section', 'style': 'margin-bottom: 20px; padding: 16px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; margin-bottom: 12px;' }, [
					E('span', { 'style': 'font-size: 24px; margin-right: 12px;' }, '🔄'),
					E('div', {}, [
						E('strong', { 'style': 'color: #eab308;' }, _('Recovery Mode')),
						E('div', { 'style': 'font-size: 0.9em; color: var(--cyber-text-secondary, #94a3b8);' },
							_('Use this if bouncer registration fails or you want to start fresh'))
					])
				]),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'style': 'width: 100%;',
					'disabled': this.wizardData.resetting ? true : null,
					'click': L.bind(this.handleResetWizard, this)
				}, this.wizardData.resetting ? _('Resetting...') : _('Reset Bouncer Configuration'))
			]),

			// Configuration options
			E('div', { 'class': 'config-section' }, [
				E('div', {
					'class': 'config-group',
					'id': 'bouncer-ipv4',
					'data-checked': '1',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: #22c55e; min-width: 24px;'
					}, '☑'),
					E('span', {}, _('Enable IPv4 blocking'))
				]),
				E('div', {
					'class': 'config-group',
					'id': 'bouncer-ipv6',
					'data-checked': '1',
					'style': 'display: flex; align-items: center; cursor: pointer; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; margin-bottom: 12px;',
					'click': function(ev) {
						var item = ev.currentTarget;
						var currentState = item.getAttribute('data-checked') === '1';
						var newState = !currentState;
						item.setAttribute('data-checked', newState ? '1' : '0');
						var checkbox = item.querySelector('.checkbox-indicator');
						if (checkbox) {
							checkbox.textContent = newState ? '☑' : '☐';
							checkbox.style.color = newState ? '#22c55e' : '#94a3b8';
						}
					}
				}, [
					E('span', {
						'class': 'checkbox-indicator',
						'style': 'display: inline-block; font-size: 24px; margin-right: 12px; user-select: none; color: #22c55e; min-width: 24px;'
					}, '☑'),
					E('span', {}, _('Enable IPv6 blocking'))
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
					E([]),

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
				]) : E([]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 5),
					'disabled': this.wizardData.configuring ? true : null
				}, _('Back')),
				this.wizardData.bouncerConfigured ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 7)
					}, _('Next')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleConfigureBouncer, this),
						'disabled': this.wizardData.configuring ? true : null
					}, _('Configure Bouncer'))
			])
		]);
	},

	renderStep7Services: function(data) {
		return E('div', { 'class': 'wizard-step' }, [
			E('h2', {}, _('Enable & Start Services')),
			E('p', {}, _('Starting the firewall bouncer service and verifying operation...')),

			// Service startup progress
			E('div', { 'class': 'service-status' }, [
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('Enable at boot:')),
					E('span', { 'class': 'status-value' + (this.wizardData.enabled ? ' success' : '') },
						this.wizardData.enabled ? _('Enabled') : this.wizardData.enabling ? _('Enabling...') : _('Not enabled'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('Service status:')),
					E('span', { 'class': 'status-value' + (this.wizardData.running ? ' success' : '') },
						this.wizardData.running ? _('Running') : this.wizardData.starting ? _('Starting...') : _('Stopped'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('nftables rules:')),
					E('span', { 'class': 'status-value' + (this.wizardData.nftablesActive ? ' success' : '') },
						this.wizardData.nftablesActive ? _('Loaded') : _('Not loaded'))
				]),
				E('div', { 'class': 'status-item' }, [
					E('span', { 'class': 'status-label' }, _('LAPI connection:')),
					E('span', { 'class': 'status-value' + (this.wizardData.lapiConnected ? ' success' : '') },
						this.wizardData.lapiConnected ? _('Connected') : _('Not connected'))
				])
			]),

			// Navigation
			E('div', { 'class': 'wizard-nav' }, [
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.goToStep, this, 6),
					'disabled': this.wizardData.starting ? true : null
				}, _('Back')),
				(this.wizardData.enabled && this.wizardData.running && this.wizardData.nftablesActive && this.wizardData.lapiConnected) ?
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.goToStep, this, 8)
					}, _('Next')) :
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleStartServices, this),
						'disabled': this.wizardData.starting ? true : null
					}, _('Start Services'))
			])
		]);
	},

	renderStep8Complete: function(data) {
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
				this.wizardData.consoleEnrolled ?
					E('div', { 'class': 'summary-item' }, [
						E('span', { 'class': 'check-icon success' }, '✓'),
						E('div', {}, [
							E('strong', {}, _('Console Enrolled')),
							E('div', { 'class': 'summary-desc' }, _('Receiving community blocklists'))
						])
					]) : E([]),
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
					this.wizardData.consoleEnrolled ?
						E('li', {}, [
							_('Monitor from '),
							E('a', { 'href': 'https://app.crowdsec.net', 'target': '_blank' }, 'CrowdSec Console')
						]) :
						E('li', {}, _('Consider enrolling in CrowdSec Console for blocklists'))
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
				}, _('Go to Dashboard'))
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

	handleConsoleEnroll: function() {
		var keyInput = document.getElementById('console-enrollment-key');
		var nameInput = document.getElementById('console-machine-name');
		var key = keyInput ? keyInput.value.trim() : '';
		var name = nameInput ? nameInput.value.trim() : '';

		if (!key) {
			ui.addNotification(null, E('p', _('Please enter an enrollment key')), 'warning');
			return;
		}

		console.log('[Wizard] Enrolling with key:', key.substring(0, 10) + '...');
		this.wizardData.enrolling = true;
		this.refreshView();

		return API.consoleEnroll(key, name).then(L.bind(function(result) {
			console.log('[Wizard] Enrollment result:', result);
			this.wizardData.enrolling = false;

			if (result && result.success) {
				this.wizardData.consoleEnrolled = true;
				ui.addNotification(null, E('p', _('Successfully enrolled in CrowdSec Console!')), 'success');
				// Auto-advance after 2 seconds
				setTimeout(L.bind(function() { this.goToStep(3); }, this), 2000);
			} else {
				ui.addNotification(null, E('p', _('Enrollment failed: ') + (result.error || result.output || 'Unknown error')), 'error');
			}
			this.refreshView();
		}, this)).catch(L.bind(function(err) {
			console.error('[Wizard] Enrollment error:', err);
			this.wizardData.enrolling = false;
			ui.addNotification(null, E('p', _('Enrollment failed: ') + err.message), 'error');
			this.refreshView();
		}, this));
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

	handleConfigureAcquisition: function() {
		console.log('[Wizard] handleConfigureAcquisition called');
		this.wizardData.acquisitionConfiguring = true;

		// Update button state without full refresh (which would abort the XHR)
		var btn = document.querySelector('.cbi-button-action');
		if (btn) {
			btn.disabled = true;
			btn.textContent = _('Configuring...');
		}

		// Get values from wizard data
		var syslogEnabled = this.wizardData.syslogEnabled ? '1' : '0';
		var firewallEnabled = this.wizardData.firewallEnabled ? '1' : '0';
		var sshEnabled = this.wizardData.sshEnabled ? '1' : '0';
		var httpEnabled = this.wizardData.httpEnabled ? '1' : '0';
		var syslogPath = this.wizardData.syslogPath || '/var/log/messages';

		console.log('[Wizard] Acquisition config:', {
			syslog: syslogEnabled,
			firewall: firewallEnabled,
			ssh: sshEnabled,
			http: httpEnabled,
			path: syslogPath
		});

		return API.configureAcquisition(syslogEnabled, firewallEnabled, sshEnabled, httpEnabled, syslogPath)
			.then(L.bind(function(result) {
				console.log('[Wizard] configureAcquisition result:', result);
				this.wizardData.acquisitionConfiguring = false;

				if (result && result.success) {
					this.wizardData.acquisitionConfigured = true;
					ui.addNotification(null, E('p', _('Log acquisition configured successfully')), 'info');
					this.refreshView();

					// Auto-advance to Step 5 (Collections) after 2 seconds
					console.log('[Wizard] Auto-advancing to Step 5 in 2 seconds...');
					setTimeout(L.bind(function() { this.goToStep(5); }, this), 2000);
				} else {
					ui.addNotification(null, E('p', _('Configuration failed: ') + (result.error || 'Unknown error')), 'error');
					this.refreshView();
				}
			}, this))
			.catch(L.bind(function(err) {
				console.error('[Wizard] Acquisition configuration error:', err);
				this.wizardData.acquisitionConfiguring = false;
				ui.addNotification(null, E('p', _('Configuration failed: ') + err.message), 'error');
				this.refreshView();
			}, this));
	},

	handleInstallCollections: function() {
		// Read collections from data-checked attributes
		var collectionItems = document.querySelectorAll('.collection-item[data-type="collection"]');
		var selectedCollections = Array.from(collectionItems)
			.filter(function(item) { return item.getAttribute('data-checked') === '1'; })
			.map(function(item) { return item.getAttribute('data-name'); });

		// Read parsers from data-checked attributes
		var parserItems = document.querySelectorAll('.collection-item[data-type="parser"]');
		var selectedParsers = Array.from(parserItems)
			.filter(function(item) { return item.getAttribute('data-checked') === '1'; })
			.map(function(item) { return item.getAttribute('data-name'); });

		console.log('[Wizard] Selected collections:', selectedCollections);
		console.log('[Wizard] Selected parsers:', selectedParsers);

		var totalItems = selectedCollections.length + selectedParsers.length;

		if (totalItems === 0) {
			this.goToStep(6);
			return;
		}

		this.wizardData.installing = true;
		this.wizardData.installStatus = _('Installing 0 of %d items...').format(totalItems);
		this.refreshView();

		var currentIndex = 0;
		var self = this;

		// Install collections sequentially
		var installPromises = selectedCollections.reduce(function(promise, collection) {
			return promise.then(function() {
				currentIndex++;
				self.wizardData.installStatus = _('Installing %d of %d: %s').format(currentIndex, totalItems, collection);
				self.refreshView();
				return API.installCollection(collection);
			});
		}, Promise.resolve());

		// Then install parsers sequentially
		installPromises = selectedParsers.reduce(function(promise, parser) {
			return promise.then(function() {
				currentIndex++;
				self.wizardData.installStatus = _('Installing %d of %d: %s').format(currentIndex, totalItems, parser);
				self.refreshView();
				return API.installHubItem('parser', parser);
			});
		}, installPromises);

		return installPromises.then(L.bind(function() {
			this.wizardData.installing = false;
			this.wizardData.installed = true;
			this.wizardData.installedCount = totalItems;
			ui.addNotification(null, E('p', _('Installed %d collections and %d parsers').format(selectedCollections.length, selectedParsers.length)), 'info');
			this.refreshView();

			// Auto-advance to Step 6 (Configure Bouncer) after 2 seconds
			setTimeout(L.bind(function() { this.goToStep(6); }, this), 2000);
		}, this)).catch(L.bind(function(err) {
			this.wizardData.installing = false;
			ui.addNotification(null, E('p', _('Installation failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleConfigureBouncer: function() {
		console.log('[Wizard] handleConfigureBouncer called');
		this.wizardData.configuring = true;
		this.refreshView();

		var ipv4Elem = document.getElementById('bouncer-ipv4');
		var ipv6Elem = document.getElementById('bouncer-ipv6');
		var ipv4 = ipv4Elem ? ipv4Elem.getAttribute('data-checked') === '1' : true;
		var ipv6 = ipv6Elem ? ipv6Elem.getAttribute('data-checked') === '1' : true;
		var frequency = document.getElementById('bouncer-frequency').value;

		console.log('[Wizard] Bouncer config:', { ipv4: ipv4, ipv6: ipv6, frequency: frequency });

		// Step 1: Register bouncer
		console.log('[Wizard] Registering bouncer...');
		return API.registerBouncer('crowdsec-firewall-bouncer').then(L.bind(function(result) {
			console.log('[Wizard] registerBouncer result:', result);
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
		}, this)).then(L.bind(function(results) {
			console.log('[Wizard] UCI config results:', results);
			this.wizardData.configuring = false;
			this.wizardData.bouncerConfigured = true;
			ui.addNotification(null, E('p', _('Bouncer configured successfully')), 'info');
			this.refreshView();

			// Auto-advance to Step 7 (Enable Services) after 2 seconds
			console.log('[Wizard] Auto-advancing to Step 7 in 2 seconds...');
			setTimeout(L.bind(function() { this.goToStep(7); }, this), 2000);
		}, this)).catch(L.bind(function(err) {
			console.error('[Wizard] Configuration error:', err);
			this.wizardData.configuring = false;
			ui.addNotification(null, E('p', _('Configuration failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleStartServices: function() {
		console.log('[Wizard] handleStartServices called');
		this.wizardData.starting = true;
		this.wizardData.enabling = true;
		this.refreshView();

		// Step 1: Enable service
		console.log('[Wizard] Enabling firewall bouncer...');
		return API.controlFirewallBouncer('enable').then(L.bind(function(result) {
			console.log('[Wizard] Enable result:', result);
			this.wizardData.enabling = false;
			this.wizardData.enabled = result.success;
			this.refreshView();

			// Step 2: Start service
			console.log('[Wizard] Starting firewall bouncer...');
			return API.controlFirewallBouncer('start');
		}, this)).then(L.bind(function(result) {
			console.log('[Wizard] Start result:', result);
			this.wizardData.running = result.success;
			this.refreshView();

			// Step 3: Wait 3 seconds for service to initialize
			console.log('[Wizard] Waiting 3 seconds for service initialization...');
			return new Promise(function(resolve) { setTimeout(resolve, 3000); });
		}, this)).then(L.bind(function() {
			// Step 4: Check status
			console.log('[Wizard] Checking firewall bouncer status...');
			return API.getFirewallBouncerStatus();
		}, this)).then(L.bind(function(status) {
			console.log('[Wizard] Bouncer status:', status);
			this.wizardData.nftablesActive = status.nftables_ipv4 || status.nftables_ipv6;
			this.wizardData.starting = false;

			// Step 5: Verify LAPI connection (check if bouncer pulled decisions)
			console.log('[Wizard] Checking LAPI connection...');
			return API.getBouncers();
		}, this)).then(L.bind(function(bouncers) {
			console.log('[Wizard] Bouncers list:', bouncers);
			var bouncerList = bouncers && bouncers.bouncers ? bouncers.bouncers : bouncers;
			var bouncer = (bouncerList || []).find(function(b) {
				return b.name === 'crowdsec-firewall-bouncer';
			});

			this.wizardData.lapiConnected = bouncer && bouncer.last_pull;
			console.log('[Wizard] Final status:', {
				enabled: this.wizardData.enabled,
				running: this.wizardData.running,
				nftablesActive: this.wizardData.nftablesActive,
				lapiConnected: this.wizardData.lapiConnected
			});
			this.refreshView();

			// Success if enabled, running, and nftables active
			// LAPI connection may take a few seconds to establish, so it's optional
			if (this.wizardData.enabled && this.wizardData.running &&
				this.wizardData.nftablesActive) {
				console.log('[Wizard] All critical services started! Auto-advancing to Step 8 (Complete)...');
				ui.addNotification(null, E('p', _('Services started successfully!')), 'info');
				// Auto-advance to Step 8 (Complete) after 2 seconds
				setTimeout(L.bind(function() { this.goToStep(8); }, this), 2000);
			} else {
				console.log('[Wizard] Service startup incomplete');
				ui.addNotification(null, E('p', _('Service startup incomplete. Check status and retry.')), 'warning');
			}
		}, this)).catch(L.bind(function(err) {
			console.error('[Wizard] Service startup error:', err);
			this.wizardData.starting = false;
			ui.addNotification(null, E('p', _('Service start failed: %s').format(err.message)), 'error');
			this.refreshView();
		}, this));
	},

	handleManualRepair: function() {
		console.log('[Wizard] Manual repair triggered');
		this.wizardData.lapiRepairing = true;
		this.wizardData.lapiRepairAttempted = false; // Reset to allow retry
		this.refreshView();

		return API.repairLapi().then(L.bind(function(result) {
			console.log('[Wizard] Manual repair result:', result);
			this.wizardData.lapiRepairing = false;
			this.wizardData.lapiRepairAttempted = true;

			if (result && result.success) {
				ui.addNotification(null, E('p', _('LAPI repaired successfully: ') + (result.steps || '')), 'success');
				// Re-check status
				return API.getStatus().then(L.bind(function(status) {
					this.wizardData.crowdsecRunning = status && status.crowdsec === 'running';
					this.wizardData.lapiAvailable = status && status.lapi_status === 'available';
					this.refreshView();
				}, this));
			} else {
				ui.addNotification(null, E('p', _('LAPI repair failed: ') + (result.error || result.errors || 'Unknown error')), 'error');
				this.refreshView();
			}
		}, this)).catch(L.bind(function(err) {
			console.error('[Wizard] Manual repair error:', err);
			this.wizardData.lapiRepairing = false;
			ui.addNotification(null, E('p', _('LAPI repair failed: ') + err.message), 'error');
			this.refreshView();
		}, this));
	},

	handleResetWizard: function() {
		console.log('[Wizard] Reset wizard triggered (recovery mode)');

		if (!confirm(_('This will delete existing bouncer registration and clear all bouncer configuration. Continue?'))) {
			return;
		}

		this.wizardData.resetting = true;
		this.wizardData.bouncerConfigured = false;
		this.wizardData.apiKey = '';
		this.refreshView();

		return API.resetWizard().then(L.bind(function(result) {
			console.log('[Wizard] Reset wizard result:', result);
			this.wizardData.resetting = false;

			if (result && result.success) {
				ui.addNotification(null, E('p', _('Bouncer configuration reset successfully. You can now configure fresh.')), 'success');
				// Reset relevant wizard data
				this.wizardData.bouncerConfigured = false;
				this.wizardData.apiKey = '';
				this.wizardData.enabled = false;
				this.wizardData.running = false;
				this.wizardData.nftablesActive = false;
				this.wizardData.lapiConnected = false;
			} else {
				ui.addNotification(null, E('p', _('Reset failed: ') + (result.error || 'Unknown error')), 'error');
			}
			this.refreshView();
		}, this)).catch(L.bind(function(err) {
			console.error('[Wizard] Reset wizard error:', err);
			this.wizardData.resetting = false;
			ui.addNotification(null, E('p', _('Reset failed: ') + err.message), 'error');
			this.refreshView();
		}, this));
	},

	handleSaveAndApply: null,
	handleSave: null,
	handleReset: null
});
