'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require system-hub/theme-assets as ThemeAssets';
'require system-hub/dev-status-widget as DevStatusWidget';
'require system-hub/nav as HubNav';
'require secubox-portal/header as SbHeader';
'require secubox/kiss-theme';

return view.extend({
	widget: null,

	load: function() {
		var shLang = (typeof L !== 'undefined' && L.env && L.env.lang) ||
			(document.documentElement && document.documentElement.getAttribute('lang')) ||
			(navigator.language ? navigator.language.split('-')[0] : 'en');
		return Theme.init({ language: shLang });
	},

	getWidget: function() {
		if (!this.widget)
			this.widget = DevStatusWidget;
		return this.widget;
	},

	render: function() {
		var widget = this.getWidget();

		var content = [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			ThemeAssets.stylesheet('common.css'),
			ThemeAssets.stylesheet('dashboard.css'),
			HubNav.renderTabs('dev-status'),
			this.renderHeader(),
			this.renderSummaryGrid(),
			E('div', { 'class': 'sh-dev-status-widget-shell' }, [
				E('div', { 'id': 'dev-status-widget' })
			]),
			this.renderFooterNote(),
			E('style', {
				'type': 'text/css'
			}, `
				/* Widget v2.1 - full display */
				.sh-dev-status-widget-shell {
					margin-top: 16px;
				}
			`)
		];

		window.requestAnimationFrame(function() {
			widget.render('dev-status-widget');
		});

		return KissTheme.wrap(content, 'admin/system/hub/dev-status');
	},

	renderHeader: function() {
		var widget = this.getWidget();
		var currentPhase = widget.getCurrentPhase();

		return E('div', { 'class': 'sh-page-header' }, [
			E('div', {}, [
				E('h2', { 'class': 'sh-page-title' }, [
					E('span', { 'class': 'sh-page-title-icon' }, '🚀'),
					'Development Status'
				]),
				E('p', { 'class': 'sh-page-subtitle' },
					'SecuBox + System Hub version monitor (v' + widget.targetVersion + ' target)')
			]),
			E('div', { 'class': 'sh-page-insight' }, [
				E('div', { 'class': 'sh-page-insight-label' }, 'Current phase'),
				E('div', { 'class': 'sh-page-insight-value' },
					currentPhase.phase + ' · ' + currentPhase.name),
				E('div', { 'class': 'sh-page-insight-sub' }, currentPhase.period)
			])
		]);
	},

	renderSummaryGrid: function() {
		var widget = this.getWidget();
		var overallProgress = widget.getOverallProgress();
		var phase = widget.getCurrentPhase();
		var milestonesCount = (widget.milestones || []).length;

		return E('div', { 'class': 'sh-stats-grid sh-dev-status-grid' }, [
			E('div', { 'class': 'sh-stat-badge' }, [
				E('div', { 'class': 'sh-stat-value', 'style': 'color:#10b981;' }, overallProgress + '%'),
				E('div', { 'class': 'sh-stat-label' }, 'Global progress')
			]),
			E('div', { 'class': 'sh-stat-badge' }, [
				E('div', { 'class': 'sh-stat-value' }, milestonesCount),
				E('div', { 'class': 'sh-stat-label' }, 'Milestone groups')
			]),
			E('div', { 'class': 'sh-stat-badge' }, [
				E('div', { 'class': 'sh-stat-value' }, Object.keys(widget.features || {}).length),
				E('div', { 'class': 'sh-stat-label' }, 'Features')
			]),
			E('div', { 'class': 'sh-stat-badge' }, [
				E('div', { 'class': 'sh-stat-value' }, (phase.status || '').replace('-', ' ')),
				E('div', { 'class': 'sh-stat-label' }, 'Phase status')
			])
		]);
	},

	renderFooterNote: function() {
		return E('div', {
			'class': 'sh-dev-status-note'
		}, [
			E('strong', {}, 'ℹ️ Transparence SecuBox'),
			E('span', {},
				' Données synchronisées avec la page demo-dev-status du site public pour partager l\'avancement avec la communauté.')
		]);
	}
});
