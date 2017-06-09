/**
 * Error thrown when the client has not subscribed to the notification characteristic.
 *
 * @author Marc Plouhinec
 */
class ClientHasNotSubscribedError extends Error {

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

module.exports = ClientHasNotSubscribedError;
