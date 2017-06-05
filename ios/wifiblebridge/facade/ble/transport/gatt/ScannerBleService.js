/**
 * Created by marc on 21/08/16.
 */

var bleno = require('bleno');
var util = require('util');

/**
 * BLE service that provides the characteristics for exchanging data.
 *
 * @constructor
 * @param {RequestCharacteristic} requestCharacteristic
 * @param {ResponseCharacteristic} responseCharacteristic
 */
function ScannerBleService(requestCharacteristic, responseCharacteristic) {
    ScannerBleService.super_.call(this, {
        uuid: ScannerBleService.UUID,
        characteristics: [
            requestCharacteristic,
            responseCharacteristic
        ]
    });
}

util.inherits(ScannerBleService, bleno.PrimaryService);

/**
 * Service UUID to be sent via BLE.
 *
 * @constant
 * @type {String}
 */
ScannerBleService.UUID = '6bc10a15c106460e976488a6d5e2209e';

module.exports = ScannerBleService;
