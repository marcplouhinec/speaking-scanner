const bleno = require('bleno');
const log4js = require('log4js');
const RequestMessage = require('../message/RequestMessage');

const LOGGER = log4js.getLogger('RequestCharacteristic');

/** Characteristic UUID to be sent via BLE. */
const UUID = 'c69cbca5b78e461ab396ad9744e65011';

/**
 * Characteristic that contains requests sent by the client.
 *
 * @author Marc Plouhinec
 */
class RequestCharacteristic extends bleno.Characteristic {

    /**
     * Constructor.
     *
     * @param {function(requestMessage: RequestMessage)} requestMessageListener
     */
    constructor(requestMessageListener) {
        super({
            uuid: UUID,
            properties: ['write', 'writeWithoutResponse']
        });

        /**
         * @private
         * @type {function(requestMessage: RequestMessage)}
         */
        this.requestMessageListener = requestMessageListener;
    }

    /**
     * Method called when a request has been sent by the client.
     *
     * @param {Buffer} data
     * @param {number} offset
     * @param {boolean} withoutResponse
     * @param {function(result: Number)} callback
     */
    onWriteRequest(data, offset, withoutResponse, callback) {
        LOGGER.info('RequestCharacteristic write request: ' + data.toString('hex') + ' ' + offset + ' ' + withoutResponse);

        // Prepare the RequestMessage and send it
        const action = (data[0] & 0b11100000) >> 5; // Keep the 3 first bits
        const correlationId = data[0] & 0b00011111; // Keep the last 5 bits
        const payload = data.slice(1, 1 + 4);
        const ack = data.slice(5);
        const requestMessage = new RequestMessage(action, correlationId, payload, ack);
        this.requestMessageListener(requestMessage);

        callback(this.RESULT_SUCCESS);
    }
}

module.exports = RequestCharacteristic;
