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
			E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('MetaBlogizer')),
				E('div', { 'class': 'cbi-map-descr' }, _('Static site publisher with HAProxy vhosts and SSL')),

				// One-Click Deploy Section
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('One-Click Deploy')),
					E('div', { 'class': 'cbi-section-descr' }, _('Upload HTML/ZIP to create a new static site with auto-configured SSL')),
					E('div', { 'style': 'display:flex; gap:1em; flex-wrap:wrap; align-items:flex-end' }, [
						E('div', { 'style': 'flex:1; min-width:150px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Site Name')),
							E('input', { 'type': 'text', 'id': 'deploy-name', 'class': 'cbi-input-text',
								'placeholder': 'myblog', 'style': 'width:100%' })
						]),
						E('div', { 'style': 'flex:2; min-width:200px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Domain')),
							E('input', { 'type': 'text', 'id': 'deploy-domain', 'class': 'cbi-input-text',
								'placeholder': 'blog.example.com', 'style': 'width:100%' })
						]),
						E('div', { 'style': 'flex:2; min-width:200px' }, [
							E('label', { 'style': 'display:block; margin-bottom:0.25em; font-weight:500' }, _('Content (HTML or ZIP)')),
							E('input', { 'type': 'file', 'id': 'deploy-file', 'accept': '.html,.htm,.zip',
								'style': 'width:100%' })
						]),
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'style': 'white-space:nowrap',
							'click': ui.createHandlerFn(this, 'handleOneClickDeploy')
						}, _('Deploy'))
					])
				]),

				// Sites Table
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Sites')),
					sites.length > 0 ?
						this.renderSitesTable(sites, exposureMap) :
						E('div', { 'class': 'cbi-section-descr' }, _('No sites configured'))
				])
			])
		], 'admin/services/metablogizer');
	},

	renderSitesTable: function(sites, exposureMap) {
		var self = this;

		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Site')),
				E('th', { 'class': 'th' }, _('Status')),
				E('th', { 'class': 'th' }, _('Exposure')),
				E('th', { 'class': 'th', 'style': 'text-align:center' }, _('Actions'))
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
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#d4edda; color:#155724'
			}, 'Running');
		} else {
			backendBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#f8d7da; color:#721c24'
			}, 'Stopped');
		}

		// Exposure badge
		var exposureBadge;
		if (exp.vhost_exists && exp.cert_status === 'valid') {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#d4edda; color:#155724',
				'title': 'SSL certificate valid'
			}, 'SSL OK');
		} else if (exp.vhost_exists && exp.cert_status === 'warning') {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#fff3cd; color:#856404',
				'title': 'Certificate expiring soon'
			}, 'SSL Warn');
		} else if (exp.vhost_exists) {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#f8d7da; color:#721c24',
				'title': exp.cert_status || 'No certificate'
			}, 'No SSL');
		} else {
			exposureBadge = E('span', {
				'style': 'display:inline-block; padding:2px 8px; border-radius:4px; font-size:0.85em; background:#e2e3e5; color:#383d41'
			}, 'Private');
		}

		// Auth badge
		var authBadge = '';
		if (exp.auth_required) {
			authBadge = E('span', {
				'style': 'display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.85em; background:#cce5ff; color:#004085; margin-left:4px'
			}, 'Auth');
		}

		// Domain link
		var domainEl;
		if (site.domain) {
			domainEl = E('a', {
				'href': 'https://' + site.domain,
				'target': '_blank',
				'style': 'color:#0066cc'
			}, site.domain);
		} else {
			domainEl = E('em', { 'style': 'color:#888' }, '-');
		}

		return E('tr', { 'class': 'tr' }, [
			// Site column
			E('td', { 'class': 'td' }, [
				E('strong', {}, site.name),
				E('br'),
				domainEl,
				site.port ? E('span', { 'style': 'color:#888; font-size:0.9em; margin-left:0.5em' }, ':' + site.port) : ''
			]),
			// Status column
			E('td', { 'class': 'td' }, [
				backendBadge,
				exp.has_content ? '' : E('span', {
					'style': 'display:inline-block; padding:2px 6px; border-radius:4px; font-size:0.85em; background:#fff3cd; color:#856404; margin-left:4px'
				}, 'Empty')
			]),
			// Exposure column
			E('td', { 'class': 'td' }, [
				exposureBadge,
				authBadge
			]),
			// Actions column
			E('td', { 'class': 'td', 'style': 'text-align:center; white-space:nowrap' }, [
				// Share button
				E('button', {
					'class': 'cbi-button',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Share / QR Code'),
					'click': ui.createHandlerFn(self, 'showShareModal', site)
				}, _('Share')),
				// Upload button
				E('button', {
					'class': 'cbi-button',
					'style': 'padding:0.25em 0.5em; margin:2px',
					'title': _('Upload content'),
					'click': ui.createHandlerFn(self, 'showUploadModal', site)
				}, _('Upload')),
				// Expose/Unpublish button
				exp.vhost_exists ?
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'style': 'padding:0.25em 0.5em; margin:2px',
						'title': _('Unpublish site'),
						'click': ui.createHandlerFn(self, 'handleUnpublish', site)
					}, _('Unpublish')) :
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'style': 'padding:0.25em 0.5em; margin:2px',
						'title': _('Expose with SSL'),
						'click': ui.createHandlerFn(self, 'handleEmancipate', site)
					}, _('Expose')),
				// Auth toggle button
				E('button', {
					'class': 'cbi-button',
					'style': 'padding:0.25em 0.5em; margin:2px; ' + (exp.auth_required ? 'background:#cce5ff' : ''),
					'title': exp.auth_required ? _('Authentication required - click to disable') : _('No authentication - click to enable'),
					'click': ui.createHandlerFn(self, 'handleToggleAuth', site, exp)
				}, exp.auth_required ? _('Unlock') : _('Lock')),
				// Delete button
				E('button', {
					'class': 'cbi-button cbi-button-remove',
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
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('File')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'file', 'id': 'upload-file-input' }),
						E('div', { 'class': 'cbi-value-description' }, _('HTML, CSS, JS, images, etc.'))
					])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Destination')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'text', 'id': 'upload-dest', 'class': 'cbi-input-text',
							'placeholder': 'index.html' }),
						E('div', { 'class': 'cbi-value-description' }, _('Leave empty to use original filename'))
					])
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive',
					'click': function() {
						var fileInput = document.getElementById('upload-file-input');
						var destInput = document.getElementById('upload-dest');
						var file = fileInput.files[0];

						if (!file) {
							ui.addNotification(null, E('p', _('Please select a file')), 'error');
							return;
						}

						var dest = destInput.value.trim() || file.name;

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
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-apply',
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
			'style': 'max-height:300px; overflow:auto; background:#f5f5f5; padding:10px; font-size:11px; white-space:pre-wrap'
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
			E('p', { 'style': 'color:#666' }, _('The site content will be preserved but the HAProxy vhost will be removed.')),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-remove',
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
			E('p', { 'style': 'color:#a00' }, _('This will remove the site, HAProxy vhost, and all files.')),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-remove',
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
						'class': 'cbi-input-text', 'style': 'flex:1' }),
					E('button', { 'class': 'cbi-button cbi-button-action', 'click': function() {
						if (navigator.clipboard) {
							navigator.clipboard.writeText(url).then(function() {
								ui.addNotification(null, E('p', _('URL copied')));
							});
						}
					}}, _('Copy'))
				]),
				E('div', { 'style': 'display:inline-block; padding:1em; background:#f8f8f8; border-radius:8px' }, [
					E('div', { 'innerHTML': qrSvg })
				]),
				E('div', { 'style': 'margin-top:1em; display:flex; gap:0.5em; justify-content:center; flex-wrap:wrap' }, [
					E('a', { 'href': 'https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(title),
						'target': '_blank', 'class': 'cbi-button' }, 'Twitter'),
					E('a', { 'href': 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title),
						'target': '_blank', 'class': 'cbi-button' }, 'Telegram'),
					E('a', { 'href': 'https://wa.me/?text=' + enc(title + ' ' + url),
						'target': '_blank', 'class': 'cbi-button' }, 'WhatsApp'),
					E('a', { 'href': 'mailto:?subject=' + enc(title) + '&body=' + enc(url),
						'class': 'cbi-button' }, 'Email')
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('a', { 'href': url, 'target': '_blank', 'class': 'cbi-button cbi-button-positive' }, _('Visit Site')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
