'use strict';
'require view';
'require dom';
'require ui';
'require rpc';
'require haproxy.api as api';

// Async certificate API
var callStartCertRequest = rpc.declare({
	object: 'luci.haproxy',
	method: 'start_cert_request',
	params: ['domain', 'staging']
});

var callGetCertTask = rpc.declare({
	object: 'luci.haproxy',
	method: 'get_cert_task',
	params: ['task_id']
});

var callListCertTasks = rpc.declare({
	object: 'luci.haproxy',
	method: 'list_cert_tasks'
});

return view.extend({
	pollInterval: null,
	currentTaskId: null,

	load: function() {
		return Promise.all([
			api.listCertificates(),
			callListCertTasks().catch(function() { return { tasks: [] }; })
		]);
	},

	render: function(data) {
		var self = this;
		var certificates = data[0] || [];
		var tasks = (data[1] && data[1].tasks) || [];

		// Filter active tasks
		var activeTasks = tasks.filter(function(t) {
			return t.status === 'pending' || t.status === 'running';
		});

		var view = E('div', { 'class': 'cbi-map' }, [
			E('style', {}, this.getStyles()),
			E('h2', {}, '🔒 SSL Certificates'),
			E('p', {}, 'Manage SSL/TLS certificates for your domains. Request free certificates via ACME or import your own.'),

			// Active tasks (if any)
			activeTasks.length > 0 ? this.renderActiveTasks(activeTasks) : null,

			// Request certificate section
			E('div', { 'class': 'cert-section' }, [
				E('h3', {}, '📜 Request Certificate (ACME/Let\'s Encrypt)'),
				E('div', { 'class': 'cert-form' }, [
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, 'Domain'),
						E('input', {
							'type': 'text',
							'id': 'acme-domain',
							'class': 'cbi-input-text',
							'placeholder': 'example.com'
						}),
						E('span', { 'class': 'cert-hint' }, 'Domain must point to this server')
					]),
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, 'Mode'),
						E('div', { 'class': 'cert-mode-toggle' }, [
							E('label', { 'class': 'cert-mode-option' }, [
								E('input', {
									'type': 'radio',
									'name': 'acme-mode',
									'value': 'production',
									'checked': true
								}),
								E('span', { 'class': 'cert-mode-label cert-mode-prod' }, '🏭 Production'),
								E('span', { 'class': 'cert-mode-desc' }, 'Publicly trusted certificate')
							]),
							E('label', { 'class': 'cert-mode-option' }, [
								E('input', {
									'type': 'radio',
									'name': 'acme-mode',
									'value': 'staging'
								}),
								E('span', { 'class': 'cert-mode-label cert-mode-staging' }, '🧪 Staging'),
								E('span', { 'class': 'cert-mode-desc' }, 'Test certificate (not trusted)')
							])
						])
					]),
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, ''),
						E('button', {
							'class': 'cbi-button cbi-button-apply',
							'id': 'btn-request-cert',
							'click': function() { self.handleRequestCertAsync(); }
						}, '🚀 Request Certificate')
					])
				]),

				// Progress container (hidden initially)
				E('div', { 'id': 'cert-progress-container', 'class': 'cert-progress', 'style': 'display: none;' }, [
					E('div', { 'class': 'cert-progress-header' }, [
						E('span', { 'id': 'cert-progress-icon', 'class': 'cert-progress-icon' }, '⏳'),
						E('span', { 'id': 'cert-progress-domain', 'class': 'cert-progress-domain' }, ''),
						E('span', { 'id': 'cert-progress-status', 'class': 'cert-status' }, '')
					]),
					E('div', { 'class': 'cert-progress-phases' }, [
						E('div', { 'id': 'phase-starting', 'class': 'cert-phase' }, '⬜ Starting'),
						E('div', { 'id': 'phase-validating', 'class': 'cert-phase' }, '⬜ DNS Validation'),
						E('div', { 'id': 'phase-requesting', 'class': 'cert-phase' }, '⬜ ACME Request'),
						E('div', { 'id': 'phase-verifying', 'class': 'cert-phase' }, '⬜ Verifying'),
						E('div', { 'id': 'phase-complete', 'class': 'cert-phase' }, '⬜ Complete')
					]),
					E('div', { 'id': 'cert-progress-message', 'class': 'cert-progress-message' }, '')
				])
			]),

			// Import certificate section
			E('div', { 'class': 'cert-section' }, [
				E('h3', {}, '📥 Import Certificate'),
				E('div', { 'class': 'cert-form' }, [
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, 'Domain'),
						E('input', {
							'type': 'text',
							'id': 'import-domain',
							'class': 'cbi-input-text',
							'placeholder': 'example.com'
						})
					]),
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, 'Certificate (PEM)'),
						E('textarea', {
							'id': 'import-cert',
							'class': 'cbi-input-textarea',
							'rows': '4',
							'placeholder': '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
						})
					]),
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, 'Private Key (PEM)'),
						E('textarea', {
							'id': 'import-key',
							'class': 'cbi-input-textarea',
							'rows': '4',
							'placeholder': '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
						})
					]),
					E('div', { 'class': 'cert-form-row' }, [
						E('label', {}, ''),
						E('button', {
							'class': 'cbi-button cbi-button-add',
							'click': function() { self.handleImportCert(); }
						}, '📥 Import Certificate')
					])
				])
			]),

			// Certificate list
			E('div', { 'class': 'cert-section' }, [
				E('h3', {}, '📋 Installed Certificates (' + certificates.length + ')'),
				E('div', { 'class': 'cert-list' },
					certificates.length === 0
						? E('p', { 'class': 'cert-empty' }, 'No certificates installed.')
						: certificates.map(function(cert) {
							return self.renderCertRow(cert);
						})
				)
			])
		]);

		return view;
	},

	renderActiveTasks: function(tasks) {
		var self = this;
		return E('div', { 'class': 'cert-section cert-active-tasks' }, [
			E('h3', {}, '⏳ Active Certificate Requests'),
			E('div', { 'class': 'cert-task-list' },
				tasks.map(function(task) {
					return E('div', { 'class': 'cert-task-item' }, [
						E('span', { 'class': 'cert-task-domain' }, task.domain),
						E('span', { 'class': 'cert-task-phase' }, task.phase),
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() { self.resumeTaskPolling(task.task_id); }
						}, '👁️ View Progress')
					]);
				})
			)
		]);
	},

	renderCertRow: function(cert) {
		var self = this;
		var isExpiringSoon = cert.expires_in && cert.expires_in < 30;
		var typeIcon = cert.type === 'acme' ? '🔄' : '📄';
		var statusIcon = cert.enabled ? '✅' : '⬜';

		return E('div', { 'class': 'cert-row' }, [
			E('span', { 'class': 'cert-col-status' }, statusIcon),
			E('span', { 'class': 'cert-col-domain' }, [
				E('strong', {}, cert.domain),
				E('span', { 'class': 'cert-type-badge' }, typeIcon + ' ' + (cert.type === 'acme' ? 'ACME' : 'Manual'))
			]),
			E('span', { 'class': 'cert-col-expiry ' + (isExpiringSoon ? 'cert-expiring' : '') },
				cert.expires ? '📅 ' + cert.expires : '-'
			),
			E('span', { 'class': 'cert-col-issuer' }, cert.issuer || '-'),
			E('span', { 'class': 'cert-col-action' }, [
				E('button', {
					'class': 'cert-btn cert-btn-delete',
					'title': 'Delete',
					'click': function() { self.handleDeleteCert(cert); }
				}, '🗑️')
			])
		]);
	},

	handleRequestCertAsync: function() {
		var self = this;
		var domain = document.getElementById('acme-domain').value.trim();
		var staging = document.querySelector('input[name="acme-mode"]:checked').value === 'staging';

		if (!domain) {
			ui.addNotification(null, E('p', {}, '❌ Domain is required'), 'error');
			return;
		}

		// Validate domain format
		if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(domain)) {
			ui.addNotification(null, E('p', {}, '❌ Invalid domain format'), 'error');
			return;
		}

		// Show progress container
		var progressContainer = document.getElementById('cert-progress-container');
		progressContainer.style.display = 'block';

		// Update UI
		document.getElementById('cert-progress-domain').textContent = domain;
		document.getElementById('cert-progress-status').textContent = staging ? '🧪 STAGING' : '🏭 PRODUCTION';
		document.getElementById('cert-progress-status').className = 'cert-status ' + (staging ? 'cert-status-staging' : 'cert-status-prod');
		document.getElementById('cert-progress-message').textContent = 'Starting certificate request...';
		document.getElementById('btn-request-cert').disabled = true;

		// Reset phase indicators
		['starting', 'validating', 'requesting', 'verifying', 'complete'].forEach(function(phase) {
			document.getElementById('phase-' + phase).className = 'cert-phase';
			document.getElementById('phase-' + phase).textContent = '⬜ ' + document.getElementById('phase-' + phase).textContent.substring(2);
		});

		// Start async request
		callStartCertRequest(domain, staging).then(function(res) {
			if (res.success && res.task_id) {
				self.currentTaskId = res.task_id;
				self.startPolling();
			} else {
				document.getElementById('cert-progress-icon').textContent = '❌';
				document.getElementById('cert-progress-message').textContent = res.error || 'Failed to start request';
				document.getElementById('btn-request-cert').disabled = false;
			}
		}).catch(function(err) {
			document.getElementById('cert-progress-icon').textContent = '❌';
			document.getElementById('cert-progress-message').textContent = 'Error: ' + err.message;
			document.getElementById('btn-request-cert').disabled = false;
		});
	},

	resumeTaskPolling: function(taskId) {
		var self = this;
		var progressContainer = document.getElementById('cert-progress-container');
		progressContainer.style.display = 'block';
		this.currentTaskId = taskId;
		this.startPolling();
	},

	startPolling: function() {
		var self = this;
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
		}

		this.pollInterval = setInterval(function() {
			self.pollTaskStatus();
		}, 2000);

		// Poll immediately
		this.pollTaskStatus();
	},

	stopPolling: function() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	},

	pollTaskStatus: function() {
		var self = this;
		if (!this.currentTaskId) return;

		callGetCertTask(this.currentTaskId).then(function(task) {
			if (!task || task.error) {
				self.stopPolling();
				return;
			}

			// Update progress UI
			self.updateProgressUI(task);

			// Stop polling if complete or failed
			if (task.status === 'success' || task.status === 'failed') {
				self.stopPolling();
				document.getElementById('btn-request-cert').disabled = false;

				if (task.status === 'success') {
					ui.addNotification(null, E('p', {}, '✅ Certificate issued for ' + task.domain), 'info');
					setTimeout(function() { window.location.reload(); }, 2000);
				}
			}
		}).catch(function() {
			self.stopPolling();
		});
	},

	updateProgressUI: function(task) {
		var phaseIcons = {
			'pending': '⏳', 'starting': '🔄', 'validating': '🔍',
			'requesting': '📡', 'verifying': '✔️', 'complete': '✅'
		};
		var phases = ['starting', 'validating', 'requesting', 'verifying', 'complete'];
		var currentPhaseIndex = phases.indexOf(task.phase);

		// Update main icon
		if (task.status === 'success') {
			document.getElementById('cert-progress-icon').textContent = '✅';
		} else if (task.status === 'failed') {
			document.getElementById('cert-progress-icon').textContent = '❌';
		} else {
			document.getElementById('cert-progress-icon').textContent = phaseIcons[task.phase] || '⏳';
		}

		// Update phase indicators
		phases.forEach(function(phase, index) {
			var el = document.getElementById('phase-' + phase);
			var label = el.textContent.substring(2);
			if (index < currentPhaseIndex) {
				el.className = 'cert-phase cert-phase-done';
				el.textContent = '✅ ' + label;
			} else if (index === currentPhaseIndex) {
				el.className = 'cert-phase cert-phase-active';
				el.textContent = (task.status === 'failed' ? '❌' : '🔄') + ' ' + label;
			} else {
				el.className = 'cert-phase';
				el.textContent = '⬜ ' + label;
			}
		});

		// Update message
		document.getElementById('cert-progress-message').textContent = task.message || '';

		// Update domain if needed
		if (task.domain) {
			document.getElementById('cert-progress-domain').textContent = task.domain;
		}
	},

	handleImportCert: function() {
		var domain = document.getElementById('import-domain').value.trim();
		var cert = document.getElementById('import-cert').value.trim();
		var key = document.getElementById('import-key').value.trim();

		if (!domain || !cert || !key) {
			ui.addNotification(null, E('p', {}, '❌ Domain, certificate and key are all required'), 'error');
			return;
		}

		ui.showModal('📥 Importing Certificate', [
			E('p', { 'class': 'spinning' }, 'Importing certificate for ' + domain + '...')
		]);

		return api.importCertificate(domain, cert, key).then(function(res) {
			ui.hideModal();
			if (res.success) {
				ui.addNotification(null, E('p', {}, '✅ ' + (res.message || 'Certificate imported')));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', {}, '❌ Failed: ' + (res.error || 'Unknown error')), 'error');
			}
		});
	},

	handleDeleteCert: function(cert) {
		ui.showModal('🗑️ Delete Certificate', [
			E('p', {}, 'Are you sure you want to delete the certificate for "' + cert.domain + '"?'),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, 'Cancel'),
				E('button', {
					'class': 'cbi-button cbi-button-negative',
					'click': function() {
						ui.hideModal();
						api.deleteCertificate(cert.id).then(function(res) {
							if (res.success) {
								ui.addNotification(null, E('p', {}, '✅ Certificate deleted'));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', {}, '❌ Failed: ' + (res.error || 'Unknown error')), 'error');
							}
						});
					}
				}, '🗑️ Delete')
			])
		]);
	},

	getStyles: function() {
		return `
			.cert-section { margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
			@media (prefers-color-scheme: dark) { .cert-section { background: #1a1a2e; } }

			.cert-section h3 { margin: 0 0 15px 0; font-size: 1.1em; }

			.cert-form-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
			.cert-form-row label { min-width: 120px; padding-top: 8px; font-weight: 500; }
			.cert-form-row input[type="text"], .cert-form-row textarea { flex: 1; max-width: 400px; }
			.cert-hint { font-size: 0.85em; color: #666; margin-left: 10px; padding-top: 8px; }

			.cert-mode-toggle { display: flex; gap: 15px; }
			.cert-mode-option { display: flex; flex-direction: column; padding: 10px 15px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; }
			.cert-mode-option:has(input:checked) { border-color: #0099cc; background: rgba(0,153,204,0.1); }
			.cert-mode-option input { display: none; }
			.cert-mode-label { font-weight: 600; margin-bottom: 4px; }
			.cert-mode-desc { font-size: 0.8em; color: #666; }
			.cert-mode-prod { color: #22c55e; }
			.cert-mode-staging { color: #f59e0b; }

			.cert-progress { margin-top: 20px; padding: 15px; background: #fff; border: 2px solid #0099cc; border-radius: 8px; }
			@media (prefers-color-scheme: dark) { .cert-progress { background: #16213e; } }

			.cert-progress-header { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
			.cert-progress-icon { font-size: 1.5em; }
			.cert-progress-domain { font-weight: 600; font-size: 1.1em; flex: 1; }
			.cert-status { padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
			.cert-status-prod { background: #22c55e; color: #fff; }
			.cert-status-staging { background: #f59e0b; color: #000; }

			.cert-progress-phases { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
			.cert-phase { padding: 6px 12px; background: #eee; border-radius: 16px; font-size: 0.85em; }
			.cert-phase-done { background: #dcfce7; color: #166534; }
			.cert-phase-active { background: #dbeafe; color: #1d4ed8; }
			@media (prefers-color-scheme: dark) {
				.cert-phase { background: #333; }
				.cert-phase-done { background: #166534; color: #dcfce7; }
				.cert-phase-active { background: #1d4ed8; color: #dbeafe; }
			}

			.cert-progress-message { font-size: 0.9em; color: #666; padding: 8px; background: #f5f5f5; border-radius: 4px; }
			@media (prefers-color-scheme: dark) { .cert-progress-message { background: #2a2a3e; color: #aaa; } }

			.cert-list { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
			@media (prefers-color-scheme: dark) { .cert-list { border-color: #444; } }

			.cert-row { display: flex; align-items: center; padding: 12px; border-bottom: 1px solid #eee; gap: 15px; }
			.cert-row:last-child { border-bottom: none; }
			@media (prefers-color-scheme: dark) { .cert-row { border-bottom-color: #333; } }

			.cert-col-status { width: 30px; text-align: center; font-size: 1.1em; }
			.cert-col-domain { flex: 2; min-width: 150px; }
			.cert-col-domain strong { display: block; }
			.cert-type-badge { font-size: 0.8em; color: #666; }
			.cert-col-expiry { flex: 1; min-width: 120px; font-size: 0.9em; }
			.cert-expiring { color: #ef4444; font-weight: 500; }
			.cert-col-issuer { flex: 1; min-width: 100px; font-size: 0.85em; color: #666; }
			.cert-col-action { width: 50px; }

			.cert-btn { border: none; background: transparent; cursor: pointer; font-size: 1.1em; padding: 6px 10px; border-radius: 4px; }
			.cert-btn:hover { background: rgba(0,0,0,0.1); }
			.cert-btn-delete:hover { background: rgba(239,68,68,0.2); }

			.cert-empty { color: #888; font-style: italic; padding: 20px; text-align: center; }

			.cert-active-tasks { background: #fef3c7; border: 2px solid #f59e0b; }
			@media (prefers-color-scheme: dark) { .cert-active-tasks { background: #422006; border-color: #f59e0b; } }
			.cert-task-list { display: flex; flex-direction: column; gap: 10px; }
			.cert-task-item { display: flex; align-items: center; gap: 15px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 6px; }
			.cert-task-domain { font-weight: 600; flex: 1; }
			.cert-task-phase { font-size: 0.85em; color: #666; }
		`;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
