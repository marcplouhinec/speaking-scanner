var util = require('util');

/**
 * Error thrown when the response correlation ID doesn't match the request one.
 *
 * @constructor
 * @augments Error
 * @param {string} message
 */
function CorrelationIdMatchingError (message) {
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}

util.inherits(CorrelationIdMatchingError, Error);

module.exports = CorrelationIdMatchingError;
