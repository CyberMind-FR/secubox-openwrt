'use strict';
'require baseclass';

/**
 * QR Code Generator for WireGuard Dashboard
 * Supports up to ~300 bytes (sufficient for WireGuard configs)
 * Based on QR Code specification ISO/IEC 18004
 */

// QR Code version capacities (byte mode, EC level L)
var VERSION_CAPACITIES = {
	1: 17, 2: 32, 3: 53, 4: 78, 5: 106, 6: 134, 7: 154, 8: 192, 9: 230, 10: 271,
	11: 321, 12: 367, 13: 425, 14: 458, 15: 520, 16: 586, 17: 644, 18: 718, 19: 792, 20: 858
};

// QR Code sizes (modules per side)
var VERSION_SIZES = {
	1: 21, 2: 25, 3: 29, 4: 33, 5: 37, 6: 41, 7: 45, 8: 49, 9: 53, 10: 57,
	11: 61, 12: 65, 13: 69, 14: 73, 15: 77, 16: 81, 17: 85, 18: 89, 19: 93, 20: 97
};

// Data codewords per version (EC level L)
var DATA_CODEWORDS = {
	1: 19, 2: 34, 3: 55, 4: 80, 5: 108, 6: 136, 7: 156, 8: 194, 9: 232, 10: 274,
	11: 324, 12: 370, 13: 428, 14: 461, 15: 523, 16: 589, 17: 647, 18: 721, 19: 795, 20: 861
};

// EC codewords per block for level L
var EC_CODEWORDS = {
	1: 7, 2: 10, 3: 15, 4: 20, 5: 26, 6: 18, 7: 20, 8: 24, 9: 30, 10: 18,
	11: 20, 12: 24, 13: 26, 14: 30, 15: 22, 16: 24, 17: 28, 18: 30, 19: 28, 20: 28
};

// Number of EC blocks
var EC_BLOCKS = {
	1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2, 10: 4,
	11: 4, 12: 4, 13: 4, 14: 4, 15: 6, 16: 6, 17: 6, 18: 6, 19: 7, 20: 8
};

// Alignment pattern positions
var ALIGNMENT_POSITIONS = {
	2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
	7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
	11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66],
	15: [6, 26, 48, 70], 16: [6, 26, 50, 74], 17: [6, 30, 54, 78],
	18: [6, 30, 56, 82], 19: [6, 30, 58, 86], 20: [6, 34, 62, 90]
};

// Galois Field 256 tables
var GF_EXP = new Array(512);
var GF_LOG = new Array(256);

// Initialize Galois Field tables
(function() {
	var x = 1;
	for (var i = 0; i < 255; i++) {
		GF_EXP[i] = x;
		GF_LOG[x] = i;
		x = x << 1;
		if (x >= 256) x ^= 0x11d;
	}
	for (var i = 255; i < 512; i++) {
		GF_EXP[i] = GF_EXP[i - 255];
	}
})();

function gfMul(a, b) {
	if (a === 0 || b === 0) return 0;
	return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function gfPow(x, power) {
	return GF_EXP[(GF_LOG[x] * power) % 255];
}

// Generate Reed-Solomon generator polynomial
function rsGeneratorPoly(nsym) {
	var g = [1];
	for (var i = 0; i < nsym; i++) {
		var newG = new Array(g.length + 1).fill(0);
		for (var j = 0; j < g.length; j++) {
			newG[j] ^= g[j];
			newG[j + 1] ^= gfMul(g[j], GF_EXP[i]);
		}
		g = newG;
	}
	return g;
}

// Reed-Solomon encoding
function rsEncode(data, nsym) {
	var gen = rsGeneratorPoly(nsym);
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

// Select optimal QR version for data length
function selectVersion(dataLength) {
	for (var v = 1; v <= 20; v++) {
		if (VERSION_CAPACITIES[v] >= dataLength) {
			return v;
		}
	}
	return 20; // Max supported
}

// Encode text to UTF-8 bytes
function textToBytes(text) {
	var bytes = [];
	for (var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if (c < 128) {
			bytes.push(c);
		} else if (c < 2048) {
			bytes.push((c >> 6) | 192);
			bytes.push((c & 63) | 128);
		} else if (c < 65536) {
			bytes.push((c >> 12) | 224);
			bytes.push(((c >> 6) & 63) | 128);
			bytes.push((c & 63) | 128);
		}
	}
	return bytes;
}

// Create data codewords
function createDataCodewords(text, version) {
	var bytes = textToBytes(text);
	var totalCodewords = DATA_CODEWORDS[version];
	var bits = [];

	// Mode indicator: 0100 (byte mode)
	bits.push(0, 1, 0, 0);

	// Character count indicator (8 bits for v1-9, 16 bits for v10+)
	var countBits = version <= 9 ? 8 : 16;
	for (var i = countBits - 1; i >= 0; i--) {
		bits.push((bytes.length >> i) & 1);
	}

	// Data bits
	for (var i = 0; i < bytes.length; i++) {
		for (var j = 7; j >= 0; j--) {
			bits.push((bytes[i] >> j) & 1);
		}
	}

	// Terminator (up to 4 zeros)
	var terminatorLength = Math.min(4, totalCodewords * 8 - bits.length);
	for (var i = 0; i < terminatorLength; i++) {
		bits.push(0);
	}

	// Pad to byte boundary
	while (bits.length % 8 !== 0) {
		bits.push(0);
	}

	// Pad codewords
	var padBytes = [236, 17];
	var padIdx = 0;
	while (bits.length < totalCodewords * 8) {
		for (var j = 7; j >= 0; j--) {
			bits.push((padBytes[padIdx] >> j) & 1);
		}
		padIdx = (padIdx + 1) % 2;
	}

	// Convert bits to bytes
	var data = [];
	for (var i = 0; i < bits.length; i += 8) {
		var byte = 0;
		for (var j = 0; j < 8; j++) {
			byte = (byte << 1) | (bits[i + j] || 0);
		}
		data.push(byte);
	}

	return data.slice(0, totalCodewords);
}

// Interleave data and EC blocks
function interleaveBlocks(data, version) {
	var numBlocks = EC_BLOCKS[version];
	var ecPerBlock = EC_CODEWORDS[version];
	var totalData = DATA_CODEWORDS[version];
	var dataPerBlock = Math.floor(totalData / numBlocks);
	var extraBlocks = totalData % numBlocks;

	var blocks = [];
	var ecBlocks = [];
	var offset = 0;

	for (var i = 0; i < numBlocks; i++) {
		var blockSize = dataPerBlock + (i >= numBlocks - extraBlocks ? 1 : 0);
		var blockData = data.slice(offset, offset + blockSize);
		blocks.push(blockData);
		ecBlocks.push(rsEncode(blockData, ecPerBlock));
		offset += blockSize;
	}

	// Interleave
	var result = [];
	var maxDataLen = dataPerBlock + (extraBlocks > 0 ? 1 : 0);
	for (var i = 0; i < maxDataLen; i++) {
		for (var j = 0; j < numBlocks; j++) {
			if (i < blocks[j].length) {
				result.push(blocks[j][i]);
			}
		}
	}
	for (var i = 0; i < ecPerBlock; i++) {
		for (var j = 0; j < numBlocks; j++) {
			result.push(ecBlocks[j][i]);
		}
	}

	return result;
}

// Create QR matrix
function createMatrix(text) {
	var bytes = textToBytes(text);
	var version = selectVersion(bytes.length);
	var size = VERSION_SIZES[version];

	var matrix = [];
	var reserved = [];
	for (var i = 0; i < size; i++) {
		matrix[i] = new Array(size).fill(0);
		reserved[i] = new Array(size).fill(false);
	}

	// Add finder patterns
	addFinderPattern(matrix, reserved, 0, 0, size);
	addFinderPattern(matrix, reserved, size - 7, 0, size);
	addFinderPattern(matrix, reserved, 0, size - 7, size);

	// Add alignment patterns
	if (version >= 2) {
		var positions = ALIGNMENT_POSITIONS[version];
		for (var i = 0; i < positions.length; i++) {
			for (var j = 0; j < positions.length; j++) {
				var row = positions[i];
				var col = positions[j];
				// Skip if overlapping with finder patterns
				if ((row < 9 && col < 9) || (row < 9 && col > size - 10) || (row > size - 10 && col < 9)) {
					continue;
				}
				addAlignmentPattern(matrix, reserved, row, col);
			}
		}
	}

	// Add timing patterns
	for (var i = 8; i < size - 8; i++) {
		var bit = i % 2 === 0 ? 1 : 0;
		if (!reserved[6][i]) {
			matrix[6][i] = bit;
			reserved[6][i] = true;
		}
		if (!reserved[i][6]) {
			matrix[i][6] = bit;
			reserved[i][6] = true;
		}
	}

	// Add dark module
	matrix[size - 8][8] = 1;
	reserved[size - 8][8] = true;

	// Reserve format info areas
	for (var i = 0; i < 9; i++) {
		reserved[8][i] = true;
		reserved[i][8] = true;
		if (i < 8) {
			reserved[8][size - 1 - i] = true;
			reserved[size - 1 - i][8] = true;
		}
	}

	// Reserve version info areas (version >= 7)
	if (version >= 7) {
		for (var i = 0; i < 6; i++) {
			for (var j = 0; j < 3; j++) {
				reserved[i][size - 11 + j] = true;
				reserved[size - 11 + j][i] = true;
			}
		}
	}

	// Create and interleave data
	var data = createDataCodewords(text, version);
	var allData = interleaveBlocks(data, version);

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
	for (var col = size - 1; col >= 0; col -= 2) {
		if (col === 6) col = 5;
		for (var row = up ? size - 1 : 0; up ? row >= 0 : row < size; row += up ? -1 : 1) {
			for (var c = 0; c < 2; c++) {
				var x = col - c;
				if (x >= 0 && !reserved[row][x] && bitIdx < bits.length) {
					matrix[row][x] = bits[bitIdx++];
				}
			}
		}
		up = !up;
	}

	// Apply mask pattern 0 and add format info
	applyMaskAndFormat(matrix, reserved, size, version);

	return { matrix: matrix, size: size, version: version };
}

function addFinderPattern(matrix, reserved, row, col, size) {
	for (var r = -1; r <= 7; r++) {
		for (var c = -1; c <= 7; c++) {
			var rr = row + r;
			var cc = col + c;
			if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;

			var bit = 0;
			if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
				if (r === 0 || r === 6 || c === 0 || c === 6 ||
					(r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
					bit = 1;
				}
			}
			matrix[rr][cc] = bit;
			reserved[rr][cc] = true;
		}
	}
}

function addAlignmentPattern(matrix, reserved, row, col) {
	for (var r = -2; r <= 2; r++) {
		for (var c = -2; c <= 2; c++) {
			var bit = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) ? 1 : 0;
			matrix[row + r][col + c] = bit;
			reserved[row + r][col + c] = true;
		}
	}
}

function applyMaskAndFormat(matrix, reserved, size, version) {
	// Apply mask pattern 0: (row + col) % 2 === 0
	for (var row = 0; row < size; row++) {
		for (var col = 0; col < size; col++) {
			if (!reserved[row][col]) {
				if ((row + col) % 2 === 0) {
					matrix[row][col] ^= 1;
				}
			}
		}
	}

	// Format info for mask 0 and EC level L: 111011111000100
	var formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

	// Place format info
	var formatPositions1 = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]];
	var formatPositions2 = [[8, size - 1], [8, size - 2], [8, size - 3], [8, size - 4], [8, size - 5], [8, size - 6], [8, size - 7], [8, size - 8], [size - 7, 8], [size - 6, 8], [size - 5, 8], [size - 4, 8], [size - 3, 8], [size - 2, 8], [size - 1, 8]];

	for (var i = 0; i < 15; i++) {
		matrix[formatPositions1[i][0]][formatPositions1[i][1]] = formatBits[i];
		matrix[formatPositions2[i][0]][formatPositions2[i][1]] = formatBits[i];
	}

	// Version info (for version >= 7)
	if (version >= 7) {
		var versionInfo = getVersionInfo(version);
		var vIdx = 0;
		for (var i = 0; i < 6; i++) {
			for (var j = 0; j < 3; j++) {
				var bit = (versionInfo >> vIdx) & 1;
				matrix[i][size - 11 + j] = bit;
				matrix[size - 11 + j][i] = bit;
				vIdx++;
			}
		}
	}
}

function getVersionInfo(version) {
	var versionInfos = {
		7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3, 11: 0x0BBF6, 12: 0x0C762, 13: 0x0D847, 14: 0x0E60D,
		15: 0x0F928, 16: 0x10B78, 17: 0x1145D, 18: 0x12A17, 19: 0x13532, 20: 0x149A6
	};
	return versionInfos[version] || 0;
}

// Generate SVG
function generateSVG(text, displaySize) {
	displaySize = displaySize || 250;

	try {
		var result = createMatrix(text);
		var matrix = result.matrix;
		var size = result.size;
		var quietZone = 4;
		var totalSize = size + quietZone * 2;
		var moduleSize = displaySize / totalSize;

		var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + displaySize + ' ' + displaySize + '" width="' + displaySize + '" height="' + displaySize + '">';
		svg += '<rect width="100%" height="100%" fill="white"/>';

		for (var row = 0; row < size; row++) {
			for (var col = 0; col < size; col++) {
				if (matrix[row][col] === 1) {
					var x = (col + quietZone) * moduleSize;
					var y = (row + quietZone) * moduleSize;
					svg += '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + moduleSize.toFixed(2) + '" height="' + moduleSize.toFixed(2) + '" fill="black"/>';
				}
			}
		}

		svg += '</svg>';
		return svg;
	} catch (e) {
		console.error('QR generation error:', e);
		return null;
	}
}

return baseclass.extend({
	/**
	 * Generate QR code as SVG string
	 * @param {string} text - Text to encode (up to ~300 bytes)
	 * @param {number} size - Display size in pixels (default: 250)
	 * @returns {string} SVG markup or null on error
	 */
	generateSVG: function(text, size) {
		return generateSVG(text, size);
	},

	/**
	 * Generate QR code as data URL
	 * @param {string} text - Text to encode
	 * @param {number} size - Display size in pixels
	 * @returns {string} Data URL for img src
	 */
	generateDataURL: function(text, size) {
		var svg = generateSVG(text, size);
		if (!svg) return null;
		return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
	},

	/**
	 * Render QR code to a DOM element
	 * @param {HTMLElement} container - Container element
	 * @param {string} text - Text to encode
	 * @param {number} size - Display size in pixels
	 */
	render: function(container, text, size) {
		var svg = generateSVG(text, size);
		if (svg) {
			container.innerHTML = svg;
		} else {
			container.innerHTML = '<div style="color:red;padding:20px;">QR generation failed - text too long</div>';
		}
	},

	/**
	 * Get maximum capacity for current implementation
	 * @returns {number} Maximum bytes that can be encoded
	 */
	getMaxCapacity: function() {
		return VERSION_CAPACITIES[20]; // 858 bytes
	}
});
