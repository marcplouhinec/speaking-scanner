/**
 * Error thrown when the response correlation ID doesn't match the request one.
 *
 * @author Marc Plouhinec
 */
class CorrelationIdMatchingError extends Error {

    /**
     * Constructor.
     *
     * @param {string} message
     */
    constructor(message) {
        super(message);

        this.name = this.constructor.name;
    }
}

module.exports = CorrelationIdMatchingError;
