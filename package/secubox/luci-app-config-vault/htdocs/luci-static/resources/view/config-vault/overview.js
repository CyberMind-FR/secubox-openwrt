'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callStatus = rpc.declare({
    object: 'luci.config-vault',
    method: 'status',
    expect: {}
});

var callModules = rpc.declare({
    object: 'luci.config-vault',
    method: 'modules',
    expect: {}
});

var callHistory = rpc.declare({
    object: 'luci.config-vault',
    method: 'history',
    params: ['count'],
    expect: {}
});

var callBackup = rpc.declare({
    object: 'luci.config-vault',
    method: 'backup',
    params: ['module'],
    expect: {}
});

var callPush = rpc.declare({
    object: 'luci.config-vault',
    method: 'push',
    expect: {}
});

var callPull = rpc.declare({
    object: 'luci.config-vault',
    method: 'pull',
    expect: {}
});

var callInit = rpc.declare({
    object: 'luci.config-vault',
    method: 'init',
    expect: {}
});

var callExportClone = rpc.declare({
    object: 'luci.config-vault',
    method: 'export_clone',
    params: ['path'],
    expect: {}
});

// KissTheme helper
var KissTheme = {
    colors: {
        purple: '#6366f1',
        cyan: '#06b6d4',
        green: '#22c55e',
        orange: '#f97316',
        red: '#ef4444',
        yellow: '#f59e0b'
    },

    badge: function(text, color) {
        return E('span', {
            'style': 'display:inline-block;padding:0.25rem 0.75rem;background:' +
                (this.colors[color] || color) + '20;color:' +
                (this.colors[color] || color) + ';border-radius:20px;font-size:0.75rem;font-weight:600;'
        }, text);
    },

    statCard: function(icon, value, label, color) {
        return E('div', {
            'class': 'cbi-section',
            'style': 'background:linear-gradient(135deg,rgba(99,102,241,0.05),rgba(6,182,212,0.02));border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:1.25rem;text-align:center;min-width:140px;'
        }, [
            E('div', { 'style': 'font-size:1.75rem;margin-bottom:0.5rem;filter:drop-shadow(0 0 6px ' + (this.colors[color] || '#6366f1') + ');' }, icon),
            E('div', { 'style': 'font-size:1.75rem;font-weight:700;color:#f0f2ff;' }, String(value)),
            E('div', { 'style': 'font-size:0.7rem;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-top:0.25rem;' }, label)
        ]);
    },

    card: function(title, icon, content, badge) {
        return E('div', {
            'class': 'cbi-section',
            'style': 'background:#151525;border:1px solid rgba(255,255,255,0.06);border-radius:16px;margin-bottom:1.5rem;overflow:hidden;'
        }, [
            E('div', {
                'style': 'padding:1rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:0.75rem;'
            }, [
                E('span', { 'style': 'font-size:1.25rem;' }, icon || ''),
                E('span', { 'style': 'font-size:1rem;font-weight:600;flex:1;color:#f0f2ff;' }, title),
                badge ? this.badge(badge.text, badge.color) : ''
            ]),
            E('div', { 'style': 'padding:1.5rem;' }, content)
        ]);
    },

    actionBtn: function(text, icon, color, onclick) {
        return E('button', {
            'class': 'cbi-button',
            'style': 'background:' + (this.colors[color] || '#6366f1') + ';color:white;border:none;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:0.5rem;font-weight:500;transition:all 0.2s;',
            'click': onclick
        }, [icon ? E('span', {}, icon) : '', text]);
    },

    moduleRow: function(mod, onBackup) {
        var statusColor = mod.enabled ? 'green' : 'orange';
        var statusText = mod.enabled ? 'Active' : 'Disabled';

        return E('tr', { 'style': 'border-bottom:1px solid rgba(255,255,255,0.06);' }, [
            E('td', { 'style': 'padding:0.75rem;' }, [
                E('div', { 'style': 'font-weight:600;color:#f0f2ff;' }, mod.name),
                E('div', { 'style': 'font-size:0.75rem;color:#666;' }, mod.description || '')
            ]),
            E('td', { 'style': 'padding:0.75rem;text-align:center;' }, this.badge(statusText, statusColor)),
            E('td', { 'style': 'padding:0.75rem;text-align:center;color:#888;' }, String(mod.files || 0)),
            E('td', { 'style': 'padding:0.75rem;text-align:center;font-size:0.8rem;color:#666;' },
                mod.last_backup ? mod.last_backup.split('T')[0] : '-'),
            E('td', { 'style': 'padding:0.75rem;text-align:right;' },
                E('button', {
                    'class': 'cbi-button cbi-button-action',
                    'style': 'padding:0.25rem 0.75rem;font-size:0.75rem;',
                    'click': function() { onBackup(mod.name); }
                }, 'Backup')
            )
        ]);
    },

    commitRow: function(commit) {
        return E('tr', { 'style': 'border-bottom:1px solid rgba(255,255,255,0.06);' }, [
            E('td', { 'style': 'padding:0.5rem;' }, [
                E('code', { 'style': 'font-size:0.75rem;background:rgba(99,102,241,0.1);padding:0.15rem 0.4rem;border-radius:4px;color:#6366f1;' }, commit.short)
            ]),
            E('td', { 'style': 'padding:0.5rem;color:#f0f2ff;font-size:0.85rem;' }, commit.message),
            E('td', { 'style': 'padding:0.5rem;color:#666;font-size:0.75rem;white-space:nowrap;' },
                commit.date ? commit.date.split(' ')[0] : '')
        ]);
    }
};

return view.extend({
    load: function() {
        return Promise.all([
            callStatus(),
            callModules(),
            callHistory(10)
        ]);
    },

    handleBackup: function(module) {
        var self = this;
        ui.showModal('Backing up...', [
            E('p', { 'class': 'spinning' }, 'Backing up ' + (module || 'all modules') + '...')
        ]);

        callBackup(module || '').then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'Backup completed successfully'), 'success');
                self.load().then(function(data) {
                    dom.content(document.querySelector('.cbi-map'), self.renderContent(data));
                });
            } else {
                ui.addNotification(null, E('p', {}, 'Backup failed: ' + (res.output || 'Unknown error')), 'error');
            }
        });
    },

    handlePush: function() {
        var self = this;
        ui.showModal('Pushing to Gitea...', [
            E('p', { 'class': 'spinning' }, 'Syncing with remote repository...')
        ]);

        callPush().then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'Successfully pushed to Gitea'), 'success');
                self.load().then(function(data) {
                    dom.content(document.querySelector('.cbi-map'), self.renderContent(data));
                });
            } else {
                ui.addNotification(null, E('p', {}, 'Push failed: ' + (res.output || 'Check Gitea configuration')), 'error');
            }
        });
    },

    handlePull: function() {
        var self = this;
        ui.showModal('Pulling from Gitea...', [
            E('p', { 'class': 'spinning' }, 'Fetching latest from repository...')
        ]);

        callPull().then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'Successfully pulled from Gitea'), 'success');
                self.load().then(function(data) {
                    dom.content(document.querySelector('.cbi-map'), self.renderContent(data));
                });
            } else {
                ui.addNotification(null, E('p', {}, 'Pull failed: ' + (res.output || 'Check network')), 'error');
            }
        });
    },

    handleInit: function() {
        var self = this;
        ui.showModal('Initializing Vault...', [
            E('p', { 'class': 'spinning' }, 'Setting up configuration vault...')
        ]);

        callInit().then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.addNotification(null, E('p', {}, 'Vault initialized successfully'), 'success');
                self.load().then(function(data) {
                    dom.content(document.querySelector('.cbi-map'), self.renderContent(data));
                });
            } else {
                ui.addNotification(null, E('p', {}, 'Init failed: ' + (res.output || 'Unknown error')), 'error');
            }
        });
    },

    handleExportClone: function() {
        var self = this;
        var path = '/tmp/secubox-clone-' + new Date().toISOString().split('T')[0] + '.tar.gz';

        ui.showModal('Creating Clone Package...', [
            E('p', { 'class': 'spinning' }, 'Exporting configuration for deployment...')
        ]);

        callExportClone(path).then(function(res) {
            ui.hideModal();
            if (res.success) {
                ui.showModal('Clone Package Ready', [
                    E('div', { 'style': 'text-align:center;' }, [
                        E('div', { 'style': 'font-size:3rem;margin-bottom:1rem;' }, '📦'),
                        E('p', {}, 'Clone package created successfully!'),
                        E('p', { 'style': 'font-family:monospace;background:#0a0a0f;padding:0.5rem;border-radius:4px;margin:1rem 0;' }, res.path),
                        E('p', { 'style': 'color:#666;font-size:0.85rem;' }, 'Size: ' + Math.round((res.size || 0) / 1024) + ' KB'),
                        E('p', { 'style': 'margin-top:1rem;' }, [
                            E('a', {
                                'href': '/cgi-bin/luci/admin/system/flashops/backup?download=' + encodeURIComponent(res.path),
                                'class': 'cbi-button cbi-button-positive'
                            }, 'Download Clone')
                        ])
                    ]),
                    E('div', { 'class': 'right', 'style': 'margin-top:1rem;' }, [
                        E('button', {
                            'class': 'cbi-button',
                            'click': ui.hideModal
                        }, 'Close')
                    ])
                ]);
            } else {
                ui.addNotification(null, E('p', {}, 'Export failed: ' + (res.output || 'Unknown error')), 'error');
            }
        });
    },

    renderContent: function(data) {
        var status = data[0] || {};
        var modulesData = data[1] || {};
        var historyData = data[2] || {};

        var modules = modulesData.modules || [];
        var commits = historyData.commits || [];

        var self = this;

        // Stats cards
        var statsRow = E('div', {
            'style': 'display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:2rem;justify-content:center;'
        }, [
            KissTheme.statCard('🔐', status.initialized ? 'Active' : 'Not Init', 'Vault Status', status.initialized ? 'green' : 'orange'),
            KissTheme.statCard('📦', modules.length, 'Modules', 'purple'),
            KissTheme.statCard('📝', status.total_commits || 0, 'Commits', 'cyan'),
            KissTheme.statCard('⚠️', status.uncommitted || 0, 'Uncommitted', status.uncommitted > 0 ? 'yellow' : 'green')
        ]);

        // Quick Actions
        var actionsContent = E('div', {
            'style': 'display:flex;gap:1rem;flex-wrap:wrap;'
        }, [
            KissTheme.actionBtn('Backup All', '💾', 'purple', function() { self.handleBackup(); }),
            KissTheme.actionBtn('Push to Gitea', '⬆️', 'cyan', function() { self.handlePush(); }),
            KissTheme.actionBtn('Pull from Gitea', '⬇️', 'green', function() { self.handlePull(); }),
            KissTheme.actionBtn('Export Clone', '📦', 'orange', function() { self.handleExportClone(); }),
            !status.initialized ? KissTheme.actionBtn('Initialize Vault', '🚀', 'red', function() { self.handleInit(); }) : ''
        ]);

        // Modules table
        var modulesTable = E('table', {
            'style': 'width:100%;border-collapse:collapse;font-size:0.9rem;'
        }, [
            E('thead', {}, [
                E('tr', { 'style': 'border-bottom:2px solid rgba(255,255,255,0.1);' }, [
                    E('th', { 'style': 'padding:0.75rem;text-align:left;color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;' }, 'Module'),
                    E('th', { 'style': 'padding:0.75rem;text-align:center;color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;' }, 'Status'),
                    E('th', { 'style': 'padding:0.75rem;text-align:center;color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;' }, 'Files'),
                    E('th', { 'style': 'padding:0.75rem;text-align:center;color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;' }, 'Last Backup'),
                    E('th', { 'style': 'padding:0.75rem;text-align:right;color:#888;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;' }, 'Actions')
                ])
            ]),
            E('tbody', {}, modules.map(function(m) {
                return KissTheme.moduleRow(m, function(name) { self.handleBackup(name); });
            }))
        ]);

        // History table
        var historyTable = E('table', {
            'style': 'width:100%;border-collapse:collapse;font-size:0.85rem;'
        }, [
            E('thead', {}, [
                E('tr', { 'style': 'border-bottom:2px solid rgba(255,255,255,0.1);' }, [
                    E('th', { 'style': 'padding:0.5rem;text-align:left;color:#888;font-size:0.7rem;text-transform:uppercase;' }, 'Commit'),
                    E('th', { 'style': 'padding:0.5rem;text-align:left;color:#888;font-size:0.7rem;text-transform:uppercase;' }, 'Message'),
                    E('th', { 'style': 'padding:0.5rem;text-align:right;color:#888;font-size:0.7rem;text-transform:uppercase;' }, 'Date')
                ])
            ]),
            E('tbody', {}, commits.length > 0 ? commits.map(function(c) {
                return KissTheme.commitRow(c);
            }) : E('tr', {}, E('td', { 'colspan': '3', 'style': 'padding:1rem;text-align:center;color:#666;' }, 'No commits yet')))
        ]);

        // Git info
        var gitInfo = status.initialized ? E('div', {
            'style': 'display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;font-size:0.85rem;'
        }, [
            E('div', {}, [
                E('span', { 'style': 'color:#666;' }, 'Branch: '),
                E('span', { 'style': 'color:#f0f2ff;' }, status.branch || 'main')
            ]),
            E('div', {}, [
                E('span', { 'style': 'color:#666;' }, 'Repository: '),
                E('span', { 'style': 'color:#f0f2ff;' }, status.gitea_repo || 'Not configured')
            ]),
            E('div', {}, [
                E('span', { 'style': 'color:#666;' }, 'Last Commit: '),
                E('code', { 'style': 'color:#6366f1;' }, status.last_commit || '-')
            ]),
            E('div', {}, [
                E('span', { 'style': 'color:#666;' }, 'Vault Path: '),
                E('span', { 'style': 'color:#f0f2ff;font-family:monospace;' }, status.vault_path || '/srv/config-vault')
            ])
        ]) : E('p', { 'style': 'color:#f97316;' }, 'Vault not initialized. Click "Initialize Vault" to start.');

        return E('div', {}, [
            // Header
            E('div', {
                'style': 'text-align:center;padding:2rem;margin-bottom:2rem;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.05));border-radius:20px;border:1px solid rgba(255,255,255,0.06);'
            }, [
                E('h1', {
                    'style': 'font-size:2rem;font-weight:800;background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:0.5rem;'
                }, '🔐 Configuration Vault'),
                E('p', { 'style': 'color:rgba(240,242,255,0.6);' }, 'Versioned configuration backup with audit trail')
            ]),

            statsRow,

            KissTheme.card('Quick Actions', '⚡', actionsContent),

            KissTheme.card('Repository Info', '📊', gitInfo),

            KissTheme.card('Modules', '📦', modulesTable, { text: modules.length + ' configured', color: 'purple' }),

            KissTheme.card('Change History', '📜', historyTable, { text: commits.length + ' recent', color: 'cyan' })
        ]);
    },

    render: function(data) {
        var content = this.renderContent(data);

        return E('div', { 'class': 'cbi-map' }, [
            E('style', {}, [
                '.cbi-section { margin: 0; background: transparent; }',
                '.cbi-button:hover { opacity: 0.9; transform: translateY(-1px); }'
            ].join('\n')),
            content
        ]);
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
