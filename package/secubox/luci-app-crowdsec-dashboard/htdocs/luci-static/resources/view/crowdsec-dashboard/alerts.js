'use strict';
'require view';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard.api as api';
'require secubox/kiss-theme';

return view.extend({
	alerts: [],
	bannedIPs: new Set(),
	ipOrgCache: {},

	load: function() {
		var self = this;
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(link);

		// Load both alerts and current decisions to know which IPs are already banned
		return Promise.all([
			api.getAlerts(100).catch(function() { return []; }),
			api.getDecisions().catch(function() { return []; })
		]).then(function(results) {
			var decisions = results[1];
			// Track banned IPs
			if (Array.isArray(decisions)) {
				decisions.forEach(function(d) {
					if (d.decisions) {
						d.decisions.forEach(function(dec) {
							if (dec.value) self.bannedIPs.add(dec.value);
						});
					} else if (d.value) {
						self.bannedIPs.add(d.value);
					}
				});
			}
			var alerts = results[0];
			// Extract unique IPs for org lookup
			var ips = [];
			(Array.isArray(alerts) ? alerts : []).forEach(function(a) {
				var ip = a.source && a.source.ip;
				if (ip && !self.ipOrgCache[ip] && ips.indexOf(ip) === -1 && !ip.startsWith('192.168.') && !ip.startsWith('10.') && !ip.startsWith('127.')) {
					ips.push(ip);
				}
			});
			// Batch lookup orgs (max 100 per request)
			if (ips.length > 0) {
				return self.lookupOrgs(ips.slice(0, 100)).then(function() { return alerts; });
			}
			return alerts;
		});
	},

	lookupOrgs: function(ips) {
		var self = this;
		// Use ip-api.com batch endpoint
		return new Promise(function(resolve) {
			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'http://ip-api.com/batch?fields=query,org,isp,as', true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.timeout = 5000;
			xhr.onload = function() {
				if (xhr.status === 200) {
					try {
						var results = JSON.parse(xhr.responseText);
						results.forEach(function(r) {
							if (r.query) {
								self.ipOrgCache[r.query] = r.org || r.isp || r.as || '';
							}
						});
					} catch (e) {}
				}
				resolve();
			};
			xhr.onerror = xhr.ontimeout = function() { resolve(); };
			xhr.send(JSON.stringify(ips));
		});
	},

	render: function(data) {
		var self = this;
		this.alerts = Array.isArray(data) ? data : (data.alerts || []);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'CrowdSec Alerts'),
					KissTheme.badge(this.alerts.length + ' ALERTS',
						this.alerts.length > 0 ? 'yellow' : 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Security event monitoring')
			]),

			// Navigation
			this.renderNav('alerts'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats()),

			// Alerts card with search
			KissTheme.card([
				E('span', {}, 'Security Alerts'),
				E('input', {
					'type': 'text', 'id': 'alert-search',
					'placeholder': 'Search...',
					'style': 'margin-left: auto; padding: 6px 12px; background: var(--kiss-bg2); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text); font-size: 13px; width: 150px;',
					'keyup': function() { self.filterAlerts(); }
				})
			], E('div', { 'id': 'alerts-list' }, this.renderAlerts(this.alerts)))
		];

		poll.add(L.bind(this.pollData, this), 30);
		return KissTheme.wrap(content, 'admin/secubox/security/crowdsec/alerts');
	},

	renderNav: function(active) {
		var tabs = [
			{ id: 'overview', label: 'Overview' },
			{ id: 'alerts', label: 'Alerts' },
			{ id: 'decisions', label: 'Decisions' },
			{ id: 'bouncers', label: 'Bouncers' },
			{ id: 'settings', label: 'Settings' }
		];
		return E('div', { 'style': 'display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--kiss-line); padding-bottom: 12px;' }, tabs.map(function(t) {
			var isActive = active === t.id;
			return E('a', {
				'href': L.url('admin/secubox/security/crowdsec/' + t.id),
				'style': 'padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 13px; ' +
					(isActive ? 'background: rgba(0,200,83,0.1); color: var(--kiss-green); border: 1px solid rgba(0,200,83,0.3);' :
						'color: var(--kiss-muted); border: 1px solid transparent;')
			}, t.label);
		}));
	},

	renderStats: function() {
		var c = KissTheme.colors;
		var scenarios = {}, countries = {};
		this.alerts.forEach(function(a) {
			var s = a.scenario || 'unknown';
			scenarios[s] = (scenarios[s] || 0) + 1;
			var cn = (a.source && (a.source.cn || a.source.country)) || 'Unknown';
			countries[cn] = (countries[cn] || 0) + 1;
		});

		var topScenario = Object.entries(scenarios).sort(function(a, b) { return b[1] - a[1]; })[0];

		return [
			KissTheme.stat(this.alerts.length, 'Total Alerts', this.alerts.length > 0 ? c.orange : c.muted),
			KissTheme.stat(Object.keys(scenarios).length, 'Scenarios', c.blue),
			KissTheme.stat(Object.keys(countries).length, 'Countries', c.purple),
			KissTheme.stat(topScenario ? api.parseScenario(topScenario[0]).split(' ')[0] : '-', 'Top Threat', c.red)
		];
	},

	renderAlerts: function(alerts) {
		var self = this;
		if (!alerts.length) {
			return E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-green);' }, [
				E('div', { 'style': 'font-size: 32px; margin-bottom: 12px;' }, '\u2713'),
				E('div', {}, 'No alerts - all clear!')
			]);
		}
		return E('table', { 'class': 'kiss-table' }, [
			E('thead', {}, E('tr', {}, [
				E('th', {}, 'Time'),
				E('th', {}, 'Source'),
				E('th', {}, 'Organization'),
				E('th', {}, 'Country'),
				E('th', {}, 'Scenario'),
				E('th', {}, 'Events'),
				E('th', { 'style': 'width: 80px;' }, 'Action')
			])),
			E('tbody', {}, alerts.slice(0, 50).map(function(a) {
				var src = a.source || {};
				var ip = src.ip || '';
				var country = src.cn || src.country || '';
				var org = self.ipOrgCache[ip] || '';
				var orgDisplay = org.length > 25 ? org.substring(0, 22) + '...' : org;
				var isBanned = self.bannedIPs.has(ip);

				return E('tr', {}, [
					E('td', { 'style': 'font-family: monospace; font-size: 12px; color: var(--kiss-muted);' }, api.formatRelativeTime(a.created_at)),
					E('td', {}, E('span', { 'style': 'font-family: monospace; color: var(--kiss-cyan);' }, ip || '-')),
					E('td', { 'title': org }, E('span', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, orgDisplay || '-')),
					E('td', {}, [
						E('span', { 'style': 'font-size: 16px; margin-right: 4px;' }, api.getCountryFlag(country)),
						E('span', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, country)
					]),
					E('td', {}, E('span', { 'style': 'font-size: 12px;' }, api.parseScenario(a.scenario))),
					E('td', { 'style': 'font-family: monospace;' }, String(a.events_count || 0)),
					E('td', {}, ip ? self.renderBanButton(ip, a.scenario, isBanned) : '-')
				]);
			}))
		]);
	},

	renderBanButton: function(ip, scenario, isBanned) {
		var self = this;

		if (isBanned) {
			return E('button', {
				'class': 'kiss-btn',
				'style': 'padding: 4px 10px; font-size: 11px; opacity: 0.5; cursor: not-allowed;',
				'disabled': 'disabled',
				'title': 'Already banned'
			}, 'Banned');
		}

		return E('button', {
			'class': 'kiss-btn kiss-btn-red',
			'style': 'padding: 4px 10px; font-size: 11px;',
			'click': function(ev) {
				ev.preventDefault();
				self.banIP(ip, scenario);
			},
			'title': 'Ban this IP for 24 hours'
		}, 'Ban');
	},

	banIP: function(ip, scenario) {
		var self = this;
		var reason = 'Manual ban from alert: ' + (scenario || 'unknown');

		ui.showModal('Ban IP', [
			E('p', {}, 'Ban ' + ip + ' for 24 hours?'),
			E('p', { 'style': 'font-size: 12px; color: #666;' }, 'Reason: ' + reason),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'cbi-button',
					'click': ui.hideModal
				}, 'Cancel'),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						ui.showModal('Banning...', [
							E('p', { 'class': 'spinning' }, 'Adding ban for ' + ip + '...')
						]);

						api.addBan(ip, '24h', reason).then(function(result) {
							ui.hideModal();
							if (result && result.success !== false) {
								self.bannedIPs.add(ip);
								ui.addNotification(null, E('p', {}, 'IP ' + ip + ' has been banned for 24 hours'), 'success');
								// Refresh the alerts list
								var el = document.getElementById('alerts-list');
								if (el) dom.content(el, self.renderAlerts(self.alerts));
							} else {
								ui.addNotification(null, E('p', {}, 'Failed to ban IP: ' + (result.error || 'Unknown error')), 'error');
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', {}, 'Failed to ban IP: ' + err), 'error');
						});
					}
				}, 'Ban')
			])
		]);
	},

	filterAlerts: function() {
		var self = this;
		var query = (document.getElementById('alert-search').value || '').toLowerCase();
		var filtered = this.alerts.filter(function(a) {
			if (!query) return true;
			var src = a.source || {};
			var org = self.ipOrgCache[src.ip] || '';
			var fields = [src.ip, a.scenario, src.country, src.cn, org].join(' ').toLowerCase();
			return fields.includes(query);
		});
		var el = document.getElementById('alerts-list');
		if (el) dom.content(el, this.renderAlerts(filtered));
	},

	pollData: function() {
		var self = this;
		return api.getAlerts(100).then(function(data) {
			self.alerts = Array.isArray(data) ? data : (data.alerts || []);
			var el = document.getElementById('alerts-list');
			if (el) dom.content(el, self.renderAlerts(self.alerts));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
