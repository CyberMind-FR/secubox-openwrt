'use strict';
'require view';
'require dom';
'require rpc';
'require poll';

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

	render: function(data) {
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

		var runningContainers = containers.filter(function(c) { return c.state === 'running'; }).length;
		var enabledVhosts = vhosts.filter(function(v) { return v.enabled === '1'; }).length;

		var style = E('style', {}, [
			'.luci-tree-page { background: #111; min-height: 100vh; padding: 20px; font-family: monospace; }',
			'.luci-tree-header { text-align: center; margin-bottom: 30px; }',
			'.luci-tree-header h1 { color: #0f0; font-size: 24px; margin: 0 0 10px 0; }',
			'.luci-tree-header p { color: #888; margin: 0; }',
			'.luci-tree-stats { display: flex; justify-content: center; gap: 20px; margin: 20px 0; flex-wrap: wrap; }',
			'.luci-tree-stat { text-align: center; padding: 10px 15px; background: #222; border-radius: 8px; min-width: 80px; }',
			'.luci-tree-stat-value { font-size: 20px; color: #0ff; }',
			'.luci-tree-stat-label { font-size: 11px; color: #888; }',
			'.luci-tree-search { margin: 20px auto; max-width: 400px; }',
			'.luci-tree-search input { width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; box-sizing: border-box; }',
			'.luci-tree-search input:focus { outline: none; border-color: #0f0; }',
			'.luci-tree-tabs { display: flex; justify-content: center; gap: 10px; margin: 20px 0; flex-wrap: wrap; }',
			'.luci-tree-tab { padding: 8px 16px; background: #222; border: 1px solid #333; border-radius: 4px; color: #888; cursor: pointer; }',
			'.luci-tree-tab:hover { border-color: #0f0; color: #0f0; }',
			'.luci-tree-tab.active { background: #0f0; color: #000; border-color: #0f0; }',
			'.luci-tree-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }',
			'.luci-tree-section { background: #1a1a1a; border-left: 3px solid #0f0; border-radius: 4px; padding: 15px; }',
			'.luci-tree-section-title { color: #0f0; font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid #333; padding-bottom: 8px; display: flex; justify-content: space-between; }',
			'.luci-tree-section-count { color: #888; font-size: 12px; }',
			'.luci-tree-item { padding: 3px 0; font-size: 13px; }',
			'.luci-tree-item a { color: #0ff; text-decoration: none; }',
			'.luci-tree-item a:hover { color: #fff; text-decoration: underline; }',
			'.luci-tree-item::before { content: "- "; color: #555; }',
			'.luci-tree-item .pkg { color: #666; font-size: 10px; margin-left: 5px; }',
			'.luci-tree-panel { display: none; }',
			'.luci-tree-panel.active { display: block; }',
			'.luci-tree-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }',
			'.luci-tree-container-item { padding: 8px 12px; background: #222; border-radius: 4px; display: flex; align-items: center; gap: 8px; }',
			'.luci-tree-container-status { width: 8px; height: 8px; border-radius: 50%; }',
			'.luci-tree-container-status.running { background: #0f0; }',
			'.luci-tree-container-status.stopped { background: #f00; }',
			'.luci-tree-vhost { padding: 8px 12px; background: #222; border-radius: 4px; margin-bottom: 8px; }',
			'.luci-tree-vhost-domain { color: #0ff; }',
			'.luci-tree-vhost-backend { color: #888; font-size: 11px; }',
			'.luci-tree-refresh { margin-left: 10px; padding: 5px 10px; background: #333; border: none; color: #0f0; border-radius: 4px; cursor: pointer; }',
			'.luci-tree-refresh:hover { background: #444; }'
		].join('\n'));

		var self = this;

		var refreshBtn = E('button', {
			'class': 'luci-tree-refresh',
			'click': function() {
				self.load().then(function(newData) {
					var content = document.querySelector('.luci-tree-page');
					if (content) {
						dom.content(content.parentNode, self.render(newData));
					}
				});
			}
		}, 'Refresh');

		var header = E('div', { 'class': 'luci-tree-header' }, [
			E('h1', {}, ['SecuBox Navigation Tree ', refreshBtn]),
			E('p', {}, 'Auto-generated map of all SecuBox components and services')
		]);

		var statsEl = E('div', { 'class': 'luci-tree-stats' }, [
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(categories.length)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Categories')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(totalLinks)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'LuCI Apps')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(stats.packages || 0)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Packages')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, runningContainers + '/' + containers.length),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Containers')
			]),
			E('div', { 'class': 'luci-tree-stat' }, [
				E('div', { 'class': 'luci-tree-stat-value' }, String(enabledVhosts)),
				E('div', { 'class': 'luci-tree-stat-label' }, 'Vhosts')
			])
		]);

		var tabs = E('div', { 'class': 'luci-tree-tabs' });
		var tabNames = ['LuCI Apps', 'Containers', 'Vhosts'];
		tabNames.forEach(function(name, idx) {
			var tab = E('div', {
				'class': 'luci-tree-tab' + (idx === 0 ? ' active' : ''),
				'data-tab': idx,
				'click': function(ev) {
					document.querySelectorAll('.luci-tree-tab').forEach(function(t) { t.classList.remove('active'); });
					document.querySelectorAll('.luci-tree-panel').forEach(function(p) { p.classList.remove('active'); });
					ev.target.classList.add('active');
					document.querySelector('.luci-tree-panel[data-panel="' + idx + '"]').classList.add('active');
				}
			}, name);
			tabs.appendChild(tab);
		});

		var searchInput = E('input', {
			'type': 'text',
			'placeholder': 'Search modules...',
			'id': 'tree-search'
		});

		searchInput.addEventListener('input', function(ev) {
			var q = ev.target.value.toLowerCase();
			var sections = document.querySelectorAll('.luci-tree-section');
			sections.forEach(function(sec) {
				var items = sec.querySelectorAll('.luci-tree-item');
				var hasMatch = sec.querySelector('.luci-tree-section-title').textContent.toLowerCase().indexOf(q) >= 0;
				items.forEach(function(item) {
					var match = item.textContent.toLowerCase().indexOf(q) >= 0;
					item.style.display = match ? '' : 'none';
					if (match) hasMatch = true;
				});
				sec.style.display = hasMatch ? '' : 'none';
			});
		});

		var search = E('div', { 'class': 'luci-tree-search' }, [searchInput]);

		// Panel 0: LuCI Apps Grid
		var grid = E('div', { 'class': 'luci-tree-grid' });
		categories.forEach(function(category) {
			if (!category.items || category.items.length === 0) return;

			var section = E('div', { 'class': 'luci-tree-section' }, [
				E('div', { 'class': 'luci-tree-section-title' }, [
					E('span', {}, category.cat),
					E('span', { 'class': 'luci-tree-section-count' }, '(' + category.items.length + ')')
				])
			]);

			category.items.forEach(function(item) {
				var itemEl = E('div', { 'class': 'luci-tree-item' }, [
					E('a', { 'href': '/cgi-bin/luci/' + item.path, 'target': '_blank' }, item.name)
				]);
				if (item.package) {
					itemEl.appendChild(E('span', { 'class': 'pkg' }, item.package));
				}
				section.appendChild(itemEl);
			});

			grid.appendChild(section);
		});

		var panel0 = E('div', { 'class': 'luci-tree-panel active', 'data-panel': '0' }, [search, grid]);

		// Panel 1: Containers
		var containerGrid = E('div', { 'class': 'luci-tree-container' });
		containers.forEach(function(c) {
			containerGrid.appendChild(E('div', { 'class': 'luci-tree-container-item' }, [
				E('div', { 'class': 'luci-tree-container-status ' + c.state }),
				E('span', {}, c.name)
			]));
		});
		var panel1 = E('div', { 'class': 'luci-tree-panel', 'data-panel': '1' }, [
			E('h3', { 'style': 'color: #0f0; margin: 20px 0 10px 0;' }, 'LXC Containers (' + containers.length + ')'),
			containerGrid
		]);

		// Panel 2: Vhosts
		var vhostList = E('div', { 'style': 'max-height: 500px; overflow-y: auto; margin-top: 15px;' });
		vhosts.forEach(function(v) {
			if (!v.domain) return;
			vhostList.appendChild(E('div', { 'class': 'luci-tree-vhost' }, [
				E('div', { 'class': 'luci-tree-vhost-domain' }, [
					E('a', { 'href': 'https://' + v.domain, 'target': '_blank', 'style': 'color: #0ff; text-decoration: none;' }, v.domain)
				]),
				E('div', { 'class': 'luci-tree-vhost-backend' }, 'Backend: ' + (v.backend || 'N/A') + (v.ssl === '1' ? ' | SSL' : ''))
			]));
		});
		var panel2 = E('div', { 'class': 'luci-tree-panel', 'data-panel': '2' }, [
			E('h3', { 'style': 'color: #0f0; margin: 20px 0 10px 0;' }, 'HAProxy Virtual Hosts (' + vhosts.length + ')'),
			vhostList
		]);

		return E('div', { 'class': 'luci-tree-page' }, [style, header, statsEl, tabs, panel0, panel1, panel2]);
	}
});
