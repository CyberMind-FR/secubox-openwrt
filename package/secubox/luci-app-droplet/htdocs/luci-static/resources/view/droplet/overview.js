'use strict';
'require view';
'require rpc';
'require ui';
'require fs';

var callDropletStatus = rpc.declare({
    object: 'luci.droplet',
    method: 'status',
    expect: {}
});

var callDropletList = rpc.declare({
    object: 'luci.droplet',
    method: 'list',
    expect: { droplets: [] }
});

var callDropletUpload = rpc.declare({
    object: 'luci.droplet',
    method: 'upload',
    params: ['file', 'name', 'domain'],
    expect: {}
});

var callDropletRemove = rpc.declare({
    object: 'luci.droplet',
    method: 'remove',
    params: ['name'],
    expect: {}
});

return view.extend({
    load: function() {
        return Promise.all([
            callDropletStatus(),
            callDropletList()
        ]);
    },

    render: function(data) {
        var status = data[0] || {};
        var droplets = data[1] || [];

        var view = E('div', { 'class': 'cbi-map' }, [
            E('style', {}, `
                .droplet-container { max-width: 800px; margin: 0 auto; }
                .drop-zone {
                    border: 3px dashed #00d4ff;
                    border-radius: 16px;
                    padding: 60px 40px;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05));
                    transition: all 0.3s ease;
                    cursor: pointer;
                    margin-bottom: 20px;
                }
                .drop-zone:hover, .drop-zone.drag-over {
                    border-color: #7c3aed;
                    background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1));
                    transform: scale(1.02);
                }
                .drop-zone h2 { color: #00d4ff; margin: 0 0 10px; font-size: 1.5em; }
                .drop-zone p { color: #888; margin: 0; }
                .drop-zone input[type="file"] { display: none; }
                .publish-form {
                    display: none;
                    background: #1a1a24;
                    border: 1px solid #2a2a3e;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .publish-form.active { display: block; }
                .publish-form .field { margin-bottom: 15px; }
                .publish-form label { display: block; color: #888; margin-bottom: 5px; font-size: 0.9em; }
                .publish-form input[type="text"] {
                    width: 100%;
                    padding: 10px 15px;
                    background: #12121a;
                    border: 1px solid #2a2a3e;
                    border-radius: 8px;
                    color: #e0e0e0;
                    font-size: 1em;
                }
                .publish-form input:focus { outline: none; border-color: #00d4ff; }
                .publish-form .file-info {
                    background: #12121a;
                    padding: 10px 15px;
                    border-radius: 8px;
                    color: #00d4ff;
                    font-family: monospace;
                    margin-bottom: 15px;
                }
                .publish-form .buttons { display: flex; gap: 10px; }
                .btn-publish {
                    flex: 1;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #00d4ff, #7c3aed);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .btn-publish:hover { transform: translateY(-2px); }
                .btn-cancel {
                    padding: 12px 24px;
                    background: #2a2a3e;
                    border: none;
                    border-radius: 8px;
                    color: #888;
                    cursor: pointer;
                }
                .droplet-list { margin-top: 30px; }
                .droplet-list h3 { color: #e0e0e0; margin-bottom: 15px; }
                .droplet-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 15px;
                    background: #1a1a24;
                    border: 1px solid #2a2a3e;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .droplet-item:hover { border-color: #00d4ff; }
                .droplet-info { flex: 1; }
                .droplet-name { font-weight: 600; color: #e0e0e0; }
                .droplet-domain { font-size: 0.85em; color: #00d4ff; font-family: monospace; }
                .droplet-type {
                    font-size: 0.75em;
                    padding: 2px 8px;
                    background: rgba(124,58,237,0.2);
                    color: #7c3aed;
                    border-radius: 4px;
                    margin-left: 10px;
                }
                .droplet-actions button {
                    padding: 6px 12px;
                    background: #2a2a3e;
                    border: none;
                    border-radius: 4px;
                    color: #888;
                    cursor: pointer;
                    margin-left: 5px;
                }
                .droplet-actions button:hover { background: #3a3a4e; color: #e0e0e0; }
                .droplet-actions .btn-delete:hover { background: #ef4444; color: #fff; }
                .result-message {
                    display: none;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .result-message.success { display: block; background: rgba(16,185,129,0.1); border: 1px solid #10b981; color: #10b981; }
                .result-message.error { display: block; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #ef4444; }
                .result-message a { color: inherit; }
            `),

            E('div', { 'class': 'droplet-container' }, [
                E('h2', { 'style': 'color: #e0e0e0; margin-bottom: 20px;' }, [
                    E('span', { 'style': 'color: #00d4ff;' }, 'Droplet'),
                    ' Publisher'
                ]),

                E('div', { 'class': 'result-message', 'id': 'result-msg' }),

                E('div', { 'class': 'drop-zone', 'id': 'drop-zone' }, [
                    E('h2', {}, '📦 Drop to Publish'),
                    E('p', {}, 'Drop HTML file or ZIP archive here'),
                    E('p', { 'style': 'margin-top: 10px; font-size: 0.85em;' }, 'or click to browse'),
                    E('input', { 'type': 'file', 'id': 'file-input', 'accept': '.html,.htm,.zip' })
                ]),

                E('div', { 'class': 'publish-form', 'id': 'publish-form' }, [
                    E('div', { 'class': 'file-info', 'id': 'file-info' }, ''),
                    E('div', { 'class': 'field' }, [
                        E('label', {}, 'Site Name'),
                        E('input', { 'type': 'text', 'id': 'site-name', 'placeholder': 'mysite' })
                    ]),
                    E('div', { 'class': 'field' }, [
                        E('label', {}, 'Domain'),
                        E('input', { 'type': 'text', 'id': 'site-domain', 'value': status.default_domain || 'gk2.secubox.in', 'placeholder': 'gk2.secubox.in' })
                    ]),
                    E('div', { 'class': 'buttons' }, [
                        E('button', { 'class': 'btn-cancel', 'id': 'btn-cancel' }, 'Cancel'),
                        E('button', { 'class': 'btn-publish', 'id': 'btn-publish' }, '🚀 Publish')
                    ])
                ]),

                E('div', { 'class': 'droplet-list' }, [
                    E('h3', {}, 'Published Droplets (' + droplets.length + ')'),
                    E('div', { 'id': 'droplet-items' },
                        droplets.map(function(d) {
                            return E('div', { 'class': 'droplet-item', 'data-name': d.name }, [
                                E('div', { 'class': 'droplet-info' }, [
                                    E('span', { 'class': 'droplet-name' }, d.name),
                                    E('span', { 'class': 'droplet-type' }, d.type || 'static'),
                                    E('div', { 'class': 'droplet-domain' }, [
                                        E('a', { 'href': 'https://' + d.domain + '/', 'target': '_blank' }, d.domain)
                                    ])
                                ]),
                                E('div', { 'class': 'droplet-actions' }, [
                                    E('button', { 'class': 'btn-open', 'data-url': 'https://' + d.domain + '/' }, '🔗'),
                                    E('button', { 'class': 'btn-delete', 'data-name': d.name }, '🗑')
                                ])
                            ]);
                        })
                    )
                ])
            ])
        ]);

        // Event handlers
        var dropZone = view.querySelector('#drop-zone');
        var fileInput = view.querySelector('#file-input');
        var publishForm = view.querySelector('#publish-form');
        var fileInfo = view.querySelector('#file-info');
        var siteName = view.querySelector('#site-name');
        var siteDomain = view.querySelector('#site-domain');
        var btnPublish = view.querySelector('#btn-publish');
        var btnCancel = view.querySelector('#btn-cancel');
        var resultMsg = view.querySelector('#result-msg');
        var selectedFile = null;

        // Drag & drop
        dropZone.addEventListener('click', function() { fileInput.click(); });
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', function() {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', function() {
            if (fileInput.files.length) {
                handleFile(fileInput.files[0]);
            }
        });

        function handleFile(file) {
            selectedFile = file;
            fileInfo.textContent = '📄 ' + file.name + ' (' + formatSize(file.size) + ')';

            // Auto-generate name from filename
            var name = file.name.replace(/\.(html?|zip)$/i, '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            siteName.value = name;

            publishForm.classList.add('active');
            dropZone.style.display = 'none';
        }

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        btnCancel.addEventListener('click', function() {
            publishForm.classList.remove('active');
            dropZone.style.display = 'block';
            selectedFile = null;
            fileInput.value = '';
        });

        btnPublish.addEventListener('click', function() {
            if (!selectedFile || !siteName.value) {
                showResult('error', 'Please select a file and enter a name');
                return;
            }

            btnPublish.disabled = true;
            btnPublish.textContent = '⏳ Publishing...';

            // Upload file first
            var formData = new FormData();
            formData.append('sessionid', rpc.getSessionID());
            formData.append('filename', '/tmp/droplet-upload/' + selectedFile.name);
            formData.append('filedata', selectedFile);

            fetch('/cgi-bin/cgi-upload', {
                method: 'POST',
                body: formData
            })
            .then(function(res) { return res.json(); })
            .then(function(uploadRes) {
                if (uploadRes.size) {
                    // File uploaded, now publish
                    return callDropletUpload(selectedFile.name, siteName.value, siteDomain.value);
                } else {
                    throw new Error('Upload failed');
                }
            })
            .then(function(result) {
                if (result.success) {
                    showResult('success', '✅ Published! <a href="' + result.url + '" target="_blank">' + result.url + '</a>');
                    setTimeout(function() { location.reload(); }, 2000);
                } else {
                    showResult('error', '❌ ' + (result.error || 'Failed to publish'));
                }
            })
            .catch(function(err) {
                showResult('error', '❌ ' + err.message);
            })
            .finally(function() {
                btnPublish.disabled = false;
                btnPublish.textContent = '🚀 Publish';
            });
        });

        function showResult(type, msg) {
            resultMsg.className = 'result-message ' + type;
            resultMsg.innerHTML = msg;
        }

        // Delete buttons
        view.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var name = btn.dataset.name;
                if (confirm('Delete "' + name + '"?')) {
                    callDropletRemove(name).then(function() {
                        btn.closest('.droplet-item').remove();
                        showResult('success', 'Deleted: ' + name);
                    });
                }
            });
        });

        // Open buttons
        view.querySelectorAll('.btn-open').forEach(function(btn) {
            btn.addEventListener('click', function() {
                window.open(btn.dataset.url, '_blank');
            });
        });

        return view;
    },

    handleSaveApply: null,
    handleSave: null,
    handleReset: null
});
