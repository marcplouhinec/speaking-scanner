const fs = require('fs');
const log4js = require('log4js');
const BleTransportManager = require('./transport/impl/BleTransportManager');
const RequestAction = require('./enums/RequestAction');
const bleService = require('../../service/bleService');

const LOGGER = log4js.getLogger('bleFacade');

/**
 * Facade layer responsible from handling BLE requests.
 *
 * @author Marc Plouhinec
 */
const bleFacade = {

    /**
     * @private
     * @type {TransportManager}
     */
    transportManager: null,

    /**
     * Create the BLE server.
     */
    initialize() {
        this.transportManager = new BleTransportManager();
        this.transportManager.initialize();

        this.transportManager.registerRequestHandler((action, correlationId, payload) => {
            this.dispatchRequest(action, correlationId, payload);
        });
    },

    /**
     * Dispatch a new request.
     *
     * @private
     * @param {RequestAction} action
     * @param {Number} correlationId
     * @param {Buffer} payload
     */
    dispatchRequest(action, correlationId, payload) {
        switch (action) {
            case RequestAction.GET_NB_DOCUMENTS:
                this.handleGetNbDocumentsRequest(correlationId);
                break;

            case RequestAction.GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT:
                this.handleGetDocumentNamesByIndexAndCountRequest(correlationId, payload);
                break;

            case RequestAction.GET_DOCUMENT_PREVIEW_BY_INDEX:
                this.handleGetDocumentPreviewByIndexRequest(correlationId, payload);
                break;

            case RequestAction.GET_COMPRESSED_DOCUMENT_BY_INDEX:
                this.handleGetCompressedDocumentByIndexRequest(correlationId, payload);
                break;
        }
    },

    /**
     * Handle a {@link RequestAction.GET_NB_DOCUMENTS} request.
     *
     * @private
     * @param {Number} correlationId
     */
    handleGetNbDocumentsRequest(correlationId) {
        LOGGER.info('Handle the request: action = GET_NB_DOCUMENTS, correlationId = ' + correlationId);

        bleService.getNbDocuments((err, nbDocuments) => {
            if (err) {
                LOGGER.error('Error: unable to send the number of documents.', err);
            } else {
                const response = {
                    nbDocuments: nbDocuments
                };
                this.transportManager.respondWithObject(response, correlationId, error => {
                    if (error) {
                        LOGGER.error('Error: unable to send the number of documents.', error);
                    } else {
                        LOGGER.info('Number of document sent with success!');
                    }
                });
            }
        });
    },

    /**
     * Handle a {@link RequestAction.GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT} request.
     *
     * @private
     * @param {Number} correlationId
     * @param {Buffer} payload
     */
    handleGetDocumentNamesByIndexAndCountRequest(correlationId, payload) {
        const documentIndex = payload.readInt16BE(0);
        const documentCount = payload.readInt16BE(2);
        LOGGER.info('Handle the request: action = GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT, ' +
            'correlationId = ' + correlationId + ', index = ' + documentIndex + ', count = ' + documentCount);

        bleService.getDocumentNamesByIndexAndCount(documentIndex, documentCount, (err, documentNames) => {
            if (err) {
                LOGGER.error('Error: unable to send the document names.', err);
            } else {
                const response = {
                    documentNames: documentNames
                };
                this.transportManager.respondWithObject(response, correlationId, error => {
                    if (error) {
                        LOGGER.error('Error: unable to send the document names.', error);
                    } else {
                        LOGGER.info('Document names sent with success!');
                    }
                });
            }
        });
    },

    /**
     * Handle a {@link RequestAction.GET_DOCUMENT_PREVIEW_BY_INDEX} request.
     *
     * @private
     * @param {Number} correlationId
     * @param {Buffer} payload
     */
    handleGetDocumentPreviewByIndexRequest(correlationId, payload) {
        const documentIndex = payload.readInt16BE(0);
        LOGGER.info('Handle the request: action = GET_DOCUMENT_PREVIEW_BY_INDEX, ' +
            'correlationId = ' + correlationId + ', index = ' + documentIndex);

        bleService.getDocumentPreviewByIndex(documentIndex, (err, data) => {
            if (err) {
                LOGGER.error('Error: unable to send the document preview.', err);
            } else {
                this.transportManager.respondWithBuffer(data, correlationId, error => {
                    if (error) {
                        LOGGER.error('Error: unable to send the document preview.', error);
                    } else {
                        LOGGER.info('Document preview sent with success!');
                    }
                });
            }
        });
    },

    /**
     * Handle a {@link RequestAction.GET_COMPRESSED_DOCUMENT_BY_INDEX} request.
     *
     * @private
     * @param {Number} correlationId
     * @param {Buffer} payload
     */
    handleGetCompressedDocumentByIndexRequest(correlationId, payload) {
        const documentIndex = payload.readInt16BE(0);
        LOGGER.info('Handle the request: action = GET_COMPRESSED_DOCUMENT_BY_INDEX, ' +
            'correlationId = ' + correlationId + ', index = ' + documentIndex);

        bleService.getCompressedDocumentByIndex(documentIndex, (err, data) => {
            if (err) {
                LOGGER.error('Error: unable to send the document data.', err);
            } else {
                this.transportManager.respondWithBuffer(data, correlationId, error => {
                    if (error) {
                        LOGGER.error('Error: unable to send the document data.', error);
                    } else {
                        LOGGER.info('Document data sent with success!');
                    }
                });
            }
        });
    }
};

module.exports = bleFacade;