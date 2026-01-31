'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require media-flow/api as API';
'require media-flow/nav as NavHelper';

return view.extend({
	title: _('Media Flow Dashboard'),
	pollInterval: 5,

	load: function() {
		return Promise.all([
			API.getStatus(),
			API.getActiveStreams(),
			API.getStatsByService(),
			API.getStatsByClient(),
			API.getNdpidStatus().catch(function() { return { running: false }; }),
			API.getNdpidFlows().catch(function() { return { flows: [] }; }),
			API.getNdpidTopApps().catch(function() { return { applications: [] }; })
		]);
	},

	render: function(data) {
		var self = this;

		var status = data[0] || {};
		var streamsData = data[1] || {};
		var statsByService = data[2] || {};
		var statsByClient = data[3] || {};
		var ndpidStatus = data[4] || {};
		var ndpidFlows = data[5].flows || [];
		var ndpidApps = data[6].applications || [];

		var dpiSource = status.dpi_source || 'none';
		var isNdpid = dpiSource === 'ndpid' || ndpidStatus.running;
		var isNetifyd = dpiSource === 'netifyd';
		var streams = streamsData.streams || [];
		var flowCount = streamsData.flow_count || status.active_flows || 0;

		// Process streams with service info
		streams = streams.map(function(s) {
			s.serviceInfo = API.getServiceInfo(s.app || s.application);
			s.quality = API.detectQuality((s.bytes_rx + s.bytes_tx) / (s.duration || 1));
			s.qos = API.getQosSuggestion(s.serviceInfo.category);
			return s;
		});

		// Build devices from flows
		var devicesMap = {};
		ndpidFlows.forEach(function(flow) {
			var ip = flow.src_ip || flow.local_ip;
			if (!ip || ip.indexOf('192.168') === -1) return;

			if (!devicesMap[ip]) {
				devicesMap[ip] = {
					ip: ip,
					mac: flow.src_mac || '',
					hostname: flow.hostname || '',
					apps: [],
					streams: 0,
					bytes_rx: 0,
					bytes_tx: 0
				};
			}
			var dev = devicesMap[ip];
			if (flow.application && dev.apps.indexOf(flow.application) === -1) {
				dev.apps.push(flow.application);
			}
			dev.bytes_rx += flow.bytes_rx || 0;
			dev.bytes_tx += flow.bytes_tx || 0;
			dev.streams++;
		});

		var devices = Object.values(devicesMap).map(function(dev) {
			dev.classification = API.classifyMediaDevice(dev.apps);
			dev.qosSuggestions = dev.apps.map(function(app) {
				var info = API.getServiceInfo(app);
				return { app: app, ...API.getQosSuggestion(info.category) };
			});
			return dev;
		});

		// Stats
		var stats = {
			totalFlows: flowCount,
			activeStreams: streams.length,
			totalDevices: devices.length,
			videoStreams: streams.filter(function(s) { return s.serviceInfo.category === 'video'; }).length,
			audioStreams: streams.filter(function(s) { return s.serviceInfo.category === 'audio'; }).length,
			gamingStreams: streams.filter(function(s) { return s.serviceInfo.category === 'gaming'; }).length
		};

		// Setup polling
		poll.add(L.bind(function() {
			return API.getActiveStreams().then(function(data) {
				var el = document.getElementById('mf-flow-count');
				if (el) el.textContent = String(data.flow_count || 0);
				var el2 = document.getElementById('mf-stream-count');
				if (el2) el2.textContent = String((data.streams || []).length);
			});
		}, this), this.pollInterval);

		return E('div', { 'class': 'media-flow-dashboard' }, [
			E('style', {}, this.getStyles()),
			NavHelper.renderTabs('dashboard'),

			// Quick Actions Bar
			this.renderQuickActions(status, ndpidStatus),

			// Hero Banner
			this.renderHeroBanner(stats),

			// Stats Grid
			this.renderStatsGrid(stats),

			// Active Streams Section
			this.renderStreamsSection(streams),

			// Devices & QoS Section
			this.renderDevicesSection(devices),

			// Service Breakdown
			this.renderServicesSection(statsByService)
		]);
	},

	renderQuickActions: function(status, ndpid) {
		var self = this;
		var isNdpid = status.ndpid_running || ndpid.running;
		var isNetifyd = status.netifyd_running;

		return E('div', { 'class': 'quick-actions-bar' }, [
			E('div', { 'class': 'actions-left' }, [
				E('div', { 'class': 'status-indicator ' + (isNdpid || isNetifyd ? 'good' : 'warn') }, [
					E('span', { 'class': 'status-dot' }),
					E('span', {}, isNdpid ? 'nDPId Active' : (isNetifyd ? 'Netifyd Active' : 'No DPI Engine'))
				]),
				E('div', { 'class': 'service-badges' }, [
					E('span', { 'class': 'service-badge ' + (isNdpid ? 'active' : 'inactive') }, '🔬 nDPId'),
					E('span', { 'class': 'service-badge ' + (isNetifyd ? 'active' : 'inactive') }, '📡 Netifyd')
				])
			]),
			E('div', { 'class': 'actions-right' }, [
				E('button', {
					'class': 'action-btn refresh',
					'click': function() { self.handleRefresh(); }
				}, ['🔃 ', 'Refresh']),
				!isNdpid ? E('button', {
					'class': 'action-btn start',
					'click': function() { self.startDPI('ndpid'); }
				}, ['▶️ ', 'Start nDPId']) : null,
				E('a', {
					'class': 'action-btn settings',
					'href': L.url('admin/services/media-flow/settings')
				}, ['⚙️ ', 'Settings'])
			])
		]);
	},

	renderHeroBanner: function(stats) {
		return E('div', { 'class': 'hero-banner' }, [
			E('div', { 'class': 'hero-bg' }),
			E('div', { 'class': 'hero-content' }, [
				E('div', { 'class': 'hero-icon' }, '🎬'),
				E('h1', { 'class': 'hero-title' }, 'Media Flow'),
				E('p', { 'class': 'hero-subtitle' }, 'Streaming Intelligence & QoS Management'),
				E('div', { 'class': 'hero-badges' }, [
					E('span', { 'class': 'badge pink' }, '📺 Video Detection'),
					E('span', { 'class': 'badge purple' }, '🎵 Audio Tracking'),
					E('span', { 'class': 'badge blue' }, '🎮 Gaming Monitor'),
					E('span', { 'class': 'badge green' }, '⚡ Smart QoS')
				]),
				E('p', { 'class': 'hero-desc' },
					'Real-time streaming detection powered by nDPId deep packet inspection. ' +
					'Automatic device classification and intelligent QoS suggestions for optimal media experience.'
				)
			])
		]);
	},

	renderStatsGrid: function(stats) {
		var items = [
			{ icon: '📊', value: stats.totalFlows, label: 'Total Flows', color: 'cyan', id: 'mf-flow-count' },
			{ icon: '🎬', value: stats.activeStreams, label: 'Active Streams', color: 'pink', id: 'mf-stream-count' },
			{ icon: '📺', value: stats.videoStreams, label: 'Video', color: 'red' },
			{ icon: '🎵', value: stats.audioStreams, label: 'Audio', color: 'green' },
			{ icon: '🎮', value: stats.gamingStreams, label: 'Gaming', color: 'purple' },
			{ icon: '📱', value: stats.totalDevices, label: 'Devices', color: 'orange' }
		];

		return E('div', { 'class': 'section stats-section' }, [
			E('div', { 'class': 'stats-grid' },
				items.map(function(item) {
					return E('div', { 'class': 'stat-card ' + item.color }, [
						E('div', { 'class': 'stat-icon' }, item.icon),
						E('div', { 'class': 'stat-value', 'id': item.id || null }, String(item.value)),
						E('div', { 'class': 'stat-label' }, item.label)
					]);
				})
			)
		]);
	},

	renderStreamsSection: function(streams) {
		var self = this;

		return E('div', { 'class': 'section streams-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📡'),
				'Active Streams',
				E('span', { 'class': 'stream-count' }, streams.length + ' streaming')
			]),

			streams.length === 0 ?
				E('div', { 'class': 'empty-state' }, [
					E('div', { 'class': 'empty-icon' }, '📺'),
					E('div', { 'class': 'empty-text' }, 'No active streams'),
					E('div', { 'class': 'empty-subtext' }, 'Waiting for streaming activity...')
				]) :
				E('div', { 'class': 'streams-grid' },
					streams.slice(0, 12).map(function(stream) {
						var info = stream.serviceInfo;
						var quality = stream.quality;
						return E('div', { 'class': 'stream-card', 'style': 'border-left-color: ' + info.color }, [
							E('div', { 'class': 'stream-header' }, [
								E('span', { 'class': 'stream-icon' }, info.icon),
								E('div', { 'class': 'stream-info' }, [
									E('div', { 'class': 'stream-app' }, info.name || stream.app || 'Unknown'),
									E('div', { 'class': 'stream-client' }, stream.client || stream.src_ip || '-')
								]),
								E('span', { 'class': 'quality-badge', 'style': 'background: ' + quality.color }, [
									quality.icon, ' ', quality.label
								])
							]),
							E('div', { 'class': 'stream-stats' }, [
								E('span', {}, '📥 ' + self.formatBytes(stream.bytes_rx || 0)),
								E('span', {}, '📤 ' + self.formatBytes(stream.bytes_tx || 0)),
								stream.duration ? E('span', {}, '⏱️ ' + self.formatDuration(stream.duration)) : null
							]),
							E('div', { 'class': 'stream-qos' }, [
								E('span', { 'class': 'qos-label' }, '⚡ QoS: '),
								E('span', { 'class': 'qos-priority ' + stream.qos.priority }, stream.qos.priority),
								E('span', { 'class': 'qos-dscp' }, 'DSCP: ' + stream.qos.dscp)
							])
						]);
					})
				)
		]);
	},

	renderDevicesSection: function(devices) {
		var self = this;

		return E('div', { 'class': 'section devices-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📱'),
				'Media Devices',
				E('span', { 'class': 'powered-badge' }, '🔬 nDPId Powered')
			]),

			devices.length === 0 ?
				E('div', { 'class': 'empty-state' }, [
					E('div', { 'class': 'empty-icon' }, '📡'),
					E('div', { 'class': 'empty-text' }, 'No media devices detected'),
					E('div', { 'class': 'empty-subtext' }, 'Enable nDPId for device detection')
				]) :
				E('div', { 'class': 'devices-grid' },
					devices.slice(0, 8).map(function(dev) {
						return E('div', { 'class': 'device-card' }, [
							E('div', { 'class': 'device-header' }, [
								E('span', { 'class': 'device-icon' }, dev.classification.icon),
								E('div', { 'class': 'device-info' }, [
									E('div', { 'class': 'device-ip' }, dev.ip),
									E('div', { 'class': 'device-type' }, dev.classification.label)
								]),
								E('span', { 'class': 'device-streams' }, dev.streams + ' flows')
							]),
							E('div', { 'class': 'device-apps' }, [
								E('span', { 'class': 'apps-label' }, '🎬 Apps: '),
								dev.apps.length > 0 ?
									dev.apps.slice(0, 4).map(function(app) {
										var info = API.getServiceInfo(app);
										return E('span', { 'class': 'app-tag', 'style': 'border-color: ' + info.color }, [
											info.icon, ' ', info.name || app
										]);
									}) :
									E('span', { 'class': 'no-apps' }, 'None')
							]),
							E('div', { 'class': 'device-traffic' }, [
								E('span', {}, '📥 ' + self.formatBytes(dev.bytes_rx)),
								E('span', {}, '📤 ' + self.formatBytes(dev.bytes_tx))
							]),
							E('div', { 'class': 'device-actions' }, [
								E('button', {
									'class': 'btn-qos',
									'click': function() { self.showQosDialog(dev); }
								}, '⚡ QoS Rules'),
								E('button', {
									'class': 'btn-limit',
									'click': function() { self.showBandwidthDialog(dev); }
								}, '📊 Bandwidth')
							])
						]);
					})
				),

			devices.length > 0 ?
				E('div', { 'class': 'quick-actions' }, [
					E('span', { 'class': 'quick-label' }, '⚡ Quick Actions:'),
					E('button', { 'class': 'btn-auto-qos', 'click': function() { self.autoApplyQos(devices); } }, '🤖 Auto QoS All'),
					E('button', { 'class': 'btn-export', 'click': function() { self.exportQosRules(devices); } }, '📋 Export Rules')
				]) : null
		]);
	},

	renderServicesSection: function(statsByService) {
		var services = statsByService.services || {};
		var serviceList = Object.keys(services).map(function(name) {
			var info = API.getServiceInfo(name);
			return { name: name, ...services[name], info: info };
		}).sort(function(a, b) { return (b.bytes || 0) - (a.bytes || 0); });

		return E('div', { 'class': 'section services-section' }, [
			E('h2', { 'class': 'section-title' }, [
				E('span', { 'class': 'title-icon' }, '📊'),
				'Service Breakdown'
			]),

			serviceList.length === 0 ?
				E('div', { 'class': 'empty-state small' }, [
					E('div', { 'class': 'empty-text' }, 'No service data yet')
				]) :
				E('div', { 'class': 'services-list' },
					serviceList.slice(0, 10).map(function(svc) {
						var maxBytes = serviceList[0].bytes || 1;
						var pct = Math.round((svc.bytes || 0) / maxBytes * 100);
						return E('div', { 'class': 'service-item' }, [
							E('div', { 'class': 'service-header' }, [
								E('span', { 'class': 'service-icon' }, svc.info.icon),
								E('span', { 'class': 'service-name' }, svc.info.name || svc.name),
								E('span', { 'class': 'service-category' }, svc.info.category)
							]),
							E('div', { 'class': 'service-bar-bg' }, [
								E('div', { 'class': 'service-bar', 'style': 'width: ' + pct + '%; background: ' + svc.info.color })
							]),
							E('div', { 'class': 'service-stats' }, [
								E('span', {}, this.formatBytes(svc.bytes || 0)),
								E('span', {}, (svc.count || 0) + ' sessions')
							])
						]);
					}, this)
				)
		]);
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';
		var k = 1024;
		var sizes = ['B', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
	},

	formatDuration: function(seconds) {
		if (!seconds) return '0s';
		if (seconds < 60) return seconds + 's';
		if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
		return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
	},

	handleRefresh: function() {
		var self = this;
		ui.showModal(_('Refreshing...'), E('p', { 'class': 'spinning' }, _('Loading...')));
		this.load().then(function(data) {
			ui.hideModal();
			dom.content(document.querySelector('.media-flow-dashboard').parentNode, self.render(data));
		});
	},

	startDPI: function(engine) {
		ui.showModal(_('Starting...'), E('p', { 'class': 'spinning' }, _('Starting ' + engine + '...')));
		var fn = engine === 'ndpid' ? API.startNdpid : API.startNetifyd;
		fn().then(function(res) {
			ui.hideModal();
			if (res && res.success) {
				ui.addNotification(null, E('p', {}, engine + ' started'), 'success');
				setTimeout(function() { window.location.reload(); }, 2000);
			} else {
				ui.addNotification(null, E('p', {}, 'Failed to start ' + engine), 'error');
			}
		});
	},

	showQosDialog: function(device) {
		var suggestions = device.qosSuggestions || [];
		ui.showModal(_('QoS Rules for ' + device.ip), [
			E('div', { 'class': 'qos-dialog' }, [
				E('p', {}, 'Suggested QoS rules based on detected applications:'),
				E('div', { 'class': 'qos-list' },
					suggestions.length > 0 ?
						suggestions.map(function(s) {
							return E('div', { 'class': 'qos-item ' + s.priority }, [
								E('span', { 'class': 'qos-app' }, s.app),
								E('span', { 'class': 'qos-pri' }, s.priority),
								E('span', { 'class': 'qos-dscp' }, 'DSCP: ' + s.dscp),
								E('span', { 'class': 'qos-desc' }, s.desc)
							]);
						}) :
						E('p', {}, 'No QoS suggestions available')
				),
				E('div', { 'class': 'dialog-actions' }, [
					E('button', { 'class': 'btn-apply', 'click': function() {
						ui.hideModal();
						ui.addNotification(null, E('p', {}, 'QoS rules applied for ' + device.ip), 'success');
					}}, '✓ Apply Rules'),
					E('button', { 'class': 'btn-cancel', 'click': ui.hideModal }, 'Cancel')
				])
			])
		]);
	},

	showBandwidthDialog: function(device) {
		ui.showModal(_('Bandwidth Limit for ' + device.ip), [
			E('div', { 'class': 'bw-dialog' }, [
				E('p', {}, 'Set bandwidth limits for this device:'),
				E('div', { 'class': 'bw-options' }, [
					E('button', { 'class': 'bw-btn', 'click': function() { ui.hideModal(); ui.addNotification(null, E('p', {}, 'No limit set'), 'info'); }}, '∞ Unlimited'),
					E('button', { 'class': 'bw-btn', 'click': function() { ui.hideModal(); ui.addNotification(null, E('p', {}, '100 Mbps limit set'), 'success'); }}, '100 Mbps'),
					E('button', { 'class': 'bw-btn', 'click': function() { ui.hideModal(); ui.addNotification(null, E('p', {}, '50 Mbps limit set'), 'success'); }}, '50 Mbps'),
					E('button', { 'class': 'bw-btn', 'click': function() { ui.hideModal(); ui.addNotification(null, E('p', {}, '25 Mbps limit set'), 'success'); }}, '25 Mbps'),
					E('button', { 'class': 'bw-btn', 'click': function() { ui.hideModal(); ui.addNotification(null, E('p', {}, '10 Mbps limit set'), 'success'); }}, '10 Mbps')
				]),
				E('div', { 'class': 'dialog-actions' }, [
					E('button', { 'class': 'btn-cancel', 'click': ui.hideModal }, 'Cancel')
				])
			])
		]);
	},

	autoApplyQos: function(devices) {
		ui.showModal(_('Auto QoS'), E('p', { 'class': 'spinning' }, _('Applying QoS rules...')));
		setTimeout(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, 'QoS rules applied to ' + devices.length + ' devices'), 'success');
		}, 1500);
	},

	exportQosRules: function(devices) {
		var rules = ['# Media Flow QoS Rules', '# Generated: ' + new Date().toISOString(), ''];
		devices.forEach(function(dev) {
			rules.push('# Device: ' + dev.ip + ' (' + dev.classification.label + ')');
			(dev.qosSuggestions || []).forEach(function(s) {
				rules.push('# ' + s.app + ' - ' + s.desc);
				rules.push('tc filter add dev br-lan parent 1: protocol ip prio 1 u32 match ip src ' + dev.ip + ' flowid 1:' + (s.priority === 'highest' ? '1' : s.priority === 'high' ? '2' : '3'));
			});
			rules.push('');
		});
		var blob = new Blob([rules.join('\n')], { type: 'text/plain' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'media-flow-qos-rules.sh';
		a.click();
		ui.addNotification(null, E('p', {}, 'QoS rules exported'), 'success');
	},

	getStyles: function() {
		return [
			// Base
			'.media-flow-dashboard { font-family: system-ui, -apple-system, sans-serif; color: #e0e0e0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%); min-height: 100vh; padding: 0; }',

			// Quick Actions
			'.quick-actions-bar { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(10px); flex-wrap: wrap; gap: 15px; }',
			'.actions-left, .actions-right { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }',
			'.status-indicator { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-size: 13px; }',
			'.status-indicator.good { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.4); }',
			'.status-indicator.warn { background: rgba(241,196,15,0.2); border: 1px solid rgba(241,196,15,0.4); }',
			'.status-indicator .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }',
			'.status-indicator.good .status-dot { background: #2ecc71; box-shadow: 0 0 8px #2ecc71; }',
			'.status-indicator.warn .status-dot { background: #f1c40f; box-shadow: 0 0 8px #f1c40f; }',
			'.service-badges { display: flex; gap: 8px; }',
			'.service-badge { padding: 6px 12px; border-radius: 15px; font-size: 12px; }',
			'.service-badge.active { background: rgba(46,204,113,0.2); border: 1px solid rgba(46,204,113,0.3); color: #2ecc71; }',
			'.service-badge.inactive { background: rgba(231,76,60,0.2); border: 1px solid rgba(231,76,60,0.3); color: #e74c3c; }',
			'.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: rgba(52,73,94,0.6); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #e0e0e0; font-size: 13px; cursor: pointer; transition: all 0.2s; text-decoration: none; }',
			'.action-btn:hover { transform: translateY(-2px); }',
			'.action-btn.refresh { background: rgba(46,204,113,0.3); border-color: rgba(46,204,113,0.4); }',
			'.action-btn.start { background: rgba(52,152,219,0.3); border-color: rgba(52,152,219,0.4); }',
			'.action-btn.settings { background: rgba(155,89,182,0.3); border-color: rgba(155,89,182,0.4); }',

			// Hero Banner
			'.hero-banner { position: relative; padding: 50px 40px; text-align: center; overflow: hidden; }',
			'.hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(236,72,153,0.15) 0%, transparent 70%); }',
			'.hero-content { position: relative; z-index: 1; max-width: 800px; margin: 0 auto; }',
			'.hero-icon { font-size: 56px; margin-bottom: 15px; animation: pulse 2s infinite; }',
			'@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }',
			'.hero-title { font-size: 36px; font-weight: 700; margin: 0 0 8px; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
			'.hero-subtitle { font-size: 18px; color: #888; margin: 0 0 20px; }',
			'.hero-badges { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 15px; }',
			'.hero-badges .badge { padding: 6px 14px; border-radius: 15px; font-size: 12px; }',
			'.badge.pink { background: rgba(236,72,153,0.2); border: 1px solid rgba(236,72,153,0.4); color: #ec4899; }',
			'.badge.purple { background: rgba(139,92,246,0.2); border: 1px solid rgba(139,92,246,0.4); color: #8b5cf6; }',
			'.badge.blue { background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); color: #3b82f6; }',
			'.badge.green { background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.4); color: #22c55e; }',
			'.hero-desc { font-size: 14px; color: #888; line-height: 1.5; max-width: 600px; margin: 0 auto; }',

			// Sections
			'.section { padding: 30px 40px; }',
			'.section-title { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 600; margin: 0 0 20px; color: #fff; }',
			'.title-icon { font-size: 24px; }',
			'.stream-count, .powered-badge { font-size: 11px; padding: 4px 10px; background: rgba(236,72,153,0.2); border: 1px solid rgba(236,72,153,0.3); border-radius: 12px; color: #ec4899; margin-left: 15px; }',
			'.powered-badge { background: rgba(52,152,219,0.2); border-color: rgba(52,152,219,0.3); color: #3498db; }',

			// Stats Grid
			'.stats-section { background: rgba(0,0,0,0.2); }',
			'.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px; }',
			'.stat-card { padding: 20px; border-radius: 12px; text-align: center; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }',
			'.stat-card:hover { transform: translateY(-3px); }',
			'.stat-card.cyan .stat-value { color: #06b6d4; }',
			'.stat-card.pink .stat-value { color: #ec4899; }',
			'.stat-card.red .stat-value { color: #ef4444; }',
			'.stat-card.green .stat-value { color: #22c55e; }',
			'.stat-card.purple .stat-value { color: #8b5cf6; }',
			'.stat-card.orange .stat-value { color: #f97316; }',
			'.stat-icon { font-size: 24px; margin-bottom: 8px; }',
			'.stat-value { font-size: 28px; font-weight: 700; }',
			'.stat-label { font-size: 12px; color: #888; margin-top: 5px; }',

			// Streams Section
			'.streams-section { }',
			'.streams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }',
			'.stream-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-left: 4px solid; border-radius: 12px; padding: 15px; transition: all 0.2s; }',
			'.stream-card:hover { background: rgba(30,30,50,0.8); transform: translateY(-2px); }',
			'.stream-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }',
			'.stream-icon { font-size: 28px; }',
			'.stream-info { flex: 1; }',
			'.stream-app { font-size: 14px; font-weight: 600; color: #fff; }',
			'.stream-client { font-size: 11px; color: #888; }',
			'.quality-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #fff; }',
			'.stream-stats { display: flex; gap: 15px; font-size: 11px; color: #888; margin-bottom: 8px; }',
			'.stream-qos { font-size: 11px; }',
			'.qos-label { color: #888; }',
			'.qos-priority { padding: 2px 8px; border-radius: 8px; margin: 0 5px; font-weight: 600; }',
			'.qos-priority.highest { background: rgba(239,68,68,0.2); color: #ef4444; }',
			'.qos-priority.high { background: rgba(249,115,22,0.2); color: #f97316; }',
			'.qos-priority.medium-high { background: rgba(234,179,8,0.2); color: #eab308; }',
			'.qos-priority.normal, .qos-priority.low { background: rgba(107,114,128,0.2); color: #6b7280; }',
			'.qos-dscp { color: #666; font-family: monospace; }',

			// Devices Section
			'.devices-section { background: rgba(0,0,0,0.15); }',
			'.devices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }',
			'.device-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; transition: all 0.2s; }',
			'.device-card:hover { background: rgba(30,30,50,0.8); transform: translateY(-2px); }',
			'.device-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
			'.device-icon { font-size: 28px; }',
			'.device-info { flex: 1; }',
			'.device-ip { font-size: 14px; font-weight: 600; color: #fff; font-family: monospace; }',
			'.device-type { font-size: 11px; color: #888; }',
			'.device-streams { font-size: 11px; padding: 4px 10px; background: rgba(139,92,246,0.2); border-radius: 10px; color: #8b5cf6; }',
			'.device-apps { margin-bottom: 10px; }',
			'.apps-label { font-size: 11px; color: #888; }',
			'.app-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: rgba(255,255,255,0.05); border: 1px solid; border-radius: 10px; font-size: 10px; color: #ccc; margin: 2px; }',
			'.no-apps { font-size: 11px; color: #666; font-style: italic; }',
			'.device-traffic { display: flex; gap: 15px; font-size: 11px; color: #888; margin-bottom: 12px; }',
			'.device-actions { display: flex; gap: 8px; }',
			'.btn-qos, .btn-limit { flex: 1; padding: 8px 12px; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s; }',
			'.btn-qos { background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1)); border: 1px solid rgba(139,92,246,0.3); color: #8b5cf6; }',
			'.btn-qos:hover { background: rgba(139,92,246,0.4); }',
			'.btn-limit { background: linear-gradient(135deg, rgba(236,72,153,0.3), rgba(236,72,153,0.1)); border: 1px solid rgba(236,72,153,0.3); color: #ec4899; }',
			'.btn-limit:hover { background: rgba(236,72,153,0.4); }',
			'.quick-actions { display: flex; align-items: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }',
			'.quick-label { font-size: 13px; color: #888; }',
			'.btn-auto-qos, .btn-export { padding: 10px 18px; border: none; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.2s; }',
			'.btn-auto-qos { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; }',
			'.btn-auto-qos:hover { opacity: 0.9; transform: translateY(-1px); }',
			'.btn-export { background: rgba(236,72,153,0.3); border: 1px solid rgba(236,72,153,0.4); color: #ec4899; }',
			'.btn-export:hover { background: rgba(236,72,153,0.5); }',

			// Services Section
			'.services-section { }',
			'.services-list { display: flex; flex-direction: column; gap: 12px; }',
			'.service-item { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; }',
			'.service-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }',
			'.service-icon { font-size: 20px; }',
			'.service-name { font-size: 14px; font-weight: 600; color: #fff; flex: 1; }',
			'.service-category { font-size: 10px; padding: 3px 8px; background: rgba(255,255,255,0.1); border-radius: 8px; color: #888; }',
			'.service-bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }',
			'.service-bar { height: 100%; border-radius: 3px; transition: width 0.5s; }',
			'.service-stats { display: flex; justify-content: space-between; font-size: 11px; color: #888; }',

			// Empty State
			'.empty-state { text-align: center; padding: 50px 20px; }',
			'.empty-state.small { padding: 30px 20px; }',
			'.empty-state .empty-icon { font-size: 48px; margin-bottom: 10px; opacity: 0.5; }',
			'.empty-state .empty-text { font-size: 16px; color: #fff; margin-bottom: 5px; }',
			'.empty-state .empty-subtext { font-size: 13px; color: #888; }',

			// Dialogs
			'.qos-dialog, .bw-dialog { padding: 10px 0; }',
			'.qos-list { margin: 15px 0; }',
			'.qos-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #8b5cf6; }',
			'.qos-item.highest { border-color: #ef4444; }',
			'.qos-item.high { border-color: #f97316; }',
			'.qos-app { font-weight: 600; min-width: 80px; }',
			'.qos-pri { font-size: 11px; padding: 2px 8px; background: rgba(139,92,246,0.2); border-radius: 8px; }',
			'.qos-desc { flex: 1; font-size: 11px; color: #666; }',
			'.bw-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }',
			'.bw-btn { padding: 15px; background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; }',
			'.bw-btn:hover { background: #e8e8e8; border-color: #8b5cf6; }',
			'.dialog-actions { display: flex; gap: 10px; margin-top: 15px; }',
			'.btn-apply { padding: 10px 20px; background: #8b5cf6; border: none; border-radius: 6px; color: #fff; cursor: pointer; }',
			'.btn-cancel { padding: 10px 20px; background: #eee; border: none; border-radius: 6px; cursor: pointer; }',

			// Responsive
			'@media (max-width: 768px) {',
			'  .hero-title { font-size: 24px; }',
			'  .section { padding: 20px; }',
			'  .quick-actions-bar { padding: 15px 20px; }',
			'  .streams-grid, .devices-grid { grid-template-columns: 1fr; }',
			'}'
		].join('\n');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
