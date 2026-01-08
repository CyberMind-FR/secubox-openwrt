'use strict';
'require view';
'require form';
'require ui';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.listAlerts()
		]);
	},

	render: function(data) {
		var alerts = data[0] || [];

		var m = new form.Map('media_flow', _('Streaming Alerts'), 
			_('Configure alerts based on streaming service usage'));

		var s = m.section(form.TypedSection, 'alert', _('Alerts'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		var o;

		o = s.option(form.Value, 'service', _('Service Name'));
		o.placeholder = 'Netflix';
		o.rmempty = false;

		o = s.option(form.Value, 'threshold_hours', _('Threshold (hours)'));
		o.datatype = 'uinteger';
		o.placeholder = '2';
		o.rmempty = false;
		o.description = _('Trigger alert if usage exceeds this many hours per day');

		o = s.option(form.ListValue, 'action', _('Action'));
		o.value('notify', _('Notification only'));
		o.value('limit', _('Limit bandwidth'));
		o.value('block', _('Block service'));
		o.default = 'notify';
		o.rmempty = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;

		// Custom add button handler
		s.addModalOptions = function(s, section_id, ev) {
			var serviceName = this.section.getUIElement(section_id, 'service');
			var thresholdInput = this.section.getUIElement(section_id, 'threshold_hours');
			var actionInput = this.section.getUIElement(section_id, 'action');

			if (serviceName && thresholdInput && actionInput) {
				var service = serviceName.getValue();
				var threshold = parseInt(thresholdInput.getValue());
				var action = actionInput.getValue();

				if (service && threshold) {
					API.setAlert(service, threshold, action).then(function(result) {
						if (result.success) {
							ui.addNotification(null, E('p', _('Alert created successfully')), 'info');
						}
					});
				}
			}
		};

		return m.render().then(function(rendered) {
			return E('div', {}, [
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				rendered
			]);
		});
	}
});
