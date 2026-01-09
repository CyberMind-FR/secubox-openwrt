'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require crowdsec-dashboard/api as API';
'require crowdsec-dashboard/nav as CsNav';

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getMachines(),
			API.getHub(),
			API.getCollections()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var machinesData = data[1] || {};
		var machines = Array.isArray(machinesData) ? machinesData : (machinesData.machines || []);
		var hub = data[2] || {};
		var collectionsData = data[3] || {};
		var collections = collectionsData.collections || [];
		if (collections.collections) collections = collections.collections;

		// Load CSS
		var head = document.head || document.getElementsByTagName('head')[0];
		var cssLink = E('link', {
			'rel': 'stylesheet',
			'href': L.resource('crowdsec-dashboard/dashboard.css')
		});
		head.appendChild(cssLink);

		var view = E('div', { 'class': 'crowdsec-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			CsNav.renderTabs('settings'),
			E('h2', { 'class': 'cs-page-title' }, _('CrowdSec Settings')),
			E('p', { 'style': 'color: var(--cs-text-secondary); margin-bottom: 1.5rem;' },
				_('Configure and manage your CrowdSec installation, machines, and collections.')),

			// Service Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Status')),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1em; margin-top: 1em;' }, [
					// CrowdSec Status
					E('div', { 'class': 'cbi-value', 'style': 'background: ' + (status.crowdsec === 'running' ? '#d4edda' : '#f8d7da') + '; padding: 1em; border-radius: 4px; border-left: 4px solid ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + ';' }, [
						E('label', { 'class': 'cbi-value-title' }, _('CrowdSec Agent')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.5em 1em; border-radius: 4px; font-size: 1em;'
							}, status.crowdsec === 'running' ? _('RUNNING') : _('STOPPED'))
						])
					]),

					// LAPI Status
					E('div', { 'class': 'cbi-value', 'style': 'background: ' + (status.lapi_status === 'available' ? '#d4edda' : '#f8d7da') + '; padding: 1em; border-radius: 4px; border-left: 4px solid ' + (status.lapi_status === 'available' ? '#28a745' : '#dc3545') + ';' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Local API (LAPI)')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (status.lapi_status === 'available' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.5em 1em; border-radius: 4px; font-size: 1em;'
							}, status.lapi_status === 'available' ? _('AVAILABLE') : _('UNAVAILABLE'))
						])
					]),

					// Version Info
					E('div', { 'class': 'cbi-value', 'style': 'background: #e8f4f8; padding: 1em; border-radius: 4px; border-left: 4px solid #0088cc;' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Version')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('code', { 'style': 'font-size: 1em;' }, status.version || 'Unknown')
						])
					])
				])
			]),

			// Registered Machines
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Registered Machines')),
				E('p', { 'style': 'color: #666;' },
					_('Machines are CrowdSec agents that send alerts to the Local API.')),

				E('div', { 'class': 'table-wrapper', 'style': 'margin-top: 1em;' }, [
					E('table', { 'class': 'table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Machine ID')),
								E('th', {}, _('IP Address')),
								E('th', {}, _('Last Update')),
								E('th', {}, _('Version')),
								E('th', {}, _('Status'))
							])
						]),
						E('tbody', {},
							machines.length > 0 ?
								machines.map(function(machine) {
									var isActive = machine.isValidated || machine.is_validated;
									return E('tr', {}, [
										E('td', {}, [
											E('strong', {}, machine.machineId || machine.machine_id || 'Unknown')
										]),
										E('td', {}, [
											E('code', {}, machine.ipAddress || machine.ip_address || 'N/A')
										]),
										E('td', {}, API.formatDate(machine.updated_at || machine.updatedAt)),
										E('td', {}, machine.version || 'N/A'),
										E('td', {}, [
											E('span', {
												'class': 'badge',
												'style': 'background: ' + (isActive ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
											}, isActive ? _('Active') : _('Pending'))
										])
									]);
								}) :
								E('tr', {}, [
									E('td', { 'colspan': 5, 'style': 'text-align: center; padding: 2em; color: #999;' },
										_('No machines registered'))
								])
						)
					])
				])
			]),

			// Collections Browser
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('CrowdSec Collections')),
				E('p', { 'style': 'color: #666;' },
					_('Collections are bundles of parsers, scenarios, and post-overflow stages for specific services.')),

				E('div', { 'style': 'display: flex; gap: 1em; margin: 1em 0;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Updating Hub...'), [
								E('p', {}, _('Fetching latest collections from CrowdSec Hub...')),
								E('div', { 'class': 'spinning' })
							]);
							API.updateHub().then(function(result) {
								ui.hideModal();
								if (result && result.success) {
									ui.addNotification(null, E('p', {}, _('Hub index updated successfully. Please refresh the page.')), 'info');
								} else {
									ui.addNotification(null, E('p', {}, result.error || _('Failed to update hub')), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', {}, err.message || err), 'error');
							});
						}
					}, _('🔄 Update Hub'))
				]),

				E('div', { 'class': 'table-wrapper', 'style': 'margin-top: 1em;' }, [
					E('table', { 'class': 'table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Collection')),
								E('th', {}, _('Description')),
								E('th', {}, _('Version')),
								E('th', {}, _('Status')),
								E('th', {}, _('Actions'))
							])
						]),
						E('tbody', {},
							collections.length > 0 ?
								collections.map(function(collection) {
									var isInstalled = collection.status === 'enabled' || collection.status === 'installed' || collection.installed === 'ok';
									var collectionName = collection.name || 'Unknown';
									return E('tr', {}, [
										E('td', {}, [
											E('strong', {}, collectionName)
										]),
										E('td', {}, collection.description || 'N/A'),
										E('td', {}, collection.version || collection.local_version || 'N/A'),
										E('td', {}, [
											E('span', {
												'class': 'badge',
												'style': 'background: ' + (isInstalled ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
											}, isInstalled ? _('Installed') : _('Available'))
										]),
										E('td', {}, [
											isInstalled ?
												E('button', {
													'class': 'cbi-button cbi-button-remove',
													'click': function() {
														ui.showModal(_('Removing Collection...'), [
															E('p', {}, _('Removing %s...').format(collectionName)),
															E('div', { 'class': 'spinning' })
														]);
														API.removeCollection(collectionName).then(function(result) {
															ui.hideModal();
															if (result && result.success) {
																ui.addNotification(null, E('p', {}, _('Collection removed. Please reload CrowdSec and refresh this page.')), 'info');
															} else {
																ui.addNotification(null, E('p', {}, result.error || _('Failed to remove collection')), 'error');
															}
														}).catch(function(err) {
															ui.hideModal();
															ui.addNotification(null, E('p', {}, err.message || err), 'error');
														});
													}
												}, _('Remove')) :
												E('button', {
													'class': 'cbi-button cbi-button-add',
													'click': function() {
														ui.showModal(_('Installing Collection...'), [
															E('p', {}, _('Installing %s...').format(collectionName)),
															E('div', { 'class': 'spinning' })
														]);
														API.installCollection(collectionName).then(function(result) {
															ui.hideModal();
															if (result && result.success) {
																ui.addNotification(null, E('p', {}, _('Collection installed. Please reload CrowdSec and refresh this page.')), 'info');
															} else {
																ui.addNotification(null, E('p', {}, result.error || _('Failed to install collection')), 'error');
															}
														}).catch(function(err) {
															ui.hideModal();
															ui.addNotification(null, E('p', {}, err.message || err), 'error');
														});
													}
												}, _('Install'))
										])
									]);
								}) :
								E('tr', {}, [
									E('td', { 'colspan': 5, 'style': 'text-align: center; padding: 2em; color: #999;' }, [
										E('p', {}, _('No collections found. Click "Update Hub" to fetch the collection list.')),
										E('p', { 'style': 'margin-top: 0.5em; font-size: 0.9em;' }, [
											_('Or use: '),
											E('code', {}, 'cscli hub update')
										])
									])
								])
						)
					])
				])
			]),

			// Quick Actions
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Quick Actions')),

				// Service Control
				E('div', { 'style': 'margin-top: 1em;' }, [
					E('h4', { 'style': 'margin-bottom: 0.5em; color: var(--cyber-text-secondary, #888);' }, _('Service Control')),
					E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'style': 'min-width: 80px;',
							'click': function(ev) {
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.serviceControl('start').then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										ui.addNotification(null, E('p', {}, _('CrowdSec started successfully')), 'info');
										window.setTimeout(function() { location.reload(); }, 1500);
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to start service')), 'error');
									}
								});
							}
						}, _('▶ Start')),
						E('button', {
							'class': 'cbi-button cbi-button-negative',
							'style': 'min-width: 80px;',
							'click': function(ev) {
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.serviceControl('stop').then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										ui.addNotification(null, E('p', {}, _('CrowdSec stopped')), 'info');
										window.setTimeout(function() { location.reload(); }, 1500);
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to stop service')), 'error');
									}
								});
							}
						}, _('■ Stop')),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'style': 'min-width: 80px;',
							'click': function(ev) {
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.serviceControl('restart').then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										ui.addNotification(null, E('p', {}, _('CrowdSec restarted')), 'info');
										window.setTimeout(function() { location.reload(); }, 2000);
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to restart service')), 'error');
									}
								});
							}
						}, _('↻ Restart')),
						E('button', {
							'class': 'cbi-button',
							'style': 'min-width: 80px;',
							'click': function(ev) {
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.serviceControl('reload').then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										ui.addNotification(null, E('p', {}, _('Configuration reloaded')), 'info');
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to reload')), 'error');
									}
								});
							}
						}, _('⟳ Reload'))
					])
				]),

				// Register Bouncer
				E('div', { 'style': 'margin-top: 1.5em;' }, [
					E('h4', { 'style': 'margin-bottom: 0.5em; color: var(--cyber-text-secondary, #888);' }, _('Register New Bouncer')),
					E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap; align-items: center;' }, [
						E('input', {
							'type': 'text',
							'id': 'new-bouncer-name',
							'placeholder': _('Bouncer name...'),
							'style': 'padding: 0.5em; border: 1px solid var(--cyber-border, #444); border-radius: 4px; background: var(--cyber-bg-secondary, #1a1a2e); color: var(--cyber-text-primary, #fff); min-width: 200px;'
						}),
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function(ev) {
								var nameInput = document.getElementById('new-bouncer-name');
								var name = nameInput.value.trim();
								if (!name) {
									ui.addNotification(null, E('p', {}, _('Please enter a bouncer name')), 'error');
									return;
								}
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.registerBouncer(name).then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										nameInput.value = '';
										ui.showModal(_('Bouncer Registered'), [
											E('p', {}, _('Bouncer "%s" registered successfully!').format(name)),
											E('p', { 'style': 'margin-top: 1em;' }, _('API Key:')),
											E('pre', {
												'style': 'background: var(--cyber-bg-tertiary, #252538); padding: 1em; border-radius: 4px; word-break: break-all; user-select: all;'
											}, result.api_key || result.key || 'Check console'),
											E('p', { 'style': 'margin-top: 1em; color: #f39c12;' },
												_('Save this key! It will not be shown again.')),
											E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
												E('button', {
													'class': 'cbi-button cbi-button-action',
													'click': function() {
														ui.hideModal();
														location.reload();
													}
												}, _('Close'))
											])
										]);
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to register bouncer')), 'error');
									}
								});
							}
						}, _('+ Register'))
					])
				]),

				// Hub Update
				E('div', { 'style': 'margin-top: 1.5em;' }, [
					E('h4', { 'style': 'margin-bottom: 0.5em; color: var(--cyber-text-secondary, #888);' }, _('Hub Management')),
					E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function(ev) {
								ev.target.disabled = true;
								ev.target.classList.add('spinning');
								API.updateHub().then(function(result) {
									ev.target.disabled = false;
									ev.target.classList.remove('spinning');
									if (result && result.success) {
										ui.addNotification(null, E('p', {}, _('Hub index updated successfully')), 'info');
										window.setTimeout(function() { location.reload(); }, 1500);
									} else {
										ui.addNotification(null, E('p', {}, result.error || _('Failed to update hub')), 'error');
									}
								});
							}
						}, _('⬇ Update Hub Index'))
					])
				]),

				// CrowdSec Console
				E('div', { 'style': 'margin-top: 1.5em;' }, [
					E('h4', { 'style': 'margin-bottom: 0.5em; color: var(--cyber-text-secondary, #888);' }, _('CrowdSec Console')),
					E('div', { 'style': 'display: flex; gap: 0.5em; flex-wrap: wrap;' }, [
						E('a', {
							'href': 'https://app.crowdsec.net',
							'target': '_blank',
							'class': 'cbi-button cbi-button-action',
							'style': 'text-decoration: none; display: inline-flex; align-items: center; gap: 0.5em;'
						}, _('🌐 Open CrowdSec Console'))
					])
				])
			]),

			// Configuration Files
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Configuration Files')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px; margin-top: 1em;' }, [
					E('p', {}, [
						E('strong', {}, _('Main Configuration:')),
						' ',
						E('code', {}, '/etc/crowdsec/config.yaml')
					]),
					E('p', {}, [
						E('strong', {}, _('Acquisition:')),
						' ',
						E('code', {}, '/etc/crowdsec/acquis.yaml')
					]),
					E('p', {}, [
						E('strong', {}, _('Profiles:')),
						' ',
						E('code', {}, '/etc/crowdsec/profiles.yaml')
					]),
					E('p', {}, [
						E('strong', {}, _('Local API:')),
						' ',
						E('code', {}, '/etc/crowdsec/local_api_credentials.yaml')
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
						E('strong', {}, _('Note:')),
						' ',
						_('After modifying configuration files, restart CrowdSec: '),
						E('code', {}, '/etc/init.d/crowdsec restart')
					])
				])
			]),

			// Documentation Links
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em; background: #e8f4f8; padding: 1em;' }, [
				E('h3', {}, _('Documentation & Resources')),
				E('ul', { 'style': 'margin-top: 0.5em;' }, [
					E('li', {}, [
						E('a', { 'href': 'https://docs.crowdsec.net/', 'target': '_blank' },
							_('Official Documentation'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://hub.crowdsec.net/', 'target': '_blank' },
							_('CrowdSec Hub - Collections & Scenarios'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://app.crowdsec.net/', 'target': '_blank' },
							_('CrowdSec Console - Global Statistics'))
					]),
					E('li', {}, [
						E('code', {}, 'cscli --help'),
						' - ',
						_('CLI help and commands')
					])
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
