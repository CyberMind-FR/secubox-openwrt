'use strict';
'require view';
'require media-flow.api as api';

return view.extend({
    load: function() { return api.getServices(); },
    render: function(data) {
        var services = data.services || [];
        var categories = {};
        services.forEach(function(s) {
            if (!categories[s.category]) categories[s.category] = [];
            categories[s.category].push(s);
        });
        
        var catNames = {streaming:'📺 Streaming',voip:'📹 Video Calls',audio:'🎵 Audio'};
        
        return E('div', {class:'cbi-map'}, [
            E('h2', {}, '🎯 Detected Services'),
            E('div', {}, Object.keys(categories).map(function(cat) {
                return E('div', {style:'margin-bottom:24px'}, [
                    E('h3', {style:'color:#f1f5f9;margin-bottom:12px'}, catNames[cat] || cat),
                    E('div', {style:'display:grid;grid-template-columns:repeat(3,1fr);gap:12px'}, categories[cat].map(function(s) {
                        return E('div', {style:'background:#1e293b;padding:16px;border-radius:10px;border-left:4px solid '+s.color}, [
                            E('div', {style:'font-weight:600;color:#f1f5f9;font-size:16px'}, s.name),
                            E('div', {style:'color:#94a3b8;font-size:13px;margin-top:4px'}, s.connections + ' connections'),
                            E('div', {style:'color:'+s.color+';font-weight:600;margin-top:8px'}, api.formatBytes(s.bytes))
                        ]);
                    }))
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
