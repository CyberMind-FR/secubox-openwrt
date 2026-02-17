'use strict';
'require view';
'require dom';
'require ui';
'require secubox-theme/theme as Theme';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

var lang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
	(document.documentElement && document.documentElement.getAttribute('lang')) ||
	(navigator.language ? navigator.language.split('-')[0] : 'en');
Theme.init({ language: lang });

// Extended Apps catalog - apps not in main nav sections
var appCategories = [
	{
		id: 'admin',
		name: 'Administration',
		icon: '\ud83d\udee0\ufe0f',
		description: 'SecuBox administration and app management',
		apps: [
			{ id: 'secubox-admin', name: 'SecuBox Admin', icon: '\ud83d\udcbb', path: 'admin/secubox/admin', desc: 'App catalog, updates, and system configuration' },
			{ id: 'cyber-dashboard', name: 'Cyber Dashboard', icon: '\ud83d\udcca', path: 'admin/secubox/admin/cyber-dashboard', desc: 'Advanced analytics and insights' },
			{ id: 'netdiag', name: 'Network Diagnostics', icon: '\ud83d\udd0c', path: 'admin/secubox/netdiag', desc: 'DSA switch port statistics and error monitoring' }
		]
	},
	{
		id: 'services',
		name: 'Services',
		icon: '\ud83d\udd27',
		description: 'Server and service management',
		apps: [
			{ id: 'streamlit', name: 'Streamlit', icon: '\ud83d\udcca', path: 'admin/secubox/services/streamlit', desc: 'Python data apps and dashboards' },
			{ id: 'metablogizer', name: 'MetaBlogizer', icon: '\ud83d\udcdd', path: 'admin/secubox/services/metablogizer', desc: 'AI-powered blog generation' },
			{ id: 'vhost-manager', name: 'Virtual Hosts', icon: '\ud83c\udf10', path: 'admin/secubox/services/vhosts', desc: 'Web server virtual hosts and SSL certificates' }
		]
	},
	{
		id: 'iot',
		name: 'IoT & Smart Home',
		icon: '\ud83c\udfe0',
		description: 'Internet of Things and home automation',
		apps: [
			{ id: 'zigbee2mqtt', name: 'Zigbee2MQTT', icon: '\ud83d\udca1', path: 'admin/secubox/services/zigbee2mqtt', desc: 'Zigbee device bridge for smart home' },
			{ id: 'magicmirror', name: 'MagicMirror\u00B2', icon: '\ud83e\ude9e', path: 'admin/secubox/services/magicmirror2', desc: 'Smart mirror display management' },
			{ id: 'mqtt-bridge', name: 'MQTT Bridge', icon: '\ud83d\udd17', path: 'admin/secubox/services/mqtt-bridge', desc: 'MQTT message broker and bridge' }
		]
	}
];

return view.extend({
	render: function() {
		// Main wrapper with SecuBox header
		var wrapper = E('div', { 'class': 'secubox-page-wrapper' });
		wrapper.appendChild(SbHeader.render());

		var container = E('div', { 'class': 'sb-apps-view' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('style', {}, this.getStyles()),
			this.renderHeader(),
			this.renderAppGrid()
		]);

		wrapper.appendChild(container);
		return KissTheme.wrap([wrapper], 'admin/secubox/portal/apps');
	},

	renderHeader: function() {
		return E('div', { 'class': 'sb-apps-header' }, [
			E('div', { 'class': 'sb-apps-title-row' }, [
				E('h1', { 'class': 'sb-apps-title' }, [
					E('span', { 'class': 'sb-apps-icon' }, '\ud83d\udce6'),
					_('Extended Apps')
				]),
				E('span', { 'class': 'sb-apps-badge' }, appCategories.reduce(function(sum, cat) {
					return sum + cat.apps.length;
				}, 0) + ' ' + _('apps'))
			]),
			E('p', { 'class': 'sb-apps-subtitle' },
				_('Additional SecuBox applications for administration, IoT, and advanced features'))
		]);
	},

	renderAppGrid: function() {
		var self = this;
		return E('div', { 'class': 'sb-apps-categories' },
			appCategories.map(function(category) {
				return self.renderCategory(category);
			})
		);
	},

	renderCategory: function(category) {
		var self = this;
		return E('div', { 'class': 'sb-apps-category' }, [
			E('div', { 'class': 'sb-apps-category-header' }, [
				E('span', { 'class': 'sb-apps-category-icon' }, category.icon),
				E('div', {}, [
					E('h2', { 'class': 'sb-apps-category-title' }, category.name),
					E('p', { 'class': 'sb-apps-category-desc' }, category.description)
				])
			]),
			E('div', { 'class': 'sb-apps-grid' },
				category.apps.map(function(app) {
					return self.renderAppCard(app);
				})
			)
		]);
	},

	renderAppCard: function(app) {
		return E('a', {
			'class': 'sb-app-card',
			'href': L.url(app.path)
		}, [
			E('div', { 'class': 'sb-app-card-icon' }, app.icon),
			E('div', { 'class': 'sb-app-card-content' }, [
				E('h3', { 'class': 'sb-app-card-name' }, app.name),
				E('p', { 'class': 'sb-app-card-desc' }, app.desc)
			]),
			E('div', { 'class': 'sb-app-card-arrow' }, '\u2192')
		]);
	},

	getStyles: function() {
		return `
.sb-apps-view {
	min-height: 100vh;
	background: #0a0a0f;
	color: #fafafa;
	padding: 20px;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.sb-apps-header {
	margin-bottom: 32px;
	padding: 24px;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
	border: 1px solid rgba(102, 126, 234, 0.2);
	border-radius: 16px;
}

.sb-apps-title-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px;
}

.sb-apps-title {
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.sb-apps-icon {
	font-size: 2rem;
	-webkit-text-fill-color: initial;
}

.sb-apps-badge {
	padding: 6px 14px;
	background: rgba(102, 126, 234, 0.2);
	border: 1px solid rgba(102, 126, 234, 0.3);
	border-radius: 20px;
	font-size: 0.8rem;
	font-weight: 600;
	color: #a5b4fc;
}

.sb-apps-subtitle {
	margin: 8px 0 0 0;
	color: #a0a0b0;
	font-size: 0.95rem;
}

.sb-apps-categories {
	display: flex;
	flex-direction: column;
	gap: 32px;
}

.sb-apps-category {
	background: #12121a;
	border: 1px solid #2a2a35;
	border-radius: 16px;
	padding: 24px;
}

.sb-apps-category-header {
	display: flex;
	align-items: flex-start;
	gap: 16px;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid #2a2a35;
}

.sb-apps-category-icon {
	font-size: 2rem;
	line-height: 1;
}

.sb-apps-category-title {
	margin: 0 0 4px 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #fafafa;
}

.sb-apps-category-desc {
	margin: 0;
	font-size: 0.85rem;
	color: #71717a;
}

.sb-apps-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
}

.sb-app-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 16px 20px;
	background: #1a1a24;
	border: 1px solid #2a2a35;
	border-radius: 12px;
	text-decoration: none;
	color: inherit;
	transition: all 0.2s ease;
}

.sb-app-card:hover {
	background: #1f1f2a;
	border-color: #667eea;
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.sb-app-card-icon {
	font-size: 2rem;
	line-height: 1;
	flex-shrink: 0;
}

.sb-app-card-content {
	flex: 1;
	min-width: 0;
}

.sb-app-card-name {
	margin: 0 0 4px 0;
	font-size: 1rem;
	font-weight: 600;
	color: #fafafa;
}

.sb-app-card-desc {
	margin: 0;
	font-size: 0.8rem;
	color: #71717a;
	line-height: 1.4;
}

.sb-app-card-arrow {
	font-size: 1.25rem;
	color: #667eea;
	opacity: 0;
	transform: translateX(-8px);
	transition: all 0.2s ease;
}

.sb-app-card:hover .sb-app-card-arrow {
	opacity: 1;
	transform: translateX(0);
}

@media (max-width: 640px) {
	.sb-apps-grid {
		grid-template-columns: 1fr;
	}

	.sb-apps-title {
		font-size: 1.5rem;
	}
}
`;
	}
});
