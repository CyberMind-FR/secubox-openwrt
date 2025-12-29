'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require bandwidth-manager/api as API';

return view.extend({
    load: function() { return API.getMedia(); },
    render: function(data) {
        var media = data.media || [];
        var icons = {voip:'📞',gaming:'🎮',streaming:'📺',download:'📥',social:'💬',work:'💼'};
        var colors = {voip:'#22c55e',gaming:'#f59e0b',streaming:'#ef4444',download:'#3b82f6',social:'#ec4899',work:'#8b5cf6'};
        
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🎯 Media Detection'),
            E('p', {style:'color:#94a3b8'}, 'Automatic traffic classification based on ports, protocols, and domains.'),
            E('div', {style:'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:20px'}, media.map(function(m) {
                return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;border-top:4px solid '+(colors[m.id]||'#64748b')}, [
                    E('div', {style:'font-size:32px;margin-bottom:8px'}, icons[m.id] || '📦'),
                    E('div', {style:'font-size:18px;font-weight:600;color:#f1f5f9'}, m.name),
                    E('div', {style:'color:#94a3b8;font-size:13px;margin-top:4px'}, 'Class: '+m.class)
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
