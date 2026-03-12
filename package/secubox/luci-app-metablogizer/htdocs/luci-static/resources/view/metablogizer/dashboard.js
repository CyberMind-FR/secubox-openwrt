'use strict';
'require view';
'require ui';
'require metablogizer.api as api';
'require metablogizer.qrcode as qrcode';
'require secubox/kiss-theme';

return view.extend({
	status: {},
	sites: [],
	exposure: [],

	load: function() {
		var self = this;
		return api.getDashboardData().then(function(data) {
			self.status = data.status || {};
			self.sites = data.sites || [];
			self.exposure = data.exposure || [];
		});
	},

	render: function() {
		var self = this;
		var sites = this.sites;
		var exposure = this.exposure;

		// Merge exposure data into sites
		var exposureMap = {};
		exposure.forEach(function(e) {
			exposureMap[e.id] = e;
		});

		return KissTheme.wrap([
			E('div', { 'style': 'max-width: 1200px;' }, [
				E('h2', {}, _('MetaBlogizer')),
				E('div', { 'style': 'color: var(--kiss-muted); margin-bottom: 16px;' }, _('Static site publisher with HAProxy vhosts and SSL')),

				// One-Click Deploy Section
				E('div', { 'style': 'background: var(--kiss-card); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
					E('h3', {}, _('One-Click Deploy')),
					E('div', { 'style': 'color: var(--kiss-muted); margin-bottom: 12px;' }, _('Upload HTML/ZIP to create a new static site with auto-configured SSL')),
					E('div', { 'style': 'display:flex; gap:1em; flex-wrap:wrap; align-items:flex-end' }, [
						E('div', { 'style': 'flex:1; min-width:150px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Site Name')),
							E('input', { 'type': 'text', 'id': 'deploy-name', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
								'placeholder': 'myblog', 'style': 'width:100%' })
						]),
						E('div', { 'style': 'flex:2; min-width:200px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Domain')),
							E('input', { 'type': 'text', 'id': 'deploy-domain', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
								'placeholder': 'blog.example.com', 'style': 'width:100%' })
						]),
						E('div', { 'style': 'flex:2; min-width:200px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Content (HTML or ZIP)')),
							E('input', { 'type': 'file', 'id': 'deploy-file', 'accept': '.html,.htm,.zip',
								'style': 'width:100%' })
						]),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'white-space:nowrap',
							'click': ui.createHandlerFn(this, 'handleOneClickDeploy')
						}, _('Deploy'))
					])
				]),

				// Sites Table
				E('div', { 'style': 'background: var(--kiss-card); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
					E('h3', {}, _('Sites')),
					sites.length > 0 ?
						this.renderSitesTable(sites, exposureMap) :
						E('div', { 'style': 'color: var(--kiss-muted); margin-bottom: 12px;' }, _('No sites configured'))
				])
			])
		], 'admin/services/metablogizer');
	},

	renderSitesTable: function(sites, exposureMap) {
		var self = this;

		return E('table', { 'class': 'kiss-table' }, [
			E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
				E('th', { 'style': 'padding: 10px 12px; font-weight: 500; color: var(--kiss-muted);' }, _('Site')),
				E('th', { 'style': 'padding: 10px 12px; font-weight: 500; color: var(--kiss-muted);' }, _('Status')),
				E('th', { 'style': 'padding: 10px 12px; font-weight: 500; color: var(--kiss-muted);' }, _('Exposure')),
				E('th', { 'style': 'padding: 10px 12px; font-weight: 500; color: var(--kiss-muted);', 'style': 'text-align:center' }, _('Actions'))
			])
		].concat(sites.map(function(site) {
			var exp = exposureMap[site.id] || {};
			return self.renderSiteRow(site, exp);
		})));
	},

	renderSiteRow: function(site, exp) {
		var self = this;

		// Backend status badge
		var backendBadge;
		if (exp.backend_running) {
			backendBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: rgba(76, 175, 80, 0.2); color: var(--kiss-green, #4caf50)'
			}, 'Running');
		} else {
			backendBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: rgba(244, 67, 54, 0.2); color: var(--kiss-red, #f44336)'
			}, 'Stopped');
		}

		// Exposure badge
		var exposureBadge;
		if (exp.vhost_exists && exp.cert_status === 'valid') {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: rgba(76, 175, 80, 0.2); color: var(--kiss-green, #4caf50)',
				'title': 'SSL certificate valid'
			}, 'SSL OK');
		} else if (exp.vhost_exists && exp.cert_status === 'warning') {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: rgba(255, 152, 0, 0.2); color: var(--kiss-orange, #ff9800)',
				'title': 'Certificate expiring soon'
			}, 'SSL Warn');
		} else if (exp.vhost_exists) {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: rgba(244, 67, 54, 0.2); color: var(--kiss-red, #f44336)',
				'title': exp.cert_status || 'No certificate'
			}, 'No SSL');
		} else {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background: var(--kiss-bg2); color: var(--kiss-muted)'
			}, 'Private');
		}

		// Auth badge
		var authBadge = '';
		if (exp.auth_required) {
			authBadge = E('span', {
				'style': 'display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.85em; background: rgba(33, 150, 243, 0.2); color: var(--kiss-blue, #2196f3); margin-left:4px'
			}, 'Auth');
		}

		// WAF badge (from site.waf_enabled returned by list_sites)
		var wafBadge = '';
		if (site.waf_enabled) {
			wafBadge = E('span', {
				'style': 'display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.85em; background: rgba(0, 188, 212, 0.2); color: var(--kiss-cyan, #00bcd4); margin-left:4px',
				'title': _('Traffic inspected by WAF (mitmproxy)')
			}, 'WAF');
		}

		// Domain link
		var domainEl;
		if (site.domain) {
			domainEl = E('a', {
				'href': 'https://' + site.domain,
				'target': '_blank',
				'style': 'color: var(--kiss-cyan, #00bcd4)'
			}, site.domain);
		} else {
			domainEl = E('em', { 'style': 'color: var(--kiss-muted)' }, '-');
		}

		return E('tr', { 'style': 'border-bottom: 1px solid var(--kiss-line);' }, [
			// Site column
			E('td', { 'style': 'padding: 10px 12px;' }, [
				E('strong', {}, site.name),
				E('br'),
				domainEl,
				site.port ? E('span', { 'style': 'color: var(--kiss-muted); font-size:0.9em; margin-left:0.5em' }, ':' + site.port) : ''
			]),
			// Status column
			E('td', { 'style': 'padding: 10px 12px;' }, [
				backendBadge,
				exp.has_content ? '' : E('span', {
					'style': 'display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.85em; background: rgba(255, 152, 0, 0.2); color: var(--kiss-orange, #ff9800); margin-left:4px'
				}, 'Empty')
			]),
			// Exposure column
			E('td', { 'style': 'padding: 10px 12px;' }, [
				exposureBadge,
				authBadge,
				wafBadge
			]),
			// Actions column
			E('td', { 'style': 'padding: 10px 12px;', 'style': 'text-align:center; white-space:nowrap' }, [
				// Edit button
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Edit site settings'),
					'click': ui.createHandlerFn(self, 'showEditModal', site)
				}, _('Edit')),
				// Share button
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Share / QR Code'),
					'click': ui.createHandlerFn(self, 'showShareModal', site)
				}, _('Share')),
				// Upload button
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Upload content'),
					'click': ui.createHandlerFn(self, 'showUploadModal', site)
				}, _('Upload')),
				// Expose/Unpublish button - use emancipated flag, not vhost_exists
				exp.emancipated ?
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding:0.25em 0.5em; margin:2px',
						'title': _('Unpublish site'),
						'click': ui.createHandlerFn(self, 'handleUnpublish', site)
					}, _('Unpublish')) :
					E('button', {
						'class': 'kiss-btn kiss-btn-cyan',
						'style': 'padding:0.25em 0.5em; margin:2px',
						'title': _('Expose with SSL'),
						'click': ui.createHandlerFn(self, 'handleEmancipate', site)
					}, _('Expose')),
				// Auth toggle button
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:0.25em 0.5em; margin:2px; ' + (exp.auth_required ? 'background:#cce5ff' : ''),
					'title': exp.auth_required ? _('Authentication required - click to disable') : _('No authentication - click to enable'),
					'click': ui.createHandlerFn(self, 'handleToggleAuth', site, exp)
				}, exp.auth_required ? _('Unlock') : _('Lock')),
				// Health/Repair button
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Check health and repair'),
					'click': ui.createHandlerFn(self, 'handleHealthCheck', site)
				}, _('Health')),
				// Delete button
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Delete site'),
					'click': ui.createHandlerFn(self, 'handleDelete', site)
				}, 'X')
			])
		]);
	},

	handleOneClickDeploy: function() {
		var self = this;
		var name = document.getElementById('deploy-name').value.trim();
		var domain = document.getElementById('deploy-domain').value.trim();
		var fileInput = document.getElementById('deploy-file');
		var file = fileInput.files[0];

		if (!name) {
			ui.addNotification(null, E('p', _('Site name is required')), 'error');
			return;
		}
		if (!/^[a-z0-9-]+$/.test(name)) {
			ui.addNotification(null, E('p', _('Name must be lowercase letters, numbers, and hyphens only')), 'error');
			return;
		}
		if (!domain) {
			ui.addNotification(null, E('p', _('Domain is required')), 'error');
			return;
		}

		ui.showModal(_('Deploying Site'), [
			E('p', { 'class': 'spinning' }, _('Creating site and configuring HAProxy...'))
		]);

		var deployFn = function(content, isZip) {
			return api.uploadAndCreateSite(name, domain, content, isZip).then(function(r) {
				ui.hideModal();
				if (r.success) {
					ui.addNotification(null, E('p', _('Site created: ') + r.url));
					window.location.reload();
				} else {
					ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown error')), 'error');
				}
			}).catch(function(e) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
			});
		};

		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var bytes = new Uint8Array(e.target.result);
				var chunks = [];
				for (var i = 0; i < bytes.length; i += 8192) {
					chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
				}
				var content = btoa(chunks.join(''));
				var isZip = file.name.toLowerCase().endsWith('.zip');
				deployFn(content, isZip);
			};
			reader.onerror = function() {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Failed to read file')), 'error');
			};
			reader.readAsArrayBuffer(file);
		} else {
			// No file - create site with default content
			deployFn('', false);
		}
	},

	showUploadModal: function(site) {
		var self = this;

		ui.showModal(_('Upload to: ') + site.name, [
			E('div', { 'style': 'background: var(--kiss-card); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('File')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'file', 'id': 'upload-file-input' }),
						E('div', { 'style': 'font-size: 0.85em; color: var(--kiss-muted);' }, _('HTML, CSS, JS, images, etc.'))
					])
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Set as index')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'checkbox', 'id': 'upload-as-index', 'checked': true }),
						E('span', { 'style': 'margin-left:0.5em' }, _('Replace index.html (main page)')),
						E('div', { 'style': 'font-size: 0.85em; color: var(--kiss-muted);' }, _('Uncheck to keep original filename'))
					])
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;', 'id': 'upload-dest-row', 'style': 'display:none' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Destination')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'text', 'id': 'upload-dest', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
							'placeholder': 'filename.html' }),
						E('div', { 'style': 'font-size: 0.85em; color: var(--kiss-muted);' }, _('Leave empty to use original filename'))
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var fileInput = document.getElementById('upload-file-input');
						var destInput = document.getElementById('upload-dest');
						var asIndexCheckbox = document.getElementById('upload-as-index');
						var file = fileInput.files[0];

						if (!file) {
							ui.addNotification(null, E('p', _('Please select a file')), 'error');
							return;
						}

						var dest = asIndexCheckbox.checked ? 'index.html' : (destInput.value.trim() || file.name);

						ui.hideModal();
						ui.showModal(_('Uploading'), [E('p', { 'class': 'spinning' }, _('Uploading file...'))]);

						var reader = new FileReader();
						reader.onload = function(e) {
							var bytes = new Uint8Array(e.target.result);
							var chunks = [];
							for (var i = 0; i < bytes.length; i += 8192) {
								chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
							}
							var content = btoa(chunks.join(''));

							var uploadFn = content.length > 40000 ?
								api.chunkedUpload(site.id, dest, content) :
								api.uploadFile(site.id, dest, content);

							uploadFn.then(function(r) {
								ui.hideModal();
								if (r && r.success) {
									ui.addNotification(null, E('p', _('File uploaded: ') + dest));
								} else {
									ui.addNotification(null, E('p', _('Upload failed')), 'error');
								}
							}).catch(function(err) {
								ui.hideModal();
								ui.addNotification(null, E('p', _('Error: ') + err.message), 'error');
							});
						};
						reader.onerror = function() {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Failed to read file')), 'error');
						};
						reader.readAsArrayBuffer(file);
					}
				}, _('Upload'))
			])
		]);

		// Toggle destination field based on checkbox
		var checkbox = document.getElementById('upload-as-index');
		var destRow = document.getElementById('upload-dest-row');
		checkbox.onchange = function() {
			destRow.style.display = this.checked ? 'none' : '';
		};
	},

	handleEmancipate: function(site) {
		var self = this;

		ui.showModal(_('Expose Site'), [
			E('p', {}, _('This will configure:')),
			E('ul', {}, [
				E('li', {}, _('HAProxy vhost for ') + site.domain),
				E('li', {}, _('ACME SSL certificate')),
				E('li', {}, _('DNS + Vortex mesh publication'))
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-cyan',
					'click': function() {
						ui.hideModal();
						self.runEmancipateAsync(site);
					}
				}, _('Expose'))
			])
		]);
	},

	runEmancipateAsync: function(site) {
		var self = this;
		var outputPre = E('pre', {
			'style': 'max-height:300px; overflow:auto; background: var(--kiss-bg2); padding:10px; font-size:11px; white-space:pre-wrap'
		}, _('Starting...'));

		ui.showModal(_('Exposing Site'), [
			E('p', { 'class': 'spinning' }, _('Running KISS ULTIME MODE workflow...')),
			outputPre
		]);

		api.emancipate(site.id).then(function(r) {
			if (!r.success) {
				ui.hideModal();
				ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown')), 'error');
				return;
			}

			var jobId = r.job_id;
			var pollInterval = setInterval(function() {
				api.emancipateStatus(jobId).then(function(status) {
					if (status.output) {
						outputPre.textContent = status.output;
						outputPre.scrollTop = outputPre.scrollHeight;
					}

					if (status.complete) {
						clearInterval(pollInterval);
						ui.hideModal();

						if (status.status === 'success') {
							ui.addNotification(null, E('p', _('Site exposed successfully!')));
							window.location.reload();
						} else {
							ui.addNotification(null, E('p', _('Exposure failed')), 'error');
						}
					}
				}).catch(function(e) {
					clearInterval(pollInterval);
					ui.hideModal();
					ui.addNotification(null, E('p', _('Poll error: ') + e.message), 'error');
				});
			}, 2000);
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	handleUnpublish: function(site) {
		var self = this;

		ui.showModal(_('Unpublish Site'), [
			E('p', {}, _('Remove public exposure for "') + site.name + '"?'),
			E('p', { 'style': 'color: var(--kiss-muted)' }, _('The site content will be preserved but the HAProxy vhost will be removed.')),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Unpublishing'), [E('p', { 'class': 'spinning' }, _('Removing exposure...'))]);

						api.unpublishSite(site.id).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', _('Site unpublished')));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown')), 'error');
							}
						}).catch(function(e) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
						});
					}
				}, _('Unpublish'))
			])
		]);
	},

	handleToggleAuth: function(site, exp) {
		var self = this;
		var newAuth = !exp.auth_required;

		ui.showModal(_('Updating'), [E('p', { 'class': 'spinning' }, _('Setting authentication...'))]);

		api.setAuthRequired(site.id, newAuth).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', newAuth ? _('Authentication enabled') : _('Authentication disabled')));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	handleDelete: function(site) {
		var self = this;

		ui.showModal(_('Delete Site'), [
			E('p', {}, _('Are you sure you want to delete "') + site.name + '"?'),
			E('p', { 'style': 'color: var(--kiss-red, #f44336)' }, _('This will remove the site, HAProxy vhost, and all files.')),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'click': function() {
						ui.hideModal();
						ui.showModal(_('Deleting'), [E('p', { 'class': 'spinning' }, _('Removing site...'))]);

						api.deleteSite(site.id).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', _('Site deleted')));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown')), 'error');
							}
						}).catch(function(e) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
						});
					}
				}, _('Delete'))
			])
		]);
	},

	handleHealthCheck: function(site) {
		var self = this;

		ui.showModal(_('Health Check'), [
			E('p', { 'class': 'spinning' }, _('Checking site health...'))
		]);

		api.checkSiteHealth(site.id).then(function(health) {
			var statusItems = [];
			var hasIssues = false;

			// Backend status
			if (health.backend_status === 'ok') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-green, #4caf50); margin:0.5em 0' },
					'✓ Backend: Running (port ' + (health.port || site.port || '?') + ')'));
			} else {
				hasIssues = true;
				statusItems.push(E('div', { 'style': 'color: var(--kiss-red, #f44336); margin:0.5em 0' },
					'✗ Backend: ' + (health.backend_status || 'Not responding')));
			}

			// Frontend status
			if (health.frontend_status === 'ok') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-green, #4caf50); margin:0.5em 0' },
					'✓ Frontend: Accessible via HAProxy'));
			} else if (health.frontend_status === 'not_configured') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-orange, #ff9800); margin:0.5em 0' },
					'○ Frontend: Not exposed (private)'));
			} else {
				hasIssues = true;
				statusItems.push(E('div', { 'style': 'color: var(--kiss-red, #f44336); margin:0.5em 0' },
					'✗ Frontend: ' + (health.frontend_status || 'Error')));
			}

			// SSL status
			if (health.ssl_status === 'valid') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-green, #4caf50); margin:0.5em 0' },
					'✓ SSL: Valid' + (health.ssl_days_remaining ? ' (' + health.ssl_days_remaining + ' days)' : '')));
			} else if (health.ssl_status === 'expiring') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-orange, #ff9800); margin:0.5em 0' },
					'! SSL: Expiring soon (' + (health.ssl_days_remaining || '?') + ' days)'));
			} else if (health.ssl_status === 'not_configured') {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-muted); margin:0.5em 0' },
					'○ SSL: Not configured'));
			} else if (health.ssl_status) {
				hasIssues = true;
				statusItems.push(E('div', { 'style': 'color: var(--kiss-red, #f44336); margin:0.5em 0' },
					'✗ SSL: ' + health.ssl_status));
			}

			// Content check
			if (health.has_content) {
				statusItems.push(E('div', { 'style': 'color: var(--kiss-green, #4caf50); margin:0.5em 0' },
					'✓ Content: index.html exists'));
			} else {
				hasIssues = true;
				statusItems.push(E('div', { 'style': 'color: var(--kiss-red, #f44336); margin:0.5em 0' },
					'✗ Content: No index.html'));
			}

			ui.hideModal();

			var modalContent = [
				E('h4', { 'style': 'margin-top:0' }, site.name + ' (' + (site.domain || 'no domain') + ')'),
				E('div', { 'style': 'padding:1em; background: var(--kiss-bg2); border-radius:4px' }, statusItems),
				E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
					E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Close')),
					' ',
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() {
							ui.hideModal();
							self.handleRepair(site);
						}
					}, _('Repair'))
				])
			];

			if (hasIssues) {
				modalContent.splice(1, 0, E('p', { 'style': 'color: var(--kiss-red, #f44336); font-weight:bold' },
					_('Issues detected - click Repair to fix')));
			} else {
				modalContent.splice(1, 0, E('p', { 'style': 'color: var(--kiss-green, #4caf50)' },
					_('All checks passed')));
			}

			ui.showModal(_('Health Check Results'), modalContent);
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Health check failed: ') + e.message), 'error');
		});
	},

	handleRepair: function(site) {
		var self = this;

		ui.showModal(_('Repairing Site'), [
			E('p', { 'class': 'spinning' }, _('Fixing permissions and restarting services...'))
		]);

		api.repairSite(site.id).then(function(result) {
			ui.hideModal();

			if (result.success) {
				var repairList = (result.repairs || '').split(' ').filter(function(r) { return r; });
				var repairMsg = repairList.length > 0 ?
					_('Repairs performed: ') + repairList.join(', ') :
					_('No repairs needed');

				ui.showModal(_('Repair Complete'), [
					E('p', { 'style': 'color: var(--kiss-green, #4caf50)' }, '✓ ' + repairMsg),
					E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
						E('button', {
							'class': 'kiss-btn',
							'click': function() {
								ui.hideModal();
								self.handleHealthCheck(site);
							}
						}, _('Re-check')),
						' ',
						E('button', { 'class': 'kiss-btn kiss-btn-green', 'click': function() {
							ui.hideModal();
							window.location.reload();
						}}, _('Done'))
					])
				]);
			} else {
				ui.addNotification(null, E('p', _('Repair failed: ') + (result.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Repair error: ') + e.message), 'error');
		});
	},

	showEditModal: function(site) {
		var self = this;

		ui.showModal(_('Edit Site: ') + site.name, [
			E('div', { 'style': 'background: var(--kiss-card); padding: 16px; border-radius: 8px; margin-bottom: 16px;' }, [
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Name')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'text', 'id': 'edit-name', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
							'value': site.name, 'style': 'width:100%' })
					])
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Domain')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'text', 'id': 'edit-domain', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
							'value': site.domain || '', 'style': 'width:100%' }),
						E('div', { 'style': 'font-size: 0.85em; color: var(--kiss-muted);' }, _('e.g. blog.example.com'))
					])
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Description')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'text', 'id': 'edit-description', 'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);',
							'value': site.description || '', 'style': 'width:100%' })
					])
				]),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;' }, [
					E('label', { 'style': 'font-weight: 500; color: var(--kiss-muted);' }, _('Enabled')),
					E('div', { 'style': 'flex: 1;' }, [
						E('input', { 'type': 'checkbox', 'id': 'edit-enabled',
							'checked': site.enabled !== '0' && site.enabled !== false })
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() {
						var name = document.getElementById('edit-name').value.trim();
						var domain = document.getElementById('edit-domain').value.trim();
						var description = document.getElementById('edit-description').value.trim();
						var enabled = document.getElementById('edit-enabled').checked ? '1' : '0';

						if (!name) {
							ui.addNotification(null, E('p', _('Name is required')), 'error');
							return;
						}

						ui.hideModal();
						ui.showModal(_('Saving'), [E('p', { 'class': 'spinning' }, _('Updating site...'))]);

						api.updateSite(site.id, name, domain, '', '1', enabled, description).then(function(r) {
							ui.hideModal();
							if (r.success) {
								ui.addNotification(null, E('p', _('Site updated')));
								window.location.reload();
							} else {
								ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown')), 'error');
							}
						}).catch(function(e) {
							ui.hideModal();
							ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
						});
					}
				}, _('Save'))
			])
		]);
	},

	showShareModal: function(site) {
		var self = this;
		var url = 'https://' + site.domain;
		var title = site.name + ' - SecuBox';
		var enc = encodeURIComponent;

		var qrSvg = '';
		try {
			qrSvg = qrcode.generateSVG(url, 180);
		} catch (e) {
			qrSvg = '<p>QR code unavailable</p>';
		}

		ui.showModal(_('Share: ') + site.name, [
			E('div', { 'style': 'text-align:center' }, [
				E('div', { 'style': 'display:flex; gap:0.5em; margin-bottom:1em' }, [
					E('input', { 'type': 'text', 'readonly': true, 'value': url, 'id': 'share-url',
						'style': 'padding: 8px 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 6px; color: var(--kiss-text);', 'style': 'flex:1' }),
					E('button', { 'class': 'kiss-btn kiss-btn-blue', 'click': function() {
						if (navigator.clipboard) {
							navigator.clipboard.writeText(url).then(function() {
								ui.addNotification(null, E('p', _('URL copied')));
							});
						}
					}}, _('Copy'))
				]),
				E('div', { 'style': 'display:inline-block; padding:1em; background: var(--kiss-bg2); border-radius:8px' }, [
					E('div', { 'innerHTML': qrSvg })
				]),
				E('div', { 'style': 'margin-top:1em; display:flex; gap:0.5em; justify-content:center; flex-wrap:wrap' }, [
					E('a', { 'href': 'https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(title),
						'target': '_blank', 'class': 'kiss-btn' }, 'Twitter'),
					E('a', { 'href': 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title),
						'target': '_blank', 'class': 'kiss-btn' }, 'Telegram'),
					E('a', { 'href': 'https://wa.me/?text=' + enc(title + ' ' + url),
						'target': '_blank', 'class': 'kiss-btn' }, 'WhatsApp'),
					E('a', { 'href': 'mailto:?subject=' + enc(title) + '&body=' + enc(url),
						'class': 'kiss-btn' }, 'Email')
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('a', { 'href': url, 'target': '_blank', 'class': 'kiss-btn kiss-btn-green' }, _('Visit Site')),
				' ',
				E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
