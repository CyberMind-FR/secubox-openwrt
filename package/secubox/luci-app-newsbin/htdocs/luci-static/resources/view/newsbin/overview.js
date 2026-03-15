'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
    object: 'luci.newsbin',
    method: 'status',
    expect: {}
});

var callQueue = rpc.declare({
    object: 'luci.newsbin',
    method: 'queue',
    expect: { items: [] }
});

var callHistory = rpc.declare({
    object: 'luci.newsbin',
    method: 'history',
    expect: { items: [] }
});

var callSearch = rpc.declare({
    object: 'luci.newsbin',
    method: 'search',
    params: ['query'],
    expect: { results: [] }
});

var callAddNzb = rpc.declare({
    object: 'luci.newsbin',
    method: 'add_nzb',
    params: ['url', 'category'],
    expect: {}
});

var callPause = rpc.declare({
    object: 'luci.newsbin',
    method: 'pause',
    expect: {}
});

var callResume = rpc.declare({
    object: 'luci.newsbin',
    method: 'resume',
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            callStatus(),
            callQueue(),
            callHistory()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var queue = data[1] || [];
        var history = data[2] || [];

        var sab = status.sabnzbd || {};
        var hydra = status.nzbhydra || {};

        var view = E('div', { 'class': 'cbi-map' }, [
            E('style', {}, `
                .newsbin-container { max-width: 1200px; margin: 0 auto; }
                .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                .status-card {
                    background: linear-gradient(135deg, #1a1a24, #2a2a3e);
                    border: 1px solid #3a3a4e;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }
                .status-card.running { border-color: #10b981; }
                .status-card.stopped { border-color: #ef4444; }
                .status-value { font-size: 2em; font-weight: 700; color: #00d4ff; }
                .status-label { color: #888; font-size: 0.85em; margin-top: 5px; }
                .search-box {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .search-box input {
                    flex: 1;
                    padding: 12px 16px;
                    background: #12121a;
                    border: 1px solid #3a3a4e;
                    border-radius: 8px;
                    color: #e0e0e0;
                    font-size: 1em;
                }
                .search-box input:focus { outline: none; border-color: #00d4ff; }
                .search-box button {
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #00d4ff, #7c3aed);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: 600;
                    cursor: pointer;
                }
                .section-title { color: #e0e0e0; margin: 20px 0 15px; font-size: 1.2em; }
                .queue-item, .result-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 15px;
                    background: #1a1a24;
                    border: 1px solid #2a2a3e;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .queue-item:hover, .result-item:hover { border-color: #00d4ff; }
                .item-info { flex: 1; }
                .item-name { font-weight: 600; color: #e0e0e0; }
                .item-meta { font-size: 0.85em; color: #888; margin-top: 5px; }
                .progress-bar {
                    width: 100px;
                    height: 8px;
                    background: #2a2a3e;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-left: 15px;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #00d4ff, #7c3aed);
                    transition: width 0.3s;
                }
                .btn-download {
                    padding: 8px 16px;
                    background: #10b981;
                    border: none;
                    border-radius: 6px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 0.85em;
                }
                .btn-download:hover { background: #059669; }
                .control-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
                .control-buttons button {
                    padding: 10px 20px;
                    background: #2a2a3e;
                    border: none;
                    border-radius: 6px;
                    color: #e0e0e0;
                    cursor: pointer;
                }
                .control-buttons button:hover { background: #3a3a4e; }
                #search-results { display: none; }
                #search-results.active { display: block; }
                .empty-state { text-align: center; color: #666; padding: 40px; }
            `),

            E('div', { 'class': 'newsbin-container' }, [
                E('h2', { 'style': 'color: #e0e0e0; margin-bottom: 20px;' }, [
                    E('span', { 'style': 'color: #00d4ff;' }, 'Newsbin'),
                    ' - Usenet'
                ]),

                // Status cards
                E('div', { 'class': 'status-grid' }, [
                    E('div', { 'class': 'status-card ' + (sab.running ? 'running' : 'stopped') }, [
                        E('div', { 'class': 'status-value' }, sab.running ? sab.speed || '0 B/s' : 'OFF'),
                        E('div', { 'class': 'status-label' }, 'SABnzbd Speed')
                    ]),
                    E('div', { 'class': 'status-card ' + (sab.running ? 'running' : 'stopped') }, [
                        E('div', { 'class': 'status-value' }, String(sab.queue_size || 0)),
                        E('div', { 'class': 'status-label' }, 'Queue Items')
                    ]),
                    E('div', { 'class': 'status-card ' + (sab.running ? 'running' : 'stopped') }, [
                        E('div', { 'class': 'status-value' }, (sab.disk_free || '?') + ' GB'),
                        E('div', { 'class': 'status-label' }, 'Disk Free')
                    ]),
                    E('div', { 'class': 'status-card ' + (hydra.running ? 'running' : 'stopped') }, [
                        E('div', { 'class': 'status-value' }, hydra.running ? 'ON' : 'OFF'),
                        E('div', { 'class': 'status-label' }, 'NZBHydra Search')
                    ])
                ]),

                // Control buttons
                E('div', { 'class': 'control-buttons' }, [
                    E('button', { 'id': 'btn-pause' }, 'Pause'),
                    E('button', { 'id': 'btn-resume' }, 'Resume'),
                    E('a', { 'href': sab.url || '#', 'target': '_blank', 'style': 'padding: 10px 20px; background: #2a2a3e; border-radius: 6px; color: #00d4ff; text-decoration: none;' }, 'Open SABnzbd'),
                    E('a', { 'href': hydra.url || '#', 'target': '_blank', 'style': 'padding: 10px 20px; background: #2a2a3e; border-radius: 6px; color: #7c3aed; text-decoration: none;' }, 'Open NZBHydra')
                ]),

                // Search box
                E('div', { 'class': 'search-box' }, [
                    E('input', { 'type': 'text', 'id': 'search-input', 'placeholder': 'Search Usenet...' }),
                    E('button', { 'id': 'btn-search' }, 'Search')
                ]),

                // Search results
                E('div', { 'id': 'search-results' }, [
                    E('h3', { 'class': 'section-title' }, 'Search Results'),
                    E('div', { 'id': 'results-list' })
                ]),

                // Queue
                E('h3', { 'class': 'section-title' }, 'Download Queue'),
                E('div', { 'id': 'queue-list' },
                    queue.length === 0
                        ? E('div', { 'class': 'empty-state' }, 'Queue is empty')
                        : queue.map(function(item) {
                            return E('div', { 'class': 'queue-item' }, [
                                E('div', { 'class': 'item-info' }, [
                                    E('div', { 'class': 'item-name' }, item.filename),
                                    E('div', { 'class': 'item-meta' }, item.size + ' - ' + item.timeleft + ' remaining')
                                ]),
                                E('div', { 'class': 'progress-bar' }, [
                                    E('div', { 'class': 'progress-fill', 'style': 'width: ' + (item.percentage || 0) + '%' })
                                ])
                            ]);
                        })
                ),

                // History
                E('h3', { 'class': 'section-title' }, 'Recent Downloads'),
                E('div', { 'id': 'history-list' },
                    history.length === 0
                        ? E('div', { 'class': 'empty-state' }, 'No download history')
                        : history.slice(0, 10).map(function(item) {
                            return E('div', { 'class': 'queue-item' }, [
                                E('div', { 'class': 'item-info' }, [
                                    E('div', { 'class': 'item-name' }, item.name),
                                    E('div', { 'class': 'item-meta' }, item.size + ' - ' + item.status)
                                ])
                            ]);
                        })
                )
            ])
        ]);

        // Event handlers
        var searchInput = view.querySelector('#search-input');
        var btnSearch = view.querySelector('#btn-search');
        var searchResults = view.querySelector('#search-results');
        var resultsList = view.querySelector('#results-list');

        function doSearch() {
            var query = searchInput.value.trim();
            if (!query) return;

            btnSearch.textContent = 'Searching...';
            btnSearch.disabled = true;

            callSearch(query).then(function(results) {
                resultsList.innerHTML = '';

                if (results.length === 0) {
                    resultsList.appendChild(E('div', { 'class': 'empty-state' }, 'No results found'));
                } else {
                    results.forEach(function(item) {
                        var sizeMB = Math.round(item.size / (1024 * 1024));
                        var resultDiv = E('div', { 'class': 'result-item' }, [
                            E('div', { 'class': 'item-info' }, [
                                E('div', { 'class': 'item-name' }, item.title),
                                E('div', { 'class': 'item-meta' }, sizeMB + ' MB')
                            ]),
                            E('button', { 'class': 'btn-download', 'data-url': item.link }, 'Download')
                        ]);
                        resultsList.appendChild(resultDiv);
                    });

                    // Add download handlers
                    resultsList.querySelectorAll('.btn-download').forEach(function(btn) {
                        btn.addEventListener('click', function() {
                            var url = btn.dataset.url;
                            btn.textContent = 'Adding...';
                            btn.disabled = true;

                            callAddNzb(url, '').then(function(result) {
                                if (result.success) {
                                    btn.textContent = 'Added!';
                                    btn.style.background = '#059669';
                                } else {
                                    btn.textContent = 'Failed';
                                    btn.style.background = '#ef4444';
                                }
                            });
                        });
                    });
                }

                searchResults.classList.add('active');
            }).finally(function() {
                btnSearch.textContent = 'Search';
                btnSearch.disabled = false;
            });
        }

        btnSearch.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doSearch();
        });

        // Pause/Resume
        view.querySelector('#btn-pause').addEventListener('click', function() {
            callPause().then(function() { ui.addNotification(null, E('p', 'Queue paused')); });
        });

        view.querySelector('#btn-resume').addEventListener('click', function() {
            callResume().then(function() { ui.addNotification(null, E('p', 'Queue resumed')); });
        });

        // Auto-refresh queue
        poll.add(function() {
            return callQueue().then(function(queue) {
                var queueList = document.querySelector('#queue-list');
                if (queueList && queue.length > 0) {
                    queueList.innerHTML = '';
                    queue.forEach(function(item) {
                        var queueDiv = E('div', { 'class': 'queue-item' }, [
                            E('div', { 'class': 'item-info' }, [
                                E('div', { 'class': 'item-name' }, item.filename),
                                E('div', { 'class': 'item-meta' }, item.size + ' - ' + item.timeleft + ' remaining')
                            ]),
                            E('div', { 'class': 'progress-bar' }, [
                                E('div', { 'class': 'progress-fill', 'style': 'width: ' + (item.percentage || 0) + '%' })
                            ])
                        ]);
                        queueList.appendChild(queueDiv);
                    });
                }
            });
        }, 5);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
