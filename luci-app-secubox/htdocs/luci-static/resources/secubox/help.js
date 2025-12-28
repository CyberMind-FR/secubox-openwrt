'use strict';
'require baseclass';
'require ui';

/**
 * SecuBox Help System
 * Provides centralized help/documentation access for all SecuBox modules
 * Version: 1.0.0
 */

console.log('📖 SecuBox Help System v1.0.0 loaded');

return baseclass.extend({
	/**
	 * Create a help button element
	 * @param {string} moduleName - Module identifier (e.g., 'network-modes')
	 * @param {string} position - Button position: 'header', 'footer', 'floating', 'badge'
	 * @param {object} options - Custom options
	 * @returns {Element} Help button element
	 */
	createHelpButton: function(moduleName, position, options) {
		var opts = options || {};
		var helpUrl = this.getHelpUrl(moduleName);
		var buttonClass = 'sb-help-btn sb-help-' + position;
		var target = opts.target || '_blank';

		// Handle modal vs new tab
		if (opts.modal) {
			var self = this;
			return E('button', {
				'class': buttonClass,
				'title': opts.title || _('View Help & Documentation'),
				'style': opts.style || '',
				'click': function(ev) {
					ev.preventDefault();
					self.openHelpModal(moduleName);
				}
			}, [
				E('span', { 'class': 'sb-help-icon' }, opts.icon || '❓'),
				opts.showLabel !== false ? E('span', { 'class': 'sb-help-label' }, opts.label || _('Help')) : null
			]);
		}

		// Regular link button
		return E('a', {
			'class': buttonClass,
			'href': helpUrl,
			'target': target,
			'title': opts.title || _('View Help & Documentation'),
			'style': opts.style || ''
		}, [
			E('span', { 'class': 'sb-help-icon' }, opts.icon || '❓'),
			opts.showLabel !== false ? E('span', { 'class': 'sb-help-label' }, opts.label || _('Help')) : null
		]);
	},

	/**
	 * Get help URL for a module
	 * @param {string} moduleName - Module identifier
	 * @param {string} anchor - Optional anchor/section (e.g., '#features')
	 * @returns {string} Help page URL
	 */
	getHelpUrl: function(moduleName, anchor) {
		var baseUrl = '/luci-static/secubox/';
		var moduleMap = {
			'secubox': 'index.html#modules',
			'system-hub': 'demo-secubox-hub.html',
			'network-modes': 'demo-network-modes.html',
			'client-guardian': 'demo-client-guardian.html',
			'bandwidth-manager': 'demo-bandwidth.html',
			'cdn-cache': 'demo-cdn-cache.html',
			'traffic-shaper': 'demo-traffic-shaper.html',
			'wireguard-dashboard': 'demo-wireguard.html',
			'crowdsec-dashboard': 'demo-crowdsec.html',
			'netdata-dashboard': 'demo-netdata.html',
			'netifyd-dashboard': 'demo-netifyd.html',
			'auth-guardian': 'demo-auth.html',
			'vhost-manager': 'demo-vhost.html',
			'ksm-manager': 'demo-ksm-manager.html',
			'media-flow': 'demo-media.html'
		};

		var url = baseUrl + (moduleMap[moduleName] || 'index.html');
		return anchor ? url + anchor : url;
	},

	/**
	 * Open help in modal dialog with iframe
	 * @param {string} moduleName - Module identifier
	 * @param {object} options - Modal options
	 */
	openHelpModal: function(moduleName, options) {
		var opts = options || {};
		var helpUrl = this.getHelpUrl(moduleName);
		var modalTitle = opts.title || _('Help & Documentation');

		var iframe = E('iframe', {
			'src': helpUrl,
			'style': 'width: 100%; height: 70vh; border: none; border-radius: 8px; background: white;',
			'frameborder': '0'
		});

		var modal = E('div', { 'style': 'min-height: 70vh;' }, [
			iframe,
			E('div', {
				'class': 'right',
				'style': 'margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;'
			}, [
				opts.showOpenButton !== false ? E('a', {
					'class': 'btn cbi-button-neutral',
					'href': helpUrl,
					'target': '_blank'
				}, [
					'🔗 ',
					_('Open in New Tab')
				]) : null,
				E('button', {
					'class': 'btn cbi-button-action',
					'click': ui.hideModal
				}, _('Close'))
			])
		]);

		ui.showModal(modalTitle, [modal]);
	},

	/**
	 * Create a quick help tooltip
	 * @param {string} text - Tooltip text
	 * @param {string} moduleName - Optional module for "Learn More" link
	 * @returns {Element} Tooltip element
	 */
	createTooltip: function(text, moduleName) {
		var tooltip = E('span', {
			'class': 'sb-help-tooltip',
			'title': text
		}, '❓');

		if (moduleName) {
			var self = this;
			tooltip.addEventListener('click', function(ev) {
				ev.preventDefault();
				window.open(self.getHelpUrl(moduleName), '_blank');
			});
		}

		return tooltip;
	},

	/**
	 * Check if help page exists (basic check)
	 * @param {string} moduleName - Module identifier
	 * @returns {boolean} True if help page is configured
	 */
	hasHelpPage: function(moduleName) {
		var url = this.getHelpUrl(moduleName);
		return url.indexOf('demo-') !== -1 || moduleName === 'secubox';
	},

	/**
	 * Get all available help pages
	 * @returns {object} Map of module names to help URLs
	 */
	getAllHelpPages: function() {
		return {
			'secubox': this.getHelpUrl('secubox'),
			'system-hub': this.getHelpUrl('system-hub'),
			'network-modes': this.getHelpUrl('network-modes'),
			'client-guardian': this.getHelpUrl('client-guardian'),
			'bandwidth-manager': this.getHelpUrl('bandwidth-manager'),
			'cdn-cache': this.getHelpUrl('cdn-cache'),
			'traffic-shaper': this.getHelpUrl('traffic-shaper'),
			'wireguard-dashboard': this.getHelpUrl('wireguard-dashboard'),
			'crowdsec-dashboard': this.getHelpUrl('crowdsec-dashboard'),
			'netdata-dashboard': this.getHelpUrl('netdata-dashboard'),
			'netifyd-dashboard': this.getHelpUrl('netifyd-dashboard'),
			'auth-guardian': this.getHelpUrl('auth-guardian'),
			'vhost-manager': this.getHelpUrl('vhost-manager'),
			'ksm-manager': this.getHelpUrl('ksm-manager'),
			'media-flow': this.getHelpUrl('media-flow')
		};
	}
});
