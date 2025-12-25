'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require client-guardian/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.listSessions(),
			API.getPolicy(),
			API.getStatus()
		]);
	},

	render: function(data) {
		var sessions = data[0] || {};
		var policy = data[1] || {};
		var status = data[2] || {};

		var sessionList = sessions.sessions || [];
		var nds = sessions.nodogsplash || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Captive Portal Management')),

			// Nodogsplash Status Card
			E('div', { 'class': 'cbi-section', 'style': 'background: ' + (nds.running ? '#d4edda' : '#f8d7da') + '; border-left: 4px solid ' + (nds.running ? '#28a745' : '#dc3545') + '; padding: 1em; margin-bottom: 1em;' }, [
				E('h3', { 'style': 'margin-top: 0;' }, _('Nodogsplash Status')),
				E('div', { 'style': 'display: flex; gap: 2em; align-items: center;' }, [
					E('div', {}, [
						E('strong', {}, _('Service:')),
						' ',
						E('span', { 'class': 'badge', 'style': 'background: ' + (nds.running ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;' },
							nds.running ? _('RUNNING') : _('STOPPED'))
					]),
					E('div', {}, [
						E('strong', {}, _('Active Sessions:')),
						' ',
						E('span', { 'style': 'font-size: 1.5em; color: #0088cc; font-weight: bold;' }, sessionList.length.toString())
					]),
					E('div', {}, [
						E('strong', {}, _('Default Policy:')),
						' ',
						E('span', { 'class': 'badge', 'style': 'background: #0088cc; color: white; padding: 0.25em 0.6em; border-radius: 3px;' },
							policy.default_policy || 'captive')
					])
				]),
				!nds.running ? E('p', { 'style': 'margin: 1em 0 0 0; color: #856404; background: #fff3cd; padding: 0.75em; border-radius: 4px;' }, [
					E('strong', {}, _('Note:')),
					' ',
					_('Nodogsplash is not running. Start the service to enable captive portal functionality.')
				]) : null
			]),

			// Active Sessions Table
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
					E('h3', { 'style': 'margin: 0;' }, _('Active Portal Sessions')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleRefresh, this)
					}, _('Refresh'))
				]),

				E('div', { 'class': 'table-wrapper' }, [
					E('table', { 'class': 'table', 'id': 'sessions-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('MAC Address')),
								E('th', {}, _('IP Address')),
								E('th', {}, _('Hostname')),
								E('th', {}, _('Duration')),
								E('th', { 'style': 'text-align: right;' }, _('Downloaded')),
								E('th', { 'style': 'text-align: right;' }, _('Uploaded')),
								E('th', {}, _('State')),
								E('th', { 'class': 'cbi-section-actions' }, _('Actions'))
							])
						]),
						E('tbody', { 'id': 'sessions-tbody' },
							this.renderSessionRows(sessionList)
						)
					])
				])
			]),

			// Help Section
			E('div', { 'class': 'cbi-section', 'style': 'background: #e8f4f8; padding: 1em; margin-top: 2em;' }, [
				E('h3', {}, _('Captive Portal Information')),
				E('p', {}, _('The captive portal intercepts new clients and requires them to authenticate before accessing the network. Sessions are managed by nodogsplash.')),
				E('ul', {}, [
					E('li', {}, _('Active sessions show clients currently authenticated through the portal')),
					E('li', {}, _('Use "Deauthorize" to end a session and force re-authentication')),
					E('li', {}, _('Configure portal settings in the Portal tab')),
					E('li', {}, _('Change default policy in Settings to control portal behavior'))
				])
			])
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return API.listSessions().then(L.bind(function(refreshData) {
				var tbody = document.getElementById('sessions-tbody');
				if (tbody) {
					var refreshedSessions = refreshData.sessions || [];
					dom.content(tbody, this.renderSessionRows(refreshedSessions));
				}
			}, this));
		}, this), 5);

		return view;
	},

	renderSessionRows: function(sessions) {
		if (!sessions || sessions.length === 0) {
			return E('tr', {}, [
				E('td', { 'colspan': 8, 'style': 'text-align: center; padding: 2em; color: #999;' },
					_('No active captive portal sessions'))
			]);
		}

		return sessions.map(L.bind(function(session) {
			return E('tr', {}, [
				E('td', {}, [
					E('code', { 'style': 'font-size: 0.9em;' }, session.mac || 'N/A')
				]),
				E('td', {}, session.ip || 'N/A'),
				E('td', {}, session.hostname || 'Unknown'),
				E('td', {}, this.formatDuration(session.duration || 0)),
				E('td', { 'style': 'text-align: right; font-family: monospace;' },
					this.formatBytes(session.downloaded || 0)),
				E('td', { 'style': 'text-align: right; font-family: monospace;' },
					this.formatBytes(session.uploaded || 0)),
				E('td', {}, [
					E('span', {
						'class': 'badge',
						'style': 'background: #28a745; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
					}, session.state || 'authenticated')
				]),
				E('td', { 'class': 'cbi-section-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-negative cbi-button-remove',
						'click': L.bind(function(ev) {
							this.handleDeauth(ev, session.mac, session.ip, session.hostname);
						}, this)
					}, _('Deauthorize'))
				])
			]);
		}, this));
	},

	formatDuration: function(seconds) {
		if (!seconds || seconds === 0) return '0s';

		var hours = Math.floor(seconds / 3600);
		var minutes = Math.floor((seconds % 3600) / 60);
		var secs = seconds % 60;

		var parts = [];
		if (hours > 0) parts.push(hours + 'h');
		if (minutes > 0) parts.push(minutes + 'm');
		if (secs > 0 || parts.length === 0) parts.push(secs + 's');

		return parts.join(' ');
	},

	formatBytes: function(bytes) {
		if (!bytes || bytes === 0) return '0 B';

		var units = ['B', 'KB', 'MB', 'GB'];
		var i = Math.floor(Math.log(bytes) / Math.log(1024));
		i = Math.min(i, units.length - 1);

		return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
	},

	handleDeauth: function(ev, mac, ip, hostname) {
		var btn = ev.target;

		ui.showModal(_('Deauthorize Client'), [
			E('p', {}, _('Are you sure you want to deauthorize this client?')),
			E('div', { 'style': 'background: #f8f9fa; padding: 1em; margin: 1em 0; border-radius: 4px;' }, [
				E('div', {}, [E('strong', {}, _('Hostname:')), ' ', hostname || 'Unknown']),
				E('div', {}, [E('strong', {}, _('MAC:')), ' ', E('code', {}, mac)]),
				E('div', {}, [E('strong', {}, _('IP:')), ' ', ip || 'N/A'])
			]),
			E('p', {}, _('The client will be immediately disconnected and must re-authenticate through the captive portal.')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button-negative',
					'click': L.bind(function() {
						ui.hideModal();
						this.deauthorize(mac, ip, btn);
					}, this)
				}, _('Deauthorize'))
			])
		]);
	},

	deauthorize: function(mac, ip, btn) {
		btn.disabled = true;
		btn.textContent = _('Deauthorizing...');

		API.deauthorizeClient(mac, ip).then(L.bind(function(result) {
			if (result.success) {
				ui.addNotification(null,
					E('p', _('Client %s has been deauthorized').format(mac)),
					'info'
				);

				// Refresh the table
				this.handleRefresh();
			} else {
				ui.addNotification(null,
					E('p', _('Failed to deauthorize client: %s').format(result.error || 'Unknown error')),
					'error'
				);
				btn.disabled = false;
				btn.textContent = _('Deauthorize');
			}
		}, this)).catch(function(err) {
			ui.addNotification(null,
				E('p', _('Error: %s').format(err.message || err)),
				'error'
			);
			btn.disabled = false;
			btn.textContent = _('Deauthorize');
		});
	},

	handleRefresh: function() {
		poll.start();

		return Promise.all([
			API.listSessions(),
			API.getPolicy()
		]).then(L.bind(function(data) {
			var tbody = document.getElementById('sessions-tbody');
			if (tbody) {
				var sessions = data[0].sessions || [];
				dom.content(tbody, this.renderSessionRows(sessions));
			}
		}, this));
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
