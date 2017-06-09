const bleno = require('bleno');

/** Service UUID to be sent via BLE. */
const UUID = '6bc10a15c106460e976488a6d5e2209e';

/**
 * BLE service that provides the characteristics for exchanging data.
 *
 * @author Marc Plouhinec
 */
class ScannerBleService extends bleno.PrimaryService {

    /**
     * @returns {string} Service UUID to be sent via BLE.
     */
    static getUUID() {
        return UUID;
    };

    /**
     * Constructor.
     *
     * @param {RequestCharacteristic} requestCharacteristic
     * @param {ResponseCharacteristic} responseCharacteristic
     */
    constructor(requestCharacteristic, responseCharacteristic) {
        super({
            uuid: UUID,
            characteristics: [
                requestCharacteristic,
                responseCharacteristic
            ]
        });
    }
}

module.exports = ScannerBleService;
