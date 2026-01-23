'use strict';
'require view';
'require poll';
'require ui';
'require hexojs/api as api';

return view.extend({
	title: _('Deploy'),

	load: function() {
		return api.getDeployData();
	},

	handleBuild: function() {
		ui.showModal(_('Building'), [
			E('p', { 'class': 'spinning' }, _('Generating static files...'))
		]);

		api.generate().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Build complete!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Build failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleClean: function() {
		ui.showModal(_('Cleaning'), [
			E('p', { 'class': 'spinning' }, _('Cleaning generated files...'))
		]);

		api.clean().then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', _('Clean complete!')), 'info');
			} else {
				ui.addNotification(null, E('p', result.error || _('Clean failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	handleDeploy: function() {
		var self = this;

		ui.showModal(_('Deploy'), [
			E('p', { 'class': 'spinning' }, _('Building and deploying...'))
		]);

		api.deploy().then(function(result) {
			if (result.success) {
				// Start polling for deploy status
				self.pollDeployStatus();
			} else {
				ui.hideModal();
				ui.addNotification(null, E('p', result.error || _('Deploy failed')), 'error');
			}
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: %s').format(err.message || err)), 'error');
		});
	},

	pollDeployStatus: function() {
		var self = this;
		var checkStatus = function() {
			api.getDeployStatus().then(function(status) {
				if (status.status === 'running') {
					setTimeout(checkStatus, 2000);
				} else {
					ui.hideModal();
					ui.addNotification(null, E('p', _('Deploy complete!')), 'info');
					self.updateLog(status.log);
				}
			});
		};
		checkStatus();
	},

	updateLog: function(log) {
		var logEl = document.querySelector('#deploy-log');
		if (logEl && log) {
			logEl.textContent = log;
		}
	},

	render: function(data) {
		var self = this;
		var status = data.status || {};
		var deploy = data.deploy || {};
		var config = data.config || {};

		var hasRepo = config.deploy && config.deploy.repo;

		return E('div', { 'class': 'hexo-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('hexojs/dashboard.css') }),

			// Header
			E('div', { 'class': 'hexo-header' }, [
				E('div', { 'class': 'hexo-card-title' }, [
					E('span', { 'class': 'hexo-card-title-icon' }, '\uD83D\uDE80'),
					_('Build & Deploy')
				])
			]),

			// Build Actions
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Build'))
				]),
				E('p', { 'style': 'margin-bottom: 16px; color: var(--hexo-text-muted);' },
					_('Generate static files from your Markdown content.')),
				E('div', { 'class': 'hexo-actions' }, [
					E('button', {
						'class': 'hexo-btn hexo-btn-primary',
						'click': function() { self.handleBuild(); },
						'disabled': !status.running
					}, ['\uD83D\uDD28 ', _('Build Site')]),
					E('button', {
						'class': 'hexo-btn hexo-btn-secondary',
						'click': function() { self.handleClean(); },
						'disabled': !status.running
					}, ['\uD83E\uDDF9 ', _('Clean')])
				]),
				!status.running ? E('p', {
					'style': 'margin-top: 12px; color: var(--hexo-warning);'
				}, _('Service must be running to build.')) : ''
			]),

			// Deploy
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Deploy to GitHub Pages'))
				]),
				hasRepo ? E('div', {}, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;' }, [
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted);' }, _('Repository')),
							E('div', { 'style': 'font-weight: 500; word-break: break-all;' }, config.deploy.repo)
						]),
						E('div', {}, [
							E('div', { 'style': 'font-size: 12px; color: var(--hexo-text-muted);' }, _('Branch')),
							E('div', { 'style': 'font-weight: 500;' }, config.deploy.branch || 'gh-pages')
						])
					]),
					E('button', {
						'class': 'hexo-btn hexo-btn-success',
						'click': function() { self.handleDeploy(); },
						'disabled': !status.running
					}, ['\uD83D\uDE80 ', _('Deploy Now')])
				]) : E('div', {}, [
					E('p', { 'style': 'color: var(--hexo-text-muted);' },
						_('No deploy repository configured.')),
					E('a', {
						'class': 'hexo-btn hexo-btn-secondary',
						'href': L.url('admin', 'services', 'hexojs', 'settings')
					}, _('Configure Deploy'))
				])
			]),

			// Deploy Log
			E('div', { 'class': 'hexo-card' }, [
				E('div', { 'class': 'hexo-card-header' }, [
					E('div', { 'class': 'hexo-card-title' }, _('Deploy Log'))
				]),
				E('pre', {
					'id': 'deploy-log',
					'class': 'hexo-deploy-log'
				}, deploy.log || _('No recent deploy activity.'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
