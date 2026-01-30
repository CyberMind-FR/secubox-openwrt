'use strict';
'require baseclass';
'require uci';

/**
 * CrowdSec Dashboard Theme Manager (Singleton)
 * Handles loading and switching between UI themes
 *
 * Available themes:
 * - classic: Professional SOC-style dark theme (default)
 * - cards: Modern card-based UI with gradients
 * - cyberpunk: Neon glow effects with orange/cyan accents
 *
 * Profiles can extend themes with custom configurations
 *
 * Usage: theme.init().then(function() { ... });
 */

return baseclass.singleton({
	// Available themes
	themes: {
		'classic': {
			name: 'Classic SOC',
			description: 'Professional Security Operations Center style',
			css: 'themes/classic.css'
		},
		'cards': {
			name: 'Modern Cards',
			description: 'Card-based UI with gradients and shadows',
			css: 'themes/cards.css'
		},
		'cyberpunk': {
			name: 'Cyberpunk',
			description: 'Neon glow effects with terminal aesthetics',
			css: 'themes/cyberpunk.css'
		}
	},

	// Theme profiles - extend base themes with custom settings
	profiles: {
		'default': {
			theme: 'classic',
			options: {}
		},
		'soc': {
			theme: 'classic',
			options: {
				fullwidth: true,
				compactStats: false
			}
		},
		'modern': {
			theme: 'cards',
			options: {
				fullwidth: false,
				animatedCards: true
			}
		},
		'hacker': {
			theme: 'cyberpunk',
			options: {
				fullwidth: true,
				scanlines: true
			}
		}
	},

	currentTheme: null,
	currentProfile: null,

	/**
	 * Initialize theme manager and load saved preferences
	 */
	init: function() {
		var self = this;
		return uci.load('crowdsec-dashboard').then(function() {
			var theme = uci.get('crowdsec-dashboard', 'main', 'theme') || 'classic';
			var profile = uci.get('crowdsec-dashboard', 'main', 'profile') || 'default';
			return self.loadTheme(theme, profile);
		}).catch(function() {
			// Default to classic if config fails
			return self.loadTheme('classic', 'default');
		});
	},

	/**
	 * Load a theme and apply it to the dashboard
	 * @param {string} themeName - Theme identifier
	 * @param {string} profileName - Optional profile to apply
	 */
	loadTheme: function(themeName, profileName) {
		var theme = this.themes[themeName] || this.themes['classic'];
		var profile = this.profiles[profileName] || this.profiles['default'];

		// If profile specifies a different theme, use that
		if (profile.theme && this.themes[profile.theme]) {
			themeName = profile.theme;
			theme = this.themes[themeName];
		}

		this.currentTheme = themeName;
		this.currentProfile = profileName;

		// Load base CSS first
		this.loadCSS('themes/base.css');

		// Load theme-specific CSS
		this.loadCSS(theme.css);

		// Apply theme class to body
		document.body.classList.remove('theme-classic', 'theme-cards', 'theme-cyberpunk');
		document.body.classList.add('theme-' + themeName);

		// Apply profile options
		if (profile.options) {
			if (profile.options.fullwidth) {
				document.body.classList.add('cs-fullwidth');
			}
		}

		return Promise.resolve();
	},

	/**
	 * Load a CSS file
	 * @param {string} path - Path relative to crowdsec-dashboard resources
	 */
	loadCSS: function(path) {
		var fullPath = L.resource('crowdsec-dashboard/' + path);

		// Check if already loaded
		var existing = document.querySelector('link[href="' + fullPath + '"]');
		if (existing) return;

		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = fullPath;
		document.head.appendChild(link);
	},

	/**
	 * Switch to a different theme
	 * @param {string} themeName - Theme to switch to
	 */
	switchTheme: function(themeName) {
		if (!this.themes[themeName]) {
			console.warn('Unknown theme: ' + themeName);
			return;
		}

		// Remove old theme CSS
		document.querySelectorAll('link[href*="themes/"]').forEach(function(el) {
			if (!el.href.includes('base.css')) {
				el.remove();
			}
		});

		return this.loadTheme(themeName, this.currentProfile);
	},

	/**
	 * Switch to a different profile
	 * @param {string} profileName - Profile to switch to
	 */
	switchProfile: function(profileName) {
		if (!this.profiles[profileName]) {
			console.warn('Unknown profile: ' + profileName);
			return;
		}

		var profile = this.profiles[profileName];
		return this.loadTheme(profile.theme, profileName);
	},

	/**
	 * Save current theme/profile to UCI config
	 */
	save: function() {
		uci.set('crowdsec-dashboard', 'main', 'theme', this.currentTheme);
		uci.set('crowdsec-dashboard', 'main', 'profile', this.currentProfile);
		return uci.save();
	},

	/**
	 * Get list of available themes
	 */
	getThemes: function() {
		return Object.keys(this.themes).map(function(id) {
			return {
				id: id,
				name: this.themes[id].name,
				description: this.themes[id].description
			};
		}, this);
	},

	/**
	 * Get list of available profiles
	 */
	getProfiles: function() {
		return Object.keys(this.profiles).map(function(id) {
			var p = this.profiles[id];
			return {
				id: id,
				theme: p.theme,
				options: p.options
			};
		}, this);
	},

	/**
	 * Register a custom theme
	 * @param {string} id - Theme identifier
	 * @param {object} config - Theme configuration
	 */
	registerTheme: function(id, config) {
		if (this.themes[id]) {
			console.warn('Theme already exists: ' + id);
			return false;
		}
		this.themes[id] = config;
		return true;
	},

	/**
	 * Register a custom profile
	 * @param {string} id - Profile identifier
	 * @param {object} config - Profile configuration
	 */
	registerProfile: function(id, config) {
		if (this.profiles[id]) {
			console.warn('Profile already exists: ' + id);
			return false;
		}
		this.profiles[id] = config;
		return true;
	},

	/**
	 * Get the CSS class for the dashboard container
	 */
	getDashboardClass: function() {
		return 'cs-dashboard theme-' + (this.currentTheme || 'classic');
	}
});
