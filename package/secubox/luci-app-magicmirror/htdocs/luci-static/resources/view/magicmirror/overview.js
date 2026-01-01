'use strict';
'require view';
'require form';
'require rpc';
'require ui';
'require poll';

var callMagicMirrorStatus = rpc.declare({
	object: 'luci.magicmirror',
	method: 'getStatus',
	expect: { }
});

var callMagicMirrorRestart = rpc.declare({
	object: 'luci.magicmirror',
	method: 'restartService',
	expect: { }
});

return view.extend({
	load: function() {
		return Promise.all([
			callMagicMirrorStatus()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var m, s, o;

		m = new form.Map('magicmirror', _('MagicMirror² Overview'),
			_('Smart mirror platform for displaying calendar, weather, news, and custom information modules'));

		// Status section
		s = m.section(form.NamedSection, '_status', 'status', _('Service Status'));

		o = s.option(form.DummyValue, '_service_status', _('Status'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var running = status.status && status.status.running;
			var enabled = status.status && status.status.enabled;

			var html = '<div style="display: flex; align-items: center; gap: 10px;">';

			if (running) {
				html += '<span style="color: #4CAF50; font-weight: bold;">● Running</span>';
			} else {
				html += '<span style="color: #f44336; font-weight: bold;">● Stopped</span>';
			}

			html += '<span style="color: #666;">|</span>';
			html += '<span>Auto-start: ' + (enabled ? 'Enabled' : 'Disabled') + '</span>';

			html += '</div>';
			return html;
		};

		o = s.option(form.DummyValue, '_stats', _('Statistics'));
		o.rawhtml = true;
		o.cfgvalue = function() {
			var stats = status.stats || {};
			var port = (status.status && status.status.port) || '8080';

			var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 10px 0;">';

			html += '<div style="background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center;">';
			html += '<div style="font-size: 24px; font-weight: bold; color: #2196F3;">' + (stats.modules_installed || 0) + '</div>';
			html += '<div style="color: #666; margin-top: 5px;">Modules Installed</div>';
			html += '</div>';

			html += '<div style="background: #f0f0f0; padding: 15px; border-radius: 5px; text-align: center;">';
			html += '<div style="font-size: 18px; font-weight: bold; color: #FF9800;">' + port + '</div>';
			html += '<div style="color: #666; margin-top: 5px;">Web Port</div>';
			html += '</div>';

			html += '</div>';
			return html;
		};

		o = s.option(form.Button, '_open', _('Quick Access'));
		o.inputtitle = _('Open Mirror');
		o.inputstyle = 'apply';
		o.onclick = function() {
			var port = (status.status && status.status.port) || '8080';
			window.open('http://' + window.location.hostname + ':' + port, '_blank');
		};

		o = s.option(form.Button, '_restart', _('Service Control'));
		o.inputtitle = _('Restart Service');
		o.inputstyle = 'action';
		o.onclick = function() {
			return ui.showModal(_('Restarting MagicMirror²'), [
				E('p', { 'class': 'spinning' }, _('Please wait...'))
			]) || Promise.resolve(callMagicMirrorRestart()).then(function() {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Service restart initiated')), 'info');
				setTimeout(function() { window.location.reload(); }, 3000);
			});
		};

		// Configuration section
		s = m.section(form.NamedSection, 'main', 'magicmirror', _('Basic Configuration'));

		o = s.option(form.Flag, 'enabled', _('Enable MagicMirror²'),
			_('Start MagicMirror² service on boot'));
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Web Port'),
			_('Port for accessing the MagicMirror² web interface'));
		o.default = '8080';
		o.datatype = 'port';
		o.placeholder = '8080';

		o = s.option(form.Value, 'timezone', _('Timezone'),
			_('Timezone for date/time display (e.g., Europe/Paris, America/New_York)'));
		o.default = 'UTC';
		o.placeholder = 'UTC';

		o = s.option(form.ListValue, 'language', _('Language'),
			_('Interface language'));
		o.value('en', _('English'));
		o.value('fr', _('French'));
		o.value('de', _('German'));
		o.value('es', _('Spanish'));
		o.value('it', _('Italian'));
		o.value('nl', _('Dutch'));
		o.value('pl', _('Polish'));
		o.value('pt', _('Portuguese'));
		o.value('ru', _('Russian'));
		o.value('zh-cn', _('Chinese (Simplified)'));
		o.value('ja', _('Japanese'));
		o.default = 'en';

		o = s.option(form.ListValue, 'units', _('Units'),
			_('Temperature and measurement units'));
		o.value('metric', _('Metric (°C, km)'));
		o.value('imperial', _('Imperial (°F, miles)'));
		o.default = 'metric';

		// Info section
		s = m.section(form.NamedSection, '_info', 'info', _('Information'));

		o = s.option(form.DummyValue, '_help');
		o.rawhtml = true;
		o.cfgvalue = function() {
			return '<div class="cbi-value-description">' +
				'<h4>About MagicMirror²:</h4>' +
				'<p>MagicMirror² is an open source modular smart mirror platform. It displays information like calendar events, weather, news, and more on any display.</p>' +
				'<h4>Getting Started:</h4>' +
				'<ol>' +
				'<li>Configure basic settings above</li>' +
				'<li>Install modules from the <a href="/cgi-bin/luci/admin/secubox/iot/magicmirror/modules">Modules</a> page</li>' +
				'<li>Customize the layout in <a href="/cgi-bin/luci/admin/secubox/iot/magicmirror/config">Configuration</a></li>' +
				'<li>Access your mirror via the web interface or connect to a display</li>' +
				'</ol>' +
				'<h4>Module Positions:</h4>' +
				'<ul>' +
				'<li><code>top_bar</code> - Full width top bar</li>' +
				'<li><code>top_left</code>, <code>top_center</code>, <code>top_right</code> - Top row</li>' +
				'<li><code>upper_third</code>, <code>middle_center</code>, <code>lower_third</code> - Middle row</li>' +
				'<li><code>bottom_left</code>, <code>bottom_center</code>, <code>bottom_right</code> - Bottom row</li>' +
				'<li><code>bottom_bar</code>, <code>fullscreen_above</code>, <code>fullscreen_below</code> - Special positions</li>' +
				'</ul>' +
				'<h4>Resources:</h4>' +
				'<ul>' +
				'<li><a href="https://docs.magicmirror.builders/" target="_blank">Official Documentation</a></li>' +
				'<li><a href="https://github.com/MichMich/MagicMirror/wiki/3rd-party-modules" target="_blank">3rd Party Modules</a></li>' +
				'<li><a href="https://forum.magicmirror.builders/" target="_blank">Community Forum</a></li>' +
				'</ul>' +
				'</div>';
		};

		return m.render();
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
