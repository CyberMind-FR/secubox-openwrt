'use strict';
'require view';
'require secubox/kiss-theme';

return view.extend({
	load: function() {
		window.location.href = L.url('admin', 'secubox', 'network', 'cdn-cache');
		return Promise.resolve();
	},
	render: function() {
		return E('div', {}, _('Redirecting to CDN Cache...'));
	}
});
