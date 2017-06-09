const fs = require("fs");
const _ = require('lodash');
const im = require('imagemagick');
const configuration = require('../configuration');

/**
 * Regularly convert downloaded PDF files to JPG.
 *
 * @author Marc Plouhinec
 */
const jpgConversionService = {

    /**
     * @private
     * @type {boolean}
     */
    automaticConversionActive: false,

    /**
     * Start converting downloaded PDF files to JPG (or just copy downloaded JPG files) regularly.
     */
    startConvertingRegularly() {
        this.automaticConversionActive = true;

        const automaticConversion = () => {
            if (this.automaticConversionActive) {
                this.convertAllDownloadedPdfFiles(err => {
                    if (err) {
                        console.log(err);
                    }

                    this.moveAllDownloadedJpgFiles(err => {
                        if (err) {
                            console.log(err);
                        }

                        // Schedule the next automatic conversion
                        setTimeout(automaticConversion, configuration.toJpgConversionServiceAutomaticConversionPeriodMs);
                    });
                });
            }
        };
        setTimeout(automaticConversion, configuration.toJpgConversionServiceAutomaticConversionPeriodMs);
    },

    /**
     * Stop converting files regularly.
     */
    stopConvertingRegularly() {
        this.automaticConversionActive = false;
    },

    /**
     * Convert all the downloaded FTP files into JPG.
     *
     * @private
     * @param {function(err: Error?)} callback Function called when the operation is finished.
     */
    convertAllDownloadedPdfFiles(callback) {
        // Find all the downloaded PDF file list
        fs.readdir(configuration.localFtpDownloadedPath, (err, downloadedFileNames) => {
            if (err) {
                return callback(err);
            }

            // Only keep PDF files
            const downloadedPdfFileNames = _.filter(downloadedFileNames, name => name.toLowerCase().endsWith('.pdf'));

            // Find all already converted PDF files
            fs.readdir(configuration.localToJpgConvertedPath, (err, convertedFileNames) => {
                if (err) {
                    return callback(err);
                }

                // Filter the downloaded PDF files by only keeping the ones that have not been converted yet
                const convertedFileNameSet = new Set(convertedFileNames);
                const newDownloadedPdfFileNames = _.filter(downloadedPdfFileNames, downloadedPdfFileName => {
                    const downloadedPdfFilePrefix = downloadedPdfFileName.substring(0, downloadedPdfFileName.lastIndexOf('.'));
                    return !convertedFileNameSet.has(downloadedPdfFilePrefix + '.jpg') &&
                        !convertedFileNameSet.has(downloadedPdfFilePrefix + '-1.jpg')
                });

                // Convert each new PDF file
                const convertPdfFileAtIndex = fileIndex => {
                    if (fileIndex >= newDownloadedPdfFileNames.length) {
                        return callback();
                    }

                    const pdfFileName = newDownloadedPdfFileNames[fileIndex];
                    const pdfFilePath = configuration.localFtpDownloadedPath + '/' + pdfFileName;
                    console.log('Convert the file ' + pdfFileName + ' to ' + configuration.localToJpgConvertingPath + '.');
                    this.convertPdfFileToJpg(pdfFilePath, configuration.localToJpgConvertingPath, (err, createdFilePaths) => {
                        if (err) {
                            return callback(err);
                        }

                        // Move the converted files
                        const moveFileAtIndex = createdFileIndex => {
                            if (createdFileIndex >= createdFilePaths.length) {
                                return convertPdfFileAtIndex(fileIndex + 1);
                            }

                            const createdFilePath = createdFilePaths[createdFileIndex];
                            console.log('Move the file ' + createdFilePath + ' to ' + configuration.localToJpgConvertedPath + '.');
                            this.moveFile(createdFilePath, configuration.localToJpgConvertedPath, err => {
                                if (err) {
                                    return callback(err);
                                }

                                moveFileAtIndex(createdFileIndex + 1);
                            });
                        };
                        moveFileAtIndex(0);
                    });
                };
                convertPdfFileAtIndex(0);
            });
        });
    },

    /**
     * Convert the given PDF file into JPG and save the result into the given output path.
     *
     * @private
     * @param {string} pdfFilePath
     * @param {string} outputDirectoryPath
     * @param {function(err: Error?, createdFilePaths: Array.<string>)} callback
     *     Function called when the operation is finished.
     */
    convertPdfFileToJpg(pdfFilePath, outputDirectoryPath, callback) {
        const outputFilePrefix = pdfFilePath.substring(pdfFilePath.lastIndexOf('/') + 1, pdfFilePath.lastIndexOf('.'));
        const outputFilePath = outputDirectoryPath + '/' + outputFilePrefix + '.jpg';
        im.convert(['-density', '300', pdfFilePath, outputFilePath], err => {
            if (err) {
                return callback(err, []);
            }

            // Find the converted files
            fs.readdir(outputDirectoryPath, (err, convertedFileNames) => {
                if (err) {
                    return callback(err, []);
                }

                const createdFilePaths = _
                    .chain(convertedFileNames)
                    .filter(name =>
                        name === outputFilePrefix + '.jpg' || (name.startsWith(outputFilePrefix + '-') && name.endsWith('.jpg'))
                    )
                    .map(name => outputDirectoryPath + '/' + name)
                    .value();

                callback(null, createdFilePaths);
            });
        });
    },

    /**
     * Move all the downloaded JPG files into the folder containing both JPG and converted PDF files.
     *
     * @private
     * @param {function(err: Error?)} callback Function called when the operation is finished.
     */
    moveAllDownloadedJpgFiles(callback) {
        // Find all the downloaded JPG file list
        fs.readdir(configuration.localFtpDownloadedPath, (err, downloadedFileNames) => {
            if (err) {
                return callback(err);
            }

            // Only keep JPG files
            const downloadedJpgFileNames = _.filter(downloadedFileNames, name => name.toLowerCase().endsWith('.jpg'));

            // Find all already moved JPG files
            fs.readdir(configuration.localToJpgConvertedPath, (err, movedFileNames) => {
                if (err) {
                    return callback(err);
                }

                // Filter the downloaded JPG files by only keeping the ones that have not been moved yet
                const movedFileNameSet = new Set(movedFileNames);
                const newDownloadedJpgFileNames = _.filter(downloadedJpgFileNames, name => !movedFileNameSet.has(name));

                const moveJpgFileAtIndex = fileIndex => {
                    if (fileIndex >= newDownloadedJpgFileNames.length) {
                        return callback();
                    }

                    const fileName = newDownloadedJpgFileNames[fileIndex];
                    const jpgFilePath = configuration.localFtpDownloadedPath + '/' + fileName;
                    console.log('Move the file ' + fileName + ' to ' + configuration.localToJpgConvertedPath + '.');
                    this.moveFile(jpgFilePath, configuration.localToJpgConvertedPath, err => {
                        if (err) {
                            return callback(err);
                        }

                        moveJpgFileAtIndex(fileIndex + 1);
                    });
                };
                moveJpgFileAtIndex(0);
            });
        });
    },

    /**
     * Move the given file to the target directory.
     *
     * @private
     * @param {string} filePath
     * @param {string} targetDirectoryPath
     * @param {function(err: Error?)} callback Function called when the operation is finished.
     */
    moveFile(filePath, targetDirectoryPath, callback) {
        const targetFileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
        fs.rename(filePath, targetDirectoryPath + '/' + targetFileName, err => {
            callback(err);
        });
    }

};

module.exports = jpgConversionService;