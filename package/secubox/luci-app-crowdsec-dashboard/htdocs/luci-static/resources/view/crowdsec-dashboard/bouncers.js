'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getBouncers(),
			API.getStatus(),
			API.getFirewallBouncerStatus(),
			API.getNftablesStats()
		]);
	},

	render: function(data) {
		var bouncers = data[0] || [];
		var status = data[1] || {};
		var fwStatus = data[2] || {};
		var nftStats = data[3] || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('CrowdSec Bouncers')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Bouncers are components that enforce CrowdSec decisions by blocking malicious IPs at various points (firewall, web server, etc.).')),

			// Status Card
			E('div', { 'class': 'cbi-section', 'style': 'background: ' + (status.crowdsec === 'running' ? '#d4edda' : '#f8d7da') + '; border-left: 4px solid ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + '; padding: 1em; margin-bottom: 1.5em;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('div', {}, [
						E('strong', {}, _('CrowdSec Status:')),
						' ',
						E('span', { 'class': 'badge', 'style': 'background: ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px; margin-left: 0.5em;' },
							status.crowdsec === 'running' ? _('RUNNING') : _('STOPPED'))
					]),
					E('div', {}, [
						E('strong', {}, _('Active Bouncers:')),
						' ',
						E('span', { 'style': 'font-size: 1.3em; color: #0088cc; font-weight: bold; margin-left: 0.5em;' },
							bouncers.length.toString())
					])
				])
			]),

			// Firewall Bouncer Management Card
			this.renderFirewallBouncerCard(fwStatus, nftStats),

			// Bouncers Table
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
					E('h3', { 'style': 'margin: 0;' }, _('Registered Bouncers')),
					E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'click': L.bind(this.openRegisterWizard, this)
						}, _('➕ Register Bouncer')),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': L.bind(this.handleRefresh, this)
						}, _('Refresh'))
					])
				]),

				E('div', { 'class': 'table-wrapper' }, [
					E('table', { 'class': 'table', 'id': 'bouncers-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Name')),
								E('th', {}, _('IP Address')),
								E('th', {}, _('Type')),
								E('th', {}, _('Version')),
								E('th', {}, _('Last Pull')),
								E('th', {}, _('Status')),
								E('th', {}, _('Authentication')),
								E('th', {}, _('Actions'))
							])
						]),
						E('tbody', { 'id': 'bouncers-tbody' },
							this.renderBouncerRows(bouncers)
						)
					])
				])
			]),

			// Help Section
			E('div', { 'class': 'cbi-section', 'style': 'background: #e8f4f8; padding: 1em; margin-top: 2em;' }, [
				E('h3', {}, _('About Bouncers')),
				E('p', {}, _('Bouncers are remediation components that connect to the CrowdSec Local API to fetch decisions and apply them on your infrastructure.')),
				E('div', { 'style': 'margin-top: 1em;' }, [
					E('strong', {}, _('Common Bouncer Types:')),
					E('ul', { 'style': 'margin-top: 0.5em;' }, [
						E('li', {}, [
							E('strong', {}, 'cs-firewall-bouncer:'),
							' ',
							_('Manages iptables/nftables rules to block IPs at the firewall level')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-nginx-bouncer:'),
							' ',
							_('Blocks IPs directly in Nginx web server')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-haproxy-bouncer:'),
							' ',
							_('Integrates with HAProxy load balancer')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-cloudflare-bouncer:'),
							' ',
							_('Pushes decisions to Cloudflare firewall')
						])
					])
				]),
				E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
					E('strong', {}, _('Note:')),
					' ',
					_('To register a new bouncer, use the command: '),
					E('code', {}, 'cscli bouncers add <bouncer-name>')
				])
			])
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return Promise.all([
				API.getBouncers(),
				API.getFirewallBouncerStatus(),
				API.getNftablesStats()
			]).then(L.bind(function(refreshData) {
				// Update bouncer table
				var tbody = document.getElementById('bouncers-tbody');
				if (tbody) {
					dom.content(tbody, this.renderBouncerRows(refreshData[0] || []));
				}

				// Update firewall bouncer status
				var fwStatus = refreshData[1] || {};
				var nftStats = refreshData[2] || {};

				var statusBadge = document.getElementById('fw-bouncer-status');
				if (statusBadge) {
					var running = fwStatus.running || false;
					statusBadge.textContent = running ? _('ACTIVE') : _('STOPPED');
					statusBadge.style.background = running ? '#28a745' : '#dc3545';
				}

				var enabledBadge = document.getElementById('fw-bouncer-enabled');
				if (enabledBadge) {
					var enabled = fwStatus.enabled || false;
					enabledBadge.textContent = enabled ? _('ENABLED') : _('DISABLED');
					enabledBadge.style.background = enabled ? '#17a2b8' : '#6c757d';
				}

				var ipv4Count = document.getElementById('fw-bouncer-ipv4-count');
				if (ipv4Count) {
					ipv4Count.textContent = (fwStatus.blocked_ipv4 || 0).toString();
				}

				var ipv6Count = document.getElementById('fw-bouncer-ipv6-count');
				if (ipv6Count) {
					ipv6Count.textContent = (fwStatus.blocked_ipv6 || 0).toString();
				}
			}, this));
		}, this), 10);

		return view;
	},

	renderBouncerRows: function(bouncers) {
		if (!bouncers || bouncers.length === 0) {
			return E('tr', {}, [
				E('td', { 'colspan': 8, 'style': 'text-align: center; padding: 2em; color: #999;' },
					_('No bouncers registered. Click "Register Bouncer" to add one.'))
			]);
		}

		return bouncers.map(L.bind(function(bouncer) {
			var lastPull = bouncer.last_pull || bouncer.lastPull || 'Never';
			var isRecent = this.isRecentPull(lastPull);
			var bouncerName = bouncer.name || 'Unknown';

			return E('tr', {
				'style': isRecent ? '' : 'opacity: 0.6;'
			}, [
				E('td', {}, [
					E('strong', {}, bouncerName)
				]),
				E('td', {}, [
					E('code', { 'style': 'font-size: 0.9em;' }, bouncer.ip_address || bouncer.ipAddress || 'N/A')
				]),
				E('td', {}, bouncer.type || 'Unknown'),
				E('td', {}, bouncer.version || 'N/A'),
				E('td', {}, this.formatLastPull(lastPull)),
				E('td', {}, [
					E('span', {
						'class': 'badge',
						'style': 'background: ' + (isRecent ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
					}, isRecent ? _('Active') : _('Inactive'))
				]),
				E('td', {}, [
					E('span', {
						'class': 'badge',
						'style': 'background: ' + (bouncer.revoked ? '#dc3545' : '#28a745') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
					}, bouncer.revoked ? _('Revoked') : _('Valid'))
				]),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'click': L.bind(this.handleDeleteBouncer, this, bouncerName)
					}, _('Delete'))
				])
			]);
		}, this));
	},

	formatLastPull: function(lastPull) {
		if (!lastPull || lastPull === 'Never' || lastPull === 'never') {
			return E('span', { 'style': 'color: #999;' }, _('Never'));
		}

		try {
			var pullDate = new Date(lastPull);
			var now = new Date();
			var diffMinutes = Math.floor((now - pullDate) / 60000);

			if (diffMinutes < 1) return _('Just now');
			if (diffMinutes < 60) return diffMinutes + 'm ago';
			if (diffMinutes < 1440) return Math.floor(diffMinutes / 60) + 'h ago';
			return Math.floor(diffMinutes / 1440) + 'd ago';
		} catch(e) {
			return lastPull;
		}
	},

	isRecentPull: function(lastPull) {
		if (!lastPull || lastPull === 'Never' || lastPull === 'never') {
			return false;
		}

		try {
			var pullDate = new Date(lastPull);
			var now = new Date();
			var diffMinutes = Math.floor((now - pullDate) / 60000);
			// Consider active if pulled within last 5 minutes
			return diffMinutes < 5;
		} catch(e) {
			return false;
		}
	},

	handleRefresh: function() {
		poll.start();

		return Promise.all([
			API.getBouncers(),
			API.getStatus()
		]).then(L.bind(function(data) {
			var tbody = document.getElementById('bouncers-tbody');
			if (tbody) {
				var bouncers = data[0] || [];
				dom.content(tbody, this.renderBouncerRows(bouncers));
			}

			ui.addNotification(null, E('p', _('Bouncer list refreshed')), 'info');
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to refresh: %s').format(err.message || err)), 'error');
		});
	},

	openRegisterWizard: function() {
		var self = this;
		var nameInput;

		ui.showModal(_('Register New Bouncer'), [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-section-descr' },
					_('Register a new bouncer to enforce CrowdSec decisions. The bouncer will receive an API key to connect to the Local API.')),
				E('div', { 'class': 'cbi-value', 'style': 'margin-top: 1em;' }, [
					E('label', { 'class': 'cbi-value-title', 'for': 'bouncer-name-input' },
						_('Bouncer Name')),
					E('div', { 'class': 'cbi-value-field' }, [
						nameInput = E('input', {
							'type': 'text',
							'id': 'bouncer-name-input',
							'class': 'cbi-input-text',
							'placeholder': _('e.g., firewall-bouncer-1'),
							'style': 'width: 100%;'
						}),
						E('div', { 'class': 'cbi-value-description' },
							_('Choose a descriptive name (lowercase, hyphens allowed)'))
					])
				]),
				E('div', { 'class': 'cbi-section', 'style': 'background: #e8f4f8; padding: 1em; margin-top: 1em; border-radius: 4px;' }, [
					E('strong', {}, _('What happens next?')),
					E('ol', { 'style': 'margin: 0.5em 0 0 1.5em; padding: 0;' }, [
						E('li', {}, _('CrowdSec will generate a unique API key for this bouncer')),
						E('li', {}, _('Copy the API key and configure your bouncer with it')),
						E('li', {}, _('The bouncer will start pulling and applying decisions'))
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-positive',
					'click': function() {
						var bouncerName = nameInput.value.trim();

						if (!bouncerName) {
							ui.addNotification(null, E('p', _('Please enter a bouncer name')), 'error');
							return;
						}

						// Validate name (alphanumeric, hyphens, underscores)
						if (!/^[a-z0-9_-]+$/i.test(bouncerName)) {
							ui.addNotification(null, E('p', _('Bouncer name can only contain letters, numbers, hyphens and underscores')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Registering Bouncer...'), [
							E('p', {}, _('Creating bouncer: %s').format(bouncerName)),
							E('div', { 'class': 'spinning' })
						]);

						API.registerBouncer(bouncerName).then(function(result) {
							ui.hideModal();

							if (result && result.success && result.api_key) {
								// Show API key in a modal
								ui.showModal(_('Bouncer Registered Successfully'), [
									E('div', { 'class': 'cbi-section' }, [
										E('p', { 'style': 'color: #28a745; font-weight: bold;' },
											_('✓ Bouncer "%s" has been registered!').format(bouncerName)),
										E('div', { 'class': 'cbi-value', 'style': 'margin-top: 1em;' }, [
											E('label', { 'class': 'cbi-value-title' }, _('API Key')),
											E('div', { 'class': 'cbi-value-field' }, [
												E('code', {
													'id': 'api-key-display',
													'style': 'display: block; padding: 0.75em; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; word-break: break-all; font-size: 0.9em;'
												}, result.api_key),
												E('button', {
													'class': 'cbi-button cbi-button-action',
													'style': 'margin-top: 0.5em;',
													'click': function() {
														navigator.clipboard.writeText(result.api_key).then(function() {
															ui.addNotification(null, E('p', _('API key copied to clipboard')), 'info');
														}).catch(function() {
															ui.addNotification(null, E('p', _('Failed to copy. Please select and copy manually.')), 'error');
														});
													}
												}, _('📋 Copy to Clipboard'))
											])
										]),
										E('div', { 'class': 'cbi-section', 'style': 'background: #fff3cd; padding: 1em; margin-top: 1em; border-radius: 4px;' }, [
											E('strong', { 'style': 'color: #856404;' }, _('⚠️ Important:')),
											E('p', { 'style': 'margin: 0.5em 0 0 0; color: #856404;' },
												_('Save this API key now! It will not be shown again. Use it to configure your bouncer.'))
										])
									]),
									E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
										E('button', {
											'class': 'btn',
											'click': function() {
												ui.hideModal();
												self.handleRefresh();
											}
										}, _('Close'))
									])
								]);
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to register bouncer')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', err.message || err), 'error');
						});
					}
				}, _('Register'))
			])
		]);

		// Focus the input field
		setTimeout(function() {
			if (nameInput) nameInput.focus();
		}, 100);
	},

	handleDeleteBouncer: function(bouncerName) {
		var self = this;

		ui.showModal(_('Delete Bouncer'), [
			E('p', {}, _('Are you sure you want to delete bouncer "%s"?').format(bouncerName)),
			E('p', { 'style': 'color: #dc3545; font-weight: bold;' },
				_('⚠️ This action cannot be undone. The bouncer will no longer be able to connect to the Local API.')),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Deleting Bouncer...'), [
							E('p', {}, _('Removing bouncer: %s').format(bouncerName)),
							E('div', { 'class': 'spinning' })
						]);

						API.deleteBouncer(bouncerName).then(function(result) {
							ui.hideModal();
							if (result && result.success) {
								ui.addNotification(null, E('p', _('Bouncer "%s" deleted successfully').format(bouncerName)), 'info');
								self.handleRefresh();
							} else {
								ui.addNotification(null, E('p', result.error || _('Failed to delete bouncer')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', err.message || err), 'error');
						});
					}
				}, _('Delete'))
			])
		]);
	},

	renderFirewallBouncerCard: function(fwStatus, nftStats) {
		var running = fwStatus.running || false;
		var enabled = fwStatus.enabled || false;
		var configured = fwStatus.configured || false;
		var blockedIPv4 = fwStatus.blocked_ipv4 || 0;
		var blockedIPv6 = fwStatus.blocked_ipv6 || 0;
		var nftIPv4 = fwStatus.nftables_ipv4 || false;
		var nftIPv6 = fwStatus.nftables_ipv6 || false;

		return E('div', { 'class': 'cbi-section', 'id': 'firewall-bouncer-card' }, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
				E('h3', { 'style': 'margin: 0;' }, _('Firewall Bouncer')),
				E('div', { 'style': 'display: flex; gap: 0.5em;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleFirewallBouncerRefresh, this)
					}, _('Refresh'))
				])
			]),

			E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1em; margin-bottom: 1em;' }, [
				// Status Card
				E('div', { 'style': 'background: ' + (running ? '#d4edda' : '#f8d7da') + '; border-left: 4px solid ' + (running ? '#28a745' : '#dc3545') + '; padding: 1em; border-radius: 4px;' }, [
					E('div', { 'style': 'font-weight: bold; margin-bottom: 0.5em; color: #333;' }, _('Service Status')),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, _('Running:')),
						E('span', {
							'class': 'badge',
							'id': 'fw-bouncer-status',
							'style': 'background: ' + (running ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
						}, running ? _('ACTIVE') : _('STOPPED'))
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 0.5em;' }, [
						E('span', {}, _('Boot Start:')),
						E('span', {
							'class': 'badge',
							'id': 'fw-bouncer-enabled',
							'style': 'background: ' + (enabled ? '#17a2b8' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
						}, enabled ? _('ENABLED') : _('DISABLED'))
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 0.5em;' }, [
						E('span', {}, _('Configured:')),
						E('span', {
							'class': 'badge',
							'style': 'background: ' + (configured ? '#28a745' : '#ffc107') + '; color: ' + (configured ? 'white' : '#333') + '; padding: 0.25em 0.6em; border-radius: 3px;'
						}, configured ? _('YES') : _('NO'))
					])
				]),

				// Blocked IPs Card
				E('div', { 'style': 'background: #e8f4f8; border-left: 4px solid #0088cc; padding: 1em; border-radius: 4px;' }, [
					E('div', { 'style': 'font-weight: bold; margin-bottom: 0.5em; color: #333;' }, _('Blocked IPs')),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, _('IPv4:')),
						E('span', {
							'id': 'fw-bouncer-ipv4-count',
							'style': 'font-size: 1.5em; color: #dc3545; font-weight: bold;'
						}, blockedIPv4.toString())
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 0.5em;' }, [
						E('span', {}, _('IPv6:')),
						E('span', {
							'id': 'fw-bouncer-ipv6-count',
							'style': 'font-size: 1.5em; color: #dc3545; font-weight: bold;'
						}, blockedIPv6.toString())
					]),
					E('div', { 'style': 'margin-top: 0.75em; padding-top: 0.75em; border-top: 1px solid #d1e7f0;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'style': 'width: 100%; font-size: 0.9em;',
							'click': L.bind(this.showNftablesDetails, this, nftStats)
						}, _('View Details'))
					])
				]),

				// nftables Status Card
				E('div', { 'style': 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 1em; border-radius: 4px;' }, [
					E('div', { 'style': 'font-weight: bold; margin-bottom: 0.5em; color: #333;' }, _('nftables Status')),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
						E('span', {}, _('IPv4 Table:')),
						E('span', {
							'class': 'badge',
							'style': 'background: ' + (nftIPv4 ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
						}, nftIPv4 ? _('ACTIVE') : _('INACTIVE'))
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-top: 0.5em;' }, [
						E('span', {}, _('IPv6 Table:')),
						E('span', {
							'class': 'badge',
							'style': 'background: ' + (nftIPv6 ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
						}, nftIPv6 ? _('ACTIVE') : _('INACTIVE'))
					])
				])
			]),

			// Control Buttons
			E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
				running ?
					E('button', {
						'class': 'cbi-button cbi-button-negative',
						'click': L.bind(this.handleFirewallBouncerControl, this, 'stop')
					}, _('Stop Service')) :
					E('button', {
						'class': 'cbi-button cbi-button-positive',
						'click': L.bind(this.handleFirewallBouncerControl, this, 'start')
					}, _('Start Service')),
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': L.bind(this.handleFirewallBouncerControl, this, 'restart')
				}, _('Restart')),
				enabled ?
					E('button', {
						'class': 'cbi-button',
						'click': L.bind(this.handleFirewallBouncerControl, this, 'disable')
					}, _('Disable Boot Start')) :
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': L.bind(this.handleFirewallBouncerControl, this, 'enable')
					}, _('Enable Boot Start')),
				E('button', {
					'class': 'cbi-button',
					'click': L.bind(this.showFirewallBouncerConfig, this)
				}, _('Configuration'))
			])
		]);
	},

	handleFirewallBouncerControl: function(action) {
		var actionLabels = {
			'start': _('Starting'),
			'stop': _('Stopping'),
			'restart': _('Restarting'),
			'enable': _('Enabling'),
			'disable': _('Disabling')
		};

		ui.showModal(_('Firewall Bouncer Control'), [
			E('p', {}, _('%s firewall bouncer...').format(actionLabels[action] || action)),
			E('div', { 'class': 'spinning' })
		]);

		return API.controlFirewallBouncer(action).then(L.bind(function(result) {
			ui.hideModal();

			if (result && result.success) {
				ui.addNotification(null, E('p', result.message || _('Operation completed successfully')), 'info');
				this.handleFirewallBouncerRefresh();
			} else {
				ui.addNotification(null, E('p', result.error || _('Operation failed')), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', err.message || err), 'error');
		});
	},

	handleFirewallBouncerRefresh: function() {
		return Promise.all([
			API.getFirewallBouncerStatus(),
			API.getNftablesStats()
		]).then(L.bind(function(data) {
			var fwStatus = data[0] || {};
			var nftStats = data[1] || {};

			// Update status badges
			var statusBadge = document.getElementById('fw-bouncer-status');
			if (statusBadge) {
				var running = fwStatus.running || false;
				statusBadge.textContent = running ? _('ACTIVE') : _('STOPPED');
				statusBadge.style.background = running ? '#28a745' : '#dc3545';
			}

			var enabledBadge = document.getElementById('fw-bouncer-enabled');
			if (enabledBadge) {
				var enabled = fwStatus.enabled || false;
				enabledBadge.textContent = enabled ? _('ENABLED') : _('DISABLED');
				enabledBadge.style.background = enabled ? '#17a2b8' : '#6c757d';
			}

			// Update blocked IP counts
			var ipv4Count = document.getElementById('fw-bouncer-ipv4-count');
			if (ipv4Count) {
				ipv4Count.textContent = (fwStatus.blocked_ipv4 || 0).toString();
			}

			var ipv6Count = document.getElementById('fw-bouncer-ipv6-count');
			if (ipv6Count) {
				ipv6Count.textContent = (fwStatus.blocked_ipv6 || 0).toString();
			}

			// Re-render the entire card to update buttons
			var card = document.getElementById('firewall-bouncer-card');
			if (card) {
				dom.content(card, this.renderFirewallBouncerCard(fwStatus, nftStats).childNodes);
			}

			ui.addNotification(null, E('p', _('Firewall bouncer status refreshed')), 'info');
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to refresh: %s').format(err.message || err)), 'error');
		});
	},

	showNftablesDetails: function(nftStats) {
		var ipv4Blocked = nftStats.ipv4_blocked || [];
		var ipv6Blocked = nftStats.ipv6_blocked || [];
		var ipv4Rules = nftStats.ipv4_rules || 0;
		var ipv6Rules = nftStats.ipv6_rules || 0;

		ui.showModal(_('nftables Blocked IPs'), [
			E('div', { 'class': 'cbi-section' }, [
				E('h4', {}, _('IPv4 Blocked Addresses (%d)').format(ipv4Blocked.length)),
				ipv4Blocked.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 0.5em; border-radius: 4px; margin-bottom: 1em;' },
						ipv4Blocked.map(function(ip) {
							return E('div', { 'style': 'font-family: monospace; padding: 0.25em 0;' }, ip);
						})
					) :
					E('p', { 'style': 'color: #999; margin-bottom: 1em;' }, _('No IPv4 addresses blocked')),

				E('h4', {}, _('IPv6 Blocked Addresses (%d)').format(ipv6Blocked.length)),
				ipv6Blocked.length > 0 ?
					E('div', { 'style': 'max-height: 200px; overflow-y: auto; background: #f5f5f5; padding: 0.5em; border-radius: 4px; margin-bottom: 1em;' },
						ipv6Blocked.map(function(ip) {
							return E('div', { 'style': 'font-family: monospace; padding: 0.25em 0;' }, ip);
						})
					) :
					E('p', { 'style': 'color: #999; margin-bottom: 1em;' }, _('No IPv6 addresses blocked')),

				E('div', { 'style': 'background: #e8f4f8; padding: 1em; border-radius: 4px;' }, [
					E('div', { 'style': 'display: flex; justify-content: space-between; margin-bottom: 0.5em;' }, [
						E('strong', {}, _('IPv4 Rules:')),
						E('span', {}, ipv4Rules.toString())
					]),
					E('div', { 'style': 'display: flex; justify-content: space-between;' }, [
						E('strong', {}, _('IPv6 Rules:')),
						E('span', {}, ipv6Rules.toString())
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);
	},

	showFirewallBouncerConfig: function() {
		ui.showModal(_('Loading Configuration...'), [
			E('div', { 'class': 'spinning' })
		]);

		return API.getFirewallBouncerConfig().then(function(config) {
			if (!config.configured) {
				ui.hideModal();
				ui.showModal(_('Firewall Bouncer Configuration'), [
					E('div', { 'class': 'cbi-section' }, [
						E('p', { 'style': 'color: #ffc107; font-weight: bold;' },
							_('⚠️ Firewall bouncer is not configured yet.')),
						E('p', {},
							_('Please install the secubox-app-crowdsec-bouncer package to configure the firewall bouncer.'))
					]),
					E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
						E('button', {
							'class': 'btn',
							'click': ui.hideModal
						}, _('Close'))
					])
				]);
				return;
			}

			ui.hideModal();
			ui.showModal(_('Firewall Bouncer Configuration'), [
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Enabled')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (config.enabled === '1' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em;'
							}, config.enabled === '1' ? _('YES') : _('NO'))
						])
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('IPv4 Support')),
						E('div', { 'class': 'cbi-value-field' }, config.ipv4 === '1' ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('IPv6 Support')),
						E('div', { 'class': 'cbi-value-field' }, config.ipv6 === '1' ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('API URL')),
						E('div', { 'class': 'cbi-value-field' }, E('code', {}, config.api_url || 'N/A'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Update Frequency')),
						E('div', { 'class': 'cbi-value-field' }, config.update_frequency || 'N/A')
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Deny Action')),
						E('div', { 'class': 'cbi-value-field' }, config.deny_action || 'drop')
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Deny Logging')),
						E('div', { 'class': 'cbi-value-field' }, config.deny_log === '1' ? _('Enabled') : _('Disabled'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Log Prefix')),
						E('div', { 'class': 'cbi-value-field' }, E('code', {}, config.log_prefix || 'N/A'))
					]),
					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Interfaces')),
						E('div', { 'class': 'cbi-value-field' },
							config.interfaces && config.interfaces.length > 0 ?
								config.interfaces.join(', ') :
								_('None configured')
						)
					]),
					E('div', { 'class': 'cbi-section', 'style': 'background: #e8f4f8; padding: 1em; margin-top: 1em; border-radius: 4px;' }, [
						E('p', { 'style': 'margin: 0;' }, [
							E('strong', {}, _('Note:')),
							' ',
							_('To modify these settings, edit /etc/config/crowdsec using UCI commands or the configuration file.')
						])
					])
				]),
				E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
					E('button', {
						'class': 'btn',
						'click': ui.hideModal
					}, _('Close'))
				])
			]);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Failed to load configuration: %s').format(err.message || err)), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
