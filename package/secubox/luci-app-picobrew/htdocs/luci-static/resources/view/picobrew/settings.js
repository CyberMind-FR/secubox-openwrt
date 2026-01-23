'use strict';
'require view';
'require form';
'require rpc';
'require ui';

var callRestart = rpc.declare({
	object: 'luci.picobrew',
	method: 'restart',
	expect: { result: {} }
});

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('picobrew', _('PicoBrew Settings'),
			_('Configure PicoBrew Server settings. Changes require a service restart to take effect.'));

		// Main settings section
		s = m.section(form.TypedSection, 'picobrew', _('Server Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Service'),
			_('Enable or disable the PicoBrew Server service'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'http_port', _('HTTP Port'),
			_('Port for the PicoBrew web interface'));
		o.datatype = 'port';
		o.default = '8080';
		o.rmempty = false;

		o = s.option(form.Value, 'http_host', _('Listen Address'),
			_('IP address to listen on (0.0.0.0 for all interfaces)'));
		o.datatype = 'ipaddr';
		o.default = '0.0.0.0';
		o.rmempty = false;

		o = s.option(form.Value, 'data_path', _('Data Path'),
			_('Path for storing recipes, sessions, and logs'));
		o.default = '/srv/picobrew';
		o.rmempty = false;

		o = s.option(form.ListValue, 'memory_limit', _('Memory Limit'),
			_('Maximum memory for the container'));
		o.value('256M', '256 MB');
		o.value('512M', '512 MB');
		o.value('768M', '768 MB');
		o.value('1G', '1 GB');
		o.default = '512M';

		o = s.option(form.ListValue, 'log_level', _('Log Level'),
			_('Logging verbosity'));
		o.value('DEBUG', 'Debug');
		o.value('INFO', 'Info');
		o.value('WARNING', 'Warning');
		o.value('ERROR', 'Error');
		o.default = 'INFO';

		// Server section (HTTPS)
		s = m.section(form.TypedSection, 'server', _('HTTPS Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'dns_name', _('DNS Name'),
			_('Domain name for accessing the server (optional)'));
		o.placeholder = 'picobrew.local';
		o.rmempty = true;

		o = s.option(form.Flag, 'https_enabled', _('Enable HTTPS'),
			_('Enable HTTPS (requires certificates)'));
		o.default = '0';

		o = s.option(form.Value, 'cert_path', _('Certificate Path'),
			_('Path to SSL certificate file'));
		o.depends('https_enabled', '1');
		o.rmempty = true;

		o = s.option(form.Value, 'key_path', _('Key Path'),
			_('Path to SSL private key file'));
		o.depends('https_enabled', '1');
		o.rmempty = true;

		// Brewing defaults section
		s = m.section(form.TypedSection, 'brewing', _('Brewing Defaults'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'units', _('Units'),
			_('Temperature and measurement units'));
		o.value('metric', 'Metric (°C, L, kg)');
		o.value('imperial', 'Imperial (°F, gal, lb)');
		o.default = 'metric';

		o = s.option(form.Value, 'default_boil_temp', _('Default Boil Temperature'),
			_('Default boiling temperature'));
		o.datatype = 'uinteger';
		o.default = '100';
		o.rmempty = false;

		o = s.option(form.Value, 'default_mash_temp', _('Default Mash Temperature'),
			_('Default mashing temperature'));
		o.datatype = 'uinteger';
		o.default = '67';
		o.rmempty = false;

		return m.render().then(function(mapEl) {
			// Add restart button after the form
			var restartBtn = E('button', {
				'class': 'cbi-button cbi-button-apply',
				'style': 'margin-top: 1em;',
				'click': function() {
					ui.showModal(_('Restarting Service'), [
						E('p', { 'class': 'spinning' }, _('Restarting PicoBrew Server...'))
					]);
					callRestart().then(function() {
						ui.hideModal();
						ui.addNotification(null, E('p', {}, _('Service restarted successfully')), 'success');
					}).catch(function(err) {
						ui.hideModal();
						ui.addNotification(null, E('p', {}, _('Failed to restart: ') + err.message), 'error');
					});
				}
			}, _('Restart Service'));

			var wrapper = E('div', {}, [mapEl, restartBtn]);
			return wrapper;
		});
	}
});
