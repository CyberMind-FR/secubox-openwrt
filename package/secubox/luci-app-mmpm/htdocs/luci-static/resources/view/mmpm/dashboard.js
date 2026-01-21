'use strict';
'require view';
'require dom';
'require ui';
'require mmpm/api as api';

return view.extend({
	title: _('MMPM Dashboard'),

	load: function() {
		return api.getStatus();
	},

	render: function(status) {
		var self = this;
		status = status || {};

		var wrapper = E('div', { 'class': 'cbi-map', 'style': 'background: #0d0d12; min-height: 100vh; padding: 20px;' });

		// Styles
		wrapper.appendChild(E('style', {}, [
			':root { --mmpm-primary: #f39c12; --mmpm-secondary: #e67e22; }',
			'.mmpm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, rgba(243,156,18,0.1), rgba(230,126,34,0.05)); border-radius: 16px; border: 1px solid rgba(243,156,18,0.2); }',
			'.mmpm-logo { font-size: 48px; }',
			'.mmpm-title { font-size: 28px; font-weight: 700; color: #fff; }',
			'.mmpm-subtitle { color: #a0a0b0; font-size: 14px; }',
			'.mmpm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }',
			'.mmpm-card { background: #141419; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }',
			'.mmpm-stat { text-align: center; }',
			'.mmpm-stat-value { font-size: 32px; font-weight: 700; color: #f39c12; }',
			'.mmpm-stat-label { font-size: 12px; color: #a0a0b0; margin-top: 4px; }',
			'.mmpm-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }',
			'.mmpm-status-running { background: rgba(34,197,94,0.15); color: #22c55e; }',
			'.mmpm-status-stopped { background: rgba(239,68,68,0.15); color: #ef4444; }',
			'.mmpm-status-notinstalled { background: rgba(161,161,170,0.15); color: #a1a1aa; }',
			'.mmpm-btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }',
			'.mmpm-btn-primary { background: linear-gradient(135deg, #f39c12, #e67e22); color: white; }',
			'.mmpm-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(243,156,18,0.3); }',
			'.mmpm-btn-secondary { background: rgba(255,255,255,0.1); color: white; }',
			'.mmpm-btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }',
			'.mmpm-btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }',
			'.mmpm-actions { display: flex; gap: 12px; flex-wrap: wrap; }',
			'.mmpm-section { margin-bottom: 24px; }',
			'.mmpm-section-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }'
		].join('')));

		// Header
		wrapper.appendChild(E('div', { 'class': 'mmpm-header' }, [
			E('div', { 'class': 'mmpm-logo' }, '📦'),
			E('div', {}, [
				E('div', { 'class': 'mmpm-title' }, 'MMPM'),
				E('div', { 'class': 'mmpm-subtitle' }, _('MagicMirror Package Manager'))
			])
		]));

		// Status badges
		var mm2Badge = status.mm2_running
			? E('span', { 'class': 'mmpm-status-badge mmpm-status-running' }, ['● ', _('MM2 Running')])
			: E('span', { 'class': 'mmpm-status-badge mmpm-status-stopped' }, ['○ ', _('MM2 Stopped')]);

		var mmpmBadge;
		if (!status.installed) {
			mmpmBadge = E('span', { 'class': 'mmpm-status-badge mmpm-status-notinstalled' }, ['○ ', _('Not Installed')]);
		} else if (status.gui_running) {
			mmpmBadge = E('span', { 'class': 'mmpm-status-badge mmpm-status-running' }, ['● ', _('GUI Running')]);
		} else {
			mmpmBadge = E('span', { 'class': 'mmpm-status-badge mmpm-status-stopped' }, ['○ ', _('GUI Stopped')]);
		}

		// Stats grid
		wrapper.appendChild(E('div', { 'class': 'mmpm-grid' }, [
			E('div', { 'class': 'mmpm-card' }, [
				E('div', { 'class': 'mmpm-stat' }, [
					mm2Badge,
					E('div', { 'class': 'mmpm-stat-label', 'style': 'margin-top: 8px;' }, _('MagicMirror2'))
				])
			]),
			E('div', { 'class': 'mmpm-card' }, [
				E('div', { 'class': 'mmpm-stat' }, [
					mmpmBadge,
					E('div', { 'class': 'mmpm-stat-label', 'style': 'margin-top: 8px;' }, _('MMPM Status'))
				])
			]),
			E('div', { 'class': 'mmpm-card' }, [
				E('div', { 'class': 'mmpm-stat' }, [
					E('div', { 'class': 'mmpm-stat-value' }, status.version || '-'),
					E('div', { 'class': 'mmpm-stat-label' }, _('Version'))
				])
			]),
			E('div', { 'class': 'mmpm-card' }, [
				E('div', { 'class': 'mmpm-stat' }, [
					E('div', { 'class': 'mmpm-stat-value' }, ':' + (status.port || 7891)),
					E('div', { 'class': 'mmpm-stat-label' }, _('GUI Port'))
				])
			])
		]));

		// Actions section
		var actionsSection = E('div', { 'class': 'mmpm-section' });
		actionsSection.appendChild(E('div', { 'class': 'mmpm-section-title' }, ['⚡ ', _('Actions')]));

		var actionsDiv = E('div', { 'class': 'mmpm-actions' });

		if (!status.installed) {
			// Install button
			actionsDiv.appendChild(E('button', {
				'class': 'mmpm-btn mmpm-btn-primary',
				'click': function() {
					ui.showModal(_('Installing MMPM'), [
						E('p', { 'class': 'spinning' }, _('Installing MMPM in MagicMirror2 container...'))
					]);
					api.installMmpm().then(function(res) {
						ui.hideModal();
						if (res.success) {
							ui.addNotification(null, E('p', {}, _('MMPM installed successfully')), 'success');
							window.location.reload();
						} else {
							ui.addNotification(null, E('p', {}, res.message || _('Installation failed')), 'error');
						}
					});
				}
			}, ['📥 ', _('Install MMPM')]));
		} else {
			// Start/Stop buttons
			if (status.gui_running) {
				actionsDiv.appendChild(E('button', {
					'class': 'mmpm-btn mmpm-btn-danger',
					'click': function() {
						api.serviceStop().then(function() {
							window.location.reload();
						});
					}
				}, ['⏹ ', _('Stop GUI')]));
			} else {
				actionsDiv.appendChild(E('button', {
					'class': 'mmpm-btn mmpm-btn-success',
					'click': function() {
						api.serviceStart().then(function() {
							window.location.reload();
						});
					}
				}, ['▶ ', _('Start GUI')]));
			}

			// Update button
			actionsDiv.appendChild(E('button', {
				'class': 'mmpm-btn mmpm-btn-secondary',
				'click': function() {
					ui.showModal(_('Updating MMPM'), [
						E('p', { 'class': 'spinning' }, _('Updating MMPM...'))
					]);
					api.updateMmpm().then(function(res) {
						ui.hideModal();
						if (res.success) {
							ui.addNotification(null, E('p', {}, _('MMPM updated')), 'success');
						} else {
							ui.addNotification(null, E('p', {}, res.message), 'error');
						}
					});
				}
			}, ['🔄 ', _('Update MMPM')]));

			// Open GUI button
			if (status.gui_running && status.web_url) {
				actionsDiv.appendChild(E('a', {
					'class': 'mmpm-btn mmpm-btn-primary',
					'href': status.web_url,
					'target': '_blank'
				}, ['🌐 ', _('Open Web GUI')]));
			}
		}

		actionsSection.appendChild(actionsDiv);
		wrapper.appendChild(actionsSection);

		// Quick links
		if (status.installed) {
			var linksSection = E('div', { 'class': 'mmpm-section' });
			linksSection.appendChild(E('div', { 'class': 'mmpm-section-title' }, ['🔗 ', _('Quick Links')]));
			linksSection.appendChild(E('div', { 'class': 'mmpm-actions' }, [
				E('a', {
					'class': 'mmpm-btn mmpm-btn-secondary',
					'href': L.url('admin', 'secubox', 'services', 'mmpm', 'modules')
				}, ['🧩 ', _('Manage Modules')]),
				E('a', {
					'class': 'mmpm-btn mmpm-btn-secondary',
					'href': L.url('admin', 'secubox', 'services', 'mmpm', 'settings')
				}, ['⚙️ ', _('Settings')]),
				E('a', {
					'class': 'mmpm-btn mmpm-btn-secondary',
					'href': L.url('admin', 'secubox', 'services', 'magicmirror2', 'dashboard')
				}, ['🪞 ', _('MagicMirror2')])
			]));
			wrapper.appendChild(linksSection);
		}

		return wrapper;
	}
});
