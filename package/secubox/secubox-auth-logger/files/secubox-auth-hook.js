/**
 * SecuBox Auth Hook - Intercepts LuCI login failures for CrowdSec
 * Copyright (C) 2024 CyberMind.fr
 *
 * This script hooks into LuCI's authentication system to log
 * failed login attempts with the real client IP address.
 *
 * The hook intercepts XMLHttpRequest calls to session.login and
 * reports failures to our CGI endpoint which has access to REMOTE_ADDR.
 */

(function() {
    'use strict';

    // Only run once
    if (window._secuboxAuthHookLoaded) return;
    window._secuboxAuthHookLoaded = true;

    var AUTH_HOOK_URL = '/cgi-bin/secubox-auth-hook';

    // Debounce to avoid multiple logs for same attempt
    var lastLogTime = 0;
    var lastLogUser = '';

    /**
     * Log auth failure to our CGI endpoint
     * The CGI endpoint gets REMOTE_ADDR and logs with real client IP
     */
    function logAuthFailure(username) {
        var now = Date.now();
        // Debounce: don't log same user within 2 seconds
        if (username === lastLogUser && (now - lastLogTime) < 2000) {
            return;
        }
        lastLogTime = now;
        lastLogUser = username;

        try {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', AUTH_HOOK_URL, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            // Send with dummy password - CGI will detect it's a log-only call
            // and just log the failure with the real client IP
            xhr.send(JSON.stringify({
                username: username || 'root',
                password: '__SECUBOX_LOG_FAILURE__'
            }));
        } catch (e) {
            // Silently fail - don't break login flow
        }
    }

    /**
     * Check if a ubus response indicates login failure
     */
    function isLoginFailure(result) {
        if (!result) return false;

        // UBUS JSON-RPC response format: { result: [error_code, data] }
        if (result.result && Array.isArray(result.result)) {
            var errorCode = result.result[0];
            var data = result.result[1];

            // Error code != 0 means failure
            if (errorCode !== 0) return true;

            // Check for empty session (credential failure)
            if (data && data.ubus_rpc_session === '') return true;
            if (data && !data.ubus_rpc_session) return true;
        }

        // Check for error response
        if (result.error) return true;

        return false;
    }

    /**
     * Extract username from login call params
     */
    function extractUsername(call) {
        try {
            if (call.params && call.params[2] && call.params[2].username) {
                return call.params[2].username;
            }
        } catch (e) {}
        return 'root';
    }

    /**
     * Intercept fetch API calls (modern LuCI)
     */
    var originalFetch = window.fetch;
    if (originalFetch) {
        window.fetch = function(url, options) {
            var requestBody = null;
            var loginCalls = [];

            // Parse request to find login calls
            if (url && url.indexOf('ubus') !== -1 && options && options.body) {
                try {
                    requestBody = JSON.parse(options.body);
                    if (Array.isArray(requestBody)) {
                        requestBody.forEach(function(call, idx) {
                            if (call && call.method === 'call' &&
                                call.params && call.params[1] === 'login') {
                                loginCalls.push({ call: call, idx: idx });
                            }
                        });
                    }
                } catch (e) {}
            }

            return originalFetch.apply(this, arguments).then(function(response) {
                // Check login results
                if (loginCalls.length > 0) {
                    response.clone().json().then(function(data) {
                        if (Array.isArray(data)) {
                            loginCalls.forEach(function(item) {
                                var result = data[item.idx];
                                if (isLoginFailure(result)) {
                                    logAuthFailure(extractUsername(item.call));
                                }
                            });
                        }
                    }).catch(function() {});
                }
                return response;
            });
        };
    }

    /**
     * Intercept XMLHttpRequest (older LuCI versions)
     */
    var originalXHRSend = XMLHttpRequest.prototype.send;
    var originalXHROpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(method, url) {
        this._secuboxUrl = url;
        this._secuboxMethod = method;
        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        var xhr = this;
        var url = this._secuboxUrl;
        var loginCalls = [];

        // Only intercept POST to ubus
        if (this._secuboxMethod === 'POST' && url && url.indexOf('ubus') !== -1 && body) {
            try {
                var parsedBody = JSON.parse(body);
                if (Array.isArray(parsedBody)) {
                    parsedBody.forEach(function(call, idx) {
                        if (call && call.method === 'call' &&
                            call.params && call.params[1] === 'login') {
                            loginCalls.push({ call: call, idx: idx });
                        }
                    });
                }
            } catch (e) {}
        }

        if (loginCalls.length > 0) {
            var originalOnReadyStateChange = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (Array.isArray(response)) {
                            loginCalls.forEach(function(item) {
                                var result = response[item.idx];
                                if (isLoginFailure(result)) {
                                    logAuthFailure(extractUsername(item.call));
                                }
                            });
                        }
                    } catch (e) {}
                }
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };
        }

        return originalXHRSend.apply(this, arguments);
    };

    // Debug message in console
    if (window.console && console.log) {
        console.log('[SecuBox] Auth hook v1.1 loaded - LuCI login failures will be logged for CrowdSec');
    }
})();
