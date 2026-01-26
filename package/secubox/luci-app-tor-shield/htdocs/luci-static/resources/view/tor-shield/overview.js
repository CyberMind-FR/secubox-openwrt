'use strict';
'require view';
'require poll';
'require dom';
'require ui';
'require tor-shield/api as api';

return view.extend({
	title: _('Tor Shield'),
	pollInterval: 5,
	pollActive: true,
	currentPreset: 'anonymous',

	load: function() {
		return api.getDashboardData();
	},

	// Handle master toggle
	handleToggle: function(status) {
		var self = this;

		if (status.enabled && status.running) {
			// Disable Tor
			ui.showModal(_('Disable Tor Shield'), [
				E('p', { 'class': 'spinning' }, _('Stopping Tor Shield...'))
			]);

			api.disable().then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Tor Shield disabled. Your traffic is no longer anonymized.')), 'warning');
					self.render();
				} else {
					ui.addNotification(null, E('p', result.error || _('Failed to disable')), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			});
		} else {
			// Enable Tor with selected preset
			ui.showModal(_('Enable Tor Shield'), [
				E('p', { 'class': 'spinning' }, _('Starting Tor Shield with %s preset...').format(self.currentPreset))
			]);

			api.enable(self.currentPreset).then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Tor Shield is starting. Please wait for bootstrap to complete.')), 'info');
				} else {
					ui.addNotification(null, E('p', result.error || _('Failed to enable')), 'error');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			});
		}
	},

	// Handle preset selection
	handlePresetSelect: function(presetId) {
		this.currentPreset = presetId;

		// Update UI
		var presets = document.querySelectorAll('.tor-preset');
		presets.forEach(function(p) {
			p.classList.toggle('active', p.dataset.preset === presetId);
		});
	},

	// Handle new identity request
	handleNewIdentity: function() {
		ui.showModal(_('New Identity'), [
			E('p', { 'class': 'spinning' }, _('Requesting new Tor identity...'))
		]);

		api.newIdentity().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('New identity requested. New circuits will be established shortly.')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to request new identity')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// Handle restart
	handleRestart: function() {
		var self = this;

		ui.showModal(_('Restart Tor Shield'), [
			E('p', { 'class': 'spinning' }, _('Restarting Tor Shield service...'))
		]);

		api.restart().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Tor Shield is restarting. Please wait for bootstrap to complete.')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to restart')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	// Handle leak test
	handleLeakTest: function() {
		var self = this;

		ui.showModal(_('Leak Test'), [
			E('p', { 'class': 'spinning' }, _('Running leak detection tests...'))
		]);

		api.checkLeaks().then(function(result) {
			ui.hideModal();

			var tests = result.tests || [];
			var content = [
				E('h4', {}, _('Leak Test Results'))
			];

			tests.forEach(function(test) {
				content.push(E('div', { 'style': 'margin: 10px 0; padding: 10px; background: ' + (test.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') + '; border-radius: 8px;' }, [
					E('strong', {}, test.name + ': '),
					E('span', { 'style': 'color: ' + (test.passed ? '#10b981' : '#ef4444') }, test.passed ? 'PASSED' : 'FAILED'),
					E('p', { 'style': 'margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;' }, test.message)
				]));
			});

			content.push(E('div', { 'style': 'margin-top: 16px; text-align: center;' }, [
				E('strong', { 'style': 'font-size: 18px; color: ' + (result.protected ? '#10b981' : '#ef4444') },
					result.protected ? 'Your connection is PROTECTED' : 'WARNING: Potential leaks detected')
			]));

			content.push(E('div', { 'class': 'right', 'style': 'margin-top: 16px;' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Close'))
			]));

			ui.showModal(_('Leak Test Results'), content);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Leak test failed: %s').format(err.message || err)), 'error');
		});
	},

	// Update stats without full re-render
	updateStats: function(status, bandwidth) {
		// Update status badge
		var badge = document.querySelector('.tor-status-badge');
		if (badge) {
			badge.className = 'tor-status-badge';
			if (!status.enabled) {
				badge.classList.add('disabled');
				badge.innerHTML = '<span class="tor-status-dot"></span>' + _('Disabled');
			} else if (status.bootstrap < 100) {
				badge.classList.add('connecting');
				badge.innerHTML = '<span class="tor-status-dot"></span>' + _('Connecting %d%%').format(status.bootstrap);
			} else if (status.is_tor) {
				badge.classList.add('protected');
				badge.innerHTML = '<span class="tor-status-dot"></span>' + _('Protected');
			} else {
				badge.classList.add('exposed');
				badge.innerHTML = '<span class="tor-status-dot"></span>' + _('Exposed');
			}
		}

		// Update toggle state
		var toggle = document.querySelector('.tor-master-toggle');
		var toggleLabel = document.querySelector('.tor-toggle-label');
		if (toggle) {
			toggle.classList.toggle('active', status.enabled && status.running);
		}
		if (toggleLabel) {
			toggleLabel.textContent = (status.enabled && status.running) ? _('Protected') : _('Go Anonymous');
			toggleLabel.classList.toggle('active', status.enabled && status.running);
		}

		// Update IP info
		var exitIp = document.querySelector('.tor-exit-ip');
		var realIp = document.querySelector('.tor-real-ip');
		if (exitIp) {
			exitIp.textContent = status.exit_ip || _('Not connected');
			exitIp.className = 'tor-ip-value ' + (status.is_tor ? 'protected' : 'exposed');
		}
		if (realIp) {
			realIp.textContent = status.real_ip || _('Unknown');
		}

		// Update quick stats
		var updates = [
			{ selector: '.tor-stat-circuits', value: status.circuit_count || 0 },
			{ selector: '.tor-stat-bandwidth', value: api.formatRate(bandwidth.read_rate || 0) },
			{ selector: '.tor-stat-uptime', value: api.formatUptime(status.uptime || 0) },
			{ selector: '.tor-stat-read', value: api.formatBytes(bandwidth.read || 0) },
			{ selector: '.tor-stat-written', value: api.formatBytes(bandwidth.written || 0) }
		];

		updates.forEach(function(u) {
			var el = document.querySelector(u.selector);
			if (el && el.textContent !== String(u.value)) {
				el.textContent = u.value;
				el.classList.add('tor-value-updated');
				setTimeout(function() { el.classList.remove('tor-value-updated'); }, 500);
			}
		});

		// Update bootstrap progress if connecting
		var progressBar = document.querySelector('.tor-progress-bar');
		var progressLabel = document.querySelector('.tor-bootstrap-percent');
		if (progressBar && status.enabled && status.bootstrap < 100) {
			progressBar.style.width = status.bootstrap + '%';
		}
		if (progressLabel) {
			progressLabel.textContent = status.bootstrap + '%';
		}
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getDashboardData().then(L.bind(function(data) {
				this.updateStats(data.status || {}, data.bandwidth || {});
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var presets = data.presets || [];
		var bandwidth = data.bandwidth || {};

		var isActive = status.enabled && status.running;
		var isProtected = isActive && status.is_tor;
		var isConnecting = isActive && status.bootstrap < 100;

		var statusClass = 'disabled';
		var statusText = _('Disabled');
		if (isConnecting) {
			statusClass = 'connecting';
			statusText = _('Connecting %d%%').format(status.bootstrap);
		} else if (isProtected) {
			statusClass = 'protected';
			statusText = _('Protected');
		} else if (isActive) {
			statusClass = 'exposed';
			statusText = _('Exposed');
		}

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			// Header
			E('div', { 'class': 'tor-header' }, [
				E('div', { 'class': 'tor-logo' }, [
					E('div', { 'class': 'tor-logo-icon' }, '\uD83E\uDDC5'),
					E('div', { 'class': 'tor-logo-text' }, ['Tor ', E('span', {}, 'Shield')])
				]),
				E('div', { 'class': 'tor-status-badge ' + statusClass }, [
					E('span', { 'class': 'tor-status-dot' }),
					statusText
				])
			]),

			// Auto-refresh control
			E('div', { 'class': 'tor-refresh-control' }, [
				E('span', {}, [
					E('span', { 'class': 'tor-refresh-indicator active' }),
					' ' + _('Auto-refresh: '),
					E('span', { 'class': 'tor-refresh-state' }, _('Active'))
				]),
				E('button', {
					'class': 'tor-btn tor-btn-sm',
					'click': L.bind(function(ev) {
						var btn = ev.target;
						var indicator = document.querySelector('.tor-refresh-indicator');
						var state = document.querySelector('.tor-refresh-state');
						if (this.pollActive) {
							this.stopPolling();
							btn.textContent = _('Resume');
							indicator.classList.remove('active');
							state.textContent = _('Paused');
						} else {
							this.startPolling();
							btn.textContent = _('Pause');
							indicator.classList.add('active');
							state.textContent = _('Active');
						}
					}, this)
				}, _('Pause'))
			]),

			// Hero Section
			E('div', { 'class': 'tor-hero' }, [
				// Master Toggle
				E('div', { 'class': 'tor-toggle-section' }, [
					E('button', {
						'class': 'tor-master-toggle' + (isActive ? ' active' : ''),
						'click': L.bind(function() { this.handleToggle(status); }, this),
						'title': isActive ? _('Click to disable') : _('Click to enable')
					}, '\uD83E\uDDC5'),
					E('div', { 'class': 'tor-toggle-label' + (isActive ? ' active' : '') },
						isActive ? _('Protected') : _('Go Anonymous'))
				]),

				// Protection Info
				E('div', { 'class': 'tor-protection-info' }, [
					E('div', { 'class': 'tor-protection-title' }, _('Your Protection Status')),
					E('div', { 'class': 'tor-ip-info' }, [
						E('div', { 'class': 'tor-ip-item' }, [
							E('div', { 'class': 'tor-ip-label' }, _('Real IP')),
							E('div', { 'class': 'tor-ip-value tor-real-ip' }, status.real_ip || _('Unknown'))
						]),
						E('div', { 'class': 'tor-ip-item' }, [
							E('div', { 'class': 'tor-ip-label' }, _('Tor Exit IP')),
							E('div', {
								'class': 'tor-ip-value tor-exit-ip ' + (isProtected ? 'protected' : 'exposed')
							}, status.exit_ip || _('Not connected')),
							status.exit_ip ? E('div', { 'class': 'tor-exit-location' }, [
								E('span', { 'class': 'tor-exit-country' }, api.getCountryFlag(status.exit_country) || ''),
								status.exit_country || ''
							]) : ''
						])
					]),

					// Bootstrap progress (when connecting)
					isConnecting ? E('div', { 'class': 'tor-bootstrap' }, [
						E('div', { 'class': 'tor-bootstrap-label' }, [
							E('span', {}, _('Bootstrapping...')),
							E('span', { 'class': 'tor-bootstrap-percent' }, status.bootstrap + '%')
						]),
						E('div', { 'class': 'tor-progress' }, [
							E('div', { 'class': 'tor-progress-bar', 'style': 'width: ' + status.bootstrap + '%' })
						])
					]) : ''
				])
			]),

			// Presets
			E('div', { 'class': 'tor-presets' },
				presets.map(function(preset) {
					return E('div', {
						'class': 'tor-preset' + (self.currentPreset === preset.id ? ' active' : ''),
						'data-preset': preset.id,
						'click': L.bind(function() { this.handlePresetSelect(preset.id); }, self)
					}, [
						E('div', { 'class': 'tor-preset-icon' }, api.getPresetIcon(preset.icon)),
						E('div', { 'class': 'tor-preset-name' }, preset.name),
						E('div', { 'class': 'tor-preset-desc' }, preset.description)
					]);
				})
			),

			// Quick Stats
			E('div', { 'class': 'tor-quick-stats' }, [
				E('div', { 'class': 'tor-quick-stat' }, [
					E('div', { 'class': 'tor-quick-stat-icon' }, '\uD83D\uDD04'),
					E('div', { 'class': 'tor-quick-stat-value tor-stat-circuits' }, status.circuit_count || 0),
					E('div', { 'class': 'tor-quick-stat-label' }, _('Circuits'))
				]),
				E('div', { 'class': 'tor-quick-stat' }, [
					E('div', { 'class': 'tor-quick-stat-icon' }, '\uD83D\uDCCA'),
					E('div', { 'class': 'tor-quick-stat-value tor-stat-bandwidth' }, api.formatRate(bandwidth.read_rate || 0)),
					E('div', { 'class': 'tor-quick-stat-label' }, _('Bandwidth'))
				]),
				E('div', { 'class': 'tor-quick-stat' }, [
					E('div', { 'class': 'tor-quick-stat-icon' }, '\u23F1'),
					E('div', { 'class': 'tor-quick-stat-value tor-stat-uptime' }, api.formatUptime(status.uptime || 0)),
					E('div', { 'class': 'tor-quick-stat-label' }, _('Uptime'))
				]),
				E('div', { 'class': 'tor-quick-stat' }, [
					E('div', { 'class': 'tor-quick-stat-icon' }, '\uD83D\uDCE5'),
					E('div', { 'class': 'tor-quick-stat-value tor-stat-read' }, api.formatBytes(bandwidth.read || 0)),
					E('div', { 'class': 'tor-quick-stat-label' }, _('Downloaded'))
				]),
				E('div', { 'class': 'tor-quick-stat' }, [
					E('div', { 'class': 'tor-quick-stat-icon' }, '\uD83D\uDCE4'),
					E('div', { 'class': 'tor-quick-stat-value tor-stat-written' }, api.formatBytes(bandwidth.written || 0)),
					E('div', { 'class': 'tor-quick-stat-label' }, _('Uploaded'))
				])
			]),

			// Health Status Minicard
			E('div', { 'class': 'tor-health-card', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;' }, [
				E('div', { 'class': 'tor-health-item', 'style': 'display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--tor-bg-card, #1a1a24); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);' }, [
					E('div', {
						'class': 'tor-health-indicator',
						'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + (isProtected ? '#10b981' : isConnecting ? '#f59e0b' : '#6b7280') + '; box-shadow: 0 0 8px ' + (isProtected ? '#10b981' : isConnecting ? '#f59e0b' : 'transparent') + ';'
					}),
					E('div', {}, [
						E('div', { 'style': 'font-size: 14px; font-weight: 600; color: var(--tor-text, #fff);' }, _('Service')),
						E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted, #a0a0b0);' },
							status.running ? _('Running') : _('Stopped'))
					])
				]),
				E('div', { 'class': 'tor-health-item', 'style': 'display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--tor-bg-card, #1a1a24); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);' }, [
					E('div', {
						'class': 'tor-health-indicator',
						'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + (status.bootstrap >= 100 ? '#10b981' : status.bootstrap > 0 ? '#f59e0b' : '#6b7280') + '; box-shadow: 0 0 8px ' + (status.bootstrap >= 100 ? '#10b981' : status.bootstrap > 0 ? '#f59e0b' : 'transparent') + ';'
					}),
					E('div', {}, [
						E('div', { 'style': 'font-size: 14px; font-weight: 600; color: var(--tor-text, #fff);' }, _('Bootstrap')),
						E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted, #a0a0b0);' },
							status.bootstrap >= 100 ? _('Complete') : status.bootstrap + '%')
					])
				]),
				E('div', { 'class': 'tor-health-item', 'style': 'display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--tor-bg-card, #1a1a24); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);' }, [
					E('div', {
						'class': 'tor-health-indicator',
						'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + (status.dns_over_tor ? '#10b981' : '#f59e0b') + '; box-shadow: 0 0 8px ' + (status.dns_over_tor ? '#10b981' : '#f59e0b') + ';'
					}),
					E('div', {}, [
						E('div', { 'style': 'font-size: 14px; font-weight: 600; color: var(--tor-text, #fff);' }, _('DNS')),
						E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted, #a0a0b0);' },
							status.dns_over_tor ? _('Protected') : _('Exposed'))
					])
				]),
				E('div', { 'class': 'tor-health-item', 'style': 'display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--tor-bg-card, #1a1a24); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);' }, [
					E('div', {
						'class': 'tor-health-indicator',
						'style': 'width: 12px; height: 12px; border-radius: 50%; background: ' + (status.kill_switch ? '#10b981' : '#6b7280') + '; box-shadow: 0 0 8px ' + (status.kill_switch ? '#10b981' : 'transparent') + ';'
					}),
					E('div', {}, [
						E('div', { 'style': 'font-size: 14px; font-weight: 600; color: var(--tor-text, #fff);' }, _('Kill Switch')),
						E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted, #a0a0b0);' },
							status.kill_switch ? _('Active') : _('Disabled'))
					])
				])
			]),

			// Actions Card
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u26A1'),
						_('Quick Actions')
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('div', { 'style': 'display: flex; gap: 12px; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'tor-btn tor-btn-primary',
							'click': L.bind(this.handleNewIdentity, this),
							'disabled': !isActive
						}, ['\uD83D\uDD04 ', _('New Identity')]),
						E('button', {
							'class': 'tor-btn',
							'click': L.bind(this.handleLeakTest, this),
							'disabled': !isActive
						}, ['\uD83D\uDD0D ', _('Leak Test')]),
						E('button', {
							'class': 'tor-btn tor-btn-warning',
							'click': L.bind(this.handleRestart, this),
							'disabled': !status.enabled
						}, ['\u21BB ', _('Restart')]),
						E('a', {
							'class': 'tor-btn',
							'href': L.url('admin', 'services', 'tor-shield', 'circuits')
						}, ['\uD83D\uDDFA ', _('View Circuits')]),
						E('a', {
							'class': 'tor-btn',
							'href': L.url('admin', 'services', 'tor-shield', 'hidden-services')
						}, ['\uD83E\uDDC5 ', _('Hidden Services')]),
						E('a', {
							'class': 'tor-btn',
							'href': L.url('admin', 'services', 'tor-shield', 'settings')
						}, ['\u2699 ', _('Settings')])
					])
				])
			]),

			// Configuration Info
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u2139'),
						_('Current Configuration')
					]),
					E('div', { 'class': 'tor-card-badge' }, status.mode || 'transparent')
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted); text-transform: uppercase;' }, _('Mode')),
							E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.mode === 'transparent' ? _('Transparent Proxy') : _('SOCKS Proxy'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted); text-transform: uppercase;' }, _('DNS over Tor')),
							E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.dns_over_tor ? _('Enabled') : _('Disabled'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted); text-transform: uppercase;' }, _('Kill Switch')),
							E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.kill_switch ? _('Enabled') : _('Disabled'))
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted); text-transform: uppercase;' }, _('Bridges')),
							E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.bridges_enabled ? status.bridge_type : _('Not used'))
						])
					])
				])
			])
		]);

		// Start auto-refresh
		this.startPolling();

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
