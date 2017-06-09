const fs = require("fs");
const _ = require('lodash');
const JSFtp = require("jsftp");
const configuration = require('../configuration');

/**
 * Regularly connect via FTP to the scanner and download new files.
 *
 * @author Marc Plouhinec
 */
const ftpService = {

    /**
     * @private
     * @type {boolean}
     */
    automaticDownloadingActive: false,

    /**
     * Start the regular process of downloading new documents.
     */
    startDownloadingNewFilesRegularly() {
        this.automaticDownloadingActive = true;

        // Schedule the next automatic download
        const automaticDownload = () => {
            if (this.automaticDownloadingActive) {
                this.downloadNewFtpFiles(err => {
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
    stopDownloadingNewFilesRegularly() {
        this.automaticDownloadingActive = false;
    },

    /**
     * Connect to the scanner via FTP, download new files and close the connection.
     *
     * @private
     * @param {function(err: Error?)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    downloadNewFtpFiles(callback) {
        // Open a connection to the FTP server
        const ftp = new JSFtp({
            host: configuration.scannerFtpHost,
            port: configuration.scannerFtpPort,
            user: configuration.scannerFtpUser,
            pass: configuration.scannerFtpPassword
        });

        // Prepare an error handler that close the FTP connection
        const handleError = err => {
            ftp.raw('quit', err2 => {
                if (err2) {
                    console.error(err2)
                }

                callback(err);
            });
        };

        // Find the file paths on the server
        this.findAllFtpFilesOnServer(ftp, configuration.scannerFtpBasePath, (err, serverFilePaths) => {
            if (err) {
                return handleError(err);
            }

            // Find the files in the local folder
            fs.readdir(configuration.localFtpDownloadedPath, (err, localFileNames) => {
                if (err) {
                    return handleError(err);
                }

                // Compare the local files with the ones from the FTP server
                const localFileNameSet = new Set(localFileNames);
                const newServerFilePaths = _.filter(serverFilePaths, path => !localFileNameSet.has(path.replace(/\//g, '_')));

                // Download each new server file
                this.downloadFtpFiles(ftp, newServerFilePaths, err => {
                    if (err) {
                        return handleError(err);
                    }

                    // Close the connection
                    ftp.raw('quit', err => {
                        if (err) {
                            return handleError(err);
                        }

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
     * @param {function(err: Error?, filePaths: Array.<string>)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    findAllFtpFilesOnServer(ftp, basePath, callback) {
        ftp.ls(basePath, (err, files) => {
            if (err) {
                callback(err, []);
                return;
            }

            const filePaths = [];
            const processFile = fileIndex => {
                if (fileIndex >= files.length) {
                    callback(null, filePaths);
                    return;
                }

                const file = files[fileIndex];
                const fileName = file.name;

                if (file.type === 1) { // Directory
                    this.findAllFtpFilesOnServer(ftp, basePath + '/' + fileName, (err, subFilePaths) => {
                        if (err) {
                            callback(err, []);
                            return;
                        }

                        subFilePaths.forEach(path => filePaths.push(fileName + '/' + path));

                        processFile(fileIndex + 1);
                    });

                } else { // File
                    const isJpg = fileName.toLowerCase().endsWith('.jpg');
                    const isPdf = fileName.toLowerCase().endsWith('.pdf');
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
     * @param {function(err: Error?)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    downloadFtpFiles(ftp, serverFilePaths, callback) {
        const downloadFileAt = fileIndex => {
            if (fileIndex >= serverFilePaths.length) {
                callback();
                return;
            }

            this.downloadFtpFile(ftp, serverFilePaths[fileIndex], err => {
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
     * @param {function(err: Error?)} callback
     *     Function called when the operation is finished sucessfully (err = null) or with an error.
     */
    downloadFtpFile(ftp, serverFilePath, callback) {
        // Download the file into a downloading folder
        const localFileName = serverFilePath.replace(/\//g, '_');
        const localFilePath = configuration.localFtpDownloadingPath + '/' + localFileName;
        const completeServerFilePath = configuration.scannerFtpBasePath + '/' + serverFilePath;
        console.log('Download the file via FTP: ' + localFileName);
        ftp.get(completeServerFilePath, localFilePath, hadErr => {
            if (hadErr) {
                callback(new Error(
                    'Unable to download the file ' + serverFilePath + ' into ' + localFilePath + '.'));
                return;
            }

            // Move the file into the downloaded folder
            const newLocalFilePath = configuration.localFtpDownloadedPath + '/' + localFileName;
            fs.rename(localFilePath, newLocalFilePath, err => {
                callback(err);
            });
        });
    }

};

module.exports = ftpService;