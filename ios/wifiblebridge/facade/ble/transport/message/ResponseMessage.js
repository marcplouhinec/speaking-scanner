/**
 * BLE request sent to the application.
 *
 * @constructor
 * @param {boolean} parityBit (first bit in first byte)
 * @param {number} packetIndex (7 last bits in first byte)
 * @param {Buffer} payload (18 bytes)
 * @param {number} crc (1 byte)
 */
function ResponseMessage(parityBit, packetIndex, payload, crc) {
	
	/**
 	* 1 bit (first bit in first byte).
 	*
 	* @type {boolean}
 	*/
	this.parityBit = parityBit;
	
	/**
	 * 7 bits (7 last bits in first byte).
	 *
	 * @type {number}
	 */
	this.packetIndex = packetIndex;

	/**
	 * 18 bytes
	 *
	 * @type {Buffer}
	 */
	this.payload = payload;

	/**
	 * 1 byte
	 *
	 * @type {number}
	 */
	this.crc = crc;
	
}

module.exports = ResponseMessage;