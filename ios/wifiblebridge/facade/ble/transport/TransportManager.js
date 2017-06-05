/**
 * Handle the low-level part of the communication between this application and a client.
 * 
 * @interface
 */
function TransportManager() {
}

/**
 * Initialize the manager.
 */
TransportManager.prototype.initialize = function() {
	throw new Error('not implemented');
}

/**
 * Register the given request handler.
 *
 * @param {function(action: RequestAction, correlationId: Number, payload: Buffer)} requestHandler
 */
TransportManager.prototype.registerRequestHandler = function(requestHandler) {
	throw new Error('not implemented');
}

/**
 * Send some data in JSON format.
 *
 * @param {Object} responseObject Response object to serialize.
 * @param {Number} correlationId Correlation ID of the request that triggered this response.
 * @param {function(error: ?Error)} callback Function called when the response is sent or when an error occurred.
 */
TransportManager.prototype.respondWithObject = function(responseObject, correlationId, callback) {
	throw new Error('not implemented');
}

/**
 * Send some raw data.
 *
 * @param {Buffer} responseBuffer Response to send.
 * @param {Number} correlationId Correlation ID of the request that triggered this response.
 * @param {function(error: ?Error)} callback Function called when the response is sent or when an error occurred.
 */
TransportManager.prototype.respondWithBuffer = function(responseBuffer, correlationId, callback) {
	throw new Error('not implemented');
}

module.exports = TransportManager;