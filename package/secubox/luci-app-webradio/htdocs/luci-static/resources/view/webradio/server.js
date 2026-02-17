'use strict';
'require view';
'require form';
'require uci';

return view.extend({
	load: function() {
		return uci.load(['icecast', 'ezstream']);
	},

	render: function() {
		var m, s, o;

		m = new form.Map('icecast', 'Icecast Server Configuration',
			'Configure the Icecast streaming server settings.');

		// Server settings
		s = m.section(form.NamedSection, 'server', 'server', 'Server Settings');
		s.anonymous = false;

		o = s.option(form.Flag, 'enabled', 'Enable Icecast');
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'hostname', 'Hostname');
		o.default = 'localhost';
		o.placeholder = 'localhost';
		o.rmempty = false;

		o = s.option(form.Value, 'port', 'Port');
		o.datatype = 'port';
		o.default = '8000';
		o.rmempty = false;

		o = s.option(form.Value, 'admin_user', 'Admin Username');
		o.default = 'admin';

		o = s.option(form.Value, 'admin_password', 'Admin Password');
		o.password = true;
		o.rmempty = false;

		o = s.option(form.Value, 'source_password', 'Source Password');
		o.password = true;
		o.description = 'Password for source clients (ezstream)';
		o.rmempty = false;

		o = s.option(form.Value, 'max_listeners', 'Max Listeners');
		o.datatype = 'uinteger';
		o.default = '32';

		o = s.option(form.Value, 'max_sources', 'Max Sources');
		o.datatype = 'uinteger';
		o.default = '4';

		o = s.option(form.Value, 'location', 'Location');
		o.default = 'Earth';
		o.placeholder = 'Your location';

		o = s.option(form.Value, 'admin_email', 'Admin Email');
		o.datatype = 'email';
		o.placeholder = 'admin@localhost';

		// Stream source settings (ezstream)
		var m2 = new form.Map('ezstream', 'Stream Source Configuration',
			'Configure the ezstream source client settings.');

		s = m2.section(form.NamedSection, 'source', 'source', 'Source Settings');

		o = s.option(form.Flag, 'enabled', 'Enable Source');
		o.default = '0';

		o = s.option(form.Value, 'name', 'Stream Name');
		o.default = 'WebRadio';

		// Server connection
		s = m2.section(form.NamedSection, 'server', 'server', 'Icecast Connection');

		o = s.option(form.Value, 'hostname', 'Server Address');
		o.default = '127.0.0.1';

		o = s.option(form.Value, 'port', 'Server Port');
		o.datatype = 'port';
		o.default = '8000';

		o = s.option(form.Value, 'password', 'Source Password');
		o.password = true;
		o.description = 'Must match Icecast source password';

		o = s.option(form.Value, 'mount', 'Mount Point');
		o.default = '/live';
		o.placeholder = '/live';

		// Stream settings
		s = m2.section(form.NamedSection, 'stream', 'stream', 'Stream Format');

		o = s.option(form.ListValue, 'format', 'Audio Format');
		o.value('MP3', 'MP3');
		o.value('OGG', 'Ogg Vorbis');
		o.default = 'MP3';

		o = s.option(form.ListValue, 'bitrate', 'Bitrate (kbps)');
		o.value('64', '64 kbps');
		o.value('96', '96 kbps');
		o.value('128', '128 kbps');
		o.value('192', '192 kbps');
		o.value('256', '256 kbps');
		o.value('320', '320 kbps');
		o.default = '128';

		o = s.option(form.ListValue, 'samplerate', 'Sample Rate');
		o.value('22050', '22050 Hz');
		o.value('44100', '44100 Hz');
		o.value('48000', '48000 Hz');
		o.default = '44100';

		o = s.option(form.ListValue, 'channels', 'Channels');
		o.value('1', 'Mono');
		o.value('2', 'Stereo');
		o.default = '2';

		o = s.option(form.Value, 'genre', 'Genre');
		o.default = 'Various';

		o = s.option(form.Value, 'description', 'Description');
		o.default = 'OpenWrt WebRadio';

		o = s.option(form.Flag, 'public', 'Public Stream');
		o.description = 'List on Icecast directory';
		o.default = '0';

		return Promise.all([m.render(), m2.render()]).then(function(rendered) {
			return E('div', {}, rendered);
		});
	}
});
