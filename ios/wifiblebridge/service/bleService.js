const fs = require("fs");
const _ = require('lodash');
const configuration = require('../configuration');

/**
 * Provide documents to the BLE facade.
 *
 * @author Marc Plouhinec
 */
const bleService = {

    /**
     * Count the number of documents.
     *
     * @param {function(err: Error?, nbDocuments: Number)} callback Function called with the result.
     */
    getNbDocuments(callback) {
        fs.readdir(configuration.distributionReadyThumbnailsPath, (err, fileNames) => {
            if (err) {
                return callback(err, 0);
            }

            callback(null, fileNames.length);
        });
    },

    /**
     * Get the documents names by index and count.
     *
     * @param {number} documentIndex Index of the first document.
     * @param {number} documentCount Number of documents to return.
     * @param {function(err: Error?, documentNames: Array.<String>)} callback Function called with the result.
     */
    getDocumentNamesByIndexAndCount(documentIndex, documentCount, callback) {
        fs.readdir(configuration.distributionReadyThumbnailsPath, (err, fileNames) => {
            if (err) {
                return callback(err, []);
            }

            if (documentIndex < 0 || documentIndex >= fileNames.length || documentCount <= 0) {
                return callback(null, []);
            }

            const documentNames = _
                .chain(fileNames)
                .filter(name => name.toLowerCase().endsWith('.png'))
                .take(documentCount)
                .value();

            callback(null, documentNames);
        });
    },

    /**
     * Load in memory the preview picture of the document at the given index.
     *
     * @param {number} documentIndex Index of the document.
     * @param {function(err: Error?, data: Buffer)} callback Function called with the result.
     */
    getDocumentPreviewByIndex(documentIndex, callback) {
        this.getDocumentNamesByIndexAndCount(documentIndex, 1, (err, documentNames) => {
            if (err) {
                return callback(err, new Buffer(0));
            }

            if (documentNames.length === 0) {
                return new Buffer(0);
            }

            const filePath = configuration.distributionReadyThumbnailsPath + '/' + documentNames[0];
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return callback(err, new Buffer(0));
                }
                callback(null, data);
            });
        });
    },

    /**
     * Load in memory the picture of the document at the given index.
     *
     * @param {number} documentIndex Index of the document.
     * @param {function(err: Error?, data: Buffer)} callback Function called with the result.
     */
    getCompressedDocumentByIndex(documentIndex, callback) {
        this.getDocumentNamesByIndexAndCount(documentIndex, 1, (err, documentNames) => {
            if (err) {
                return callback(err, new Buffer(0));
            }

            if (documentNames.length === 0) {
                return new Buffer(0);
            }

            const filePath = configuration.distributionReadyPath + '/' + documentNames[0];
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return callback(err, new Buffer(0));
                }

                callback(null, data);
            });
        });
    }
};

module.exports = bleService;