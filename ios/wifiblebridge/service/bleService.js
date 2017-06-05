var fs = require("fs");
var configuration = require('../configuration');

/**
 * Provide documents to the BLE facade.
 * 
 * @author Marc Plouhinec
 */
var bleService = {
    
    /**
     * Count the number of documents.
     * 
     * @param {function(err: ?Error, nbDocuments: Number)} callback Function called with the result.
     */
    'getNbDocuments': function (callback) {
        fs.readdir(configuration.distributionReadyThumbnailsPath, function (err, fileNames) {
            if (err) { return callback(err, 0); }

            callback(null, fileNames.length);
        });
    },

    /**
     * Get the documents names by index and count.
     * 
     * @param {number} documentIndex Index of the first document.
     * @param {number} documentCount Number of documents to return.
     * @param {function(err: ?Error, documentNames: Array.<String>)} callback Function called with the result.
     */
    'getDocumentNamesByIndexAndCount': function (documentIndex, documentCount, callback) {
        fs.readdir(configuration.distributionReadyThumbnailsPath, function (err, fileNames) {
            if (err) { return callback(err, []); }

            if (documentIndex < 0 || documentIndex >= fileNames.length || documentCount <= 0) {
                return callback(null, []);
            }

            var pngFileNames = [];
            for (var i = 0; i < fileNames.length; i++) {
                if (fileNames[i].toLowerCase().endsWith('.png')) {
                    pngFileNames.push(fileNames[i]);
                }
            }

            var documentNames = [];
            for (var i = documentIndex; i < pngFileNames.length; i++) {
                if (documentNames.length >= documentCount) {
                    break;
                }
                documentNames.push(pngFileNames[i]);
            }

            callback(null, documentNames);
        });
    },

    /**
     * Load in memory the preview picture of the document at the given index.
     * 
     * @param {number} documentIndex Index of the document.
     * @param {function(err: ?Error, data: Buffer)} callback Function called with the result.
     */
    'getDocumentPreviewByIndex': function (documentIndex, callback) {
        this.getDocumentNamesByIndexAndCount(documentIndex, 1, function (err, documentNames) {
            if (err) { return callback(err, new Buffer()); }

            if (documentNames.length === 0) {
                return new Buffer();
            }

            var filePath = configuration.distributionReadyThumbnailsPath + '/' + documentNames[0];
            var data = fs.readFileSync(filePath);
            callback(null, data);
        });
    },

    /**
     * Load in memory the picture of the document at the given index.
     * 
     * @param {number} documentIndex Index of the document.
     * @param {function(err: ?Error, data: Buffer)} callback Function called with the result.
     */
    'getCompressedDocumentByIndex': function (documentIndex, callback) {
        this.getDocumentNamesByIndexAndCount(documentIndex, 1, function (err, documentNames) {
            if (err) { return callback(err, new Buffer()); }

            if (documentNames.length === 0) {
                return new Buffer();
            }

            var filePath = configuration.distributionReadyPath + '/' + documentNames[0];
            var data = fs.readFileSync(filePath);
            callback(null, data);
        });
    }
};

module.exports = bleService;