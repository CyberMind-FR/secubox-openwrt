'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callMasterLinkStatus = rpc.declare({
	object: 'luci.masterlink',
	method: 'status',
	expect: {}
});

var callMasterLinkInfo = rpc.declare({
	object: 'luci.masterlink',
	method: 'info',
	expect: {}
});

var callMasterLinkVerify = rpc.declare({
	object: 'luci.masterlink',
	method: 'verify',
	params: ['master_ip', 'token'],
	expect: {}
});

var callMasterLinkJoin = rpc.declare({
	object: 'luci.masterlink',
	method: 'join',
	params: ['master_ip', 'token'],
	expect: {}
});

var callMasterLinkLeave = rpc.declare({
	object: 'luci.masterlink',
	method: 'leave',
	expect: {}
});

// Parse invite URL to extract master IP and token
function parseInviteUrl(input) {
	input = input.trim();

	// Pattern 1: Full URL - http://IP:PORT/path?token=XXX or https://...
	var urlMatch = input.match(/https?:\/\/([^:/]+)(?::\d+)?.*[?&]token=([^&\s]+)/i);
	if (urlMatch) {
		return { master_ip: urlMatch[1], token: urlMatch[2] };
	}

	// Pattern 2: IP and token separated by space or comma
	var spaceMatch = input.match(/^([0-9.]+)[,\s]+([a-zA-Z0-9_-]+)$/);
	if (spaceMatch) {
		return { master_ip: spaceMatch[1], token: spaceMatch[2] };
	}

	// Pattern 3: Just a token (need to ask for IP separately or use default)
	if (/^[a-zA-Z0-9_-]{16,}$/.test(input)) {
		return { token: input, master_ip: null };
	}

	return null;
}

function formatStatus(status) {
	switch (status) {
		case 'approved':
			return E('span', { 'class': 'badge', 'style': 'background:#2e7d32;color:#fff' }, 'Connected');
		case 'pending':
			return E('span', { 'class': 'badge', 'style': 'background:#f57c00;color:#fff' }, 'Pending Approval');
		case 'disconnected':
		default:
			return E('span', { 'class': 'badge', 'style': 'background:#616161;color:#fff' }, 'Not Connected');
	}
}

return view.extend({
	load: function() {
		return Promise.all([
			callMasterLinkStatus(),
			callMasterLinkInfo()
		]);
	},

	render: function(data) {
		var status = data[0] || {};
		var info = data[1] || {};
		var view = this;

		var statusSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', 'Mesh Status'),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td', 'style': 'width:200px' }, 'Status'),
					E('td', { 'class': 'td' }, formatStatus(status.status))
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Role'),
					E('td', { 'class': 'td' }, status.role || 'standalone')
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Local Fingerprint'),
					E('td', { 'class': 'td' }, E('code', {}, status.fingerprint || info.fingerprint || 'N/A'))
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Hostname'),
					E('td', { 'class': 'td' }, info.hostname || 'N/A')
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'IP Address'),
					E('td', { 'class': 'td' }, info.address || 'N/A')
				])
			])
		]);

		// If connected, show master info
		if (status.enabled == 1 && status.master_ip) {
			statusSection.appendChild(E('table', { 'class': 'table', 'style': 'margin-top:1em' }, [
				E('tr', { 'class': 'tr cbi-section-table-titles' }, [
					E('th', { 'class': 'th', 'colspan': 2 }, 'Connected Master')
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Master IP'),
					E('td', { 'class': 'td' }, status.master_ip)
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Master Fingerprint'),
					E('td', { 'class': 'td' }, E('code', {}, status.master_fingerprint || 'N/A'))
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Depth'),
					E('td', { 'class': 'td' }, String(status.depth || 0))
				]),
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, 'Joined At'),
					E('td', { 'class': 'td' }, status.joined_at || 'N/A')
				])
			]));

			// Leave button
			var leaveBtn = E('button', {
				'class': 'btn cbi-button cbi-button-negative',
				'click': ui.createHandlerFn(this, function() {
					return callMasterLinkLeave().then(function(res) {
						if (res.status === 'ok') {
							ui.addNotification(null, E('p', 'Left mesh network'), 'info');
							window.location.reload();
						} else {
							ui.addNotification(null, E('p', 'Failed to leave: ' + (res.message || 'Unknown error')), 'error');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
					});
				})
			}, 'Leave Mesh');

			statusSection.appendChild(E('div', { 'style': 'margin-top:1em' }, leaveBtn));
		}

		// Join section (only if not connected)
		var joinSection = E('div', { 'class': 'cbi-section' });

		if (status.enabled != 1) {
			var inviteInput = E('input', {
				'type': 'text',
				'class': 'cbi-input-text',
				'id': 'invite-url',
				'style': 'width:100%;font-family:monospace',
				'placeholder': 'http://192.168.1.1:7331/master-link/?token=abc123... or: 192.168.1.1 abc123token'
			});

			var verifyBtn = E('button', {
				'class': 'btn cbi-button',
				'style': 'margin-right:0.5em',
				'click': ui.createHandlerFn(this, function() {
					var input = document.getElementById('invite-url').value;
					var parsed = parseInviteUrl(input);

					if (!parsed || !parsed.master_ip) {
						ui.addNotification(null, E('p', 'Invalid invite URL or token'), 'error');
						return;
					}

					return callMasterLinkVerify(parsed.master_ip, parsed.token).then(function(res) {
						if (res.status === 'error') {
							ui.addNotification(null, E('p', 'Verification failed: ' + (res.message || 'Unknown error')), 'error');
						} else {
							var msg = E('div', {}, [
								E('p', { 'style': 'font-weight:bold' }, 'Master Node Information:'),
								E('ul', {}, [
									E('li', {}, 'Hostname: ' + (res.hostname || 'N/A')),
									E('li', {}, 'Fingerprint: ' + (res.fingerprint || 'N/A')),
									E('li', {}, 'Network: ' + (res.network_name || 'N/A'))
								]),
								E('p', { 'style': 'color:#f57c00' }, 'Verify this matches the expected master before joining!')
							]);
							ui.addNotification(null, msg, 'info');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', 'Verification error: ' + err.message), 'error');
					});
				})
			}, 'Verify Master');

			var joinBtn = E('button', {
				'class': 'btn cbi-button cbi-button-positive',
				'click': ui.createHandlerFn(this, function() {
					var input = document.getElementById('invite-url').value;
					var parsed = parseInviteUrl(input);

					if (!parsed || !parsed.master_ip) {
						ui.addNotification(null, E('p', 'Invalid invite URL or token'), 'error');
						return;
					}

					return callMasterLinkJoin(parsed.master_ip, parsed.token).then(function(res) {
						if (res.status === 'approved') {
							ui.addNotification(null, E('p', 'Successfully joined mesh network!'), 'success');
							window.location.reload();
						} else if (res.status === 'pending') {
							ui.addNotification(null, E('p', 'Join request submitted. Waiting for master approval.'), 'info');
							window.location.reload();
						} else if (res.status === 'error') {
							ui.addNotification(null, E('p', 'Join failed: ' + (res.message || 'Unknown error')), 'error');
						} else {
							ui.addNotification(null, E('p', 'Unexpected response: ' + JSON.stringify(res)), 'warning');
						}
					}).catch(function(err) {
						ui.addNotification(null, E('p', 'Join error: ' + err.message), 'error');
					});
				})
			}, 'Join Mesh');

			joinSection.appendChild(E('h3', 'Join Mesh Network'));
			joinSection.appendChild(E('p', { 'class': 'cbi-section-descr' },
				'Enter the invite URL or token provided by the mesh master to join the network.'));
			joinSection.appendChild(E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, 'Invite URL / Token'),
				E('div', { 'class': 'cbi-value-field' }, inviteInput)
			]));
			joinSection.appendChild(E('div', { 'class': 'cbi-page-actions' }, [
				verifyBtn,
				joinBtn
			]));
		}

		// CLI help section
		var cliSection = E('div', { 'class': 'cbi-section' }, [
			E('h3', 'Command Line'),
			E('p', { 'class': 'cbi-section-descr' }, 'You can also join using the CLI tool:'),
			E('pre', { 'style': 'background:#1a1a1a;padding:1em;border-radius:4px;overflow-x:auto' }, [
				E('code', {}, [
					'# Using IP and token\n',
					'sbx-mesh-join 192.168.1.1 abc123token\n\n',
					'# Using full URL\n',
					'sbx-mesh-join \'http://192.168.1.1:7331/master-link/?token=abc123\'\n\n',
					'# One-liner from master\n',
					'wget -qO- \'http://master-ip:7331/api/v1/p2p/master-link/join-script?token=xxx\' | sh'
				])
			])
		]);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', 'Master-Link'),
			E('div', { 'class': 'cbi-map-descr' }, 'Join and manage SecuBox mesh network membership.'),
			statusSection,
			joinSection,
			cliSection
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
