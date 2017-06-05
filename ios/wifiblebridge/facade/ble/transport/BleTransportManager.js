var util = require('util');
var log4js = require('log4js');
var bleno = require('bleno');
var crc = require('crc');
var TransportManager = require('./TransportManager');
var ScannerBleService = require('./gatt/ScannerBleService');
var RequestCharacteristic = require('./gatt/RequestCharacteristic');
var ResponseCharacteristic = require('./gatt/ResponseCharacteristic');
var ResponseMessage = require('./message/ResponseMessage');
var CorrelationIdMatchingError = require('../error/CorrelationIdMatchingError');
var TimeoutError = require('../error/TimeoutError');

var LOGGER = log4js.getLogger('BleTransportManager');

/**
 * Manage communication over BLE.
 *
 * @class
 * @implements {TransportManager}
 */
function BleTransportManager() {
	/**
	 * @private
	 * @type {Array.<function(action: RequestAction, correlationId: Number, payload: Buffer)>}
	 */
	this.requestHandlers = [];
	
	/**
	 * @private
	 * @type {?RequestCharacteristic}
	 */
	this.requestCharacteristic = null;

	/**
	 * @private
	 * @type {?ResponseCharacteristic}
	 */
	this.responseCharacteristic = null;

	/**
	 * @private
	 * @type {?RequestMessage}
	 */
	this.lastReceivedRequestMessage = null;

	/**
	 * @private
	 * @type {Number}
	 */
	this.lastReceivedRequestMessageTimestamp = 0;

	/**
	 * @private
	 * @type {Number}
	 */
	this.lastSendResponseMessageTimestamp = 0;
}
util.inherits(BleTransportManager, TransportManager);

/**
 * Connection interval of the iPhone 6 (conservative number).
 *
 * @private
 * @static
 * @constant
 * @type {Number}
 */
BleTransportManager.BLE_CONNECTION_INTERVAL_MS = 30;

/**
 * Time to wait after the last message of a 2048 byte buffer was sent to the client in order to start doing something else.
 *
 * @private
 * @static
 * @constant
 * @type {Number}
 */
BleTransportManager.CLIENT_MSG_PROCESSING_TIME_MS = BleTransportManager.BLE_CONNECTION_INTERVAL_MS * 50;

/**
 * Maximum time to wait for an acknowledgement message.
 *
 * @private
 * @static
 * @constant
 * @type {Number}
 */
BleTransportManager.WAITING_FOR_ACK_TIMEOUT_MS = BleTransportManager.BLE_CONNECTION_INTERVAL_MS * 50;

/**
 * @private
 * @static
 * @constant
 * @type {BleTransportManager}
 */
BleTransportManager.INSTANCE = new BleTransportManager();

/**
 * @static
 * @constant
 * @returns {BleTransportManager} Current instance.
 */
BleTransportManager.getInstance = function() {
	return BleTransportManager.INSTANCE;
}

BleTransportManager.prototype.initialize = function() {
	var self = this;
	LOGGER.info('Initialize the BleTransportManager...');
	
	this.requestCharacteristic = new RequestCharacteristic(function(requestMessage) {
		var isNewRequest = !self.lastReceivedRequestMessage || 
			self.lastReceivedRequestMessage.correlationId !== requestMessage.correlationId;
		self.lastReceivedRequestMessage = requestMessage;
		self.lastReceivedRequestMessageTimestamp = Date.now();
		LOGGER.debug('Receive a request message (isNewRequest = ' + isNewRequest + '): ', requestMessage, ', payload: ', 
			self.prepareBufferForLogger(requestMessage.payload, 'DEBUG'), ', ack: ', 
			self.prepareBufferForLogger(requestMessage.ack, 'DEBUG'));
		
		if (isNewRequest) {
			for (var i = 0; i < self.requestHandlers.length; i++) {
				try {
					self.requestHandlers[i](requestMessage.action, requestMessage.correlationId, requestMessage.payload);
				} catch (e) {
					LOGGER.error('An error occurred when invoking a request handler.', e);
				}
			}
		}
	});
	this.responseCharacteristic = new ResponseCharacteristic();

    bleno.on('stateChange', function(state) {
        LOGGER.info('on -> stateChange: ' + state + ', address = ' + bleno.address);
        if (state === 'poweredOn') {
            bleno.startAdvertising('scannerbridge', [ScannerBleService.UUID]);
        } else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('accept', function(clientAddress) {
        LOGGER.info('on -> accept, client: ' + clientAddress);

        bleno.updateRssi();
    });

    bleno.on('disconnect', function(clientAddress) {
        LOGGER.info('on -> disconnect, client: ' + clientAddress);
    });

    bleno.on('rssiUpdate', function(rssi) {
        LOGGER.info('on -> rssiUpdate: ' + rssi);
    });

    bleno.on('mtuChange', function(mtu) {
        LOGGER.info('on -> mtuChange: ' + mtu);
    });

    bleno.on('advertisingStart', function(error) {
        LOGGER.info('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

        if (!error) {
            bleno.setServices([new ScannerBleService(self.requestCharacteristic, self.responseCharacteristic)]);
        }
    });

    bleno.on('advertisingStop', function() {
        LOGGER.info('on -> advertisingStop');
    });

    bleno.on('servicesSet', function(error) {
        LOGGER.info('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
    });
	
	LOGGER.info('BleTransportManager initialized with success!');
}

BleTransportManager.prototype.registerRequestHandler = function(requestHandler) {
	this.requestHandlers.push(requestHandler);
}

BleTransportManager.prototype.respondWithObject = function(responseObject, correlationId, callback) {
	LOGGER.debug('Respond with the object (correlationId = ' + correlationId + '): ', responseObject);
	this.respondWithBuffer(new Buffer(JSON.stringify(responseObject), 'utf-8'), correlationId, callback);
}

BleTransportManager.prototype.respondWithBuffer = function(responseBuffer, correlationId, callback) {
	var self = this;
	LOGGER.debug('Respond with the buffer (correlationId = ' + correlationId + '): ',
		this.prepareBufferForLogger(responseBuffer, 'DEBUG'));
	
	// Create a bigger buffer that contain the response length (4 bytes), the response itself and a CRC8 (1 byte)
	var totalLength = 4 + responseBuffer.length + 1;
	var lengthWithResponseBufferWithCrc8 = new Buffer(totalLength);
	lengthWithResponseBufferWithCrc8.writeUInt32BE(totalLength, 0);
	responseBuffer.copy(lengthWithResponseBufferWithCrc8, 4, 0, responseBuffer.length);
	var totalCrc = crc.crc8(responseBuffer);
	lengthWithResponseBufferWithCrc8.writeUInt8(totalCrc, 4 + responseBuffer.length);
	LOGGER.debug('Create a bigger buffer of ' + lengthWithResponseBufferWithCrc8.length + ' bytes ' +
		'containing the response, the total length (' + totalLength + ') and the CRC8 (' + totalCrc + ').');
	
	// Split the response into buffers of 2048 bytes
	var buffers = /** Array.<Buffer> */ [];
	var nbBuffers = Math.ceil(lengthWithResponseBufferWithCrc8.length / 2048);
	for (var i = 0; i < nbBuffers; i++) {
		var startIndex = i * 2048;
		var endIndex = startIndex + 2048;
		if (endIndex > lengthWithResponseBufferWithCrc8.length) {
			endIndex = lengthWithResponseBufferWithCrc8.length;
		}
		var buffer = lengthWithResponseBufferWithCrc8.slice(startIndex, endIndex);
		buffers.push(buffer);
	}
	LOGGER.debug('The response has been split in ' + nbBuffers + ' transmission window buffers: ', buffers);
	
	// Send the buffers one by one
	var index = 0;
	var parityBit = false;
	var sendBufferCallback = function (error) {
		if (error) {
			callback(error);
		} else {
			index++;
			if (index >= nbBuffers) {
				LOGGER.info('Response sent with success.');
				callback(null);
			} else {
				LOGGER.debug('Send the transmission window buffer (index = ' + index + ').');
				self.sendBuffer(buffers[index], correlationId, parityBit, sendBufferCallback);
				parityBit = !parityBit;
			}
		}
	};
	LOGGER.debug('Send the transmission window buffer (index = ' + index + ').');
	this.sendBuffer(buffers[index], correlationId, parityBit, sendBufferCallback);
	parityBit = !parityBit;
}

/**
 * Send a buffer of 2048 bytes.
 *
 * @private
 * @param {Buffer} buffer Buffer of 2048 bytes.
 * @param {Number} correlationId Correlation ID of the request that triggered this response.
 * @param {Boolean} parityBit Tell whether the current buffer is even or odd.
 * @param {function(error: ?Error)} callback Function called when the buffer is sent or when an error occurred.
 */
BleTransportManager.prototype.sendBuffer = function(buffer, correlationId, parityBit, callback) {
	var self = this;
	LOGGER.debug('Send the transmission window buffer ' +
		'(correlationId = ' + correlationId + ', parityBit = ' + parityBit + '): ', buffer);
	
	// Prepare all the response messages: split the buffer into packets of 18 bytes.
	var responseMessages = /** @type {Array.<ResponseMessage>} */ [];
	var nbResponseMessages = Math.ceil(buffer.length / 18);
	for (var i = 0; i < nbResponseMessages; i++) {
		var startIndex = i * 18;
		var endIndex = startIndex + 18;
		var payload = new Buffer(18);
		for (var j = 0; j < 18; j++) {
			payload[j] = 0;
		}
		buffer.copy(payload, 0, startIndex, endIndex);
		//var payload = buffer.slice(startIndex, endIndex);
		var crcValue = crc.crc8(payload);
		responseMessages.push(new ResponseMessage(parityBit, i, payload, crcValue));
	}
	LOGGER.debug('The transmission window buffer has been split in ' + nbResponseMessages + 
		' packets: ', responseMessages);
	
	// Send all remaining response messages
	var sendResponseMessagesCallback = function (error) {
		if (error) {
			callback(error);
			return;
		}
		
		// Wait for the acknowledgement message from the client
		LOGGER.debug('Waiting for an acknowledgement message...');
		self.waitForAcknowledgement(function(isTimeout) {
			// Stop here if a timeout occurred
			if (isTimeout) {
				callback(new TimeoutError(
					'No acknowledgement message received after ' + BleTransportManager.WAITING_FOR_ACK_TIMEOUT_MS + 'ms.'));
				return;
			}
			
			// Stop there if the correlation ID is different
			if (correlationId !== self.lastReceivedRequestMessage.correlationId) {
				callback(new CorrelationIdMatchingError(
					'The response correlation ID (' + correlationId + ') doesn\'t match ' + 
					'the request one (' + self.lastReceivedRequestMessage.correlationId + ').'));
				return;
			}
			
			// Check which packet is in error
			var ack = self.lastReceivedRequestMessage.ack;
			var erroneousPacketIndexes = [];
			for (var i = 0; i < responseMessages.length; i++) {
				var ackByte = ack[Math.floor(i / 8)];
				var mask = 0b10000000 >> (i % 8);
				var isBitSet  = (ackByte & mask) != 0;
				if (!isBitSet) {
					erroneousPacketIndexes.push(i);
				}
			}
			if (erroneousPacketIndexes.length === 0) {
				LOGGER.debug('All packets of the transmission window have been acknowledged.');
				// No error, we have finished
				callback();
				return;
			}
			
			// Keep all the non-acknowledged response messages
			var responseMessagesToResend = /** @type {Array.<ResponseMessage>} */ [];
			for (i = 0; i < erroneousPacketIndexes.length; i++) {
				var erroneousPacketIndex = erroneousPacketIndexes[i];
				for (var j = 0; j < responseMessages.length; j++) {
					var responseMessage = responseMessages[j];
					if (responseMessage.packetIndex === erroneousPacketIndex) {
						responseMessagesToResend.push(responseMessage);
						break;
					}
				}
			}
			responseMessages = responseMessagesToResend;
			LOGGER.debug('There are ' + responseMessagesToResend.length + ' unacknowledged packets to resend: ',
				responseMessagesToResend);
			
			// Resend the non-acknowledged response messages
			self.sendResponseMessages(responseMessagesToResend, sendResponseMessagesCallback);
		});
	};
	this.sendResponseMessages(responseMessages, sendResponseMessagesCallback);
}

/**
 * Send the given response messages as fast as possible without checking acknowledgements.
 *
 * @private
 * @param {Array.<ResponseMessage>} responseMessages
 * @param {function(error: ?Error)} callback
 *     Function called when all the response message are sent
 *     or when an error occurred.
 */
BleTransportManager.prototype.sendResponseMessages = function(responseMessages, callback) {
	var self = this;
	LOGGER.debug('Send ' + responseMessages.length + ' packets of the current transmission window: ', responseMessages);
	
	var index = 0;
	var sendResponseMessageCallback = function(error) {
		if (error) {
			callback(error);
		} else {
			// Wait a bit before sending the next packet in order to avoid too many loss
			setTimeout(function() {
				index++;
				
				if (index < responseMessages.length) {
					LOGGER.debug('Send the packet (index = ' + index + '): ', responseMessages[index], ', payload = ',
						self.prepareBufferForLogger(responseMessages[index].payload, 'DEBUG'));
					self.lastSendResponseMessageTimestamp = Date.now();
					self.responseCharacteristic.sendResponseMessage(
						responseMessages[index], sendResponseMessageCallback);
				} else {
					// All response message sent!
					callback();
				}
			}, BleTransportManager.BLE_CONNECTION_INTERVAL_MS / 3); // See https://github.com/Krb686/nanotimer
		}
	};
	LOGGER.debug('Send the packet (index = ' + index + '): ', responseMessages[index], ', payload = ',
		this.prepareBufferForLogger(responseMessages[index].payload, 'DEBUG'));
	this.lastSendResponseMessageTimestamp = Date.now();
	this.responseCharacteristic.sendResponseMessage(responseMessages[index], sendResponseMessageCallback);
}

/**
 * Wait for a request message (that contains acknoledgement informartion).
 *
 * @private
 * @param {function(isTimeout: boolean)} callback Function called when an acknoledgement message has been received.
 */
BleTransportManager.prototype.waitForAcknowledgement = function(callback) {
	var self = this;
	
	setTimeout(function() {
		var startWaitingTime = Date.now();
	
		var callWhenAckReceived = function() {
			var isTimeout = Date.now() - startWaitingTime >= BleTransportManager.WAITING_FOR_ACK_TIMEOUT_MS;
			if (self.lastSendResponseMessageTimestamp <= self.lastReceivedRequestMessageTimestamp) {
				callback(false);
			} else if (isTimeout) {
				LOGGER.debug('Timeout error: no acknowledgement message came after ' + 
					BleTransportManager.WAITING_FOR_ACK_TIMEOUT_MS + 'ms.');
				callback(true);
			} else {
				setTimeout(callWhenAckReceived, BleTransportManager.BLE_CONNECTION_INTERVAL_MS);
			}
		};
		setTimeout(callWhenAckReceived, BleTransportManager.BLE_CONNECTION_INTERVAL_MS);
	}, BleTransportManager.CLIENT_MSG_PROCESSING_TIME_MS)
}


/**
 * Display the buffer in a string by converting each byte in decimal string.
 *
 * @private
 * @param {Buffer} buffer Buffer to prepare.
 * @param {string} logLevel Target log level in order to avoid wasting resources (e.g. 'DEBUG').
 * @returns {string} Prepared buffer.
 */
BleTransportManager.prototype.prepareBufferForLogger = function (buffer, logLevel) {
	if (LOGGER.isLevelEnabled(logLevel)) {
		var stringRepresentation = '';
		for (var i = 0; i < buffer.length; i++) {
			if (i == 0) {
				stringRepresentation += '[';
			} else {
				stringRepresentation += ',';
			}
			stringRepresentation += '' + Number(buffer[i]);
		}
		stringRepresentation += ']';
		return stringRepresentation;
	} else {
		return 'Buffer';
	}
}

module.exports = BleTransportManager;