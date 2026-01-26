'use strict';
'require view';
'require dom';
'require ui';
'require uci';
'require form';
'require magicmirror2/api as api';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

var MM2_NAV = [
	{ id: 'dashboard', icon: '📊', label: 'Dashboard' },
	{ id: 'webui', icon: '🖥️', label: 'Display' },
	{ id: 'modules', icon: '🧩', label: 'Modules' },
	{ id: 'settings', icon: '⚙️', label: 'Settings' }
];

function renderMM2Nav(activeId) {
	return E('div', {
		'class': 'mm2-app-nav',
		'style': 'display:flex;gap:8px;margin-bottom:20px;padding:12px 16px;background:#141419;border:1px solid rgba(255,255,255,0.08);border-radius:12px;'
	}, MM2_NAV.map(function(item) {
		var isActive = activeId === item.id;
		return E('a', {
			'href': L.url('admin', 'secubox', 'services', 'magicmirror2', item.id),
			'style': 'display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:all 0.2s;' +
				(isActive ? 'background:linear-gradient(135deg,#9b59b6,#8e44ad);color:white;' : 'color:#a0a0b0;background:transparent;')
		}, [
			E('span', {}, item.icon),
			E('span', {}, _(item.label))
		]);
	}));
}

return view.extend({
	title: _('MagicMirror2 Settings'),

	load: function() {
		return Promise.all([
			uci.load('magicmirror2'),
			api.getStatus()
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[1] || {};

		var m, s, o;

		m = new form.Map('magicmirror2', null, null);
		m.tabbed = true;

		// General Settings
		s = m.section(form.NamedSection, 'main', 'magicmirror2', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable Service'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'port', _('Web Port'));
		o.datatype = 'port';
		o.default = '8085';
		o.rmempty = false;

		o = s.option(form.Value, 'address', _('Listen Address'));
		o.default = '0.0.0.0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'language', _('Language'));
		o.value('en', 'English');
		o.value('fr', 'Français');
		o.value('de', 'Deutsch');
		o.value('es', 'Español');
		o.value('it', 'Italiano');
		o.value('nl', 'Nederlands');
		o.value('pt', 'Português');
		o.value('ru', 'Русский');
		o.value('zh', '中文');
		o.value('ja', '日本語');
		o.default = 'en';

		o = s.option(form.ListValue, 'timezone', _('Timezone'));
		o.value('Europe/Paris', 'Europe/Paris');
		o.value('Europe/London', 'Europe/London');
		o.value('Europe/Berlin', 'Europe/Berlin');
		o.value('Europe/Madrid', 'Europe/Madrid');
		o.value('Europe/Rome', 'Europe/Rome');
		o.value('Europe/Amsterdam', 'Europe/Amsterdam');
		o.value('Europe/Brussels', 'Europe/Brussels');
		o.value('America/New_York', 'America/New_York');
		o.value('America/Los_Angeles', 'America/Los_Angeles');
		o.value('America/Chicago', 'America/Chicago');
		o.value('Asia/Tokyo', 'Asia/Tokyo');
		o.value('Asia/Shanghai', 'Asia/Shanghai');
		o.value('Australia/Sydney', 'Australia/Sydney');
		o.default = 'Europe/Paris';

		o = s.option(form.Value, 'data_path', _('Data Path'));
		o.default = '/srv/magicmirror2';
		o.rmempty = false;

		o = s.option(form.Value, 'memory_limit', _('Memory Limit'));
		o.default = '512M';
		o.rmempty = false;

		// Display Settings
		s = m.section(form.NamedSection, 'display', 'display', _('Display Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'units', _('Units'));
		o.value('metric', _('Metric (°C, km)'));
		o.value('imperial', _('Imperial (°F, miles)'));
		o.default = 'metric';

		o = s.option(form.ListValue, 'time_format', _('Time Format'));
		o.value('24', _('24 Hour'));
		o.value('12', _('12 Hour'));
		o.default = '24';

		o = s.option(form.Flag, 'show_period', _('Show AM/PM'));
		o.depends('time_format', '12');
		o.default = '1';

		o = s.option(form.Value, 'animation_speed', _('Animation Speed (ms)'));
		o.datatype = 'uinteger';
		o.default = '1000';

		// Weather Settings
		s = m.section(form.NamedSection, 'weather', 'weather', _('Weather Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'weather_enabled', _('Enable Weather Module'), _('Display current weather on the mirror'));
		o.default = '1';

		o = s.option(form.ListValue, 'weather_provider', _('Weather Provider'));
		o.value('openweathermap', 'OpenWeatherMap');
		o.value('weathergov', 'Weather.gov (US only)');
		o.value('weatherbit', 'Weatherbit');
		o.default = 'openweathermap';

		o = s.option(form.Value, 'weather_api_key', _('API Key'));
		o.password = true;
		o.rmempty = true;
		o.description = _('Get your free API key from openweathermap.org');

		o = s.option(form.Value, 'weather_location', _('Location'));
		o.placeholder = 'Paris,FR';
		o.rmempty = true;

		o = s.option(form.Value, 'weather_lat', _('Latitude'));
		o.datatype = 'float';
		o.placeholder = '48.8566';
		o.rmempty = true;

		o = s.option(form.Value, 'weather_lon', _('Longitude'));
		o.datatype = 'float';
		o.placeholder = '2.3522';
		o.rmempty = true;

		// Calendar Settings
		s = m.section(form.NamedSection, 'calendar', 'calendar', _('Calendar Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'calendar_enabled', _('Enable Calendar Module'));
		o.default = '1';

		o = s.option(form.DynamicList, 'calendar_urls', _('Calendar URLs (iCal)'));
		o.rmempty = true;
		o.placeholder = 'https://calendar.google.com/calendar/ical/.../basic.ics';

		o = s.option(form.Value, 'calendar_max_entries', _('Maximum Entries'));
		o.datatype = 'uinteger';
		o.default = '10';

		// News Feed Settings
		s = m.section(form.NamedSection, 'newsfeed', 'newsfeed', _('News Feed Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'newsfeed_enabled', _('Enable News Feed Module'));
		o.default = '1';

		o = s.option(form.DynamicList, 'newsfeed_urls', _('RSS Feed URLs'));
		o.rmempty = true;
		o.placeholder = 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/section/world/rss.xml';

		o = s.option(form.Value, 'newsfeed_max_entries', _('Maximum Entries'));
		o.datatype = 'uinteger';
		o.default = '5';

		o = s.option(form.Value, 'newsfeed_update_interval', _('Update Interval (ms)'));
		o.datatype = 'uinteger';
		o.default = '10000';

		// Clock Settings
		s = m.section(form.NamedSection, 'clock', 'clock', _('Clock Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'clock_enabled', _('Enable Clock Module'));
		o.default = '1';

		o = s.option(form.Flag, 'clock_show_date', _('Show Date'));
		o.default = '1';

		o = s.option(form.Flag, 'clock_show_week', _('Show Week Number'));
		o.default = '0';

		o = s.option(form.Flag, 'clock_show_seconds', _('Show Seconds'));
		o.default = '1';

		o = s.option(form.ListValue, 'clock_display_type', _('Display Type'));
		o.value('digital', _('Digital'));
		o.value('analog', _('Analog'));
		o.value('both', _('Both'));
		o.default = 'digital';

		// Compliments Settings
		s = m.section(form.NamedSection, 'compliments', 'compliments', _('Compliments Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'compliments_enabled', _('Enable Compliments Module'));
		o.default = '1';

		o = s.option(form.Value, 'compliments_update_interval', _('Update Interval (ms)'));
		o.datatype = 'uinteger';
		o.default = '30000';

		o = s.option(form.DynamicList, 'compliments_morning', _('Morning Compliments'));
		o.rmempty = true;
		o.placeholder = 'Good morning, sunshine!';

		o = s.option(form.DynamicList, 'compliments_afternoon', _('Afternoon Compliments'));
		o.rmempty = true;
		o.placeholder = 'Looking good today!';

		o = s.option(form.DynamicList, 'compliments_evening', _('Evening Compliments'));
		o.rmempty = true;
		o.placeholder = 'Wow, you look fantastic!';

		var formRender = m.render();

		return formRender.then(function(formEl) {
			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(renderMM2Nav('settings'));

			// Add custom styles for form
			wrapper.appendChild(E('style', {}, [
				'.cbi-map { background: #141419; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }',
				'.cbi-section { margin-bottom: 20px; }',
				'.cbi-section-node { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 16px; }',
				'.cbi-tabmenu { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }',
				'.cbi-tabmenu li { list-style: none; }',
				'.cbi-tabmenu li a { display: block; padding: 10px 20px; background: rgba(255,255,255,0.05); border-radius: 8px; color: #a0a0b0; text-decoration: none; font-weight: 500; }',
				'.cbi-tabmenu li.cbi-tab a { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; }',
				'.cbi-value { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }',
				'.cbi-value:last-child { border-bottom: none; }',
				'.cbi-value-title { flex: 0 0 200px; font-weight: 500; color: #fff; }',
				'.cbi-value-field { flex: 1; }',
				'.cbi-value-description { font-size: 12px; color: #a0a0b0; margin-top: 4px; }',
				'.cbi-input-text, .cbi-input-select, .cbi-input-password { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 14px; }',
				'.cbi-input-text:focus, .cbi-input-select:focus, .cbi-input-password:focus { outline: none; border-color: #9b59b6; }',
				'.cbi-button { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }',
				'.cbi-button-save, .cbi-button-apply { background: linear-gradient(135deg, #27ae60, #229954); color: white; }',
				'.cbi-button-reset { background: rgba(255,255,255,0.1); color: white; }',
				'.cbi-checkbox { accent-color: #9b59b6; }',
				'.cbi-dynlist { display: flex; flex-direction: column; gap: 8px; }',
				'.cbi-dynlist > .item { display: flex; gap: 8px; align-items: center; }',
				'.cbi-dynlist > .item > input { flex: 1; }'
			].join('')));

			// Regenerate config button
			var actionBar = E('div', {
				'style': 'display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: #141419; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;'
			}, [
				E('button', {
					'class': 'cbi-button',
					'style': 'background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;',
					'click': function() {
						ui.showModal(_('Regenerating...'), [
							E('p', { 'class': 'spinning' }, _('Regenerating MagicMirror2 config.js...'))
						]);
						api.regenerateConfig().then(function(res) {
							ui.hideModal();
							if (res.success) {
								ui.addNotification(null, E('p', {}, _('Configuration regenerated. Restart the service to apply changes.')), 'success');
							} else {
								ui.addNotification(null, E('p', {}, res.message || _('Failed to regenerate config')), 'error');
							}
						});
					}
				}, ['🔧 ', _('Regenerate Config')]),
				E('button', {
					'class': 'cbi-button',
					'style': 'background: linear-gradient(135deg, #3498db, #2980b9); color: white;',
					'click': function() {
						if (!status.running) {
							ui.addNotification(null, E('p', {}, _('Service is not running')), 'warning');
							return;
						}
						ui.showModal(_('Restarting...'), [
							E('p', { 'class': 'spinning' }, _('Restarting MagicMirror2...'))
						]);
						api.serviceRestart().then(function() {
							ui.hideModal();
							ui.addNotification(null, E('p', {}, _('Service restarted')), 'success');
						});
					}
				}, ['🔄 ', _('Restart Service')])
			]);

			wrapper.appendChild(actionBar);
			wrapper.appendChild(formEl);
			return wrapper;
		});
	},

	handleSave: function(ev) {
		var map = document.querySelector('.cbi-map');
		return dom.callClassMethod(map, 'save').then(function() {
			return uci.save();
		}).then(function() {
			ui.addNotification(null, E('p', {}, _('Settings saved. Click "Regenerate Config" to apply changes.')), 'info');
		});
	},

	handleSaveApply: function(ev) {
		return this.handleSave(ev).then(function() {
			return api.regenerateConfig();
		}).then(function() {
			ui.addNotification(null, E('p', {}, _('Settings saved and config regenerated.')), 'success');
		});
	}
});
