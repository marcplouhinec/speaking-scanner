var util = require('util');

/**
 * Error thrown when the client has not subscribed to the notification characteristic.
 *
 * @constructor
 * @augments Error
 * @param {string} message
 */
function ClientHasNotSubscribedError(message) {
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}

util.inherits(ClientHasNotSubscribedError, Error);

module.exports = ClientHasNotSubscribedError;
