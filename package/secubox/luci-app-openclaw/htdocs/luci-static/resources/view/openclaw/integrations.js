'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load('openclaw');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('openclaw', 'OpenClaw Integrations',
			'Configure external integrations for your AI assistant. ' +
			'These integrations allow OpenClaw to interact with messaging platforms, email, and calendars.');

		// Telegram Integration
		s = m.section(form.TypedSection, 'integration', 'Telegram Bot');
		s.anonymous = true;
		s.filter = function(section_id) {
			return section_id === 'telegram';
		};

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'bot_token', 'Bot Token');
		o.password = true;
		o.placeholder = 'Enter Telegram bot token from @BotFather';
		o.depends('enabled', '1');

		// Discord Integration
		s = m.section(form.TypedSection, 'integration', 'Discord Bot');
		s.anonymous = true;
		s.filter = function(section_id) {
			return section_id === 'discord';
		};

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'bot_token', 'Bot Token');
		o.password = true;
		o.placeholder = 'Enter Discord bot token';
		o.depends('enabled', '1');

		// Slack Integration
		s = m.section(form.TypedSection, 'integration', 'Slack Bot');
		s.anonymous = true;
		s.filter = function(section_id) {
			return section_id === 'slack';
		};

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'bot_token', 'Bot Token');
		o.password = true;
		o.placeholder = 'xoxb-...';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'app_token', 'App Token');
		o.password = true;
		o.placeholder = 'xapp-...';
		o.depends('enabled', '1');

		// Email Integration
		s = m.section(form.TypedSection, 'integration', 'Email');
		s.anonymous = true;
		s.filter = function(section_id) {
			return section_id === 'email';
		};

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'imap_host', 'IMAP Server');
		o.placeholder = 'imap.example.com';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'imap_port', 'IMAP Port');
		o.placeholder = '993';
		o.datatype = 'port';
		o.default = '993';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'smtp_host', 'SMTP Server');
		o.placeholder = 'smtp.example.com';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'smtp_port', 'SMTP Port');
		o.placeholder = '587';
		o.datatype = 'port';
		o.default = '587';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'email', 'Email Address');
		o.placeholder = 'your@email.com';
		o.datatype = 'email';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'password', 'Password');
		o.password = true;
		o.depends('enabled', '1');

		// Calendar Integration
		s = m.section(form.TypedSection, 'integration', 'Calendar (CalDAV)');
		s.anonymous = true;
		s.filter = function(section_id) {
			return section_id === 'calendar';
		};

		o = s.option(form.Flag, 'enabled', 'Enable');
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.Value, 'caldav_url', 'CalDAV URL');
		o.placeholder = 'https://calendar.example.com/caldav';
		o.depends('enabled', '1');

		o = s.option(form.Value, 'username', 'Username');
		o.depends('enabled', '1');

		o = s.option(form.Value, 'password', 'Password');
		o.password = true;
		o.depends('enabled', '1');

		return m.render();
	}
});
