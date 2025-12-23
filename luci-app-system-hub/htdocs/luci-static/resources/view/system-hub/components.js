'use strict';
'require view';
'require dom';
'require ui';

var api = L.require('system-hub.api');

return view.extend({
	load: function() {
		return api.callGetComponents();
	},

	render: function(data) {
		var components = data.components || [];
		var self = this;

		var installed = components.filter(function(c) { return c.status === 'installed'; });
		var planned = components.filter(function(c) { return c.status === 'planned'; });

		var view = E('div', { 'class': 'system-hub-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('system-hub/dashboard.css') }),
			
			// Installed Components
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🧩'), 'Composants Installés' ]),
					E('div', { 'class': 'sh-card-badge' }, installed.length + ' actifs')
				]),
				E('div', { 'class': 'sh-card-body' }, [
					E('div', { 'class': 'sh-components-grid' }, 
						installed.map(function(c) { return self.renderComponent(c); })
					)
				])
			]),
			
			// Planned Components
			E('div', { 'class': 'sh-card' }, [
				E('div', { 'class': 'sh-card-header' }, [
					E('div', { 'class': 'sh-card-title' }, [ E('span', { 'class': 'sh-card-title-icon' }, '🗓️'), 'Roadmap - Composants Planifiés' ])
				]),
				E('div', { 'class': 'sh-card-body' }, 
					planned.map(function(c) { return self.renderRoadmapItem(c); })
				)
			])
		]);

		return view;
	},

	renderComponent: function(c) {
		var self = this;
		return E('div', { 'class': 'sh-component-card', 'style': '--component-color: ' + c.color }, [
			E('div', { 'class': 'sh-component-header' }, [
				E('div', { 'class': 'sh-component-info' }, [
					E('div', { 'class': 'sh-component-icon' }, api.getComponentIcon(c.icon)),
					E('div', {}, [
						E('div', { 'class': 'sh-component-name' }, c.name),
						E('div', { 'class': 'sh-component-desc' }, c.description)
					])
				]),
				E('div', { 'class': 'sh-component-status ' + (c.running ? 'running' : 'stopped') }, 
					c.running ? 'Running' : 'Stopped')
			]),
			E('div', { 'class': 'sh-component-actions' }, [
				E('div', { 
					'class': 'sh-component-action',
					'click': function() { self.manageComponent(c.id, c.running ? 'stop' : 'start'); }
				}, c.running ? '⏹️ Stop' : '▶️ Start'),
				E('div', { 
					'class': 'sh-component-action',
					'click': function() { self.manageComponent(c.id, 'restart'); }
				}, '🔄 Restart'),
				E('div', { 
					'class': 'sh-component-action',
					'click': function() { window.location.href = c.web_port ? 'http://' + window.location.hostname + ':' + c.web_port : '#'; }
				}, '📊 Open')
			])
		]);
	},

	renderRoadmapItem: function(c) {
		return E('div', { 'class': 'sh-roadmap-item' }, [
			E('div', { 'class': 'sh-roadmap-icon' }, api.getComponentIcon(c.icon)),
			E('div', { 'class': 'sh-roadmap-info' }, [
				E('div', { 'class': 'sh-roadmap-name' }, c.name),
				E('div', { 'class': 'sh-roadmap-desc' }, c.description)
			]),
			E('div', { 'class': 'sh-roadmap-date' }, c.roadmap_date || 'TBD')
		]);
	},

	manageComponent: function(id, action) {
		ui.showModal(_('Gestion Composant'), [
			E('p', {}, 'Action: ' + action + ' sur ' + id + '...'),
			E('div', { 'class': 'spinning' })
		]);

		api.callManageComponent(id, action).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.addNotification(null, E('p', {}, '✅ ' + result.message), 'success');
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, '❌ ' + (result.error || 'Erreur')), 'error');
			}
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
