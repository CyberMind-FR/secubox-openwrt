'use strict';
'require view';
'require secubox-theme/theme as Theme';
'require secubox/kiss-theme as KissTheme';
'require dom';
'require poll';
'require traffic-shaper/api as API';

return view.extend({
	load: function() {
		return Promise.all([
			API.getStatus(),
			API.listClasses(),
			API.listRules(),
			API.getStats()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var classes = data[1].classes || [];
		var rules = data[2].rules || [];
		var stats = data[3].stats || [];

		var activeClasses = classes.filter(function(c) { return c.enabled === '1'; });
		var activeRules = rules.filter(function(r) { return r.enabled === '1'; });

		var view = E('div', { 'class': 'traffic-shaper-dashboard' }, [
			E('link', { 'rel': 'stylesheet', 'href': L.resource('secubox-theme/secubox-theme.css') }),
			E('h2', {}, _('Traffic Shaper Overview')),

			// Status Cards
			E('div', { 'class': 'ts-status-cards' }, [
				E('div', { 'class': 'ts-status-card' }, [
					E('h3', {}, _('System Status')),
					E('div', { 'class': 'ts-status-value ' + (status.running ? 'ts-status-active' : 'ts-status-inactive') },
						status.running ? _('Active') : _('Inactive')),
					E('div', { 'class': 'ts-status-label' },
						status.running ? _('QoS is running') : _('QoS is not active'))
				]),

				E('div', { 'class': 'ts-status-card' }, [
					E('h3', {}, _('Traffic Classes')),
					E('div', { 'class': 'ts-status-value' }, activeClasses.length.toString()),
					E('div', { 'class': 'ts-status-label' },
						_('%d total classes').format(classes.length))
				]),

				E('div', { 'class': 'ts-status-card' }, [
					E('h3', {}, _('Active Rules')),
					E('div', { 'class': 'ts-status-value' }, activeRules.length.toString()),
					E('div', { 'class': 'ts-status-label' },
						_('%d total rules').format(rules.length))
				])
			]),

			// Traffic Class Flow Diagram
			E('div', { 'class': 'ts-class-diagram' }, [
				E('h3', {}, _('Traffic Class Flow')),
				E('div', { 'class': 'ts-class-flow' },
					activeClasses.length > 0 ?
						activeClasses.map(function(cls) {
							var clsStats = stats.find(function(s) { return s.class === cls['.name']; }) || {};

							return E('div', {
								'class': 'ts-class-item ' + API.getPriorityColor(parseInt(cls.priority || 5))
							}, [
								E('div', { 'class': 'ts-class-info' }, [
									E('div', { 'class': 'ts-class-name' }, cls.name || cls['.name']),
									E('div', { 'class': 'ts-class-details' }, [
										_('Priority: %s').format(API.getPriorityLabel(parseInt(cls.priority || 5))),
										' | ',
										_('Rate: %s').format(API.formatBandwidth(cls.rate)),
										' | ',
										_('Ceil: %s').format(API.formatBandwidth(cls.ceil))
									])
								]),
								E('div', { 'class': 'ts-class-metrics' }, [
									E('div', { 'class': 'ts-metric' }, [
										E('div', { 'class': 'ts-metric-value' },
											API.formatBytes(parseInt(clsStats.bytes || 0))),
										E('div', { 'class': 'ts-metric-label' }, _('Traffic'))
									]),
									E('div', { 'class': 'ts-metric' }, [
										E('div', { 'class': 'ts-metric-value' },
											(clsStats.packets || 0).toString()),
										E('div', { 'class': 'ts-metric-label' }, _('Packets'))
									])
								])
							]);
						}) :
						E('p', { 'style': 'text-align: center; color: #999;' },
							_('No active traffic classes. Configure classes to begin traffic shaping.'))
				)
			]),

			// Quick Actions
			E('div', { 'style': 'margin-top: 2em;' }, [
				E('h3', {}, _('Quick Actions')),
				E('div', { 'class': 'ts-action-buttons' }, [
					E('button', {
						'class': 'ts-btn ts-btn-primary',
						'click': function() {
							window.location.href = L.url('admin/network/traffic-shaper/classes');
						}
					}, _('Manage Classes')),
					E('button', {
						'class': 'ts-btn ts-btn-primary',
						'click': function() {
							window.location.href = L.url('admin/network/traffic-shaper/rules');
						}
					}, _('Manage Rules')),
					E('button', {
						'class': 'ts-btn ts-btn-success',
						'click': function() {
							window.location.href = L.url('admin/network/traffic-shaper/presets');
						}
					}, _('Apply Preset')),
					E('button', {
						'class': 'ts-btn ts-btn-primary',
						'click': function() {
							window.location.href = L.url('admin/network/traffic-shaper/stats');
						}
					}, _('View Statistics'))
				])
			])
		]);

		// Setup auto-refresh
		poll.add(L.bind(function() {
			return Promise.all([
				API.getStatus(),
				API.listClasses(),
				API.getStats()
			]).then(L.bind(function(refreshData) {
				// Update would happen here in a real implementation
				// For now, just return to keep polling active
			}, this));
		}, this), 5);

		return KissTheme.wrap([view], 'admin/network/traffic-shaper/overview');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
