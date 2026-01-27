'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() { return uci.load('mailinabox'); },

	render: function() {
		var m, s, o;

		m = new form.Map('mailinabox', _('Mail Server Settings'),
			_('Configure your mail server. IMPORTANT: Set hostname and domain before installing.'));

		s = m.section(form.TypedSection, 'mailinabox', _('General Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.default = '0';

		o = s.option(form.Value, 'hostname', _('Mail Hostname'),
			_('Full hostname for mail server (e.g., mail.example.com)'));
		o.default = 'mail.example.com';

		o = s.option(form.Value, 'domain', _('Domain'),
			_('Primary email domain (e.g., example.com)'));
		o.default = 'example.com';

		o = s.option(form.Value, 'data_path', _('Data Path'));
		o.default = '/srv/mailserver';

		o = s.option(form.Value, 'timezone', _('Timezone'));
		o.default = 'UTC';

		s = m.section(form.TypedSection, 'mailinabox', _('Ports'));
		s.anonymous = true;

		o = s.option(form.Value, 'smtp_port', _('SMTP Port'));
		o.datatype = 'port';
		o.default = '25';

		o = s.option(form.Value, 'submission_port', _('Submission Port'));
		o.datatype = 'port';
		o.default = '587';

		o = s.option(form.Value, 'imap_port', _('IMAP Port'));
		o.datatype = 'port';
		o.default = '143';

		o = s.option(form.Value, 'imaps_port', _('IMAPS Port'));
		o.datatype = 'port';
		o.default = '993';

		s = m.section(form.TypedSection, 'mailinabox', _('Features'));
		s.anonymous = true;

		o = s.option(form.Flag, 'enable_spamassassin', _('SpamAssassin'));
		o.default = '1';

		o = s.option(form.Flag, 'enable_clamav', _('ClamAV Antivirus'));
		o.default = '0';

		o = s.option(form.Flag, 'enable_fail2ban', _('Fail2ban'));
		o.default = '1';

		o = s.option(form.ListValue, 'ssl_type', _('SSL Type'));
		o.value('letsencrypt', _("Let's Encrypt"));
		o.value('manual', _('Manual'));
		o.value('self-signed', _('Self-signed'));
		o.default = 'letsencrypt';

		return m.render();
	}
});
