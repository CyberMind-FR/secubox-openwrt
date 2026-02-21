'use strict';
'require view';
'require ui';
'require rpc';
'require form';

// User submission RPC calls
var callSubmitContent = rpc.declare({
    object: 'luci.hexojs',
    method: 'submit_for_review',
    params: ['title', 'content', 'category', 'author', 'email'],
    expect: { '': {} }
});

var callListPending = rpc.declare({
    object: 'luci.hexojs',
    method: 'list_pending',
    expect: { '': {} }
});

var callApproveSubmission = rpc.declare({
    object: 'luci.hexojs',
    method: 'approve_submission',
    params: ['submission_id', 'publish_target'],
    expect: { '': {} }
});

var callRejectSubmission = rpc.declare({
    object: 'luci.hexojs',
    method: 'reject_submission',
    params: ['submission_id', 'reason'],
    expect: { '': {} }
});

var callGetSubmission = rpc.declare({
    object: 'luci.hexojs',
    method: 'get_submission',
    params: ['submission_id'],
    expect: { '': {} }
});

return view.extend({
    load: function() {
        return Promise.all([
            callListPending()
        ]);
    },

    render: function(data) {
        var self = this;
        var pendingList = (data[0] && data[0].submissions) || [];
        var isAdmin = (data[0] && data[0].is_admin) || false;

        var content = E('div', { class: 'cbi-map', style: 'max-width:900px;margin:0 auto;' }, [
            E('h2', { style: 'text-align:center;margin-bottom:30px;' }, [
                E('span', { style: 'font-size:1.2em;' }, '📝 '),
                isAdmin ? 'Content Moderation' : 'Submit Content'
            ]),

            // Tab navigation
            E('div', { style: 'display:flex;gap:10px;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:10px;' }, [
                E('button', {
                    id: 'tab-submit',
                    class: 'cbi-button cbi-button-action',
                    click: function() { self.showTab('submit'); }
                }, '📤 Submit'),
                isAdmin ? E('button', {
                    id: 'tab-moderate',
                    class: 'cbi-button',
                    click: function() { self.showTab('moderate'); }
                }, '⚖️ Moderate (' + pendingList.length + ')') : E('span'),
                E('button', {
                    id: 'tab-status',
                    class: 'cbi-button',
                    click: function() { self.showTab('status'); }
                }, '📊 My Submissions')
            ]),

            // Submit Tab
            E('div', { id: 'panel-submit', class: 'cbi-section' }, [
                E('div', { class: 'cbi-section-descr', style: 'margin-bottom:20px;' },
                    'Submit your content for review. Once approved by moderators, it will be published to the public portal.'),

                E('div', { style: 'background:#1a1a2e;border-radius:12px;padding:25px;' }, [
                    // Author Info
                    E('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;' }, [
                        E('div', {}, [
                            E('label', { style: 'display:block;margin-bottom:5px;color:#888;' }, 'Author Name *'),
                            E('input', {
                                type: 'text',
                                id: 'submit-author',
                                style: 'width:100%;padding:12px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;',
                                placeholder: 'Your name'
                            })
                        ]),
                        E('div', {}, [
                            E('label', { style: 'display:block;margin-bottom:5px;color:#888;' }, 'Email (optional)'),
                            E('input', {
                                type: 'email',
                                id: 'submit-email',
                                style: 'width:100%;padding:12px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;',
                                placeholder: 'your@email.com'
                            })
                        ])
                    ]),

                    // Title
                    E('div', { style: 'margin-bottom:20px;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;color:#888;' }, 'Title *'),
                        E('input', {
                            type: 'text',
                            id: 'submit-title',
                            style: 'width:100%;padding:12px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;',
                            placeholder: 'Article title'
                        })
                    ]),

                    // Category
                    E('div', { style: 'margin-bottom:20px;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;color:#888;' }, 'Category'),
                        E('select', {
                            id: 'submit-category',
                            style: 'width:100%;padding:12px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;'
                        }, [
                            E('option', { value: 'general' }, 'General'),
                            E('option', { value: 'news' }, 'News'),
                            E('option', { value: 'tutorial' }, 'Tutorial'),
                            E('option', { value: 'opinion' }, 'Opinion'),
                            E('option', { value: 'tech' }, 'Technology'),
                            E('option', { value: 'community' }, 'Community')
                        ])
                    ]),

                    // Content
                    E('div', { style: 'margin-bottom:20px;' }, [
                        E('label', { style: 'display:block;margin-bottom:5px;color:#888;' }, 'Content * (Markdown supported)'),
                        E('textarea', {
                            id: 'submit-content',
                            style: 'width:100%;height:300px;padding:12px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;font-family:monospace;resize:vertical;',
                            placeholder: '# Your Article\n\nWrite your content here using **Markdown** formatting...'
                        })
                    ]),

                    // Submit Button
                    E('div', { style: 'text-align:center;' }, [
                        E('button', {
                            class: 'cbi-button cbi-button-positive',
                            style: 'padding:15px 40px;font-size:1.1em;',
                            click: ui.createHandlerFn(this, 'submitContent')
                        }, '📤 Submit for Review')
                    ])
                ])
            ]),

            // Moderate Tab (Admin only)
            isAdmin ? E('div', { id: 'panel-moderate', class: 'cbi-section', style: 'display:none;' }, [
                E('div', { class: 'cbi-section-descr', style: 'margin-bottom:20px;' },
                    'Review and moderate user submissions. Approve to publish or reject with feedback.'),

                pendingList.length === 0 ?
                    E('div', { style: 'text-align:center;padding:40px;color:#888;' }, [
                        E('div', { style: 'font-size:3em;margin-bottom:10px;' }, '✨'),
                        E('p', {}, 'No pending submissions')
                    ]) :
                    E('div', { id: 'pending-list' }, pendingList.map(function(sub) {
                        return E('div', {
                            class: 'cbi-section',
                            style: 'background:#1a1a2e;border-radius:12px;padding:20px;margin-bottom:15px;border-left:4px solid #f39c12;',
                            'data-id': sub.id
                        }, [
                            E('div', { style: 'display:flex;justify-content:space-between;align-items:start;' }, [
                                E('div', {}, [
                                    E('h4', { style: 'margin:0 0 10px 0;' }, sub.title),
                                    E('div', { style: 'color:#888;font-size:0.9em;' }, [
                                        E('span', {}, '👤 ' + sub.author),
                                        E('span', { style: 'margin-left:15px;' }, '📁 ' + sub.category),
                                        E('span', { style: 'margin-left:15px;' }, '📅 ' + sub.date)
                                    ])
                                ]),
                                E('div', { style: 'display:flex;gap:10px;' }, [
                                    E('button', {
                                        class: 'cbi-button cbi-button-action',
                                        click: ui.createHandlerFn(self, 'previewSubmission', sub.id)
                                    }, '👁️ Preview'),
                                    E('button', {
                                        class: 'cbi-button cbi-button-positive',
                                        click: ui.createHandlerFn(self, 'approveSubmission', sub.id)
                                    }, '✅ Approve'),
                                    E('button', {
                                        class: 'cbi-button cbi-button-negative',
                                        click: ui.createHandlerFn(self, 'rejectSubmission', sub.id)
                                    }, '❌ Reject')
                                ])
                            ]),
                            E('div', {
                                class: 'submission-preview',
                                style: 'display:none;margin-top:15px;padding:15px;background:#16213e;border-radius:8px;max-height:300px;overflow-y:auto;'
                            })
                        ]);
                    }))
            ]) : E('div'),

            // Status Tab
            E('div', { id: 'panel-status', class: 'cbi-section', style: 'display:none;' }, [
                E('div', { class: 'cbi-section-descr', style: 'margin-bottom:20px;' },
                    'Track the status of your submitted content.'),

                E('div', { id: 'my-submissions', style: 'text-align:center;padding:40px;color:#888;' }, [
                    E('div', { style: 'font-size:3em;margin-bottom:10px;' }, '📋'),
                    E('p', {}, 'Enter your email to check submission status'),
                    E('div', { style: 'max-width:400px;margin:20px auto;' }, [
                        E('input', {
                            type: 'email',
                            id: 'status-email',
                            style: 'width:70%;padding:10px;border-radius:8px 0 0 8px;border:1px solid #444;background:#16213e;color:#fff;',
                            placeholder: 'your@email.com'
                        }),
                        E('button', {
                            class: 'cbi-button cbi-button-action',
                            style: 'border-radius:0 8px 8px 0;',
                            click: ui.createHandlerFn(this, 'checkStatus')
                        }, 'Check')
                    ])
                ])
            ])
        ]);

        return content;
    },

    showTab: function(tab) {
        ['submit', 'moderate', 'status'].forEach(function(t) {
            var panel = document.getElementById('panel-' + t);
            var tabBtn = document.getElementById('tab-' + t);
            if (panel) panel.style.display = t === tab ? 'block' : 'none';
            if (tabBtn) {
                tabBtn.className = t === tab ? 'cbi-button cbi-button-action' : 'cbi-button';
            }
        });
    },

    submitContent: function() {
        var author = document.getElementById('submit-author').value.trim();
        var email = document.getElementById('submit-email').value.trim();
        var title = document.getElementById('submit-title').value.trim();
        var category = document.getElementById('submit-category').value;
        var content = document.getElementById('submit-content').value.trim();

        if (!author || !title || !content) {
            ui.addNotification(null, E('p', 'Please fill in all required fields (Author, Title, Content)'), 'warning');
            return;
        }

        ui.showModal('Submitting...', [
            E('p', { class: 'spinning' }, 'Sending your content for review...')
        ]);

        callSubmitContent(title, content, category, author, email).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.showModal('Submission Received', [
                    E('div', { style: 'text-align:center;padding:20px;' }, [
                        E('div', { style: 'font-size:4em;margin-bottom:15px;' }, '✅'),
                        E('h3', {}, 'Thank You!'),
                        E('p', {}, 'Your submission has been received and is pending moderation.'),
                        E('p', { style: 'color:#888;' }, 'Submission ID: ' + result.submission_id),
                        E('button', {
                            class: 'cbi-button cbi-button-action',
                            style: 'margin-top:20px;',
                            click: function() {
                                ui.hideModal();
                                document.getElementById('submit-title').value = '';
                                document.getElementById('submit-content').value = '';
                            }
                        }, 'Submit Another')
                    ])
                ]);
            } else {
                ui.addNotification(null, E('p', result.error || 'Submission failed'), 'error');
            }
        }).catch(function(err) {
            ui.hideModal();
            ui.addNotification(null, E('p', 'Error: ' + err.message), 'error');
        });
    },

    previewSubmission: function(submissionId) {
        var self = this;
        var card = document.querySelector('[data-id="' + submissionId + '"]');
        var preview = card.querySelector('.submission-preview');

        if (preview.style.display === 'block') {
            preview.style.display = 'none';
            return;
        }

        preview.innerHTML = '<p class="spinning">Loading...</p>';
        preview.style.display = 'block';

        callGetSubmission(submissionId).then(function(result) {
            if (result.success) {
                preview.innerHTML = '<pre style="white-space:pre-wrap;word-wrap:break-word;margin:0;">' +
                    self.escapeHtml(result.content) + '</pre>';
            } else {
                preview.innerHTML = '<p style="color:#e74c3c;">Failed to load content</p>';
            }
        });
    },

    escapeHtml: function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    approveSubmission: function(submissionId) {
        var self = this;

        ui.showModal('Approve Submission', [
            E('div', { style: 'padding:10px;' }, [
                E('p', {}, 'Select where to publish this content:'),
                E('div', { style: 'display:grid;gap:10px;margin:20px 0;' }, [
                    E('label', { style: 'display:flex;align-items:center;gap:10px;cursor:pointer;' }, [
                        E('input', { type: 'radio', name: 'publish-target', value: 'hexojs', checked: true }),
                        E('span', {}, '📝 HexoJS Blog (default)')
                    ]),
                    E('label', { style: 'display:flex;align-items:center;gap:10px;cursor:pointer;' }, [
                        E('input', { type: 'radio', name: 'publish-target', value: 'metablogizer' }),
                        E('span', {}, '🔗 MetaBlogizer')
                    ]),
                    E('label', { style: 'display:flex;align-items:center;gap:10px;cursor:pointer;' }, [
                        E('input', { type: 'radio', name: 'publish-target', value: 'static' }),
                        E('span', {}, '📄 Static Page')
                    ])
                ]),
                E('div', { style: 'display:flex;gap:10px;justify-content:flex-end;' }, [
                    E('button', {
                        class: 'cbi-button',
                        click: ui.hideModal
                    }, 'Cancel'),
                    E('button', {
                        class: 'cbi-button cbi-button-positive',
                        click: function() {
                            var target = document.querySelector('input[name="publish-target"]:checked').value;
                            ui.hideModal();
                            self.doApprove(submissionId, target);
                        }
                    }, '✅ Publish')
                ])
            ])
        ]);
    },

    doApprove: function(submissionId, target) {
        ui.showModal('Publishing...', [
            E('p', { class: 'spinning' }, 'Publishing content...')
        ]);

        callApproveSubmission(submissionId, target).then(function(result) {
            ui.hideModal();
            if (result.success) {
                ui.addNotification(null, E('p', 'Content approved and published!'), 'success');
                var card = document.querySelector('[data-id="' + submissionId + '"]');
                if (card) card.remove();

                // Update counter
                var moderateTab = document.getElementById('tab-moderate');
                if (moderateTab) {
                    var match = moderateTab.textContent.match(/\((\d+)\)/);
                    if (match) {
                        var count = parseInt(match[1]) - 1;
                        moderateTab.textContent = '⚖️ Moderate (' + count + ')';
                    }
                }
            } else {
                ui.addNotification(null, E('p', result.error || 'Approval failed'), 'error');
            }
        });
    },

    rejectSubmission: function(submissionId) {
        var self = this;

        ui.showModal('Reject Submission', [
            E('div', { style: 'padding:10px;' }, [
                E('p', {}, 'Provide a reason for rejection (optional):'),
                E('textarea', {
                    id: 'reject-reason',
                    style: 'width:100%;height:100px;padding:10px;border-radius:8px;border:1px solid #444;background:#16213e;color:#fff;margin:15px 0;',
                    placeholder: 'Reason for rejection...'
                }),
                E('div', { style: 'display:flex;gap:10px;justify-content:flex-end;' }, [
                    E('button', {
                        class: 'cbi-button',
                        click: ui.hideModal
                    }, 'Cancel'),
                    E('button', {
                        class: 'cbi-button cbi-button-negative',
                        click: function() {
                            var reason = document.getElementById('reject-reason').value;
                            ui.hideModal();
                            self.doReject(submissionId, reason);
                        }
                    }, '❌ Reject')
                ])
            ])
        ]);
    },

    doReject: function(submissionId, reason) {
        callRejectSubmission(submissionId, reason).then(function(result) {
            if (result.success) {
                ui.addNotification(null, E('p', 'Submission rejected'), 'info');
                var card = document.querySelector('[data-id="' + submissionId + '"]');
                if (card) card.remove();
            } else {
                ui.addNotification(null, E('p', result.error || 'Rejection failed'), 'error');
            }
        });
    },

    checkStatus: function() {
        var email = document.getElementById('status-email').value.trim();
        if (!email) {
            ui.addNotification(null, E('p', 'Please enter your email'), 'warning');
            return;
        }

        // TODO: Implement status check by email
        ui.addNotification(null, E('p', 'Status check feature coming soon'), 'info');
    }
});
