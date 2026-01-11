'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callListPackages = rpc.declare({
    object: 'luci.secubox-store',
    method: 'list_packages',
    expect: { packages: [] }
});

var callInstallPackage = rpc.declare({
    object: 'luci.secubox-store',
    method: 'install_package',
    params: ['package'],
    expect: { success: false }
});

var callRemovePackage = rpc.declare({
    object: 'luci.secubox-store',
    method: 'remove_package',
    params: ['package'],
    expect: { success: false }
});

var callGetFeedStatus = rpc.declare({
    object: 'luci.secubox-store',
    method: 'get_feed_status',
    expect: {}
});

// Icon mapping
var iconMap = {
    'shield': '\u{1F6E1}',
    'lock': '\u{1F512}',
    'activity': '\u{1F4CA}',
    'filter': '\u{1F50D}',
    'users': '\u{1F465}',
    'wifi': '\u{1F4F6}',
    'server': '\u{1F5A5}',
    'box': '\u{1F4E6}',
    'radio': '\u{1F4FB}',
    'message-square': '\u{1F4AC}',
    'eye': '\u{1F441}',
    'bar-chart-2': '\u{1F4CA}',
    'settings': '\u{2699}',
    'globe': '\u{1F310}',
    'cpu': '\u{1F4BB}',
    'film': '\u{1F3AC}',
    'monitor': '\u{1F5B5}',
    'key': '\u{1F511}',
    'palette': '\u{1F3A8}',
    'package': '\u{1F4E6}'
};

// Category colors
var categoryColors = {
    'security': '#e74c3c',
    'network': '#3498db',
    'vpn': '#9b59b6',
    'iot': '#27ae60',
    'monitoring': '#f39c12',
    'system': '#34495e',
    'media': '#e91e63',
    'theme': '#00bcd4',
    'secubox': '#2ecc71',
    'utility': '#95a5a6'
};

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getIcon(iconName) {
    return iconMap[iconName] || '\u{1F4E6}';
}

function getCategoryColor(category) {
    return categoryColors[category] || '#95a5a6';
}

return view.extend({
    load: function() {
        return Promise.all([
            callListPackages(),
            callGetFeedStatus()
        ]);
    },

    renderPackageCard: function(pkg) {
        var self = this;
        var icon = getIcon(pkg.icon);
        var color = getCategoryColor(pkg.category);

        var card = E('div', { 'class': 'package-card', 'data-category': pkg.category }, [
            E('div', { 'class': 'package-header' }, [
                E('span', { 'class': 'package-icon', 'style': 'background-color: ' + color }, icon),
                E('div', { 'class': 'package-title' }, [
                    E('h3', {}, pkg.name),
                    E('span', { 'class': 'package-version' }, 'v' + pkg.version)
                ])
            ]),
            E('p', { 'class': 'package-description' }, pkg.description || 'SecuBox package'),
            E('div', { 'class': 'package-meta' }, [
                E('span', { 'class': 'package-category' }, pkg.category),
                E('span', { 'class': 'package-size' }, formatSize(pkg.size || 0))
            ]),
            E('div', { 'class': 'package-actions' }, [
                pkg.installed
                    ? E('button', {
                        'class': 'btn cbi-button cbi-button-remove',
                        'click': ui.createHandlerFn(self, 'handleRemove', pkg.name)
                    }, 'Remove')
                    : E('button', {
                        'class': 'btn cbi-button cbi-button-action',
                        'click': ui.createHandlerFn(self, 'handleInstall', pkg.name)
                    }, 'Install'),
                pkg.installed
                    ? E('span', { 'class': 'status-installed' }, '\u2713 Installed')
                    : E('span', { 'class': 'status-available' }, 'Available')
            ])
        ]);

        return card;
    },

    handleInstall: function(pkgName, ev) {
        var btn = ev.currentTarget;
        btn.disabled = true;
        btn.textContent = 'Installing...';

        return callInstallPackage(pkgName).then(function(result) {
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Package ' + pkgName + ' installed successfully. Refreshing...'));
                window.location.reload();
            } else {
                ui.addNotification(null, E('p', {}, 'Failed to install ' + pkgName + ': ' + (result.error || 'Unknown error')), 'error');
                btn.disabled = false;
                btn.textContent = 'Install';
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
            btn.disabled = false;
            btn.textContent = 'Install';
        });
    },

    handleRemove: function(pkgName, ev) {
        var btn = ev.currentTarget;

        if (!confirm('Remove package ' + pkgName + '?'))
            return;

        btn.disabled = true;
        btn.textContent = 'Removing...';

        return callRemovePackage(pkgName).then(function(result) {
            if (result.success) {
                ui.addNotification(null, E('p', {}, 'Package ' + pkgName + ' removed successfully. Refreshing...'));
                window.location.reload();
            } else {
                ui.addNotification(null, E('p', {}, 'Failed to remove ' + pkgName + ': ' + (result.error || 'Unknown error')), 'error');
                btn.disabled = false;
                btn.textContent = 'Remove';
            }
        }).catch(function(err) {
            ui.addNotification(null, E('p', {}, 'Error: ' + err.message), 'error');
            btn.disabled = false;
            btn.textContent = 'Remove';
        });
    },

    filterPackages: function(category) {
        var cards = document.querySelectorAll('.package-card');
        cards.forEach(function(card) {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });

        var btns = document.querySelectorAll('.filter-btn');
        btns.forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
    },

    render: function(data) {
        var packages = data[0].packages || data[0] || [];
        var feedStatus = data[1] || {};
        var self = this;

        // Get unique categories
        var categories = ['all'];
        packages.forEach(function(pkg) {
            if (pkg.category && categories.indexOf(pkg.category) === -1) {
                categories.push(pkg.category);
            }
        });

        // Sort packages: installed first, then by name
        packages.sort(function(a, b) {
            if (a.installed !== b.installed) return b.installed ? 1 : -1;
            return a.name.localeCompare(b.name);
        });

        var installedCount = packages.filter(function(p) { return p.installed; }).length;

        var view = E('div', { 'class': 'secubox-store' }, [
            E('style', {}, [
                '.secubox-store { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
                '.store-header { margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; }',
                '.store-header h2 { margin: 0 0 10px 0; }',
                '.store-stats { display: flex; gap: 20px; }',
                '.store-stats span { background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; }',
                '.filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }',
                '.filter-btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; transition: all 0.2s; }',
                '.filter-btn:hover { background: #f0f0f0; }',
                '.filter-btn.active { background: #667eea; color: white; border-color: #667eea; }',
                '.package-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }',
                '.package-card { background: white; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; transition: box-shadow 0.2s; }',
                '.package-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }',
                '.package-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
                '.package-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; }',
                '.package-title h3 { margin: 0; font-size: 16px; }',
                '.package-version { color: #888; font-size: 12px; }',
                '.package-description { color: #666; font-size: 14px; margin-bottom: 12px; line-height: 1.4; }',
                '.package-meta { display: flex; gap: 10px; margin-bottom: 15px; }',
                '.package-category { background: #f0f0f0; padding: 3px 10px; border-radius: 12px; font-size: 12px; text-transform: capitalize; }',
                '.package-size { color: #888; font-size: 12px; }',
                '.package-actions { display: flex; align-items: center; gap: 10px; }',
                '.package-actions .btn { padding: 8px 20px; }',
                '.status-installed { color: #27ae60; font-weight: 500; }',
                '.status-available { color: #888; }',
                '.cbi-button-remove { background: #e74c3c !important; border-color: #e74c3c !important; color: white !important; }',
                '.cbi-button-remove:hover { background: #c0392b !important; }',
                '.no-packages { text-align: center; padding: 40px; color: #888; }'
            ].join('\n')),

            E('div', { 'class': 'store-header' }, [
                E('h2', {}, 'SecuBox Package Store'),
                E('p', {}, 'Install and manage SecuBox packages from the local repository'),
                E('div', { 'class': 'store-stats' }, [
                    E('span', {}, packages.length + ' packages available'),
                    E('span', {}, installedCount + ' installed'),
                    feedStatus.feed_configured
                        ? E('span', {}, '\u2713 Feed configured')
                        : E('span', {}, '\u26A0 Feed not configured')
                ])
            ]),

            E('div', { 'class': 'filter-bar' },
                categories.map(function(cat) {
                    return E('button', {
                        'class': 'filter-btn' + (cat === 'all' ? ' active' : ''),
                        'data-category': cat,
                        'click': function() { self.filterPackages(cat); }
                    }, cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1));
                })
            ),

            packages.length > 0
                ? E('div', { 'class': 'package-grid' },
                    packages.map(function(pkg) {
                        return self.renderPackageCard(pkg);
                    })
                )
                : E('div', { 'class': 'no-packages' }, [
                    E('p', {}, 'No packages found in local feed.'),
                    E('p', {}, 'The local package feed may not be populated yet.')
                ])
        ]);

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
