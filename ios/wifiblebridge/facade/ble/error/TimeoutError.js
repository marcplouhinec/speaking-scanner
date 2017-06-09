/**
 * Error thrown when a timeout occurred.
 *
 * @author Marc Plouhinec
 */
class TimeoutError extends Error {

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

module.exports = TimeoutError;
