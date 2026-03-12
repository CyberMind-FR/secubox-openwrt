'use strict';
'require view';
'require dom';
'require rpc';
'require poll';
'require secubox/kiss-theme';

var callGetTree = rpc.declare({
	object: 'luci.secubox-portal',
	method: 'get_tree',
	expect: { }
});

var callGetContainers = rpc.declare({
	object: 'luci.secubox-portal',
	method: 'get_containers',
	expect: { }
});

var callGetVhosts = rpc.declare({
	object: 'luci.secubox-portal',
	method: 'get_vhosts',
	expect: { }
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callGetTree(),
			callGetContainers(),
			callGetVhosts()
		]);
	},

	renderStats: function(categories, totalLinks, containers, vhosts, packages) {
		var c = KissTheme.colors;
		var runningContainers = containers.filter(function(c) { return c.state === 'running'; }).length;
		var enabledVhosts = vhosts.filter(function(v) { return v.enabled === '1'; }).length;
		return [
			KissTheme.stat(categories.length, 'Categories', c.green),
			KissTheme.stat(totalLinks, 'LuCI Apps', c.cyan),
			KissTheme.stat(packages, 'Packages', c.purple),
			KissTheme.stat(runningContainers + '/' + containers.length, 'Containers', c.blue),
			KissTheme.stat(enabledVhosts, 'Vhosts', c.orange)
		];
	},

	renderCategoryGrid: function(categories) {
		var sections = categories.filter(function(cat) {
			return cat.items && cat.items.length > 0;
		}).map(function(category) {
			var items = category.items.map(function(item) {
				return E('div', { 'style': 'padding: 4px 0; font-size: 13px;' }, [
					E('span', { 'style': 'color: var(--kiss-muted); margin-right: 6px;' }, '-'),
					E('a', {
						'href': '/cgi-bin/luci/' + item.path,
						'target': '_blank',
						'style': 'color: var(--kiss-cyan); text-decoration: none;'
					}, item.name),
					item.package ? E('span', {
						'style': 'color: var(--kiss-muted); font-size: 10px; margin-left: 6px;'
					}, item.package) : ''
				]);
			});

			return E('div', {
				'class': 'luci-tree-section',
				'style': 'background: var(--kiss-bg2); border-left: 3px solid var(--kiss-green); border-radius: 4px; padding: 16px;'
			}, [
				E('div', {
					'style': 'color: var(--kiss-green); font-size: 14px; margin: 0 0 12px 0; border-bottom: 1px solid var(--kiss-line); padding-bottom: 8px; display: flex; justify-content: space-between;'
				}, [
					E('span', {}, category.cat),
					E('span', { 'style': 'color: var(--kiss-muted); font-size: 12px;' }, '(' + category.items.length + ')')
				]),
				E('div', {}, items)
			]);
		});

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;'
		}, sections);
	},

	renderContainers: function(containers) {
		if (!containers || containers.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' }, 'No containers found');
		}

		var items = containers.map(function(c) {
			var statusColor = c.state === 'running' ? 'var(--kiss-green)' : 'var(--kiss-red)';
			return E('div', {
				'style': 'padding: 10px 14px; background: var(--kiss-bg); border-radius: 6px; display: flex; align-items: center; gap: 10px;'
			}, [
				E('div', {
					'style': 'width: 10px; height: 10px; border-radius: 50%; background: ' + statusColor + ';'
				}),
				E('span', {}, c.name)
			]);
		});

		return E('div', {
			'style': 'display: flex; flex-wrap: wrap; gap: 12px;'
		}, items);
	},

	renderVhosts: function(vhosts) {
		if (!vhosts || vhosts.length === 0) {
			return E('p', { 'style': 'color: var(--kiss-muted);' }, 'No vhosts configured');
		}

		var items = vhosts.filter(function(v) { return v.domain; }).map(function(v) {
			return E('div', {
				'style': 'padding: 10px 14px; background: var(--kiss-bg); border-radius: 6px;'
			}, [
				E('div', {}, [
					E('a', {
						'href': 'https://' + v.domain,
						'target': '_blank',
						'style': 'color: var(--kiss-cyan); text-decoration: none;'
					}, v.domain)
				]),
				E('div', {
					'style': 'color: var(--kiss-muted); font-size: 11px; margin-top: 4px;'
				}, 'Backend: ' + (v.backend || 'N/A') + (v.ssl === '1' ? ' | SSL' : ''))
			]);
		});

		return E('div', {
			'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto;'
		}, items);
	},

	render: function(data) {
		var self = this;
		var treeData = data[0] || {};
		var containersData = data[1] || {};
		var vhostsData = data[2] || {};

		var categories = treeData.categories || [];
		var stats = treeData.stats || {};
		var containers = containersData.containers || [];
		var vhosts = vhostsData.vhosts || [];

		var totalLinks = 0;
		categories.forEach(function(cat) {
			if (cat.items) totalLinks += cat.items.length;
		});

		// Tab state
		var activeTab = 0;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'SecuBox Navigation Tree'),
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 6px 12px;',
						'click': function() {
							self.load().then(function(newData) {
								var wrapper = document.querySelector('.kiss-wrapper');
								if (wrapper) {
									dom.content(wrapper, self.render(newData).childNodes);
								}
							});
						}
					}, 'Refresh')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Auto-generated map of all SecuBox components and services')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-5', 'style': 'margin: 20px 0;' },
				this.renderStats(categories, totalLinks, containers, vhosts, stats.packages || 0)),

			// Tabs
			E('div', { 'style': 'display: flex; gap: 12px; margin: 24px 0;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green tab-btn',
					'data-tab': '0',
					'click': function(ev) {
						document.querySelectorAll('.tab-btn').forEach(function(b) { b.className = 'kiss-btn tab-btn'; });
						document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; });
						ev.target.className = 'kiss-btn kiss-btn-green tab-btn';
						document.querySelector('.tab-panel[data-panel="0"]').style.display = 'block';
					}
				}, 'LuCI Apps'),
				E('button', {
					'class': 'kiss-btn tab-btn',
					'data-tab': '1',
					'click': function(ev) {
						document.querySelectorAll('.tab-btn').forEach(function(b) { b.className = 'kiss-btn tab-btn'; });
						document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; });
						ev.target.className = 'kiss-btn kiss-btn-green tab-btn';
						document.querySelector('.tab-panel[data-panel="1"]').style.display = 'block';
					}
				}, 'Containers'),
				E('button', {
					'class': 'kiss-btn tab-btn',
					'data-tab': '2',
					'click': function(ev) {
						document.querySelectorAll('.tab-btn').forEach(function(b) { b.className = 'kiss-btn tab-btn'; });
						document.querySelectorAll('.tab-panel').forEach(function(p) { p.style.display = 'none'; });
						ev.target.className = 'kiss-btn kiss-btn-green tab-btn';
						document.querySelector('.tab-panel[data-panel="2"]').style.display = 'block';
					}
				}, 'Vhosts')
			]),

			// Search (for LuCI Apps)
			E('div', { 'class': 'tab-panel', 'data-panel': '0', 'style': 'display: block;' }, [
				E('div', { 'style': 'margin-bottom: 20px; max-width: 400px;' }, [
					E('input', {
						'type': 'text',
						'placeholder': 'Search modules...',
						'id': 'tree-search',
						'style': 'width: 100%; padding: 10px 14px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); border-radius: 6px;',
						'input': function(ev) {
							var q = ev.target.value.toLowerCase();
							var sections = document.querySelectorAll('.luci-tree-section');
							sections.forEach(function(sec) {
								var items = sec.querySelectorAll('div[style*="padding: 4px"]');
								var hasMatch = sec.textContent.toLowerCase().indexOf(q) >= 0;
								items.forEach(function(item) {
									var match = item.textContent.toLowerCase().indexOf(q) >= 0;
									item.style.display = match ? '' : 'none';
									if (match) hasMatch = true;
								});
								sec.style.display = hasMatch ? '' : 'none';
							});
						}
					})
				]),
				this.renderCategoryGrid(categories)
			]),

			// Containers Panel
			E('div', { 'class': 'tab-panel', 'data-panel': '1', 'style': 'display: none;' }, [
				KissTheme.card('LXC Containers (' + containers.length + ')', this.renderContainers(containers))
			]),

			// Vhosts Panel
			E('div', { 'class': 'tab-panel', 'data-panel': '2', 'style': 'display: none;' }, [
				KissTheme.card('HAProxy Virtual Hosts (' + vhosts.length + ')', this.renderVhosts(vhosts))
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/portal/luci-tree');
	}
});
