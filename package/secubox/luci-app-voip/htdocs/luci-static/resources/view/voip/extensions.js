'use strict';
'require view';
'require ui';
'require form';
'require uci';
'require voip.api as api';

return view.extend({
    load: function() {
        return Promise.all([
            uci.load('voip'),
            api.getExtensions()
        ]);
    },

    render: function(data) {
        var m, s, o;

        m = new form.Map('voip', 'Extensions',
            'Manage SIP extensions for internal users.');

        s = m.section(form.GridSection, 'extension', 'Extensions');
        s.addremove = true;
        s.anonymous = false;
        s.nodescriptions = true;

        s.handleAdd = function(ev) {
            var num = prompt('Enter extension number (3-6 digits):');
            if (!num || !/^[0-9]{3,6}$/.test(num)) {
                ui.addNotification(null, E('p', 'Invalid extension number'), 'error');
                return;
            }
            var section = 'ext_' + num;
            uci.add('voip', 'extension', section);
            return this.map.save().then(function() {
                window.location.reload();
            });
        };

        o = s.option(form.Value, 'name', 'Name');
        o.rmempty = false;

        o = s.option(form.Value, 'secret', 'Password');
        o.password = true;
        o.rmempty = false;

        o = s.option(form.ListValue, 'context', 'Context');
        o.value('internal', 'Internal');
        o.value('external', 'External');
        o.default = 'internal';

        o = s.option(form.Flag, 'voicemail', 'Voicemail');
        o.default = '1';

        o = s.option(form.Value, 'vm_email', 'Voicemail Email');
        o.depends('voicemail', '1');
        o.placeholder = 'user@example.com';

        return m.render();
    }
});
