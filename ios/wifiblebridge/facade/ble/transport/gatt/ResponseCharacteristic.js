const bleno = require('bleno');
const log4js = require('log4js');
const ClientHasNotSubscribedError = require('../../error/ClientHasNotSubscribedError');

const LOGGER = log4js.getLogger('ResponseCharacteristic');

/** Characteristic UUID to be sent via BLE. */
const UUID = '7d9813b43a63413681f91b83f2106fc2';

/**
 * Characteristic that contains responses for the client.
 *
 * @author Marc Plouhinec
 */
class ResponseCharacteristic extends bleno.Characteristic {

    constructor() {
        super({
            uuid: UUID,
            properties: ['notify']
        });

        /**
         * @private
         * @type {boolean}
         */
        this.hasClientSubscribed = false;

        /**
         * @private
         * @type {function(data: Buffer)}
         */
        this.updateValueCallback = null;


        /**
         * Listeners fired only once when the next {@link #onNotify} method is called.
         *
         * @private
         * @type {Array.<function>}
         */
        this.onNextDataNotifiedListeners = [];
    }

    /**
     * Method called when the client subscribes to the characteristic for notification.
     * Data can only be sent to the client if it is subscribed.
     *
     * @param {number} maxValueSize maximum data size
     * @param {function(data: Buffer)} updateValueCallback callback to call when value has changed
     */
    onSubscribe(maxValueSize, updateValueCallback) {
        LOGGER.info('ResponseCharacteristic subscribe');

        this.hasClientSubscribed = true;
        this.updateValueCallback = updateValueCallback;
    }

    /**
     * Method called when the client unsubscribes to the characteristic for notification.
     * This is the opposite of {@link #onSubscribe}.
     */
    onUnsubscribe() {
        LOGGER.info('ResponseCharacteristic unsubscribe');

        this.hasClientSubscribed = false;
        this.updateValueCallback = null;
    }

    /**
     * Method called when data has been sent to the client.
     */
    onNotify() {
        LOGGER.info('ResponseCharacteristic on notify');

        const listeners = this.onNextDataNotifiedListeners;
        this.onNextDataNotifiedListeners = [];

        listeners.forEach(listener => {
            try {
                listener();
            } catch (e) {
                LOGGER.error('Error thrown when an onNotify listener was called.', e);
            }
        });
    };

    /**
     * Send the given response message to the client.
     *
     * @param {ResponseMessage} responseMessage
     * @param {function(error: Error?)} callback Function called when the message is sent or an error occurred.
     */
    sendResponseMessage(responseMessage, callback) {
        LOGGER.info('ResponseCharacteristic.sendResponseMessage packet index = ' + responseMessage.packetIndex);

        if (!this.hasClientSubscribed) {
            callback(new ClientHasNotSubscribedError('The client has not subscribed to the ResponseCharacteristic.'));
            return;
        }

        // Build the message to send
        const message = new Buffer(20);
        const firstByte = (responseMessage.parityBit ? 0b10000000 : 0) + responseMessage.packetIndex;
        message.writeUInt8(firstByte, 0);
        responseMessage.payload.copy(message, 1, 0, responseMessage.payload.length);
        message.writeUInt8(responseMessage.crc, 19);

        // Send the message
        this.updateValueCallback(message);

        // Wait for the data to be sent
        this.onNextDataNotifiedListeners.push(callback);
    };
}

module.exports = ResponseCharacteristic;
