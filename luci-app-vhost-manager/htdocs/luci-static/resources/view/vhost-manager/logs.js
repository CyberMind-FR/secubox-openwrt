'use strict';
'require view';
'require form';
'require vhost-manager/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listVHosts()
		]);
	},

	render: function(data) {
		var vhosts = data[0] || [];

		var m = new form.Map('vhost_manager', _('Access Logs'), 
			_('View nginx access logs for virtual hosts'));

		var s = m.section(form.NamedSection, '__logs', 'logs');
		s.anonymous = true;
		s.addremove = false;

		var o;

		o = s.option(form.ListValue, 'domain', _('Select Domain'));
		o.rmempty = false;
		
		vhosts.forEach(function(vhost) {
			o.value(vhost.domain, vhost.domain);
		});

		if (vhosts.length === 0) {
			o.value('', _('No virtual hosts configured'));
		}

		o = s.option(form.ListValue, 'lines', _('Number of Lines'));
		o.value('50', '50');
		o.value('100', '100');
		o.value('200', '200');
		o.value('500', '500');
		o.default = '50';

		s.render = L.bind(function(view, section_id) {
			var domain = this.section.formvalue(section_id, 'domain');
			var lines = parseInt(this.section.formvalue(section_id, 'lines')) || 50;

			if (!domain || vhosts.length === 0) {
				return E('div', { 'class': 'cbi-section' }, [
					E('p', { 'style': 'font-style: italic' }, _('No virtual hosts to display logs for'))
				]);
			}

			return API.getAccessLogs(domain, lines).then(L.bind(function(data) {
				var logs = data.logs || [];

				return E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Access Logs for: ') + domain),
					E('pre', {
						'style': 'background: #000; color: #0f0; padding: 10px; overflow: auto; max-height: 500px; font-size: 11px; font-family: monospace'
					}, logs.length > 0 ? logs.join('\n') : _('No logs available'))
				]);
			}, this));
		}, this, this);

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
