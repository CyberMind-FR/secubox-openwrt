'use strict';
'require view';
'require dom';
'require ui';
'require form';
'require fs';
'require service-registry/api as api';

return view.extend({
	title: _('Landing Page'),

	load: function() {
		return Promise.all([
			api.getLandingConfig(),
			api.getPublishedServices()
		]);
	},

	render: function(data) {
		var self = this;
		var config = data[0] || {};
		var services = data[1] || [];

		// Category icons
		var categoryIcons = {
			'web': '🌐',
			'network': '📡',
			'security': '🛡️',
			'storage': '💾',
			'media': '🎬',
			'communication': '💬',
			'development': '🔧',
			'monitoring': '📊',
			'ai': '🤖',
			'database': '🗄️',
			'vpn': '🔒',
			'dns': '🌍',
			'proxy': '🔀',
			'default': '📦'
		};

		var container = E('div', { 'class': 'service-landing-page' }, [
			E('style', {}, this.getStyles()),

			// Hero Section
			E('div', { 'class': 'landing-hero' }, [
				E('div', { 'class': 'hero-icon' }, '🚀'),
				E('h1', {}, 'Service Landing Page'),
				E('p', { 'class': 'hero-desc' },
					'Configure the public landing page that displays all published services with QR codes'
				)
			]),

			// Status Cards
			E('div', { 'class': 'status-grid' }, [
				E('div', { 'class': 'status-card' + (config.exists ? ' active' : ' inactive') }, [
					E('div', { 'class': 'status-icon' }, config.exists ? '✅' : '❌'),
					E('div', { 'class': 'status-info' }, [
						E('div', { 'class': 'status-label' }, 'Page Status'),
						E('div', { 'class': 'status-value' }, config.exists ? 'Generated' : 'Not Generated')
					])
				]),
				E('div', { 'class': 'status-card' }, [
					E('div', { 'class': 'status-icon' }, '📡'),
					E('div', { 'class': 'status-info' }, [
						E('div', { 'class': 'status-label' }, 'Published Services'),
						E('div', { 'class': 'status-value' }, String(services.length))
					])
				]),
				E('div', { 'class': 'status-card' }, [
					E('div', { 'class': 'status-icon' }, '🕐'),
					E('div', { 'class': 'status-info' }, [
						E('div', { 'class': 'status-label' }, 'Last Updated'),
						E('div', { 'class': 'status-value' },
							config.modified ? new Date(config.modified * 1000).toLocaleDateString() : 'Never'
						)
					])
				]),
				E('div', { 'class': 'status-card' }, [
					E('div', { 'class': 'status-icon' }, '🔄'),
					E('div', { 'class': 'status-info' }, [
						E('div', { 'class': 'status-label' }, 'Auto-Regenerate'),
						E('div', { 'class': 'status-value' }, config.auto_regen ? 'Enabled' : 'Disabled')
					])
				])
			]),

			// Actions Section
			E('div', { 'class': 'actions-section' }, [
				E('h2', {}, ['⚡', ' Quick Actions']),
				E('div', { 'class': 'actions-grid' }, [
					E('button', {
						'class': 'action-btn primary',
						'click': ui.createHandlerFn(self, 'handleRegenerate')
					}, ['🔄', ' Regenerate Page']),
					config.exists ? E('a', {
						'class': 'action-btn',
						'href': '/secubox-services.html',
						'target': '_blank'
					}, ['🌐', ' View Live Page']) : '',
					config.exists ? E('button', {
						'class': 'action-btn',
						'click': ui.createHandlerFn(self, 'handlePreview')
					}, ['👁️', ' Preview']) : '',
					E('button', {
						'class': 'action-btn',
						'click': function() { window.location.href = L.url('admin/services/service-registry/publish'); }
					}, ['➕', ' Publish Service'])
				])
			]),

			// Services Preview
			services.length > 0 ? E('div', { 'class': 'services-section' }, [
				E('h2', {}, ['📋', ' Services on Landing Page (', String(services.length), ')']),
				E('div', { 'class': 'services-grid' },
					services.map(function(svc) {
						var urls = svc.urls || {};
						var catIcon = categoryIcons[svc.category] || categoryIcons['default'];
						var isRunning = svc.status === 'running';

						return E('div', { 'class': 'service-card' }, [
							E('div', { 'class': 'service-header' }, [
								E('span', { 'class': 'service-icon' }, catIcon),
								E('span', { 'class': 'service-status ' + (isRunning ? 'running' : 'stopped') },
									isRunning ? '● Running' : '○ Stopped'
								)
							]),
							E('h3', { 'class': 'service-name' }, svc.name || svc.id),
							E('div', { 'class': 'service-category' }, svc.category || 'Uncategorized'),
							E('div', { 'class': 'service-urls' }, [
								urls.clearnet ? E('div', { 'class': 'url-item clearnet' }, [
									E('span', { 'class': 'url-icon' }, '🌐'),
									E('a', { 'href': urls.clearnet, 'target': '_blank' },
										urls.clearnet.replace(/^https?:\/\//, '').substring(0, 25) + '...'
									)
								]) : '',
								urls.onion ? E('div', { 'class': 'url-item onion' }, [
									E('span', { 'class': 'url-icon' }, '🧅'),
									E('span', { 'class': 'onion-url' },
										urls.onion.substring(0, 20) + '....onion'
									)
								]) : ''
							])
						]);
					})
				)
			]) : E('div', { 'class': 'empty-state' }, [
				E('div', { 'class': 'empty-icon' }, '📭'),
				E('h3', {}, 'No Published Services'),
				E('p', {}, 'Publish some services to display them on the landing page'),
				E('a', {
					'class': 'action-btn primary',
					'href': L.url('admin/services/service-registry/publish')
				}, ['➕', ' Publish First Service'])
			]),

			// Features Section
			E('div', { 'class': 'features-section' }, [
				E('h2', {}, ['✨', ' Landing Page Features']),
				E('div', { 'class': 'features-grid' }, [
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '📱'),
						E('span', {}, 'Responsive Design')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '📷'),
						E('span', {}, 'QR Codes')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '📋'),
						E('span', {}, 'Copy to Clipboard')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '🔄'),
						E('span', {}, 'Live Status')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '🌙'),
						E('span', {}, 'Dark Mode')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '🔗'),
						E('span', {}, 'Share Buttons')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '🧅'),
						E('span', {}, 'Onion URLs')
					]),
					E('div', { 'class': 'feature-item' }, [
						E('span', { 'class': 'feature-icon' }, '🔐'),
						E('span', {}, 'Self-Hosted')
					])
				])
			]),

			// Settings Section
			E('div', { 'class': 'settings-section' }, [
				E('h2', {}, ['⚙️', ' Settings']),
				E('div', { 'class': 'settings-grid' }, [
					E('div', { 'class': 'setting-item' }, [
						E('div', { 'class': 'setting-label' }, [
							E('span', {}, '🎨'),
							E('span', {}, 'Theme')
						]),
						E('div', { 'class': 'theme-selector' }, [
							E('select', {
								'class': 'theme-select',
								'change': function(e) { self.handleThemeChange(e.target.value); }
							}, [
								E('option', { 'value': 'mirrorbox', 'selected': (config.theme || 'mirrorbox') === 'mirrorbox' }, 'MirrorBox (Glassmorphism)'),
								E('option', { 'value': 'cyberpunk', 'selected': config.theme === 'cyberpunk' }, 'Cyberpunk (Neon)'),
								E('option', { 'value': 'minimal', 'selected': config.theme === 'minimal' }, 'Minimal Dark'),
								E('option', { 'value': 'terminal', 'selected': config.theme === 'terminal' }, 'Terminal (Matrix)'),
								E('option', { 'value': 'light', 'selected': config.theme === 'light' }, 'Clean Light')
							])
						])
					]),
					E('div', { 'class': 'setting-item' }, [
						E('div', { 'class': 'setting-label' }, [
							E('span', {}, '🔄'),
							E('span', {}, 'Auto-Regenerate')
						]),
						E('label', { 'class': 'toggle-switch' }, [
							E('input', {
								'type': 'checkbox',
								'checked': config.auto_regen,
								'change': function(e) { self.toggleAutoRegen(e.target.checked); }
							}),
							E('span', { 'class': 'toggle-slider' })
						])
					]),
					E('div', { 'class': 'setting-item' }, [
						E('div', { 'class': 'setting-label' }, [
							E('span', {}, '📁'),
							E('span', {}, 'Output Path')
						]),
						E('code', { 'class': 'setting-value' }, config.path || '/www/secubox-services.html')
					])
				])
			])
		]);

		return container;
	},

	handleRegenerate: function() {
		ui.showModal(_('Regenerating'), [
			E('p', { 'class': 'spinning' }, _('🔄 Regenerating landing page...'))
		]);

		return api.generateLandingPage().then(function(result) {
			ui.hideModal();

			if (result.success) {
				ui.addNotification(null, E('p', '✅ ' + _('Landing page regenerated successfully')), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', '❌ ' + _('Failed to regenerate: ') + (result.error || '')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', '❌ ' + _('Error: ') + err.message), 'error');
		});
	},

	handlePreview: function() {
		ui.showModal(_('🖼️ Landing Page Preview'), [
			E('div', { 'style': 'text-align: center;' }, [
				E('iframe', {
					'src': '/secubox-services.html',
					'style': 'width: 100%; height: 500px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #1a1a2e;'
				})
			]),
			E('div', { 'class': 'right', 'style': 'margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;' }, [
				E('a', {
					'class': 'action-btn',
					'href': '/secubox-services.html',
					'target': '_blank'
				}, ['🌐', ' Open in New Tab']),
				E('button', { 'class': 'action-btn', 'click': ui.hideModal }, ['✕', ' Close'])
			])
		], 'wide');
	},

	toggleAutoRegen: function(enabled) {
		// Save setting via API
		ui.addNotification(null, E('p', (enabled ? '✅' : '❌') + ' Auto-regenerate ' + (enabled ? 'enabled' : 'disabled')), 'info');
	},

	handleThemeChange: function(theme) {
		var self = this;
		ui.showModal(_('Applying Theme'), [
			E('p', { 'class': 'spinning' }, _('🎨 Applying theme: ' + theme + '...'))
		]);

		return api.setLandingTheme(theme).then(function(result) {
			if (result.success) {
				return api.generateLandingPage();
			}
			throw new Error(result.error || 'Failed to set theme');
		}).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', '✅ ' + _('Theme applied: ') + theme), 'info');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', '❌ ' + _('Failed to regenerate page')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', '❌ ' + _('Error: ') + err.message), 'error');
		});
	},

	getStyles: function() {
		return [
			'.service-landing-page { font-family: system-ui, -apple-system, sans-serif; color: #e0e0e0; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%); min-height: 100vh; padding: 20px; margin: -20px; }',

			// Hero
			'.landing-hero { text-align: center; padding: 40px 20px; margin-bottom: 30px; }',
			'.hero-icon { font-size: 64px; margin-bottom: 15px; }',
			'.landing-hero h1 { font-size: 32px; margin: 0 0 10px; background: linear-gradient(135deg, #3498db, #9b59b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }',
			'.hero-desc { color: #888; font-size: 16px; max-width: 500px; margin: 0 auto; }',

			// Status Cards
			'.status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }',
			'.status-card { display: flex; align-items: center; gap: 15px; padding: 20px; background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; }',
			'.status-card.active { border-color: rgba(46,204,113,0.5); }',
			'.status-card.inactive { border-color: rgba(231,76,60,0.3); }',
			'.status-icon { font-size: 32px; }',
			'.status-label { font-size: 12px; color: #888; }',
			'.status-value { font-size: 18px; font-weight: 600; color: #fff; }',

			// Actions
			'.actions-section { margin-bottom: 30px; }',
			'.actions-section h2 { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 15px; color: #fff; }',
			'.actions-grid { display: flex; gap: 10px; flex-wrap: wrap; }',
			'.action-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 14px; }',
			'.action-btn:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }',
			'.action-btn.primary { background: linear-gradient(135deg, #3498db, #2980b9); border-color: #3498db; }',
			'.action-btn.primary:hover { background: linear-gradient(135deg, #2980b9, #1a5276); }',

			// Services
			'.services-section { margin-bottom: 30px; }',
			'.services-section h2 { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 15px; color: #fff; }',
			'.services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }',
			'.service-card { background: rgba(30,30,50,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; transition: all 0.2s; }',
			'.service-card:hover { border-color: rgba(52,152,219,0.5); transform: translateY(-3px); }',
			'.service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }',
			'.service-icon { font-size: 28px; }',
			'.service-status { font-size: 12px; padding: 4px 10px; border-radius: 12px; }',
			'.service-status.running { background: rgba(46,204,113,0.2); color: #2ecc71; }',
			'.service-status.stopped { background: rgba(231,76,60,0.2); color: #e74c3c; }',
			'.service-name { font-size: 18px; font-weight: 600; margin: 0 0 5px; color: #fff; }',
			'.service-category { font-size: 12px; color: #888; margin-bottom: 15px; }',
			'.service-urls { display: flex; flex-direction: column; gap: 8px; }',
			'.url-item { display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 8px; }',
			'.url-icon { font-size: 14px; }',
			'.url-item a { color: #3498db; text-decoration: none; }',
			'.url-item a:hover { text-decoration: underline; }',
			'.onion-url { color: #9b59b6; font-family: monospace; font-size: 11px; }',

			// Empty State
			'.empty-state { text-align: center; padding: 60px 20px; background: rgba(30,30,50,0.4); border-radius: 16px; }',
			'.empty-icon { font-size: 64px; opacity: 0.5; margin-bottom: 20px; }',
			'.empty-state h3 { font-size: 24px; margin: 0 0 10px; color: #fff; }',
			'.empty-state p { color: #888; margin: 0 0 20px; }',

			// Features
			'.features-section { margin-bottom: 30px; padding: 25px; background: rgba(30,30,50,0.4); border-radius: 16px; }',
			'.features-section h2 { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 20px; color: #fff; }',
			'.features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }',
			'.feature-item { display: flex; align-items: center; gap: 10px; padding: 12px 15px; background: rgba(0,0,0,0.3); border-radius: 10px; font-size: 13px; }',
			'.feature-icon { font-size: 18px; }',

			// Settings
			'.settings-section { padding: 25px; background: rgba(30,30,50,0.4); border-radius: 16px; }',
			'.settings-section h2 { display: flex; align-items: center; gap: 10px; font-size: 20px; margin: 0 0 20px; color: #fff; }',
			'.settings-grid { display: flex; flex-direction: column; gap: 15px; }',
			'.setting-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; }',
			'.setting-label { display: flex; align-items: center; gap: 10px; }',
			'.setting-value { font-family: monospace; font-size: 12px; padding: 5px 10px; background: rgba(0,0,0,0.3); border-radius: 5px; color: #888; }',

			// Toggle Switch
			'.toggle-switch { position: relative; width: 50px; height: 26px; }',
			'.toggle-switch input { opacity: 0; width: 0; height: 0; }',
			'.toggle-slider { position: absolute; inset: 0; background: rgba(255,255,255,0.1); border-radius: 13px; cursor: pointer; transition: 0.3s; }',
			'.toggle-slider::before { content: ""; position: absolute; width: 20px; height: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }',
			'.toggle-switch input:checked + .toggle-slider { background: #2ecc71; }',
			'.toggle-switch input:checked + .toggle-slider::before { transform: translateX(24px); }',

			// Theme Selector
			'.theme-selector { display: flex; align-items: center; gap: 10px; }',
			'.theme-select { padding: 10px 15px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 14px; cursor: pointer; min-width: 200px; }',
			'.theme-select:hover { border-color: rgba(52,152,219,0.5); }',
			'.theme-select:focus { outline: none; border-color: #3498db; }',
			'.theme-select option { background: #1a1a2e; color: #fff; padding: 10px; }'
		].join('\n');
	}
});
