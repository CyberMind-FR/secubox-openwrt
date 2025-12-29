'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require netdata-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getNetdataStatus(),
			API.getNetdataInfo(),
			API.getSystem()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var info = data[1] || {};
		var system = data[2] || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Netdata Settings')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Configure Netdata monitoring service and view system information.')),

			// Service Information
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Information')),
				E('div', { 'class': 'table cbi-section-table' }, [
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Service Status')),
						E('div', { 'class': 'td left' }, [
							E('span', {
								'class': 'badge',
								'style': 'background: ' + (status.running ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
							}, status.running ? _('Running') : _('Stopped'))
						])
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Version')),
						E('div', { 'class': 'td left' }, status.version || 'Unknown')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Listen Port')),
						E('div', { 'class': 'td left' }, (status.port || 19999).toString())
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Bind Address')),
						E('div', { 'class': 'td left' }, status.bind || '127.0.0.1')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Dashboard URL')),
						E('div', { 'class': 'td left' }, [
							E('a', {
								'href': status.url || 'http://127.0.0.1:19999',
								'target': '_blank'
							}, status.url || 'http://127.0.0.1:19999')
						])
					])
				])
			]),

			// System Information
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('System Information')),
				E('div', { 'class': 'table cbi-section-table' }, [
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Hostname')),
						E('div', { 'class': 'td left' }, system.hostname || 'Unknown')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Model')),
						E('div', { 'class': 'td left' }, system.model || 'Unknown')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Kernel')),
						E('div', { 'class': 'td left' }, system.kernel || 'Unknown')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Architecture')),
						E('div', { 'class': 'td left' }, system.arch || 'Unknown')
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Distribution')),
						E('div', { 'class': 'td left' },
							(system.distro || 'OpenWrt') + ' ' + (system.version || ''))
					]),
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Uptime')),
						E('div', { 'class': 'td left' }, system.uptime_formatted || '0d 0h 0m')
					])
				])
			]),

			// Configuration Files
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Configuration Files')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('p', {}, [
						E('strong', {}, _('Main Configuration:')),
						' ',
						E('code', {}, '/etc/netdata/netdata.conf')
					]),
					E('p', {}, [
						E('strong', {}, _('Health Alarms:')),
						' ',
						E('code', {}, '/etc/netdata/health.d/')
					]),
					E('p', {}, [
						E('strong', {}, _('Streams Configuration:')),
						' ',
						E('code', {}, '/etc/netdata/stream.conf')
					]),
					E('p', {}, [
						E('strong', {}, _('Python Modules:')),
						' ',
						E('code', {}, '/etc/netdata/python.d/')
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
						E('strong', {}, _('Note:')),
						' ',
						_('After modifying configuration files, restart Netdata from the Dashboard tab.')
					])
				])
			]),

			// Common Configuration Examples
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Common Configuration Examples')),

				// Change Port/Bind
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Change Port and Bind Address')),
					E('p', {}, _('Edit /etc/netdata/netdata.conf and modify:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'[web]\n' +
						'    default port = 19999\n' +
						'    bind to = 127.0.0.1\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Use 0.0.0.0 to listen on all interfaces, or specific IP for a single interface.'))
				]),

				// Memory Mode
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Configure Memory Mode')),
					E('p', {}, _('Edit /etc/netdata/netdata.conf:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'[global]\n' +
						'    memory mode = ram\n' +
						'    # Options: ram, save, map, none, dbengine\n' +
						'    \n' +
						'    history = 3600\n' +
						'    # Seconds of history to keep in memory\n'
					)
				]),

				// Disable Collectors
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Disable Specific Collectors')),
					E('p', {}, _('Edit /etc/netdata/netdata.conf:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'[plugins]\n' +
						'    python.d = no\n' +
						'    node.d = no\n' +
						'    apps = no\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Disable unused collectors to reduce CPU and memory usage.'))
				])
			]),

			// Useful Commands
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em; background: #e8f4f8; padding: 1em;' }, [
				E('h3', {}, _('Useful Commands')),
				E('pre', { 'style': 'background: white; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
					'# Service control\n',
					'/etc/init.d/netdata start\n',
					'/etc/init.d/netdata stop\n',
					'/etc/init.d/netdata restart\n',
					'\n',
					'# View logs\n',
					'logread | grep netdata\n',
					'\n',
					'# Test configuration\n',
					'netdata -W unittest\n',
					'\n',
					'# List all charts\n',
					'curl http://127.0.0.1:19999/api/v1/charts\n'
				])
			]),

			// Documentation Links
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Documentation & Resources')),
				E('ul', { 'style': 'margin-top: 0.5em;' }, [
					E('li', {}, [
						E('a', { 'href': 'https://learn.netdata.cloud/', 'target': '_blank' },
							_('Official Documentation'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://github.com/netdata/netdata', 'target': '_blank' },
							_('GitHub Repository'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://learn.netdata.cloud/docs/configure/nodes', 'target': '_blank' },
							_('Configuration Guide'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://learn.netdata.cloud/docs/configure/health', 'target': '_blank' },
							_('Health Monitoring & Alarms'))
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
