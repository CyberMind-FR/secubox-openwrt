'use strict';
'require view';
'require ui';
'require fs';
'require metablogizer.api as api';
'require metablogizer.qrcode as qrcode';
'require secubox/kiss-theme';

return view.extend({
	status: {},
	sites: [],
	hosting: {},
	uploadFiles: [],
	currentSite: null,

	load: function() {
		var self = this;
		return api.getDashboardData().then(function(data) {
			self.status = data.status || {};
			self.sites = data.sites || [];
			self.hosting = data.hosting || {};
		});
	},

	render: function() {
		var self = this;
		var status = this.status;
		var sites = this.sites;
		var hosting = this.hosting;

		// Load hosting status asynchronously after render
		api.getHostingStatus().then(function(h) {
			self.hosting = h || {};
			var haproxyEl = document.getElementById('haproxy-status');
			var ipEl = document.getElementById('public-ip');
			if (haproxyEl) {
				haproxyEl.innerHTML = '';
				haproxyEl.appendChild(h.haproxy_status === 'running' ?
					E('span', { 'style': 'color:#0a0' }, _('Running')) :
					E('span', { 'style': 'color:#a00' }, _('Stopped')));
			}
			if (ipEl) {
				ipEl.textContent = h.public_ip || '-';
			}
		}).catch(function() {});

		return KissTheme.wrap([
			E('div', { 'class': 'cbi-map' }, [
				E('h2', {}, _('MetaBlogizer')),
				E('div', { 'class': 'cbi-map-descr' }, _('Static site publisher with HAProxy vhosts and SSL')),

				// Status Section
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Status')),
					E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td', 'style': 'width:200px' }, _('Runtime')),
							E('td', { 'class': 'td' }, status.detected_runtime || 'uhttpd')
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, _('HAProxy')),
							E('td', { 'class': 'td', 'id': 'haproxy-status' }, E('em', {}, _('Loading...')))
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, _('Public IP')),
							E('td', { 'class': 'td', 'id': 'public-ip' }, _('Loading...'))
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, _('Sites')),
							E('td', { 'class': 'td' }, String(sites.length))
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td' }, _('Backends Running')),
							E('td', { 'class': 'td' }, String(sites.filter(function(s) { return s.backend_running; }).length) + ' / ' + sites.length)
						])
					]),
					E('div', { 'style': 'margin-top:1em' }, [
						E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': ui.createHandlerFn(this, 'handleSyncConfig')
						}, _('Sync Config')),
						' ',
						E('span', { 'class': 'cbi-value-description' }, _('Update port/runtime info for all sites'))
					])
				]),

				// Sites Section
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Sites')),
					sites.length > 0 ? this.renderSitesTable(sites) : E('div', { 'class': 'cbi-section-descr' }, _('No sites configured'))
				]),

				// Create Site Section
				E('div', { 'class': 'cbi-section' }, [
					E('h3', {}, _('Create Site')),
					E('div', { 'class': 'cbi-section-descr' }, _('Add a new static site with auto-configured HAProxy vhost and SSL')),

					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Site Name')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('input', { 'type': 'text', 'id': 'new-site-name', 'class': 'cbi-input-text',
								'placeholder': 'myblog' }),
							E('div', { 'class': 'cbi-value-description' }, _('Lowercase letters, numbers, and hyphens only'))
						])
					]),

					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Domain')),
						E('div', { 'class': 'cbi-value-field' },
							E('input', { 'type': 'text', 'id': 'new-site-domain', 'class': 'cbi-input-text',
								'placeholder': 'blog.example.com' }))
					]),

					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Gitea Repository')),
						E('div', { 'class': 'cbi-value-field' }, [
							E('input', { 'type': 'text', 'id': 'new-site-gitea', 'class': 'cbi-input-text',
								'placeholder': 'user/repo' }),
							E('div', { 'class': 'cbi-value-description' }, _('Optional: Sync content from Gitea'))
						])
					]),

					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('Description')),
						E('div', { 'class': 'cbi-value-field' },
							E('input', { 'type': 'text', 'id': 'new-site-desc', 'class': 'cbi-input-text',
								'placeholder': 'Short description (optional)' }))
					]),

					E('div', { 'class': 'cbi-value' }, [
						E('label', { 'class': 'cbi-value-title' }, _('HTTPS')),
						E('div', { 'class': 'cbi-value-field' },
							E('select', { 'id': 'new-site-ssl', 'class': 'cbi-input-select' }, [
								E('option', { 'value': '1', 'selected': true }, _('Enabled (ACME)')),
								E('option', { 'value': '0' }, _('Disabled'))
							]))
					]),

					E('div', { 'class': 'cbi-page-actions' },
						E('button', {
							'class': 'cbi-button cbi-button-positive',
							'click': ui.createHandlerFn(this, 'handleCreateSite')
						}, _('Create Site')))
				]),

				// Hosting Status Section
				this.renderHostingSection(hosting)
			])
		], 'admin/services/metablogizer');
	},

	renderSitesTable: function(sites) {
		var self = this;
		return E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Name')),
				E('th', { 'class': 'th' }, _('Domain')),
				E('th', { 'class': 'th' }, _('Port')),
				E('th', { 'class': 'th' }, _('Backend')),
				E('th', { 'class': 'th' }, _('Content')),
				E('th', { 'class': 'th' }, _('Actions'))
			])
		].concat(sites.map(function(site) {
			var backendStatus = site.backend_running ?
				E('span', { 'style': 'color:#0a0' }, _('Running')) :
				E('span', { 'style': 'color:#a00' }, _('Stopped'));
			var contentStatus = site.has_content ?
				E('span', { 'style': 'color:#0a0' }, _('OK')) :
				E('span', { 'style': 'color:#888' }, _('Empty'));

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, [
					E('strong', {}, site.name),
					site.runtime ? E('br') : '',
					site.runtime ? E('small', { 'style': 'color:#888' }, site.runtime) : ''
				]),
				E('td', { 'class': 'td' }, site.domain ?
					E('a', { 'href': site.url || ('https://' + site.domain), 'target': '_blank' }, site.domain) :
					E('em', {}, '-')),
				E('td', { 'class': 'td' }, site.port ? String(site.port) : '-'),
				E('td', { 'class': 'td' }, backendStatus),
				E('td', { 'class': 'td' }, contentStatus),
				E('td', { 'class': 'td' }, [
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(self, 'showShareModal', site),
						'title': _('Share')
					}, _('Share')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(self, 'showUploadModal', site),
						'title': _('Upload')
					}, _('Upload')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(self, 'showFilesModal', site),
						'title': _('Files')
					}, _('Files')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(self, 'showEditModal', site),
						'title': _('Edit')
					}, _('Edit')),
					' ',
					site.gitea_repo ? E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(self, 'handleSync', site),
						'title': _('Sync')
					}, _('Sync')) : '',
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-apply',
						'click': ui.createHandlerFn(self, 'handleEmancipate', site),
						'title': _('KISS ULTIME MODE: DNS + SSL + Mesh')
					}, site.emancipated ? '✓' : _('Emancipate')),
					' ',
					E('button', {
						'class': 'cbi-button cbi-button-remove',
						'click': ui.createHandlerFn(self, 'handleDelete', site),
						'title': _('Delete')
					}, _('Delete'))
				])
			]);
		})));
	},

	renderHostingSection: function(hosting) {
		var hostingSites = hosting.sites || [];
		if (hostingSites.length === 0) return E('div');

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Hosting Status')),
			E('div', { 'class': 'cbi-section-descr' }, _('DNS, SSL certificates, and publish status for each site')),
			E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Site')),
					E('th', { 'class': 'th' }, _('DNS')),
					E('th', { 'class': 'th' }, _('IP')),
					E('th', { 'class': 'th' }, _('Certificate')),
					E('th', { 'class': 'th' }, _('Status'))
				])
			].concat(hostingSites.map(function(site) {
				return E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, E('strong', {}, site.name)),
					E('td', { 'class': 'td' }, site.dns_status === 'ok' ?
						E('span', { 'style': 'color:#0a0' }, 'OK') :
						E('span', { 'style': 'color:#a00' }, site.dns_status || 'unknown')),
					E('td', { 'class': 'td' }, site.dns_ip || '-'),
					E('td', { 'class': 'td' }, site.cert_status === 'ok' ?
						E('span', { 'style': 'color:#0a0' }, (site.cert_days || 0) + 'd') :
						E('span', { 'style': 'color:#a00' }, site.cert_status || 'missing')),
					E('td', { 'class': 'td' }, site.publish_status === 'published' ?
						E('span', { 'style': 'color:#0a0' }, _('Published')) :
						E('span', { 'style': 'color:#888' }, site.publish_status || 'pending'))
				]);
			})))
		]);
	},

	handleCreateSite: function() {
		var self = this;
		var name = document.getElementById('new-site-name').value.trim();
		var domain = document.getElementById('new-site-domain').value.trim();
		var gitea = document.getElementById('new-site-gitea').value.trim();
		var desc = document.getElementById('new-site-desc').value.trim();
		var ssl = document.getElementById('new-site-ssl').value;

		if (!name) {
			ui.addNotification(null, E('p', _('Site name is required')), 'error');
			return;
		}
		if (!domain) {
			ui.addNotification(null, E('p', _('Domain is required')), 'error');
			return;
		}
		if (!/^[a-z0-9-]+$/.test(name)) {
			ui.addNotification(null, E('p', _('Invalid name format: use lowercase letters, numbers, and hyphens')), 'error');
			return;
		}

		ui.showModal(_('Creating Site'), [
			E('p', { 'class': 'spinning' }, _('Setting up site and HAProxy vhost...'))
		]);

		api.createSite(name, domain, gitea, ssl, desc).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', _('Site created successfully')));
				self.showShareModal({ name: r.name || name, domain: r.domain || domain, url: r.url });
				setTimeout(function() { window.location.reload(); }, 500);
			} else {
				ui.addNotification(null, E('p', _('Failed: ') + (r.error || 'Unknown error')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	showEditModal: function(site) {
		var self = this;
		ui.showModal(_('Edit Site: ') + site.name, [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Domain')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'edit-site-domain', 'class': 'cbi-input-text',
							'value': site.domain || '' }))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Gitea Repository')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'edit-site-gitea', 'class': 'cbi-input-text',
							'value': site.gitea_repo || '', 'placeholder': 'user/repo' }))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Description')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'text', 'id': 'edit-site-desc', 'class': 'cbi-input-text',
							'value': site.description || '' }))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('HTTPS')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'edit-site-ssl', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1', 'selected': site.ssl !== false }, _('Enabled')),
							E('option', { 'value': '0', 'selected': site.ssl === false }, _('Disabled'))
						]))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Enabled')),
					E('div', { 'class': 'cbi-value-field' },
						E('select', { 'id': 'edit-site-enabled', 'class': 'cbi-input-select' }, [
							E('option', { 'value': '1', 'selected': site.enabled !== false }, _('Yes')),
							E('option', { 'value': '0', 'selected': site.enabled === false }, _('No'))
						]))
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': function() {
					var domain = document.getElementById('edit-site-domain').value.trim();
					var gitea = document.getElementById('edit-site-gitea').value.trim();
					var desc = document.getElementById('edit-site-desc').value.trim();
					var ssl = document.getElementById('edit-site-ssl').value;
					var enabled = document.getElementById('edit-site-enabled').value;

					if (!domain) {
						ui.addNotification(null, E('p', _('Domain required')), 'error');
						return;
					}

					ui.hideModal();
					ui.showModal(_('Saving'), [E('p', { 'class': 'spinning' }, _('Updating site...'))]);

					api.updateSite(site.id, site.name, domain, gitea, ssl, enabled, desc).then(function(r) {
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
				}}, _('Save'))
			])
		]);
	},

	showUploadModal: function(site) {
		var self = this;
		this.uploadFiles = [];
		this.currentSite = site;

		var fileList = E('div', { 'id': 'upload-file-list', 'style': 'margin:1em 0; max-height:200px; overflow-y:auto' });

		ui.showModal(_('Upload to: ') + site.name, [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Files')),
					E('div', { 'class': 'cbi-value-field' }, [
						E('input', { 'type': 'file', 'id': 'upload-file-input', 'multiple': true,
							'change': function(e) { self.handleFileSelect(e, fileList); } }),
						E('div', { 'class': 'cbi-value-description' }, _('Select HTML, CSS, JS, images, etc.'))
					])
				]),
				fileList,
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Set first HTML as index')),
					E('div', { 'class': 'cbi-value-field' },
						E('input', { 'type': 'checkbox', 'id': 'upload-as-index', 'checked': true }))
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, ''),
					E('div', { 'class': 'cbi-value-field cbi-value-description' },
						_('After upload, use Ctrl+Shift+R to refresh cached pages'))
				])
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', { 'class': 'cbi-button cbi-button-positive', 'click': ui.createHandlerFn(this, 'handleUpload') }, _('Upload'))
			])
		]);
	},

	handleFileSelect: function(e, listEl) {
		var files = e.target.files;
		for (var i = 0; i < files.length; i++) {
			this.uploadFiles.push(files[i]);
		}
		this.updateFileList(listEl);
	},

	updateFileList: function(listEl) {
		var self = this;
		listEl.innerHTML = '';
		if (this.uploadFiles.length === 0) return;

		this.uploadFiles.forEach(function(f, i) {
			var row = E('div', { 'style': 'display:flex; align-items:center; gap:0.5em; margin:0.25em 0; padding:0.25em; background:#f8f8f8; border-radius:4px' }, [
				E('span', { 'style': 'flex:1' }, f.name),
				E('span', { 'style': 'color:#888; font-size:0.9em' }, self.formatSize(f.size)),
				E('button', { 'class': 'cbi-button cbi-button-remove', 'style': 'padding:0.25em 0.5em',
					'click': function() { self.uploadFiles.splice(i, 1); self.updateFileList(listEl); } }, 'X')
			]);
			listEl.appendChild(row);
		});
	},

	handleUpload: function() {
		var self = this;
		if (!this.uploadFiles.length) {
			ui.addNotification(null, E('p', _('No files selected')), 'error');
			return;
		}

		var site = this.currentSite;
		var asIndex = document.getElementById('upload-as-index').checked;
		var firstHtml = null;

		if (asIndex) {
			for (var i = 0; i < this.uploadFiles.length; i++) {
				if (this.uploadFiles[i].name.endsWith('.html')) {
					firstHtml = this.uploadFiles[i];
					break;
				}
			}
		}

		ui.hideModal();
		ui.showModal(_('Uploading'), [E('p', { 'class': 'spinning' }, _('Uploading files...'))]);

		// Process files sequentially to avoid RPC batch conflicts
		var uploadSequential = function(files, idx, results) {
			if (idx >= files.length) {
				return Promise.resolve(results);
			}

			var f = files[idx];
			return new Promise(function(resolve) {
				var reader = new FileReader();
				reader.onload = function(e) {
					// Convert ArrayBuffer to base64
					var bytes = new Uint8Array(e.target.result);
					var chunks = [];
					for (var i = 0; i < bytes.length; i += 8192) {
						chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + 8192)));
					}
					var content = btoa(chunks.join(''));

					var dest = (asIndex && f === firstHtml) ? 'index.html' : f.name;

					// Use chunked upload for files > 40KB (uhttpd has 64KB JSON body limit)
					var uploadFn;
					if (content.length > 40000) {
						uploadFn = api.chunkedUpload(site.id, dest, content);
					} else {
						uploadFn = api.uploadFile(site.id, dest, content);
					}

					uploadFn
						.then(function(r) {
							results.push({ ok: r && r.success, name: f.name });
							resolve();
						})
						.catch(function() {
							results.push({ ok: false, name: f.name });
							resolve();
						});
				};
				reader.onerror = function() {
					results.push({ ok: false, name: f.name });
					resolve();
				};
				reader.readAsArrayBuffer(f);
			}).then(function() {
				return uploadSequential(files, idx + 1, results);
			});
		};

		uploadSequential(this.uploadFiles, 0, []).then(function(results) {
			ui.hideModal();
			var ok = results.filter(function(r) { return r.ok; }).length;
			var failed = results.length - ok;
			if (failed > 0) {
				ui.addNotification(null, E('p', ok + _(' file(s) uploaded, ') + failed + _(' failed')), 'warning');
			} else {
				ui.addNotification(null, E('p', ok + _(' file(s) uploaded successfully')));
			}
			self.uploadFiles = [];
		});
	},

	showFilesModal: function(site) {
		var self = this;
		this.currentSite = site;
		var sitesRoot = '/srv/metablogizer/sites';

		ui.showModal(_('Files: ') + site.name, [
			E('div', { 'id': 'files-list' }, [
				E('p', { 'class': 'spinning' }, _('Loading files...'))
			]),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
			])
		]);

		fs.list(sitesRoot + '/' + site.name).then(function(files) {
			var container = document.getElementById('files-list');
			container.innerHTML = '';

			if (!files || !files.length) {
				container.appendChild(E('p', { 'style': 'color:#888' }, _('No files')));
				return;
			}

			var table = E('table', { 'class': 'table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('File')),
					E('th', { 'class': 'th' }, _('Size')),
					E('th', { 'class': 'th' }, _('Actions'))
				])
			]);

			files.forEach(function(f) {
				if (f.type !== 'file') return;
				var isIndex = f.name === 'index.html';
				table.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td' }, [
						isIndex ? E('strong', {}, f.name + ' (homepage)') : f.name
					]),
					E('td', { 'class': 'td' }, self.formatSize(f.size)),
					E('td', { 'class': 'td' }, [
						(!isIndex && f.name.endsWith('.html')) ? E('button', {
							'class': 'cbi-button cbi-button-action',
							'click': function() { self.setAsHomepage(site, f.name); }
						}, _('Set as Homepage')) : '',
						' ',
						E('button', {
							'class': 'cbi-button cbi-button-remove',
							'click': function() { self.deleteFile(site, f.name); }
						}, _('Delete'))
					])
				]));
			});

			container.appendChild(table);
		}).catch(function(e) {
			var container = document.getElementById('files-list');
			container.innerHTML = '';
			container.appendChild(E('p', { 'style': 'color:#a00' }, _('Error: ') + e.message));
		});
	},

	setAsHomepage: function(site, filename) {
		var sitesRoot = '/srv/metablogizer/sites';
		var path = sitesRoot + '/' + site.name;

		ui.showModal(_('Setting Homepage'), [E('p', { 'class': 'spinning' }, _('Renaming...'))]);

		fs.read(path + '/' + filename).then(function(content) {
			return fs.write(path + '/index.html', content);
		}).then(function() {
			return fs.remove(path + '/' + filename);
		}).then(function() {
			ui.hideModal();
			ui.addNotification(null, E('p', filename + _(' set as homepage')));
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	deleteFile: function(site, filename) {
		var self = this;
		var sitesRoot = '/srv/metablogizer/sites';

		if (!confirm(_('Delete ') + filename + '?')) return;

		fs.remove(sitesRoot + '/' + site.name + '/' + filename).then(function() {
			ui.addNotification(null, E('p', _('File deleted')));
			self.showFilesModal(site);
		}).catch(function(e) {
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	showShareModal: function(site) {
		var self = this;
		var url = site.url || ('https://' + site.domain);
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
				E('div', { 'class': 'cbi-value', 'style': 'display:flex; gap:0.5em; margin-bottom:1em' }, [
					E('input', { 'type': 'text', 'readonly': true, 'value': url, 'id': 'share-url',
						'class': 'cbi-input-text', 'style': 'flex:1' }),
					E('button', { 'class': 'cbi-button cbi-button-action', 'click': function() {
						self.copyToClipboard(url);
					}}, _('Copy'))
				]),
				E('div', { 'style': 'display:inline-block; padding:1em; background:#f8f8f8; border-radius:8px; margin:1em 0' }, [
					E('div', { 'innerHTML': qrSvg })
				]),
				E('div', { 'style': 'margin-top:1em' }, [
					E('p', { 'style': 'margin-bottom:0.5em' }, _('Share on:')),
					E('div', { 'style': 'display:flex; gap:0.5em; justify-content:center; flex-wrap:wrap' }, [
						E('a', { 'href': 'https://twitter.com/intent/tweet?url=' + enc(url) + '&text=' + enc(title),
							'target': '_blank', 'class': 'cbi-button cbi-button-action' }, 'Twitter'),
						E('a', { 'href': 'https://www.linkedin.com/sharing/share-offsite/?url=' + enc(url),
							'target': '_blank', 'class': 'cbi-button cbi-button-action' }, 'LinkedIn'),
						E('a', { 'href': 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(title),
							'target': '_blank', 'class': 'cbi-button cbi-button-action' }, 'Telegram'),
						E('a', { 'href': 'https://wa.me/?text=' + enc(title + ' ' + url),
							'target': '_blank', 'class': 'cbi-button cbi-button-action' }, 'WhatsApp'),
						E('a', { 'href': 'mailto:?subject=' + enc(title) + '&body=' + enc(url),
							'class': 'cbi-button cbi-button-action' }, 'Email')
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('a', { 'href': url, 'target': '_blank', 'class': 'cbi-button cbi-button-positive',
					'style': 'text-decoration:none' }, _('Visit Site')),
				' ',
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
			])
		]);
	},

	handleSync: function(site) {
		ui.showModal(_('Syncing'), [E('p', { 'class': 'spinning' }, _('Pulling from Gitea...'))]);

		api.syncSite(site.id).then(function(r) {
			ui.hideModal();
			if (r.success) {
				ui.addNotification(null, E('p', _('Site synced successfully')));
			} else {
				ui.addNotification(null, E('p', _('Sync failed: ') + (r.error || 'Unknown')), 'error');
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
				E('button', { 'class': 'cbi-button cbi-button-remove', 'click': function() {
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
				}}, _('Delete'))
			])
		]);
	},

	handleEmancipate: function(site) {
		var self = this;
		ui.showModal(_('Emancipate Site'), [
			E('p', {}, _('KISS ULTIME MODE will configure:')),
			E('ul', {}, [
				E('li', {}, _('DNS registration (Gandi/OVH)')),
				E('li', {}, _('Vortex DNS mesh publication')),
				E('li', {}, _('HAProxy vhost with SSL')),
				E('li', {}, _('ACME certificate issuance'))
			]),
			E('p', { 'style': 'margin-top:1em' }, _('Emancipate "') + site.name + '" (' + site.domain + ')?'),
			E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Cancel')),
				' ',
				E('button', { 'class': 'cbi-button cbi-button-apply', 'click': function() {
					ui.hideModal();
					self.runEmancipateAsync(site);
				}}, _('Emancipate'))
			])
		]);
	},

	runEmancipateAsync: function(site) {
		var self = this;
		var outputPre = E('pre', { 'style': 'max-height:300px;overflow:auto;background:#f5f5f5;padding:10px;font-size:11px;white-space:pre-wrap' }, _('Starting...'));

		ui.showModal(_('Emancipating'), [
			E('p', { 'class': 'spinning' }, _('Running KISS ULTIME MODE workflow...')),
			outputPre
		]);

		api.emancipate(site.id).then(function(r) {
			if (!r.success) {
				ui.hideModal();
				ui.showModal(_('Emancipation Failed'), [
					E('p', { 'style': 'color:#a00' }, r.error || _('Failed to start')),
					E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
						E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
					])
				]);
				return;
			}

			// Poll for completion
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
							ui.showModal(_('Emancipation Complete'), [
								E('p', { 'style': 'color:#0a0' }, _('Site emancipated successfully!')),
								E('pre', { 'style': 'max-height:300px;overflow:auto;background:#f5f5f5;padding:10px;font-size:11px;white-space:pre-wrap' }, status.output || ''),
								E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
									E('button', { 'class': 'cbi-button cbi-button-action', 'click': function() {
										ui.hideModal();
										window.location.reload();
									}}, _('OK'))
								])
							]);
						} else {
							ui.showModal(_('Emancipation Failed'), [
								E('p', { 'style': 'color:#a00' }, _('Workflow failed')),
								E('pre', { 'style': 'max-height:200px;overflow:auto;background:#fee;padding:10px;font-size:11px;white-space:pre-wrap' }, status.output || ''),
								E('div', { 'class': 'right', 'style': 'margin-top:1em' }, [
									E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, _('Close'))
								])
							]);
						}
					}
				}).catch(function(e) {
					clearInterval(pollInterval);
					ui.hideModal();
					ui.addNotification(null, E('p', _('Poll error: ') + e.message), 'error');
				});
			}, 2000); // Poll every 2 seconds
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	copyToClipboard: function(text) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(function() {
				ui.addNotification(null, E('p', _('URL copied to clipboard')));
			});
		} else {
			var input = document.getElementById('share-url');
			if (input) {
				input.select();
				document.execCommand('copy');
				ui.addNotification(null, E('p', _('URL copied to clipboard')));
			}
		}
	},

	handleSyncConfig: function() {
		ui.showModal(_('Syncing Configuration'), [
			E('p', { 'class': 'spinning' }, _('Updating port and runtime info for all sites...'))
		]);

		api.syncConfig().then(function(r) {
			ui.hideModal();
			if (r.success) {
				var msg = _('Configuration synced');
				if (r.fixed > 0) {
					msg += ' (' + r.fixed + _(' entries updated)');
				}
				ui.addNotification(null, E('p', msg));
				window.location.reload();
			} else {
				ui.addNotification(null, E('p', _('Sync failed: ') + (r.error || 'Unknown')), 'error');
			}
		}).catch(function(e) {
			ui.hideModal();
			ui.addNotification(null, E('p', _('Error: ') + e.message), 'error');
		});
	},

	formatSize: function(bytes) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / 1048576).toFixed(1) + ' MB';
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
