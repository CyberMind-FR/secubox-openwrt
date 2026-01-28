'use strict';
'require view';
'require ui';
'require rpc';

var callStatus = rpc.declare({ object: 'luci.mitmproxy', method: 'status', expect: {} });
var callInstall = rpc.declare({ object: 'luci.mitmproxy', method: 'install', expect: {} });
var callStart = rpc.declare({ object: 'luci.mitmproxy', method: 'start', expect: {} });
var callStop = rpc.declare({ object: 'luci.mitmproxy', method: 'stop', expect: {} });
var callRestart = rpc.declare({ object: 'luci.mitmproxy', method: 'restart', expect: {} });

var css = [
	':root { --mp-primary: #e74c3c; --mp-primary-light: #ec7063; --mp-secondary: #3498db; --mp-success: #27ae60; --mp-warning: #f39c12; --mp-danger: #c0392b; --mp-bg: #0d0d12; --mp-card: #141419; --mp-border: rgba(255,255,255,0.08); --mp-text: #e0e0e8; --mp-muted: #8a8a9a; }',
	'.mp-overview { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif; color: var(--mp-text); }',

	/* Header */
	'.mp-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 16px; color: #fff; margin-bottom: 24px; }',
	'.mp-header-left { display: flex; align-items: center; gap: 16px; }',
	'.mp-logo { font-size: 48px; }',
	'.mp-title { font-size: 28px; font-weight: 700; margin: 0; }',
	'.mp-subtitle { font-size: 14px; opacity: 0.9; margin-top: 4px; }',
	'.mp-status { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; }',
	'.mp-status.running { background: rgba(39,174,96,0.3); }',
	'.mp-status.stopped { background: rgba(239,68,68,0.3); }',
	'.mp-dot { width: 10px; height: 10px; border-radius: 50%; animation: pulse 2s infinite; }',
	'.mp-status.running .mp-dot { background: #27ae60; }',
	'.mp-status.stopped .mp-dot { background: #ef4444; }',
	'@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }',

	/* Welcome Banner - shown when not installed/running */
	'.mp-welcome { text-align: center; padding: 60px 40px; background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 16px; margin-bottom: 24px; }',
	'.mp-welcome-icon { font-size: 80px; margin-bottom: 20px; }',
	'.mp-welcome h2 { font-size: 28px; margin: 0 0 12px 0; color: #fff; }',
	'.mp-welcome p { font-size: 16px; color: var(--mp-muted); margin: 0 0 30px 0; max-width: 600px; margin-left: auto; margin-right: auto; }',
	'.mp-welcome-note { background: rgba(231,76,60,0.1); border: 1px solid rgba(231,76,60,0.3); border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 14px; color: #ec7063; }',

	/* Mode Cards */
	'.mp-modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }',
	'.mp-mode-card { background: var(--mp-card); border: 2px solid var(--mp-border); border-radius: 16px; padding: 24px; text-align: center; cursor: pointer; transition: all 0.3s; }',
	'.mp-mode-card:hover { border-color: var(--mp-primary); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(231,76,60,0.2); }',
	'.mp-mode-card.recommended { border-color: var(--mp-primary); background: linear-gradient(180deg, rgba(231,76,60,0.1) 0%, transparent 100%); }',
	'.mp-mode-icon { font-size: 48px; margin-bottom: 16px; }',
	'.mp-mode-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; }',
	'.mp-mode-desc { font-size: 13px; color: var(--mp-muted); line-height: 1.5; }',
	'.mp-mode-badge { display: inline-block; background: var(--mp-primary); color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 12px; margin-top: 12px; text-transform: uppercase; font-weight: 600; }',

	/* Feature Grid */
	'.mp-features { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }',
	'.mp-feature { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 12px; }',
	'.mp-feature-icon { font-size: 24px; }',
	'.mp-feature-text { font-size: 14px; color: var(--mp-text); }',

	/* Quick Actions */
	'.mp-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 24px; }',
	'.mp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; text-decoration: none; }',
	'.mp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }',
	'.mp-btn:disabled { opacity: 0.5; cursor: not-allowed; }',
	'.mp-btn-primary { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }',
	'.mp-btn-success { background: linear-gradient(135deg, #27ae60, #1e8449); color: #fff; }',
	'.mp-btn-danger { background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; }',
	'.mp-btn-secondary { background: rgba(255,255,255,0.1); color: var(--mp-text); border: 1px solid var(--mp-border); }',

	/* Quick Start Card */
	'.mp-quickstart { background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 16px; padding: 24px; margin-bottom: 24px; }',
	'.mp-quickstart-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }',
	'.mp-quickstart-icon { font-size: 28px; }',
	'.mp-quickstart-title { font-size: 20px; font-weight: 600; color: #fff; }',
	'.mp-quickstart-steps { display: flex; flex-direction: column; gap: 16px; }',
	'.mp-step { display: flex; gap: 16px; align-items: flex-start; }',
	'.mp-step-num { width: 32px; height: 32px; background: var(--mp-primary); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; flex-shrink: 0; }',
	'.mp-step-content h4 { margin: 0 0 4px 0; font-size: 15px; color: #fff; }',
	'.mp-step-content p { margin: 0; font-size: 13px; color: var(--mp-muted); }',

	/* Info Cards */
	'.mp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }',
	'.mp-info-card { background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 12px; padding: 20px; }',
	'.mp-info-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }',
	'.mp-info-icon { font-size: 24px; }',
	'.mp-info-title { font-size: 16px; font-weight: 600; color: #fff; }',
	'.mp-info-value { font-size: 24px; font-weight: 700; color: var(--mp-primary); }',
	'.mp-info-label { font-size: 13px; color: var(--mp-muted); }',

	/* How It Works */
	'.mp-howto { background: var(--mp-card); border: 1px solid var(--mp-border); border-radius: 16px; padding: 24px; }',
	'.mp-howto-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }',
	'.mp-howto-icon { font-size: 28px; }',
	'.mp-howto-title { font-size: 20px; font-weight: 600; color: #fff; }',
	'.mp-howto-diagram { background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; font-family: monospace; font-size: 13px; line-height: 1.6; overflow-x: auto; }',
	'.mp-howto-diagram pre { margin: 0; color: var(--mp-text); }'
].join('\n');

return view.extend({
	load: function() { return callStatus(); },

	handleInstall: function() {
		ui.showModal(_('Installing mitmproxy'), [
			E('p', { 'class': 'spinning' }, _('Downloading and setting up mitmproxy container...')),
			E('p', { 'style': 'color: #888; font-size: 13px;' }, _('This may take a few minutes on first install.'))
		]);
		callInstall().then(function(r) {
			ui.hideModal();
			ui.addNotification(null, E('p', r.message || _('Installation started. Please wait and refresh the page.')));
		}).catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStart: function() {
		ui.showModal(_('Starting mitmproxy'), [E('p', { 'class': 'spinning' }, _('Starting proxy service...'))]);
		callStart().then(function() { ui.hideModal(); location.reload(); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	handleStop: function() {
		ui.showModal(_('Stopping mitmproxy'), [E('p', { 'class': 'spinning' }, _('Stopping proxy service...'))]);
		callStop().then(function() { ui.hideModal(); location.reload(); })
		.catch(function(e) { ui.hideModal(); ui.addNotification(null, E('p', e.message), 'error'); });
	},

	render: function(status) {
		if (!document.getElementById('mp-overview-styles')) {
			var s = document.createElement('style');
			s.id = 'mp-overview-styles';
			s.textContent = css;
			document.head.appendChild(s);
		}

		var isInstalled = status.installed && status.docker_available;
		var isRunning = status.running;

		// Not installed - show welcome wizard
		if (!isInstalled) {
			return E('div', { 'class': 'mp-overview' }, [
				// Header
				E('div', { 'class': 'mp-header' }, [
					E('div', { 'class': 'mp-header-left' }, [
						E('div', { 'class': 'mp-logo' }, '🔐'),
						E('div', {}, [
							E('h1', { 'class': 'mp-title' }, 'mitmproxy'),
							E('div', { 'class': 'mp-subtitle' }, _('HTTPS Interception Proxy'))
						])
					]),
					E('div', { 'class': 'mp-status stopped' }, [
						E('span', { 'class': 'mp-dot' }),
						_('Not Installed')
					])
				]),

				// Welcome Banner
				E('div', { 'class': 'mp-welcome' }, [
					E('div', { 'class': 'mp-welcome-icon' }, '🔍'),
					E('h2', {}, _('Intercept & Analyze Network Traffic')),
					E('p', {}, _('mitmproxy is a powerful interactive HTTPS proxy that lets you inspect, modify, and replay HTTP/HTTPS traffic. Perfect for debugging APIs, testing applications, and security analysis.')),

					// Features Grid
					E('div', { 'class': 'mp-features', 'style': 'margin-bottom: 30px;' }, [
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '📊'),
							E('span', { 'class': 'mp-feature-text' }, _('Real-time inspection'))
						]),
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '🔒'),
							E('span', { 'class': 'mp-feature-text' }, _('HTTPS decryption'))
						]),
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '🖥️'),
							E('span', { 'class': 'mp-feature-text' }, _('Web-based UI'))
						]),
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '🎭'),
							E('span', { 'class': 'mp-feature-text' }, _('Transparent mode'))
						]),
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '🔄'),
							E('span', { 'class': 'mp-feature-text' }, _('Request replay'))
						]),
						E('div', { 'class': 'mp-feature' }, [
							E('span', { 'class': 'mp-feature-icon' }, '📝'),
							E('span', { 'class': 'mp-feature-text' }, _('Flow logging'))
						])
					]),

					!status.docker_available ?
						E('div', { 'style': 'color: #ef4444; margin-bottom: 20px;' }, [
							E('span', { 'style': 'font-size: 24px;' }, '⚠️ '),
							_('Docker is required but not available')
						]) : null,

					E('button', {
						'class': 'mp-btn mp-btn-primary',
						'click': ui.createHandlerFn(this, 'handleInstall'),
						'disabled': !status.docker_available
					}, ['📦 ', _('Install mitmproxy')]),

					E('div', { 'class': 'mp-welcome-note' }, [
						'⚠️ ',
						_('Security Note: mitmproxy is a powerful security analysis tool. Only use for legitimate debugging, testing, and security research purposes.')
					])
				]),

				// Proxy Modes
				E('h3', { 'style': 'margin: 0 0 16px 0; font-size: 18px; color: #fff;' }, '🎯 ' + _('Proxy Modes')),
				E('div', { 'class': 'mp-modes' }, [
					E('div', { 'class': 'mp-mode-card' }, [
						E('div', { 'class': 'mp-mode-icon' }, '🎯'),
						E('div', { 'class': 'mp-mode-title' }, _('Regular Proxy')),
						E('div', { 'class': 'mp-mode-desc' }, _('Configure clients to use the proxy manually. Best for testing specific applications.'))
					]),
					E('div', { 'class': 'mp-mode-card recommended' }, [
						E('div', { 'class': 'mp-mode-icon' }, '🎭'),
						E('div', { 'class': 'mp-mode-title' }, _('Transparent Mode')),
						E('div', { 'class': 'mp-mode-desc' }, _('Intercept all network traffic automatically via firewall rules.')),
						E('span', { 'class': 'mp-mode-badge' }, _('Recommended'))
					]),
					E('div', { 'class': 'mp-mode-card' }, [
						E('div', { 'class': 'mp-mode-icon' }, '⬆️'),
						E('div', { 'class': 'mp-mode-title' }, _('Upstream Proxy')),
						E('div', { 'class': 'mp-mode-desc' }, _('Forward traffic to another proxy server for proxy chaining.'))
					]),
					E('div', { 'class': 'mp-mode-card' }, [
						E('div', { 'class': 'mp-mode-icon' }, '⬇️'),
						E('div', { 'class': 'mp-mode-title' }, _('Reverse Proxy')),
						E('div', { 'class': 'mp-mode-desc' }, _('Act as a reverse proxy to inspect backend server traffic.'))
					])
				])
			]);
		}

		// Installed - show dashboard overview
		return E('div', { 'class': 'mp-overview' }, [
			// Header
			E('div', { 'class': 'mp-header' }, [
				E('div', { 'class': 'mp-header-left' }, [
					E('div', { 'class': 'mp-logo' }, '🔐'),
					E('div', {}, [
						E('h1', { 'class': 'mp-title' }, 'mitmproxy'),
						E('div', { 'class': 'mp-subtitle' }, _('HTTPS Interception Proxy'))
					])
				]),
				E('div', { 'class': 'mp-status ' + (isRunning ? 'running' : 'stopped') }, [
					E('span', { 'class': 'mp-dot' }),
					isRunning ? _('Running') : _('Stopped')
				])
			]),

			// Quick Actions
			E('div', { 'class': 'mp-actions' }, [
				isRunning ? E('button', {
					'class': 'mp-btn mp-btn-danger',
					'click': ui.createHandlerFn(this, 'handleStop')
				}, ['⏹ ', _('Stop Proxy')]) :
				E('button', {
					'class': 'mp-btn mp-btn-success',
					'click': ui.createHandlerFn(this, 'handleStart')
				}, ['▶️ ', _('Start Proxy')]),

				E('a', {
					'class': 'mp-btn mp-btn-primary',
					'href': L.url('admin', 'secubox', 'security', 'mitmproxy', 'dashboard')
				}, ['📊 ', _('Dashboard')]),

				E('a', {
					'class': 'mp-btn mp-btn-secondary',
					'href': 'http://' + window.location.hostname + ':' + (status.web_port || 8081),
					'target': '_blank'
				}, ['🖥️ ', _('Web UI')]),

				E('a', {
					'class': 'mp-btn mp-btn-secondary',
					'href': L.url('admin', 'secubox', 'security', 'mitmproxy', 'settings')
				}, ['⚙️ ', _('Settings')])
			]),

			// Info Cards
			E('div', { 'class': 'mp-info-grid' }, [
				E('div', { 'class': 'mp-info-card' }, [
					E('div', { 'class': 'mp-info-header' }, [
						E('span', { 'class': 'mp-info-icon' }, '🔌'),
						E('span', { 'class': 'mp-info-title' }, _('Proxy Port'))
					]),
					E('div', { 'class': 'mp-info-value' }, String(status.proxy_port || 8080)),
					E('div', { 'class': 'mp-info-label' }, _('HTTP/HTTPS interception'))
				]),
				E('div', { 'class': 'mp-info-card' }, [
					E('div', { 'class': 'mp-info-header' }, [
						E('span', { 'class': 'mp-info-icon' }, '🖥️'),
						E('span', { 'class': 'mp-info-title' }, _('Web UI Port'))
					]),
					E('div', { 'class': 'mp-info-value' }, String(status.web_port || 8081)),
					E('div', { 'class': 'mp-info-label' }, _('mitmweb interface'))
				]),
				E('div', { 'class': 'mp-info-card' }, [
					E('div', { 'class': 'mp-info-header' }, [
						E('span', { 'class': 'mp-info-icon' }, '💾'),
						E('span', { 'class': 'mp-info-title' }, _('Data Path'))
					]),
					E('div', { 'class': 'mp-info-value', 'style': 'font-size: 14px; word-break: break-all;' }, status.data_path || '/srv/mitmproxy'),
					E('div', { 'class': 'mp-info-label' }, _('Certificates & flows'))
				])
			]),

			// Quick Start Guide
			E('div', { 'class': 'mp-quickstart' }, [
				E('div', { 'class': 'mp-quickstart-header' }, [
					E('span', { 'class': 'mp-quickstart-icon' }, '🚀'),
					E('span', { 'class': 'mp-quickstart-title' }, _('Quick Start Guide'))
				]),
				E('div', { 'class': 'mp-quickstart-steps' }, [
					E('div', { 'class': 'mp-step' }, [
						E('div', { 'class': 'mp-step-num' }, '1'),
						E('div', { 'class': 'mp-step-content' }, [
							E('h4', {}, _('Start the Proxy')),
							E('p', {}, _('Click the Start button above to begin intercepting traffic.'))
						])
					]),
					E('div', { 'class': 'mp-step' }, [
						E('div', { 'class': 'mp-step-num' }, '2'),
						E('div', { 'class': 'mp-step-content' }, [
							E('h4', {}, _('Install CA Certificate')),
							E('p', {}, [
								_('Navigate to '),
								E('code', { 'style': 'background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;' }, 'http://mitm.it'),
								_(' from a proxied device to download and install the CA certificate.')
							])
						])
					]),
					E('div', { 'class': 'mp-step' }, [
						E('div', { 'class': 'mp-step-num' }, '3'),
						E('div', { 'class': 'mp-step-content' }, [
							E('h4', {}, _('Configure Clients')),
							E('p', {}, [
								_('Set proxy to '),
								E('code', { 'style': 'background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;' }, window.location.hostname + ':' + (status.proxy_port || 8080)),
								_(' or enable transparent mode in Settings.')
							])
						])
					]),
					E('div', { 'class': 'mp-step' }, [
						E('div', { 'class': 'mp-step-num' }, '4'),
						E('div', { 'class': 'mp-step-content' }, [
							E('h4', {}, _('View Traffic')),
							E('p', {}, _('Open the Dashboard or Web UI to see captured requests in real-time.'))
						])
					])
				])
			]),

			// How It Works Diagram
			E('div', { 'class': 'mp-howto' }, [
				E('div', { 'class': 'mp-howto-header' }, [
					E('span', { 'class': 'mp-howto-icon' }, '📖'),
					E('span', { 'class': 'mp-howto-title' }, _('How mitmproxy Works'))
				]),
				E('div', { 'class': 'mp-howto-diagram' }, [
					E('pre', {}, [
						'  Client Device          SecuBox Router              Internet\n',
						' ┌─────────────┐      ┌──────────────────┐      ┌─────────────┐\n',
						' │   Browser   │─────▶│    mitmproxy     │─────▶│   Server    │\n',
						' │             │◀─────│                  │◀─────│             │\n',
						' └─────────────┘      │  🔍 Inspect      │      └─────────────┘\n',
						'                      │  ✏️ Modify       │\n',
						'                      │  📊 Log          │\n',
						'                      │  🔄 Replay       │\n',
						'                      └──────────────────┘\n',
						'\n',
						' Port ' + (status.proxy_port || 8080) + ': HTTP/HTTPS interception\n',
						' Port ' + (status.web_port || 8081) + ': Web UI (mitmweb)'
					].join(''))
				])
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
