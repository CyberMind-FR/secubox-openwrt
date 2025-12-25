'use strict';
'require view';
'require ui';
'require crowdsec-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getMachines(),
			API.getHub()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var machines = data[1] || [];
		var hub = data[2] || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('CrowdSec Settings')),
			E('div', { 'class': 'cbi-map-descr' },
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
					E('div', { 'class': 'cbi-value', 'style': 'background: ' + (status.lapi === 'running' ? '#d4edda' : '#f8d7da') + '; padding: 1em; border-radius: 4px; border-left: 4px solid ' + (status.lapi === 'running' ? '#28a745' : '#dc3545') + ';' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Local API (LAPI)')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (status.lapi === 'running' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.5em 1em; border-radius: 4px; font-size: 1em;'
							}, status.lapi === 'running' ? _('RUNNING') : _('STOPPED'))
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

			// Quick Actions
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Quick Actions')),
				E('div', { 'style': 'display: flex; gap: 1em; flex-wrap: wrap; margin-top: 1em;' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Service Control'), [
								E('p', {}, _('Use the following commands to control CrowdSec:')),
								E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
									'/etc/init.d/crowdsec start\n',
									'/etc/init.d/crowdsec stop\n',
									'/etc/init.d/crowdsec restart\n',
									'/etc/init.d/crowdsec status'
								]),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						}
					}, _('Service Control')),

					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Register Bouncer'), [
								E('p', {}, _('To register a new bouncer, use the following command:')),
								E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px;' },
									'cscli bouncers add <bouncer-name>'),
								E('p', { 'style': 'margin-top: 1em;' },
									_('The command will output an API key. Use this key to configure your bouncer.')),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						}
					}, _('Register Bouncer')),

					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Install Collections'), [
								E('p', {}, _('Collections are bundles of parsers and scenarios. To install:')),
								E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
									'# List available collections\n',
									'cscli collections list\n\n',
									'# Install a collection\n',
									'cscli collections install crowdsecurity/nginx\n\n',
									'# Reload CrowdSec\n',
									'/etc/init.d/crowdsec reload'
								]),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						}
					}, _('Install Collections')),

					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': function() {
							ui.showModal(_('Update Hub'), [
								E('p', {}, _('Update the CrowdSec Hub and installed collections:')),
								E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
									'# Update hub index\n',
									'cscli hub update\n\n',
									'# Upgrade all collections\n',
									'cscli hub upgrade\n\n',
									'# Reload CrowdSec\n',
									'/etc/init.d/crowdsec reload'
								]),
								E('div', { 'class': 'right' }, [
									E('button', {
										'class': 'btn',
										'click': ui.hideModal
									}, _('Close'))
								])
							]);
						}
					}, _('Update Hub'))
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
