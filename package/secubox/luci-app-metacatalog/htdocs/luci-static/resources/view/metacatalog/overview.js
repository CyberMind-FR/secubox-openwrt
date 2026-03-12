'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

var callGetStats = rpc.declare({
	object: 'luci.metacatalog',
	method: 'get_stats',
	expect: {}
});

var callListBooks = rpc.declare({
	object: 'luci.metacatalog',
	method: 'list_books',
	expect: {}
});

var callListEntries = rpc.declare({
	object: 'luci.metacatalog',
	method: 'list_entries',
	expect: {}
});

var callSync = rpc.declare({
	object: 'luci.metacatalog',
	method: 'sync',
	expect: {}
});

var callSearch = rpc.declare({
	object: 'luci.metacatalog',
	method: 'search',
	params: ['query'],
	expect: {}
});

return view.extend({
	handleSync: function() {
		ui.showModal('Syncing...', [E('p', { 'class': 'spinning' }, 'Syncing catalog...')]);
		return callSync().then(function(res) {
			ui.hideModal();
			ui.addNotification(null, E('p', 'Sync started. Refresh in a few seconds.'), 'info');
		});
	},

	load: function() {
		return Promise.all([
			callGetStats(),
			callListBooks(),
			callListEntries()
		]);
	},

	renderNav: function(active) {
		var tabs = [
			{ name: 'Overview', path: 'admin/services/metacatalog/overview' },
			{ name: 'Books', path: 'admin/services/metacatalog/books' }
		];

		return E('div', { 'class': 'kiss-tabs' }, tabs.map(function(tab) {
			var isActive = tab.path.indexOf(active) !== -1;
			return E('a', {
				'href': L.url(tab.path),
				'class': 'kiss-tab' + (isActive ? ' active' : '')
			}, tab.name);
		}));
	},

	renderStats: function(stats) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(stats.total_entries || 0, 'Entries', c.red),
			KissTheme.stat(stats.metablogs || 0, 'MetaBlogs', c.green),
			KissTheme.stat(stats.streamlits || 0, 'Streamlits', c.blue),
			KissTheme.stat(stats.books || 0, 'Books', c.purple)
		];
	},

	renderBook: function(book, entriesMap) {
		var bookEntries = (book.entries || []).map(function(eid) {
			return entriesMap[eid];
		}).filter(function(e) { return e; });

		var typeColors = {
			'metablog': 'var(--kiss-red)',
			'streamlit': 'var(--kiss-green)',
			'default': 'var(--kiss-purple)'
		};

		return E('div', {
			'style': 'background: var(--kiss-bg2); border-radius: 8px; padding: 16px; border-left: 3px solid ' + (book.color || 'var(--kiss-purple)') + ';'
		}, [
			E('div', { 'style': 'display: flex; align-items: center; gap: 8px; margin-bottom: 12px;' }, [
				E('span', { 'style': 'font-size: 1.5em;' }, book.icon || ''),
				E('div', { 'style': 'flex: 1;' }, [
					E('div', { 'style': 'font-weight: 600;' }, book.name || book.id),
					E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted);' }, bookEntries.length + ' entries')
				])
			]),
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' },
				bookEntries.length > 0 ?
					bookEntries.slice(0, 6).map(function(entry) {
						var typeColor = typeColors[entry.type] || typeColors['default'];
						return E('div', { 'style': 'display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--kiss-bg); border-radius: 4px;' }, [
							E('span', {
								'style': 'font-size: 9px; padding: 2px 6px; border-radius: 3px; background: ' + typeColor + '20; color: ' + typeColor + ';'
							}, entry.type),
							E('span', { 'style': 'font-size: 12px; flex: 1; overflow: hidden; text-overflow: ellipsis;' },
								(entry.metadata && entry.metadata.title) || entry.name),
							E('a', {
								'href': entry.url,
								'target': '_blank',
								'style': 'font-size: 10px; color: var(--kiss-cyan); text-decoration: none;'
							}, entry.domain)
						]);
					}).concat(
						bookEntries.length > 6 ?
							[E('div', { 'style': 'font-size: 11px; color: var(--kiss-muted); text-align: center; padding: 8px;' }, '+ ' + (bookEntries.length - 6) + ' more...')] : []
					) :
					[E('div', { 'style': 'font-size: 12px; color: var(--kiss-muted); text-align: center; padding: 16px;' }, 'No entries')]
			)
		]);
	},

	render: function(data) {
		var self = this;
		var stats = data[0] || {};
		var booksData = data[1] || {};
		var entriesData = data[2] || {};

		var books = booksData.books || [];
		var entries = entriesData.entries || [];

		var entriesMap = {};
		entries.forEach(function(e) {
			entriesMap[e.id] = e;
		});

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Meta Cataloger'),
					KissTheme.badge((stats.total_entries || 0) + ' ENTRIES', 'green')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' }, 'Unified service catalog with virtual books')
			]),

			// Navigation
			this.renderNav('overview'),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' }, this.renderStats(stats)),

			// Actions
			E('div', { 'style': 'display: flex; gap: 12px; margin-bottom: 20px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': ui.createHandlerFn(this, 'handleSync')
				}, 'Sync Now'),
				E('a', {
					'class': 'kiss-btn',
					'href': '/metacatalog/',
					'target': '_blank',
					'style': 'text-decoration: none;'
				}, 'Landing Page')
			]),

			// Books Grid
			KissTheme.card('Virtual Books (' + books.length + ')',
				books.length > 0 ?
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;' },
						books.map(function(book) {
							return self.renderBook(book, entriesMap);
						})
					) :
					E('div', { 'style': 'text-align: center; padding: 24px; color: var(--kiss-muted);' }, 'No books configured')
			)
		];

		return KissTheme.wrap(content, 'admin/services/metacatalog/overview');
	}
});
