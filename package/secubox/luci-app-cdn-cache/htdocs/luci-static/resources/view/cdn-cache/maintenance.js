'use strict';
'require view';
'require rpc';
'require ui';
'require cdn-cache/nav as CdnNav';
'require secubox/kiss-theme';

var callPurgeCache = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_cache'
});

var callPurgeExpired = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_expired'
});

var callPreloadUrl = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'preload_url',
	params: ['url']
});

var callClearStats = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'clear_stats'
});

var callRestart = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'restart'
});

var callLogs = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'logs',
	params: ['count'],
	expect: { logs: [] }
});

return view.extend({
	load: function() {
		return callLogs(100);
	},

	render: function(data) {
		var logs = data.logs || [];
		var self = this;

		return KissTheme.wrap([
			E('div', { 'class': 'cbi-map cdn-maintenance' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/common.css') }),
			E('style', {}, `
				.cdn-maintenance { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
				.cdn-page-header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
				.cdn-page-title { font-size: 24px; font-weight: 700; margin: 0; }
				.cdn-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 24px; }
				.cdn-action-card { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; }
				.cdn-action-icon { font-size: 36px; margin-bottom: 12px; }
				.cdn-action-title { font-size: 18px; font-weight: 600; color: #f1f5f9; margin-bottom: 8px; }
				.cdn-action-desc { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
				.cdn-btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; width: 100%; }
				.cdn-btn-primary { background: #06b6d4; color: white; }
				.cdn-btn-primary:hover { background: #0891b2; }
				.cdn-btn-warning { background: #f59e0b; color: white; }
				.cdn-btn-warning:hover { background: #d97706; }
				.cdn-btn-danger { background: #ef4444; color: white; }
				.cdn-btn-danger:hover { background: #dc2626; }
				.cdn-btn-success { background: #22c55e; color: white; }
				.cdn-btn-success:hover { background: #16a34a; }
				.cdn-section { background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; margin-bottom: 24px; }
				.cdn-section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
				.cdn-input-group { display: flex; gap: 12px; margin-bottom: 16px; }
				.cdn-input { flex: 1; padding: 12px 16px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #f1f5f9; font-size: 14px; }
				.cdn-input:focus { outline: none; border-color: #06b6d4; }
				.cdn-logs { background: #0f172a; border-radius: 8px; padding: 16px; max-height: 400px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; }
				.cdn-log-line { color: #94a3b8; padding: 2px 0; }
				.cdn-log-line:hover { background: rgba(6,182,212,0.1); }
			`),

			CdnNav.renderTabs('maintenance'),

			E('div', { 'class': 'cdn-page-header' }, [
				E('h2', { 'class': 'cdn-page-title' }, '🔧 Maintenance')
			]),

			E('div', { 'class': 'cdn-actions-grid' }, [
				E('div', { 'class': 'cdn-action-card' }, [
					E('div', { 'class': 'cdn-action-icon' }, '🗑️'),
					E('div', { 'class': 'cdn-action-title' }, 'Purger le Cache'),
					E('div', { 'class': 'cdn-action-desc' }, 'Supprimer tous les fichiers en cache. Cette action est irréversible.'),
					E('button', {
						'class': 'cdn-btn cdn-btn-danger',
						'click': function() {
							ui.showModal('Confirmer la purge', [
								E('p', {}, 'Êtes-vous sûr de vouloir supprimer tout le cache ?'),
								E('p', { 'style': 'color: #f59e0b;' }, '⚠️ Cette action est irréversible !'),
								E('div', { 'class': 'right' }, [
									E('button', { 'class': 'btn', 'click': ui.hideModal }, 'Annuler'),
									' ',
									E('button', {
										'class': 'kiss-btn kiss-btn-red',
										'click': function() {
											callPurgeCache().then(function(res) {
												ui.hideModal();
												ui.addNotification(null, E('p', {}, 'Cache purgé avec succès'), 'success');
											});
										}
									}, 'Purger tout')
								])
							]);
						}
					}, 'Purger tout le cache')
				]),

				E('div', { 'class': 'cdn-action-card' }, [
					E('div', { 'class': 'cdn-action-icon' }, '🕐'),
					E('div', { 'class': 'cdn-action-title' }, 'Nettoyer les Expirés'),
					E('div', { 'class': 'cdn-action-desc' }, 'Supprimer uniquement les fichiers dont la durée de cache est dépassée.'),
					E('button', {
						'class': 'cdn-btn cdn-btn-warning',
						'click': function() {
							callPurgeExpired().then(function(res) {
								ui.addNotification(null, E('p', {}, res.deleted + ' fichiers expirés supprimés'), 'success');
							});
						}
					}, 'Nettoyer les expirés')
				]),

				E('div', { 'class': 'cdn-action-card' }, [
					E('div', { 'class': 'cdn-action-icon' }, '📊'),
					E('div', { 'class': 'cdn-action-title' }, 'Réinitialiser Stats'),
					E('div', { 'class': 'cdn-action-desc' }, 'Remettre à zéro tous les compteurs de statistiques.'),
					E('button', {
						'class': 'cdn-btn cdn-btn-warning',
						'click': function() {
							callClearStats().then(function() {
								ui.addNotification(null, E('p', {}, 'Statistiques réinitialisées'), 'success');
							});
						}
					}, 'Réinitialiser')
				]),

				E('div', { 'class': 'cdn-action-card' }, [
					E('div', { 'class': 'cdn-action-icon' }, '🔄'),
					E('div', { 'class': 'cdn-action-title' }, 'Redémarrer le Service'),
					E('div', { 'class': 'cdn-action-desc' }, 'Redémarrer le proxy cache pour appliquer les changements de configuration.'),
					E('button', {
						'class': 'cdn-btn cdn-btn-primary',
						'click': function() {
							callRestart().then(function() {
								ui.addNotification(null, E('p', {}, 'Service redémarré'), 'success');
							});
						}
					}, 'Redémarrer')
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-title' }, ['📥 ', 'Précharger une URL']),
				E('div', { 'class': 'cdn-input-group' }, [
					E('input', {
						'class': 'cdn-input',
						'type': 'url',
						'id': 'preload-url',
						'placeholder': 'https://example.com/file.exe'
					}),
					E('button', {
						'class': 'cdn-btn cdn-btn-success',
						'style': 'width: auto; padding: 12px 24px;',
						'click': function() {
							var url = document.getElementById('preload-url').value;
							if (url) {
								callPreloadUrl(url).then(function(res) {
									if (res.success) {
										ui.addNotification(null, E('p', {}, 'URL préchargée'), 'success');
									} else {
										ui.addNotification(null, E('p', {}, res.message), 'error');
									}
								});
							}
						}
					}, 'Précharger')
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-title' }, ['📋 ', 'Logs Récents']),
				E('div', { 'class': 'cdn-logs' },
					logs.length > 0 ? logs.map(function(line) {
						return E('div', { 'class': 'cdn-log-line' }, line);
					}) : E('div', { 'style': 'color: #64748b; text-align: center;' }, 'Aucun log disponible')
				)
			])
		])
		], 'admin/services/cdn-cache/maintenance');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
