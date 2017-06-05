var fs = require('fs');
var log4js = require('log4js');
var BleTransportManager = require('./transport/BleTransportManager');
var RequestAction = require('./enums/RequestAction');
var bleService = require('../../service/bleService');

var LOGGER = log4js.getLogger('bleFacade');

/**
 * Facade layer responsible from handling BLE requests.
 */
var bleFacade = {
	
	/**
	 * @private
	 * @type {TransportManager}
	 */
	'transportManager': null,

    /**
     * Create the BLE server.
     */
    'initialize': function() {
		var self = this;
		
		this.transportManager = BleTransportManager.getInstance();
		this.transportManager.initialize();
		
		this.transportManager.registerRequestHandler(function(action, correlationId, payload) {
			self.handleRequest(action, correlationId, payload);
		});
    },
	
	/**
	 * Handle a new request.
	 *
	 * @private
	 * @param {RequestAction} action
	 * @param {Number} correlationId
	 * @param {Buffer} payload
	 */
	'handleRequest': function(action, correlationId, payload) {
		var self = this;

		switch (action) {
		case RequestAction.GET_NB_DOCUMENTS:
			LOGGER.info('Handle the request: action = GET_NB_DOCUMENTS, correlationId = ' + correlationId);
			
			bleService.getNbDocuments(function (err, nbDocuments) {
				if (err) {
					LOGGER.error('Error: unable to send the number of documents.', err);
				} else {
					var response = {
						nbDocuments: nbDocuments
					};
					self.transportManager.respondWithObject(response, correlationId, function (error) {
						if (error) {
							LOGGER.error('Error: unable to send the number of documents.', error);
						} else {
							LOGGER.info('Number of document sent with success!');
						}
					});
				}
			});
			break;
		case RequestAction.GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT:
			var documentIndex = payload.readInt16BE(0);
			var documentCount = payload.readInt16BE(2);
			LOGGER.info('Handle the request: action = GET_DOCUMENT_NAMES_BY_INDEX_AND_COUNT, ' + 
				'correlationId = ' + correlationId + ', index = ' + documentIndex + ', count = ' + documentCount);
				
			bleService.getDocumentNamesByIndexAndCount(documentIndex, documentCount, function (err, documentNames) {
				if (err) {
					LOGGER.error('Error: unable to send the document names.', err);
				} else {
					var response = {
						'documentNames': documentNames
					};
					self.transportManager.respondWithObject(response, correlationId, function (error) {
						if (error) {
							LOGGER.error('Error: unable to send the document names.', error);
						} else {
							LOGGER.info('Document names sent with success!');
						}
					});
				}
			});
			break;
		case RequestAction.GET_DOCUMENT_PREVIEW_BY_INDEX:
			var documentIndex = payload.readInt16BE(0);
			LOGGER.info('Handle the request: action = GET_DOCUMENT_PREVIEW_BY_INDEX, ' +
				'correlationId = ' + correlationId + ', index = ' + documentIndex);
			
			bleService.getDocumentPreviewByIndex(documentIndex, function (err, data) {
				if (err) {
					LOGGER.error('Error: unable to send the document preview.', err);
				} else {
					self.transportManager.respondWithBuffer(data, correlationId, function (error) {
						if (error) {
							LOGGER.error('Error: unable to send the document preview.', error);
						} else {
							LOGGER.info('Document preview sent with success!');
						}
					});
				}
			});
			break;
		case RequestAction.GET_COMPRESSED_DOCUMENT_BY_INDEX:
			var documentIndex = payload.readInt16BE(0);
			LOGGER.info('Handle the request: action = GET_COMPRESSED_DOCUMENT_BY_INDEX, ' +
				'correlationId = ' + correlationId + ', index = ' + documentIndex);
			
			bleService.getCompressedDocumentByIndex(documentIndex, function (err, data) {
				if (err) {
					LOGGER.error('Error: unable to send the document data.', err);
				} else {
					self.transportManager.respondWithBuffer(data, correlationId, function (error) {
						if (error) {
							LOGGER.error('Error: unable to send the document data.', error);
						} else {
							LOGGER.info('Document data sent with success!');
						}
					});
				}
			});
			break;
		}
	}
};

module.exports = bleFacade;