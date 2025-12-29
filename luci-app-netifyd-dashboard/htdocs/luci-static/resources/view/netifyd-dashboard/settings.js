'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require netifyd-dashboard.api as API';

return view.extend({
	load: function() {
		return API.getStatus();
	},

	render: function(status) {
		status = status || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Netifyd Settings')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Configure and manage Netifyd deep packet inspection service.')),

			// Service Status
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Status')),
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
					status.running ? E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Process ID')),
						E('div', { 'class': 'td left' }, [
							E('code', {}, (status.pid || 'N/A').toString())
						])
					]) : null,
					status.running && status.uptime ? E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Uptime')),
						E('div', { 'class': 'td left' }, this.formatUptime(status.uptime))
					]) : null,
					status.running && status.memory_kb ? E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Memory Usage')),
						E('div', { 'class': 'td left' }, Math.round(status.memory_kb / 1024) + ' MB')
					]) : null,
					E('div', { 'class': 'tr cbi-section-table-row' }, [
						E('div', { 'class': 'td left', 'style': 'width: 33%; font-weight: bold;' }, _('Monitored Interfaces')),
						E('div', { 'class': 'td left' }, [
							status.interfaces && status.interfaces.length > 0
								? status.interfaces.map(function(iface) {
									return E('span', {
										'class': 'badge',
										'style': 'background: #0088cc; color: white; padding: 0.25em 0.6em; border-radius: 3px; margin-right: 0.5em;'
									}, iface);
								})
								: E('span', { 'style': 'color: #999;' }, _('None configured'))
						])
					])
				])
			]),

			// What is Netifyd
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('About Netifyd')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('p', {}, _('Netifyd is a deep packet inspection (DPI) daemon that classifies network traffic by application protocol and category.')),
					E('p', { 'style': 'margin-top: 0.5em;' }, _('It provides real-time insights into:')),
					E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
						E('li', {}, _('Application detection (HTTP, HTTPS, DNS, SSH, etc.)')),
						E('li', {}, _('Protocol identification (TCP, UDP, ICMP)')),
						E('li', {}, _('Traffic categorization (Streaming, VoIP, Gaming, etc.)')),
						E('li', {}, _('Device fingerprinting and tracking')),
						E('li', {}, _('Bandwidth usage per application'))
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #e8f4f8; border-radius: 4px;' }, [
						E('strong', {}, _('Note:')),
						' ',
						_('Netifyd uses kernel conntrack for flow tracking and deep packet inspection for application detection.')
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
						E('code', {}, '/etc/netifyd.conf')
					]),
					E('p', {}, [
						E('strong', {}, _('Service Configuration:')),
						' ',
						E('code', {}, '/etc/config/netifyd')
					]),
					E('p', {}, [
						E('strong', {}, _('Runtime Data:')),
						' ',
						E('code', {}, '/var/run/netifyd/')
					]),
					E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
						E('strong', {}, _('Note:')),
						' ',
						_('After modifying configuration files, restart netifyd from the command line.')
					])
				])
			]),

			// Common Configuration Examples
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Common Configuration Examples')),

				// Monitor Specific Interfaces
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Monitor Specific Interfaces')),
					E('p', {}, _('Edit /etc/config/netifyd to specify which interfaces to monitor:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'config netifyd\n' +
						'    option enabled \'1\'\n' +
						'    list internal_if \'br-lan\'\n' +
						'    list internal_if \'wlan0\'\n' +
						'    list external_if \'eth0\'\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Internal interfaces are monitored for client traffic, external for WAN traffic.'))
				]),

				// Enable Protocol Detection
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Enable Advanced Detection')),
					E('p', {}, _('Edit /etc/netifyd.conf for advanced DPI options:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'# Enable deep packet inspection\n' +
						'enable_dpi=yes\n\n' +
						'# Enable DNS resolution\n' +
						'enable_dns_hint=yes\n\n' +
						'# Detection sensitivity (high, medium, low)\n' +
						'detection_sensitivity=high\n\n' +
						'# Flow idle timeout (seconds)\n' +
						'flow_idle_timeout=300\n'
					)
				]),

				// Performance Tuning
				E('div', { 'style': 'margin-bottom: 1.5em;' }, [
					E('h4', {}, _('Performance Tuning')),
					E('p', {}, _('Adjust resource usage in /etc/netifyd.conf:')),
					E('pre', { 'style': 'background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;' },
						'# Maximum flows to track\n' +
						'max_flows=65536\n\n' +
						'# Thread pool size\n' +
						'thread_pool_size=4\n\n' +
						'# Flow hash table size\n' +
						'flow_hash_size=32768\n'
					),
					E('p', { 'style': 'color: #666; font-size: 0.9em;' },
						_('Reduce values on low-memory devices, increase for high-traffic networks.'))
				])
			]),

			// Useful Commands
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em; background: #e8f4f8; padding: 1em;' }, [
				E('h3', {}, _('Useful Commands')),
				E('pre', { 'style': 'background: white; padding: 1em; border-radius: 4px; overflow-x: auto;' }, [
					'# Service control\n',
					'/etc/init.d/netifyd start\n',
					'/etc/init.d/netifyd stop\n',
					'/etc/init.d/netifyd restart\n',
					'/etc/init.d/netifyd status\n',
					'\n',
					'# View logs\n',
					'logread | grep netifyd\n',
					'\n',
					'# Check version\n',
					'netifyd --version\n',
					'\n',
					'# View current flows\n',
					'cat /var/run/netifyd/flows.json\n',
					'\n',
					'# Check process status\n',
					'ps | grep netifyd\n',
					'top -n 1 | grep netifyd\n',
					'\n',
					'# Debug mode\n',
					'netifyd -d -I br-lan\n'
				])
			]),

			// Integration & API
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Integration & API')),
				E('div', { 'style': 'background: #f8f9fa; padding: 1em; border-radius: 4px;' }, [
					E('p', {}, _('Netifyd provides a Unix socket interface for real-time data access:')),
					E('ul', { 'style': 'margin: 0.5em 0; padding-left: 2em;' }, [
						E('li', {}, [
							E('strong', {}, _('Socket:')),
							' ',
							E('code', {}, '/var/run/netifyd/netifyd.sock')
						]),
						E('li', {}, [
							E('strong', {}, _('Status JSON:')),
							' ',
							E('code', {}, '/var/run/netifyd/status.json')
						]),
						E('li', {}, [
							E('strong', {}, _('Flows JSON:')),
							' ',
							E('code', {}, '/var/run/netifyd/flows.json')
						])
					]),
					E('p', { 'style': 'margin-top: 1em;' }, _('This dashboard uses the RPCD backend to parse conntrack data and provide DPI insights.')),
					E('p', { 'style': 'margin-top: 0.5em; color: #666; font-size: 0.9em;' },
						_('For advanced integrations, consider using netify-fwa (Flow Web API) for RESTful access to flow data.'))
				])
			]),

			// Documentation Links
			E('div', { 'class': 'cbi-section', 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Documentation & Resources')),
				E('ul', { 'style': 'margin-top: 0.5em;' }, [
					E('li', {}, [
						E('a', { 'href': 'https://www.netify.ai/', 'target': '_blank' },
							_('Official Netify Website'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://gitlab.com/netify.ai/public/netify-daemon', 'target': '_blank' },
							_('Netifyd GitLab Repository'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://www.netify.ai/documentation', 'target': '_blank' },
							_('Netify Documentation'))
					]),
					E('li', {}, [
						E('a', { 'href': 'https://openwrt.org/packages/pkgdata/netifyd', 'target': '_blank' },
							_('OpenWrt Package Info'))
					])
				])
			])
		]);

		return view;
	},

	formatUptime: function(seconds) {
		if (!seconds) return '0s';
		var d = Math.floor(seconds / 86400);
		var h = Math.floor((seconds % 86400) / 3600);
		var m = Math.floor((seconds % 3600) / 60);
		var s = seconds % 60;
		var parts = [];
		if (d > 0) parts.push(d + 'd');
		if (h > 0) parts.push(h + 'h');
		if (m > 0) parts.push(m + 'm');
		if (s > 0 && parts.length === 0) parts.push(s + 's');
		return parts.join(' ') || '0s';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
