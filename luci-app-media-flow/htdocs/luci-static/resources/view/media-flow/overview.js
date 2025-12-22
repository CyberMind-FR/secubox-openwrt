'use strict';
'require view';
'require media-flow.api as api';

return view.extend({
    load: function() {
        return Promise.all([api.getStatus(), api.getServices(), api.getStats()]);
    },
    render: function(data) {
        var status = data[0] || {};
        var services = data[1].services || [];
        var stats = data[2] || {};
        
        var icons = {tv:'📺',play:'▶️',music:'🎵',video:'📹'};
        
        return E('div', {class:'cbi-map'}, [
            E('style', {}, [
                '.mf{font-family:system-ui,sans-serif}',
                '.mf-hdr{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:24px;border-radius:12px;margin-bottom:20px}',
                '.mf-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}',
                '.mf-stat{background:#1e293b;padding:20px;border-radius:10px;text-align:center}',
                '.mf-stat-val{font-size:24px;font-weight:700;color:#ef4444}',
                '.mf-services{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}'
            ].join('')),
            E('div', {class:'mf'}, [
                E('div', {class:'mf-hdr'}, [
                    E('h1', {style:'margin:0 0 8px;font-size:24px'}, '🎬 Media Flow'),
                    E('p', {style:'margin:0;opacity:.9'}, 'Streaming & Media Traffic Detection')
                ]),
                E('div', {class:'mf-stats'}, [
                    E('div', {class:'mf-stat'}, [E('div', {class:'mf-stat-val'}, status.dpi_active ? '✓' : '✗'), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'DPI Engine')]),
                    E('div', {class:'mf-stat'}, [E('div', {class:'mf-stat-val'}, services.length), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Services')]),
                    E('div', {class:'mf-stat'}, [E('div', {class:'mf-stat-val'}, (stats.connections||{}).total || 0), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Active Flows')]),
                    E('div', {class:'mf-stat'}, [E('div', {class:'mf-stat-val'}, api.formatBytes((stats.bandwidth||{}).streaming || 0)), E('div', {style:'color:#94a3b8;margin-top:4px'}, 'Streaming')])
                ]),
                E('div', {class:'mf-services'}, services.slice(0, 8).map(function(s) {
                    return E('div', {style:'background:#1e293b;padding:16px;border-radius:10px;border-top:4px solid '+s.color}, [
                        E('div', {style:'font-size:24px;margin-bottom:8px'}, icons[s.icon] || '📦'),
                        E('div', {style:'font-weight:600;color:#f1f5f9'}, s.name),
                        E('div', {style:'color:#94a3b8;font-size:12px'}, s.category),
                        E('div', {style:'margin-top:8px;color:'+s.color+';font-weight:600'}, api.formatBytes(s.bytes))
                    ]);
                }))
            ])
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
