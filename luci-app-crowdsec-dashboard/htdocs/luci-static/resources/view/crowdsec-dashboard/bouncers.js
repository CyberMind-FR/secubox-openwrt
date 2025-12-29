'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getBouncers(),
			API.getStatus()
		]);
	},

	render: function(data) {
		var bouncers = data[0] || [];
		var status = data[1] || {};

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('CrowdSec Bouncers')),
			E('div', { 'class': 'cbi-map-descr' },
				_('Bouncers are components that enforce CrowdSec decisions by blocking malicious IPs at various points (firewall, web server, etc.).')),

			// Status Card
			E('div', { 'class': 'cbi-section', 'style': 'background: ' + (status.crowdsec === 'running' ? '#d4edda' : '#f8d7da') + '; border-left: 4px solid ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + '; padding: 1em; margin-bottom: 1.5em;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('div', {}, [
						E('strong', {}, _('CrowdSec Status:')),
						' ',
						E('span', { 'class': 'badge', 'style': 'background: ' + (status.crowdsec === 'running' ? '#28a745' : '#dc3545') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px; margin-left: 0.5em;' },
							status.crowdsec === 'running' ? _('RUNNING') : _('STOPPED'))
					]),
					E('div', {}, [
						E('strong', {}, _('Active Bouncers:')),
						' ',
						E('span', { 'style': 'font-size: 1.3em; color: #0088cc; font-weight: bold; margin-left: 0.5em;' },
							bouncers.length.toString())
					])
				])
			]),

			// Bouncers Table
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;' }, [
					E('h3', { 'style': 'margin: 0;' }, _('Registered Bouncers')),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': L.bind(this.handleRefresh, this)
					}, _('Refresh'))
				]),

				E('div', { 'class': 'table-wrapper' }, [
					E('table', { 'class': 'table', 'id': 'bouncers-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Name')),
								E('th', {}, _('IP Address')),
								E('th', {}, _('Type')),
								E('th', {}, _('Version')),
								E('th', {}, _('Last Pull')),
								E('th', {}, _('Status')),
								E('th', {}, _('Authentication'))
							])
						]),
						E('tbody', { 'id': 'bouncers-tbody' },
							this.renderBouncerRows(bouncers)
						)
					])
				])
			]),

			// Help Section
			E('div', { 'class': 'cbi-section', 'style': 'background: #e8f4f8; padding: 1em; margin-top: 2em;' }, [
				E('h3', {}, _('About Bouncers')),
				E('p', {}, _('Bouncers are remediation components that connect to the CrowdSec Local API to fetch decisions and apply them on your infrastructure.')),
				E('div', { 'style': 'margin-top: 1em;' }, [
					E('strong', {}, _('Common Bouncer Types:')),
					E('ul', { 'style': 'margin-top: 0.5em;' }, [
						E('li', {}, [
							E('strong', {}, 'cs-firewall-bouncer:'),
							' ',
							_('Manages iptables/nftables rules to block IPs at the firewall level')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-nginx-bouncer:'),
							' ',
							_('Blocks IPs directly in Nginx web server')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-haproxy-bouncer:'),
							' ',
							_('Integrates with HAProxy load balancer')
						]),
						E('li', {}, [
							E('strong', {}, 'cs-cloudflare-bouncer:'),
							' ',
							_('Pushes decisions to Cloudflare firewall')
						])
					])
				]),
				E('p', { 'style': 'margin-top: 1em; padding: 0.75em; background: #fff3cd; border-radius: 4px;' }, [
					E('strong', {}, _('Note:')),
					' ',
					_('To register a new bouncer, use the command: '),
					E('code', {}, 'cscli bouncers add <bouncer-name>')
				])
			])
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return API.getBouncers().then(L.bind(function(refreshData) {
				var tbody = document.getElementById('bouncers-tbody');
				if (tbody) {
					dom.content(tbody, this.renderBouncerRows(refreshData || []));
				}
			}, this));
		}, this), 10);

		return view;
	},

	renderBouncerRows: function(bouncers) {
		if (!bouncers || bouncers.length === 0) {
			return E('tr', {}, [
				E('td', { 'colspan': 7, 'style': 'text-align: center; padding: 2em; color: #999;' },
					_('No bouncers registered. Use "cscli bouncers add <name>" to register a bouncer.'))
			]);
		}

		return bouncers.map(L.bind(function(bouncer) {
			var lastPull = bouncer.last_pull || bouncer.lastPull || 'Never';
			var isRecent = this.isRecentPull(lastPull);

			return E('tr', {
				'style': isRecent ? '' : 'opacity: 0.6;'
			}, [
				E('td', {}, [
					E('strong', {}, bouncer.name || 'Unknown')
				]),
				E('td', {}, [
					E('code', { 'style': 'font-size: 0.9em;' }, bouncer.ip_address || bouncer.ipAddress || 'N/A')
				]),
				E('td', {}, bouncer.type || 'Unknown'),
				E('td', {}, bouncer.version || 'N/A'),
				E('td', {}, this.formatLastPull(lastPull)),
				E('td', {}, [
					E('span', {
						'class': 'badge',
						'style': 'background: ' + (isRecent ? '#28a745' : '#6c757d') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
					}, isRecent ? _('Active') : _('Inactive'))
				]),
				E('td', {}, [
					E('span', {
						'class': 'badge',
						'style': 'background: ' + (bouncer.revoked ? '#dc3545' : '#28a745') + '; color: white; padding: 0.25em 0.6em; border-radius: 3px;'
					}, bouncer.revoked ? _('Revoked') : _('Valid'))
				])
			]);
		}, this));
	},

	formatLastPull: function(lastPull) {
		if (!lastPull || lastPull === 'Never' || lastPull === 'never') {
			return E('span', { 'style': 'color: #999;' }, _('Never'));
		}

		try {
			var pullDate = new Date(lastPull);
			var now = new Date();
			var diffMinutes = Math.floor((now - pullDate) / 60000);

			if (diffMinutes < 1) return _('Just now');
			if (diffMinutes < 60) return diffMinutes + 'm ago';
			if (diffMinutes < 1440) return Math.floor(diffMinutes / 60) + 'h ago';
			return Math.floor(diffMinutes / 1440) + 'd ago';
		} catch(e) {
			return lastPull;
		}
	},

	isRecentPull: function(lastPull) {
		if (!lastPull || lastPull === 'Never' || lastPull === 'never') {
			return false;
		}

		try {
			var pullDate = new Date(lastPull);
			var now = new Date();
			var diffMinutes = Math.floor((now - pullDate) / 60000);
			// Consider active if pulled within last 5 minutes
			return diffMinutes < 5;
		} catch(e) {
			return false;
		}
	},

	handleRefresh: function() {
		poll.start();

		return Promise.all([
			API.getBouncers(),
			API.getStatus()
		]).then(L.bind(function(data) {
			var tbody = document.getElementById('bouncers-tbody');
			if (tbody) {
				var bouncers = data[0] || [];
				dom.content(tbody, this.renderBouncerRows(bouncers));
			}

			ui.addNotification(null, E('p', _('Bouncer list refreshed')), 'info');
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to refresh: %s').format(err.message || err)), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
