'use strict';
'require view';
'require ui';
'require rpc';
'require form';
'require secubox/kiss-theme';

// User submission RPC calls
var callSubmitContent = rpc.declare({
	object: 'luci.hexojs',
	method: 'submit_for_review',
	params: ['title', 'content', 'category', 'author', 'email'],
	expect: {}
});

var callListPending = rpc.declare({
	object: 'luci.hexojs',
	method: 'list_pending',
	expect: {}
});

var callApproveSubmission = rpc.declare({
	object: 'luci.hexojs',
	method: 'approve_submission',
	params: ['submission_id', 'publish_target'],
	expect: {}
});

var callRejectSubmission = rpc.declare({
	object: 'luci.hexojs',
	method: 'reject_submission',
	params: ['submission_id', 'reason'],
	expect: {}
});

var callGetSubmission = rpc.declare({
	object: 'luci.hexojs',
	method: 'get_submission',
	params: ['submission_id'],
	expect: {}
});

return view.extend({
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	load: function() {
		return callListPending();
	},

	renderStats: function(pendingCount, isAdmin) {
		var c = KissTheme.colors;
		return [
			KissTheme.stat(pendingCount, 'Pending', c.orange),
			KissTheme.stat(isAdmin ? 'Admin' : 'User', 'Role', isAdmin ? c.purple : c.blue),
			KissTheme.stat('Markdown', 'Format', c.cyan)
		];
	},

	renderSubmitForm: function() {
		var self = this;

		return KissTheme.card('Submit Content',
			E('div', { 'style': 'display: flex; flex-direction: column; gap: 16px;' }, [
				E('p', { 'style': 'color: var(--kiss-muted); margin: 0;' },
					'Submit your content for review. Once approved by moderators, it will be published to the public portal.'),

				// Author Info
				E('div', { 'style': 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;' }, [
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Author Name *'),
						E('input', {
							'type': 'text',
							'id': 'submit-author',
							'placeholder': 'Your name',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						})
					]),
					E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
						E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Email (optional)'),
						E('input', {
							'type': 'email',
							'id': 'submit-email',
							'placeholder': 'your@email.com',
							'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
						})
					])
				]),

				// Title
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Title *'),
					E('input', {
						'type': 'text',
						'id': 'submit-title',
						'placeholder': 'Article title',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
					})
				]),

				// Category
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Category'),
					E('select', {
						'id': 'submit-category',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
					}, [
						E('option', { 'value': 'general' }, 'General'),
						E('option', { 'value': 'news' }, 'News'),
						E('option', { 'value': 'tutorial' }, 'Tutorial'),
						E('option', { 'value': 'opinion' }, 'Opinion'),
						E('option', { 'value': 'tech' }, 'Technology'),
						E('option', { 'value': 'community' }, 'Community')
					])
				]),

				// Content
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 6px;' }, [
					E('label', { 'style': 'font-size: 12px; color: var(--kiss-muted);' }, 'Content * (Markdown supported)'),
					E('textarea', {
						'id': 'submit-content',
						'placeholder': '# Your Article\n\nWrite your content here using **Markdown** formatting...',
						'style': 'background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 12px; border-radius: 6px; font-family: monospace; resize: vertical; min-height: 250px;'
					})
				]),

				// Submit Button
				E('div', { 'style': 'display: flex; justify-content: center;' }, [
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 12px 32px;',
						'click': ui.createHandlerFn(this, 'submitContent')
					}, 'Submit for Review')
				])
			])
		);
	},

	renderPendingCard: function(sub) {
		var self = this;

		return E('div', {
			'style': 'background: var(--kiss-bg); border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 3px solid var(--kiss-orange);',
			'data-id': sub.id
		}, [
			E('div', { 'style': 'display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;' }, [
				E('div', { 'style': 'flex: 1;' }, [
					E('h4', { 'style': 'margin: 0 0 8px 0; font-weight: 600;' }, sub.title),
					E('div', { 'style': 'display: flex; flex-wrap: wrap; gap: 12px; color: var(--kiss-muted); font-size: 12px;' }, [
						E('span', {}, 'Author: ' + sub.author),
						KissTheme.badge(sub.category, 'blue'),
						E('span', {}, sub.date)
					])
				]),
				E('div', { 'style': 'display: flex; gap: 8px; flex-shrink: 0;' }, [
					E('button', {
						'class': 'kiss-btn',
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(self, 'previewSubmission', sub.id)
					}, 'Preview'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(self, 'approveSubmission', sub.id)
					}, 'Approve'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'style': 'padding: 6px 12px; font-size: 12px;',
						'click': ui.createHandlerFn(self, 'rejectSubmission', sub.id)
					}, 'Reject')
				])
			]),
			E('div', {
				'class': 'submission-preview',
				'style': 'display: none; margin-top: 12px; padding: 12px; background: var(--kiss-bg2); border-radius: 6px; max-height: 250px; overflow-y: auto;'
			})
		]);
	},

	renderModeratePanel: function(pendingList) {
		var self = this;

		if (pendingList.length === 0) {
			return E('p', { 'style': 'text-align: center; color: var(--kiss-muted); padding: 30px;' },
				'No pending submissions');
		}

		return E('div', { 'id': 'pending-list' },
			pendingList.map(function(sub) {
				return self.renderPendingCard(sub);
			})
		);
	},

	renderStatusPanel: function() {
		return E('div', { 'id': 'my-submissions' }, [
			E('p', { 'style': 'color: var(--kiss-muted); text-align: center; margin-bottom: 16px;' },
				'Enter your email to check submission status'),
			E('div', { 'style': 'display: flex; gap: 8px; justify-content: center; max-width: 400px; margin: 0 auto;' }, [
				E('input', {
					'type': 'email',
					'id': 'status-email',
					'placeholder': 'your@email.com',
					'style': 'flex: 1; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 10px 12px; border-radius: 6px;'
				}),
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'click': ui.createHandlerFn(this, 'checkStatus')
				}, 'Check')
			])
		]);
	},

	render: function(data) {
		var self = this;
		var pendingList = (data && data.submissions) || [];
		var isAdmin = (data && data.is_admin) || false;

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
					E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' },
						isAdmin ? 'Content Moderation' : 'Submit Content'),
					isAdmin ? KissTheme.badge('Admin', 'purple') : KissTheme.badge('Contributor', 'blue')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					isAdmin ? 'Review and moderate user submissions' : 'Submit your content for review and publication')
			]),

			// Stats
			E('div', { 'class': 'kiss-grid kiss-grid-3', 'style': 'margin: 20px 0;' },
				this.renderStats(pendingList.length, isAdmin)),

			// Tab navigation
			E('div', { 'style': 'display: flex; gap: 12px; margin: 24px 0;' }, [
				E('button', {
					'id': 'tab-submit',
					'class': 'kiss-btn kiss-btn-green tab-btn',
					'data-tab': 'submit',
					'click': function(ev) { self.showTab('submit'); }
				}, 'Submit'),
				isAdmin ? E('button', {
					'id': 'tab-moderate',
					'class': 'kiss-btn tab-btn',
					'data-tab': 'moderate',
					'click': function(ev) { self.showTab('moderate'); }
				}, 'Moderate (' + pendingList.length + ')') : '',
				E('button', {
					'id': 'tab-status',
					'class': 'kiss-btn tab-btn',
					'data-tab': 'status',
					'click': function(ev) { self.showTab('status'); }
				}, 'My Submissions')
			]),

			// Submit Panel
			E('div', { 'id': 'panel-submit', 'class': 'tab-panel' }, [
				this.renderSubmitForm()
			]),

			// Moderate Panel (Admin only)
			isAdmin ? E('div', { 'id': 'panel-moderate', 'class': 'tab-panel', 'style': 'display: none;' }, [
				KissTheme.card('Pending Submissions', this.renderModeratePanel(pendingList))
			]) : '',

			// Status Panel
			E('div', { 'id': 'panel-status', 'class': 'tab-panel', 'style': 'display: none;' }, [
				KissTheme.card('Submission Status', this.renderStatusPanel())
			])
		];

		return KissTheme.wrap(content, 'admin/services/hexojs/submit');
	},

	showTab: function(tab) {
		var tabs = ['submit', 'moderate', 'status'];
		tabs.forEach(function(t) {
			var panel = document.getElementById('panel-' + t);
			var tabBtn = document.getElementById('tab-' + t);
			if (panel) panel.style.display = t === tab ? 'block' : 'none';
			if (tabBtn) {
				tabBtn.className = t === tab ? 'kiss-btn kiss-btn-green tab-btn' : 'kiss-btn tab-btn';
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
			E('p', { 'class': 'spinning' }, 'Sending your content for review...')
		]);

		callSubmitContent(title, content, category, author, email).then(function(result) {
			ui.hideModal();
			if (result.success) {
				ui.showModal('Submission Received', [
					E('div', { 'style': 'padding: 20px; text-align: center;' }, [
						E('div', { 'style': 'color: var(--kiss-green); font-size: 48px; margin-bottom: 16px;' }, '\u2713'),
						E('h3', { 'style': 'margin: 0 0 12px 0;' }, 'Thank You!'),
						E('p', { 'style': 'color: var(--kiss-muted);' }, 'Your submission has been received and is pending moderation.'),
						E('p', { 'style': 'font-family: monospace; background: var(--kiss-bg); padding: 8px; border-radius: 4px; margin: 12px 0;' },
							'ID: ' + result.submission_id),
						E('button', {
							'class': 'kiss-btn kiss-btn-green',
							'style': 'margin-top: 16px;',
							'click': function() {
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
				preview.innerHTML = '<pre style="white-space: pre-wrap; word-wrap: break-word; margin: 0; color: var(--kiss-text);">' +
					self.escapeHtml(result.content) + '</pre>';
			} else {
				preview.innerHTML = '<p style="color: var(--kiss-red);">Failed to load content</p>';
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
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', { 'style': 'margin: 0 0 16px 0;' }, 'Select where to publish this content:'),
				E('div', { 'style': 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;' }, [
					E('label', { 'style': 'display: flex; align-items: center; gap: 10px; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'publish-target', 'value': 'hexojs', 'checked': true }),
						E('span', {}, 'HexoJS Blog (default)')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 10px; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'publish-target', 'value': 'metablogizer' }),
						E('span', {}, 'MetaBlogizer')
					]),
					E('label', { 'style': 'display: flex; align-items: center; gap: 10px; cursor: pointer;' }, [
						E('input', { 'type': 'radio', 'name': 'publish-target', 'value': 'static' }),
						E('span', {}, 'Static Page')
					])
				]),
				E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-green',
						'click': function() {
							var target = document.querySelector('input[name="publish-target"]:checked').value;
							ui.hideModal();
							self.doApprove(submissionId, target);
						}
					}, 'Publish')
				])
			])
		]);
	},

	doApprove: function(submissionId, target) {
		ui.showModal('Publishing...', [
			E('p', { 'class': 'spinning' }, 'Publishing content...')
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
						moderateTab.textContent = 'Moderate (' + count + ')';
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
			E('div', { 'style': 'padding: 16px;' }, [
				E('p', { 'style': 'margin: 0 0 12px 0;' }, 'Provide a reason for rejection (optional):'),
				E('textarea', {
					'id': 'reject-reason',
					'placeholder': 'Reason for rejection...',
					'style': 'width: 100%; height: 100px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); color: var(--kiss-text); padding: 12px; border-radius: 6px; resize: vertical;'
				}),
				E('div', { 'style': 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;' }, [
					E('button', {
						'class': 'kiss-btn',
						'click': ui.hideModal
					}, 'Cancel'),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'click': function() {
							var reason = document.getElementById('reject-reason').value;
							ui.hideModal();
							self.doReject(submissionId, reason);
						}
					}, 'Reject')
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
