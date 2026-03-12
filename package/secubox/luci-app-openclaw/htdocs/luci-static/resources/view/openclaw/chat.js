'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';
'require secubox/kiss-theme';

var callOpenClawStatus = rpc.declare({
	object: 'luci.openclaw',
	method: 'status',
	expect: {}
});

var callOpenClawChat = rpc.declare({
	object: 'luci.openclaw',
	method: 'chat',
	params: ['message'],
	expect: {}
});

var callOpenClawHistory = rpc.declare({
	object: 'luci.openclaw',
	method: 'get_history',
	expect: {}
});

var callOpenClawClearHistory = rpc.declare({
	object: 'luci.openclaw',
	method: 'clear_history',
	expect: {}
});

return view.extend({
	chatContainer: null,
	messageInput: null,

	load: function() {
		return Promise.all([
			callOpenClawStatus(),
			callOpenClawHistory()
		]);
	},

	addMessage: function(content, isUser) {
		var msgDiv = E('div', {
			'style': 'display: flex; margin-bottom: 16px;' + (isUser ? ' flex-direction: row-reverse;' : '')
		});

		var avatarStyle = 'width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 11px; flex-shrink: 0;';
		if (isUser) {
			avatarStyle += ' background: var(--kiss-blue); color: white; margin-left: 10px;';
			msgDiv.appendChild(E('div', { 'style': avatarStyle }, 'You'));
		} else {
			avatarStyle += ' background: var(--kiss-purple); color: white; margin-right: 10px;';
			msgDiv.appendChild(E('div', { 'style': avatarStyle }, 'AI'));
		}

		var contentStyle = 'max-width: 70%; padding: 12px 16px; border-radius: 16px; line-height: 1.5;';
		if (isUser) {
			contentStyle += ' background: var(--kiss-blue); color: white; border-bottom-right-radius: 4px;';
		} else {
			contentStyle += ' background: var(--kiss-bg2); color: var(--kiss-text); border-bottom-left-radius: 4px;';
		}

		var contentDiv = E('div', { 'style': contentStyle });
		contentDiv.innerHTML = this.formatMessage(content);
		msgDiv.appendChild(contentDiv);

		this.chatContainer.appendChild(msgDiv);
		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	},

	formatMessage: function(text) {
		text = text.replace(/```([\s\S]*?)```/g, '<pre style="background: var(--kiss-bg); padding: 10px; border-radius: 6px; overflow-x: auto; margin: 8px 0;"><code>$1</code></pre>');
		text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
		text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		text = text.replace(/\n/g, '<br>');
		return text;
	},

	sendMessage: function() {
		var self = this;
		var message = this.messageInput.value.trim();

		if (!message) return;

		this.messageInput.value = '';
		this.addMessage(message, true);

		var typingDiv = E('div', {
			'style': 'padding: 12px 16px; background: var(--kiss-bg2); border-radius: 16px; color: var(--kiss-muted); font-style: italic; display: inline-block; margin-left: 46px;'
		}, 'AI is thinking...');
		this.chatContainer.appendChild(typingDiv);

		callOpenClawChat(message).then(function(response) {
			typingDiv.remove();

			if (response.error) {
				self.addMessage('Error: ' + response.error, false);
				return;
			}

			var aiResponse = '';
			if (response.content && response.content[0]) {
				aiResponse = response.content[0].text || '';
			} else if (response.choices && response.choices[0]) {
				aiResponse = response.choices[0].message.content || '';
			} else if (response.message && response.message.content) {
				aiResponse = response.message.content || '';
			} else if (response.candidates && response.candidates[0]) {
				aiResponse = response.candidates[0].content.parts[0].text || '';
			} else {
				aiResponse = JSON.stringify(response);
			}

			self.addMessage(aiResponse, false);
		}).catch(function(err) {
			typingDiv.remove();
			self.addMessage('Error: ' + err.message, false);
		});
	},

	render: function(data) {
		var self = this;
		var status = data[0] || {};
		var history = data[1] || {};

		var running = status.running === '1';

		this.chatContainer = E('div', {
			'id': 'chat-container',
			'style': 'height: 450px; overflow-y: auto; padding: 16px; background: var(--kiss-bg); border-radius: 8px;'
		});

		this.messageInput = E('textarea', {
			'placeholder': 'Type your message here...',
			'id': 'openclaw-message-input',
			'style': 'flex: 1; min-height: 60px; padding: 12px; background: var(--kiss-bg); border: 1px solid var(--kiss-line); border-radius: 8px; color: var(--kiss-text); resize: vertical; font-size: 14px;'
		});

		this.messageInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				self.sendMessage();
			}
		});

		// Load existing history
		if (history.history && history.history.length > 0) {
			history.history.forEach(function(item) {
				if (item.user) {
					self.addMessage(item.user, true);
				}
				if (item.response) {
					var aiResponse = '';
					if (item.response.content && item.response.content[0]) {
						aiResponse = item.response.content[0].text || '';
					} else if (item.response.choices && item.response.choices[0]) {
						aiResponse = item.response.choices[0].message.content || '';
					} else if (item.response.message) {
						aiResponse = item.response.message.content || '';
					}
					if (aiResponse) {
						self.addMessage(aiResponse, false);
					}
				}
			});
		}

		var content = [
			// Header
			E('div', { 'style': 'margin-bottom: 24px;' }, [
				E('div', { 'style': 'display: flex; justify-content: space-between; align-items: center;' }, [
					E('div', { 'style': 'display: flex; align-items: center; gap: 16px;' }, [
						E('h2', { 'style': 'font-size: 24px; font-weight: 700; margin: 0;' }, 'OpenClaw AI Chat'),
						KissTheme.badge(running ? 'CONNECTED' : 'OFFLINE', running ? 'green' : 'red')
					]),
					E('button', {
						'class': 'kiss-btn kiss-btn-red',
						'click': function() {
							ui.showModal('Clear History', [
								E('p', {}, 'Are you sure you want to clear all chat history?'),
								E('div', { 'style': 'display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;' }, [
									E('button', { 'class': 'kiss-btn', 'click': ui.hideModal }, 'Cancel'),
									E('button', {
										'class': 'kiss-btn kiss-btn-red',
										'click': function() {
											callOpenClawClearHistory().then(function() {
												self.chatContainer.innerHTML = '';
												ui.hideModal();
											});
										}
									}, 'Clear')
								])
							]);
						}
					}, 'Clear History')
				]),
				E('p', { 'style': 'color: var(--kiss-muted); margin: 8px 0 0 0;' },
					running ? 'Port ' + (status.port || '3333') : 'Service not running')
			]),

			// Chat area
			KissTheme.card('Conversation', this.chatContainer),

			// Input area
			E('div', { 'style': 'display: flex; gap: 12px; margin-top: 16px;' }, [
				this.messageInput,
				E('button', {
					'class': 'kiss-btn kiss-btn-blue',
					'style': 'padding: 12px 24px;',
					'click': function() { self.sendMessage(); }
				}, 'Send')
			])
		];

		return KissTheme.wrap(content, 'admin/services/openclaw/chat');
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
