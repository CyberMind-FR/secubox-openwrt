'use strict';
'require view';
'require ui';
'require system-hub/api as API';
'require system-hub/theme as Theme';

// Load CSS
document.head.appendChild(E('link', {
	'rel': 'stylesheet',
	'type': 'text/css',
	'href': L.resource('system-hub/dashboard.css')
}));

// Initialize theme
Theme.init();

return L.view.extend({
	load: function() {
		return API.getLogs(100, '');
	},

	render: function(logs) {
		var v = E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('System Logs')),
			E('div', { 'class': 'cbi-map-descr' }, _('View and filter system logs'))
		]);

		var section = E('div', { 'class': 'cbi-section' });

		// Filter controls
		var controlsDiv = E('div', { 'style': 'margin-bottom: 15px; display: flex; gap: 10px; align-items: center;' });

		var filterInput = E('input', {
			'type': 'text',
			'class': 'cbi-input-text',
			'placeholder': _('Filter logs...'),
			'style': 'flex: 1;'
		});

		var linesSelect = E('select', { 'class': 'cbi-input-select' }, [
			E('option', { 'value': '50' }, '50 lines'),
			E('option', { 'value': '100', 'selected': '' }, '100 lines'),
			E('option', { 'value': '200' }, '200 lines'),
			E('option', { 'value': '500' }, '500 lines'),
			E('option', { 'value': '1000' }, '1000 lines')
		]);

		var refreshBtn = E('button', {
			'class': 'cbi-button cbi-button-action',
			'click': L.bind(function() {
				this.refreshLogs(filterInput.value, parseInt(linesSelect.value));
			}, this)
		}, _('Refresh'));

		var clearBtn = E('button', {
			'class': 'cbi-button cbi-button-neutral',
			'click': function() {
				filterInput.value = '';
			}
		}, _('Clear Filter'));

		controlsDiv.appendChild(filterInput);
		controlsDiv.appendChild(linesSelect);
		controlsDiv.appendChild(refreshBtn);
		controlsDiv.appendChild(clearBtn);

		section.appendChild(controlsDiv);

		// Log display
		var logContainer = E('div', { 'id': 'log-container' });
		section.appendChild(logContainer);

		// Initial render
		this.renderLogs(logContainer, logs);

		v.appendChild(section);

		return v;
	},

	renderLogs: function(container, logs) {
		var logsText = logs.length > 0 ? logs.join('\n') : _('No logs available');

		L.dom.content(container, [
			E('pre', {
				'style': 'background: #000; color: #0f0; padding: 15px; overflow: auto; max-height: 600px; font-size: 11px; font-family: monospace; border-radius: 5px;'
			}, logsText)
		]);
	},

	refreshLogs: function(filter, lines) {
		ui.showModal(_('Loading Logs'), [
			E('p', { 'class': 'spinning' }, _('Fetching logs...'))
		]);

		API.getLogs(lines, filter).then(L.bind(function(logs) {
			ui.hideModal();
			var container = document.getElementById('log-container');
			if (container) {
				this.renderLogs(container, logs);
			}
		}, this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Failed to load logs: ') + err.message), 'error');
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
