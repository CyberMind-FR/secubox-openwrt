'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require dom';
'require poll';
'require ui';
'require crowdsec-dashboard/api as api';

/**
 * CrowdSec Dashboard - WAF/AppSec View
 * Web Application Firewall status and configuration
 * Copyright (C) 2024 CyberMind.fr - Gandalf
 */

return view.extend({
	title: _('WAF/AppSec'),

	csApi: null,
	wafStatus: {},

	load: function() {
		var cssLink = document.createElement('link');
		cssLink.rel = 'stylesheet';
		cssLink.href = L.resource('crowdsec-dashboard/dashboard.css');
		document.head.appendChild(cssLink);

		this.csApi = api;

		return this.csApi.getWAFStatus().then(function(result) {
			return {
				wafStatus: result || {}
			};
		});
	},

	renderWAFStatus: function() {
		var self = this;
		var enabled = this.wafStatus.waf_enabled === true || this.wafStatus.waf_enabled === 1;
		var message = this.wafStatus.message || '';

		if (!enabled) {
			return E('div', { 'class': 'cs-card' }, [
				E('div', { 'class': 'cs-card-header' }, [
					E('div', { 'class': 'cs-card-icon' }, '🛡️'),
					E('h3', {}, _('WAF Status'))
				]),
				E('div', { 'class': 'cs-card-body' }, [
					E('div', { 'class': 'cs-empty' }, [
						E('div', { 'class': 'cs-empty-icon' }, '⚠️'),
						E('p', { 'style': 'margin: 16px 0; color: var(--cs-text-secondary);' }, message || _('WAF/AppSec not configured')),
						E('p', { 'style': 'font-size: 13px; color: var(--cs-text-muted);' },
							_('The Web Application Firewall (WAF) feature requires CrowdSec 1.7.0 or higher. Configure AppSec rules to enable request filtering and blocking.'))
					])
				])
			]);
		}

		return E('div', { 'class': 'cs-card' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-icon' }, '🛡️'),
				E('h3', {}, _('WAF Status')),
				E('span', {
					'class': 'cs-action ban',
					'style': 'margin-left: auto; background: rgba(0,212,170,0.15); color: var(--cs-accent-green); padding: 6px 12px; border-radius: 6px; font-weight: 600;'
				}, _('Enabled'))
			]),
			E('div', { 'class': 'cs-card-body' }, [
				this.renderWAFInfo()
			])
		]);
	},

	renderWAFInfo: function() {
		var info = [];

		if (this.wafStatus.rules_count !== undefined) {
			info.push(
				E('div', { 'class': 'cs-metric-item' }, [
					E('span', { 'class': 'cs-metric-name' }, _('Active Rules')),
					E('span', { 'class': 'cs-metric-value' }, String(this.wafStatus.rules_count))
				])
			);
		}

		if (this.wafStatus.blocked_requests !== undefined) {
			info.push(
				E('div', { 'class': 'cs-metric-item' }, [
					E('span', { 'class': 'cs-metric-name' }, _('Blocked Requests')),
					E('span', { 'class': 'cs-metric-value' }, String(this.wafStatus.blocked_requests))
				])
			);
		}

		if (this.wafStatus.engine_version) {
			info.push(
				E('div', { 'class': 'cs-metric-item' }, [
					E('span', { 'class': 'cs-metric-name' }, _('Engine Version')),
					E('span', { 'class': 'cs-metric-value' }, String(this.wafStatus.engine_version))
				])
			);
		}

		if (info.length === 0) {
			return E('p', { 'style': 'color: var(--cs-text-secondary); margin: 8px 0;' },
				_('WAF is enabled but no detailed metrics available.'));
		}

		return E('div', { 'class': 'cs-metric-list' }, info);
	},

	renderConfigHelp: function() {
		return E('div', { 'class': 'cs-card' }, [
			E('div', { 'class': 'cs-card-header' }, [
				E('div', { 'class': 'cs-card-icon' }, '📖'),
				E('h3', {}, _('Configuration Guide'))
			]),
			E('div', { 'class': 'cs-card-body' }, [
				E('div', { 'class': 'cs-info-box' }, [
					E('h4', { 'style': 'margin: 0 0 8px 0; color: var(--cs-text-primary);' }, _('Enabling WAF/AppSec')),
					E('p', { 'style': 'margin: 0 0 12px 0; color: var(--cs-text-secondary); font-size: 14px;' },
						_('To enable the Web Application Firewall, you need to:')),
					E('ol', { 'style': 'margin: 0; padding-left: 20px; color: var(--cs-text-secondary); font-size: 14px;' }, [
						E('li', {}, _('Install AppSec collections: ') + E('code', {}, 'cscli collections install crowdsecurity/appsec-*')),
						E('li', {}, _('Configure AppSec in your acquis.yaml')),
						E('li', {}, _('Restart CrowdSec service: ') + E('code', {}, '/etc/init.d/crowdsec restart')),
						E('li', {}, _('Verify status: ') + E('code', {}, 'cscli appsec status'))
					])
				]),
				E('div', { 'class': 'cs-info-box', 'style': 'margin-top: 16px;' }, [
					E('h4', { 'style': 'margin: 0 0 8px 0; color: var(--cs-text-primary);' }, _('Documentation')),
					E('p', { 'style': 'margin: 0; color: var(--cs-text-secondary); font-size: 14px;' }, [
						_('For detailed configuration, see: '),
						E('a', {
							'href': 'https://docs.crowdsec.net/docs/appsec/intro',
							'target': '_blank',
							'style': 'color: var(--cs-accent-cyan);'
						}, 'CrowdSec AppSec Documentation')
					])
				])
			])
		]);
	},

	render: function(data) {
		this.wafStatus = data.wafStatus || {};

		var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
			(document.documentElement && document.documentElement.getAttribute('lang')) ||
			(navigator.language ? navigator.language.split('-')[0] : 'en');
		Theme.init({ language: lang });

		return E('div', { 'class': 'cs-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', { 'class': 'cs-page-title' }, _('CrowdSec WAF/AppSec')),
			E('div', { 'class': 'cs-grid' }, [
				this.renderWAFStatus(),
				this.renderConfigHelp()
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
