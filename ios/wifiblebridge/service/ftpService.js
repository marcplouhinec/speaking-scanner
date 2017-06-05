var fs = require("fs");
var JSFtp = require("jsftp");
var configuration = require('../configuration');

/**
 * Regularly connect via FTP to the scanner and download new files.
 * 
 * @author Marc Plouhinec
 */
var ftpService = {

    /**
     * @private
     * @type {boolean}
     */
    'automaticDownloadingActive': false,

    /**
     * Start the regular process of downloading new documents.
     */
    'startDownloadingNewFilesRegularly': function () {
        var self = this;

        this.automaticDownloadingActive = true;

        // Schedule the next automatic download
        var automaticDownload = function () {
            if (self.automaticDownloadingActive) {
                self.downloadNewFtpFiles(function (err) {
                    if (err) {
                        console.log(err);
                    }

                    // Schedule the next automatic download
                    setTimeout(automaticDownload, configuration.ftpServiceAutomaticDownloadingPeriodMs);
                });
            }
        };
        setTimeout(automaticDownload, configuration.ftpServiceAutomaticDownloadingPeriodMs);
    },

    /**
     * Stop the downloading process.
     */
    'stopDownloadingNewFilesRegularly': function () {
        this.automaticDownloadingActive = false;
    },

    /**
     * Connect to the scanner via FTP, download new files and close the connection.
     * 
     * @private
     * @param {function(err: ?Error)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    'downloadNewFtpFiles': function (callback) {
        var self = this;

        // Open a connection to the FTP server
        var ftp = new JSFtp({
			host: configuration.scannerFtpHost,
			port: configuration.scannerFtpPort,
			user: configuration.scannerFtpUser, 
			pass: configuration.scannerFtpPassword
		});

        // Prepare an error handler that close the FTP connection
        var handleError = function (err) {
            ftp.raw.quit(function(err2, data) {
				if (err2) { console.error(err2) };
                callback(err);
			});
        };

        // Find the file paths on the server
        this.findAllFtpFilesOnServer(ftp, configuration.scannerFtpBasePath, function (err, serverFilePaths) {
            if (err) { return handleError(err); }

            // Find the files in the local folder
            fs.readdir(configuration.localFtpDownloadedPath, function (err, localFileNames) {
                if (err) { return handleError(err); }

                // Index the local file names in a set
                var trueBylocalFileName = {};
                for (var j = 0; j < localFileNames.length; j++) {
                    trueBylocalFileName[localFileNames[j]] = true;
                }

                // Compare the local files with the ones from the FTP server
                var newServerFilePaths = [];
                for (var i = 0; i < serverFilePaths.length; i++) {
                    var serverFilePath = serverFilePaths[i];
                    var correspondingLocalFileName = serverFilePath.replace(/\//g, '_');
                    if (!trueBylocalFileName[correspondingLocalFileName]) {
                        newServerFilePaths.push(serverFilePath);
                    }
                }

                // Download each new server file
                self.downloadFtpFiles(ftp, newServerFilePaths, function (err) {
                    if (err) { return handleError(err); }

                    // Close the connection
                    ftp.raw.quit(function(err, data) {
                        if (err) { return handleError(err); }

                        callback(null);
                    });
                });
            });
        });
    },

    /**
     * Recursively find all the files on the FTP server.
     * 
     * @private
     * @param {JSFtp} ftp
     *     FTP service.
     * @param {string} basePath
     *     Current directory path on the FTP folder.
     * @param {function(err: ?Error, filePaths: Array.<string>)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    'findAllFtpFilesOnServer': function (ftp, basePath, callback) {
        var self = this;

        ftp.ls(basePath, function(err, files) {
            if (err) {
                callback(err, []);
                return;
            }

            var filePaths = [];
            var processFile = function (fileIndex) {
                if (fileIndex >= files.length) {
                    callback(null, filePaths);
                    return;
                }

                var file = files[fileIndex]
                var fileName = file.name;

                if (file.type === 1) { // Directory
                    self.findAllFtpFilesOnServer(ftp, basePath + '/' + fileName, function (err, subFilePaths) {
                        if (err) {
                            callback(err, []);
                            return;
                        }

                        for (var i = 0; i < subFilePaths.length; i++) {
                            filePaths.push(fileName + '/' + subFilePaths[i]);
                        }

                        processFile(fileIndex + 1);
                    });

                } else { // File
                    var isJpg = fileName.toLowerCase().endsWith('.jpg');
                    var isPdf = fileName.toLowerCase().endsWith('.pdf');
                    if (isJpg || isPdf) {
                        filePaths.push(fileName);
                    }

                    processFile(fileIndex + 1);
                }
            };
            processFile(0);
		});
    },

    /**
     * Download the given files into the configured localFtpDownloadedPath.
     * 
     * @private
     * @param {JSFtp} ftp
     *     FTP service.
     * @param {Array.<string>} serverFilePaths
     *     File paths on the FTP folder.
     * @param {function(err: ?Error)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    'downloadFtpFiles': function (ftp, serverFilePaths, callback) {
        var self = this;

        var downloadFileAt = function (fileIndex) {
            if (fileIndex >= serverFilePaths.length) {
                callback();
                return;
            }

            self.downloadFtpFile(ftp, serverFilePaths[fileIndex], function (err) {
                if (err) {
                    callback(err);
                    return;
                }

                downloadFileAt(fileIndex + 1);
            });
        };
        downloadFileAt(0);
    },

    /**
     * Download the given file into the configured localFtpDownloadedPath.
     * 
     * @private
     * @param {JSFtp} ftp
     *     FTP service.
     * @param {string} serverFilePath
     *     File path on the FTP folder.
     * @param {function(err: ?Error)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    'downloadFtpFile': function (ftp, serverFilePath, callback) {
        // Download the file into a downloading folder
        var localFileName = serverFilePath.replace(/\//g, '_');
        var localFilePath = configuration.localFtpDownloadingPath + '/' + localFileName;
        var completeServerFilePath = configuration.scannerFtpBasePath + '/' + serverFilePath;
        console.log('Download the file via FTP: ' + localFileName);
        ftp.get(completeServerFilePath, localFilePath, function (hadErr) {
            if (hadErr) {
                callback(new Error(
                    'Unable to download the file ' + serverFilePath + ' into ' + localFilePath + '.'));
                return;
            }

            // Move the file into the downloaded folder
            var newLocalFilePath = configuration.localFtpDownloadedPath + '/' + localFileName;
            fs.rename(localFilePath, newLocalFilePath, function (err) {
                callback(err);
            });
        });
    }

};

module.exports = ftpService;