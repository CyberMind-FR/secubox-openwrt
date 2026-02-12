'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require auth-guardian/api as api';
'require secubox/kiss-theme';

return view.extend({
    load: function() { return api.getSessions(); },
    render: function(data) {
        var sessions = data.sessions || [];
        return KissTheme.wrap([
            E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
            E('h2', {}, 'Active Sessions'),
            E('div', {'class': 'kiss-card'}, [
                sessions.length ? E('table', {'class': 'kiss-table'}, [
                    E('tr', {}, [
                        E('th', {}, 'Hostname'),
                        E('th', {}, 'IP'),
                        E('th', {}, 'MAC'),
                        E('th', {}, 'Status')
                    ])
                ].concat(sessions.map(function(s) {
                    return E('tr', {}, [
                        E('td', {}, s.hostname || 'Unknown'),
                        E('td', {'style': 'font-family:monospace'}, s.ip),
                        E('td', {'style': 'font-family:monospace;font-size:12px'}, s.mac),
                        E('td', {}, E('span', {'class': 'kiss-badge kiss-badge-green'}, s.status))
                    ]);
                }))) : E('p', {'style': 'color:var(--kiss-muted);text-align:center'}, 'No active sessions')
            ])
        ], 'admin/secubox/auth-guardian/sessions');
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
