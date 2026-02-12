'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require netdata-dashboard/api as API';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

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

		// Build URL using browser hostname (not 127.0.0.1 which won't work from browser)
		var port = status.port || 19999;
		var bind = status.bind || '0.0.0.0';
		var dashboardUrl = 'http://' + window.location.hostname + ':' + port;

		var tableStyle = 'width: 100%; border-collapse: collapse;';
		var thStyle = 'padding: 0.75rem 1rem; text-align: left; font-weight: 600; width: 200px; background: #161b22; border-bottom: 1px solid #30363d;';
		var tdStyle = 'padding: 0.75rem 1rem; border-bottom: 1px solid #30363d;';

		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var view = E('div', { 'class': 'cbi-map' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('Netdata Settings')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Configure Netdata monitoring service and view system information.')),

			// Service Information
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Information')),
				E('table', { 'style': tableStyle }, [
					E('tbody', {}, [
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Service Status')),
							E('td', { 'style': tdStyle }, [
								E('span', {
									'style': 'display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 500; background: ' + (status.running ? '#238636' : '#da3633') + '; color: white;'
								}, status.running ? _('Running') : _('Stopped'))
							])
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Version')),
							E('td', { 'style': tdStyle }, status.version || 'unknown')
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Listen Port')),
							E('td', { 'style': tdStyle }, String(port))
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Bind Address')),
							E('td', { 'style': tdStyle }, bind)
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Dashboard URL')),
							E('td', { 'style': tdStyle }, [
								E('a', {
									'href': dashboardUrl,
									'target': '_blank',
									'style': 'color: #58a6ff;'
								}, dashboardUrl)
							])
						])
					])
				])
			]),

			// System Information
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('System Information')),
				E('table', { 'style': tableStyle }, [
					E('tbody', {}, [
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Hostname')),
							E('td', { 'style': tdStyle }, system.hostname || 'Unknown')
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Model')),
							E('td', { 'style': tdStyle }, system.model || 'Unknown')
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Kernel')),
							E('td', { 'style': tdStyle }, system.kernel || 'Unknown')
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Architecture')),
							E('td', { 'style': tdStyle }, system.arch || 'Unknown')
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Distribution')),
							E('td', { 'style': tdStyle }, (system.distro || 'OpenWrt') + ' ' + (system.version || ''))
						]),
						E('tr', {}, [
							E('th', { 'style': thStyle }, _('Uptime')),
							E('td', { 'style': tdStyle }, system.uptime_formatted || '0d 0h 0m')
						])
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

		wrapper.appendChild(view);
		return KissTheme.wrap([wrapper], 'admin/status/netdata/settings');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
