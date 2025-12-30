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

		var container = E('div', {
			'class': 'netifyd-settings',
			'style': 'max-width: 1200px; margin: 0 auto;'
		}, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			// Header
			E('div', { 'style': 'margin-bottom: 2em;' }, [
				E('h1', {
					'style': 'font-size: 2em; margin: 0 0 0.5em 0; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
				}, _('Netifyd Settings')),
				E('p', { 'style': 'color: #94a3b8; font-size: 1.05em;' },
					_('Configure and manage Netifyd deep packet inspection service'))
			]),

			// Service Status Card
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; margin-bottom: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, status.running ? '✅' : '⚠️'),
					_('Service Status')
				]),

				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5em; margin-top: 1.5em;' }, [
					// Status
					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b;' }, [
						E('div', { 'style': 'color: #64748b; font-size: 0.9em; margin-bottom: 0.5em;' }, _('Status')),
						E('div', {
							'class': 'badge',
							'style': 'display: inline-block; padding: 0.5em 1em; border-radius: 6px; font-weight: bold; background: ' + (status.running ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)') + '; color: white;'
						}, status.running ? _('Running') : _('Stopped'))
					]),

					// Version
					status.version ? E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b;' }, [
						E('div', { 'style': 'color: #64748b; font-size: 0.9em; margin-bottom: 0.5em;' }, _('Version')),
						E('div', { 'style': 'color: #8b5cf6; font-size: 1.5em; font-weight: bold;' }, status.version)
					]) : null,

					// Uptime
					status.running && status.uptime ? E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b;' }, [
						E('div', { 'style': 'color: #64748b; font-size: 0.9em; margin-bottom: 0.5em;' }, _('Uptime')),
						E('div', { 'style': 'color: #3b82f6; font-size: 1.5em; font-weight: bold;' }, this.formatUptime(status.uptime))
					]) : null,

					// Memory
					status.running && status.memory_kb ? E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b;' }, [
						E('div', { 'style': 'color: #64748b; font-size: 0.9em; margin-bottom: 0.5em;' }, _('Memory')),
						E('div', { 'style': 'color: #06b6d4; font-size: 1.5em; font-weight: bold;' }, Math.round(status.memory_kb / 1024) + ' MB')
					]) : null
				]),

				// Monitored Interfaces
				status.interfaces && status.interfaces.length > 0 ? E('div', { 'style': 'margin-top: 1.5em; padding-top: 1.5em; border-top: 1px solid #1e293b;' }, [
					E('div', { 'style': 'color: #cbd5e1; font-size: 0.95em; margin-bottom: 1em;' }, _('Monitored Interfaces')),
					E('div', { 'style': 'display: flex; gap: 0.75em; flex-wrap: wrap;' },
						status.interfaces.map(function(iface) {
							return E('span', {
								'style': 'background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 0.5em 1em; border-radius: 6px; font-weight: 500;'
							}, iface);
						})
					)
				]) : null
			]),

			// Configuration Info
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; margin-bottom: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '⚙️'),
					_('Configuration Files')
				]),

				E('div', { 'style': 'display: grid; gap: 1em; margin-top: 1.5em;' }, [
					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;' }, [
						E('div', {}, [
							E('div', { 'style': 'color: #cbd5e1; font-weight: 500; margin-bottom: 0.25em;' }, _('Main Configuration')),
							E('div', { 'style': 'color: #64748b; font-size: 0.9em;' }, _('Service and interface settings'))
						]),
						E('code', { 'style': 'color: #8b5cf6; background: #020617; padding: 0.5em 1em; border-radius: 4px; font-size: 0.95em;' }, '/etc/netifyd.conf')
					]),

					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;' }, [
						E('div', {}, [
							E('div', { 'style': 'color: #cbd5e1; font-weight: 500; margin-bottom: 0.25em;' }, _('UCI Configuration')),
							E('div', { 'style': 'color: #64748b; font-size: 0.9em;' }, _('OpenWrt system integration'))
						]),
						E('code', { 'style': 'color: #3b82f6; background: #020617; padding: 0.5em 1em; border-radius: 4px; font-size: 0.95em;' }, '/etc/config/netifyd')
					]),

					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.25em; border: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;' }, [
						E('div', {}, [
							E('div', { 'style': 'color: #cbd5e1; font-weight: 500; margin-bottom: 0.25em;' }, _('Runtime Data')),
							E('div', { 'style': 'color: #64748b; font-size: 0.9em;' }, _('Real-time flow and status data'))
						]),
						E('code', { 'style': 'color: #06b6d4; background: #020617; padding: 0.5em 1em; border-radius: 4px; font-size: 0.95em;' }, '/var/run/netifyd/')
					])
				]),

				E('div', { 'style': 'background: linear-gradient(135deg, #92400e, #b45309); border-radius: 8px; padding: 1.25em; margin-top: 1.5em; border: 1px solid #f59e0b;' }, [
					E('div', { 'style': 'display: flex; align-items: flex-start; gap: 0.75em;' }, [
						E('span', { 'style': 'font-size: 1.3em; flex-shrink: 0;' }, '⚠️'),
						E('div', {}, [
							E('strong', { 'style': 'color: #fcd34d; font-size: 1.05em;' }, _('Note')),
							E('p', { 'style': 'color: #fde68a; margin: 0.5em 0 0 0;' },
								_('After modifying configuration files, restart netifyd from the command line:') + ' ' +
								E('code', { 'style': 'background: #451a03; padding: 0.25em 0.5em; border-radius: 3px;' }, '/etc/init.d/netifyd restart'))
						])
					])
				])
			]),

			// Quick Commands
			E('div', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; margin-bottom: 2em; border: 1px solid #334155;' }, [
				E('h2', { 'style': 'color: #f1f5f9; margin-top: 0; display: flex; align-items: center; gap: 0.5em;' }, [
					E('span', {}, '💻'),
					_('Useful Commands')
				]),

				E('div', { 'style': 'background: #020617; border-radius: 8px; padding: 1.5em; margin-top: 1.5em; border: 1px solid #1e293b;' }, [
					E('pre', {
						'style': 'color: #e2e8f0; margin: 0; font-family: monospace; font-size: 0.95em; line-height: 1.8;'
					}, [
						E('div', { 'style': 'color: #64748b;' }, '# Service control'),
						'/etc/init.d/netifyd start\n',
						'/etc/init.d/netifyd stop\n',
						'/etc/init.d/netifyd restart\n',
						'/etc/init.d/netifyd status\n\n',
						E('div', { 'style': 'color: #64748b;' }, '# View logs'),
						'logread | grep netifyd\n\n',
						E('div', { 'style': 'color: #64748b;' }, '# Check version'),
						'netifyd --version\n\n',
						E('div', { 'style': 'color: #64748b;' }, '# View current flows'),
						'cat /var/run/netifyd/flows.json'
					])
				])
			]),

			// Documentation Section (Collapsed by default)
			E('details', { 'style': 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2em; margin-bottom: 2em; border: 1px solid #334155;' }, [
				E('summary', {
					'style': 'color: #f1f5f9; font-size: 1.3em; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.5em; user-select: none;'
				}, [
					E('span', {}, '📚'),
					_('Documentation & Resources')
				]),

				E('div', { 'style': 'margin-top: 2em;' }, [
					// About Netifyd
					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin-bottom: 1.5em; border: 1px solid #1e293b;' }, [
						E('h3', { 'style': 'color: #cbd5e1; margin-top: 0;' }, _('What is Netifyd?')),
						E('p', { 'style': 'color: #94a3b8; line-height: 1.6;' },
							_('Netifyd is a deep packet inspection (DPI) daemon that classifies network traffic by application protocol and category. It provides real-time insights into network activity without relying on cloud services.')),

						E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1em; margin-top: 1em;' }, [
							E('div', { 'style': 'background: #020617; padding: 1em; border-radius: 6px; border-left: 3px solid #8b5cf6;' }, [
								E('div', { 'style': 'color: #8b5cf6; font-weight: bold; margin-bottom: 0.5em;' }, '300+'),
								E('div', { 'style': 'color: #94a3b8; font-size: 0.9em;' }, _('Protocol Signatures'))
							]),
							E('div', { 'style': 'background: #020617; padding: 1em; border-radius: 6px; border-left: 3px solid #3b82f6;' }, [
								E('div', { 'style': 'color: #3b82f6; font-weight: bold; margin-bottom: 0.5em;' }, '1000+'),
								E('div', { 'style': 'color: #94a3b8; font-size: 0.9em;' }, _('Application Signatures'))
							]),
							E('div', { 'style': 'background: #020617; padding: 1em; border-radius: 6px; border-left: 3px solid #10b981;' }, [
								E('div', { 'style': 'color: #10b981; font-weight: bold; margin-bottom: 0.5em;' }, _('Real-time')),
								E('div', { 'style': 'color: #94a3b8; font-size: 0.9em;' }, _('DPI Classification'))
							])
						])
					]),

					// Configuration Examples
					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; margin-bottom: 1.5em; border: 1px solid #1e293b;' }, [
						E('h3', { 'style': 'color: #cbd5e1; margin-top: 0;' }, _('Configuration Examples')),

						E('div', { 'style': 'margin-bottom: 1.5em;' }, [
							E('h4', { 'style': 'color: #8b5cf6; margin: 0.5em 0;' }, _('Monitor Specific Interfaces')),
							E('pre', {
								'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 0.5em 0;'
							},
								'config netifyd\n' +
								'    option enabled \'1\'\n' +
								'    list internal_if \'br-lan\'\n' +
								'    list internal_if \'wlan0\'\n' +
								'    list external_if \'eth0\''
							)
						]),

						E('div', { 'style': 'margin-bottom: 1.5em;' }, [
							E('h4', { 'style': 'color: #3b82f6; margin: 0.5em 0;' }, _('Advanced DPI Options')),
							E('pre', {
								'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 0.5em 0;'
							},
								'enable_dpi=yes\n' +
								'enable_dns_hint=yes\n' +
								'detection_sensitivity=high\n' +
								'flow_idle_timeout=300'
							)
						]),

						E('div', {}, [
							E('h4', { 'style': 'color: #10b981; margin: 0.5em 0;' }, _('Performance Tuning')),
							E('pre', {
								'style': 'background: #020617; color: #e2e8f0; padding: 1em; border-radius: 6px; overflow-x: auto; border: 1px solid #1e293b; margin: 0.5em 0;'
							},
								'max_flows=65536\n' +
								'thread_pool_size=4\n' +
								'flow_hash_size=32768'
							),
							E('div', { 'style': 'color: #64748b; font-size: 0.9em; margin-top: 0.5em; font-style: italic;' },
								_('💡 Reduce values on low-memory devices'))
						])
					]),

					// Resources
					E('div', { 'style': 'background: #0f172a; border-radius: 8px; padding: 1.5em; border: 1px solid #1e293b;' }, [
						E('h3', { 'style': 'color: #cbd5e1; margin-top: 0;' }, _('External Resources')),
						E('div', { 'style': 'display: grid; gap: 0.75em;' }, [
							E('a', {
								'href': 'https://www.netify.ai/',
								'target': '_blank',
								'style': 'color: #8b5cf6; text-decoration: none; display: flex; align-items: center; gap: 0.5em; padding: 0.75em; background: #020617; border-radius: 6px; border: 1px solid #1e293b;'
							}, [
								E('span', {}, '🔗'),
								_('Official Netify Website')
							]),
							E('a', {
								'href': 'https://www.netify.ai/documentation',
								'target': '_blank',
								'style': 'color: #3b82f6; text-decoration: none; display: flex; align-items: center; gap: 0.5em; padding: 0.75em; background: #020617; border-radius: 6px; border: 1px solid #1e293b;'
							}, [
								E('span', {}, '📖'),
								_('Netify Documentation')
							]),
							E('a', {
								'href': 'https://gitlab.com/netify.ai/public/netify-daemon',
								'target': '_blank',
								'style': 'color: #06b6d4; text-decoration: none; display: flex; align-items: center; gap: 0.5em; padding: 0.75em; background: #020617; border-radius: 6px; border: 1px solid #1e293b;'
							}, [
								E('span', {}, '💻'),
								_('GitLab Repository')
							])
						])
					])
				])
			])
		]);

		return container;
	},

	formatUptime: function(seconds) {
		if (!seconds) return '0s';
		var d = Math.floor(seconds / 86400);
		var h = Math.floor((seconds % 86400) / 3600);
		var m = Math.floor((seconds % 3600) / 60);
		var parts = [];
		if (d > 0) parts.push(d + 'd');
		if (h > 0) parts.push(h + 'h');
		if (m > 0) parts.push(m + 'm');
		return parts.join(' ') || '< 1m';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
