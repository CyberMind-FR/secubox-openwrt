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
            api.getTrunkStatus()
        ]);
    },

    render: function(data) {
        var trunkStatus = data[1] || {};
        var m, s, o;

        m = new form.Map('voip', 'SIP Trunks',
            'Configure SIP trunk connections for external calls.');

        // Trunk status
        s = m.section(form.NamedSection, 'sip_trunk', 'trunk', 'SIP Trunk Status');
        
        o = s.option(form.DummyValue, '_status', 'Registration Status');
        o.rawhtml = true;
        o.cfgvalue = function() {
            var cls = trunkStatus.registered ? 'success' : 'warning';
            var txt = trunkStatus.registered ? 'Registered' : 'Not Registered';
            return '<span class="label ' + cls + '">' + txt + '</span>';
        };

        o = s.option(form.Button, '_test', 'Test Connection');
        o.inputstyle = 'action';
        o.inputtitle = 'Test Trunk';
        o.onclick = function() {
            ui.showModal('Testing...', [E('p', 'Testing trunk connection...')]);
            return api.testTrunk().then(function(res) {
                ui.hideModal();
                ui.showModal('Trunk Test Result', [
                    E('pre', { 'style': 'white-space: pre-wrap;' }, res.output || 'No output'),
                    E('div', { 'class': 'right' }, [
                        E('button', {
                            'class': 'btn',
                            'click': ui.hideModal
                        }, 'Close')
                    ])
                ]);
            });
        };

        // Trunk configuration
        s = m.section(form.NamedSection, 'sip_trunk', 'trunk', 'Trunk Configuration');

        o = s.option(form.Flag, 'enabled', 'Enable Trunk');
        o.default = '0';

        o = s.option(form.ListValue, 'provider', 'Provider');
        o.value('ovh', 'OVH');
        o.value('manual', 'Manual Configuration');
        o.default = 'ovh';

        o = s.option(form.Value, 'host', 'SIP Server');
        o.default = 'sip.ovh.net';

        o = s.option(form.Value, 'username', 'Username');
        o.rmempty = false;

        o = s.option(form.Value, 'password', 'Password');
        o.password = true;
        o.rmempty = false;

        o = s.option(form.Value, 'outbound_proxy', 'Outbound Proxy');
        o.optional = true;

        o = s.option(form.Value, 'codecs', 'Codecs');
        o.default = 'ulaw,alaw,g729';
        o.description = 'Comma-separated list of codecs';

        o = s.option(form.ListValue, 'dtmf_mode', 'DTMF Mode');
        o.value('rfc4733', 'RFC 4733 (RTP)');
        o.value('inband', 'Inband');
        o.value('info', 'SIP INFO');
        o.default = 'rfc4733';

        // OVH API Configuration
        s = m.section(form.NamedSection, 'ovh_telephony', 'ovh', 'OVH API Configuration');
        s.description = 'Configure OVH Telephony API for automatic provisioning. Get credentials at https://eu.api.ovh.com/createToken/';

        o = s.option(form.Flag, 'enabled', 'Enable OVH API');
        o.default = '0';

        o = s.option(form.ListValue, 'endpoint', 'API Endpoint');
        o.value('ovh-eu', 'OVH Europe');
        o.value('ovh-ca', 'OVH Canada');
        o.value('ovh-us', 'OVH US');
        o.default = 'ovh-eu';

        o = s.option(form.Value, 'app_key', 'Application Key');

        o = s.option(form.Value, 'app_secret', 'Application Secret');
        o.password = true;

        o = s.option(form.Value, 'consumer_key', 'Consumer Key');
        o.password = true;

        o = s.option(form.Value, 'billing_account', 'Billing Account');
        o.optional = true;
        o.description = 'Auto-filled when provisioning';

        o = s.option(form.Value, 'service_name', 'Service Name');
        o.optional = true;
        o.description = 'Auto-filled when provisioning';

        return m.render();
    }
});
