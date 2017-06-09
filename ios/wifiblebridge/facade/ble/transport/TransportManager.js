/**
 * Handle the low-level part of the communication between this application and a client.
 *
 * @author Marc Plouhinec
 * @interface
 */
class TransportManager {

    /**
     * Initialize the manager.
     */
    initialize() {
        throw new Error('not implemented');
    }

    /**
     * Register the given request handler.
     *
     * @param {function(action: RequestAction, correlationId: Number, payload: Buffer)} requestHandler
     */
    registerRequestHandler(requestHandler) {
        throw new Error('not implemented');
    }

    /**
     * Send some data in JSON format.
     *
     * @param {Object} responseObject Response object to serialize.
     * @param {Number} correlationId Correlation ID of the request that triggered this response.
     * @param {function(error: Error?)} callback Function called when the response is sent or when an error occurred.
     */
    respondWithObject(responseObject, correlationId, callback) {
        throw new Error('not implemented');
    }

    /**
     * Send some raw data.
     *
     * @param {Buffer} responseBuffer Response to send.
     * @param {Number} correlationId Correlation ID of the request that triggered this response.
     * @param {function(error: Error?)} callback Function called when the response is sent or when an error occurred.
     */
    respondWithBuffer(responseBuffer, correlationId, callback) {
        throw new Error('not implemented');
    }
}

module.exports = TransportManager;