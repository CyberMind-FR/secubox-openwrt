'use strict';
'require view';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		window.location.href = L.url('admin', 'secubox', 'network', 'modes', 'overview');
		return Promise.resolve();
	},
	render: function() {
		return E('div', {}, _('Redirecting to Network Modes...'));
	}
});
