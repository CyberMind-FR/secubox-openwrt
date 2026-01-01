'use strict';
'require view';
'require dom';
'require ui';
'require fs';
'require secubox-theme/theme as Theme';
'require system-hub/api as API';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/nav as HubNav';

var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: shLang });

return view.extend({
	load: function() {
		return Promise.all([
			API.listDiagnostics(),
			API.listDiagnosticProfiles()
		]);
	},

	render: function(data) {
		this.currentArchives = (data && data[0] && data[0].archives) || [];
		this.profiles = (data && data[1] && data[1].profiles) || [];
		this.selectedProfile = null;
		var archives = this.currentArchives;

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			HubNav.renderTabs('diagnostics'),

			// Profile Selector
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [
						E('span', { 'class': 'sh-card-title-icon' }, '📋'),
						'Profils de Diagnostic'
					])
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', {
						'class': 'profile-grid',
						'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;'
					}, this.renderProfileButtons()),
					E('div', {
						'id': 'profile-description',
						'class': 'sh-info-box',
						'style': 'display: none; padding: 0.75rem; background: rgba(66, 153, 225, 0.1); border-left: 3px solid #4299e1; border-radius: 4px;'
					})
				])
			]),

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
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🧪'), 'Tests Rapides' ]),
					E('div', { 'id': 'test-profile-info', 'style': 'font-size: 12px; color: #888; display: none;' })
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', {
						'id': 'quick-tests-grid',
						'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;'
					}, this.renderTestButtons(null))
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
		var size = API.formatBytes(archive.size || 0);
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

		API.collectDiagnostics(includeLogs, includeConfig, includeNetwork, anonymize, this.selectedProfile || 'manual').then(L.bind(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ Archive créée: ' + result.file + ' (' + API.formatBytes(result.size) + ')'), 'success');
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
			var color = result.success ? '#10b981' : '#ef4444';
			var bg = result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)';
			var textColor = result.success ? '#059669' : '#dc2626';
			var icon = result.success ? '✅' : '❌';
			resultsDiv.innerHTML = '';
			resultsDiv.appendChild(E('div', { 'style': 'padding: 20px; border-radius: 8px; border: 2px solid ' + color + '; background: ' + bg }, [
				E('div', { 'style': 'display:flex; align-items:center; gap:12px; margin-bottom: 16px;' }, [
					E('span', { 'style': 'font-size:28px;' }, icon),
					E('div', { 'style': 'font-weight:700; font-size:16px; color:' + textColor + ';' }, (result.test || type) + ' - ' + (result.success ? 'Réussi' : 'Échec'))
				]),
				E('pre', {
					'style': 'margin:0; padding:14px; font-size:13px; line-height:1.6; white-space:pre-wrap; background:rgba(0,0,0,0.3); border-radius:6px; color:#e0e0e0; font-family:monospace; overflow-x:auto;'
				}, result.output || 'Aucune sortie')
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

	// Mapping des tests avec leurs métadonnées
	testDefinitions: {
		'connectivity': { icon: '🌐', label: 'Test Connectivité', desc: 'Ping WAN & DNS' },
		'dns': { icon: '📡', label: 'Test DNS', desc: 'Résolution de noms' },
		'latency': { icon: '⚡', label: 'Test Latence', desc: 'Ping vers Google' },
		'disk': { icon: '💾', label: 'Test Disque', desc: 'Lecture/Écriture' },
		'firewall': { icon: '🔒', label: 'Test Firewall', desc: 'Règles actives' },
		'wifi': { icon: '📶', label: 'Test WiFi', desc: 'Signal et clients' }
	},

	renderTestButtons: function(profileTests) {
		var self = this;
		var testsToShow = [];

		if (profileTests) {
			// Filtrer selon les tests du profil
			testsToShow = profileTests.split(',').map(function(t) { return t.trim(); });
		} else {
			// Afficher tous les tests par défaut
			testsToShow = ['connectivity', 'dns', 'latency', 'disk', 'firewall', 'wifi'];
		}

		return testsToShow.map(function(testType) {
			var testDef = self.testDefinitions[testType];
			if (!testDef) return null;

			return E('button', {
				'class': 'sh-btn',
				'style': 'flex-direction: column; height: auto; padding: 16px;',
				'click': function() { self.runTest(testType); }
			}, [
				E('span', { 'style': 'font-size: 24px; margin-bottom: 8px;' }, testDef.icon),
				E('span', { 'style': 'font-weight: 600;' }, testDef.label),
				E('span', { 'style': 'font-size: 10px; color: #707080;' }, testDef.desc)
			]);
		}).filter(function(btn) { return btn !== null; });
	},

	updateQuickTests: function(profile) {
		var grid = document.getElementById('quick-tests-grid');
		var profileInfo = document.getElementById('test-profile-info');

		if (!grid) return;

		// Vider la grille
		grid.innerHTML = '';

		// Rendre les nouveaux boutons
		var buttons = this.renderTestButtons(profile ? profile.tests : null);
		buttons.forEach(function(btn) {
			grid.appendChild(btn);
		});

		// Mettre à jour l'info du profil
		if (profileInfo) {
			if (profile && profile.tests) {
				var testCount = profile.tests.split(',').length;
				profileInfo.textContent = '📋 ' + testCount + ' test(s) recommandé(s) pour ce profil';
				profileInfo.style.display = 'block';
			} else {
				profileInfo.style.display = 'none';
			}
		}
	},

	renderProfileButtons: function() {
		var self = this;
		return (this.profiles || []).map(function(profile) {
			return E('button', {
				'class': 'sh-btn sh-btn-secondary profile-btn',
				'data-profile': profile.name,
				'style': 'display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;',
				'click': L.bind(self.selectProfile, self, profile.name)
			}, [
				E('span', { 'style': 'font-size: 1.5rem;' }, profile.icon || '📋'),
				E('span', {}, profile.label || profile.name)
			]);
		});
	},

	selectProfile: function(profileName) {
		var self = this;

		// Highlight selected button
		document.querySelectorAll('.profile-btn').forEach(function(btn) {
			if (btn.dataset.profile === profileName) {
				btn.classList.add('active');
				btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
				btn.style.color = 'white';
			} else {
				btn.classList.remove('active');
				btn.style.background = '';
				btn.style.color = '';
			}
		});

		// Load profile config and update toggles
		API.getDiagnosticProfile(profileName).then(function(profile) {
			self.selectedProfile = profileName;

			// Update toggles to match profile
			self.setToggle('diag_logs', profile.include_logs);
			self.setToggle('diag_config', profile.include_config);
			self.setToggle('diag_network', profile.include_network);
			self.setToggle('diag_anonymize', profile.anonymize);

			// Show description
			var descBox = document.getElementById('profile-description');
			if (descBox) {
				descBox.style.display = 'block';
				descBox.textContent = '📝 ' + (profile.description || '');
			}

			// Update quick tests to show only relevant tests
			self.updateQuickTests(profile);
		});
	},

	setToggle: function(id, value) {
		var toggle = document.getElementById(id);
		if (toggle) {
			if (value == 1 || value === true) {
				toggle.classList.add('active');
			} else {
				toggle.classList.remove('active');
			}
		}
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
