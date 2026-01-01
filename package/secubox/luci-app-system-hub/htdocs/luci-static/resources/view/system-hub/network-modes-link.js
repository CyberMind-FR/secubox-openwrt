'use strict';
'require view';

return view.extend({
	load: function() {
		window.location.href = L.url('admin', 'secubox', 'network', 'modes', 'overview');
		return Promise.resolve();
	},
	render: function() {
		return E('div', {}, _('Redirecting to Network Modes...'));
	}
});
