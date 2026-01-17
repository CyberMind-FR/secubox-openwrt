'use strict';
'require view';
'require dom';
'require ui';
'require mmpm.api as api';

return view.extend({
	title: _('MMPM Modules'),

	load: function() {
		return Promise.all([
			api.getStatus(),
			api.listModules()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var modulesData = data[1] || {};
		var modules = modulesData.modules || [];

		var wrapper = E('div', { 'class': 'cbi-map', 'style': 'background: #0d0d12; min-height: 100vh; padding: 20px;' });

		wrapper.appendChild(E('style', {}, [
			'.mmpm-search { display: flex; gap: 12px; margin-bottom: 24px; }',
			'.mmpm-search input { flex: 1; padding: 12px 16px; background: #141419; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px; }',
			'.mmpm-search input:focus { outline: none; border-color: #f39c12; }',
			'.mmpm-btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }',
			'.mmpm-btn-primary { background: linear-gradient(135deg, #f39c12, #e67e22); color: white; }',
			'.mmpm-modules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }',
			'.mmpm-module-card { background: #141419; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; }',
			'.mmpm-module-name { font-size: 16px; font-weight: 600; color: #f39c12; margin-bottom: 8px; }',
			'.mmpm-module-desc { font-size: 13px; color: #a0a0b0; margin-bottom: 12px; line-height: 1.4; }',
			'.mmpm-module-actions { display: flex; gap: 8px; }',
			'.mmpm-btn-sm { padding: 8px 16px; font-size: 12px; }',
			'.mmpm-btn-danger { background: rgba(239,68,68,0.2); color: #ef4444; }',
			'.mmpm-btn-secondary { background: rgba(255,255,255,0.1); color: white; }',
			'.mmpm-section-title { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 16px; }',
			'.mmpm-empty { text-align: center; padding: 40px; color: #a0a0b0; }'
		].join('')));

		// Search section
		var searchInput = E('input', {
			'type': 'text',
			'placeholder': _('Search modules (e.g., weather, calendar, spotify)...'),
			'id': 'mmpm-search-input'
		});

		var searchBtn = E('button', {
			'class': 'mmpm-btn mmpm-btn-primary',
			'click': function() {
				var query = searchInput.value.trim();
				if (!query) return;

				ui.showModal(_('Searching'), [
					E('p', { 'class': 'spinning' }, _('Searching modules...'))
				]);

				api.searchModules(query).then(function(res) {
					ui.hideModal();
					// Display results...
					var results = res.modules || [];
					alert(_('Found %d modules').format(results.length));
				});
			}
		}, _('Search'));

		wrapper.appendChild(E('div', { 'class': 'mmpm-search' }, [searchInput, searchBtn]));

		// Installed modules
		wrapper.appendChild(E('div', { 'class': 'mmpm-section-title' }, _('Installed Modules')));

		if (modules.length === 0) {
			wrapper.appendChild(E('div', { 'class': 'mmpm-empty' }, [
				E('p', {}, _('No modules installed yet.')),
				E('p', {}, _('Use the search above or MMPM Web GUI to install modules.'))
			]));
		} else {
			var grid = E('div', { 'class': 'mmpm-modules-grid' });

			modules.forEach(function(mod) {
				var card = E('div', { 'class': 'mmpm-module-card' }, [
					E('div', { 'class': 'mmpm-module-name' }, mod.name || mod.title || 'Unknown'),
					E('div', { 'class': 'mmpm-module-desc' }, mod.description || ''),
					E('div', { 'class': 'mmpm-module-actions' }, [
						E('button', {
							'class': 'mmpm-btn mmpm-btn-sm mmpm-btn-secondary',
							'click': function() {
								api.upgradeModules(mod.name).then(function(res) {
									ui.addNotification(null, E('p', {}, res.message), res.success ? 'success' : 'error');
								});
							}
						}, _('Update')),
						E('button', {
							'class': 'mmpm-btn mmpm-btn-sm mmpm-btn-danger',
							'click': function() {
								if (confirm(_('Remove module %s?').format(mod.name))) {
									api.removeModule(mod.name).then(function(res) {
										if (res.success) window.location.reload();
										else ui.addNotification(null, E('p', {}, res.message), 'error');
									});
								}
							}
						}, _('Remove'))
					])
				]);
				grid.appendChild(card);
			});

			wrapper.appendChild(grid);
		}

		return wrapper;
	}
});
