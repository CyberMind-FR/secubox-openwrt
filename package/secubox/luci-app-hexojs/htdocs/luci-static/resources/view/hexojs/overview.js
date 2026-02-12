'use strict';
'require view';
'require poll';
'require ui';
'require hexojs/api as api';
'require secubox/kiss-theme';

return view.extend({
	title: _('Hexo CMS'),
	pollInterval: 10,
	pollActive: true,

	load: function() {
		return api.getDashboardData();
	},

	handleServiceToggle: function(status) {
		var self = this;

		if (status.running) {
			ui.showModal(_('Stop Service'), [
				E('p', { 'class': 'spinning' }, _('Stopping Hexo CMS...'))
			]);

			api.serviceStop().then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Service stopped')), 'info');
					self.render();
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			});
		} else {
			ui.showModal(_('Start Service'), [
				E('p', { 'class': 'spinning' }, _('Starting Hexo CMS...'))
			]);

			api.serviceStart().then(function(result) {
				ui.hideModal();
				if (result.success) {
					ui.addNotification(null, E('p', _('Service starting...')), 'info');
				}
			}).catch(function(err) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
			});
		}
	},

	handleBuild: function() {
		ui.showModal(_('Building Site'), [
			E('p', { 'class': 'spinning' }, _('Generating static files...'))
		]);

		api.generate().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Site built successfully!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Build failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	startPolling: function() {
		var self = this;
		this.pollActive = true;

		poll.add(L.bind(function() {
			if (!this.pollActive) return Promise.resolve();

			return api.getStatus().then(L.bind(function(status) {
				this.updateStatusDisplay(status);
			}, this));
		}, this), this.pollInterval);
	},

	stopPolling: function() {
		this.pollActive = false;
		poll.stop();
	},

	updateStatusDisplay: function(status) {
		var badge = document.querySelector('.hexo-status-badge');
		if (badge) {
			badge.className = 'hexo-status-badge ' + (status.running ? 'running' : 'stopped');
			badge.innerHTML = '<span class="hexo-status-dot"></span>' + (status.running ? _('Running') : _('Stopped'));
		}

		var toggleBtn = document.querySelector('.hexo-service-toggle');
		if (toggleBtn) {
			toggleBtn.textContent = status.running ? _('Stop Service') : _('Start Service');
			toggleBtn.className = 'hexo-btn ' + (status.running ? 'hexo-btn-danger' : 'hexo-btn-success');
		}
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var stats = data.stats || {};
		var posts = data.posts || [];
		var preview = data.preview || {};

		var view = E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-logo' }, [
					E('div', { 'class': 'hexo-logo-icon' }, '\uD83D\uDCDD'),
					E('div', { 'class': 'hexo-logo-text' }, ['Hexo ', E('span', {}, 'CMS')])
				]),
				E('div', { 'class': 'hexo-status-badge ' + (status.running ? 'running' : 'stopped') }, [
					E('span', { 'class': 'hexo-status-dot' }),
					status.running ? _('Running') : _('Stopped')
				])
			]),

			// Stats Grid
			E('div', { 'class': 'hexo-stats-grid' }, [
				E('div', { 'class': 'hexo-stat' }, [
					E('div', { 'class': 'hexo-stat-icon' }, '\uD83D\uDCDD'),
					E('div', { 'class': 'hexo-stat-value' }, stats.posts || 0),
					E('div', { 'class': 'hexo-stat-label' }, _('Posts'))
				]),
				E('div', { 'class': 'hexo-stat' }, [
					E('div', { 'class': 'hexo-stat-icon' }, '\uD83D\uDCCB'),
					E('div', { 'class': 'hexo-stat-value' }, stats.drafts || 0),
					E('div', { 'class': 'hexo-stat-label' }, _('Drafts'))
				]),
				E('div', { 'class': 'hexo-stat' }, [
					E('div', { 'class': 'hexo-stat-icon' }, '\uD83D\uDCC1'),
					E('div', { 'class': 'hexo-stat-value' }, stats.categories || 0),
					E('div', { 'class': 'hexo-stat-label' }, _('Categories'))
				]),
				E('div', { 'class': 'hexo-stat' }, [
					E('div', { 'class': 'hexo-stat-icon' }, '\uD83C\uDFF7'),
					E('div', { 'class': 'hexo-stat-value' }, stats.tags || 0),
					E('div', { 'class': 'hexo-stat-label' }, _('Tags'))
				]),
				E('div', { 'class': 'hexo-stat' }, [
					E('div', { 'class': 'hexo-stat-icon' }, '\uD83D\uDDBC'),
					E('div', { 'class': 'hexo-stat-value' }, stats.media || 0),
					E('div', { 'class': 'hexo-stat-label' }, _('Media'))
				])
			]),

			// Quick Actions
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, [
						E('span', { 'class': 'hexo-card-title-icon' }, '\u26A1'),
						_('Quick Actions')
					])
				]),
				E('div', { 'class': 'hexo-actions' }, [
					E('button', {
						'class': 'hexo-service-toggle hexo-btn ' + (status.running ? 'hexo-btn-danger' : 'hexo-btn-success'),
						'click': function() { self.handleServiceToggle(status); }
					}, status.running ? _('Stop Service') : _('Start Service')),

					E('a', {
						'class': 'hexo-btn hexo-btn-primary',
						'href': L.url('admin', 'services', 'hexojs', 'editor')
					}, ['\u270F ', _('New Post')]),

					E('button', {
						'class': 'hexo-btn hexo-btn-secondary',
						'click': function() { self.handleBuild(); },
						'disabled': !status.running
					}, ['\uD83D\uDD28 ', _('Build')]),

					E('a', {
						'class': 'hexo-btn hexo-btn-secondary',
						'href': L.url('admin', 'services', 'hexojs', 'deploy')
					}, ['\uD83D\uDE80 ', _('Deploy')]),

					preview.running ? E('a', {
						'class': 'hexo-btn hexo-btn-secondary',
						'href': preview.url,
						'target': '_blank'
					}, ['\uD83D\uDC41 ', _('Preview')]) : ''
				])
			]),

			// Site Info
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, [
						E('span', { 'class': 'hexo-card-title-icon' }, '\u2139'),
						_('Site Information')
					])
				]),
				E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;' }, [
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Title')),
						E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.site ? status.site.title : '-')
					]),
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Author')),
						E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.site ? status.site.author : '-')
					]),
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Theme')),
						E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.site ? status.site.theme : '-')
					]),
					E('div', {}, [
						E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted); text-transform: uppercase;' }, _('Port')),
						E('div', { 'style': 'font-size: 16px; font-weight: 500;' }, status.http_port || '4000')
					])
				])
			]),

			// Recent Posts
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, [
						E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDCDD'),
						_('Recent Posts')
					]),
					E('a', {
						'class': 'hexo-btn hexo-btn-sm hexo-btn-secondary',
						'href': L.url('admin', 'services', 'hexojs', 'posts')
					}, _('View All'))
				]),
				posts.length > 0 ?
					E('table', { 'class': 'hexo-table' }, [
						E('thead', {}, [
							E('tr', {}, [
								E('th', {}, _('Title')),
								E('th', {}, _('Date')),
								E('th', {}, _('Category'))
							])
						]),
						E('tbody', {},
							posts.slice(0, 5).map(function(post) {
								return E('tr', {}, [
									E('td', {}, [
										E('a', {
											'class': 'hexo-post-title',
											'href': L.url('admin', 'services', 'hexojs', 'editor') + '?slug=' + post.slug
										}, post.title || post.slug)
									]),
									E('td', { 'class': 'hexo-post-meta' }, api.formatDate(post.date)),
									E('td', {}, post.categories ? E('span', { 'class': 'hexo-tag category' }, post.categories) : '-')
								]);
							})
						)
					])
				: E('div', { 'class': 'hexo-empty' }, [
					E('div', { 'class': 'hexo-empty-icon' }, '\uD83D\uDCDD'),
					E('p', {}, _('No posts yet. Create your first post!'))
				])
			])
		]);

		this.startPolling();

		return KissTheme.wrap([view], 'admin/services/hexojs');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
