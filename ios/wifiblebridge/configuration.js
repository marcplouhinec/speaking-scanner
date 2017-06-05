/**
 * Configuration parameters.
 */
var configuration = {
	
	scannerFtpHost: '10.10.100.1', // For tests: https://cartwrightlab.wikispaces.com/Setting+up+an+FTP+server+on+a+Mac
    scannerFtpPort: 21,
    scannerFtpUser: 'dsmobile',
    scannerFtpPassword: 'dsmobile',
	scannerFtpBasePath: '/sda1/DCIM',

    localFtpDownloadingPath: '/var/speakingscanner/ftpreception/downloading',
    localFtpDownloadedPath: '/var/speakingscanner/ftpreception/downloaded',
    localToJpgConvertingPath: '/var/speakingscanner/jpgconversion/converting',
    localToJpgConvertedPath: '/var/speakingscanner/jpgconversion/converted',
    distributionPreparationPath: '/var/speakingscanner/distribution/preparation',
    distributionPreparationThumbnailsPath: '/var/speakingscanner/distribution/preparation/thumnails',
    distributionReadyPath: '/var/speakingscanner/distribution/ready',
    distributionReadyThumbnailsPath: '/var/speakingscanner/distribution/ready/thumnails',
    
    ftpServiceAutomaticDownloadingPeriodMs: 1000,
    toJpgConversionServiceAutomaticConversionPeriodMs: 1000,
    distributionServiceAutomaticConversionPeriodMs: 1000
};

module.exports = configuration;
