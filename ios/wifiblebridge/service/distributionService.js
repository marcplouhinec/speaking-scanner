const fs = require("fs");
const _ = require('lodash');
const im = require('imagemagick');
const configuration = require('../configuration');

/**
 * Regularly prepare scanned documents in order to redistribute them via BLE to the iOS app.
 * Convert each downloaded or converted JPG file into compressed gray-levels PNG file and produce
 * an additional thumbnail.
 *
 * @author Marc Plouhinec
 */
const distributionService = {

    /**
     * @private
     * @type {boolean}
     */
    automaticPreparationActive: false,

    /**
     * Start preparing scanned documents for distribution regularly.
     */
    startPreparingDocumentsRegularly() {
        this.automaticPreparationActive = true;

        const automaticConversion = () => {
            if (this.automaticPreparationActive) {
                this.convertAllDocuments(err => {
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
     * Stop preparing scanned documents regularly.
     */
    stopPreparingDocumentsRegularly() {
        this.automaticPreparationActive = false;
    },

    /**
     * Scan all the new JPG files and convert them ones by ones.
     *
     * @private
     * @param {function(err: Error?)} callback Function called when the conversion is done or interrupted by en error.
     */
    convertAllDocuments(callback) {
        // Find all the JPG files to convert
        fs.readdir(configuration.localToJpgConvertedPath, (err, jpgFileNames) => {
            if (err) {
                return callback(err);
            }

            // Find all the already converted files
            fs.readdir(configuration.distributionReadyThumbnailsPath, (err, convertedFileNames) => {
                if (err) {
                    return callback(err);
                }

                /** @type {Array.<String>} */
                const extensionLessConvertedFileNames = _
                    .chain(convertedFileNames)
                    .map(name => name.toLowerCase())
                    .map(name => name.substring(0, name.lastIndexOf('.')))
                    .value();
                const extensionLessConvertedFileNameSet = new Set(extensionLessConvertedFileNames);

                const newFileNames = _
                    .chain(jpgFileNames)
                    .filter(name => name.toLowerCase().endsWith('.jpg'))
                    .filter(name => {
                        const extensionLessFileName = name.substring(0, name.lastIndexOf('.')).toLowerCase();
                        return !extensionLessConvertedFileNameSet.has(extensionLessFileName);
                    })
                    .value();

                // Convert each new file
                const convertFileAtIndex = fileIndex => {
                    if (fileIndex >= newFileNames.length) {
                        return callback();
                    }

                    const newFileName = newFileNames[fileIndex];
                    console.log('Prepare the file ' + newFileName + ' for distribution.');
                    this.convertDocument(configuration.localToJpgConvertedPath + '/' + newFileName, err => {
                        if (err) {
                            return callback(err);
                        }

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
     * @param {function(err: Error?)} callback Function called when the conversion is done or interrupted by en error.
     */
    convertDocument(jpgFilePath, callback) {
        // Build the target file path
        const fileName = jpgFilePath.substring(jpgFilePath.lastIndexOf('/') + 1);
        const convertedFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.png';
        const convertedFilePath = configuration.distributionPreparationPath + '/' + convertedFileName;
        const thumbnailFilePath = configuration.distributionPreparationThumbnailsPath + '/' + convertedFileName;
        const readyFilePath = configuration.distributionReadyPath + '/' + convertedFileName;
        const readyThumbnailFilePath = configuration.distributionReadyThumbnailsPath + '/' + convertedFileName;

        // Convert the file
        im.convert([jpgFilePath, '-resize', '40%', '-colorspace', 'gray', '-depth', '4', convertedFilePath], err => {
            if (err) {
                return callback(err);
            }

            // Create the thumbnail
            im.convert([jpgFilePath, '-resize', '8%', '-colorspace', 'gray', '-depth', '4', thumbnailFilePath], err => {
                if (err) {
                    return callback(err);
                }

                // Copy the converted files to the ready folder
                fs.rename(convertedFilePath, readyFilePath, err => {
                    if (err) {
                        return callback(err);
                    }

                    fs.rename(thumbnailFilePath, readyThumbnailFilePath, err => {
                        if (err) {
                            return callback(err);
                        }

                        callback();
                    });
                });
            });
        });
    }
};

module.exports = distributionService;