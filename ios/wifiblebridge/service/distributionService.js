var fs = require("fs");
var im = require('imagemagick');
var configuration = require('../configuration');

/**
 * Regularly prepare scanned documents in order to redistribute them via BLE to the iOS app.
 * Convert each downloaded or converted JPG file into compressed gray-levels PNG file and produce
 * an additional thumbnail.
 * 
 * @author Marc Plouhinec
 */
var distributionService = {

    /**
     * @private
     * @type {boolean}
     */
    'automaticPreparationActive': false,
    
    /**
     * Start preparing scanned documents for distribution regularly.
     */
    'startPreparingDocumentsRegularly': function () {
        var self = this;

        this.automaticPreparationActive = true;

        var automaticConversion = function () {
            if (self.automaticPreparationActive) {
                self.convertAllDocuments(function (err) {
                    if (err) {
                        console.log(err);
                    }

                    // Schedule the next automatic conversion
                    setTimeout(automaticConversion, configuration.distributionServiceAutomaticConversionPeriodMs);
                });
            }
        };
        setTimeout(automaticConversion, configuration.distributionServiceAutomaticConversionPeriodMs);
    },

    /**
     * Stop preparing scanned documentsregularly.
     */
    'stopPreparingDocumentsRegularly': function () {
        this.automaticPreparationActive = false;
    },

    /**
     * Scan all the new JPG files and convert them ones by ones.
     * 
     * @private
     * @param {function(err: ?Error)} callback Function called when the conversion is done or interrupted by en error.
     */
    'convertAllDocuments': function (callback) {
        var self = this;

        // Find all the JPG files to convert
        fs.readdir(configuration.localToJpgConvertedPath, function (err, jpgFileNames) {
            if (err) { return callback(err); }

            // Find all the already converted files
            fs.readdir(configuration.distributionReadyThumbnailsPath, function (err, convertedFileNames) {
                if (err) { return callback(err); }

                var newFileNames = [];
                for (var i = 0; i < jpgFileNames.length; i++) {
                    var jpgFileName = jpgFileNames[i].toLowerCase();
                    if (jpgFileName.endsWith('.jpg')) {
                        jpgFileName = jpgFileName.substring(0, jpgFileName.lastIndexOf('.'));
                        var isAlreadyConverted = false;
                        for (var j = 0; j < convertedFileNames.length; j++) {
                            var convertedFileName = convertedFileNames[j].toLowerCase();
                            convertedFileName = convertedFileName.substring(0, convertedFileName.lastIndexOf('.'));
                            if (jpgFileName === convertedFileName) {
                                isAlreadyConverted = true;
                                break;
                            }
                        }

                        if (!isAlreadyConverted) {
                            newFileNames.push(jpgFileNames[i]);
                        }
                    }
                }

                // Convert each new file
                var convertFileAtIndex = function (fileIndex) {
                    if (fileIndex >= newFileNames.length) {
                        return callback();
                    }

                    var newFileName = newFileNames[fileIndex];
                    console.log('Prepare the file ' + newFileName + ' for distribution.');
                    self.convertDocument(configuration.localToJpgConvertedPath + '/' + newFileName, function (err) {
                        if (err) { return callback(err); }

                        convertFileAtIndex(fileIndex + 1);
                    });
                };
                convertFileAtIndex(0);
            });
        });
    },

    /**
     * Resize and convert a document to gray-level and PNG.
     * 
     * @private
     * @param {string} jpgFilePath
     * @param {function(err: ?Error)} callback Function called when the conversion is done or interrupted by en error.
     */
    'convertDocument': function (jpgFilePath, callback) {
        // Build the target file path
        var fileName = jpgFilePath.substring(jpgFilePath.lastIndexOf('/') + 1);
        var convertedFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.png';
        var convertedFilePath = configuration.distributionPreparationPath + '/' + convertedFileName;
        var thumbnailFilePath = configuration.distributionPreparationThumbnailsPath + '/' + convertedFileName;
        var readyFilePath = configuration.distributionReadyPath + '/' + convertedFileName;
        var readyThumbnailFilePath = configuration.distributionReadyThumbnailsPath + '/' + convertedFileName;
        
        // Convert the file
        im.convert([jpgFilePath, '-resize', '40%', '-colorspace', 'gray', '-depth', '4', convertedFilePath], function (err, stdout, stderr) {
            if (err) { return callback(err); }

            // Create the thumbnail
            im.convert([jpgFilePath, '-resize', '8%', '-colorspace', 'gray', '-depth', '4', thumbnailFilePath], function (err, stdout, stderr) {
                if (err) { return callback(err); }

                // Copy the converted files to the ready folder
                fs.rename(convertedFilePath, readyFilePath, function (err) {
                    if (err) { return callback(err); }

                    fs.rename(thumbnailFilePath, readyThumbnailFilePath, function (err) {
                        if (err) { return callback(err); }

                        callback();
                    });
                });
            });
        });
    }
};


module.exports = distributionService;