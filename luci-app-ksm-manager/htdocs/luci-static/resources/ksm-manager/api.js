'use strict';
'require baseclass';
'require rpc';
'require uci';

/**
 * Key Storage Manager (KSM) API Client
 * Provides RPC methods for cryptographic key management with HSM support
 */

// Version: 0.4.0

var callStatus = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'status',
	expect: { }
});

var callGetInfo = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'get_info',
	expect: { }
});

var callListHsmDevices = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'list_hsm_devices',
	expect: { devices: [] }
});

var callGetHsmStatus = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'get_hsm_status',
	params: ['serial'],
	expect: { }
});

var callInitHsm = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'init_hsm',
	params: ['serial', 'admin_pin', 'user_pin'],
	expect: { }
});

var callGenerateHsmKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'generate_hsm_key',
	params: ['serial', 'key_type', 'key_size', 'label'],
	expect: { }
});

var callListKeys = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'list_keys',
	expect: { keys: [] }
});

var callGenerateKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'generate_key',
	params: ['type', 'size', 'label', 'passphrase'],
	expect: { }
});

var callImportKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'import_key',
	params: ['label', 'key_data', 'format', 'passphrase'],
	expect: { }
});

var callExportKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'export_key',
	params: ['id', 'format', 'include_private', 'passphrase'],
	expect: { }
});

var callDeleteKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'delete_key',
	params: ['id', 'secure_erase'],
	expect: { }
});

var callGenerateCsr = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'generate_csr',
	params: ['key_id', 'subject_dn', 'san_list'],
	expect: { }
});

var callImportCertificate = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'import_certificate',
	params: ['key_id', 'cert_data', 'chain'],
	expect: { }
});

var callListCertificates = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'list_certificates',
	expect: { certificates: [] }
});

var callVerifyCertificate = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'verify_certificate',
	params: ['cert_id'],
	expect: { }
});

var callStoreSecret = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'store_secret',
	params: ['label', 'secret_data', 'category', 'auto_rotate'],
	expect: { }
});

var callRetrieveSecret = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'retrieve_secret',
	params: ['secret_id'],
	expect: { }
});

var callListSecrets = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'list_secrets',
	expect: { secrets: [] }
});

var callRotateSecret = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'rotate_secret',
	params: ['secret_id', 'new_secret_data'],
	expect: { }
});

var callGenerateSshKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'generate_ssh_key',
	params: ['label', 'key_type', 'comment'],
	expect: { }
});

var callDeploySshKey = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'deploy_ssh_key',
	params: ['key_id', 'target_host', 'target_user'],
	expect: { }
});

var callGetAuditLogs = rpc.declare({
	object: 'luci.ksm-manager',
	method: 'get_audit_logs',
	params: ['limit', 'offset', 'filter_type'],
	expect: { logs: [] }
});

return baseclass.extend({
	/**
	 * Get KSM service status
	 * @returns {Promise<Object>} Status object with running, keystore_unlocked, keys_count, hsm_connected
	 */

// Version: 0.4.0
	getStatus: function() {
		return L.resolveDefault(callStatus(), {
			running: false,
			keystore_unlocked: false,
			keys_count: 0,
			hsm_connected: false
		});
	},

	/**
	 * Get system information
	 * @returns {Promise<Object>} Info object with openssl_version, gpg_version, hsm_support
	 */

// Version: 0.4.0
	getInfo: function() {
		return L.resolveDefault(callGetInfo(), {
			openssl_version: 'unknown',
			gpg_version: 'unknown',
			hsm_support: false
		});
	},

	/**
	 * List HSM devices (Nitrokey, YubiKey)
	 * @returns {Promise<Object>} Object with devices array
	 */

// Version: 0.4.0
	listHsmDevices: function() {
		return L.resolveDefault(callListHsmDevices(), { devices: [] });
	},

	/**
	 * Get HSM device status
	 * @param {string} serial - Device serial number
	 * @returns {Promise<Object>} Status object with initialized, pin_retries, keys_count
	 */

// Version: 0.4.0
	getHsmStatus: function(serial) {
		return L.resolveDefault(callGetHsmStatus(serial), {
			initialized: false,
			pin_retries: 0,
			keys_count: 0
		});
	},

	/**
	 * Initialize HSM device
	 * @param {string} serial - Device serial number
	 * @param {string} adminPin - Admin PIN
	 * @param {string} userPin - User PIN
	 * @returns {Promise<Object>} Result with success boolean
	 */

// Version: 0.4.0
	initHsm: function(serial, adminPin, userPin) {
		return callInitHsm(serial, adminPin, userPin);
	},

	/**
	 * Generate key on HSM chip
	 * @param {string} serial - Device serial number
	 * @param {string} keyType - Key type (rsa, ecdsa, ed25519)
	 * @param {number} keySize - Key size in bits
	 * @param {string} label - Key label
	 * @returns {Promise<Object>} Result with success and key_id
	 */

// Version: 0.4.0
	generateHsmKey: function(serial, keyType, keySize, label) {
		return callGenerateHsmKey(serial, keyType, keySize, label);
	},

	/**
	 * List all cryptographic keys
	 * @returns {Promise<Object>} Object with keys array
	 */

// Version: 0.4.0
	listKeys: function() {
		return L.resolveDefault(callListKeys(), { keys: [] });
	},

	/**
	 * Generate new cryptographic key
	 * @param {string} type - Key type (rsa, ecdsa, ed25519)
	 * @param {number} size - Key size in bits
	 * @param {string} label - Key label
	 * @param {string} passphrase - Optional passphrase
	 * @returns {Promise<Object>} Result with success, id, and public_key
	 */

// Version: 0.4.0
	generateKey: function(type, size, label, passphrase) {
		return callGenerateKey(type, size, label, passphrase || '');
	},

	/**
	 * Import existing key
	 * @param {string} label - Key label
	 * @param {string} keyData - Key data (PEM, DER, etc.)
	 * @param {string} format - Key format
	 * @param {string} passphrase - Optional passphrase
	 * @returns {Promise<Object>} Result with success and id
	 */

// Version: 0.4.0
	importKey: function(label, keyData, format, passphrase) {
		return callImportKey(label, keyData, format, passphrase || '');
	},

	/**
	 * Export key
	 * @param {string} id - Key ID
	 * @param {string} format - Export format
	 * @param {boolean} includePrivate - Include private key
	 * @param {string} passphrase - Optional passphrase
	 * @returns {Promise<Object>} Result with success and key_data
	 */

// Version: 0.4.0
	exportKey: function(id, format, includePrivate, passphrase) {
		return callExportKey(id, format, includePrivate, passphrase || '');
	},

	/**
	 * Delete key
	 * @param {string} id - Key ID
	 * @param {boolean} secureErase - Use secure erase (shred)
	 * @returns {Promise<Object>} Result with success boolean
	 */

// Version: 0.4.0
	deleteKey: function(id, secureErase) {
		return callDeleteKey(id, secureErase);
	},

	/**
	 * Generate Certificate Signing Request (CSR)
	 * @param {string} keyId - Key ID to use
	 * @param {string} subjectDn - Subject DN (e.g., "/CN=example.com/O=Org")
	 * @param {Array} sanList - Subject Alternative Names
	 * @returns {Promise<Object>} Result with success and csr
	 */

// Version: 0.4.0
	generateCsr: function(keyId, subjectDn, sanList) {
		return callGenerateCsr(keyId, subjectDn, sanList || []);
	},

	/**
	 * Import certificate
	 * @param {string} keyId - Associated key ID
	 * @param {string} certData - Certificate data (PEM)
	 * @param {string} chain - Certificate chain (optional)
	 * @returns {Promise<Object>} Result with success and cert_id
	 */

// Version: 0.4.0
	importCertificate: function(keyId, certData, chain) {
		return callImportCertificate(keyId, certData, chain || '');
	},

	/**
	 * List all certificates
	 * @returns {Promise<Object>} Object with certificates array
	 */

// Version: 0.4.0
	listCertificates: function() {
		return L.resolveDefault(callListCertificates(), { certificates: [] });
	},

	/**
	 * Verify certificate validity
	 * @param {string} certId - Certificate ID
	 * @returns {Promise<Object>} Result with valid, chain_valid, expires_in_days
	 */

// Version: 0.4.0
	verifyCertificate: function(certId) {
		return callVerifyCertificate(certId);
	},

	/**
	 * Store secret
	 * @param {string} label - Secret label
	 * @param {string} secretData - Secret data
	 * @param {string} category - Category (api_key, password, token, etc.)
	 * @param {boolean} autoRotate - Enable auto-rotation
	 * @returns {Promise<Object>} Result with success and secret_id
	 */

// Version: 0.4.0
	storeSecret: function(label, secretData, category, autoRotate) {
		return callStoreSecret(label, secretData, category, autoRotate);
	},

	/**
	 * Retrieve secret (logs access)
	 * @param {string} secretId - Secret ID
	 * @returns {Promise<Object>} Result with success, secret_data, accessed_at
	 */

// Version: 0.4.0
	retrieveSecret: function(secretId) {
		return callRetrieveSecret(secretId);
	},

	/**
	 * List all secrets
	 * @returns {Promise<Object>} Object with secrets array
	 */

// Version: 0.4.0
	listSecrets: function() {
		return L.resolveDefault(callListSecrets(), { secrets: [] });
	},

	/**
	 * Rotate secret (create new version)
	 * @param {string} secretId - Secret ID
	 * @param {string} newSecretData - New secret data
	 * @returns {Promise<Object>} Result with success and version
	 */

// Version: 0.4.0
	rotateSecret: function(secretId, newSecretData) {
		return callRotateSecret(secretId, newSecretData);
	},

	/**
	 * Generate SSH key pair
	 * @param {string} label - Key label
	 * @param {string} keyType - Key type (rsa, ecdsa, ed25519)
	 * @param {string} comment - SSH key comment
	 * @returns {Promise<Object>} Result with success, key_id, public_key
	 */

// Version: 0.4.0
	generateSshKey: function(label, keyType, comment) {
		return callGenerateSshKey(label, keyType, comment || '');
	},

	/**
	 * Deploy SSH key to remote host
	 * @param {string} keyId - SSH key ID
	 * @param {string} targetHost - Target hostname/IP
	 * @param {string} targetUser - Target username
	 * @returns {Promise<Object>} Result with success boolean
	 */

// Version: 0.4.0
	deploySshKey: function(keyId, targetHost, targetUser) {
		return callDeploySshKey(keyId, targetHost, targetUser);
	},

	/**
	 * Get audit logs
	 * @param {number} limit - Max number of entries
	 * @param {number} offset - Offset for pagination
	 * @param {string} filterType - Filter by action type
	 * @returns {Promise<Object>} Object with logs array
	 */

// Version: 0.4.0
	getAuditLogs: function(limit, offset, filterType) {
		return L.resolveDefault(callGetAuditLogs(limit || 100, offset || 0, filterType || ''), { logs: [] });
	},

	/**
	 * Format key type for display
	 * @param {string} type - Key type
	 * @returns {string} Formatted type
	 */

// Version: 0.4.0
	formatKeyType: function(type) {
		var types = {
			'rsa': 'RSA',
			'ecdsa': 'ECDSA',
			'ed25519': 'Ed25519',
			'ssh_rsa': 'SSH RSA',
			'ssh_ecdsa': 'SSH ECDSA',
			'ssh_ed25519': 'SSH Ed25519'
		};
		return types[type] || type.toUpperCase();
	},

	/**
	 * Format storage location for display
	 * @param {string} storage - Storage type
	 * @returns {string} Formatted storage
	 */

// Version: 0.4.0
	formatStorage: function(storage) {
		return storage === 'hsm' ? 'Hardware' : 'Software';
	},

	/**
	 * Get certificate status color
	 * @param {number} daysRemaining - Days until expiration
	 * @returns {string} Color class
	 */

// Version: 0.4.0
	getCertStatusColor: function(daysRemaining) {
		if (daysRemaining < 0) return 'gray';
		if (daysRemaining < 7) return 'red';
		if (daysRemaining < 30) return 'orange';
		return 'green';
	},

	/**
	 * Format timestamp
	 * @param {string} timestamp - ISO timestamp
	 * @returns {string} Formatted date
	 */

// Version: 0.4.0
	formatTimestamp: function(timestamp) {
		if (!timestamp) return 'N/A';
		try {
			var date = new Date(timestamp);
			return date.toLocaleString();
		} catch (e) {
			return timestamp;
		}
	}
});
