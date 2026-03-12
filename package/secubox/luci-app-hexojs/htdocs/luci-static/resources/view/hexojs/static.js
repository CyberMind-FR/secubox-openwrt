'use strict';
'require view';
'require rpc';
'require ui';
'require form';
'require fs';
'require secubox/kiss-theme';

var callStaticList = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_list',
	params: ['instance'],
	expect: {}
});

var callStaticUpload = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_upload',
	params: ['instance', 'filename', 'content'],
	expect: {}
});

var callStaticCreate = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_create',
	params: ['name', 'domain'],
	expect: {}
});

var callStaticDelete = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_delete',
	params: ['name'],
	expect: {}
});

var callStaticPublish = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_publish',
	params: ['instance'],
	expect: {}
});

var callStaticDeleteFile = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_delete_file',
	params: ['instance', 'filename'],
	expect: {}
});

var callStaticConfigureAuth = rpc.declare({
	object: 'luci.hexojs',
	method: 'static_configure_auth',
	params: ['instance', 'enabled', 'domain'],
	expect: {}
});

function formatBytes(bytes) {
	if (bytes === 0) return '0 B';
	var k = 1024;
	var sizes = ['B', 'KB', 'MB', 'GB'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp) {
	if (!timestamp) return '-';
	var d = new Date(timestamp * 1000);
	return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	selectedInstance: null,

	load: function() {
		return callStaticList({});
	},

	renderStats: function(instances) {
		var c = KissTheme.colors;
		var totalFiles = instances.reduce(function(sum, inst) { return sum + (inst.file_count || 0); }, 0);
		var withAuth = instances.filter(function(inst) { return inst.auth_enabled; }).length;
		return [
			KissTheme.stat(instances.length, 'Sites', c.blue),
			KissTheme.stat(totalFiles, 'Files', c.cyan),
			KissTheme.stat(withAuth, 'Auth', c.green)
		];
	},

	renderInstanceCard: function(instance) {
		var self = this;
		return E('div', {
			'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px; margin-bottom: 12px;'
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 12px;' }, [
					E('strong', { 'style': 'font-size: 1.1em;' }, instance.name),
					instance.domain ? E('span', { 'style': 'color: var(--kiss-muted);' }, instance.domain) : '',
					instance.auth_enabled ? KissTheme.badge('Auth', 'green') : ''
				]),
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px; color: var(--kiss-muted); font-size: 12px;' }, [
					E('span', {}, instance.file_count + ' files'),
					instance.port > 0 ? E('span', {}, 'Port ' + instance.port) : ''
				])
			]),
			E('div', { 'style': 'display: flex; gap: 8px;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.showFiles(instance.name); }
				}, 'Manage Files'),
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.publishSite(instance.name); }
				}, 'Publish'),
				E('button', {
					'class': 'kiss-btn',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.configureAuth(instance.name, instance.domain); }
				}, 'Auth'),
				E('button', {
					'class': 'kiss-btn kiss-btn-red',
					'style': 'padding: 6px 12px; font-size: 12px;',
					'click': function() { self.deleteSite(instance.name); }
				}, 'Delete')
			])
		]);
	},

	showFiles: function(instanceName) {
		var self = this;

		callStaticList({ instance: instanceName }).then(function(result) {
			if (!result.success) {
				ui.addNotification(null, E('p', result.error || 'Failed to list files'), 'error');
				return;
			}

			self.selectedInstance = instanceName;
			var container = document.getElementById('file-list-container');
			container.innerHTML = '';

			// Header
			container.appendChild(E('h3', { 'style': 'margin: 0 0 16px 0;' }, 'Files in "' + instanceName + '"'));

			// Upload section
			var uploadSection = E('div', {
				'style': 'padding: 16px; background: var(--kiss-bg); border-radius: 8px; margin-bottom: 16px;'
			}, [
				E('h4', { 'style': 'margin: 0 0 12px 0; font-size: 14px;' }, 'Upload Files'),
				E('div', { 'style': 'display: flex; gap: 12px; align-items: center;' }, [
					E('input', {
						'type': 'file',
						'id': 'file-upload-input',
						'multiple': true,
						'style': 'color: var(--kiss-text);'
					}),
					E('button', {
						'class': 'kiss-btn kiss-btn-blue',
						'click': function() { self.uploadFiles(instanceName); }
					}, 'Upload Selected')
				])
			]);
			container.appendChild(uploadSection);

			// File list table
			var files = result.files || [];
			if (files.length === 0) {
				container.appendChild(E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
					'No files yet. Upload some files above.'));
			} else {
				var rows = files.map(function(file) {
					return E('tr', {}, [
						E('td', {}, file.name),
						E('td', { 'style': 'color: var(--kiss-muted);' }, formatBytes(file.size)),
						E('td', { 'style': 'color: var(--kiss-muted);' }, formatDate(file.modified)),
						E('td', { 'style': 'width: 100px;' }, [
							E('button', {
								'class': 'kiss-btn kiss-btn-red',
								'style': 'padding: 4px 10px; font-size: 11px;',
								'click': function() { self.deleteFile(instanceName, file.name); }
							}, 'Delete')
						])
					]);
				});

				container.appendChild(E('table', { 'class': 'kiss-table' }, [
					E('thead', {}, [
						E('tr', {}, [
							E('th', {}, 'Filename'),
							E('th', {}, 'Size'),
							E('th', {}, 'Modified'),
							E('th', {}, 'Actions')
						])
					]),
					E('tbody', {}, rows)
				]));
			}

			// Back button
			container.appendChild(E('button', {
				'class': 'kiss-btn',
				'style': 'margin-top: 16px;',
				'click': function() { self.refreshView(); }
			}, 'Back to Sites'));
		});
	},

	uploadFiles: function(instanceName) {
		var self = this;
		var input = document.getElementById('file-upload-input');
		var files = input.files;

		if (files.length === 0) {
			ui.addNotification(null, E('p', 'Please select files to upload'), 'warning');
			return;
		}

		var uploadPromises = [];

		for (var i = 0; i < files.length; i++) {
			(function(file) {
				var promise = new Promise(function(resolve, reject) {
					var reader = new FileReader();
					reader.onload = function(e) {
						var base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(e.target.result)));

						callStaticUpload({
							instance: instanceName,
							filename: file.name,
							content: base64
						}).then(function(result) {
							if (result.success) {
								resolve(file.name);
							} else {
								reject(result.error || 'Upload failed for ' + file.name);
							}
						}).catch(reject);
					};
					reader.onerror = function() {
						reject('Failed to read file: ' + file.name);
					};
					reader.readAsArrayBuffer(file);
				});
				uploadPromises.push(promise);
			})(files[i]);
		}

		Promise.all(uploadPromises).then(function(uploaded) {
			ui.addNotification(null, E('p', 'Uploaded ' + uploaded.length + ' file(s)'), 'success');
			self.showFiles(instanceName);
		}).catch(function(err) {
			ui.addNotification(null, E('p', 'Upload error: ' + err), 'error');
			self.showFiles(instanceName);
		});
	},

	deleteFile: function(instanceName, filename) {
		var self = this;

		if (!confirm('Delete file "' + filename + '"?')) return;

		callStaticDeleteFile({ instance: instanceName, filename: filename }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'File deleted'), 'success');
				self.showFiles(instanceName);
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to delete file'), 'error');
			}
		});
	},

	publishSite: function(instanceName) {
		callStaticPublish({ instance: instanceName }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Published to ' + result.url), 'success');
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to publish'), 'error');
			}
		});
	},

	configureAuth: function(instanceName, currentDomain) {
		var self = this;

		var domain = prompt('Enter domain for HAProxy auth (e.g., site.example.com):', currentDomain || '');
		if (domain === null) return;

		if (!domain) {
			ui.addNotification(null, E('p', 'Domain is required for HAProxy auth'), 'warning');
			return;
		}

		callStaticConfigureAuth({
			instance: instanceName,
			enabled: true,
			domain: domain
		}).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Auth configured for ' + domain), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to configure auth'), 'error');
			}
		});
	},

	deleteSite: function(instanceName) {
		var self = this;

		if (!confirm('Delete static site "' + instanceName + '" and all its files?')) return;

		callStaticDelete({ name: instanceName }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Site deleted'), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to delete site'), 'error');
			}
		});
	},

	createSite: function() {
		var self = this;

		var name = prompt('Enter site name (lowercase, no spaces):');
		if (!name) return;

		if (!/^[a-z][a-z0-9_]*$/.test(name)) {
			ui.addNotification(null, E('p', 'Invalid name. Use lowercase letters, numbers, underscore.'), 'error');
			return;
		}

		var domain = prompt('Enter domain (optional, e.g., site.example.com):');

		callStaticCreate({ name: name, domain: domain || '' }).then(function(result) {
			if (result.success) {
				ui.addNotification(null, E('p', 'Site "' + name + '" created on port ' + result.port), 'success');
				self.refreshView();
			} else {
				ui.addNotification(null, E('p', result.error || 'Failed to create site'), 'error');
			}
		});
	},

	refreshView: function() {
		var self = this;

		callStaticList({}).then(function(result) {
			var container = document.getElementById('file-list-container');
			container.innerHTML = '';

			var instancesContainer = document.getElementById('static-instances');
			instancesContainer.innerHTML = '';

			if (!result.success) {
				instancesContainer.appendChild(E('p', { 'style': 'color: var(--kiss-red);' }, result.error || 'Failed to load sites'));
				return;
			}

			var instances = result.instances || [];
			if (instances.length === 0) {
				instancesContainer.appendChild(E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
					'No static sites yet. Click "Create New Site" to get started.'));
			} else {
				instances.forEach(function(inst) {
					instancesContainer.appendChild(self.renderInstanceCard(inst));
				});
			}
		});
	},

	render: function(data) {
		var self = this;
		var instances = (data && data.instances) || [];

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'Static Sites'),
					KissTheme.badge(instances.length + ' Sites', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					'Upload and manage static HTML sites with optional Basic Auth via HAProxy. Fast KISS publishing without Hexo build process.')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(instances)),

			// Create button
			E('div', { 'style': 'margin: 20px 0;' }, [
				E('button', {
					'class': 'kiss-btn kiss-btn-green',
					'click': function() { self.createSite(); }
				}, 'Create New Site')
			]),

			// Instances container
			KissTheme.card('Sites', E('div', { 'id': 'static-instances' })),

			// File list container
			E('div', { 'id': 'file-list-container', 'style': 'margin-top: 20px;' })
		];

		// Render initial instances
		var instancesContainer = content[4].querySelector ? content[4].querySelector('#static-instances') : null;

		// Defer rendering after DOM is available
		setTimeout(function() {
			var el = document.getElementById('static-instances');
			if (el) {
				if (instances.length === 0) {
					el.appendChild(E('p', { 'style': 'color: var(--kiss-muted); text-align: center; padding: 20px;' },
						'No static sites yet. Click "Create New Site" to get started.'));
				} else {
					instances.forEach(function(inst) {
						el.appendChild(self.renderInstanceCard(inst));
					});
				}
			}
		}, 0);

		return KissTheme.wrap(content, 'admin/services/hexojs/static');
	}
});
