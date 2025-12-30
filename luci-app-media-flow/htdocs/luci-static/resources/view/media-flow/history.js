'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require form';
'require media-flow/api as API';

return L.view.extend({
	load: function() {
		return Promise.all([
			API.getStreamHistory(24)
		]);
	},

	render: function(data) {
		var history = data[0] || [];

		var m = new form.Map('media_flow', _('Stream History'), 
			_('Historical record of detected streaming sessions'));

		var s = m.section(form.NamedSection, '__history', 'history');
		s.anonymous = true;
		s.addremove = false;

		// Filter options
		var o = s.option(form.ListValue, 'timeframe', _('Time Period'));
		o.value('1', _('Last 1 hour'));
		o.value('6', _('Last 6 hours'));
		o.value('24', _('Last 24 hours'));
		o.value('168', _('Last 7 days'));
		o.default = '24';

		// Display history table
		s.render = L.bind(function(view, section_id) {
			return API.getStreamHistory(24).then(L.bind(function(history) {
				var table = E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr table-titles' }, [
						E('th', { 'class': 'th' }, _('Time')),
						E('th', { 'class': 'th' }, _('Service')),
						E('th', { 'class': 'th' }, _('Client')),
						E('th', { 'class': 'th' }, _('Quality')),
						E('th', { 'class': 'th' }, _('Duration'))
					])
				]);

				if (history && history.length > 0) {
					// Sort by timestamp descending
					history.sort(function(a, b) {
						return new Date(b.timestamp) - new Date(a.timestamp);
					});

					history.slice(0, 100).forEach(function(entry) {
						var time = new Date(entry.timestamp).toLocaleString();
						var duration = Math.floor(entry.duration_seconds / 60);

						var qualityColor = {
							'SD': '#999',
							'HD': '#0088cc',
							'FHD': '#00cc00',
							'4K': '#cc0000'
						}[entry.quality] || '#666';

						table.appendChild(E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, time),
							E('td', { 'class': 'td' }, entry.application),
							E('td', { 'class': 'td' }, entry.client),
							E('td', { 'class': 'td' }, 
								E('span', { 'style': 'color: ' + qualityColor }, entry.quality)
							),
							E('td', { 'class': 'td' }, duration + ' min')
						]));
					});
				} else {
					table.appendChild(E('tr', { 'class': 'tr' }, [
						E('td', { 'class': 'td', 'colspan': '5', 'style': 'text-align: center; font-style: italic' }, 
							_('No historical data available'))
					]));
				}

				return E('div', { 'class': 'cbi-section' }, [
					E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
					E('h3', {}, _('Recent Sessions')),
					table
				]);
			}, this));
		}, this, this);

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
