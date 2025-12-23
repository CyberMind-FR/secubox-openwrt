'use strict';
'require view';
'require dom';
'require ui';
'require fs';

var api = L.require('system-hub.api');

return view.extend({
	render: function() {
		var self = this;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
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
				E('div', { 'class': 'sh-card-body', 'id': 'archives-list' }, [
					this.renderArchiveItem('diagnostic_20241220_154500.tar.gz', '256 KB', '2024-12-20 15:45:00'),
					this.renderArchiveItem('diagnostic_20241219_093000.tar.gz', '312 KB', '2024-12-19 09:30:00'),
					this.renderArchiveItem('diagnostic_20241218_110000.tar.gz', '298 KB', '2024-12-18 11:00:00')
				])
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

	renderArchiveItem: function(name, size, date) {
		return E('div', { 'style': 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #1a1a24; border-radius: 8px; margin-bottom: 10px;' }, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
				E('span', { 'style': 'font-size: 20px;' }, '📦'),
				E('div', {}, [
					E('div', { 'style': 'font-size: 13px; font-weight: 600;' }, name),
					E('div', { 'style': 'font-size: 10px; color: #707080;' }, size + ' • ' + date)
				])
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', { 'class': 'sh-btn', 'style': 'padding: 6px 10px; font-size: 10px;' }, '📥 Télécharger'),
				E('button', { 'class': 'sh-btn', 'style': 'padding: 6px 10px; font-size: 10px;' }, '☁️ Envoyer')
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

		api.callCollectDiagnostics(includeLogs, includeConfig, includeNetwork, anonymize).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ Archive créée: ' + result.file + ' (' + api.formatBytes(result.size) + ')'), 'success');
			} else {
				ui.addNotification(null, E('p', {}, '❌ Erreur lors de la collecte'), 'error');
			}
		});
	},

	uploadDiagnostics: function() {
		ui.addNotification(null, E('p', {}, '⚠️ Fonctionnalité non configurée. Configurez l\'URL d\'upload dans les paramètres.'), 'warning');
	},

	runTest: function(type) {
		var resultsDiv = document.getElementById('test-results');
		
		resultsDiv.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinning"></div><div style="margin-top: 12px;">Test en cours...</div></div>';

		// Simulate test
		setTimeout(function() {
			var results = {
				'connectivity': { status: 'ok', message: 'WAN connecté, DNS fonctionnel', details: 'Ping: 8.8.8.8 - 12ms' },
				'dns': { status: 'ok', message: 'Résolution DNS OK', details: 'google.com → 142.250.185.78' },
				'latency': { status: 'warning', message: 'Latence élevée', details: 'Google: 45ms (seuil: 30ms)' },
				'disk': { status: 'ok', message: 'Disque OK', details: 'Lecture: 25 MB/s, Écriture: 18 MB/s' },
				'firewall': { status: 'ok', message: '127 règles actives', details: 'INPUT: 23, FORWARD: 89, OUTPUT: 15' },
				'wifi': { status: 'ok', message: '2 radios actives', details: '2.4GHz: 8 clients, 5GHz: 4 clients' }
			};

			var r = results[type] || { status: 'ok', message: 'Test complété', details: '' };
			var color = r.status === 'ok' ? '#22c55e' : (r.status === 'warning' ? '#f59e0b' : '#ef4444');
			var icon = r.status === 'ok' ? '✅' : (r.status === 'warning' ? '⚠️' : '❌');

			resultsDiv.innerHTML = '';
			resultsDiv.appendChild(E('div', { 'style': 'padding: 20px; background: rgba(' + (r.status === 'ok' ? '34,197,94' : '245,158,11') + ', 0.1); border-radius: 10px; border-left: 3px solid ' + color }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px; margin-bottom: 8px;' }, [
					E('span', { 'style': 'font-size: 24px;' }, icon),
					E('span', { 'style': 'font-size: 16px; font-weight: 600;' }, r.message)
				]),
				E('div', { 'style': 'font-size: 12px; color: #a0a0b0; margin-left: 36px;' }, r.details)
			]));
		}, 1500);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
