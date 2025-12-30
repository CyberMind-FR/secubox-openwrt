'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require auth-guardian.api as api';

return view.extend({
    load: function() { return api.getSessions(); },
    render: function(data) {
        var sessions = data.sessions || [];
        return E('div', {class:'cbi-map'}, [
            E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
            E('h2', {}, '👥 Active Sessions'),
            E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                sessions.length ? E('table', {style:'width:100%;color:#f1f5f9'}, [
                    E('tr', {style:'border-bottom:1px solid #334155'}, [
                        E('th', {style:'padding:12px;text-align:left'}, 'Hostname'),
                        E('th', {style:'padding:12px'}, 'IP'),
                        E('th', {style:'padding:12px'}, 'MAC'),
                        E('th', {style:'padding:12px'}, 'Status')
                    ])
                ].concat(sessions.map(function(s) {
                    return E('tr', {}, [
                        E('td', {style:'padding:12px'}, s.hostname || 'Unknown'),
                        E('td', {style:'padding:12px;font-family:monospace'}, s.ip),
                        E('td', {style:'padding:12px;font-family:monospace;font-size:12px'}, s.mac),
                        E('td', {style:'padding:12px'}, E('span', {style:'padding:4px 8px;border-radius:4px;background:#22c55e20;color:#22c55e;font-size:12px'}, s.status))
                    ]);
                }))) : E('p', {style:'color:#64748b;text-align:center'}, 'No active sessions')
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
