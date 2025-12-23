'use strict';
'require view';
'require poll';
'require rpc';
'require ui';

var callCacheList = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'cache_list',
	expect: { items: [] }
});

var callPurgeDomain = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'purge_domain',
	params: ['domain']
});

var callTopDomains = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'top_domains',
	expect: { domains: [] }
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatAge(seconds) {
	if (seconds < 60) return seconds + 's';
	if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
	if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
	return Math.floor(seconds / 86400) + 'j';
}

function getFileIcon(filename) {
	var ext = filename.split('.').pop().toLowerCase();
	var icons = {
		'exe': '⚙️', 'msi': '⚙️', 'deb': '📦', 'rpm': '📦',
		'js': '📜', 'css': '🎨', 'html': '📄',
		'png': '🖼️', 'jpg': '🖼️', 'gif': '🖼️', 'svg': '🖼️', 'webp': '🖼️',
		'woff': '🔤', 'woff2': '🔤', 'ttf': '🔤',
		'apk': '📱', 'ipa': '📱',
		'zip': '🗜️', 'tar': '🗜️', 'gz': '🗜️'
	};
	return icons[ext] || '📄';
}

return view.extend({
	load: function() {
		return Promise.all([
			callCacheList(),
			callTopDomains()
		]);
	},

	render: function(data) {
		var items = data[0].items || [];
		var domains = data[1].domains || [];
		var self = this;

		var view = E('div', { 'class': 'cbi-map cdn-cache-view' }, [
			E('style', {}, `
				.cdn-cache-view { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
				.cdn-page-header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
				.cdn-page-title { font-size: 24px; font-weight: 700; margin: 0; }
				.cdn-section { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px; }
				.cdn-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
				.cdn-section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
				.cdn-table { width: 100%; border-collapse: collapse; }
				.cdn-table th { text-align: left; padding: 12px; color: #94a3b8; font-weight: 500; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #334155; }
				.cdn-table td { padding: 12px; border-bottom: 1px solid #334155; color: #f1f5f9; font-size: 14px; }
				.cdn-table tr:hover { background: rgba(6,182,212,0.05); }
				.cdn-file-info { display: flex; align-items: center; gap: 10px; }
				.cdn-file-icon { font-size: 20px; }
				.cdn-file-name { font-weight: 500; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
				.cdn-domain-badge { background: rgba(6,182,212,0.15); color: #06b6d4; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
				.cdn-size { font-family: 'JetBrains Mono', monospace; color: #94a3b8; }
				.cdn-age { color: #64748b; font-size: 13px; }
				.cdn-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
				.cdn-btn-sm { padding: 4px 10px; font-size: 12px; }
				.cdn-btn-primary { background: #06b6d4; color: white; }
				.cdn-btn-primary:hover { background: #0891b2; }
				.cdn-btn-danger { background: #ef4444; color: white; }
				.cdn-btn-danger:hover { background: #dc2626; }
				.cdn-empty { text-align: center; padding: 40px; color: #64748b; }
				.cdn-domain-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
				.cdn-domain-card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; }
				.cdn-domain-card:hover { border-color: #06b6d4; }
				.cdn-domain-name { font-weight: 600; color: #f1f5f9; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
				.cdn-domain-stats { display: flex; gap: 16px; font-size: 13px; color: #94a3b8; }
			`),

			E('div', { 'class': 'cdn-page-header' }, [
				E('h2', { 'class': 'cdn-page-title' }, '💿 Cache Status'),
				E('div', {}, [
					E('span', { 'style': 'margin-right: 12px; opacity: 0.9;' }, items.length + ' objets en cache')
				])
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['🌐 ', 'Domaines en Cache']),
				]),
				E('div', { 'class': 'cdn-domain-grid' },
					domains.length > 0 ? domains.map(function(d) {
						return E('div', { 'class': 'cdn-domain-card' }, [
							E('div', { 'class': 'cdn-domain-name' }, [
								E('span', {}, d.domain),
								E('button', {
									'class': 'cdn-btn cdn-btn-sm cdn-btn-danger',
									'click': function() {
										ui.showModal('Purger le domaine', [
											E('p', {}, 'Supprimer tout le cache pour ' + d.domain + ' ?'),
											E('div', { 'class': 'right' }, [
												E('button', {
													'class': 'btn',
													'click': ui.hideModal
												}, 'Annuler'),
												' ',
												E('button', {
													'class': 'btn cbi-button-negative',
													'click': function() {
														callPurgeDomain(d.domain).then(function() {
															ui.hideModal();
															window.location.reload();
														});
													}
												}, 'Purger')
											])
										]);
									}
								}, '🗑️')
							]),
							E('div', { 'class': 'cdn-domain-stats' }, [
								E('span', {}, '📁 ' + d.files + ' fichiers'),
								E('span', {}, '💾 ' + formatBytes(d.size_kb * 1024))
							])
						]);
					}) : [E('div', { 'class': 'cdn-empty' }, 'Aucun domaine en cache')]
				)
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['📄 ', 'Fichiers Récents']),
				]),
				items.length > 0 ? E('table', { 'class': 'cdn-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, 'Fichier'),
							E('th', {}, 'Domaine'),
							E('th', {}, 'Taille'),
							E('th', {}, 'Âge')
						])
					]),
					E('tbody', {}, items.slice(0, 50).map(function(item) {
						return E('tr', {}, [
							E('td', {}, [
								E('div', { 'class': 'cdn-file-info' }, [
									E('span', { 'class': 'cdn-file-icon' }, getFileIcon(item.filename)),
									E('span', { 'class': 'cdn-file-name', 'title': item.filename }, item.filename)
								])
							]),
							E('td', {}, [
								E('span', { 'class': 'cdn-domain-badge' }, item.domain || 'unknown')
							]),
							E('td', { 'class': 'cdn-size' }, formatBytes(item.size)),
							E('td', { 'class': 'cdn-age' }, formatAge(item.age))
						]);
					}))
				]) : E('div', { 'class': 'cdn-empty' }, [
					E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '📭'),
					E('div', {}, 'Le cache est vide')
				])
			])
		]);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
