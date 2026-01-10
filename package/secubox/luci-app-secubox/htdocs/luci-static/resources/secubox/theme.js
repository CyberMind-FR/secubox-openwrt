'use strict';
'require baseclass';
'require secubox/api as API';

/**
 * SecuBox Theme Manager
 * Manages dark/light/system/cyberpunk theme switching across SecuBox modules
 * Version: 1.1.0
 */

var SUPPORTED_THEMES = ['dark', 'light', 'system', 'cyberpunk'];

console.log('🎨 SecuBox Theme Manager v1.1.0 loaded');

return baseclass.extend({
	/**
	 * Initialize theme system
	 * Loads theme preference and applies it to the page
	 */
	init: function() {
		var self = this;

		return API.getTheme().then(function(data) {
			var themePref = data.theme || 'dark';
			if (SUPPORTED_THEMES.indexOf(themePref) === -1) {
				themePref = 'dark';
			}
			self.applyTheme(themePref);

			// Listen for system theme changes if preference is 'system'
			if (themePref === 'system' && window.matchMedia) {
				var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
				darkModeQuery.addListener(function() {
					self.applyTheme('system');
				});
			}
		}).catch(function(err) {
			console.error('Failed to load theme preference, using dark theme:', err);
			self.applyTheme('dark');
		});
	},

	/**
	 * Apply theme to the page
	 * @param {string} theme - Theme preference: 'dark', 'light', 'system', or 'cyberpunk'
	 */
	applyTheme: function(theme) {
		var selectedTheme = SUPPORTED_THEMES.indexOf(theme) > -1 ? theme : 'dark';
		var effectiveTheme = selectedTheme;

		// If 'system', detect from OS
		if (selectedTheme === 'system' && window.matchMedia) {
			effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}

		// Apply theme to document root
		document.documentElement.setAttribute('data-theme', effectiveTheme);

		console.log('🎨 Theme applied:', selectedTheme, '(effective:', effectiveTheme + ')');
	},

	/**
	 * Get current effective theme
	 * @returns {string} 'dark' or 'light'
	 */
	getCurrentTheme: function() {
		return document.documentElement.getAttribute('data-theme') || 'dark';
	},

	/**
	 * Get theme preference from backend
	 * @returns {Promise<string>} Theme preference ('dark', 'light', 'system', or 'cyberpunk')
	 */
	getTheme: function() {
		return API.getTheme().then(function(data) {
			return data.theme || 'dark';
		}).catch(function(err) {
			console.error('Failed to load theme preference:', err);
			return 'dark';
		});
	},

	/**
	 * Apply and persist theme preference
	 * @param {string} theme
	 * @returns {Promise<object>}
	 */
	setTheme: function(theme) {
		this.applyTheme(theme);
		return API.setTheme(theme).catch(function(err) {
			console.error('Failed to persist theme preference:', err);
			throw err;
		});
	}
});
