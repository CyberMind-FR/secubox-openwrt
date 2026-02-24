'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

var callStatus = rpc.declare({
	object: 'luci.zkp',
	method: 'status',
	expect: {}
});

var callListKeys = rpc.declare({
	object: 'luci.zkp',
	method: 'list_keys',
	expect: {}
});

var callKeygen = rpc.declare({
	object: 'luci.zkp',
	method: 'keygen',
	params: ['nodes', 'density', 'name'],
	expect: {}
});

var callProve = rpc.declare({
	object: 'luci.zkp',
	method: 'prove',
	params: ['name'],
	expect: {}
});

var callVerify = rpc.declare({
	object: 'luci.zkp',
	method: 'verify',
	params: ['name'],
	expect: {}
});

var callDeleteKey = rpc.declare({
	object: 'luci.zkp',
	method: 'delete_key',
	params: ['name'],
	expect: {}
});

function injectStyles() {
	if (document.getElementById('zkp-styles')) return;

	var style = document.createElement('style');
	style.id = 'zkp-styles';
	style.textContent = `
		.zkp-container {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 1200px;
			margin: 0 auto;
			padding: 1rem;
		}

		.zkp-header {
			display: flex;
			align-items: center;
			gap: 1rem;
			margin-bottom: 1.5rem;
			padding-bottom: 1rem;
			border-bottom: 2px solid #3b82f6;
		}

		.zkp-header h2 {
			margin: 0;
			font-size: 1.5rem;
			color: #1e293b;
		}

		.zkp-badge {
			display: inline-block;
			padding: 0.25rem 0.75rem;
			border-radius: 9999px;
			font-size: 0.75rem;
			font-weight: 600;
		}

		.zkp-badge-success { background: #dcfce7; color: #166534; }
		.zkp-badge-error { background: #fee2e2; color: #991b1b; }
		.zkp-badge-info { background: #dbeafe; color: #1e40af; }

		.zkp-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 1rem;
			margin-bottom: 1.5rem;
		}

		.zkp-card {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 0.5rem;
			padding: 1rem;
			box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		}

		.zkp-card-title {
			font-size: 0.875rem;
			font-weight: 600;
			color: #64748b;
			margin-bottom: 0.5rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.zkp-card-value {
			font-size: 1.5rem;
			font-weight: 700;
			color: #1e293b;
		}

		.zkp-section {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 0.5rem;
			padding: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.zkp-section-title {
			font-size: 1.125rem;
			font-weight: 600;
			color: #1e293b;
			margin-bottom: 1rem;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.zkp-form-row {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
			margin-bottom: 1rem;
			align-items: flex-end;
		}

		.zkp-form-group {
			flex: 1;
			min-width: 150px;
		}

		.zkp-form-group label {
			display: block;
			font-size: 0.875rem;
			font-weight: 500;
			color: #475569;
			margin-bottom: 0.25rem;
		}

		.zkp-form-group input,
		.zkp-form-group select {
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 1px solid #cbd5e1;
			border-radius: 0.375rem;
			font-size: 0.875rem;
		}

		.zkp-form-group input:focus,
		.zkp-form-group select:focus {
			outline: none;
			border-color: #3b82f6;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		.zkp-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 1rem;
			border: none;
			border-radius: 0.375rem;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.15s;
		}

		.zkp-btn-primary {
			background: #3b82f6;
			color: #fff;
		}

		.zkp-btn-primary:hover {
			background: #2563eb;
		}

		.zkp-btn-success {
			background: #22c55e;
			color: #fff;
		}

		.zkp-btn-success:hover {
			background: #16a34a;
		}

		.zkp-btn-danger {
			background: #ef4444;
			color: #fff;
		}

		.zkp-btn-danger:hover {
			background: #dc2626;
		}

		.zkp-btn-secondary {
			background: #64748b;
			color: #fff;
		}

		.zkp-btn-secondary:hover {
			background: #475569;
		}

		.zkp-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.zkp-table {
			width: 100%;
			border-collapse: collapse;
		}

		.zkp-table th,
		.zkp-table td {
			padding: 0.75rem;
			text-align: left;
			border-bottom: 1px solid #e2e8f0;
		}

		.zkp-table th {
			font-weight: 600;
			color: #64748b;
			font-size: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.zkp-table tr:hover {
			background: #f8fafc;
		}

		.zkp-result {
			padding: 1rem;
			border-radius: 0.5rem;
			margin-top: 1rem;
			font-family: monospace;
			font-size: 0.875rem;
		}

		.zkp-result-accept {
			background: #dcfce7;
			border: 1px solid #86efac;
			color: #166534;
		}

		.zkp-result-reject {
			background: #fee2e2;
			border: 1px solid #fca5a5;
			color: #991b1b;
		}

		.zkp-result-info {
			background: #f1f5f9;
			border: 1px solid #cbd5e1;
			color: #475569;
		}

		.zkp-actions {
			display: flex;
			gap: 0.5rem;
		}

		.zkp-empty {
			text-align: center;
			padding: 2rem;
			color: #64748b;
		}

		/* Dark mode */
		@media (prefers-color-scheme: dark) {
			.zkp-header h2 { color: #f1f5f9; }
			.zkp-card { background: #1e293b; border-color: #334155; }
			.zkp-card-title { color: #94a3b8; }
			.zkp-card-value { color: #f1f5f9; }
			.zkp-section { background: #1e293b; border-color: #334155; }
			.zkp-section-title { color: #f1f5f9; }
			.zkp-form-group label { color: #94a3b8; }
			.zkp-form-group input,
			.zkp-form-group select {
				background: #0f172a;
				border-color: #334155;
				color: #f1f5f9;
			}
			.zkp-table th { color: #94a3b8; }
			.zkp-table td { color: #e2e8f0; }
			.zkp-table th,
			.zkp-table td { border-color: #334155; }
			.zkp-table tr:hover { background: #334155; }
			.zkp-result-info { background: #334155; border-color: #475569; color: #e2e8f0; }
		}
	`;
	document.head.appendChild(style);
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
	if (!timestamp) return '-';
	var date = new Date(timestamp * 1000);
	return date.toLocaleString();
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return Promise.all([
			callStatus(),
			callListKeys()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var keysData = data[1] || {};
		var keys = keysData.keys || [];

		injectStyles();

		var view = E('div', { 'class': 'zkp-container' }, [
			// Header
			E('div', { 'class': 'zkp-header' }, [
				E('h2', {}, 'ZKP Hamiltonian Cryptography'),
				status.tools_available ?
					E('span', { 'class': 'zkp-badge zkp-badge-success' }, 'v' + (status.version || '1.0')) :
					E('span', { 'class': 'zkp-badge zkp-badge-error' }, 'Not Installed')
			]),

			// Stats Grid
			E('div', { 'class': 'zkp-grid' }, [
				E('div', { 'class': 'zkp-card' }, [
					E('div', { 'class': 'zkp-card-title' }, 'Saved Keys'),
					E('div', { 'class': 'zkp-card-value' }, String(status.key_count || 0))
				]),
				E('div', { 'class': 'zkp-card' }, [
					E('div', { 'class': 'zkp-card-title' }, 'Max Nodes'),
					E('div', { 'class': 'zkp-card-value' }, '50')
				]),
				E('div', { 'class': 'zkp-card' }, [
					E('div', { 'class': 'zkp-card-title' }, 'Hash Algorithm'),
					E('div', { 'class': 'zkp-card-value' }, 'SHA3-256')
				]),
				E('div', { 'class': 'zkp-card' }, [
					E('div', { 'class': 'zkp-card-title' }, 'Protocol'),
					E('div', { 'class': 'zkp-card-value' }, 'Blum 1986')
				])
			]),

			// Keygen Section
			E('div', { 'class': 'zkp-section' }, [
				E('div', { 'class': 'zkp-section-title' }, [
					E('span', {}, '\uD83D\uDD11'),
					' Generate New Key'
				]),
				E('div', { 'class': 'zkp-form-row' }, [
					E('div', { 'class': 'zkp-form-group' }, [
						E('label', {}, 'Key Name'),
						E('input', {
							'type': 'text',
							'id': 'zkp-name',
							'placeholder': 'my_key',
							'value': 'key_' + Date.now()
						})
					]),
					E('div', { 'class': 'zkp-form-group' }, [
						E('label', {}, 'Nodes (4-50)'),
						E('input', {
							'type': 'number',
							'id': 'zkp-nodes',
							'min': '4',
							'max': '50',
							'value': '20'
						})
					]),
					E('div', { 'class': 'zkp-form-group' }, [
						E('label', {}, 'Edge Density'),
						E('select', { 'id': 'zkp-density' }, [
							E('option', { 'value': '0.5' }, '0.5 (Sparse)'),
							E('option', { 'value': '0.7' }, '0.7 (Medium)'),
							E('option', { 'value': '0.8', 'selected': true }, '0.8 (Dense)'),
							E('option', { 'value': '1.0' }, '1.0 (Complete)')
						])
					]),
					E('div', { 'class': 'zkp-form-group', 'style': 'flex: 0;' }, [
						E('label', {}, '\u00A0'),
						E('button', {
							'class': 'zkp-btn zkp-btn-primary',
							'click': ui.createHandlerFn(this, 'handleKeygen')
						}, 'Generate')
					])
				]),
				E('div', { 'id': 'zkp-keygen-result' })
			]),

			// Keys Table Section
			E('div', { 'class': 'zkp-section' }, [
				E('div', { 'class': 'zkp-section-title' }, [
					E('span', {}, '\uD83D\uDDC2\uFE0F'),
					' Saved Keys'
				]),
				this.renderKeysTable(keys)
			]),

			// Verification Result Section
			E('div', { 'class': 'zkp-section', 'id': 'zkp-verify-section', 'style': 'display: none;' }, [
				E('div', { 'class': 'zkp-section-title' }, [
					E('span', {}, '\u2705'),
					' Verification Result'
				]),
				E('div', { 'id': 'zkp-verify-result' })
			])
		]);

		return view;
	},

	renderKeysTable: function(keys) {
		if (!keys || keys.length === 0) {
			return E('div', { 'class': 'zkp-empty' }, [
				E('p', {}, 'No keys generated yet.'),
				E('p', {}, 'Use the form above to generate your first ZKP key pair.')
			]);
		}

		return E('table', { 'class': 'zkp-table' }, [
			E('thead', {}, [
				E('tr', {}, [
					E('th', {}, 'Name'),
					E('th', {}, 'Nodes'),
					E('th', {}, 'Graph Size'),
					E('th', {}, 'Key Size'),
					E('th', {}, 'Created'),
					E('th', {}, 'Actions')
				])
			]),
			E('tbody', {}, keys.map(function(key) {
				return E('tr', { 'data-name': key.name }, [
					E('td', {}, E('strong', {}, key.name)),
					E('td', {}, String(key.nodes || '-')),
					E('td', {}, formatBytes(key.graph_size || 0)),
					E('td', {}, formatBytes(key.key_size || 0)),
					E('td', {}, formatDate(key.created)),
					E('td', {}, E('div', { 'class': 'zkp-actions' }, [
						E('button', {
							'class': 'zkp-btn zkp-btn-success',
							'click': ui.createHandlerFn(this, 'handleProve', key.name)
						}, 'Prove'),
						E('button', {
							'class': 'zkp-btn zkp-btn-primary',
							'click': ui.createHandlerFn(this, 'handleVerify', key.name)
						}, 'Verify'),
						E('button', {
							'class': 'zkp-btn zkp-btn-danger',
							'click': ui.createHandlerFn(this, 'handleDelete', key.name)
						}, 'Delete')
					]))
				]);
			}.bind(this)))
		]);
	},

	handleKeygen: function(ev) {
		var btn = ev.target;
		var name = document.getElementById('zkp-name').value;
		var nodes = parseInt(document.getElementById('zkp-nodes').value, 10);
		var density = document.getElementById('zkp-density').value;
		var resultDiv = document.getElementById('zkp-keygen-result');

		btn.disabled = true;
		btn.textContent = 'Generating...';

		callKeygen(nodes, density, name).then(function(result) {
			btn.disabled = false;
			btn.textContent = 'Generate';

			if (result.success) {
				resultDiv.innerHTML = '';
				resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-accept' }, [
					E('strong', {}, 'Key generated successfully!'),
					E('br'),
					'Name: ' + result.name,
					E('br'),
					'Nodes: ' + result.nodes + ', Density: ' + result.density,
					E('br'),
					'Graph: ' + formatBytes(result.graph_size) + ', Key: ' + formatBytes(result.key_size)
				]));
				// Refresh the page to show new key
				window.location.reload();
			} else {
				resultDiv.innerHTML = '';
				resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-reject' }, [
					E('strong', {}, 'Error: '),
					result.error || 'Unknown error'
				]));
			}
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = 'Generate';
			resultDiv.innerHTML = '';
			resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-reject' }, [
				E('strong', {}, 'RPC Error: '),
				err.message || String(err)
			]));
		});
	},

	handleProve: function(name, ev) {
		var btn = ev.target;
		var resultSection = document.getElementById('zkp-verify-section');
		var resultDiv = document.getElementById('zkp-verify-result');

		btn.disabled = true;
		btn.textContent = 'Proving...';

		callProve(name).then(function(result) {
			btn.disabled = false;
			btn.textContent = 'Prove';

			resultSection.style.display = 'block';
			resultDiv.innerHTML = '';

			if (result.success) {
				resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-info' }, [
					E('strong', {}, 'Proof generated for: ' + result.name),
					E('br'),
					'Size: ' + formatBytes(result.proof_size),
					E('br'),
					'File: ' + result.proof_file,
					E('br'),
					E('br'),
					E('em', {}, 'Click "Verify" to validate this proof.')
				]));
			} else {
				resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-reject' }, [
					E('strong', {}, 'Prove failed: '),
					result.error || 'Unknown error'
				]));
			}

			resultSection.scrollIntoView({ behavior: 'smooth' });
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = 'Prove';
		});
	},

	handleVerify: function(name, ev) {
		var btn = ev.target;
		var resultSection = document.getElementById('zkp-verify-section');
		var resultDiv = document.getElementById('zkp-verify-result');

		btn.disabled = true;
		btn.textContent = 'Verifying...';

		callVerify(name).then(function(result) {
			btn.disabled = false;
			btn.textContent = 'Verify';

			resultSection.style.display = 'block';
			resultDiv.innerHTML = '';

			if (result.success) {
				var isAccept = result.result === 'ACCEPT';
				resultDiv.appendChild(E('div', {
					'class': 'zkp-result ' + (isAccept ? 'zkp-result-accept' : 'zkp-result-reject')
				}, [
					E('strong', { 'style': 'font-size: 1.25rem;' },
						isAccept ? '\u2705 ACCEPT' : '\u274C REJECT'),
					E('br'),
					E('br'),
					'Key: ' + result.name,
					E('br'),
					'Verification: ' + (isAccept ?
						'Proof is valid. Prover knows a Hamiltonian cycle.' :
						'Proof is invalid or tampered.')
				]));
			} else {
				resultDiv.appendChild(E('div', { 'class': 'zkp-result zkp-result-reject' }, [
					E('strong', {}, 'Verify failed: '),
					result.error || 'Unknown error'
				]));
			}

			resultSection.scrollIntoView({ behavior: 'smooth' });
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = 'Verify';
		});
	},

	handleDelete: function(name, ev) {
		if (!confirm('Delete key "' + name + '" and all associated files?')) {
			return;
		}

		var btn = ev.target;
		btn.disabled = true;

		callDeleteKey(name).then(function(result) {
			if (result.success) {
				window.location.reload();
			} else {
				btn.disabled = false;
				alert('Delete failed: ' + (result.error || 'Unknown error'));
			}
		}).catch(function(err) {
			btn.disabled = false;
			alert('RPC Error: ' + (err.message || String(err)));
		});
	}
});
