/**
 * Application entrypoint.
 *
 * @author Marc Plouhinec
 */

var bleFacade = require('./facade/ble/bleFacade');

bleFacade.initialize();

var ftpService = require('./service/ftpService');
var jpgConversionService = require('./service/jpgConversionService');
var distributionService = require('./service/distributionService');
ftpService.startDownloadingNewFilesRegularly();
jpgConversionService.startConvertingRegularly();
distributionService.startPreparingDocumentsRegularly();
/*
setTimeout(function () {
    ftpService.stopDownloadingNewFilesRegularly();
    jpgConversionService.stopConvertingRegularly();
    distributionService.stopPreparingDocumentsRegularly();
}, 21000);
*/