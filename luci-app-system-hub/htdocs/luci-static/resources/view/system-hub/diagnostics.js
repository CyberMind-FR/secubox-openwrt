'use strict';
'require view';
'require dom';
'require ui';
'require fs';
'require secubox-theme/theme as Theme';
'require system-hub/api as API';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	load: function() {
		return API.listDiagnostics();
	},

	render: function(data) {
		this.currentArchives = (data && data.archives) || [];
		var archives = this.currentArchives;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			HubNav.renderTabs('diagnostics'),
			
			// Collect Diagnostics
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🔍'), 'Collecte de Diagnostics' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					this.renderToggle('📋', 'Inclure les Logs', 'System log, kernel log, composants', true, 'diag_logs'),
					this.renderToggle('⚙️', 'Inclure la Configuration', 'network, wireless, firewall, dhcp', true, 'diag_config'),
					this.renderToggle('🌐', 'Inclure Infos Réseau', 'Interfaces, routes, connexions, ARP', true, 'diag_network'),
					this.renderToggle('🔐', 'Anonymiser les données', 'Masquer mots de passe et clés', true, 'diag_anonymize'),
					
					E('div', { 'class': 'sh-btn-group' }, [
						E('button', { 
							'class': 'sh-btn sh-btn-primary',
							'click': L.bind(this.collectDiagnostics, this)
						}, [ '📦 Générer Archive' ]),
						E('button', { 
							'class': 'sh-btn sh-btn-success',
							'click': L.bind(this.uploadDiagnostics, this)
						}, [ '☁️ Envoyer au Support' ])
					])
				])
			]),
			
			// Quick Tests
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🧪'), 'Tests Rapides' ])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;' }, [
						this.renderTestButton('🌐', 'Test Connectivité', 'Ping WAN & DNS', 'connectivity'),
						this.renderTestButton('📡', 'Test DNS', 'Résolution de noms', 'dns'),
						this.renderTestButton('⚡', 'Test Latence', 'Ping vers Google', 'latency'),
						this.renderTestButton('💾', 'Test Disque', 'Lecture/Écriture', 'disk'),
						this.renderTestButton('🔒', 'Test Firewall', 'Règles actives', 'firewall'),
						this.renderTestButton('📶', 'Test WiFi', 'Signal et clients', 'wifi')
					])
				])
			]),
			
			// Recent Archives
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📁'), 'Archives Récentes' ])
				]),
				E('div', { 'class': 'sh-card-body', 'id': 'archives-list' }, this.renderArchiveList(archives))
			]),
			
			// Test Results
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '📊'), 'Résultats des Tests' ])
				]),
				E('div', { 'class': 'sh-card-body', 'id': 'test-results' }, [
					E('div', { 'style': 'text-align: center; padding: 40px; color: #707080;' }, [
						E('div', { 'style': 'font-size: 40px; margin-bottom: 12px;' }, '🧪'),
						E('div', {}, 'Lancez un test pour voir les résultats')
					])
				])
			])
		]);

		return view;
	},

	renderToggle: function(icon, label, desc, enabled, id) {
		return E('div', { 'class': 'sh-toggle' }, [
			E('div', { 'class': 'sh-toggle-info' }, [
				E('span', { 'class': 'sh-toggle-icon' }, icon),
				E('div', {}, [
					E('div', { 'class': 'sh-toggle-label' }, label),
					E('div', { 'class': 'sh-toggle-desc' }, desc)
				])
			]),
			E('div', { 
				'class': 'sh-toggle-switch' + (enabled ? ' active' : ''),
				'id': id,
				'click': function(ev) { ev.target.classList.toggle('active'); }
			})
		]);
	},

	renderTestButton: function(icon, label, desc, type) {
		var self = this;
		return E('button', { 
			'class': 'sh-btn',
			'style': 'flex-direction: column; height: auto; padding: 16px;',
			'click': function() { self.runTest(type); }
		}, [
			E('span', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, icon),
			E('span', { 'style': 'font-weight: 600;' }, label),
			E('span', { 'style': 'font-size: 10px; color: #707080;' }, desc)
		]);
	},

	renderArchiveList: function(archives) {
		if (!archives.length) {
			return [
				E('div', { 'style': 'text-align:center; color:#707080; padding:24px;' }, 'Aucune archive disponible')
			];
		}
		return archives.map(this.renderArchiveItem, this);
	},

	renderArchiveItem: function(archive) {
		var name = archive.name || '';
		var size = api.formatBytes(archive.size || 0);
		var date = archive.created_at || '';
		return E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #1a1a24; border-radius: 8px; margin-bottom: 10px;' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				E('span', { 'style': 'font-size: 20px;' }, '📦'),
				E('div', {}, [
					E('div', { 'style': 'font-size: 13px; font-weight: 600;' }, name),
					E('div', { 'style': 'font-size: 10px; color: #707080;' }, size + ' • ' + date)
				])
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', { 
					'class': 'sh-btn', 
					'style': 'padding: 6px 10px; font-size: 10px;',
					'click': L.bind(this.downloadArchive, this, name)
				}, '📥 Télécharger'),
				E('button', { 
					'class': 'sh-btn', 
					'style': 'padding: 6px 10px; font-size: 10px; background:#321616;',
					'click': L.bind(this.deleteArchive, this, name)
				}, '🗑️ Supprimer')
			])
		]);
	},

	collectDiagnostics: function() {
		var includeLogs = document.getElementById('diag_logs')?.classList.contains('active') || false;
		var includeConfig = document.getElementById('diag_config')?.classList.contains('active') || false;
		var includeNetwork = document.getElementById('diag_network')?.classList.contains('active') || false;
		var anonymize = document.getElementById('diag_anonymize')?.classList.contains('active') || false;

		ui.showModal(_('Collecte Diagnostics'), [
			E('p', {}, 'Collecte des informations de diagnostic...'),
			E('div', { 'class': 'spinning' })
		]);

		API.collectDiagnostics(includeLogs, includeConfig, includeNetwork, anonymize).then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ Archive créée: ' + result.file + ' (' + api.formatBytes(result.size) + ')'), 'success');
				this.refreshArchives();
			} else {
				ui.addNotification(null, E('p', {}, '❌ Erreur lors de la collecte'), 'error');
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	uploadDiagnostics: function() {
		var archives = this.currentArchives || [];
		if (!archives.length) {
			ui.addNotification(null, E('p', {}, 'Aucune archive à envoyer'), 'warning');
			return;
		}

		var latest = archives[0];
		ui.showModal(_('Upload Support'), [
			E('p', {}, 'Envoi de ' + latest.name + '…'),
			E('div', { 'class': 'spinning' })
		]);

		API.uploadDiagnostics(latest.name).then(function(result) {
			ui.hideModal();
			if (result && result.success) {
				ui.addNotification(null, E('p', {}, '☁️ Archive envoyée au support (' + (result.status || 'OK') + ')'), 'info');
			} else {
				ui.addNotification(null, E('p', {}, '❌ Upload impossible: ' + ((result && result.error) || 'Erreur inconnue')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	runTest: function(type) {
		var resultsDiv = document.getElementById('test-results');
		
		resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinning"></div><div style="margin-top: 12px;">Test en cours...</div></div>';
		API.runDiagnosticTest(type).then(function(result) {
			var color = result.success ? '#22c55e' : '#ef4444';
			var bg = result.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
			var icon = result.success ? '✅' : '❌';
			resultsDiv.innerHTML = '';
			resultsDiv.appendChild(E('div', { 'style': 'padding: 18px; border-radius: 10px; border-left: 3px solid ' + color + '; background: ' + bg }, [
				E('div', { 'style': 'display:flex; align-items:center; gap:10px;' }, [
					E('span', { 'style': 'font-size:24px;' }, icon),
					E('div', { 'style': 'font-weight:600;' }, (result.test || type) + ' - ' + (result.success ? 'Réussi' : 'Échec'))
				]),
				E('pre', { 'style': 'margin-top:12px; font-size:12px; white-space:pre-wrap;' }, result.output || '')
			]));
		}).catch(function(err) {
			resultsDiv.innerHTML = '';
			resultsDiv.appendChild(E('div', { 'class': 'sh-alert error' }, [
				E('div', { 'class': 'sh-alert-title' }, 'Erreur'),
				E('div', {}, err.message || err)
			]));
		});
	},

	downloadArchive: function(name) {
		ui.showModal(_('Téléchargement…'), [
			E('p', {}, 'Préparation de ' + name)
		]);

		API.downloadDiagnostic(name).then(function(result) {
			ui.hideModal();
			if (!result.success || !result.data) {
				ui.addNotification(null, E('p', {}, '❌ Téléchargement impossible'), 'error');
				return;
			}
			var link = document.createElement('a');
			link.href = 'data:application/gzip;base64,' + result.data;
			link.download = result.name || name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || err), 'error');
		});
	},

	deleteArchive: function(name) {
		if (!confirm(_('Supprimer ') + name + ' ?')) return;
		API.deleteDiagnostic(name).then(L.bind(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', {}, '🗑️ Archive supprimée'), 'info');
				this.refreshArchives();
			} else {
				ui.addNotification(null, E('p', {}, '❌ Suppression impossible'), 'error');
			}
		}, this));
	},

	refreshArchives: function() {
		API.listDiagnostics().then(L.bind(function(data) {
			this.currentArchives = data.archives || [];
			var list = document.getElementById('archives-list');
			if (!list) return;
			list.innerHTML = '';
			(this.renderArchiveList(this.currentArchives)).forEach(function(node) {
				list.appendChild(node);
			});
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
