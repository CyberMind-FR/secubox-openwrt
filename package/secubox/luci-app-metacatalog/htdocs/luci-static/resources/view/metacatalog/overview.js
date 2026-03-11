'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

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
		return callSync().then(function(res) {
			ui.addNotification(null, E('p', 'Sync started in background. Refresh in a few seconds.'), 'info');
		});
	},

	load: function() {
		return Promise.all([
			callGetStats(),
			callListBooks(),
			callListEntries()
		]);
	},

	render: function(data) {
		var stats = data[0] || {};
		var booksData = data[1] || {};
		var entriesData = data[2] || {};

		var books = (booksData.books || []);
		var entries = (entriesData.entries || []);

		// Build entries lookup
		var entriesMap = {};
		entries.forEach(function(e) {
			entriesMap[e.id] = e;
		});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('style', {}, [
				'.mc-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }',
				'.mc-title { font-size: 1.5rem; font-weight: bold; }',
				'.mc-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }',
				'.mc-chip { padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.75rem; background: #1a1a2e; color: #fff; }',
				'.mc-chip.fire { background: #ff0066; }',
				'.mc-chip.wood { background: #00ff88; color: #000; }',
				'.mc-chip.water { background: #0066ff; }',
				'.mc-chip.metal { background: #cc00ff; }',
				'.mc-actions { margin-left: auto; display: flex; gap: 0.5rem; }',
				'.mc-shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; margin-top: 1rem; }',
				'.mc-book { background: #0a0c1a; border: 1px solid #222; border-left: 4px solid var(--book-color, #cc00ff); padding: 1rem; border-radius: 4px; }',
				'.mc-book-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }',
				'.mc-book-icon { font-size: 1.5rem; }',
				'.mc-book-title { font-weight: bold; }',
				'.mc-book-count { margin-left: auto; font-size: 0.7rem; color: #888; }',
				'.mc-entries { display: flex; flex-direction: column; gap: 0.3rem; }',
				'.mc-entry { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem; background: rgba(255,255,255,0.02); border-radius: 2px; }',
				'.mc-entry:hover { background: rgba(255,255,255,0.05); }',
				'.mc-entry-type { font-size: 0.55rem; padding: 0.1rem 0.3rem; border-radius: 2px; background: #cc00ff; color: #000; }',
				'.mc-entry-type.metablog { background: #ff0066; color: #fff; }',
				'.mc-entry-type.streamlit { background: #00ff88; color: #000; }',
				'.mc-entry-name { font-size: 0.8rem; flex: 1; }',
				'.mc-entry-link { font-size: 0.65rem; color: #0066ff; text-decoration: none; }',
				'.mc-empty { color: #666; font-style: italic; font-size: 0.75rem; }',
				'.mc-landing { margin-top: 1.5rem; padding: 1rem; background: #0a0c1a; border-radius: 4px; }',
				'.mc-landing a { color: #00ffff; }'
			].join('\n')),

			E('div', { 'class': 'mc-header' }, [
				E('span', { 'class': 'mc-title' }, 'Meta Cataloger'),
				E('div', { 'class': 'mc-chips' }, [
					E('span', { 'class': 'mc-chip fire' }, (stats.total_entries || 0) + ' Entries'),
					E('span', { 'class': 'mc-chip wood' }, (stats.metablogs || 0) + ' MetaBlogs'),
					E('span', { 'class': 'mc-chip water' }, (stats.streamlits || 0) + ' Streamlits'),
					E('span', { 'class': 'mc-chip metal' }, (stats.books || 0) + ' Books')
				]),
				E('div', { 'class': 'mc-actions' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, 'handleSync')
					}, 'Sync Now'),
					E('a', {
						'class': 'cbi-button cbi-button-neutral',
						'href': '/metacatalog/',
						'target': '_blank'
					}, 'Landing Page')
				])
			])
		]);

		// Virtual Books shelf
		var shelf = E('div', { 'class': 'mc-shelf' });

		books.forEach(function(book) {
			var bookEntries = (book.entries || []).map(function(eid) {
				return entriesMap[eid];
			}).filter(function(e) { return e; });

			var bookDiv = E('div', { 'class': 'mc-book', 'style': '--book-color: ' + (book.color || '#cc00ff') }, [
				E('div', { 'class': 'mc-book-head' }, [
					E('span', { 'class': 'mc-book-icon' }, book.icon || ''),
					E('span', { 'class': 'mc-book-title' }, book.name || book.id),
					E('span', { 'class': 'mc-book-count' }, bookEntries.length + ' entries')
				]),
				E('div', { 'class': 'mc-entries' },
					bookEntries.length > 0 ?
						bookEntries.slice(0, 8).map(function(entry) {
							return E('div', { 'class': 'mc-entry' }, [
								E('span', { 'class': 'mc-entry-type ' + entry.type }, entry.type),
								E('span', { 'class': 'mc-entry-name' }, (entry.metadata && entry.metadata.title) || entry.name),
								E('a', {
									'class': 'mc-entry-link',
									'href': entry.url,
									'target': '_blank'
								}, entry.domain)
							]);
						}).concat(
							bookEntries.length > 8 ?
								[E('div', { 'class': 'mc-empty' }, '+ ' + (bookEntries.length - 8) + ' more...')] : []
						) :
						[E('div', { 'class': 'mc-empty' }, 'No entries')]
				)
			]);

			shelf.appendChild(bookDiv);
		});

		view.appendChild(shelf);

		// Landing page link
		view.appendChild(E('div', { 'class': 'mc-landing' }, [
			E('strong', {}, 'Public Landing Page: '),
			E('a', { 'href': 'https://catalog.gk2.secubox.in/metacatalog/', 'target': '_blank' },
				'https://catalog.gk2.secubox.in/metacatalog/')
		]));

		return view;
	}
});
