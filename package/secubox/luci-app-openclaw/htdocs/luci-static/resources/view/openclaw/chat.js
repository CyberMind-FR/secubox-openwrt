'use strict';
'require view';
'require dom';
'require poll';
'require rpc';
'require ui';

var callOpenClawStatus = rpc.declare({
	object: 'luci.openclaw',
	method: 'status',
	expect: { }
});

var callOpenClawChat = rpc.declare({
	object: 'luci.openclaw',
	method: 'chat',
	params: ['message'],
	expect: { }
});

var callOpenClawHistory = rpc.declare({
	object: 'luci.openclaw',
	method: 'get_history',
	expect: { }
});

var callOpenClawClearHistory = rpc.declare({
	object: 'luci.openclaw',
	method: 'clear_history',
	expect: { }
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
			'class': 'openclaw-message ' + (isUser ? 'user-message' : 'ai-message')
		});

		if (isUser) {
			msgDiv.appendChild(E('div', { 'class': 'message-avatar user-avatar' }, 'You'));
		} else {
			msgDiv.appendChild(E('div', { 'class': 'message-avatar ai-avatar' }, 'AI'));
		}

		var contentDiv = E('div', { 'class': 'message-content' });
		contentDiv.innerHTML = this.formatMessage(content);
		msgDiv.appendChild(contentDiv);

		this.chatContainer.appendChild(msgDiv);
		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	},

	formatMessage: function(text) {
		// Basic markdown-like formatting
		text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
		text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
		text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		text = text.replace(/\n/g, '<br>');
		return text;
	},

	sendMessage: function() {
		var self = this;
		var message = this.messageInput.value.trim();

		if (!message)
			return;

		this.messageInput.value = '';
		this.addMessage(message, true);

		// Show typing indicator
		var typingDiv = E('div', { 'class': 'openclaw-typing' }, 'AI is thinking...');
		this.chatContainer.appendChild(typingDiv);

		callOpenClawChat(message).then(function(response) {
			typingDiv.remove();

			if (response.error) {
				self.addMessage('Error: ' + response.error, false);
				return;
			}

			// Parse response based on provider
			var aiResponse = '';
			if (response.content && response.content[0]) {
				// Anthropic format
				aiResponse = response.content[0].text || '';
			} else if (response.choices && response.choices[0]) {
				// OpenAI format
				aiResponse = response.choices[0].message.content || '';
			} else if (response.message && response.message.content) {
				// Ollama format
				aiResponse = response.message.content || '';
			} else if (response.candidates && response.candidates[0]) {
				// Gemini format
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

		var styleEl = E('style', {}, [
			'.openclaw-container { max-width: 900px; margin: 0 auto; }',
			'.openclaw-status { padding: 10px; border-radius: 8px; margin-bottom: 15px; }',
			'.openclaw-status.online { background: #d4edda; border: 1px solid #28a745; }',
			'.openclaw-status.offline { background: #f8d7da; border: 1px solid #dc3545; }',
			'.openclaw-chat { border: 1px solid #ddd; border-radius: 8px; height: 500px; overflow-y: auto; padding: 15px; background: #fafafa; margin-bottom: 15px; }',
			'.openclaw-message { display: flex; margin-bottom: 15px; }',
			'.user-message { flex-direction: row-reverse; }',
			'.message-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; }',
			'.user-avatar { background: #007bff; color: white; margin-left: 10px; }',
			'.ai-avatar { background: #6c757d; color: white; margin-right: 10px; }',
			'.message-content { max-width: 70%; padding: 12px 16px; border-radius: 18px; line-height: 1.5; }',
			'.user-message .message-content { background: #007bff; color: white; border-bottom-right-radius: 4px; }',
			'.ai-message .message-content { background: #e9ecef; color: #333; border-bottom-left-radius: 4px; }',
			'.message-content pre { background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 4px; overflow-x: auto; margin: 8px 0; }',
			'.message-content code { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; }',
			'.openclaw-input { display: flex; gap: 10px; }',
			'.openclaw-input textarea { flex: 1; min-height: 60px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; font-size: 14px; }',
			'.openclaw-input button { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; }',
			'.openclaw-input button:hover { background: #0056b3; }',
			'.openclaw-typing { padding: 12px 16px; background: #e9ecef; border-radius: 18px; color: #666; font-style: italic; display: inline-block; margin-left: 50px; }',
			'.openclaw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }',
			'.openclaw-header h2 { margin: 0; }',
			'.btn-clear { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }',
			'.btn-clear:hover { background: #c82333; }'
		]);

		var statusClass = (status.running === '1') ? 'online' : 'offline';
		var statusText = (status.running === '1') ? 'Connected' : 'Offline';

		this.chatContainer = E('div', { 'class': 'openclaw-chat' });
		this.messageInput = E('textarea', {
			'placeholder': 'Type your message here...',
			'id': 'openclaw-message-input'
		});

		// Add keypress handler for Enter key
		this.messageInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				self.sendMessage();
			}
		});

		var sendButton = E('button', {
			'click': function() { self.sendMessage(); }
		}, 'Send');

		var clearButton = E('button', {
			'class': 'btn-clear',
			'click': function() {
				ui.showModal('Clear History', [
					E('p', {}, 'Are you sure you want to clear all chat history?'),
					E('div', { 'class': 'right' }, [
						E('button', {
							'class': 'btn',
							'click': ui.hideModal
						}, 'Cancel'),
						' ',
						E('button', {
							'class': 'btn cbi-button-negative',
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
		}, 'Clear History');

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

		return E('div', { 'class': 'openclaw-container' }, [
			styleEl,
			E('div', { 'class': 'openclaw-header' }, [
				E('h2', {}, 'OpenClaw AI Chat'),
				clearButton
			]),
			E('div', { 'class': 'openclaw-status ' + statusClass }, [
				E('strong', {}, 'Status: '),
				statusText,
				(status.running === '1') ? ' (Port ' + (status.port || '3333') + ')' : ''
			]),
			this.chatContainer,
			E('div', { 'class': 'openclaw-input' }, [
				this.messageInput,
				sendButton
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
