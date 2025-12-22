'use strict';
'require view';
'require media-flow.api as api';

return view.extend({
    load: function() { return api.getProtocols(); },
    render: function(data) {
        var protocols = data.protocols || [];
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '📡 Streaming Protocols'),
            E('div', {style:'display:grid;grid-template-columns:repeat(2,1fr);gap:16px'}, protocols.map(function(p) {
                return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px'}, [
                    E('div', {style:'font-size:20px;font-weight:700;color:#ef4444;margin-bottom:8px'}, p.name),
                    E('div', {style:'color:#94a3b8'}, p.description)
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
