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
			API.getStatus()
		]);
	},

	render: function(data) {
		var bouncers = data[0] || [];
		var status = data[1] || {};

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
			return API.getBouncers().then(L.bind(function(refreshData) {
				var tbody = document.getElementById('bouncers-tbody');
				if (tbody) {
					dom.content(tbody, this.renderBouncerRows(refreshData || []));
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

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
