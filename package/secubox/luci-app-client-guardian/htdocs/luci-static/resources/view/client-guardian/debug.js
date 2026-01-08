'use strict';
'require view';

'require dom';
'require ui';
'require uci';
'require rpc';
'require client-guardian/debug as Debug';

var callGetLogs = rpc.declare({
	object: 'luci.client-guardian',
	method: 'logs',
	params: ['limit', 'level'],
	expect: { logs: [] }
});

return view.extend({
	load: function() {
		return Promise.all([
			Debug.init(),
			uci.load('client-guardian'),
			callGetLogs(100, 'debug')
		]);
	},

	render: function(data) {
		var backendLogs = data[2].logs || [];
		var self = this;

		var debugEnabled = uci.get('client-guardian', 'config', 'debug_enabled') === '1';
		var debugLevel = uci.get('client-guardian', 'config', 'debug_level') || 'INFO';

		return E('div', { 'class': 'client-guardian-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('client-guardian/dashboard.css') }),

			E('div', { 'class': 'cg-header' }, [
				E('div', { 'class': 'cg-logo' }, [
					E('div', { 'class': 'cg-logo-icon' }, '🐛'),
					E('div', { 'class': 'cg-logo-text' }, 'Mode Debug')
				]),
				E('div', { 'class': 'cg-debug-controls' }, [
					E('button', {
						'class': 'cg-btn cg-btn-sm',
						'click': L.bind(this.handleRefreshLogs, this)
					}, '🔄 Actualiser'),
					E('button', {
						'class': 'cg-btn cg-btn-sm',
						'click': L.bind(this.handleClearLogs, this)
					}, '🗑️ Effacer'),
					E('button', {
						'class': 'cg-btn cg-btn-sm cg-btn-primary',
						'click': L.bind(this.handleDownloadLogs, this)
					}, '💾 Télécharger')
				])
			]),

			// Debug Status Card
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '⚙️'),
						'Configuration Debug'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-debug-status-grid' }, [
						E('div', { 'class': 'cg-debug-status-item' }, [
							E('div', { 'class': 'cg-debug-status-label' }, 'Mode Debug'),
							E('div', { 'class': 'cg-debug-status-value' }, [
								E('span', {
									'class': 'cg-status-badge ' + (debugEnabled ? 'approved' : 'offline')
								}, [
									E('span', { 'class': 'cg-status-dot' }),
									debugEnabled ? 'Activé' : 'Désactivé'
								]),
								E('button', {
									'class': 'cg-btn cg-btn-sm',
									'style': 'margin-left: 8px',
									'click': L.bind(this.handleToggleDebug, this, !debugEnabled)
								}, debugEnabled ? 'Désactiver' : 'Activer')
							])
						]),
						E('div', { 'class': 'cg-debug-status-item' }, [
							E('div', { 'class': 'cg-debug-status-label' }, 'Niveau de Log'),
							E('select', {
								'class': 'cg-input cg-input-sm',
								'id': 'debug-level-select',
								'value': debugLevel,
								'change': L.bind(this.handleChangeLevel, this)
							}, [
								E('option', { 'value': 'ERROR' }, 'ERROR'),
								E('option', { 'value': 'WARN' }, 'WARN'),
								E('option', { 'value': 'INFO', 'selected': debugLevel === 'INFO' }, 'INFO'),
								E('option', { 'value': 'DEBUG' }, 'DEBUG'),
								E('option', { 'value': 'TRACE' }, 'TRACE')
							])
						]),
						E('div', { 'class': 'cg-debug-status-item' }, [
							E('div', { 'class': 'cg-debug-status-label' }, 'Logs Backend'),
							E('div', { 'class': 'cg-debug-status-value' }, backendLogs.length + ' entrées')
						]),
						E('div', { 'class': 'cg-debug-status-item' }, [
							E('div', { 'class': 'cg-debug-status-label' }, 'Logs Frontend'),
							E('div', { 'class': 'cg-debug-status-value' }, Debug.getLogs().length + ' entrées')
						])
					])
				])
			]),

			// System Information
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, 'ℹ️'),
						'Informations Système'
					])
				]),
				E('div', { 'class': 'cg-card-body' }, [
					this.renderSystemInfo(Debug.getSystemInfo())
				])
			]),

			// Backend Logs
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '📋'),
						'Logs Backend RPCD'
					]),
					E('span', { 'class': 'cg-card-badge' }, backendLogs.length + ' entrées')
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-log-container', 'id': 'backend-logs' },
						backendLogs.length > 0 ?
							backendLogs.map(L.bind(this.renderLogEntry, this)) :
							E('div', { 'class': 'cg-empty-state' }, [
								E('div', { 'class': 'cg-empty-state-icon' }, '📝'),
								E('div', { 'class': 'cg-empty-state-title' }, 'Aucun log backend'),
								E('div', { 'class': 'cg-empty-state-text' }, 'Les logs du serveur apparaîtront ici')
							])
					)
				])
			]),

			// Frontend Console Logs
			E('div', { 'class': 'cg-card' }, [
				E('div', { 'class': 'cg-card-header' }, [
					E('div', { 'class': 'cg-card-title' }, [
						E('span', { 'class': 'cg-card-title-icon' }, '💻'),
						'Logs Frontend Console'
					]),
					E('span', { 'class': 'cg-card-badge' }, Debug.getLogs().length + ' entrées')
				]),
				E('div', { 'class': 'cg-card-body' }, [
					E('div', { 'class': 'cg-log-container', 'id': 'frontend-logs' },
						Debug.getLogs().length > 0 ?
							Debug.getLogs().reverse().slice(0, 100).map(L.bind(this.renderLogEntry, this)) :
							E('div', { 'class': 'cg-empty-state' }, [
								E('div', { 'class': 'cg-empty-state-icon' }, '🖥️'),
								E('div', { 'class': 'cg-empty-state-title' }, 'Aucun log frontend'),
								E('div', { 'class': 'cg-empty-state-text' }, 'Les logs du navigateur apparaîtront ici')
							])
					)
				])
			])
		]);
	},

	renderSystemInfo: function(info) {
		return E('div', { 'class': 'cg-system-info-grid' }, [
			this.renderInfoItem('Navigateur', info.userAgent),
			this.renderInfoItem('Plateforme', info.platform),
			this.renderInfoItem('Langue', info.language),
			this.renderInfoItem('Résolution', info.screenResolution),
			this.renderInfoItem('Fenêtre', info.windowSize),
			this.renderInfoItem('Cookies', info.cookiesEnabled ? 'Activés' : 'Désactivés'),
			this.renderInfoItem('Connexion', info.onLine ? 'En ligne' : 'Hors ligne'),
			this.renderInfoItem('Fuseau horaire', info.timezone),
			this.renderInfoItem('Mémoire JS', typeof info.memory === 'object' ?
				'Utilisée: ' + info.memory.usedJSHeapSize + ' / Limite: ' + info.memory.jsHeapSizeLimit :
				info.memory
			)
		]);
	},

	renderInfoItem: function(label, value) {
		return E('div', { 'class': 'cg-info-item' }, [
			E('div', { 'class': 'cg-info-label' }, label + ':'),
			E('div', { 'class': 'cg-info-value' }, value)
		]);
	},

	renderLogEntry: function(log) {
		var levelClass = 'cg-log-' + (log.level || 'info').toLowerCase();
		var levelIcon = {
			'ERROR': '🚨',
			'WARN': '⚠️',
			'INFO': 'ℹ️',
			'DEBUG': '🐛',
			'TRACE': '🔍'
		}[log.level] || 'ℹ️';

		return E('div', { 'class': 'cg-log-entry ' + levelClass }, [
			E('div', { 'class': 'cg-log-header' }, [
				E('span', { 'class': 'cg-log-icon' }, levelIcon),
				E('span', { 'class': 'cg-log-level' }, log.level || 'INFO'),
				E('span', { 'class': 'cg-log-time' }, log.timestamp || new Date().toISOString())
			]),
			E('div', { 'class': 'cg-log-message' }, log.message),
			log.data && Object.keys(log.data).length > 0 ?
				E('details', { 'class': 'cg-log-details' }, [
					E('summary', {}, 'Données additionnelles'),
					E('pre', { 'class': 'cg-log-data' }, JSON.stringify(log.data, null, 2))
				]) :
				E('span')
		]);
	},

	handleToggleDebug: function(enabled, ev) {
		uci.set('client-guardian', 'config', 'debug_enabled', enabled ? '1' : '0');
		uci.save().then(L.bind(function() {
			return uci.apply();
		}, this)).then(L.bind(function() {
			ui.addNotification(null, E('p', {}, 'Mode debug ' + (enabled ? 'activé' : 'désactivé')), 'success');
			Debug.setEnabled(enabled);
			location.reload();
		}, this));
	},

	handleChangeLevel: function(ev) {
		var level = ev.target.value;
		uci.set('client-guardian', 'config', 'debug_level', level);
		uci.save().then(L.bind(function() {
			return uci.apply();
		}, this)).then(L.bind(function() {
			ui.addNotification(null, E('p', {}, 'Niveau de debug changé: ' + level), 'success');
			Debug.setLevel(level);
		}, this));
	},

	handleRefreshLogs: function(ev) {
		location.reload();
	},

	handleClearLogs: function(ev) {
		Debug.clearLogs();
		ui.addNotification(null, E('p', {}, 'Logs frontend effacés'), 'success');
		location.reload();
	},

	handleDownloadLogs: function(ev) {
		Debug.downloadLogs();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
