'use strict';
'require baseclass';

/**
 * SecuBox CyberMood Theme Controller
 * Provides Theme.init(), Theme.apply(), Theme.setLanguage(), Theme.t(), and UI helpers.
 */

return baseclass.extend({
	currentTheme: 'dark',
	currentLanguage: 'en',
	translations: {},

	init: function(options) {
		var opts = options || {};
		var theme = opts.theme || this.currentTheme;
		var lang = opts.language || this.currentLanguage;

		this.apply(theme);
		return this.setLanguage(lang);
	},

	apply: function(theme) {
		this.currentTheme = theme || 'dark';
		document.body.setAttribute('data-secubox-theme', this.currentTheme);
	},

	setLanguage: function(lang) {
		var self = this;
		this.currentLanguage = lang || 'en';

		if (self.translations[self.currentLanguage]) {
			return Promise.resolve(self.translations[self.currentLanguage]);
		}

		var url = L.resource('secubox-theme/i18n/' + this.currentLanguage + '.json');
		return fetch(url).then(function(res) {
			if (!res.ok)
				throw new Error('Unable to load translations for ' + self.currentLanguage);
			return res.json();
		}).then(function(dict) {
			self.translations[self.currentLanguage] = dict;
			return dict;
		}).catch(function(err) {
			console.error('Translation error:', err);
			self.translations[self.currentLanguage] = self.translations.en || {};
			return self.translations[self.currentLanguage];
		});
	},

	t: function(key, params) {
		params = params || {};
		var dict = this.translations[this.currentLanguage] ||
			this.translations.en || {};
		var str = dict[key] || key;
		Object.keys(params).forEach(function(k) {
			str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
		});
		return str;
	},

	createCard: function(options) {
		var opts = options || {};
		return E('div', { 'class': 'cyber-card' }, [
			opts.hideHeader ? null : E('div', { 'class': 'cyber-card-header' }, [
				E('div', { 'class': 'cyber-card-title' }, [
					opts.icon ? E('span', { 'style': 'margin-right: 0.35rem;' }, opts.icon) : null,
					opts.title || ''
				]),
				opts.badge || null
			]),
			E('div', { 'class': 'cyber-card-body' }, opts.content || [])
		]);
	},

	createButton: function(options) {
		var opts = options || {};
		var classes = ['cyber-btn'];
		if (opts.variant === 'secondary') classes.push('cyber-btn--secondary');
		if (opts.variant === 'danger') classes.push('cyber-btn--danger');
		if (opts.variant === 'ghost') classes.push('cyber-btn--ghost');

		return E('button', Object.assign({
			'class': classes.join(' ')
		}, opts.attrs || {}), [
			opts.icon ? E('span', {}, opts.icon) : null,
			opts.label || ''
		]);
	},

	createBadge: function(text, variant) {
		var classes = ['cyber-badge'];
		if (variant) classes.push('cyber-badge--' + variant);
		return E('span', { 'class': classes.join(' ') }, text);
	},

	createPage: function(options) {
		var opts = options || {};
		return E('div', { 'class': 'cyber-container' }, [
			opts.header || null,
			E('div', { 'class': 'cyber-stack' }, opts.cards || [])
		]);
	}
});
