'use strict';
'require view';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callGetWafRules = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'get_waf_rules',
	expect: {}
});

var callToggleWafCategory = rpc.declare({
	object: 'luci.mitmproxy',
	method: 'toggle_waf_category',
	params: ['category', 'enabled']
});

function severityColor(sev) {
	return {
		critical: '#e74c3c',
		high: '#e67e22',
		medium: '#f39c12',
		low: '#3498db'
	}[sev] || '#666';
}

function severityBadge(sev) {
	return E('span', {
		'style': 'background: ' + severityColor(sev) + '; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;'
	}, sev);
}

return view.extend({
	load: function() {
		return callGetWafRules().catch(function() { return {}; });
	},

	render: function(data) {
		var self = this;
		var rulesData = data || {};
		// Handle both top-level categories and wrapped in "categories" object
		var rules = rulesData.categories || rulesData;
		var categories = Object.keys(rules).filter(function(k) {
			return k !== '_meta' && typeof rules[k] === 'object' && rules[k].patterns;
		});

		// Count totals
		var totalRules = 0;
		var enabledCategories = 0;
		categories.forEach(function(cat) {
			totalRules += (rules[cat].patterns || []).length;
			if (rules[cat].enabled !== false) enabledCategories++;
		});

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0 0 8px 0;' }, '🛡️ WAF Filters'),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' }, 'Web Application Firewall detection rules')
			]),

			// Summary Stats
			E('div', { 'class': 'kiss-grid kiss-grid-auto', 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: #3498db;' }, String(categories.length)),
					E('div', { 'class': 'kiss-stat-label' }, 'Categories')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: #27ae60;' }, String(enabledCategories)),
					E('div', { 'class': 'kiss-stat-label' }, 'Active')
				]),
				E('div', { 'class': 'kiss-stat' }, [
					E('div', { 'class': 'kiss-stat-value', 'style': 'color: #e67e22;' }, String(totalRules)),
					E('div', { 'class': 'kiss-stat-label' }, 'Rules')
				])
			]),

			// Categories
			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Filter Categories')),
				E('div', { 'class': 'cbi-section-node' },
					categories.length > 0 ? categories.map(function(catName) {
						var cat = rules[catName];
						var catRules = cat.patterns || [];
						var isEnabled = cat.enabled !== false;
						var severity = cat.severity || 'medium';

						return E('div', {
							'class': 'kiss-card',
							'style': 'margin-bottom: 16px; border-left: 4px solid ' + severityColor(severity) + ';'
						}, [
							// Category Header
							E('div', {
								'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;'
							}, [
								E('div', {}, [
									E('strong', { 'style': 'font-size: 16px; text-transform: uppercase;' }, catName.replace(/_/g, ' ')),
									' ',
									severityBadge(severity),
									E('span', {
										'style': 'margin-left: 8px; font-size: 12px; color: var(--kiss-muted);'
									}, '(' + catRules.length + ' rules)')
								]),
								E('label', { 'style': 'display: flex; align-items: center; cursor: pointer;' }, [
									E('input', {
										'type': 'checkbox',
										'checked': isEnabled,
										'style': 'width: 18px; height: 18px; margin-right: 8px;',
										'data-category': catName,
										'change': function(ev) {
											var category = ev.target.dataset.category;
											var enabled = ev.target.checked;
											ui.showModal(_('Updating...'), [E('p', { 'class': 'spinning' }, _('Updating category...'))]);
											callToggleWafCategory(category, enabled).then(function(res) {
												ui.hideModal();
												if (res && res.success) {
													ui.addNotification(null, E('p', {},
														category + ' ' + (enabled ? _('enabled') : _('disabled'))), 'success');
												} else {
													ui.addNotification(null, E('p', {},
														_('Failed: ') + (res.error || 'Unknown error')), 'error');
													ev.target.checked = !enabled; // Revert
												}
											}).catch(function(err) {
												ui.hideModal();
												ui.addNotification(null, E('p', {}, _('Error: ') + err), 'error');
												ev.target.checked = !enabled;
											});
										}
									}),
									E('span', { 'style': 'font-size: 13px; color: ' + (isEnabled ? '#27ae60' : '#95a5a6') + ';' },
										isEnabled ? _('Enabled') : _('Disabled'))
								])
							]),

							// Rules Table
							catRules.length > 0 ? E('details', { 'style': 'margin-top: 8px;' }, [
								E('summary', {
									'style': 'cursor: pointer; color: var(--kiss-muted); font-size: 13px; padding: 8px 0;'
								}, _('Show rules')),
								E('table', { 'class': 'table', 'style': 'font-size: 12px; margin-top: 8px;' }, [
									E('tr', { 'class': 'tr cbi-section-table-titles' }, [
										E('th', { 'class': 'th', 'style': 'width: 60px;' }, _('ID')),
										E('th', { 'class': 'th' }, _('Pattern')),
										E('th', { 'class': 'th', 'style': 'width: 200px;' }, _('Description')),
										E('th', { 'class': 'th', 'style': 'width: 100px;' }, _('CVE'))
									])
								].concat(catRules.map(function(rule, idx) {
									// Decode placeholder strings back to original
									var pattern = (rule.pattern || '')
										.replace(/QUOTE/g, "'")
										.replace(/DQUOTE/g, '"')
										.replace(/x27/g, "'");
									var desc = rule.desc || rule.description || '-';
									var cve = rule.cve || '-';

									return E('tr', { 'class': 'tr' }, [
										E('td', { 'class': 'td', 'style': 'font-family: monospace; color: #666;' },
											rule.id || String(idx + 1)),
										E('td', {
											'class': 'td',
											'style': 'font-family: monospace; font-size: 11px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
											'title': pattern
										}, pattern),
										E('td', { 'class': 'td', 'style': 'color: var(--kiss-muted);' }, desc),
										E('td', { 'class': 'td' },
											cve !== '-' ? E('a', {
												'href': 'https://nvd.nist.gov/vuln/detail/' + cve,
												'target': '_blank',
												'style': 'color: #e74c3c; font-size: 11px;'
											}, cve) : E('span', { 'style': 'color: #999;' }, '-'))
									]);
								})))
							]) : E('p', { 'style': 'color: var(--kiss-muted); font-size: 12px; margin: 8px 0 0 0;' },
								_('No rules defined'))
						]);
					}) : E('div', { 'style': 'text-align: center; padding: 40px; color: var(--kiss-muted);' }, [
						E('div', { 'style': 'font-size: 48px; margin-bottom: 16px;' }, '🛡️'),
						E('p', {}, _('No WAF rules loaded')),
						E('p', { 'style': 'font-size: 12px;' }, _('WAF rules file not found at /srv/mitmproxy/waf-rules.json'))
					])
				)
			]),

			// Info Card
			E('div', { 'class': 'kiss-card' }, [
				E('div', { 'class': 'kiss-card-title' }, '📖 ' + _('Information')),
				E('div', {}, [
					E('p', { 'style': 'color: var(--kiss-muted); margin-bottom: 12px;' },
						_('WAF filters detect and block common web attacks. Each category targets a specific type of threat.')),
					E('ul', { 'style': 'color: var(--kiss-muted); margin: 0; padding-left: 20px;' }, [
						E('li', {}, E('strong', {}, 'SQLi'), ' - SQL injection attempts'),
						E('li', {}, E('strong', {}, 'XSS'), ' - Cross-site scripting attacks'),
						E('li', {}, E('strong', {}, 'LFI'), ' - Local file inclusion'),
						E('li', {}, E('strong', {}, 'RCE'), ' - Remote code execution'),
						E('li', {}, E('strong', {}, 'CVE'), ' - Known vulnerability exploits'),
						E('li', {}, E('strong', {}, 'Scanners'), ' - Automated vulnerability scanners')
					]),
					E('p', { 'style': 'margin-top: 12px; color: var(--kiss-muted);' }, [
						_('Rules file: '),
						E('code', { 'style': 'font-size: 11px; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;' },
							'/srv/mitmproxy/waf-rules.json')
					])
				])
			])
		];

		return KissTheme.wrap(content, 'admin/secubox/security/mitmproxy/waf-filters');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
