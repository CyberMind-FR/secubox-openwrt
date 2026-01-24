'use strict';
'require view';
'require dom';
'require poll';
'require cyberfeed.api as api';

return view.extend({
	title: _('CyberFeed Dashboard'),
	pollRegistered: false,

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('cyberfeed/dashboard.css');
		document.head.appendChild(cssLink);

		return api.getDashboardData();
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var feeds = Array.isArray(data.feeds) ? data.feeds : [];
		var items = Array.isArray(data.items) ? data.items : [];
		var rssbridge = data.rssbridge || {};

		var lastSync = status.last_sync ? new Date(status.last_sync * 1000).toLocaleString() : 'Never';

		var content = [];

		// Header
		content.push(E('div', { 'class': 'cf-header' }, [
			E('h1', {}, '\u26A1 CYBERFEED \u26A1'),
			E('p', { 'class': 'subtitle' }, 'NEURAL RSS MATRIX INTERFACE')
		]));

		// Stats Grid
		content.push(E('div', { 'class': 'cf-stats-grid' }, [
			E('div', { 'class': 'cf-stat-card' }, [
				E('div', { 'class': 'icon' }, '\uD83D\uDCE1'),
				E('div', { 'class': 'value' }, String(status.feed_count || 0)),
				E('div', { 'class': 'label' }, 'Feed Sources')
			]),
			E('div', { 'class': 'cf-stat-card' }, [
				E('div', { 'class': 'icon' }, '\uD83D\uDCCB'),
				E('div', { 'class': 'value' }, String(status.item_count || 0)),
				E('div', { 'class': 'label' }, 'Total Items')
			]),
			E('div', { 'class': 'cf-stat-card' }, [
				E('div', { 'class': 'icon' }, '\u23F0'),
				E('div', { 'class': 'value' }, lastSync.split(' ')[1] || '--:--'),
				E('div', { 'class': 'label' }, 'Last Sync')
			]),
			E('div', { 'class': 'cf-stat-card' }, [
				E('div', { 'class': 'icon' }, status.enabled ? '\u2705' : '\u26D4'),
				E('div', { 'class': 'value' }, status.enabled ? 'ON' : 'OFF'),
				E('div', { 'class': 'label' }, 'Service Status')
			])
		]));

		// Quick Actions Card
		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\u26A1'),
					'Quick Actions'
				])
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('div', { 'class': 'cf-quick-actions' }, [
					E('button', {
						'class': 'cf-btn cf-btn-primary',
						'click': function() { self.handleSync(); }
					}, ['\uD83D\uDD04', ' Sync Now']),
					E('a', {
						'href': L.url('admin/services/cyberfeed/feeds'),
						'class': 'cf-btn cf-btn-secondary'
					}, ['\u2795', ' Add Feed']),
					E('a', {
						'href': '/cyberfeed/',
						'target': '_blank',
						'class': 'cf-btn'
					}, ['\uD83C\uDF10', ' Open Web View']),
					E('a', {
						'href': L.url('admin/services/cyberfeed/preview'),
						'class': 'cf-btn'
					}, ['\uD83D\uDC41', ' Preview'])
				])
			])
		]));

		// RSS-Bridge Card
		var rssbridgeStatus = rssbridge.running ? 'Running' : (rssbridge.installed ? 'Stopped' : 'Not Installed');
		var rssbridgeBadgeClass = rssbridge.running ? 'cf-badge-success' : (rssbridge.installed ? 'cf-badge-warning' : 'cf-badge-danger');

		content.push(E('div', { 'class': 'cf-card cf-rssbridge-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83C\uDF09'),
					'RSS-Bridge (Social Media)'
				]),
				E('span', { 'class': 'cf-badge ' + rssbridgeBadgeClass }, rssbridgeStatus)
			]),
			E('div', { 'class': 'cf-card-body' }, [
				E('p', { 'style': 'margin-bottom: 16px; color: var(--cf-text-dim);' },
					'RSS-Bridge converts Facebook, Twitter, YouTube and other platforms to RSS feeds.'),
				E('div', { 'class': 'cf-quick-actions' },
					rssbridge.installed ? [
						E('button', {
							'class': 'cf-btn ' + (rssbridge.running ? 'cf-btn-danger' : 'cf-btn-primary'),
							'click': function() { self.handleRssBridge(rssbridge.running ? 'stop' : 'start'); }
						}, rssbridge.running ? ['\u23F9', ' Stop'] : ['\u25B6', ' Start']),
						rssbridge.running ? E('a', {
							'href': 'http://' + window.location.hostname + ':' + (rssbridge.port || 3000),
							'target': '_blank',
							'class': 'cf-btn'
						}, ['\uD83C\uDF10', ' Open Bridge UI']) : null
					].filter(Boolean) : [
						E('button', {
							'class': 'cf-btn cf-btn-primary',
							'click': function() { self.handleRssBridgeInstall(); }
						}, ['\uD83D\uDCE5', ' Install RSS-Bridge'])
					]
				)
			])
		]));

		// Recent Items Card
		var recentItems = items.slice(0, 5);
		var itemsContent;

		if (recentItems.length === 0) {
			itemsContent = E('div', { 'class': 'cf-empty' }, [
				E('div', { 'class': 'cf-empty-icon' }, '\uD83D\uDD2E'),
				E('div', { 'class': 'cf-empty-text' }, 'No feed items yet'),
				E('div', { 'class': 'cf-empty-hint' }, 'Add feeds and sync to see content')
			]);
		} else {
			itemsContent = E('div', {}, recentItems.map(function(item) {
				return E('div', { 'class': 'cf-feed-item' }, [
					E('div', { 'class': 'meta' }, [
						E('span', { 'class': 'timestamp' }, '\u23F0 ' + (item.date || 'Unknown')),
						E('div', {}, [
							E('span', { 'class': 'cf-badge cf-badge-info' }, item.source || 'RSS'),
							item.category ? E('span', { 'class': 'cf-badge cf-badge-category', 'style': 'margin-left: 6px;' }, item.category) : null
						].filter(Boolean))
					]),
					E('div', { 'class': 'title' }, [
						item.link ? E('a', { 'href': item.link, 'target': '_blank' }, item.title || 'Untitled') : (item.title || 'Untitled')
					]),
					item.desc ? E('div', { 'class': 'description' }, item.desc) : null
				].filter(Boolean));
			}));
		}

		content.push(E('div', { 'class': 'cf-card' }, [
			E('div', { 'class': 'cf-card-header' }, [
				E('div', { 'class': 'cf-card-title' }, [
					E('span', { 'class': 'cf-card-title-icon' }, '\uD83D\uDCCB'),
					'Recent Items (' + items.length + ')'
				]),
				E('a', {
					'href': L.url('admin/services/cyberfeed/preview'),
					'class': 'cf-btn cf-btn-sm'
				}, 'View All')
			]),
			E('div', { 'class': 'cf-card-body' }, [itemsContent])
		]));

		var view = E('div', { 'class': 'cyberfeed-dashboard' }, content);

		if (!this.pollRegistered) {
			this.pollRegistered = true;
			poll.add(function() {
				return api.getDashboardData().then(function(newData) {
					var container = document.querySelector('.cyberfeed-dashboard');
					if (container) {
						var newView = self.render(newData);
						container.parentNode.replaceChild(newView, container);
					}
				});
			}, 60);
		}

		return view;
	},

	handleSync: function() {
		var self = this;
		this.showToast('Syncing feeds...', 'info');

		return api.syncFeeds().then(function(res) {
			if (res && res.success) {
				self.showToast('Sync started', 'success');
			} else {
				self.showToast('Sync failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleRssBridge: function(action) {
		var self = this;
		return api.controlRssBridge(action).then(function(res) {
			if (res && res.success) {
				self.showToast('RSS-Bridge ' + action + 'ed', 'success');
				window.location.reload();
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	handleRssBridgeInstall: function() {
		var self = this;
		this.showToast('Installing RSS-Bridge...', 'info');

		return api.installRssBridge().then(function(res) {
			if (res && res.success) {
				self.showToast('Installation started', 'success');
			} else {
				self.showToast('Failed: ' + (res.error || 'Unknown error'), 'error');
			}
		});
	},

	showToast: function(message, type) {
		var existing = document.querySelector('.cf-toast');
		if (existing) existing.remove();

		var iconMap = {
			'success': '\u2705',
			'error': '\u274C',
			'warning': '\u26A0\uFE0F',
			'info': '\u2139\uFE0F'
		};

		var toast = E('div', { 'class': 'cf-toast ' + (type || '') }, [
			E('span', {}, iconMap[type] || '\u2139\uFE0F'),
			message
		]);
		document.body.appendChild(toast);

		setTimeout(function() {
			toast.remove();
		}, 4000);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
