'use strict';
'require view';
'require dom';
'require poll';
'require uci';
'require rpc';
'require ui';

var callStatus = rpc.declare({
    object: 'luci.repo',
    method: 'status',
    expect: {}
});

var callPackages = rpc.declare({
    object: 'luci.repo',
    method: 'packages',
    params: ['arch'],
    expect: {}
});

var callSync = rpc.declare({
    object: 'luci.repo',
    method: 'sync',
    params: ['version'],
    expect: {}
});

var callLogs = rpc.declare({
    object: 'luci.repo',
    method: 'logs',
    params: ['lines'],
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            callStatus(),
            uci.load('repo')
        ]);
    },

    formatBytes: function(bytes) {
        if (bytes === 0) return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    renderStatus: function(status) {
        var statusClass = status.running ? 'success' : 'danger';
        var statusText = status.running ? _('Running') : _('Stopped');

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, _('Repository Status')),
            E('div', { 'class': 'table' }, [
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td left', 'style': 'width:200px' }, _('Server Status')),
                    E('div', { 'class': 'td' }, [
                        E('span', { 'class': 'label ' + statusClass }, statusText),
                        status.running ? E('span', {}, ' (port ' + status.port + ')') : ''
                    ])
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td left' }, _('Version')),
                    E('div', { 'class': 'td' }, status.version || '-')
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td left' }, _('GitHub Repository')),
                    E('div', { 'class': 'td' }, status.github_repo || '-')
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td left' }, _('Last Sync')),
                    E('div', { 'class': 'td' }, status.last_sync || _('Never'))
                ]),
                E('div', { 'class': 'tr' }, [
                    E('div', { 'class': 'td left' }, _('Auto Sync')),
                    E('div', { 'class': 'td' }, status.auto_sync ?
                        _('Every %d hours').format(status.sync_interval) : _('Disabled'))
                ])
            ])
        ]);
    },

    renderArchitectures: function(status) {
        var archs = status.architectures || {};
        var rows = [];

        Object.keys(archs).sort().forEach(function(arch) {
            rows.push(E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td left' }, arch),
                E('div', { 'class': 'td' }, archs[arch] + ' ' + _('packages'))
            ]));
        });

        if (rows.length === 0) {
            rows.push(E('div', { 'class': 'tr' }, [
                E('div', { 'class': 'td', 'colspan': 2 }, _('No packages synced yet'))
            ]));
        }

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, _('Available Architectures')),
            E('div', { 'class': 'table' }, rows)
        ]);
    },

    renderActions: function(status) {
        var self = this;

        var syncBtn = E('button', {
            'class': 'cbi-button cbi-button-action',
            'click': function() {
                ui.showModal(_('Sync Packages'), [
                    E('p', {}, _('Sync packages from GitHub release?')),
                    E('div', { 'class': 'right' }, [
                        E('button', {
                            'class': 'cbi-button',
                            'click': ui.hideModal
                        }, _('Cancel')),
                        ' ',
                        E('button', {
                            'class': 'cbi-button cbi-button-positive',
                            'click': function() {
                                ui.hideModal();
                                ui.showModal(_('Syncing...'), [
                                    E('p', { 'class': 'spinning' }, _('Downloading packages from GitHub...'))
                                ]);
                                callSync(status.version).then(function() {
                                    setTimeout(function() {
                                        ui.hideModal();
                                        window.location.reload();
                                    }, 3000);
                                });
                            }
                        }, _('Sync Now'))
                    ])
                ]);
            }
        }, _('Sync Packages'));

        var logsBtn = E('button', {
            'class': 'cbi-button',
            'click': function() {
                callLogs(100).then(function(result) {
                    var logs = (result.logs || '').split('|').join('\n');
                    ui.showModal(_('Sync Logs'), [
                        E('pre', { 'style': 'max-height:400px;overflow:auto;font-size:12px;' }, logs || _('No logs')),
                        E('div', { 'class': 'right' }, [
                            E('button', {
                                'class': 'cbi-button',
                                'click': ui.hideModal
                            }, _('Close'))
                        ])
                    ]);
                });
            }
        }, _('View Logs'));

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, _('Actions')),
            E('div', { 'class': 'cbi-value' }, [
                syncBtn, ' ', logsBtn
            ])
        ]);
    },

    renderUsage: function(status) {
        var port = status.port || 8888;

        return E('div', { 'class': 'cbi-section' }, [
            E('h3', {}, _('Usage')),
            E('p', {}, _('Add to /etc/opkg/customfeeds.conf:')),
            E('pre', { 'style': 'background:#f5f5f5;padding:10px;border-radius:4px;' }, [
                '# Local repository\n',
                'src/gz secubox_luci http://127.0.0.1:' + port + '/luci/{ARCH}\n\n',
                '# Or via HTTPS (external)\n',
                'src/gz secubox_luci https://repo.secubox.in/luci/{ARCH}'
            ].join('')),
            E('p', {}, _('Replace {ARCH} with your architecture: x86_64, aarch64_cortex-a72, aarch64_generic, etc.'))
        ]);
    },

    render: function(data) {
        var status = data[0] || {};

        return E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Package Repository')),
            E('div', { 'class': 'cbi-map-descr' },
                _('SecuBox package repository - serves OpenWrt packages locally for opkg installation.')),
            this.renderStatus(status),
            this.renderArchitectures(status),
            this.renderActions(status),
            this.renderUsage(status)
        ]);
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
