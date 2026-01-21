'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require auth-guardian/api as api';

return view.extend({
    load: function() { return api.getVouchers(); },
    render: function(data) {
        var vouchers = data.vouchers || [];
        var self = this;
        
        return E('div', {class:'cbi-map'}, [
            E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
            E('h2', {}, '🎟️ Access Vouchers'),
            E('div', {style:'margin-bottom:16px'}, [
                E('button', {class:'cbi-button cbi-button-positive',click:function(){
                    api.generateVoucher().then(function(r) {
                        ui.addNotification(null, E('p', {}, 'Generated voucher: ' + r.code), 'success');
                        location.reload();
                    });
                }}, '+ Generate Voucher')
            ]),
            E('div', {style:'display:grid;grid-template-columns:repeat(3,1fr);gap:16px'}, vouchers.map(function(v) {
                return E('div', {style:'background:#1e293b;padding:20px;border-radius:12px;text-align:center'}, [
                    E('div', {style:'font-family:monospace;font-size:20px;font-weight:700;color:#06b6d4;letter-spacing:2px'}, v.code),
                    E('div', {style:'margin-top:12px;color:#94a3b8;font-size:13px'}, 'Valid for 24 hours'),
                    E('span', {style:'display:inline-block;margin-top:8px;padding:4px 12px;border-radius:4px;background:'+(v.status==='unused'?'#22c55e20;color:#22c55e':'#64748b20;color:#64748b')}, v.status)
                ]);
            }))
        ]);
    },
    handleSaveApply:null,handleSave:null,handleReset:null
});
