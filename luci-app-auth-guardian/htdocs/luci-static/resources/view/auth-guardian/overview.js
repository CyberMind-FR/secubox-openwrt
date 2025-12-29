'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require auth-guardian.api as api';

return view.extend({
    load: function() {
        return Promise.all([api.getStatus(), api.getSessions()]);
    },
    render: function(data) {
        var status = data[0] || {};
        var sessions = data[1].sessions || [];
        
        return E('div', {class:'cbi-map'}, [
            E('style', {}, [
                '.ag{font-family:system-ui,sans-serif}',
                '.ag-hdr{background:linear-gradient(135deg,#0891b2,#06b6d4);color:#fff;padding:24px;border-radius:12px;margin-bottom:20px}',
                '.ag-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}',
                '.ag-stat{background:#1e293b;padding:20px;border-radius:10px;text-align:center}',
                '.ag-stat-val{font-size:28px;font-weight:700;color:#06b6d4}',
                '.ag-stat-lbl{font-size:12px;color:#94a3b8;margin-top:4px}'
            ].join('')),
            E('div', {class:'ag'}, [
                E('div', {class:'ag-hdr'}, [
                    E('h1', {style:'margin:0 0 8px;font-size:24px'}, '🔐 Auth Guardian'),
                    E('p', {style:'margin:0;opacity:.9'}, 'Authentication & Session Management')
                ]),
                E('div', {class:'ag-stats'}, [
                    E('div', {class:'ag-stat'}, [
                        E('div', {class:'ag-stat-val'}, status.enabled ? '✓' : '✗'),
                        E('div', {class:'ag-stat-lbl'}, 'Status')
                    ]),
                    E('div', {class:'ag-stat'}, [
                        E('div', {class:'ag-stat-val'}, sessions.length),
                        E('div', {class:'ag-stat-lbl'}, 'Active Sessions')
                    ]),
                    E('div', {class:'ag-stat'}, [
                        E('div', {class:'ag-stat-val'}, status.captive_portal_active ? '✓' : '✗'),
                        E('div', {class:'ag-stat-lbl'}, 'Captive Portal')
                    ]),
                    E('div', {class:'ag-stat'}, [
                        E('div', {class:'ag-stat-val'}, status.auth_method || 'splash'),
                        E('div', {class:'ag-stat-lbl'}, 'Auth Method')
                    ])
                ])
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
