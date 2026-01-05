'use strict';
'require baseclass';
'require poll';

/**
 * SecuBox Real-Time Client
 *
 * Provides real-time data updates via WebSocket (preferred) with polling fallback.
 * Manages subscriptions to data channels and handles automatic reconnection.
 */

return baseclass.extend({
	// WebSocket connection
	ws: null,
	wsUrl: null,
	wsConnected: false,
	wsReconnectAttempts: 0,
	wsMaxReconnectAttempts: 5,
	wsReconnectDelay: 2000,
	wsReconnectTimer: null,

	// Subscriptions
	subscriptions: {},  // { channel: [callbacks] }

	// Polling fallback
	useFallback: false,
	pollInterval: 30000,  // 30 seconds
	pollHandles: {},

	// Configuration
	config: {
		enableWebSocket: true,
		enablePolling: true,
		debug: true
	},

	/**
	 * Initialize real-time client
	 * @param {Object} options - Configuration options
	 */
	init: function(options) {
		options = options || {};

		this.config = Object.assign(this.config, options);
		this.wsUrl = options.wsUrl || this._getDefaultWebSocketUrl();

		this._log('Initializing real-time client', { wsUrl: this.wsUrl });

		// Try WebSocket first
		if (this.config.enableWebSocket) {
			this.connect();
		} else {
			this._log('WebSocket disabled, using polling fallback');
			this.useFallback = true;
		}

		return this;
	},

	/**
	 * Connect to WebSocket server
	 */
	connect: function() {
		var self = this;

		if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
			this._log('WebSocket already connected or connecting');
			return;
		}

		this._log('Attempting WebSocket connection to: ' + this.wsUrl);

		try {
			this.ws = new WebSocket(this.wsUrl);

			this.ws.onopen = function() {
				self._onOpen();
			};

			this.ws.onmessage = function(event) {
				self._onMessage(event);
			};

			this.ws.onerror = function(error) {
				self._onError(error);
			};

			this.ws.onclose = function(event) {
				self._onClose(event);
			};

		} catch (err) {
			this._log('WebSocket connection failed:', err);
			this._fallbackToPolling();
		}
	},

	/**
	 * Disconnect from WebSocket
	 */
	disconnect: function() {
		if (this.ws) {
			this._log('Disconnecting WebSocket');
			this.ws.close();
			this.ws = null;
		}

		this.wsConnected = false;

		if (this.wsReconnectTimer) {
			clearTimeout(this.wsReconnectTimer);
			this.wsReconnectTimer = null;
		}
	},

	/**
	 * Subscribe to a data channel
	 * @param {String} channel - Channel name (e.g., 'widget.auth-guardian')
	 * @param {Function} callback - Callback function(data)
	 * @returns {Function} Unsubscribe function
	 */
	subscribe: function(channel, callback) {
		var self = this;

		if (!this.subscriptions[channel]) {
			this.subscriptions[channel] = [];
		}

		this.subscriptions[channel].push(callback);
		this._log('Subscribed to channel: ' + channel + ' (total: ' + this.subscriptions[channel].length + ')');

		// If WebSocket is connected, send subscribe message
		if (this.wsConnected && this.ws) {
			this._send({
				type: 'subscribe',
				channel: channel
			});
		}

		// If using polling fallback, start polling for this channel
		if (this.useFallback) {
			this._startPolling(channel);
		}

		// Return unsubscribe function
		return function() {
			self.unsubscribe(channel, callback);
		};
	},

	/**
	 * Unsubscribe from a channel
	 * @param {String} channel - Channel name
	 * @param {Function} callback - Specific callback to remove (optional)
	 */
	unsubscribe: function(channel, callback) {
		if (!this.subscriptions[channel]) {
			return;
		}

		if (callback) {
			// Remove specific callback
			var index = this.subscriptions[channel].indexOf(callback);
			if (index > -1) {
				this.subscriptions[channel].splice(index, 1);
			}
		} else {
			// Remove all callbacks
			this.subscriptions[channel] = [];
		}

		this._log('Unsubscribed from channel: ' + channel);

		// If no more subscribers, send unsubscribe message
		if (this.subscriptions[channel].length === 0) {
			delete this.subscriptions[channel];

			if (this.wsConnected && this.ws) {
				this._send({
					type: 'unsubscribe',
					channel: channel
				});
			}

			if (this.useFallback) {
				this._stopPolling(channel);
			}
		}
	},

	/**
	 * Publish data to a channel (send to server)
	 * @param {String} channel - Channel name
	 * @param {Object} data - Data to publish
	 */
	publish: function(channel, data) {
		if (this.wsConnected && this.ws) {
			this._send({
				type: 'publish',
				channel: channel,
				data: data
			});
		} else {
			this._log('Cannot publish - WebSocket not connected');
		}
	},

	// Private methods

	_onOpen: function() {
		this._log('WebSocket connected');
		this.wsConnected = true;
		this.wsReconnectAttempts = 0;

		// Resubscribe to all channels
		for (var channel in this.subscriptions) {
			if (this.subscriptions.hasOwnProperty(channel)) {
				this._send({
					type: 'subscribe',
					channel: channel
				});
			}
		}

		// If we were using fallback, stop it
		if (this.useFallback) {
			this._log('Switching from polling to WebSocket');
			this._stopAllPolling();
			this.useFallback = false;
		}
	},

	_onMessage: function(event) {
		try {
			var message = JSON.parse(event.data);
			this._log('Received message:', message);

			if (message.type === 'data' && message.channel) {
				this._notifySubscribers(message.channel, message.data);
			}

		} catch (err) {
			this._log('Failed to parse message:', err);
		}
	},

	_onError: function(error) {
		this._log('WebSocket error:', error);
	},

	_onClose: function(event) {
		this._log('WebSocket closed', { code: event.code, reason: event.reason });
		this.wsConnected = false;

		// Attempt reconnection
		if (this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
			this.wsReconnectAttempts++;
			var delay = this.wsReconnectDelay * this.wsReconnectAttempts;

			this._log('Reconnecting in ' + delay + 'ms (attempt ' + this.wsReconnectAttempts + ')');

			this.wsReconnectTimer = setTimeout(function() {
				this.connect();
			}.bind(this), delay);

		} else {
			this._log('Max reconnect attempts reached, falling back to polling');
			this._fallbackToPolling();
		}
	},

	_send: function(message) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		}
	},

	_notifySubscribers: function(channel, data) {
		if (this.subscriptions[channel]) {
			this._log('Notifying ' + this.subscriptions[channel].length + ' subscribers for: ' + channel);

			this.subscriptions[channel].forEach(function(callback) {
				try {
					callback(data);
				} catch (err) {
					this._log('Subscriber callback error:', err);
				}
			}.bind(this));
		}
	},

	_fallbackToPolling: function() {
		this._log('Switching to polling fallback');
		this.useFallback = true;
		this.disconnect();

		// Start polling for all subscribed channels
		for (var channel in this.subscriptions) {
			if (this.subscriptions.hasOwnProperty(channel)) {
				this._startPolling(channel);
			}
		}
	},

	_startPolling: function(channel) {
		if (!this.config.enablePolling) {
			this._log('Polling disabled');
			return;
		}

		if (this.pollHandles[channel]) {
			return;  // Already polling
		}

		this._log('Starting polling for channel: ' + channel);

		var self = this;

		// Immediate fetch
		this._fetchChannelData(channel);

		// Start periodic polling
		this.pollHandles[channel] = poll.add(function() {
			return self._fetchChannelData(channel);
		}, this.pollInterval);
	},

	_stopPolling: function(channel) {
		if (this.pollHandles[channel]) {
			this._log('Stopping polling for channel: ' + channel);
			poll.remove(this.pollHandles[channel]);
			delete this.pollHandles[channel];
		}
	},

	_stopAllPolling: function() {
		for (var channel in this.pollHandles) {
			if (this.pollHandles.hasOwnProperty(channel)) {
				this._stopPolling(channel);
			}
		}
	},

	_fetchChannelData: function(channel) {
		var self = this;

		// Parse channel to determine what to fetch
		// Format: 'widget.app-id' or 'metric.metric-name'
		var parts = channel.split('.');
		var type = parts[0];
		var id = parts[1];

		if (type === 'widget' && id) {
			// Fetch widget data via API
			return L.resolveDefault(
				rpc.declare({
					object: 'luci.secubox',
					method: 'get_widget_data',
					params: ['app_id'],
					expect: {}
				})(id),
				{}
			).then(function(data) {
				self._notifySubscribers(channel, data);
				return data;
			}).catch(function(err) {
				self._log('Polling error for ' + channel + ':', err);
			});
		}

		return Promise.resolve();
	},

	_getDefaultWebSocketUrl: function() {
		var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		var host = window.location.host;
		return protocol + '//' + host + '/ws/secubox';
	},

	_log: function() {
		if (this.config.debug) {
			var args = Array.prototype.slice.call(arguments);
			args.unshift('[REALTIME]');
			console.log.apply(console, args);
		}
	}
});
