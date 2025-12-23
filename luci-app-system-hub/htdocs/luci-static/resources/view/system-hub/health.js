'use strict';
'require view';
'require dom';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	load: function() {
		return api.callGetHealth();
	},

	render: function(data) {
		var health = data;
		var healthInfo = api.getHealthStatus(health.score || 0);
		var self = this;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// Global Score
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '💚'), 'Score de Santé Global' ]),
					E('div', { 'class': 'sh-card-badge' }, (health.score || 0) + '/100')
				]),
				E('div', { 'class': 'sh-card-body', 'style': 'text-align: center; padding: 40px;' }, [
					E('div', { 
						'class': 'sh-score-circle ' + healthInfo.status,
						'style': 'width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px; font-weight: 800;'
					}, (health.score || 0).toString()),
					E('div', { 'style': 'font-size: 20px; font-weight: 700; margin-bottom: 8px;' }, healthInfo.label),
					E('div', { 'style': 'color: #707080;' }, 'Dernière vérification : ' + (health.timestamp || 'N/A'))
				])
			]),
			
			// Detailed Metrics
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📊'), 'Métriques Détaillées' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-health-grid' }, [
						this.renderDetailedMetric('🔲', 'CPU', health.cpu?.usage || 0, health.cpu?.status, 'Load: ' + (health.cpu?.load_1m || 'N/A')),
						this.renderDetailedMetric('💾', 'Mémoire', health.memory?.usage || 0, health.memory?.status, api.formatBytes((health.memory?.used_kb || 0) * 1024) + ' utilisés'),
						this.renderDetailedMetric('💿', 'Stockage', health.disk?.usage || 0, health.disk?.status, api.formatBytes((health.disk?.used_kb || 0) * 1024) + ' utilisés'),
						this.renderDetailedMetric('🌡️', 'Température', health.temperature?.value || 0, health.temperature?.status, 'Zone 0: CPU'),
						this.renderDetailedMetric('🌐', 'Réseau WAN', health.network?.wan_up ? 100 : 0, health.network?.status, health.network?.wan_up ? 'Connecté' : 'Déconnecté'),
						this.renderDetailedMetric('⚙️', 'Services', ((health.services?.running || 0) / ((health.services?.running || 0) + (health.services?.failed || 0)) * 100) || 0, 
							health.services?.failed > 0 ? 'warning' : 'ok', 
							(health.services?.running || 0) + '/' + ((health.services?.running || 0) + (health.services?.failed || 0)) + ' actifs')
					])
				])
			]),
			
			// Recommendations
			health.recommendations && health.recommendations.length > 0 ? E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '💡'), 'Recommandations' ])
				]),
				E('div', { 'class': 'sh-card-body' }, 
					health.recommendations.map(function(rec) {
						return E('div', { 'style': 'display: flex; gap: 12px; align-items: flex-start; padding: 14px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; border-left: 3px solid #f59e0b; margin-bottom: 10px;' }, [
							E('span', { 'style': 'font-size: 24px;' }, '⚠️'),
							E('div', {}, rec)
						]);
					})
				)
			]) : E('span'),
			
			// Actions
			E('div', { 'class': 'sh-btn-group' }, [
				E('button', { 
					'class': 'sh-btn sh-btn-primary',
					'click': L.bind(this.generateReport, this)
				}, [ '📋 Générer Rapport' ]),
				E('button', { 'class': 'sh-btn' }, [ '📧 Envoyer par Email' ]),
				E('button', { 'class': 'sh-btn' }, [ '📥 Télécharger PDF' ])
			])
		]);

		return view;
	},

	renderDetailedMetric: function(icon, label, value, status, detail) {
		return E('div', { 'class': 'sh-health-metric' }, [
			E('div', { 'class': 'sh-metric-header' }, [
				E('div', { 'class': 'sh-metric-title' }, [ E('span', { 'class': 'sh-metric-icon' }, icon), label ]),
				E('div', { 'class': 'sh-metric-value ' + (status || 'ok') }, value + (label === 'Température' ? '°C' : '%'))
			]),
			E('div', { 'class': 'sh-progress-bar' }, [
				E('div', { 'class': 'sh-progress-fill ' + (status || 'ok'), 'style': 'width: ' + Math.min(value, 100) + '%' })
			]),
			E('div', { 'style': 'font-size: 10px; color: #707080; margin-top: 8px;' }, detail)
		]);
	},

	generateReport: function() {
		ui.showModal(_('Génération Rapport'), [
			E('p', {}, 'Génération du rapport de santé...'),
			E('div', { 'class': 'spinning' })
		]);

		api.callGenerateReport().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ Rapport généré: ' + result.file), 'success');
			} else {
				ui.addNotification(null, E('p', {}, '❌ Erreur lors de la génération'), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
