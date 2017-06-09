/**
 * Application entrypoint.
 *
 * @author Marc Plouhinec
 */

const bleFacade = require('./facade/ble/bleFacade');
const ftpService = require('./service/ftpService');
const jpgConversionService = require('./service/jpgConversionService');
const distributionService = require('./service/distributionService');

// Start the services and facade
bleFacade.initialize();
ftpService.startDownloadingNewFilesRegularly();
jpgConversionService.startConvertingRegularly();
distributionService.startPreparingDocumentsRegularly();

// Stop the services after a while (for testing only)
// setTimeout(() => {
//     ftpService.stopDownloadingNewFilesRegularly();
//     jpgConversionService.stopConvertingRegularly();
//     distributionService.stopPreparingDocumentsRegularly();
// }, 21000);