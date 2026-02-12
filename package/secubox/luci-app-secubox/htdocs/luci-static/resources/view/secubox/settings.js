'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require secubox/api as API';
'require secubox-theme/theme as Theme';
'require secubox/nav as SecuNav';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

// Load theme resources
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/secubox-theme.css')
}));
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('secubox-theme/themes/cyberpunk.css')
}));

var secuLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: secuLang });

var THEME_CHOICES = ['dark', 'light', 'system', 'cyberpunk'];

function sanitizeTheme(theme) {
	return THEME_CHOICES.indexOf(theme) > -1 ? theme : 'dark';
}

function getMainValue(option, fallback) {
	var val = uci.get('secubox', 'main', option);
	return (val != null && val !== '') ? val : fallback;
}

function getMainBool(option, fallback) {
	var defaultValue = fallback ? '1' : '0';
	return getMainValue(option, defaultValue) !== '0';
}

function getThemeLabel(theme) {
	switch (theme) {
		case 'light':
			return _('Light');
		case 'system':
			return _('System Preference');
		case 'cyberpunk':
			return _('Cyberpunk');
		default:
			return _('Dark (Default)');
	}
}

function getThemeDescription(theme) {
	switch (theme) {
		case 'light':
			return _('Bright and clean layout for well-lit spaces.');
		case 'system':
			return _('Follows your OS or browser preference automatically.');
		case 'cyberpunk':
			return _('Neon purples, synth glow effects, and extra contrast.');
		default:
			return _('Modern neon-friendly dark interface (default).');
	}
}

function describeThemeChoice(theme) {
	var label = getThemeLabel(theme);
	var desc = getThemeDescription(theme);
	return desc ? label + ' - ' + desc : label;
}

function formatRefreshLabel(interval) {
	switch (interval) {
		case '15':
			return _('Every 15 seconds');
		case '30':
			return _('Every 30 seconds');
		case '60':
			return _('Every minute');
		case '0':
			return _('Manual refresh only');
		default:
			return _('Every %s seconds').format(interval || '30');
	}
}

function describeAutomation(autoDiscovery, autoStart) {
	if (autoDiscovery && autoStart)
		return _('New modules are discovered and auto-started.');
	if (autoDiscovery && !autoStart)
		return _('Discovery is on, but modules require manual start.');
	if (!autoDiscovery && autoStart)
		return _('Manual discovery, but auto-start once registered.');
	return _('Fully manual provisioning workflow.');
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('secubox'),
			API.getStatus()
		]);
	},

	render: function(data) {
		var status = data[1] || {};
		var theme = sanitizeTheme(getMainValue('theme', 'dark'));
		var versionPref = getMainValue('version', '0.1.2');
		var refreshPref = getMainValue('refresh_interval', '30');
		var notificationsPref = getMainBool('notifications', true);
		var autoDiscoveryPref = getMainBool('auto_discovery', true);
		var autoStartPref = getMainBool('auto_start', false);
		var secuboxEnabled = (typeof status.enabled !== 'undefined') ? !!status.enabled : getMainBool('enabled', true);
		var versionDisplay = (status.version && status.version !== 'unknown') ? status.version : versionPref;
		var moduleCount = (status.modules_total || status.modules_total === 0) ? status.modules_total : '—';
		var m, s, o;

		// Create wrapper container with modern header
		var versionChip = this.renderHeaderChip('🏷️', _('Version'), versionDisplay || '—', 'neutral');
		var statusChip = this.renderHeaderChip('⚡', _('Status'), secuboxEnabled ? _('On') : _('Off'),
			secuboxEnabled ? 'success' : 'danger');
		var modulesChip = this.renderHeaderChip('🧩', _('Modules'), moduleCount);

		var container = E('div', { 'class': 'secubox-settings-page' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/core/variables.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/common.css') }),
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox/secubox.css') }),

			SecuNav.renderTabs('settings'),

			E('div', { 'class': 'sh-page-header sh-page-header-lite' }, [
				E('div', {}, [
					E('h2', { 'class': 'sh-page-title' }, [
						E('span', { 'class': 'sh-page-title-icon' }, '⚙️'),
						'SecuBox Settings'
					]),
					E('p', { 'class': 'sh-page-subtitle' },
						'Configure global settings for the SecuBox security suite')
				]),
				E('div', { 'class': 'sh-header-meta' }, [
					versionChip,
					statusChip,
					modulesChip
				])
			]),
			this.renderPreferenceShowcase({
				theme: theme,
				refresh: refreshPref,
				notifications: notificationsPref,
				autoDiscovery: autoDiscoveryPref,
				autoStart: autoStartPref
			})
		]);

		// Create form
		m = new form.Map('secubox', null, null);

		// General Settings Section
		s = m.section(form.TypedSection, 'core', '🔧 General Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '🔌 Enable SecuBox',
			'Master switch for all SecuBox modules. When disabled, all module services will be stopped.');
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.Value, 'version', '📦 Version',
			'Current SecuBox version (read-only)');
		o.readonly = true;
		o.default = versionPref;
		o.cfgvalue = function() {
			return versionDisplay;
		};

		// Dashboard Settings Section
		s = m.section(form.TypedSection, 'core', '📊 Dashboard Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.ListValue, 'theme', '🎨 Dashboard Theme',
			'Choose the visual theme for the SecuBox dashboard');
		THEME_CHOICES.forEach(function(choice) {
			o.value(choice, describeThemeChoice(choice));
		});
		o.default = 'dark';
		o.currentThemePref = theme;
		o.renderWidget = function(section_id, option_index, cfgvalue) {
			var widget = form.ListValue.prototype.renderWidget.apply(this, [section_id, option_index, cfgvalue]);
			var select = widget.querySelector('select');
			if (!select)
				return widget;

			var initialSelection = sanitizeTheme(this.currentThemePref || cfgvalue);
			var lastPersisted = initialSelection;
			var previewLabel = E('strong', { 'class': 'theme-preview-label' }, getThemeLabel(initialSelection));
			var previewHint = E('p', {
				'class': 'theme-preview-hint',
				'style': 'margin: 4px 0; font-size: 0.9em;'
			}, getThemeDescription(initialSelection));
			var statusLine = E('p', {
				'class': 'theme-preview-status',
				'style': 'margin: 0; font-size: 0.85em; color: var(--sh-muted, #94a3b8);'
			}, _('Synced with router preferences.'));

			var previewPanel = E('div', {
				'class': 'theme-preview-panel',
				'style': 'margin-top: 10px; padding: 10px; border: 1px dashed var(--sh-border, #475569); border-radius: 10px;'
			}, [
				E('div', {
					'class': 'theme-preview-title',
					'style': 'font-weight: 600; font-size: 0.95em;'
				}, _('Live preview & instant save')),
				E('div', {
					'class': 'theme-preview-current',
					'style': 'margin-top: 6px; font-size: 0.95em;'
				}, [
					E('span', { 'style': 'color: var(--sh-muted, #94a3b8);' }, _('Current choice: ')),
					previewLabel
				]),
				previewHint,
				statusLine
			]);

			widget.appendChild(previewPanel);

			function updatePreview(choice) {
				previewLabel.textContent = getThemeLabel(choice);
				previewHint.textContent = getThemeDescription(choice);
			}

			function setStatus(message) {
				statusLine.textContent = message;
			}

			function persistTheme(choice) {
				var targetTheme = sanitizeTheme(choice);
				if (targetTheme === lastPersisted) {
					Theme.applyTheme(targetTheme);
					setStatus(_('Theme already active.'));
					return Promise.resolve();
				}

				select.disabled = true;
				setStatus(_('Saving theme preference...'));
				return Theme.setTheme(targetTheme).then(function() {
					lastPersisted = targetTheme;
					setStatus(_('Theme updated and saved via RPC.'));
				}).catch(function(err) {
					console.error('Failed to save SecuBox theme via RPC', err);
					ui.addNotification(null, E('p', _('Unable to update theme preference. Please try again.')), 'error');
					select.value = lastPersisted;
					updatePreview(lastPersisted);
					Theme.applyTheme(lastPersisted);
					setStatus(_('Reverted to previous theme.'));
				}).finally(function() {
					select.disabled = false;
				});
			}

			select.addEventListener('change', function(ev) {
				var nextTheme = sanitizeTheme(ev.target.value);
				updatePreview(nextTheme);
				persistTheme(nextTheme);
			});

			// Ensure preview reflects initial value from backend
			updatePreview(initialSelection);
			return widget;
		};

		o = s.option(form.ListValue, 'refresh_interval', '🔄 Auto-Refresh Interval',
			'How often to refresh dashboard data automatically');
		o.value('15', 'Every 15 seconds - High frequency');
		o.value('30', 'Every 30 seconds - Default');
		o.value('60', 'Every minute - Low frequency');
		o.value('0', 'Disabled - Manual refresh only');
		o.default = '30';

		o = s.option(form.Flag, 'show_system_stats', '📈 Show System Statistics',
			'Display CPU, memory, disk usage on dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'show_module_grid', '🎯 Show Module Grid',
			'Display installed modules grid on dashboard');
		o.default = '1';

		// Module Management Section
		s = m.section(form.TypedSection, 'core', '📦 Module Management');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'auto_discovery', '🔍 Auto Discovery',
			'Automatically detect and register newly installed modules');
		o.default = '1';

		o = s.option(form.Flag, 'auto_start', '▶️ Auto Start Modules',
			'Automatically start module services when they are installed');
		o.default = '0';

		o = s.option(form.MultiValue, 'startup_modules', '🚀 Startup Modules',
			'Modules to start automatically on system boot');
		o.value('crowdsec', 'CrowdSec Dashboard');
		o.value('netdata', 'Netdata Dashboard');
		o.value('netifyd', 'Netifyd Dashboard');
		o.value('wireguard', 'WireGuard Dashboard');
		o.value('network_modes', 'Network Modes');
		o.value('client_guardian', 'Client Guardian');
		o.value('system_hub', 'System Hub');
		o.value('bandwidth_manager', 'Bandwidth Manager');
		o.value('auth_guardian', 'Auth Guardian');
		o.value('media_flow', 'Media Flow');
		o.value('vhost_manager', 'Virtual Host Manager');
		o.value('traffic_shaper', 'Traffic Shaper');
		o.value('cdn_cache', 'CDN Cache');
		o.value('ksm_manager', 'KSM Manager');
		o.optional = true;

		// Notification Settings Section
		s = m.section(form.TypedSection, 'core', '🔔 Notification Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'notifications', '🔔 Enable Notifications',
			'Show browser notifications for important events');
		o.default = '1';

		o = s.option(form.Flag, 'notify_module_start', '▶️ Module Start',
			'Notify when a module service starts');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_module_stop', '⏹️ Module Stop',
			'Notify when a module service stops');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_alerts', '⚠️ System Alerts',
			'Notify when system alerts are generated');
		o.default = '1';
		o.depends('notifications', '1');

		o = s.option(form.Flag, 'notify_health_issues', '🏥 Health Issues',
			'Notify when system health metrics exceed thresholds');
		o.default = '1';
		o.depends('notifications', '1');

		// Alert Thresholds Section
		s = m.section(form.TypedSection, 'diagnostics', '⚠️ Alert Thresholds');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'cpu_warning', '⚡ CPU Warning Level (%)',
			'Generate warning when CPU usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'cpu_critical', '🔥 CPU Critical Level (%)',
			'Generate critical alert when CPU usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'memory_warning', '💾 Memory Warning Level (%)',
			'Generate warning when memory usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'memory_critical', '🔴 Memory Critical Level (%)',
			'Generate critical alert when memory usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		o = s.option(form.Value, 'disk_warning', '💿 Disk Warning Level (%)',
			'Generate warning when disk usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '70';
		o.placeholder = '70';

		o = s.option(form.Value, 'disk_critical', '⛔ Disk Critical Level (%)',
			'Generate critical alert when disk usage exceeds this threshold');
		o.datatype = 'range(1,100)';
		o.default = '85';
		o.placeholder = '85';

		// Security Settings Section
		s = m.section(form.TypedSection, 'security', '🔒 Security Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'require_auth', '🔐 Require Authentication',
			'Require authentication to access SecuBox dashboard');
		o.default = '1';

		o = s.option(form.Flag, 'audit_logging', '📝 Audit Logging',
			'Log all configuration changes and module actions');
		o.default = '1';

		o = s.option(form.Value, 'audit_retention', '📅 Audit Log Retention (days)',
			'Number of days to keep audit logs');
		o.datatype = 'uinteger';
		o.default = '30';
		o.depends('audit_logging', '1');

		// Advanced Settings Section
		s = m.section(form.TypedSection, 'core', '🛠️ Advanced Settings');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'debug_mode', '🐛 Debug Mode',
			'Enable debug logging (may impact performance)');
		o.default = '0';

		o = s.option(form.Value, 'api_timeout', '⏱️ API Timeout (seconds)',
			'Timeout for API requests to module backends');
		o.datatype = 'range(5,300)';
		o.default = '30';
		o.placeholder = '30';

		o = s.option(form.Value, 'max_modules', '📊 Maximum Modules',
			'Maximum number of modules that can be installed');
		o.datatype = 'range(1,50)';
		o.default = '20';
		o.placeholder = '20';

		// Render form and append to container
		return m.render().then(L.bind(function(formElement) {
			var formWrapper = E('div', { 'class': 'secubox-settings-form' }, formElement);
			container.appendChild(formWrapper);
			this.bindStatusChip(formElement, statusChip);

			// Add cyber-checkbox class to all checkboxes for proper styling
			var checkboxes = formWrapper.querySelectorAll('input[type="checkbox"]');
			checkboxes.forEach(function(checkbox) {
				var wrapper = checkbox.parentNode;
				if (wrapper && wrapper.classList) {
					wrapper.classList.add('cyber-checkbox');
				}
			});

			var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
			wrapper.appendChild(SbHeader.render());
			wrapper.appendChild(container);
			return KissTheme.wrap(wrapper, 'admin/secubox/settings');
		}, this));
	},

	renderHeaderChip: function(icon, label, value, tone) {
		var display = (value == null ? '—' : value).toString();
		return E('div', { 'class': 'sh-header-chip' + (tone ? ' ' + tone : '') }, [
			E('span', { 'class': 'sh-chip-icon' }, icon),
			E('div', { 'class': 'sh-chip-text' }, [
				E('span', { 'class': 'sh-chip-label' }, label),
				E('strong', {}, display)
			])
		]);
	},

	renderPreferenceShowcase: function(prefs) {
		var cards = [
			this.renderPreferenceCard('🎨', _('Theme Preference'),
				getThemeLabel(prefs.theme),
				getThemeDescription(prefs.theme)),
			this.renderPreferenceCard('🔄', _('Auto Refresh'),
				formatRefreshLabel(prefs.refresh),
				_('Controls dashboard polling cadence.')),
			this.renderPreferenceCard('🔔', _('Notifications'),
				prefs.notifications ? _('Enabled') : _('Disabled'),
				prefs.notifications ? _('Browser alerts will be shown for module events.') :
					_('Silences browser alerts but logging continues.'),
				prefs.notifications ? 'success' : 'danger'),
			this.renderPreferenceCard('🤖', _('Automation'),
				prefs.autoStart ? _('Auto-start On') : _('Manual start'),
				describeAutomation(prefs.autoDiscovery, prefs.autoStart),
				prefs.autoStart ? 'info' : '')
		];

		return E('div', { 'class': 'secubox-pref-wrapper' }, [
			E('div', { 'class': 'secubox-pref-header' }, [
				E('div', { 'class': 'secubox-pref-title-block' }, [
					E('p', { 'class': 'secubox-pref-kicker' }, _('Configuration Snapshot')),
					E('h3', { 'class': 'secubox-pref-title' }, _('Current Preferences')),
					E('p', { 'class': 'secubox-pref-subtitle' },
						_('Key SecuBox preferences at a glance.'))
				])
			]),
			E('div', { 'class': 'secubox-pref-grid' },
				cards.filter(function(card) { return !!card; }))
		]);
	},

	renderPreferenceCard: function(icon, label, value, detail, tone) {
		return E('div', { 'class': 'secubox-pref-card sh-card' + (tone ? ' ' + tone : '') }, [
			E('div', { 'class': 'secubox-pref-icon' }, icon),
			E('div', { 'class': 'secubox-pref-body' }, [
				E('p', { 'class': 'secubox-pref-label' }, label),
				E('p', { 'class': 'secubox-pref-value' }, value),
				detail ? E('p', { 'class': 'secubox-pref-detail' }, detail) : null
			])
		]);
	},

	updateHeaderChip: function(chip, value, tone) {
		if (!chip)
			return;

		var valueEl = chip.querySelector('strong');
		if (valueEl)
			valueEl.textContent = value;

		chip.classList.remove('success', 'danger', 'warning', 'info', 'neutral');
		if (tone)
			chip.classList.add(tone);
	},

	bindStatusChip: function(formElement, chip) {
		if (!formElement || !chip)
			return;
		var toggle = formElement.querySelector('input[name="cbid.secubox.secubox.enabled"]');
		if (!toggle)
			return;

		var self = this;
		var sync = function() {
			var isOn = toggle.checked;
			self.updateHeaderChip(chip, isOn ? _('On') : _('Off'), isOn ? 'success' : 'danger');
		};

		toggle.addEventListener('change', sync);
		sync();
	}
});
