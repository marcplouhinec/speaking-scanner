const _ = require('lodash');
const log4js = require('log4js');
const bleno = require('bleno');
const crc = require('crc');
const TransportManager = require('../TransportManager');
const ScannerBleService = require('../gatt/ScannerBleService');
const RequestCharacteristic = require('../gatt/RequestCharacteristic');
const ResponseCharacteristic = require('../gatt/ResponseCharacteristic');
const ResponseMessage = require('../message/ResponseMessage');
const CorrelationIdMatchingError = require('../../error/CorrelationIdMatchingError');
const TimeoutError = require('../../error/TimeoutError');

const LOGGER = log4js.getLogger('BleTransportManager');

/** Connection interval of the iPhone 6 (conservative number). */
const BLE_CONNECTION_INTERVAL_MS = 30;

/** Time to wait after the last message of a 2048 byte buffer was sent to the client in order to start doing something else. */
const CLIENT_MSG_PROCESSING_TIME_MS = BLE_CONNECTION_INTERVAL_MS * 50;

/** Maximum time to wait for an acknowledgement message. */
const WAITING_FOR_ACK_TIMEOUT_MS = BLE_CONNECTION_INTERVAL_MS * 50;

/**
 * Manage communication over BLE.
 *
 * @implements {TransportManager}
 * @author Marc Plouhinec
 */
class BleTransportManager extends TransportManager {

    constructor() {
        super();

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

    /**
     * Configure the BLE stack.
     */
    initialize() {
        LOGGER.info('Initialize the BleTransportManager...');

        this.requestCharacteristic = new RequestCharacteristic(requestMessage => {
            const isNewRequest = !this.lastReceivedRequestMessage ||
                this.lastReceivedRequestMessage.correlationId !== requestMessage.correlationId;
            this.lastReceivedRequestMessage = requestMessage;
            this.lastReceivedRequestMessageTimestamp = Date.now();
            LOGGER.debug('Receive a request message (isNewRequest = ' + isNewRequest + '): ', requestMessage, ', payload: ',
                this.prepareBufferForLogger(requestMessage.payload, 'DEBUG'), ', ack: ',
                this.prepareBufferForLogger(requestMessage.ack, 'DEBUG'));

            if (isNewRequest) {
                this.requestHandlers.forEach(requestHandler => {
                    try {
                        requestHandler(requestMessage.action, requestMessage.correlationId, requestMessage.payload);
                    } catch (e) {
                        LOGGER.error('An error occurred when invoking a request handler.', e);
                    }
                });
            }
        });
        this.responseCharacteristic = new ResponseCharacteristic();

        bleno.on('stateChange', state => {
            LOGGER.info('on -> stateChange: ' + state + ', address = ' + bleno.address);
            if (state === 'poweredOn') {
                bleno.startAdvertising('scannerbridge', [ScannerBleService.getUUID()]);
            } else {
                bleno.stopAdvertising();
            }
        });

        bleno.on('accept', clientAddress => {
            LOGGER.info('on -> accept, client: ' + clientAddress);

            bleno.updateRssi();
        });

        bleno.on('disconnect', clientAddress => {
            LOGGER.info('on -> disconnect, client: ' + clientAddress);
        });

        bleno.on('rssiUpdate', rssi => {
            LOGGER.info('on -> rssiUpdate: ' + rssi);
        });

        bleno.on('mtuChange', mtu => {
            LOGGER.info('on -> mtuChange: ' + mtu);
        });

        bleno.on('advertisingStart', error => {
            LOGGER.info('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

            if (!error) {
                bleno.setServices([new ScannerBleService(this.requestCharacteristic, this.responseCharacteristic)]);
            }
        });

        bleno.on('advertisingStop', () => {
            LOGGER.info('on -> advertisingStop');
        });

        bleno.on('servicesSet', error => {
            LOGGER.info('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
        });

        LOGGER.info('BleTransportManager initialized with success!');
    }

    registerRequestHandler(requestHandler) {
        this.requestHandlers.push(requestHandler);
    }

    respondWithObject(responseObject, correlationId, callback) {
        LOGGER.debug('Respond with the object (correlationId = ' + correlationId + '): ', responseObject);
        this.respondWithBuffer(new Buffer(JSON.stringify(responseObject), 'utf-8'), correlationId, callback);
    }

    respondWithBuffer(responseBuffer, correlationId, callback) {
        LOGGER.debug('Respond with the buffer (correlationId = ' + correlationId + '): ',
            this.prepareBufferForLogger(responseBuffer, 'DEBUG'));

        // Create a bigger buffer that contain the response length (4 bytes), the response itself and a CRC8 (1 byte)
        const totalLength = 4 + responseBuffer.length + 1;
        const lengthWithResponseBufferWithCrc8 = new Buffer(totalLength);
        lengthWithResponseBufferWithCrc8.writeUInt32BE(totalLength, 0);
        responseBuffer.copy(lengthWithResponseBufferWithCrc8, 4, 0, responseBuffer.length);
        const totalCrc = crc.crc8(responseBuffer);
        lengthWithResponseBufferWithCrc8.writeUInt8(totalCrc, 4 + responseBuffer.length);
        LOGGER.debug('Create a bigger buffer of ' + lengthWithResponseBufferWithCrc8.length + ' bytes ' +
            'containing the response, the total length (' + totalLength + ') and the CRC8 (' + totalCrc + ').');

        // Split the response into buffers of 2048 bytes
        const nbBuffers = Math.ceil(lengthWithResponseBufferWithCrc8.length / 2048);
        const buffers = /** @type {Array.<Buffer>} */ _.map(_.range(nbBuffers), i => {
            const startIndex = i * 2048;
            let endIndex = startIndex + 2048;
            if (endIndex > lengthWithResponseBufferWithCrc8.length) {
                endIndex = lengthWithResponseBufferWithCrc8.length;
            }
            return lengthWithResponseBufferWithCrc8.slice(startIndex, endIndex);
        });
        LOGGER.debug('The response has been split in ' + nbBuffers + ' transmission window buffers: ', buffers);

        // Send the buffers one by one
        let index = 0;
        let parityBit = false;
        const sendBufferCallback = error => {
            if (error) {
                callback(error);
            } else {
                index++;
                if (index >= nbBuffers) {
                    LOGGER.info('Response sent with success.');
                    callback(null);
                } else {
                    LOGGER.debug('Send the transmission window buffer (index = ' + index + ').');
                    this.sendBuffer(buffers[index], correlationId, parityBit, sendBufferCallback);
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
     * @param {function(error: Error?)} callback Function called when the buffer is sent or when an error occurred.
     */
    sendBuffer(buffer, correlationId, parityBit, callback) {
        LOGGER.debug('Send the transmission window buffer ' +
            '(correlationId = ' + correlationId + ', parityBit = ' + parityBit + '): ', buffer);

        // Prepare all the response messages: split the buffer into packets of 18 bytes.
        const nbResponseMessages = Math.ceil(buffer.length / 18);
        let responseMessages = /** @type {Array.<ResponseMessage>} */ _.map(_.range(nbResponseMessages), i => {
            const startIndex = i * 18;
            const endIndex = startIndex + 18;
            const payload = new Buffer(18);
            payload.fill(0);
            buffer.copy(payload, 0, startIndex, endIndex);
            const crcValue = crc.crc8(payload);
            return new ResponseMessage(parityBit, i, payload, crcValue);
        });
        LOGGER.debug('The transmission window buffer has been split in ' + nbResponseMessages +
            ' packets: ', responseMessages);

        // Send all remaining response messages
        const sendResponseMessagesCallback = error => {
            if (error) {
                callback(error);
                return;
            }

            // Wait for the acknowledgement message from the client
            LOGGER.debug('Waiting for an acknowledgement message...');
            this.waitForAcknowledgement(isTimeout => {
                // Stop here if a timeout occurred
                if (isTimeout) {
                    callback(new TimeoutError(
                        'No acknowledgement message received after ' + WAITING_FOR_ACK_TIMEOUT_MS + 'ms.'));
                    return;
                }

                // Stop there if the correlation ID is different
                if (correlationId !== this.lastReceivedRequestMessage.correlationId) {
                    callback(new CorrelationIdMatchingError(
                        'The response correlation ID (' + correlationId + ') doesn\'t match ' +
                        'the request one (' + this.lastReceivedRequestMessage.correlationId + ').'));
                    return;
                }

                // Check which packet is in error
                const ack = this.lastReceivedRequestMessage.ack;
                const erroneousPacketIndexes = _.filter(responseMessages, (responseMessage, i) => {
                    const ackByte = ack[Math.floor(i / 8)];
                    const mask = 0b10000000 >> (i % 8);
                    const isBitSet = (ackByte & mask) !== 0;
                    return !isBitSet;
                });
                if (erroneousPacketIndexes.length === 0) {
                    LOGGER.debug('All packets of the transmission window have been acknowledged.');
                    // No error, we have finished
                    callback();
                    return;
                }

                // Keep all the non-acknowledged response messages
                /** @type {Array.<ResponseMessage>} */
                const responseMessagesToResend = _.flatMap(erroneousPacketIndexes, erroneousPacketIndex => {
                    return _.filter(responseMessages, responseMessage => responseMessage.packetIndex === erroneousPacketIndex);
                });
                responseMessages = responseMessagesToResend;
                LOGGER.debug('There are ' + responseMessagesToResend.length + ' unacknowledged packets to resend: ',
                    responseMessagesToResend);

                // Resend the non-acknowledged response messages
                this.sendResponseMessages(responseMessagesToResend, sendResponseMessagesCallback);
            });
        };
        this.sendResponseMessages(responseMessages, sendResponseMessagesCallback);
    }

    /**
     * Send the given response messages as fast as possible without checking acknowledgements.
     *
     * @private
     * @param {Array.<ResponseMessage>} responseMessages
     * @param {function(error: Error?)} callback
     *     Function called when all the response message are sent
     *     or when an error occurred.
     */
    sendResponseMessages(responseMessages, callback) {
        LOGGER.debug('Send ' + responseMessages.length + ' packets of the current transmission window: ', responseMessages);

        let index = 0;
        const sendResponseMessageCallback = error => {
            if (error) {
                callback(error);
            } else {
                // Wait a bit before sending the next packet in order to avoid too many loss
                setTimeout(() => {
                    index++;

                    if (index < responseMessages.length) {
                        LOGGER.debug('Send the packet (index = ' + index + '): ', responseMessages[index], ', payload = ',
                            this.prepareBufferForLogger(responseMessages[index].payload, 'DEBUG'));
                        this.lastSendResponseMessageTimestamp = Date.now();
                        this.responseCharacteristic.sendResponseMessage(
                            responseMessages[index], sendResponseMessageCallback);
                    } else {
                        // All response message sent!
                        callback();
                    }
                }, BLE_CONNECTION_INTERVAL_MS / 3); // See https://github.com/Krb686/nanotimer
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
    waitForAcknowledgement(callback) {
        setTimeout(() => {
            const startWaitingTime = Date.now();

            const callWhenAckReceived = () => {
                const isTimeout = Date.now() - startWaitingTime >= WAITING_FOR_ACK_TIMEOUT_MS;
                if (this.lastSendResponseMessageTimestamp <= this.lastReceivedRequestMessageTimestamp) {
                    callback(false);
                } else if (isTimeout) {
                    LOGGER.debug('Timeout error: no acknowledgement message came after ' +
                        WAITING_FOR_ACK_TIMEOUT_MS + 'ms.');
                    callback(true);
                } else {
                    setTimeout(callWhenAckReceived, BLE_CONNECTION_INTERVAL_MS);
                }
            };
            setTimeout(callWhenAckReceived, BLE_CONNECTION_INTERVAL_MS);
        }, CLIENT_MSG_PROCESSING_TIME_MS)
    }

    /**
     * Display the buffer in a string by converting each byte in decimal string.
     *
     * @private
     * @param {Buffer} buffer Buffer to prepare.
     * @param {string} logLevel Target log level in order to avoid wasting resources (e.g. 'DEBUG').
     * @returns {string} Prepared buffer.
     */
    prepareBufferForLogger(buffer, logLevel) {
        if (LOGGER.isLevelEnabled(logLevel)) {
            const stringRepresentation = _
                .chain(buffer)
                .map(byte => '' + Number(byte))
                .join(',')
                .value();
            return '[' + stringRepresentation + ']';
        } else {
            return 'Buffer';
        }
    }
}

module.exports = BleTransportManager;