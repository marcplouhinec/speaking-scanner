var bleno = require('bleno');
var util = require('util');
var log4js = require('log4js');
var ClientHasNotSubscribedError = require('../../error/ClientHasNotSubscribedError');

var LOGGER = log4js.getLogger('ResponseCharacteristic');

/**
 * Characteristic that contains responses for the client.
 *
 * @constructor
 * @augments bleno.Characteristic
 */
function ResponseCharacteristic() {
	
	/**
	 * @private
	 * @type {boolean}
	 */
	this.hasClientSubscribed = false;
	
	/**
	 * @private
	 * @type {?function(data: Buffer)}
	 */
	this.updateValueCallback = null;
	
	
	/**
	 * Listeners fired only once when the next {@link #onNotify} method is called.
	 *
	 * @private
	 * @type {Array.<function>}
	 */
	this.onNextDataNotifiedListeners = [];
	
    ResponseCharacteristic.super_.call(this, {
        uuid: ResponseCharacteristic.UUID,
        properties: ['notify']
    });
};

util.inherits(ResponseCharacteristic, bleno.Characteristic);

/**
 * Characteristic UUID to be sent via BLE.
 *
 * @constant
 * @type {String}
 */
ResponseCharacteristic.UUID = '7d9813b43a63413681f91b83f2106fc2';

/**
 * Method called when the client subscribes to the characteristic for notification.
 * Data can only be sent to the client if it is subscribed.
 *
 * @param {number} maxValueSize maximum data size
 * @param {function} updateValueCallback callback to call when value has changed
 */
ResponseCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    LOGGER.info('ResponseCharacteristic subscribe');
	
	this.hasClientSubscribed = true;
	this.updateValueCallback = updateValueCallback;
};


/**
 * Method called when the client unsubscribes to the characteristic for notification.
 * This is the opposite of {@link #onSubscribe}.
 */
ResponseCharacteristic.prototype.onUnsubscribe = function() {
    LOGGER.info('ResponseCharacteristic unsubscribe');
	
	this.hasClientSubscribed = false;
	this.updateValueCallback = null;
};

/**
 * Method called when data has been sent to the client.
 */
ResponseCharacteristic.prototype.onNotify = function() {
    LOGGER.info('ResponseCharacteristic on notify');
	
	var listeners = this.onNextDataNotifiedListeners;
	this.onNextDataNotifiedListeners = [];
	
	for (var i = 0; i < listeners.length; i++) {
		try {
			listeners[i]();
		} catch (e) {
			LOGGER.error('Error thrown when an onNotify listener was called.', e);
		}
	}
};

/**
 * Send the given response message to the client.
 *
 * @param {ResponseMessage} responseMessage
 * @param {function(error: ?Error)} callback Function called when the message is sent or an error occurred.
 */
ResponseCharacteristic.prototype.sendResponseMessage = function(responseMessage, callback) {
    LOGGER.info('ResponseCharacteristic.sendResponseMessage packet index = ' + responseMessage.packetIndex);
	
	if (!this.hasClientSubscribed) {
		callback(new ClientHasNotSubscribedError('The client has not subscribed to the ResponseCharacteristic.'));
		return;
	}
	
	// Build the message to send
    var message = new Buffer(20);
	var firstByte = (responseMessage.parityBit ? 0b10000000 : 0) + responseMessage.packetIndex
    message.writeUInt8(firstByte, 0);
	responseMessage.payload.copy(message, 1, 0, responseMessage.payload.length);
    message.writeUInt8(responseMessage.crc, 19);
	
	// Send the message
	this.updateValueCallback(message);
	
	// Wait for the data to be sent
	this.onNextDataNotifiedListeners.push(callback);
};

module.exports = ResponseCharacteristic;
