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

	// Handle master toggle - fetches fresh status first
	handleToggle: function() {
		var self = this;


		// Show loading while fetching current status
		ui.showModal(_('Please wait...'), [
			E('p', { 'class': 'spinning' }, _('Checking current status...'))
		]);

		// Get fresh status before deciding action
		api.getStatus().then(function(status) {
			ui.hideModal();

			if (status.enabled && status.running) {
				// Disable Tor
				ui.showModal(_('Disable Tor Shield'), [
					E('p', { 'class': 'spinning' }, _('Stopping Tor Shield...'))
				]);

				return api.disable().then(function(result) {
					ui.hideModal();
					if (result.success) {
						ui.addNotification(null, E('p', _('Tor Shield disabled. Your traffic is no longer anonymized.')), 'warning');
						setTimeout(function() { window.location.reload(); }, 1000);
					} else {
						ui.addNotification(null, E('p', result.error || _('Failed to disable')), 'error');
					}
				}).catch(function(err) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Disable error: %s').format(err.message || String(err))), 'error');
				});
			} else {
				// Enable Tor with selected preset
				ui.showModal(_('Enable Tor Shield'), [
					E('p', { 'class': 'spinning' }, _('Starting Tor Shield with %s preset...').format(self.currentPreset))
				]);

				return api.enable(self.currentPreset).then(function(result) {
					ui.hideModal();
					if (result.success) {
						ui.addNotification(null, E('p', _('Tor Shield is starting. Please wait for bootstrap to complete.')), 'info');
						setTimeout(function() { window.location.reload(); }, 1000);
					} else {
						ui.addNotification(null, E('p', result.error || _('Failed to enable')), 'error');
					}
				}).catch(function(err) {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Enable error: %s').format(err.message || String(err))), 'error');
				});
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Status error: %s').format(err.message || String(err))), 'error');
		});
	},

	// Handle preset selection - immediately activates the preset
	handlePresetSelect: function(presetId) {
		var self = this;
		this.currentPreset = presetId;

		// Update UI immediately
		var presets = document.querySelectorAll('.tor-preset');
		presets.forEach(function(p) {
			p.classList.toggle('active', p.dataset.preset === presetId);
		});

		// Enable/restart with selected preset
		ui.showModal(_('Applying Preset'), [
			E('p', { 'class': 'spinning' }, _('Activating %s preset...').format(presetId))
		]);

		api.enable(presetId).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Preset %s activated').format(presetId)), 'info');
				setTimeout(function() { window.location.reload(); }, 1000);
			} else {
				ui.addNotification(null, E('p', result.error || _('Failed to apply preset')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || String(err))), 'error');
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
		var statusEmoji = '\u{26AA}';
		if (isConnecting) {
			statusClass = 'connecting';
			statusText = _('Connecting %d%%').format(status.bootstrap);
			statusEmoji = '\u{1F7E1}';
		} else if (isProtected) {
			statusClass = 'protected';
			statusText = _('Protected');
			statusEmoji = '\u{1F7E2}';
		} else if (isActive) {
			statusClass = 'exposed';
			statusText = _('Exposed');
			statusEmoji = '\u{1F534}';
		}

		var view = E('div', { 'class': 'tor-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('tor-shield/dashboard.css') }),

			// Master Protection Switch - Always visible at top
			E('div', {
				'class': 'tor-master-switch',
				'style': 'background: ' + (isActive ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)') + '; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;'
			}, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('div', { 'style': 'font-size: 48px;' }, isActive ? '\u{1F6E1}\uFE0F' : '\u{26A0}\uFE0F'),
					E('div', {}, [
						E('div', { 'style': 'font-size: 24px; font-weight: bold; color: #fff;' },
							isActive ? _('Tor Protection ACTIVE') : _('Tor Protection DISABLED')),
						E('div', { 'style': 'font-size: 14px; color: rgba(255,255,255,0.9);' },
							isActive ?
								_('All network traffic is being routed through Tor') :
								_('Your traffic is NOT anonymized - your real IP is exposed'))
					])
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('span', { 'style': 'font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500;' },
						isActive ? _('Protected') : _('Exposed')),
					E('label', {
						'class': 'tor-switch',
						'style': 'position: relative; display: inline-block; width: 64px; height: 34px; cursor: pointer;'
					}, [
						E('input', {
							'type': 'checkbox',
							'checked': isActive ? 'checked' : null,
							'style': 'opacity: 0; width: 0; height: 0;',
							'change': L.bind(this.handleToggle, this)
						}),
						E('span', {
							'style': 'position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ' + (isActive ? '#fff' : 'rgba(255,255,255,0.3)') + '; transition: 0.3s; border-radius: 34px;'
						}, [
							E('span', {
								'style': 'position: absolute; content: ""; height: 26px; width: 26px; left: ' + (isActive ? '34px' : '4px') + '; bottom: 4px; background-color: ' + (isActive ? '#10b981' : '#fff') + '; transition: 0.3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);'
							})
						])
					])
				])
			]),

			// Wizard Welcome Banner (shown when disabled)
			!isActive ? E('div', { 'class': 'tor-wizard-banner', 'style': 'background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; color: #fff; text-align: center;' }, [
				E('div', { 'style': 'font-size: 48px; margin-bottom: 12px;' }, '\u{1F9D9}\u200D\u2642\uFE0F'),
				E('h2', { 'style': 'margin: 0 0 8px 0; font-size: 24px;' }, '\u{2728} ' + _('Welcome to Tor Shield') + ' \u{2728}'),
				E('p', { 'style': 'margin: 0 0 16px 0; opacity: 0.9; font-size: 14px;' }, _('Your gateway to anonymous browsing. Choose a protection level below to get started.')),
				E('div', { 'style': 'display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 16px;' }, [
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 32px;' }, '\u{1F512}'),
						E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, _('Encrypted'))
					]),
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 32px;' }, '\u{1F310}'),
						E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, _('Anonymous'))
					]),
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 32px;' }, '\u{1F6E1}'),
						E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, _('Protected'))
					]),
					E('div', { 'style': 'text-align: center;' }, [
						E('div', { 'style': 'font-size: 32px;' }, '\u{1F30D}'),
						E('div', { 'style': 'font-size: 12px; opacity: 0.8;' }, _('Worldwide'))
					])
				])
			]) : '',

			// Header
			E('div', { 'class': 'tor-header' }, [
				E('div', { 'class': 'tor-logo' }, [
					E('div', { 'class': 'tor-logo-icon' }, '\uD83E\uDDC5'),
					E('div', { 'class': 'tor-logo-text' }, ['Tor ', E('span', {}, 'Shield')])
				]),
				E('div', { 'class': 'tor-status-badge ' + statusClass }, [
					E('span', { 'style': 'margin-right: 6px;' }, statusEmoji),
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
						'click': L.bind(this.handleToggle, this),
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

			// Presets - Wizard Style
			E('div', { 'class': 'tor-presets-wizard', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'text-align: center; margin-bottom: 16px;' }, [
					E('span', { 'style': 'font-size: 20px;' }, '\u{1F9D9}\u200D\u2642\uFE0F'),
					E('span', { 'style': 'font-weight: 600; margin-left: 8px;' }, _('Choose Your Protection Level'))
				]),
				E('div', { 'class': 'tor-presets', 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;' },
					[
						{ id: 'anonymous', name: _('Full Anonymity'), icon: '\u{1F6E1}', emoji: '\u{1F9D9}', desc: _('All traffic through Tor'), features: ['\u{2705} ' + _('Kill Switch'), '\u{2705} ' + _('DNS Protection'), '\u{2705} ' + _('Full Routing')] },
						{ id: 'selective', name: _('Selective Apps'), icon: '\u{1F3AF}', emoji: '\u{1F50D}', desc: _('SOCKS proxy mode'), features: ['\u{26AA} ' + _('No Kill Switch'), '\u{26AA} ' + _('Manual Config'), '\u{2705} ' + _('App Control')] },
						{ id: 'censored', name: _('Bypass Censorship'), icon: '\u{1F513}', emoji: '\u{1F30D}', desc: _('Bridge connections'), features: ['\u{2705} ' + _('obfs4 Bridges'), '\u{2705} ' + _('Anti-Censorship'), '\u{2705} ' + _('Stealth Mode')] }
					].map(function(preset) {
						var isSelected = self.currentPreset === preset.id;
						return E('div', {
							'class': 'tor-preset' + (isSelected ? ' active' : ''),
							'data-preset': preset.id,
							'style': 'background: var(--tor-bg-card, #1a1a24); border-radius: 12px; padding: 16px; cursor: pointer; border: 2px solid ' + (isSelected ? '#7c3aed' : 'transparent') + '; transition: all 0.2s;',
							'click': L.bind(function() { this.handlePresetSelect(preset.id); }, self)
						}, [
							E('div', { 'style': 'text-align: center; margin-bottom: 8px;' }, [
								E('span', { 'style': 'font-size: 32px;' }, preset.emoji),
								isSelected ? E('span', { 'style': 'position: absolute; margin-left: -8px; font-size: 14px;' }, '\u{2714}\uFE0F') : ''
							]),
							E('div', { 'style': 'font-weight: 600; text-align: center; margin-bottom: 4px;' }, preset.name),
							E('div', { 'style': 'font-size: 11px; color: var(--tor-text-muted, #a0a0b0); text-align: center; margin-bottom: 8px;' }, preset.desc),
							E('div', { 'style': 'font-size: 10px; color: var(--tor-text-muted, #a0a0b0);' },
								preset.features.map(function(f) {
									return E('div', { 'style': 'margin: 2px 0;' }, f);
								})
							)
						]);
					})
				)
			]),

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

			// Actions Card - Enhanced Wizard Style
			E('div', { 'class': 'tor-card' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u{26A1}'),
						_('Quick Actions')
					]),
					E('span', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, '\u{1F9D9} ' + _('Wizard Tools'))
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;' }, [
						E('button', {
							'class': 'tor-btn tor-btn-primary',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px;',
							'click': L.bind(this.handleNewIdentity, this),
							'disabled': !isActive
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F504}'),
							E('span', {}, _('New Identity'))
						]),
						E('button', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px;',
							'click': L.bind(this.handleLeakTest, this),
							'disabled': !isActive
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F50D}'),
							E('span', {}, _('Leak Test'))
						]),
						E('button', {
							'class': 'tor-btn tor-btn-warning',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px;',
							'click': L.bind(this.handleRestart, this)
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F504}'),
							E('span', {}, _('Restart'))
						]),
						E('a', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; text-decoration: none;',
							'href': L.url('admin', 'services', 'tor-shield', 'circuits')
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F5FA}'),
							E('span', {}, _('Circuits'))
						]),
						E('a', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; text-decoration: none;',
							'href': L.url('admin', 'services', 'tor-shield', 'hidden-services')
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F9C5}'),
							E('span', {}, _('.onion Sites'))
						]),
						E('a', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; text-decoration: none;',
							'href': L.url('admin', 'services', 'tor-shield', 'bridges')
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F309}'),
							E('span', {}, _('Bridges'))
						]),
						E('a', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; text-decoration: none;',
							'href': L.url('admin', 'services', 'tor-shield', 'settings')
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{2699}\uFE0F'),
							E('span', {}, _('Settings'))
						]),
						E('a', {
							'class': 'tor-btn',
							'style': 'display: flex; flex-direction: column; align-items: center; padding: 16px; border-radius: 12px; text-decoration: none; background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);',
							'href': L.url('admin', 'services', 'network-tweaks')
						}, [
							E('span', { 'style': 'font-size: 24px; margin-bottom: 4px;' }, '\u{1F310}'),
							E('span', {}, _('DNS & Proxy'))
						])
					])
				])
			]),

			// Features Guide Card
			E('div', { 'class': 'tor-card', 'style': 'background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);' }, [
				E('div', { 'class': 'tor-card-header' }, [
					E('div', { 'class': 'tor-card-title' }, [
						E('span', { 'class': 'tor-card-title-icon' }, '\u{1F4D6}'),
						_('How Tor Shield Works')
					])
				]),
				E('div', { 'class': 'tor-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'text-align: center; padding: 12px;' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '\u{1F512}'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, _('Encrypted')),
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('3 layers of encryption protect your data'))
						]),
						E('div', { 'style': 'text-align: center; padding: 12px;' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '\u{1F465}'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, _('Anonymous')),
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Your real IP is hidden from websites'))
						]),
						E('div', { 'style': 'text-align: center; padding: 12px;' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '\u{1F310}'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, _('Decentralized')),
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Traffic routed through volunteer relays'))
						]),
						E('div', { 'style': 'text-align: center; padding: 12px;' }, [
							E('div', { 'style': 'font-size: 32px; margin-bottom: 8px;' }, '\u{1F6E1}'),
							E('div', { 'style': 'font-weight: 600; margin-bottom: 4px;' }, _('Kill Switch')),
							E('div', { 'style': 'font-size: 12px; color: var(--tor-text-muted);' }, _('Blocks traffic if Tor disconnects'))
						])
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
