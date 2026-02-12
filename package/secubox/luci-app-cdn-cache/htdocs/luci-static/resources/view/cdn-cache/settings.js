'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require cdn-cache/nav as CdnNav';
'require secubox/kiss-theme';

var callSetEnabled = rpc.declare({
	object: 'luci.cdn-cache',
	method: 'set_enabled',
	params: ['enabled']
});

return view.extend({
	load: function() {
		return uci.load('cdn-cache');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('cdn-cache', 'CDN Cache Settings',
			'Configure the local CDN caching proxy to optimize bandwidth and accelerate content delivery.');

		// Main settings
		s = m.section(form.TypedSection, 'cdn_cache', 'General Settings');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', 'Enable CDN Cache',
			'Enable or disable the caching proxy service');
		o.rmempty = false;

		o = s.option(form.Value, 'cache_dir', 'Cache Directory',
			'Directory where cached files are stored');
		o.default = '/var/cache/cdn';
		o.rmempty = false;

		o = s.option(form.Value, 'cache_size', 'Maximum Cache Size (MB)',
			'Maximum total size of the cache in megabytes');
		o.datatype = 'uinteger';
		o.default = '1024';
		o.rmempty = false;

		o = s.option(form.Value, 'max_object_size', 'Maximum Object Size (MB)',
			'Maximum size of a single cached object');
		o.datatype = 'uinteger';
		o.default = '512';

		o = s.option(form.Value, 'cache_valid', 'Default Cache Duration (minutes)',
			'How long objects are considered fresh by default');
		o.datatype = 'uinteger';
		o.default = '1440';

		o = s.option(form.Value, 'listen_port', 'Proxy Port',
			'Port on which the proxy listens');
		o.datatype = 'port';
		o.default = '3128';

		o = s.option(form.Flag, 'transparent', 'Transparent Proxy',
			'Enable transparent proxying (requires firewall rules)');
		o.default = '0';

		o = s.option(form.ListValue, 'log_level', 'Log Level');
		o.value('debug', 'Debug');
		o.value('info', 'Info');
		o.value('warn', 'Warning');
		o.value('error', 'Error');
		o.default = 'warn';

		// Cache Policies
		s = m.section(form.TableSection, 'cache_policy', 'Cache Policies',
			'Define caching rules for specific domains and file types');
		s.addremove = true;
		s.anonymous = false;
		s.sortable = true;

		o = s.option(form.Flag, 'enabled', 'Enabled');
		o.default = '1';
		o.width = '10%';

		o = s.option(form.Value, 'name', 'Name');
		o.width = '15%';

		o = s.option(form.Value, 'domains', 'Domains',
			'Space-separated list of domains (* for all)');
		o.width = '20%';

		o = s.option(form.Value, 'extensions', 'Extensions',
			'Space-separated file extensions to cache');
		o.width = '20%';

		o = s.option(form.Value, 'cache_time', 'Duration (min)');
		o.datatype = 'uinteger';
		o.default = '1440';
		o.width = '12%';

		o = s.option(form.Value, 'max_size', 'Max Size (MB)');
		o.datatype = 'uinteger';
		o.default = '512';
		o.width = '12%';

		o = s.option(form.Value, 'priority', 'Priority');
		o.datatype = 'uinteger';
		o.default = '5';
		o.width = '10%';

		// Exclusions
		s = m.section(form.TableSection, 'exclusion', 'Exclusions',
			'Domains that should never be cached');
		s.addremove = true;
		s.anonymous = false;

		o = s.option(form.Flag, 'enabled', 'Enabled');
		o.default = '1';
		o.width = '10%';

		o = s.option(form.Value, 'name', 'Name');
		o.width = '20%';

		o = s.option(form.Value, 'domains', 'Domains',
			'Keywords to match in domain names');
		o.width = '35%';

		o = s.option(form.Value, 'reason', 'Reason');
		o.width = '35%';

		// Statistics settings
		s = m.section(form.TypedSection, 'statistics', 'Statistics Settings');
		s.anonymous = true;

		o = s.option(form.Value, 'retention_days', 'Stats Retention (days)',
			'How long to keep statistics data');
		o.datatype = 'uinteger';
		o.default = '30';

		o = s.option(form.Value, 'sample_interval', 'Sample Interval (seconds)',
			'How often to sample statistics');
		o.datatype = 'uinteger';
		o.default = '60';

		return m.render().then(function(formEl) {
			return KissTheme.wrap([
				E('div', { 'class': 'cdn-settings-page' }, [
					E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
					E('link', { 'rel': 'stylesheet', 'href': L.resource('cdn-cache/common.css') }),
					CdnNav.renderTabs('settings'),
					formEl
				])
			], 'admin/services/cdn-cache/settings');
		});
	}
});
