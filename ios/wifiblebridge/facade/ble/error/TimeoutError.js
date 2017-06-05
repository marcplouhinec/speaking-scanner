var util = require('util');

/**
 * Error thrown when a timeout occurred.
 *
 * @constructor
 * @augments Error
 * @param {string} message
 */
function TimeoutError (message) {
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}

util.inherits(TimeoutError, Error);

module.exports = TimeoutError;
