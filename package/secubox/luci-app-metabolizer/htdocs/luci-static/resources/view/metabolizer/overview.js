'use strict';
'require view';
'require ui';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({
	object: 'luci.metabolizer',
	method: 'status',
	expect: {}
});

var callListPosts = rpc.declare({
	object: 'luci.metabolizer',
	method: 'list_posts',
	expect: { '': [] }
});

var callSync = rpc.declare({
	object: 'luci.metabolizer',
	method: 'sync',
	expect: {}
});

var callBuild = rpc.declare({
	object: 'luci.metabolizer',
	method: 'build',
	expect: {}
});

var callGiteaSync = rpc.declare({
	object: 'luci.metabolizer',
	method: 'gitea_sync',
	expect: {}
});

return view.extend({
	load: function() {
		return Promise.all([
			callStatus(),
			callListPosts()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var posts = data[1] || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Metabolizer CMS')),

			// Status cards
			E('div', { 'class': 'cbi-section', 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
				this.renderStatusCard('CMS', status.cms_running ? 'Running' : 'Stopped',
					status.cms_running ? 'green' : 'red'),
				this.renderStatusCard('Hexo', status.hexo_running ? 'Running' : 'Stopped',
					status.hexo_running ? 'green' : 'red'),
				this.renderStatusCard('Gitea', status.gitea_connected ? 'Connected' : 'Offline',
					status.gitea_connected ? 'green' : 'red'),
				this.renderStatusCard('Posts', status.post_count || 0, 'blue'),
				this.renderStatusCard('Drafts', status.draft_count || 0, 'orange')
			]),

			// Quick links
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Quick Access')),
				E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
					E('a', {
						'class': 'btn cbi-button cbi-button-action',
						'href': status.cms_url || '#',
						'target': '_blank'
					}, _('Open CMS Editor')),
					E('a', {
						'class': 'btn cbi-button',
						'href': status.blog_url || '/blog/',
						'target': '_blank'
					}, _('View Blog'))
				])
			]),

			// Actions
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Actions')),
				E('div', { 'style': 'display: flex; gap: 1rem; flex-wrap: wrap;' }, [
					E('button', {
						'class': 'btn cbi-button',
						'click': ui.createHandlerFn(this, 'handleSync')
					}, _('Sync Content')),
					E('button', {
						'class': 'btn cbi-button',
						'click': ui.createHandlerFn(this, 'handleBuild')
					}, _('Build Site')),
					E('button', {
						'class': 'btn cbi-button',
						'click': ui.createHandlerFn(this, 'handleGiteaSync')
					}, _('Pull from Gitea'))
				])
			]),

			// Recent posts
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Recent Posts')),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Title')),
						E('th', { 'class': 'th' }, _('Date')),
						E('th', { 'class': 'th' }, _('Slug'))
					]),
					E('tbody', {}, posts.slice(0, 10).map(function(post) {
						return E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, post.title || '(untitled)'),
							E('td', { 'class': 'td' }, post.date || '-'),
							E('td', { 'class': 'td' }, post.slug || '-')
						]);
					}))
				])
			])
		]);

		return KissTheme.wrap(view, 'admin/secubox/services/metabolizer');
	},

	renderStatusCard: function(label, value, color) {
		var colors = {
			'green': '#22c55e',
			'red': '#ef4444',
			'blue': '#3b82f6',
			'orange': '#f97316'
		};
		return E('div', {
			'style': 'background: var(--cbi-section-background); padding: 1rem; border-radius: 8px; min-width: 120px; text-align: center; border-left: 4px solid ' + (colors[color] || '#666') + ';'
		}, [
			E('div', { 'style': 'font-size: 0.9em; color: #666;' }, label),
			E('div', { 'style': 'font-size: 1.5em; font-weight: bold;' }, String(value))
		]);
	},

	handleSync: function(ev) {
		return callSync().then(function() {
			ui.addNotification(null, E('p', _('Content synced successfully')));
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Sync failed: ') + e.message), 'error');
		});
	},

	handleBuild: function(ev) {
		return callBuild().then(function() {
			ui.addNotification(null, E('p', _('Site built successfully')));
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Build failed: ') + e.message), 'error');
		});
	},

	handleGiteaSync: function(ev) {
		return callGiteaSync().then(function() {
			ui.addNotification(null, E('p', _('Pulled from Gitea successfully')));
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Gitea sync failed: ') + e.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
