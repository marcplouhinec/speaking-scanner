/**
 * BLE request sent to the application.
 *
 * @constructor
 * @param {RequestAction} action (first byte - first 3 bits)
 * @param {number} correlationId (first byte - last 5 bits)
 * @param {Buffer} payload (4 bytes)
 * @param {Buffer} ack (15 bytes)
 */
function RequestMessage(action, correlationId, payload, ack) {
	
	/**
	 * first byte - first 3 bits
	 *
	 * @type {RequestAction}
	 */
	this.action = action;
	
	/**
	 * first byte - first byte - last 5 bits
	 *
	 * @type {number}
	 */
	this.correlationId = correlationId;
	
	/**
	 * 4 bytes
	 *
	 * @type {Buffer}
	 */
	this.payload = payload;
	
	/**
	 * 15 bytes (first bit on the left = packet index 0)
	 *
	 * @type {Buffer}
	 */
	this.ack = ack;
	
}

module.exports = RequestMessage;