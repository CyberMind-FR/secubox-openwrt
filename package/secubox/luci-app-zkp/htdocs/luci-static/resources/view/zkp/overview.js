'use strict';
'require view';
'require rpc';
'require ui';
'require poll';
'require secubox/kiss-theme';

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

	renderStats: function(status) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(status.key_count || 0, 'Keys', c.blue),
			KissTheme.stat('50', 'Max Nodes', c.purple),
			KissTheme.stat('SHA3-256', 'Hash', c.cyan),
			KissTheme.stat('Blum 1986', 'Protocol', c.green)
		];
	},

	renderKeysTable: function(keys) {
		var self = this;
		if (!keys || keys.length === 0) {
			return E('div', { 'style': 'text-align: center; padding: 20px; color: var(--kiss-muted);' }, [
				E('p', {}, 'No keys generated yet.'),
				E('p', {}, 'Use the form above to generate your first ZKP key pair.')
			]);
		}

		var rows = keys.map(function(key) {
			return E('tr', { 'data-name': key.name }, [
				E('td', { 'style': 'font-weight: 600;' }, key.name),
				E('td', {}, String(key.nodes || '-')),
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatBytes(key.graph_size || 0)),
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatBytes(key.key_size || 0)),
				E('td', { 'style': 'color: var(--kiss-muted);' }, formatDate(key.created)),
				E('td', { 'style': 'width: 200px;' }, [
					E('div', { 'style': 'display: flex; gap: 6px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, 'handleProve', key.name)
						}, 'Prove'),
						E('button', {
							'class': 'kiss-btn kiss-btn-blue',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, 'handleVerify', key.name)
						}, 'Verify'),
						E('button', {
							'class': 'kiss-btn kiss-btn-red',
							'style': 'padding: 4px 10px; font-size: 11px;',
							'click': ui.createHandlerFn(self, 'handleDelete', key.name)
						}, 'Delete')
					])
				])
			]);
		});

		return E('table', { 'class': 'kiss-table' }, [
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
			E('tbody', {}, rows)
		]);
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var keysData = data[1] || {};
		var keys = keysData.keys || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'ZKP Hamiltonian Cryptography'),
					status.tools_available ?
						KissTheme.badge('v' + (status.version || '1.0'), 'green') :
						KissTheme.badge('Not Installed', 'red')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Zero-knowledge proof system based on Hamiltonian cycle problem')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-4', 'style': 'margin: 20px 0;' },
				this.renderStats(status)),

			// Keygen Section
			KissTheme.card('Generate New Key',
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
					E('div', { 'style': 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;' }, [
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Key Name'),
							E('input', {
								'type': 'text',
								'id': 'zkp-name',
								'placeholder': 'my_key',
								'value': 'key_' + Date.now(),
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Nodes (4-50)'),
							E('input', {
								'type': 'number',
								'id': 'zkp-nodes',
								'min': '4',
								'max': '50',
								'value': '20',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							})
						]),
						E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
							E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Edge Density'),
							E('select', {
								'id': 'zkp-density',
								'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
							}, [
								E('option', { 'value': '0.5' }, '0.5 (Sparse)'),
								E('option', { 'value': '0.7' }, '0.7 (Medium)'),
								E('option', { 'value': '0.8', 'selected': true }, '0.8 (Dense)'),
								E('option', { 'value': '1.0' }, '1.0 (Complete)')
							])
						])
					]),
					E('div', { 'style': 'display: flex; gap: 12px;' }, [
						E('button', {
							'class': 'kiss-btn kiss-btn-purple',
							'id': 'zkp-keygen-btn',
							'click': ui.createHandlerFn(this, 'handleKeygen')
						}, 'Generate')
					]),
					E('div', { 'id': 'zkp-keygen-result' })
				])
			),

			// Keys Table
			KissTheme.card('Saved Keys', this.renderKeysTable(keys)),

			// Verification Result
			E('div', { 'id': 'zkp-verify-section', 'style': 'display: none;' }, [
				KissTheme.card('Verification Result',
					E('div', { 'id': 'zkp-verify-result' })
				)
			])
		];

		return KissTheme.wrap(content, 'admin/services/zkp/overview');
	},

	handleKeygen: function(ev) {
		var btn = document.getElementById('zkp-keygen-btn');
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
				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: rgba(74, 222, 128, 0.15); border-radius: 8px; color: var(--kiss-green);'
				}, [
					E('strong', {}, 'Key generated successfully!'),
					E('br'),
					'Name: ' + result.name,
					E('br'),
					'Nodes: ' + result.nodes + ', Density: ' + result.density,
					E('br'),
					'Graph: ' + formatBytes(result.graph_size) + ', Key: ' + formatBytes(result.key_size)
				]));
				window.location.reload();
			} else {
				resultDiv.innerHTML = '';
				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: rgba(248, 113, 113, 0.15); border-radius: 8px; color: var(--kiss-red);'
				}, [
					E('strong', {}, 'Error: '),
					result.error || 'Unknown error'
				]));
			}
		}).catch(function(err) {
			btn.disabled = false;
			btn.textContent = 'Generate';
			resultDiv.innerHTML = '';
			resultDiv.appendChild(E('div', {
				'style': 'padding: 16px; background: rgba(248, 113, 113, 0.15); border-radius: 8px; color: var(--kiss-red);'
			}, [
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
				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: var(--kiss-bg); border-radius: 8px;'
				}, [
					E('strong', {}, 'Proof generated for: ' + result.name),
					E('br'),
					'Size: ' + formatBytes(result.proof_size),
					E('br'),
					'File: ' + result.proof_file,
					E('br'),
					E('br'),
					E('em', { 'style': 'color: var(--kiss-muted);' }, 'Click "Verify" to validate this proof.')
				]));
			} else {
				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: rgba(248, 113, 113, 0.15); border-radius: 8px; color: var(--kiss-red);'
				}, [
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
				var bgColor = isAccept ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)';
				var textColor = isAccept ? 'var(--kiss-green)' : 'var(--kiss-red)';

				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: ' + bgColor + '; border-radius: 8px; color: ' + textColor + ';'
				}, [
					E('strong', { 'style': 'font-size: 1.25rem;' },
						isAccept ? 'ACCEPT' : 'REJECT'),
					E('br'),
					E('br'),
					'Key: ' + result.name,
					E('br'),
					'Verification: ' + (isAccept ?
						'Proof is valid. Prover knows a Hamiltonian cycle.' :
						'Proof is invalid or tampered.')
				]));
			} else {
				resultDiv.appendChild(E('div', {
					'style': 'padding: 16px; background: rgba(248, 113, 113, 0.15); border-radius: 8px; color: var(--kiss-red);'
				}, [
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
