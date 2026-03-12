'use strict';
'require view';
'require ui';
'require auth-guardian/api as api';
'require secubox/kiss-theme';

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return api.getVouchers();
	},

	renderStats: function(vouchers) {
		var c = KissTheme.colors;
		var unused = vouchers.filter(function(v) { return v.status === 'unused'; }).length;
		var used = vouchers.filter(function(v) { return v.status === 'used'; }).length;
		return [
			KissTheme.stat(vouchers.length, 'Total', c.blue),
			KissTheme.stat(unused, 'Available', c.green),
			KissTheme.stat(used, 'Used', c.muted)
		];
	},

	renderVoucherCard: function(voucher) {
		var isUnused = voucher.status === 'unused';
		var statusColor = isUnused ? 'green' : 'muted';

		return E('div', {
			'style': 'background: var(--kiss-bg); padding: 20px; border-radius: 10px; text-align: center;'
		}, [
			E('div', {
				'style': 'font-family: monospace; font-size: 20px; font-weight: 700; color: var(--kiss-cyan); letter-spacing: 2px;'
			}, voucher.code),
			E('div', {
				'style': 'margin-top: 12px; color: var(--kiss-muted); font-size: 13px;'
			}, 'Valid for 24 hours'),
			E('div', { 'style': 'margin-top: 8px;' }, [
				KissTheme.badge(voucher.status, statusColor)
			])
		]);
	},

	render: function(data) {
		var self = this;
		var vouchers = data.vouchers || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Access Vouchers'),
					KissTheme.badge(vouchers.length + ' vouchers', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Generate and manage single-use access vouchers for guest authentication')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(vouchers)),

			// Generate Button
			E('div', { 'style': 'margin: 20px 0;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						api.generateVoucher().then(function(r) {
							ui.addNotification(null, E('p', 'Generated voucher: ' + r.code), 'success');
							location.reload();
						});
					}
				}, 'Generate Voucher')
			]),

			// Vouchers Grid
			KissTheme.card('Vouchers',
				vouchers.length > 0 ?
					E('div', {
						'style': 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;'
					}, vouchers.map(function(v) {
						return self.renderVoucherCard(v);
					})) :
					E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 30px;' },
						'No vouchers generated yet. Click "Generate Voucher" to create one.')
			)
		];

		return KissTheme.wrap(content, 'admin/secubox/auth-guardian/vouchers');
	}
});
