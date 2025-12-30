'use strict';
'require view';
'require ui';
'require rpc';
'require secubox-theme/theme as Theme';
'require netifyd-dashboard.api as API';

return view.extend({
	currentStep: 1,
	totalSteps: 4,

	load: function() {
		return API.getStatus();
	},

	render: function(status) {
		var self = this;
		status = status || {};

		var container = E('div', {
			'class': 'netifyd-wizard-container',
			'style': 'max-width: 900px; margin: 2em auto; padding: 2em;'
		}, [
			// Header
			E('div', { 'style': 'text-align: center; margin-bottom: 3em;' }, [
				E('div', {
					'style': 'font-size: 3em; margin-bottom: 0.5em;'
				}, '🔍'),
				E('h1', {
					'style': 'font-size: 2.5em; margin: 0.2em 0; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
				}, 'Netifyd Setup Wizard'),
				E('p', {
					'style': 'color: #94a3b8; font-size: 1.1em; margin-top: 0.5em;'
				}, 'Deep Packet Inspection for OpenWrt')
			]),

			// Progress Bar
			this.renderProgressBar(),

			// Steps Container
			E('div', { 'id': 'wizard-steps', 'style': 'margin-top: 3em;' }, [
				this.renderStep1(status),
				this.renderStep2(status),
				this.renderStep3(status),
				this.renderStep4(status)
			]),

			// Navigation
			this.renderNavigation()
		]);

		return container;
	},

	renderProgressBar: function() {
		var steps = ['Check Status', 'Install', 'Configure', 'Verify'];

		return E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin: 2em 0; position: relative;' }, [
			E('div', {
				'style': 'position: absolute; top: 20px; left: 0; right: 0; height: 2px; background: #1e293b; z-index: 0;'
			}),
			E('div', {
				'id': 'progress-fill',
				'style': 'position: absolute; top: 20px; left: 0; height: 2px; background: linear-gradient(90deg, #8b5cf6, #3b82f6); transition: width 0.3s ease; z-index: 1; width: ' + ((this.currentStep - 1) / (this.totalSteps - 1) * 100) + '%;'
			}),
			steps.map(function(step, index) {
				var stepNum = index + 1;
				var isActive = stepNum === this.currentStep;
				var isComplete = stepNum < this.currentStep;

				return E('div', {
					'style': 'display: flex; flex-direction: column; align-items: center; z-index: 2; position: relative;'
				}, [
					E('div', {
						'class': 'wizard-step-circle',
						'style': 'width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid ' + (isComplete ? '#8b5cf6' : isActive ? '#3b82f6' : '#1e293b') + '; background: ' + (isComplete ? '#8b5cf6' : isActive ? '#1e293b' : '#0f172a') + '; color: ' + (isComplete || isActive ? 'white' : '#475569') + '; transition: all 0.3s ease;'
					}, isComplete ? '✓' : stepNum),
					E('div', {
						'style': 'margin-top: 0.5em; font-size: 0.9em; color: ' + (isActive ? '#3b82f6' : isComplete ? '#8b5cf6' : '#64748b') + '; font-weight: ' + (isActive ? 'bold' : 'normal') + ';'
					}, step)
				]);
			}.bind(this))
		]);
	},

	renderStep1: function(status) {
		return E('div', {
			'id': 'step-1',
			'class': 'wizard-step',
			'style': 'display: ' + (this.currentStep === 1 ? 'block' : 'none') + ';'
		}, [
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '✅'),
					'Step 1: Check Installation'
				]),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
						E('span', { 'style': 'color: #cbd5e1; font-size: 1.1em;' }, 'Netifyd Service Status'),
						E('span', {
							'class': 'badge',
							'style': 'padding: 0.5em 1em; border-radius: 6px; font-weight: bold; background: ' + (status.running ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)') + '; color: white;'
						}, status.running ? '✓ Running' : '✗ Stopped')
					]),

					status.version ? E('div', { 'style': 'color: #94a3b8; margin-top: 0.5em;' }, [
						'Version: ',
						E('code', { 'style': 'color: #8b5cf6; background: #1e293b; padding: 0.25em 0.5em; border-radius: 4px;' }, status.version)
					]) : null,

					status.running && status.pid ? E('div', { 'style': 'color: #94a3b8; margin-top: 0.5em;' }, [
						'Process ID: ',
						E('code', { 'style': 'color: #3b82f6; background: #1e293b; padding: 0.25em 0.5em; border-radius: 4px;' }, status.pid)
					]) : null
				]),

				status.running ? E('div', { 'style': 'background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 8px; padding: 1.5em; margin-top: 1.5em; border: 1px solid #10b981;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em;' }, [
						E('span', { 'style': 'font-size: 1.5em;' }, '✓'),
						E('strong', { 'style': 'color: #d1fae5; font-size: 1.1em;' }, 'Netifyd is installed and running')
					]),
					E('p', { 'style': 'color: #a7f3d0; margin: 0.5em 0 0 2em;' }, 'You can proceed to the next step to configure monitoring.')
				]) : E('div', { 'style': 'background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 8px; padding: 1.5em; margin-top: 1.5em; border: 1px solid #ef4444;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 0.5em; margin-bottom: 0.5em;' }, [
						E('span', { 'style': 'font-size: 1.5em;' }, '⚠️'),
						E('strong', { 'style': 'color: #fecaca; font-size: 1.1em;' }, 'Netifyd is not installed')
					]),
					E('p', { 'style': 'color: #fca5a5; margin: 0.5em 0 0 2em;' }, 'Please proceed to Step 2 to install it.')
				])
			])
		]);
	},

	renderStep2: function(status) {
		return E('div', {
			'id': 'step-2',
			'class': 'wizard-step',
			'style': 'display: ' + (this.currentStep === 2 ? 'block' : 'none') + ';'
		}, [
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '📦'),
					'Step 2: Install Netifyd'
				]),

				E('p', { 'style': 'color: #cbd5e1; font-size: 1.05em; line-height: 1.6;' },
					'Netifyd is a deep packet inspection daemon that provides real-time network intelligence. It detects applications, protocols, and devices on your network.'),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('h3', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '💡'),
						'Installation via SSH'
					]),
					E('p', { 'style': 'color: #94a3b8; margin-bottom: 1em;' }, 'Connect to your router via SSH and run these commands:'),

					E('pre', { 'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b;' },
						'# Update package lists\n' +
						'opkg update\n\n' +
						'# Install netifyd\n' +
						'opkg install netifyd\n\n' +
						'# Enable service at boot\n' +
						'/etc/init.d/netifyd enable\n\n' +
						'# Start the service\n' +
						'/etc/init.d/netifyd start'
					)
				]),

				E('div', { 'style': 'background: linear-gradient(135deg, #1e3a8a, #1e40af); border-radius: 8px; padding: 1.5em; margin-top: 1.5em; border: 1px solid #3b82f6;' }, [
					E('div', { 'style': 'display: flex; align-items: flex-start; gap: 0.75em;' }, [
						E('span', { 'style': 'font-size: 1.3em; flex-shrink: 0;' }, 'ℹ️'),
						E('div', {}, [
							E('strong', { 'style': 'color: #dbeafe; font-size: 1.05em;' }, 'System Requirements'),
							E('ul', { 'style': 'color: #bfdbfe; margin: 0.5em 0; padding-left: 1.5em;' }, [
								E('li', {}, 'OpenWrt 21.02 or later'),
								E('li', {}, 'At least 128MB RAM'),
								E('li', {}, '~5MB storage space'),
								E('li', {}, 'Active network interfaces to monitor')
							])
						])
					])
				])
			])
		]);
	},

	renderStep3: function(status) {
		return E('div', {
			'id': 'step-3',
			'class': 'wizard-step',
			'style': 'display: ' + (this.currentStep === 3 ? 'block' : 'none') + ';'
		}, [
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '⚙️'),
					'Step 3: Configure Monitoring'
				]),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('h3', { 'style': 'color: #f1f5f9; margin-top: 0;' }, 'Configure Monitored Interfaces'),
					E('p', { 'style': 'color: #94a3b8;' }, 'Edit /etc/config/netifyd to specify which interfaces to monitor:'),

					E('pre', { 'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 1em 0;' },
						'config netifyd\n' +
						'    option enabled \'1\'\n' +
						'    list internal_if \'br-lan\'    # LAN bridge\n' +
						'    list internal_if \'wlan0\'      # WiFi\n' +
						'    list external_if \'eth0\'       # WAN interface'
					),

					E('p', { 'style': 'color: #64748b; font-size: 0.95em; font-style: italic;' },
						'💡 Tip: Internal interfaces are monitored for client traffic, external for WAN traffic.')
				]),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('h3', { 'style': 'color: #f1f5f9; margin-top: 0;' }, 'Advanced Configuration (Optional)'),
					E('p', { 'style': 'color: #94a3b8;' }, 'Edit /etc/netifyd.conf for advanced DPI options:'),

					E('pre', { 'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 1em 0;' },
						'# Enable deep packet inspection\n' +
						'enable_dpi=yes\n\n' +
						'# Enable DNS resolution hints\n' +
						'enable_dns_hint=yes\n\n' +
						'# Detection sensitivity (high, medium, low)\n' +
						'detection_sensitivity=high\n\n' +
						'# Flow idle timeout in seconds\n' +
						'flow_idle_timeout=300'
					)
				]),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('h3', { 'style': 'color: #f1f5f9; margin-top: 0;' }, 'Apply Configuration'),
					E('p', { 'style': 'color: #94a3b8;' }, 'After making changes, restart netifyd:'),

					E('pre', { 'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 1em 0;' },
						'/etc/init.d/netifyd restart'
					)
				])
			])
		]);
	},

	renderStep4: function(status) {
		return E('div', {
			'id': 'step-4',
			'class': 'wizard-step',
			'style': 'display: ' + (this.currentStep === 4 ? 'block' : 'none') + ';'
		}, [
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '🎉'),
					'Step 4: Verify & Explore'
				]),

				status.running ? E('div', { 'style': 'background: linear-gradient(135deg, #064e3b, #065f46); border-radius: 8px; padding: 2em; margin: 1.5em 0; border: 1px solid #10b981; text-align: center;' }, [
					E('div', { 'style': 'font-size: 4em; margin-bottom: 0.5em;' }, '✓'),
					E('h3', { 'style': 'color: #d1fae5; margin: 0.5em 0; font-size: 1.5em;' }, 'Setup Complete!'),
					E('p', { 'style': 'color: #a7f3d0; font-size: 1.1em; margin: 1em 0;' },
						'Netifyd is running and monitoring your network traffic.'),

					E('div', { 'style': 'display: flex; gap: 1em; justify-content: center; flex-wrap: wrap; margin-top: 2em;' }, [
						E('div', { 'style': 'background: #0f172a; padding: 1em 1.5em; border-radius: 8px; border: 1px solid #10b981;' }, [
							E('div', { 'style': 'font-size: 2em; color: #10b981;' }, status.interfaces ? status.interfaces.length : 0),
							E('div', { 'style': 'color: #a7f3d0; font-size: 0.9em; margin-top: 0.25em;' }, 'Interfaces')
						]),
						status.version ? E('div', { 'style': 'background: #0f172a; padding: 1em 1.5em; border-radius: 8px; border: 1px solid #10b981;' }, [
							E('div', { 'style': 'font-size: 2em; color: #10b981;' }, status.version),
							E('div', { 'style': 'color: #a7f3d0; font-size: 0.9em; margin-top: 0.25em;' }, 'Version')
						]) : null
					])
				]) : E('div', { 'style': 'background: linear-gradient(135deg, #7f1d1d, #991b1b); border-radius: 8px; padding: 2em; margin: 1.5em 0; border: 1px solid #ef4444; text-align: center;' }, [
					E('div', { 'style': 'font-size: 4em; margin-bottom: 0.5em;' }, '⚠️'),
					E('h3', { 'style': 'color: #fecaca; margin: 0.5em 0; font-size: 1.5em;' }, 'Service Not Running'),
					E('p', { 'style': 'color: #fca5a5; font-size: 1.1em;' },
						'Please complete Steps 2 and 3 to install and start Netifyd.')
				]),

				E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin: 1.5em 0; border: 1px solid #1e293b;' }, [
					E('h3', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
						E('span', {}, '🚀'),
						'Next Steps'
					]),
					E('ul', { 'style': 'color: #cbd5e1; line-height: 1.8; margin: 1em 0;' }, [
						E('li', {}, [
							E('strong', { 'style': 'color: #8b5cf6;' }, 'Overview:'),
							' Real-time statistics and protocol distribution'
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #3b82f6;' }, 'Applications:'),
							' Detected applications with traffic breakdown'
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #06b6d4;' }, 'Devices:'),
							' Network device discovery and identification'
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #10b981;' }, 'Flows:'),
							' Live connection tracking with DPI data'
						]),
						E('li', {}, [
							E('strong', { 'style': 'color: #f59e0b;' }, 'Top Talkers:'),
							' Bandwidth usage by host'
						])
					])
				]),

				E('div', { 'style': 'background: linear-gradient(135deg, #1e3a8a, #1e40af); border-radius: 8px; padding: 1.5em; margin-top: 1.5em; border: 1px solid #3b82f6;' }, [
					E('h3', { 'style': 'color: #dbeafe; margin-top: 0;' }, '📚 Learn More'),
					E('div', { 'style': 'display: grid; gap: 0.75em;' }, [
						E('a', {
							'href': 'https://www.netify.ai/',
							'target': '_blank',
							'style': 'color: #93c5fd; text-decoration: none; display: flex; align-items: center; gap: 0.5em;'
						}, [
							E('span', {}, '🔗'),
							'Official Netify Website'
						]),
						E('a', {
							'href': 'https://www.netify.ai/documentation',
							'target': '_blank',
							'style': 'color: #93c5fd; text-decoration: none; display: flex; align-items: center; gap: 0.5em;'
						}, [
							E('span', {}, '📖'),
							'Netify Documentation'
						]),
						E('a', {
							'href': 'https://gitlab.com/netify.ai/public/netify-daemon',
							'target': '_blank',
							'style': 'color: #93c5fd; text-decoration: none; display: flex; align-items: center; gap: 0.5em;'
						}, [
							E('span', {}, '💻'),
							'Netifyd GitLab Repository'
						])
					])
				])
			])
		]);
	},

	renderNavigation: function() {
		var self = this;

		return E('div', {
			'style': 'display: flex; justify-content: space-between; margin-top: 3em; padding-top: 2em; border-top: 1px solid #334155;'
		}, [
			E('button', {
				'class': 'cbi-button cbi-button-neutral',
				'style': 'padding: 0.75em 2em; font-size: 1em; background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 6px; cursor: pointer; display: ' + (this.currentStep === 1 ? 'none' : 'block') + ';',
				'click': function() {
					if (self.currentStep > 1) {
						self.currentStep--;
						self.updateView();
					}
				}
			}, '← Previous'),

			E('div', { 'style': 'flex: 1;' }),

			this.currentStep < this.totalSteps ? E('button', {
				'class': 'cbi-button cbi-button-action',
				'style': 'padding: 0.75em 2em; font-size: 1em; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold;',
				'click': function() {
					if (self.currentStep < self.totalSteps) {
						self.currentStep++;
						self.updateView();
					}
				}
			}, 'Next →') : E('a', {
				'href': L.url('admin/secubox/security/netifyd/overview'),
				'class': 'cbi-button cbi-button-positive',
				'style': 'padding: 0.75em 2em; font-size: 1em; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;'
			}, 'Go to Dashboard →')
		]);
	},

	updateView: function() {
		// Hide all steps
		for (var i = 1; i <= this.totalSteps; i++) {
			var step = document.getElementById('step-' + i);
			if (step) step.style.display = 'none';
		}

		// Show current step
		var currentStep = document.getElementById('step-' + this.currentStep);
		if (currentStep) currentStep.style.display = 'block';

		// Update progress bar
		var progressFill = document.getElementById('progress-fill');
		if (progressFill) {
			progressFill.style.width = ((this.currentStep - 1) / (this.totalSteps - 1) * 100) + '%';
		}

		// Update step circles
		var circles = document.querySelectorAll('.wizard-step-circle');
		circles.forEach(function(circle, index) {
			var stepNum = index + 1;
			var isActive = stepNum === this.currentStep;
			var isComplete = stepNum < this.currentStep;

			circle.style.borderColor = isComplete ? '#8b5cf6' : isActive ? '#3b82f6' : '#1e293b';
			circle.style.background = isComplete ? '#8b5cf6' : isActive ? '#1e293b' : '#0f172a';
			circle.style.color = isComplete || isActive ? 'white' : '#475569';
			circle.textContent = isComplete ? '✓' : stepNum;
		}.bind(this));

		// Re-render to update navigation buttons
		var container = document.querySelector('.netifyd-wizard-container');
		if (container) {
			var nav = container.querySelector('.netifyd-wizard-container > div:last-child');
			if (nav && nav.style.display === 'flex') {
				var newNav = this.renderNavigation();
				nav.replaceWith(newNav);
			}
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
