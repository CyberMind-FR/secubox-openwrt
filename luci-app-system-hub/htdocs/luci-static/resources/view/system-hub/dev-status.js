'use strict';
'require view';
'require system-hub/theme as Theme';
'require system-hub/dev-status-widget as DevStatusWidget';

return view.extend({
	widget: null,

	load: function() {
		return Promise.all([
			Theme.getTheme()
		]);
	},

	getWidget: function() {
		if (!this.widget)
			this.widget = DevStatusWidget.new();
		return this.widget;
	},

	render: function() {
		var widget = this.getWidget();
		var container = E('div', { 'class': 'system-hub-dev-status' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/common.css') }),
			this.renderHeader(),
			this.renderSummaryGrid(),
			E('div', { 'class': 'sh-dev-status-widget-shell' }, [
				E('div', { 'id': 'dev-status-widget' })
			]),
			this.renderFooterNote()
		]);

		window.requestAnimationFrame(function() {
			widget.render('dev-status-widget');
		});

		return container;
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
					'Bonus tab showcasing public roadmap & milestones from secubox-website demos')
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
		var milestonesCount = Object.keys(widget.milestones || {}).length;

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
				E('div', { 'class': 'sh-stat-value' }, widget.stats.modulesCount),
				E('div', { 'class': 'sh-stat-label' }, 'Modules livrés')
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
