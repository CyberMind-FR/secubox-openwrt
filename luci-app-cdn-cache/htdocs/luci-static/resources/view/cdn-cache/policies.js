'use strict';
'require view';
'require rpc';
'require ui';
'require form';

var callPolicies = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'policies',
	expect: { policies: [] }
});

var callExclusions = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'exclusions',
	expect: { exclusions: [] }
});

var callRemovePolicy = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'remove_policy',
	params: ['id']
});

var callRemoveExclusion = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'remove_exclusion',
	params: ['id']
});

return view.extend({
	load: function() {
		return Promise.all([
			callPolicies(),
			callExclusions()
		]);
	},

	render: function(data) {
		var policies = data[0].policies || [];
		var exclusions = data[1].exclusions || [];

		return E('div', { 'class': 'cbi-map cdn-policies' }, [
			E('style', {}, `
				.cdn-policies { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
				.cdn-page-header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
				.cdn-page-title { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; }
				.cdn-section { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px; }
				.cdn-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
				.cdn-section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
				.cdn-policy-card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
				.cdn-policy-card.enabled { border-left: 3px solid #22c55e; }
				.cdn-policy-card.disabled { border-left: 3px solid #64748b; opacity: 0.7; }
				.cdn-policy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
				.cdn-policy-name { font-weight: 600; color: #f1f5f9; font-size: 15px; }
				.cdn-policy-status { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
				.cdn-policy-status.active { background: rgba(34,197,94,0.15); color: #22c55e; }
				.cdn-policy-status.inactive { background: rgba(100,116,139,0.15); color: #64748b; }
				.cdn-policy-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
				.cdn-policy-field { }
				.cdn-policy-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
				.cdn-policy-value { font-size: 13px; color: #94a3b8; }
				.cdn-tag { display: inline-block; background: rgba(6,182,212,0.15); color: #06b6d4; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
				.cdn-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
				.cdn-btn-primary { background: #06b6d4; color: white; }
				.cdn-btn-sm { padding: 4px 10px; font-size: 12px; }
				.cdn-btn-danger { background: transparent; color: #ef4444; border: 1px solid #ef4444; }
				.cdn-empty { text-align: center; padding: 40px; color: #64748b; }
			`),

			E('div', { 'class': 'cdn-page-header' }, [
				E('h2', { 'class': 'cdn-page-title' }, '📋 Policies de Cache'),
				E('p', { 'style': 'margin: 0; opacity: 0.9;' }, 'Règles de mise en cache par domaine et type de fichier')
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['✅ ', 'Policies Actives']),
					E('a', { 'href': '/cgi-bin/luci/admin/services/cdn-cache/settings', 'class': 'cdn-btn cdn-btn-primary cdn-btn-sm' }, '+ Ajouter')
				]),
				policies.length > 0 ? policies.map(function(p) {
					return E('div', { 'class': 'cdn-policy-card ' + (p.enabled ? 'enabled' : 'disabled') }, [
						E('div', { 'class': 'cdn-policy-header' }, [
							E('span', { 'class': 'cdn-policy-name' }, p.name),
							E('div', { 'style': 'display: flex; gap: 8px; align-items: center;' }, [
								E('span', { 'class': 'cdn-policy-status ' + (p.enabled ? 'active' : 'inactive') }, 
									p.enabled ? 'Actif' : 'Inactif'),
								E('button', {
									'class': 'cdn-btn cdn-btn-sm cdn-btn-danger',
									'click': function() {
										if (confirm('Supprimer cette policy ?')) {
											callRemovePolicy(p.id).then(function() {
												window.location.reload();
											});
										}
									}
								}, '🗑️')
							])
						]),
						E('div', { 'class': 'cdn-policy-details' }, [
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Domaines'),
								E('div', { 'class': 'cdn-policy-value' }, 
									p.domains.split(' ').map(function(d) {
										return E('span', { 'class': 'cdn-tag' }, d);
									})
								)
							]),
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Extensions'),
								E('div', { 'class': 'cdn-policy-value' }, 
									p.extensions.split(' ').map(function(e) {
										return E('span', { 'class': 'cdn-tag' }, '.' + e);
									})
								)
							]),
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Durée cache'),
								E('div', { 'class': 'cdn-policy-value' }, p.cache_time + ' minutes')
							]),
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Taille max'),
								E('div', { 'class': 'cdn-policy-value' }, p.max_size + ' MB')
							])
						])
					]);
				}) : E('div', { 'class': 'cdn-empty' }, 'Aucune policy configurée')
			]),

			E('div', { 'class': 'cdn-section' }, [
				E('div', { 'class': 'cdn-section-header' }, [
					E('div', { 'class': 'cdn-section-title' }, ['🚫 ', 'Exclusions']),
				]),
				exclusions.length > 0 ? exclusions.map(function(e) {
					return E('div', { 'class': 'cdn-policy-card ' + (e.enabled ? 'enabled' : 'disabled') }, [
						E('div', { 'class': 'cdn-policy-header' }, [
							E('span', { 'class': 'cdn-policy-name' }, e.name),
							E('button', {
								'class': 'cdn-btn cdn-btn-sm cdn-btn-danger',
								'click': function() {
									if (confirm('Supprimer cette exclusion ?')) {
										callRemoveExclusion(e.id).then(function() {
											window.location.reload();
										});
									}
								}
							}, '🗑️')
						]),
						E('div', { 'class': 'cdn-policy-details' }, [
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Domaines exclus'),
								E('div', { 'class': 'cdn-policy-value' }, e.domains)
							]),
							E('div', { 'class': 'cdn-policy-field' }, [
								E('div', { 'class': 'cdn-policy-label' }, 'Raison'),
								E('div', { 'class': 'cdn-policy-value' }, e.reason)
							])
						])
					]);
				}) : E('div', { 'class': 'cdn-empty' }, 'Aucune exclusion configurée')
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
