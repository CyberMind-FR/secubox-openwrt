'use strict';
'require baseclass';

return baseclass.extend({
	// Stat card widget
	renderStatCard: function(icon, value, label, color) {
		return E('div', { 'class': 'stat-card ' + (color || '') }, [
			E('div', { 'class': 'stat-icon' }, icon),
			E('div', { 'class': 'stat-value' }, value),
			E('div', { 'class': 'stat-label' }, label)
		]);
	},

	// Status badge
	renderStatusBadge: function(status) {
		var statusMap = {
			'running': { class: 'badge-success', text: 'Running' },
			'stopped': { class: 'badge-warning', text: 'Stopped' },
			'available': { class: 'badge-secondary', text: 'Available' },
			'error': { class: 'badge-danger', text: 'Error' }
		};

		var config = statusMap[status] || statusMap['available'];
		return E('span', { 'class': 'badge ' + config.class }, config.text);
	},

	// App card
	renderAppCard: function(app, status, onInstall, onRemove, onConfigure) {
		var self = this;

		return E('div', { 'class': 'app-card' }, [
			E('div', { 'class': 'app-icon' }, app.icon || '📦'),
			E('div', { 'class': 'app-info' }, [
				E('h3', {}, app.name),
				E('p', { 'class': 'app-description' }, app.description),
				E('div', { 'class': 'app-meta' }, [
					E('span', { 'class': 'app-category' }, app.category),
					self.renderStatusBadge(status.status)
				])
			]),
			E('div', { 'class': 'app-actions' },
				status.installed ? [
					E('button', {
						'class': 'btn btn-sm btn-primary',
						'click': onConfigure
					}, 'Configure'),
					E('button', {
						'class': 'btn btn-sm btn-danger',
						'click': onRemove
					}, 'Remove')
				] : [
					E('button', {
						'class': 'btn btn-sm btn-success',
						'click': onInstall
					}, 'Install')
				]
			)
		]);
	},

	// Loading spinner
	renderLoader: function(message) {
		return E('div', { 'class': 'loader-container' }, [
			E('div', { 'class': 'loader' }),
			E('p', {}, message || 'Loading...')
		]);
	},

	// Alert box
	renderAlert: function(type, message, dismissible) {
		var box = E('div', { 'class': 'alert alert-' + type }, [
			E('span', {}, message)
		]);

		if (dismissible) {
			box.appendChild(E('button', {
				'class': 'alert-close',
				'click': function() { box.remove(); }
			}, '×'));
		}

		return box;
	}
});
