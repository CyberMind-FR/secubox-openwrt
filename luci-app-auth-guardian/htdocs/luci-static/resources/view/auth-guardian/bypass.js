'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require auth-guardian.api as api';

return view.extend({
    load: function() { return api.getBypassList(); },
    render: function(data) {
        return E('div', {class:'cbi-map'}, [
            E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
            E('h2', {}, '⏭️ Bypass Rules'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, 'Devices and domains that bypass authentication.'),
            E('div', {style:'display:grid;grid-template-columns:repeat(3,1fr);gap:16px'}, [
                E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                    E('h3', {style:'color:#f1f5f9;margin-bottom:12px'}, '🖥️ MAC Addresses'),
                    E('div', {}, (data.mac || []).map(function(m) {
                        return E('div', {style:'padding:8px;background:#0f172a;border-radius:6px;margin-bottom:8px;font-family:monospace;color:#94a3b8'}, m);
                    }))
                ]),
                E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                    E('h3', {style:'color:#f1f5f9;margin-bottom:12px'}, '🌐 IP Addresses'),
                    E('div', {}, (data.ip || []).map(function(ip) {
                        return E('div', {style:'padding:8px;background:#0f172a;border-radius:6px;margin-bottom:8px;font-family:monospace;color:#94a3b8'}, ip);
                    }))
                ]),
                E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                    E('h3', {style:'color:#f1f5f9;margin-bottom:12px'}, '🔗 Domains'),
                    E('div', {}, (data.domain || []).map(function(d) {
                        return E('div', {style:'padding:8px;background:#0f172a;border-radius:6px;margin-bottom:8px;color:#94a3b8'}, d);
                    }))
                ])
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
