'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require ui';
'require form';
'require bandwidth-manager/api as API';
'require secubox/kiss-theme';

return L.view.extend({
	load: function() {
		return API.listQuotas();
	},

	render: function(quotas) {
		var m = new form.Map('bandwidth', _('Client Quotas'),
			_('Set monthly data quotas for individual clients by MAC address'));

		var s = m.section(form.GridSection, 'quota', _('Quotas'));
		s.anonymous = false;
		s.addremove = true;
		s.sortable = true;

		s.modaltitle = function(section_id) {
			return _('Edit Quota: ') + section_id;
		};

		// Custom render to show usage progress bars
		s.addModalOptions = function(s, section_id, ev) {
			var mac = this.section.formvalue(section_id, 'mac');
			
			if (!mac) {
				ui.addNotification(null, E('p', _('MAC address is required')), 'error');
				return;
			}

			// Save quota via API
			var name = this.section.formvalue(section_id, 'name') || '';
			var limit_mb = parseInt(this.section.formvalue(section_id, 'limit_mb')) || 0;
			var action = this.section.formvalue(section_id, 'action') || 'throttle';
			var reset_day = parseInt(this.section.formvalue(section_id, 'reset_day')) || 1;

			API.setQuota(mac, name, limit_mb, action, reset_day).then(function(result) {
				if (result.success) {
					ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
					window.location.reload();
				} else {
					ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
				}
			});
		};

		var o;

		o = s.option(form.Value, 'mac', _('MAC Address'));
		o.rmempty = false;
		o.datatype = 'macaddr';
		o.placeholder = 'AA:BB:CC:DD:EE:FF';

		o = s.option(form.Value, 'name', _('Client Name'));
		o.placeholder = 'iPhone John';
		o.description = _('Friendly name for this client');

		o = s.option(form.Value, 'limit_mb', _('Monthly Limit (MB)'));
		o.rmempty = false;
		o.datatype = 'uinteger';
		o.placeholder = '10240';
		o.description = _('Monthly data limit in megabytes (e.g., 10240 = 10GB)');

		o = s.option(form.ListValue, 'action', _('Action When Exceeded'));
		o.value('throttle', _('Throttle bandwidth'));
		o.value('block', _('Block all traffic'));
		o.value('notify', _('Notify only'));
		o.default = 'throttle';

		o = s.option(form.Value, 'reset_day', _('Reset Day'));
		o.datatype = 'range(1,28)';
		o.default = '1';
		o.description = _('Day of month to reset quota (1-28)');

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = o.enabled;

		// Show current usage
		s.renderRowActions = function(section_id) {
			var config_name = this.uciconfig || this.map.config;
			var mac = this.cfgvalue(section_id, 'mac');

			var resetBtn = E('button', {
				'class': 'cbi-button cbi-button-action',
				'click': function(ev) {
					ev.preventDefault();
					if (confirm(_('Reset quota counter for this client?'))) {
						API.resetQuota(mac).then(function(result) {
							if (result.success) {
								ui.addNotification(null, E('p', '✓ ' + result.message), 'info');
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', '✗ ' + result.message), 'error');
							}
						});
					}
				}
			}, _('Reset Counter'));

			var actions = form.GridSection.prototype.renderRowActions.call(this, section_id);
			actions.appendChild(resetBtn);
			return actions;
		};

		return m.render().then(function(rendered) {
			return KissTheme.wrap([
				E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
				rendered
			], 'admin/services/bandwidth-manager/quotas');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
