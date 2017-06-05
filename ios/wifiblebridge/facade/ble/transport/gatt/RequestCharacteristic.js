var bleno = require('bleno');
var util = require('util');
var log4js = require('log4js');
var RequestMessage = require('../message/RequestMessage');

var LOGGER = log4js.getLogger('RequestCharacteristic');

/**
 * Characteristic that contains requests sent by the client.
 *
 * @constructor
 * @augments bleno.Characteristic
 * @param {function(requestMessage: RequestMessage)} requestMessageListener
 */
function RequestCharacteristic(requestMessageListener) {
	/**
	 * @private
	 * @type {function(requestMessage: RequestMessage)}
	 */
	this.requestMessageListener = requestMessageListener;
	
    RequestCharacteristic.super_.call(this, {
        uuid: RequestCharacteristic.UUID,
        properties: ['write', 'writeWithoutResponse']
    });
};

util.inherits(RequestCharacteristic, bleno.Characteristic);

/**
 * Characteristic UUID to be sent via BLE.
 *
 * @constant
 * @type {String}
 */
RequestCharacteristic.UUID = 'c69cbca5b78e461ab396ad9744e65011';

/**
 * Method called when a request has been sent by the client.
 *
 * @param {Buffer} data
 * @param {number} offset
 * @param {boolean} withoutResponse
 * @param {function{result}} callback
 */
RequestCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    LOGGER.info('RequestCharacteristic write request: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);

	// Prepare the RequestMessage and send it
	var action = (data[0] & 0b11100000) >> 5; // Keep the 3 first bits
	var correlationId = data[0] & 0b00011111; // Keep the last 5 bits
	var payload = data.slice(1, 1 + 4);
	var ack = data.slice(5);
	var requestMessage = new RequestMessage(action, correlationId, payload, ack);
	this.requestMessageListener(requestMessage);
	
    callback(this.RESULT_SUCCESS);
};

module.exports = RequestCharacteristic;
