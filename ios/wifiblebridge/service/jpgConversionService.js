var fs = require("fs");
var im = require('imagemagick');
var configuration = require('../configuration');

/**
 * Regularly convert downloaded PDF files to JPG.
 * 
 * @author Marc Plouhinec
 */
var jpgConversionService = {

    /**
     * @private
     * @type {boolean}
     */
    'automaticConversionActive': false,

    /**
     * Start converting downloaded PDF files to JPG (or just copy downloaded JPG files) regularly.
     */
    'startConvertingRegularly': function () {
        var self = this;

        this.automaticConversionActive = true;

        var automaticConversion = function () {
            if (self.automaticConversionActive) {
                self.convertAllDownloadedPdfFiles(function (err) {
                    if (err) {
                        console.log(err);
                    }

                    self.moveAllDownloadedJpgFiles(function (err) {
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
    'stopConvertingRegularly': function () {
        this.automaticConversionActive = false;
    },

    /**
     * Convert all the downloaded FTP files into JPG.
     * 
     * @private
     * @param {function(err: ?Error)} callback Function called when the operation is finished.
     */
    'convertAllDownloadedPdfFiles': function (callback) {
        var self = this;

        // Find all the downloaded PDF file list
        fs.readdir(configuration.localFtpDownloadedPath, function (err, downloadedFileNames) {
            if (err) { return callback(err); }

            // Only keep PDF files
            var downloadedPdfFileNames = [];
            for (var i = 0; i < downloadedFileNames.length; i++) {
                var downloadedFileName = downloadedFileNames[i];
                if (downloadedFileName.toLowerCase().endsWith('.pdf')) {
                    downloadedPdfFileNames.push(downloadedFileName);
                }
            }

            // Find all already converted PDF files
            fs.readdir(configuration.localToJpgConvertedPath, function (err, convertedFileNames) {
                if (err) { return callback(err); }

                // Index the files in a set
                var trueByConvertedFileName = {};
                for (var j = 0; j < convertedFileNames.length; j++) {
                    trueByConvertedFileName[convertedFileNames[j]] = true;
                }

                // Filter the downloaded PDF files by only keeping the ones that have not been converted yet
                var newDownloadedPdfFileNames = [];
                for (var j = 0; j < downloadedPdfFileNames.length; j++) {
                    var downloadedPdfFileName = downloadedPdfFileNames[j];
                    var downloadedPdfFilePrefix = downloadedPdfFileName.substring(0, downloadedPdfFileName.lastIndexOf('.'));
                    if (!trueByConvertedFileName[downloadedPdfFilePrefix + '.jpg'] && 
                        !trueByConvertedFileName[downloadedPdfFilePrefix + '-1.jpg']) {
                        newDownloadedPdfFileNames.push(downloadedPdfFileName);
                    }
                }

                // Convert each new PDF file
                var convertPdfFileAtIndex = function (fileIndex) {
                    if (fileIndex >= newDownloadedPdfFileNames.length) {
                        return callback();
                    }

                    var pdfFileName = newDownloadedPdfFileNames[fileIndex];
                    var pdfFilePath = configuration.localFtpDownloadedPath + '/' + pdfFileName;
                    console.log('Convert the file ' + pdfFileName + ' to ' + configuration.localToJpgConvertingPath + '.');
                    self.convertPdfFileToJpg(pdfFilePath, configuration.localToJpgConvertingPath, function (err, createdFilePaths) {
                        if (err) { return callback(err);}

                        // Move the converted files
                        var moveFileAtIndex = function (createdFileIndex) {
                            if (createdFileIndex >= createdFilePaths.length) {
                                return convertPdfFileAtIndex(fileIndex + 1);
                            }

                            var createdFilePath = createdFilePaths[createdFileIndex];
                            console.log('Move the file ' + createdFilePath + ' to ' + configuration.localToJpgConvertedPath + '.');
                            self.moveFile(createdFilePath, configuration.localToJpgConvertedPath, function (err) {
                                if (err) { return callback(err); }

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
     * @param {function(err: ?Error, createdFilePaths: Array.<string>)} callback
     *     Function called when the operation is finished.
     */
    'convertPdfFileToJpg': function (pdfFilePath, outputDirectoryPath, callback) {
        var outputFilePrefix = pdfFilePath.substring(pdfFilePath.lastIndexOf('/') + 1, pdfFilePath.lastIndexOf('.'));
        var outputFilePath = outputDirectoryPath + '/' + outputFilePrefix + '.jpg';
        im.convert(['-density', '300', pdfFilePath, outputFilePath], function(err, stdout) {
            if (err) { return callback(err, []); }

            // Find the converted files
            fs.readdir(outputDirectoryPath, function (err, convertedFileNames) {
                if (err) { return callback(err); }

                var createdFilePaths = [];
                for (var i = 0; i < convertedFileNames.length; i++) {
                    var convertedFileName = convertedFileNames[i];

                    if (convertedFileName === outputFilePrefix + '.jpg') {
                        createdFilePaths.push(outputDirectoryPath + '/' + convertedFileName);
                    }
                    else if (convertedFileName.startsWith(outputFilePrefix + '-') && convertedFileName.endsWith('.jpg')) {
                        createdFilePaths.push(outputDirectoryPath + '/' + convertedFileName);
                    }
                }

                callback(null, createdFilePaths);
            });
        });
    },

    /**
     * Move all the downloaded JPG files into the folder containing both JPG and converted PDF files.
     * 
     * @private
     * @param {function(err: ?Error)} callback Function called when the operation is finished.
     */
    'moveAllDownloadedJpgFiles': function(callback) {
        var self = this;

        // Find all the downloaded JPG file list
        fs.readdir(configuration.localFtpDownloadedPath, function (err, downloadedFileNames) {
            if (err) { return callback(err); }

            // Only keep JPG files
            var downloadedJpgFileNames = [];
            for (var i = 0; i < downloadedFileNames.length; i++) {
                var downloadedFileName = downloadedFileNames[i];
                if (downloadedFileName.toLowerCase().endsWith('.jpg')) {
                    downloadedJpgFileNames.push(downloadedFileName);
                }
            }

            // Find all already moved JPG files
            fs.readdir(configuration.localToJpgConvertedPath, function (err, movedFileNames) {
                if (err) { return callback(err); }

                // Index the files in a set
                var trueByMovedFileName = {};
                for (var j = 0; j < movedFileNames.length; j++) {
                    trueByMovedFileName[movedFileNames[j]] = true;
                }

                // Filter the downloaded JPG files by only keeping the ones that have not been moved yet
                var newDownloadedJpgFileNames = [];
                for (var j = 0; j < downloadedJpgFileNames.length; j++) {
                    var downloadedJpgFileName = downloadedJpgFileNames[j];
                    if (!trueByMovedFileName[downloadedJpgFileName]) {
                        newDownloadedJpgFileNames.push(downloadedJpgFileName);
                    }
                }

                var moveJpgFileAtIndex = function(fileIndex) {
                    if (fileIndex >= newDownloadedJpgFileNames.length) {
                        return callback();
                    }

                    var fileName = newDownloadedJpgFileNames[fileIndex];
                    var jpgFilePath = configuration.localFtpDownloadedPath + '/' + fileName;
                    console.log('Move the file ' + fileName + ' to ' + configuration.localToJpgConvertedPath + '.');
                    self.moveFile(jpgFilePath, configuration.localToJpgConvertedPath, function (err) {
                        if (err) { return callback(err); }

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
     * @param {function(err: ?Error)} callback Function called when the operation is finished.
     */
    'moveFile': function(filePath, targetDirectoryPath, callback) {
        var targetFileName = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.length);
        fs.rename(filePath, targetDirectoryPath + '/' + targetFileName, function (err) {
            callback(err);
        });
    }

};

module.exports = jpgConversionService;