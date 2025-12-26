'use strict';
'require baseclass';
'require rpc';

/**
 * System Hub Theme Manager
 * Uses centralized theme from SecuBox configuration
 * Version: 1.0.0
 */

console.log('🎨 System Hub Theme Manager v1.0.0 loaded');

// RPC call to get theme from secu-box config
var callGetTheme = rpc.declare({
	object: 'luci.secubox',
	method: 'get_theme',
	expect: {}
});

return baseclass.extend({
	/**
	 * Initialize theme system
	 * Loads theme preference from SecuBox and applies it to the page
	 */
	init: function() {
		var self = this;

		return callGetTheme().then(function(data) {
			var themePref = data.theme || 'dark';
			self.applyTheme(themePref);

			// Listen for system theme changes if preference is 'system'
			if (themePref === 'system' && window.matchMedia) {
				var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
				darkModeQuery.addListener(function() {
					self.applyTheme('system');
				});
			}
		}).catch(function(err) {
			console.error('Failed to load theme preference from SecuBox, using dark theme:', err);
			self.applyTheme('dark');
		});
	},

	/**
	 * Apply theme to the page
	 * @param {string} theme - Theme preference: 'dark', 'light', or 'system'
	 */
	applyTheme: function(theme) {
		var effectiveTheme = theme;

		// If 'system', detect from OS
		if (theme === 'system' && window.matchMedia) {
			effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}

		// Apply theme to document root
		document.documentElement.setAttribute('data-theme', effectiveTheme);

		console.log('🎨 System Hub theme applied:', theme, '(effective:', effectiveTheme + ')');
	},

	/**
	 * Get current effective theme
	 * @returns {string} 'dark' or 'light'
	 */
	getCurrentTheme: function() {
		return document.documentElement.getAttribute('data-theme') || 'dark';
	}
});
