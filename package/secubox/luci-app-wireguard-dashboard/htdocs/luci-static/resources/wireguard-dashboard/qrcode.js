'use strict';
'require baseclass';

/**
 * Minimal QR Code Generator for WireGuard Dashboard
 * Generates QR codes using Reed-Solomon error correction
 * Based on QR Code specification ISO/IEC 18004:2015
 */

// QR Code version 5 (37x37 modules) with error correction level L
// This size supports up to 154 alphanumeric chars or 106 bytes (sufficient for WireGuard configs)
var QR_VERSION = 5;
var QR_SIZE = 37;
var QR_EC_LEVEL = 'L';

// Generator polynomial for Reed-Solomon (version 5, EC level L uses 26 EC codewords)
var RS_GENERATOR = [1, 212, 246, 77, 73, 195, 192, 75, 98, 5, 70, 103, 177, 22, 217, 138, 51, 181, 246, 72, 25, 18, 46, 228, 74, 216, 195];

// Galois Field 256 tables
var GF_EXP = [];
var GF_LOG = [];

// Initialize Galois Field tables
(function() {
	var x = 1;
	for (var i = 0; i < 256; i++) {
		GF_EXP[i] = x;
		GF_LOG[x] = i;
		x = x << 1;
		if (x >= 256) x ^= 0x11d;
	}
	GF_LOG[1] = 0;
})();

// Galois Field multiplication
function gfMul(a, b) {
	if (a === 0 || b === 0) return 0;
	return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

// Reed-Solomon encoding
function rsEncode(data, nsym) {
	var gen = RS_GENERATOR.slice(0, nsym + 1);
	var res = new Array(data.length + nsym).fill(0);
	for (var i = 0; i < data.length; i++) {
		res[i] = data[i];
	}

	for (var i = 0; i < data.length; i++) {
		var coef = res[i];
		if (coef !== 0) {
			for (var j = 0; j < gen.length; j++) {
				res[i + j] ^= gfMul(gen[j], coef);
			}
		}
	}

	return res.slice(data.length);
}

// Encode text to bytes
function textToBytes(text) {
	var bytes = [];
	for (var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if (c < 128) {
			bytes.push(c);
		} else if (c < 2048) {
			bytes.push((c >> 6) | 192);
			bytes.push((c & 63) | 128);
		} else {
			bytes.push((c >> 12) | 224);
			bytes.push(((c >> 6) & 63) | 128);
			bytes.push((c & 63) | 128);
		}
	}
	return bytes;
}

// Create data codewords with mode indicator and length
function createDataCodewords(text) {
	var bytes = textToBytes(text);
	var data = [];

	// Mode indicator: 0100 (byte mode)
	// Character count indicator: 8 bits for version 1-9
	var header = (4 << 8) | bytes.length;
	data.push((header >> 8) & 0xff);
	data.push(header & 0xff);

	// Shift to add 4-bit mode
	var bits = [];
	bits.push(0, 1, 0, 0); // Byte mode

	// 8-bit count
	for (var i = 7; i >= 0; i--) {
		bits.push((bytes.length >> i) & 1);
	}

	// Data bits
	for (var i = 0; i < bytes.length; i++) {
		for (var j = 7; j >= 0; j--) {
			bits.push((bytes[i] >> j) & 1);
		}
	}

	// Terminator
	for (var i = 0; i < 4 && bits.length < 108 * 8; i++) {
		bits.push(0);
	}

	// Pad to byte boundary
	while (bits.length % 8 !== 0) {
		bits.push(0);
	}

	// Pad codewords (236 and 17 alternating)
	var padBytes = [236, 17];
	var padIdx = 0;
	while (bits.length < 108 * 8) {
		for (var j = 7; j >= 0; j--) {
			bits.push((padBytes[padIdx] >> j) & 1);
		}
		padIdx = (padIdx + 1) % 2;
	}

	// Convert bits to bytes
	data = [];
	for (var i = 0; i < bits.length; i += 8) {
		var byte = 0;
		for (var j = 0; j < 8; j++) {
			byte = (byte << 1) | bits[i + j];
		}
		data.push(byte);
	}

	return data.slice(0, 108);
}

// Create QR matrix
function createMatrix(text) {
	var matrix = [];
	for (var i = 0; i < QR_SIZE; i++) {
		matrix[i] = new Array(QR_SIZE).fill(null);
	}

	// Add finder patterns
	addFinderPattern(matrix, 0, 0);
	addFinderPattern(matrix, QR_SIZE - 7, 0);
	addFinderPattern(matrix, 0, QR_SIZE - 7);

	// Add alignment pattern (version 5 has one at 6,30)
	addAlignmentPattern(matrix, 30, 30);

	// Add timing patterns
	for (var i = 8; i < QR_SIZE - 8; i++) {
		matrix[6][i] = i % 2 === 0 ? 1 : 0;
		matrix[i][6] = i % 2 === 0 ? 1 : 0;
	}

	// Add dark module
	matrix[QR_SIZE - 8][8] = 1;

	// Reserve format info areas
	for (var i = 0; i < 9; i++) {
		if (matrix[8][i] === null) matrix[8][i] = 0;
		if (matrix[i][8] === null) matrix[i][8] = 0;
	}
	for (var i = QR_SIZE - 8; i < QR_SIZE; i++) {
		if (matrix[8][i] === null) matrix[8][i] = 0;
		if (matrix[i][8] === null) matrix[i][8] = 0;
	}

	// Create and place data
	var data = createDataCodewords(text);
	var ec = rsEncode(data, 26);
	var allData = data.concat(ec);

	// Convert to bits
	var bits = [];
	for (var i = 0; i < allData.length; i++) {
		for (var j = 7; j >= 0; j--) {
			bits.push((allData[i] >> j) & 1);
		}
	}

	// Place data bits
	var bitIdx = 0;
	var up = true;
	for (var col = QR_SIZE - 1; col >= 0; col -= 2) {
		if (col === 6) col = 5;

		for (var row = up ? QR_SIZE - 1 : 0; up ? row >= 0 : row < QR_SIZE; row += up ? -1 : 1) {
			for (var c = 0; c < 2; c++) {
				var x = col - c;
				if (matrix[row][x] === null && bitIdx < bits.length) {
					matrix[row][x] = bits[bitIdx++];
				}
			}
		}
		up = !up;
	}

	// Apply mask pattern 0 (checkerboard)
	for (var row = 0; row < QR_SIZE; row++) {
		for (var col = 0; col < QR_SIZE; col++) {
			if (matrix[row][col] !== null && !isReserved(row, col)) {
				if ((row + col) % 2 === 0) {
					matrix[row][col] ^= 1;
				}
			}
		}
	}

	// Add format info
	addFormatInfo(matrix);

	return matrix;
}

function isReserved(row, col) {
	// Finder patterns and separators
	if (row < 9 && col < 9) return true;
	if (row < 9 && col >= QR_SIZE - 8) return true;
	if (row >= QR_SIZE - 8 && col < 9) return true;

	// Timing patterns
	if (row === 6 || col === 6) return true;

	// Alignment pattern
	if (row >= 28 && row <= 32 && col >= 28 && col <= 32) return true;

	return false;
}

function addFinderPattern(matrix, row, col) {
	for (var r = 0; r < 7; r++) {
		for (var c = 0; c < 7; c++) {
			if (r === 0 || r === 6 || c === 0 || c === 6 ||
				(r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
				matrix[row + r][col + c] = 1;
			} else {
				matrix[row + r][col + c] = 0;
			}
		}
	}

	// Separator
	for (var i = 0; i < 8; i++) {
		if (row + 7 < QR_SIZE && col + i < QR_SIZE) matrix[row + 7][col + i] = 0;
		if (row + i < QR_SIZE && col + 7 < QR_SIZE) matrix[row + i][col + 7] = 0;
		if (row - 1 >= 0 && col + i < QR_SIZE) matrix[row - 1][col + i] = 0;
		if (row + i < QR_SIZE && col - 1 >= 0) matrix[row + i][col - 1] = 0;
	}
}

function addAlignmentPattern(matrix, row, col) {
	for (var r = -2; r <= 2; r++) {
		for (var c = -2; c <= 2; c++) {
			if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
				matrix[row + r][col + c] = 1;
			} else {
				matrix[row + r][col + c] = 0;
			}
		}
	}
}

function addFormatInfo(matrix) {
	// Format info for mask 0 and EC level L
	var formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

	// Top-left
	for (var i = 0; i < 6; i++) {
		matrix[8][i] = formatBits[i];
	}
	matrix[8][7] = formatBits[6];
	matrix[8][8] = formatBits[7];
	matrix[7][8] = formatBits[8];
	for (var i = 9; i < 15; i++) {
		matrix[14 - i][8] = formatBits[i];
	}

	// Top-right and bottom-left
	for (var i = 0; i < 8; i++) {
		matrix[8][QR_SIZE - 1 - i] = formatBits[i];
	}
	for (var i = 0; i < 7; i++) {
		matrix[QR_SIZE - 7 + i][8] = formatBits[8 + i];
	}
}

// Generate SVG
function generateSVG(text, size) {
	size = size || 200;
	var matrix = createMatrix(text);
	var moduleSize = size / QR_SIZE;

	var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">';
	svg += '<rect width="100%" height="100%" fill="white"/>';

	for (var row = 0; row < QR_SIZE; row++) {
		for (var col = 0; col < QR_SIZE; col++) {
			if (matrix[row][col] === 1) {
				svg += '<rect x="' + (col * moduleSize) + '" y="' + (row * moduleSize) + '" ';
				svg += 'width="' + moduleSize + '" height="' + moduleSize + '" fill="black"/>';
			}
		}
	}

	svg += '</svg>';
	return svg;
}

return baseclass.extend({
	/**
	 * Generate QR code as SVG string
	 * @param {string} text - Text to encode
	 * @param {number} size - Size in pixels (default: 200)
	 * @returns {string} SVG markup
	 */
	generateSVG: function(text, size) {
		try {
			return generateSVG(text, size);
		} catch (e) {
			console.error('QR generation error:', e);
			return null;
		}
	},

	/**
	 * Generate QR code as data URL
	 * @param {string} text - Text to encode
	 * @param {number} size - Size in pixels
	 * @returns {string} Data URL for embedding in img src
	 */
	generateDataURL: function(text, size) {
		var svg = this.generateSVG(text, size);
		if (!svg) return null;
		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	},

	/**
	 * Render QR code to a DOM element
	 * @param {HTMLElement} container - Container element
	 * @param {string} text - Text to encode
	 * @param {number} size - Size in pixels
	 */
	render: function(container, text, size) {
		var svg = this.generateSVG(text, size);
		if (svg) {
			container.innerHTML = svg;
		}
	}
});
