'use strict';
'require view';
'require secubox-theme/bootstrap as Theme';
'require bandwidth-manager/api as API';

return view.extend({
    load: function() { return API.getClasses(); },
    render: function(data) {
        var classes = data.classes || [];
        var colors = ['#ef4444','#f59e0b','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
        
        return E('div', {class:'cbi-map'}, [
            E('style', {}, '.qos-grid{display:grid;gap:16px}.qos-card{background:#1e293b;padding:20px;border-radius:12px;border-left:4px solid}.qos-name{font-size:18px;font-weight:600;color:#f1f5f9}.qos-desc{color:#94a3b8;font-size:13px;margin-top:4px}.qos-stats{display:flex;gap:20px;margin-top:16px}.qos-stat{text-align:center}.qos-stat-val{font-size:24px;font-weight:700}.qos-stat-lbl{font-size:11px;color:#64748b}'),
            E('h2', {}, '📊 QoS Priority Classes'),
            E('p', {style:'color:#94a3b8;margin-bottom:20px'}, '8 priority levels for traffic classification. Lower number = higher priority.'),
            E('div', {class:'qos-grid'}, classes.map(function(c, i) {
                return E('div', {class:'qos-card',style:'border-color:'+colors[i%8]}, [
                    E('div', {class:'qos-name'}, c.name),
                    E('div', {class:'qos-desc'}, c.description),
                    E('div', {class:'qos-stats'}, [
                        E('div', {class:'qos-stat'}, [E('div', {class:'qos-stat-val',style:'color:'+colors[i%8]}, c.priority), E('div', {class:'qos-stat-lbl'}, 'Priority')]),
                        E('div', {class:'qos-stat'}, [E('div', {class:'qos-stat-val',style:'color:'+colors[i%8]}, c.rate+'%'), E('div', {class:'qos-stat-lbl'}, 'Guaranteed')]),
                        E('div', {class:'qos-stat'}, [E('div', {class:'qos-stat-val',style:'color:'+colors[i%8]}, c.ceil+'%'), E('div', {class:'qos-stat-lbl'}, 'Maximum')])
                    ])
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
