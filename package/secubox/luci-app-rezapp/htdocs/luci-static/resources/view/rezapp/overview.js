'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.rezapp',
	method: 'status',
	expect: {}
});

var callCatalogs = rpc.declare({
	object: 'luci.rezapp',
	method: 'catalogs',
	expect: {}
});

var callApps = rpc.declare({
	object: 'luci.rezapp',
	method: 'apps',
	expect: {}
});

var callSearch = rpc.declare({
	object: 'luci.rezapp',
	method: 'search',
	params: ['query'],
	expect: {}
});

var callInfo = rpc.declare({
	object: 'luci.rezapp',
	method: 'info',
	params: ['image'],
	expect: {}
});

var callConvert = rpc.declare({
	object: 'luci.rezapp',
	method: 'convert',
	params: ['image', 'name', 'tag', 'memory'],
	expect: {}
});

var callPackage = rpc.declare({
	object: 'luci.rezapp',
	method: 'package',
	params: ['name'],
	expect: {}
});

var callPublish = rpc.declare({
	object: 'luci.rezapp',
	method: 'publish',
	params: ['name'],
	expect: {}
});

var callDelete = rpc.declare({
	object: 'luci.rezapp',
	method: 'delete',
	params: ['name'],
	expect: {}
});

return view.extend({
	status: {},
	catalogs: [],
	apps: [],
	searchResults: [],

	load: function() {
		return Promise.all([
			callStatus(),
			callCatalogs(),
			callApps()
		]);
	},

	render: function(data) {
		var self = this;
		this.status = data[0] || {};
		this.catalogs = (data[1] && data[1].catalogs) || [];
		this.apps = (data[2] && data[2].apps) || [];

		var view = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, 'RezApp Forge'),
			E('div', { 'class': 'cbi-map-descr' },
				'Convert Docker images to SecuBox LXC apps.'),

			// Status cards
			E('div', { 'class': 'sh-stats', 'style': 'display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap;' }, [
				this.renderStatCard('Converted Apps', this.status.apps || 0, '#2196f3'),
				this.renderStatCard('Catalogs', this.status.catalogs || 0, '#9c27b0'),
				this.renderStatCard('Docker', this.status.docker_status || 'unknown',
					this.status.docker_status === 'running' ? '#4caf50' : '#ff9800')
			]),

			// Search section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Search Docker Hub'),
				E('div', { 'style': 'display:flex;gap:0.5rem;margin-bottom:1rem;' }, [
					E('input', {
						'type': 'text',
						'id': 'search-query',
						'class': 'cbi-input-text',
						'placeholder': 'Search images (e.g., nginx, heimdall)',
						'style': 'flex:1;'
					}),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleSearch')
					}, 'Search')
				]),
				E('div', { 'id': 'search-results' })
			]),

			// Converted apps section
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, 'Converted Apps'),
				E('div', { 'id': 'apps-table' }, this.renderAppsTable())
			])
		]);

		poll.add(L.bind(this.pollApps, this), 15);

		return view;
	},

	renderStatCard: function(label, value, color) {
		return E('div', {
			'style': 'background:#1a1a2e;border-left:4px solid ' + color + ';padding:1rem;min-width:120px;border-radius:4px;'
		}, [
			E('div', { 'style': 'font-size:1.5rem;font-weight:bold;color:' + color }, String(value)),
			E('div', { 'style': 'color:#888;font-size:0.85rem;' }, label)
		]);
	},

	renderAppsTable: function() {
		if (!this.apps.length) {
			return E('p', { 'class': 'cbi-value-description' },
				'No converted apps yet. Search and convert a Docker image to get started.');
		}

		var rows = this.apps.map(L.bind(function(app) {
			var statusBadge = E('span', {
				'class': 'badge',
				'style': 'background:' + (app.lxc_status === 'running' ? '#4caf50' : app.lxc_status === 'stopped' ? '#ff9800' : '#666') + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:0.8rem;'
			}, app.lxc_status || 'none');

			var packageBadge = E('span', {
				'style': 'color:' + (app.packaged === 'yes' ? '#4caf50' : '#666')
			}, app.packaged === 'yes' ? 'Yes' : 'No');

			var actions = E('div', { 'style': 'display:flex;gap:4px;flex-wrap:wrap;' }, [
				app.packaged !== 'yes' ?
					E('button', {
						'class': 'cbi-button',
						'style': 'padding:4px 8px;font-size:0.8rem;',
						'click': ui.createHandlerFn(this, 'handlePackage', app.name)
					}, 'Package') : '',
				E('button', {
					'class': 'cbi-button',
					'style': 'padding:4px 8px;font-size:0.8rem;',
					'click': ui.createHandlerFn(this, 'handlePublish', app.name)
				}, 'Publish'),
				E('button', {
					'class': 'cbi-button cbi-button-remove',
					'style': 'padding:4px 8px;font-size:0.8rem;',
					'click': ui.createHandlerFn(this, 'handleDelete', app.name)
				}, 'Delete')
			]);

			return E('tr', {}, [
				E('td', {}, app.name),
				E('td', { 'style': 'font-size:0.85rem;color:#888;' }, app.source_image || '-'),
				E('td', {}, statusBadge),
				E('td', {}, packageBadge),
				E('td', { 'style': 'font-size:0.85rem;' }, app.converted_at || '-'),
				E('td', {}, actions)
			]);
		}, this));

		return E('table', { 'class': 'table cbi-section-table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Name'),
				E('th', { 'class': 'th' }, 'Source Image'),
				E('th', { 'class': 'th' }, 'LXC Status'),
				E('th', { 'class': 'th' }, 'Packaged'),
				E('th', { 'class': 'th' }, 'Converted'),
				E('th', { 'class': 'th' }, 'Actions')
			])
		].concat(rows));
	},

	renderSearchResults: function() {
		var container = document.getElementById('search-results');
		if (!container) return;

		if (!this.searchResults.length) {
			container.innerHTML = '';
			return;
		}

		var rows = this.searchResults.map(L.bind(function(result) {
			return E('tr', {}, [
				E('td', {}, [
					E('strong', {}, result.image),
					E('span', { 'style': 'margin-left:0.5rem;color:#ffd700;' }, result.stars ? result.stars + '*' : '')
				]),
				E('td', { 'style': 'font-size:0.85rem;color:#888;max-width:300px;overflow:hidden;text-overflow:ellipsis;' },
					result.description || ''),
				E('td', {}, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'style': 'padding:4px 8px;font-size:0.8rem;',
						'click': ui.createHandlerFn(this, 'handleConvert', result.image)
					}, 'Convert')
				])
			]);
		}, this));

		var table = E('table', { 'class': 'table cbi-section-table', 'style': 'margin-top:1rem;' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, 'Image'),
				E('th', { 'class': 'th' }, 'Description'),
				E('th', { 'class': 'th' }, 'Action')
			])
		].concat(rows));

		container.innerHTML = '';
		container.appendChild(table);
	},

	pollApps: function() {
		var self = this;
		return callApps().then(function(data) {
			self.apps = (data && data.apps) || [];
			var container = document.getElementById('apps-table');
			if (container) {
				container.innerHTML = '';
				container.appendChild(self.renderAppsTable());
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
		container.innerHTML = '<p class="spinning">Searching Docker Hub...</p>';

		return callSearch(query).then(function(res) {
			if (res.code !== 0) {
				container.innerHTML = '<p style="color:#f44336;">Search failed</p>';
				return;
			}

			self.searchResults = res.results || [];
			self.renderSearchResults();

			if (!self.searchResults.length) {
				container.innerHTML = '<p>No results found for "' + query + '"</p>';
			}
		}).catch(function(err) {
			container.innerHTML = '<p style="color:#f44336;">Error: ' + err.message + '</p>';
		});
	},

	handleConvert: function(image) {
		var self = this;

		// Extract default name from image
		var defaultName = image.split('/').pop().split(':')[0].replace(/[^a-zA-Z0-9_-]/g, '_');

		ui.showModal('Convert Docker Image', [
			E('div', { 'class': 'cbi-section' }, [
				E('p', {}, ['Converting: ', E('strong', {}, image)]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'App Name'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'convert-name', 'class': 'cbi-input-text', 'value': defaultName })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Tag'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'convert-tag', 'class': 'cbi-input-text', 'value': 'latest', 'placeholder': 'latest' })
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, 'Memory Limit'),
					E('div', { 'class': 'cbi-value-field' }, [
						E('select', { 'id': 'convert-memory', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '256M' }, '256 MB'),
							E('option', { 'value': '512M', 'selected': true }, '512 MB'),
							E('option', { 'value': '1G' }, '1 GB'),
							E('option', { 'value': '2G' }, '2 GB')
						])
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-positive',
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
							E('p', { 'style': 'color:#888;font-size:0.85rem;' }, 'This may take several minutes. Please wait...')
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
		ui.showModal('Generating Package...', [
			E('p', { 'class': 'spinning' }, 'Generating SecuBox package for ' + name + '...')
		]);

		return callPackage(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Package generated!'));
				self.pollApps();
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Package generation failed')));
			}
		});
	},

	handlePublish: function(name) {
		var self = this;
		ui.showModal('Publishing...', [
			E('p', { 'class': 'spinning' }, 'Publishing ' + name + ' to catalog...')
		]);

		return callPublish(name).then(function(res) {
			ui.hideModal();
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Published to catalog!'));
			} else {
				ui.addNotification(null, E('p', 'Error: ' + (res.output || 'Publish failed')));
			}
		});
	},

	handleDelete: function(name) {
		var self = this;
		if (!confirm('Delete converted app "' + name + '"? This cannot be undone.')) {
			return;
		}

		return callDelete(name).then(function(res) {
			if (res.code === 0) {
				ui.addNotification(null, E('p', 'Deleted ' + name));
				self.pollApps();
			} else {
				ui.addNotification(null, E('p', 'Error deleting'));
			}
		});
	}
});
