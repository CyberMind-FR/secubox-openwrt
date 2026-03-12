'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callStatus = rpc.declare({ object: 'luci.rezapp', method: 'status', expect: {} });
var callCatalogs = rpc.declare({ object: 'luci.rezapp', method: 'catalogs', expect: {} });
var callApps = rpc.declare({ object: 'luci.rezapp', method: 'apps', expect: {} });
var callSearch = rpc.declare({ object: 'luci.rezapp', method: 'search', params: ['query'], expect: {} });
var callConvert = rpc.declare({ object: 'luci.rezapp', method: 'convert', params: ['image', 'name', 'tag', 'memory'], expect: {} });
var callPackage = rpc.declare({ object: 'luci.rezapp', method: 'package', params: ['name'], expect: {} });
var callPublish = rpc.declare({ object: 'luci.rezapp', method: 'publish', params: ['name'], expect: {} });
var callDelete = rpc.declare({ object: 'luci.rezapp', method: 'delete', params: ['name'], expect: {} });

return view.extend({
	status: {},
	catalogs: [],
	apps: [],
	searchResults: [],

	load: function() {
		return Promise.all([callStatus(), callCatalogs(), callApps()]);
	},

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.apps || 0, 'Converted', c.blue),
			KissTheme.stat(status.catalogs || 0, 'Catalogs', c.purple),
			KissTheme.stat(status.docker_status === 'running' ? 'UP' : 'DOWN', 'Docker', status.docker_status === 'running' ? c.green : c.orange)
		];
	},

	renderAppCard: function(app) {
		var self = this;
		var stateColor = app.lxc_status === 'running' ? 'var(--kiss-green)' :
			app.lxc_status === 'stopped' ? 'var(--kiss-orange)' : 'var(--kiss-muted)';

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + stateColor + ';'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				E('div', {}, [
					E('div', { 'style': 'font-weight: 600; font-size: 14px;' }, app.name),
					E('div', { 'style': 'font-size: 10px; color: var(--kiss-muted);' }, app.source_image || '-')
				]),
				KissTheme.badge(app.lxc_status || 'none', app.lxc_status === 'running' ? 'green' : app.lxc_status === 'stopped' ? 'orange' : 'purple')
			]),
			E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 10px;' }, [
				E('span', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, 'Packaged:'),
				KissTheme.badge(app.packaged === 'yes' ? 'YES' : 'NO', app.packaged === 'yes' ? 'green' : 'red'),
				E('span', { 'style': 'font-size: 10px; color: var(--kiss-muted);' }, app.converted_at || '')
			]),
			E('div', { 'style': 'display: flex; gap: 6px; flex-wrap: wrap;' }, [
				app.packaged !== 'yes' ? E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, 'handlePackage', app.name)
				}, 'Package') : '',
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, 'handlePublish', app.name)
				}, 'Publish'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 4px 10px; font-size: 11px;',
					'click': ui.createHandlerFn(this, 'handleDelete', app.name)
				}, 'Delete')
			])
		]);
	},

	renderSearchResults: function() {
		var self = this;
		var container = document.getElementById('search-results');
		if (!container) return;

		if (!this.searchResults.length) {
			container.innerHTML = '';
			return;
		}

		var results = E('div', { 'style': 'display: flex; flex-direction: column; gap: 8px;' },
			this.searchResults.map(function(result) {
				return E('div', {
					'style': 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--kiss-bg); border-radius: 6px;'
				}, [
					E('div', { 'style': 'flex: 1;' }, [
						E('div', { 'style': 'display: flex; align-items: center; gap: 8px;' }, [
							E('strong', {}, result.image),
							result.stars ? E('span', { 'style': 'color: var(--kiss-orange); font-size: 11px;' }, result.stars + '★') : ''
						]),
						E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); overflow: hidden; text-overflow: ellipsis;' },
							result.description || '')
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 4px 10px; font-size: 11px;',
						'click': ui.createHandlerFn(self, 'handleConvert', result.image)
					}, 'Convert')
				]);
			})
		);

		container.innerHTML = '';
		container.appendChild(results);
	},

	pollApps: function() {
		var self = this;
		return callApps().then(function(data) {
			self.apps = (data && data.apps) || [];
			var container = document.getElementById('apps-container');
			if (container) {
				container.innerHTML = '';
				if (self.apps.length === 0) {
					container.appendChild(E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' },
						'No converted apps yet. Search and convert a Docker image to get started.'));
				} else {
					self.apps.forEach(function(app) {
						container.appendChild(self.renderAppCard(app));
					});
				}
			}
		});
	},

	handleSearch: function() {
		var self = this;
		var query = document.getElementById('search-query').value.trim();

		if (!query) {
			ui.addNotification(null, E('p', 'Please enter a search query'));
			return;
		}

		var container = document.getElementById('search-results');
		container.innerHTML = '';
		container.appendChild(E('p', { 'class': 'spinning', 'style': 'color: var(--kiss-muted);' }, 'Searching Docker Hub...'));

		return callSearch(query).then(function(res) {
			if (res.code !== 0) {
				container.innerHTML = '';
				container.appendChild(E('p', { 'style': 'color: var(--kiss-red);' }, 'Search failed'));
				return;
			}

			self.searchResults = res.results || [];
			self.renderSearchResults();

			if (!self.searchResults.length) {
				container.innerHTML = '';
				container.appendChild(E('p', { 'style': 'color: var(--kiss-muted);' }, 'No results found for "' + query + '"'));
			}
		}).catch(function(err) {
			container.innerHTML = '';
			container.appendChild(E('p', { 'style': 'color: var(--kiss-red);' }, 'Error: ' + err.message));
		});
	},

	handleConvert: function(image) {
		var self = this;
		var defaultName = image.split('/').pop().split(':')[0].replace(/[^a-zA-Z0-9_-]/g, '_');

		ui.showModal('Convert Docker Image', [
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
				E('p', { 'style': 'margin: 0;' }, ['Converting: ', E('strong', {}, image)]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'App Name'),
					E('input', {
						'type': 'text',
						'id': 'convert-name',
						'value': defaultName,
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Tag'),
					E('input', {
						'type': 'text',
						'id': 'convert-tag',
						'value': 'latest',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					})
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Memory Limit'),
					E('select', {
						'id': 'convert-memory',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
					}, [
						E('option', { 'value': '256M' }, '256 MB'),
						E('option', { 'value': '512M', 'selected': true }, '512 MB'),
						E('option', { 'value': '1G' }, '1 GB'),
						E('option', { 'value': '2G' }, '2 GB')
					])
				])
			]),
			E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var name = document.getElementById('convert-name').value.trim();
						var tag = document.getElementById('convert-tag').value.trim() || 'latest';
						var memory = document.getElementById('convert-memory').value;

						if (!name) {
							ui.addNotification(null, E('p', 'Please enter an app name'));
							return;
						}

						ui.hideModal();
						ui.showModal('Converting...', [
							E('p', { 'class': 'spinning' }, 'Converting ' + image + ':' + tag + '...'),
							E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, 'This may take several minutes.')
						]);

						callConvert(image, name, tag, memory).then(function(res) {
							ui.hideModal();
							if (res.code === 0) {
								ui.addNotification(null, E('p', 'Conversion complete!'));
								self.pollApps();
							} else {
								ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Conversion failed')));
							}
						}).catch(function(err) {
							ui.hideModal();
							ui.addNotification(null, E('p', 'Error: ' + err.message));
						});
					}
				}, 'Convert')
			])
		]);
	},

	handlePackage: function(name) {
		var self = this;
		ui.showModal('Generating Package...', [E('p', { 'class': 'spinning' }, 'Generating SecuBox package for ' + name + '...')]);

		return callPackage(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Package generated!'));
				self.pollApps();
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed')));
			}
		});
	},

	handlePublish: function(name) {
		ui.showModal('Publishing...', [E('p', { 'class': 'spinning' }, 'Publishing ' + name + ' to catalog...')]);

		return callPublish(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Published to catalog!'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Failed')));
			}
		});
	},

	handleDelete: function(name) {
		var self = this;
		if (!confirm('Delete converted app "' + name + '"?')) return;

		return callDelete(name).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Deleted ' + name));
				self.pollApps();
			} else {
				ui.addNotification(null, E('p', 'Error deleting'));
			}
		});
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.catalogs = (data[1] && data[1].catalogs) || [];
		this.apps = (data[2] && data[2].apps) || [];

		poll.add(L.bind(this.pollApps, this), 15);

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'RezApp Forge'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Convert Docker images to SecuBox LXC apps')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' }, this.renderStats(this.status)),

			// Search
			KissTheme.card('Search Docker Hub',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px;' }, [
					E('div', { 'style': 'display: flex; gap: 8px;' }, [
						E('input', {
							'type': 'text',
							'id': 'search-query',
							'placeholder': 'Search images (e.g., nginx, heimdall)',
							'style': 'flex: 1; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 8px 12px; border-radius: 6px;'
						}),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'click': ui.createHandlerFn(this, 'handleSearch')
						}, 'Search')
					]),
					E('div', { 'id': 'search-results' })
				])
			),

			// Converted apps
			KissTheme.card('Converted Apps (' + this.apps.length + ')',
				E('div', { 'id': 'apps-container', 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;' },
					this.apps.length > 0 ?
						this.apps.map(function(app) { return self.renderAppCard(app); }) :
						[E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted); grid-column: 1 / -1;' },
							'No converted apps yet. Search and convert a Docker image to get started.')]
				)
			)
		];

		return KissTheme.wrap(content, 'admin/services/rezapp/overview');
	}
});
