//
//  GattManager.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 09/09/16.
//

import UIKit
import CoreBluetooth

///
/// Lowest-level code that deals with the BLE layer: services and characteristics.
///
class GattManager: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    
    fileprivate let LOGGER = Logger(name: "GattManager")
    
    fileprivate let BLE_SERVICE_CBUUID =                 CBUUID(string: "6bc10a15-c106-460e-9764-88a6d5e2209e")
    fileprivate let BLE_REQUEST_CHARACTERISTIC_CBUUID =  CBUUID(string: "c69cbca5-b78e-461a-b396-ad9744e65011")
    fileprivate let BLE_RESPONSE_CHARACTERISTIC_CBUUID = CBUUID(string: "7d9813b4-3a63-4136-81f9-1b83f2106fc2")
    
    fileprivate var active: Bool = false
    
    fileprivate var connectionStatusChangedListeners: [(_ status: BleConnectionStatus) -> Void] = []
    fileprivate var messageReceivedListeners: [(_ message: [UInt8]) -> Void] = []
    fileprivate var messageNotSentListeners: [(_ error: NSError) -> Void] = []
    
    fileprivate var centralManager: CBCentralManager!
    fileprivate var bleToWifiBridgePeripheral: CBPeripheral? = nil
    fileprivate var requestCharacteristic : CBCharacteristic? = nil
    
    ///
    /// Register a listener that is called when the application connection status via BLE to the ble-wifi-bridge changes.
    ///
    func registerBleConnectionStatusChangedListener(_ listener: @escaping (_ status: BleConnectionStatus) -> Void) {
        self.connectionStatusChangedListeners.append(listener)
    }
    
    ///
    /// Register a listener that is called when a message is received.
    ///
    func registerMessageReceivedListener(_ listener: @escaping (_ message: [UInt8]) -> Void) {
        self.messageReceivedListeners.append(listener)
    }
    
    ///
    /// Register a listener that is called if the last message was not sent.
    ///
    func registerMessageNotSentListener(_ listener: @escaping (_ error: NSError) -> Void) {
        self.messageNotSentListeners.append(listener)
    }
    
    ///
    /// Find the BLE-to-WiFi-bridge device and connect to it.
    ///
    func start() {
        active = true
        
        centralManager = CBCentralManager(delegate:self, queue:nil, options: [CBCentralManagerOptionShowPowerAlertKey: true])
        
        // Inform connection changed listeners that the connection has not started yet
        connectionStatusChangedListeners.forEach({listener in listener(.not_CONNECTED)})
        
        LOGGER.info("GattManager started.")
    }
    
    ///
    /// Disconnect from the device.
    ///
    func stop() {
        active = false
        
        // Disconnect from the peripheral
        if let peripheral = bleToWifiBridgePeripheral {
            centralManager.cancelPeripheralConnection(peripheral)
        }
        
        LOGGER.info("GattManager stopped.")
    }
    
    ///
    /// Send the given message.
    ///
    func sendMessage(_ message: [UInt8]) {
        LOGGER.debug("Send the message: \(message)")
        
        let messageData = Data(bytes: UnsafePointer<UInt8>(message), count: message.count)
        
        if let characteristic = requestCharacteristic, let peripheral = bleToWifiBridgePeripheral {
            peripheral.writeValue(messageData, for: characteristic, type: .withResponse)
        }
    }
    
    @objc func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            LOGGER.debug("Central Manager state update: PoweredOn")
            connectionStatusChangedListeners.forEach({listener in listener(.searching_FOR_BRIDGE)})
            self.centralManager.scanForPeripherals(withServices: [BLE_SERVICE_CBUUID], options: nil)
            break
        case .resetting:
            LOGGER.debug("Central Manager state update: Resetting")
            connectionStatusChangedListeners.forEach({listener in listener(.bluetooth_RESETTING)})
            break
        case .unsupported:
            LOGGER.debug("Central Manager state update: Unsupported")
            connectionStatusChangedListeners.forEach({listener in listener(.bluetooth_UNSUPPORTED)})
            break
        case .unauthorized:
            LOGGER.debug("Central Manager state update: Unauthorized")
            connectionStatusChangedListeners.forEach({listener in listener(.bluetooth_UNAUTHORIZED)})
            break
        case .poweredOff:
            LOGGER.debug("Central Manager state update: PoweredOff")
            connectionStatusChangedListeners.forEach({listener in listener(.bluetooth_POWEREDOFF)})
            break
        default:
            LOGGER.warn("Unsupported CentralManager state: \(central.state)")
        }
    }
    
    @objc func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
        LOGGER.info("Peripheral discovered: \(peripheral)")
        
        self.centralManager.stopScan()
        self.bleToWifiBridgePeripheral = peripheral
        peripheral.delegate = self
        self.centralManager.connect(peripheral, options: nil)
    }
    
    @objc func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        LOGGER.info("Peripheral connected: \(peripheral)")
        
        // Discover the services of the bridge
        peripheral.discoverServices([BLE_SERVICE_CBUUID])
    }
    
    @objc func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        LOGGER.warn("Unable to connect to the peripheral: \(peripheral)")
        
        self.bleToWifiBridgePeripheral = nil
        if active {
            connectionStatusChangedListeners.forEach({listener in listener(.searching_FOR_BRIDGE)})
            self.requestCharacteristic = nil
            self.centralManager.scanForPeripherals(withServices: [BLE_SERVICE_CBUUID], options: nil)
        } else {
            connectionStatusChangedListeners.forEach({listener in listener(.not_CONNECTED)})
        }
    }
    
    @objc func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        LOGGER.info("Peripheral disconnected: \(peripheral)")
        
        self.bleToWifiBridgePeripheral = nil
        if active {
            connectionStatusChangedListeners.forEach({listener in listener(.searching_FOR_BRIDGE)})
            self.requestCharacteristic = nil
            self.centralManager.scanForPeripherals(withServices: [BLE_SERVICE_CBUUID], options: nil)
        } else {
            connectionStatusChangedListeners.forEach({listener in listener(.not_CONNECTED)})
        }
    }
    
    @objc func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        LOGGER.info("Services discovered: \(String(describing: peripheral.services))")
        
        // Discover the characteristics
        if let services = peripheral.services {
            for service in services {
                if service.uuid.isEqual(BLE_SERVICE_CBUUID) {
                    peripheral.discoverCharacteristics([BLE_REQUEST_CHARACTERISTIC_CBUUID, BLE_RESPONSE_CHARACTERISTIC_CBUUID], for: service)
                }
            }
        }
    }
    
    @objc func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        LOGGER.info("Characteristics discovered: \(String(describing: service.characteristics))")
        
        if let characteristics = service.characteristics {
            for characteristic in characteristics {
                if characteristic.uuid.isEqual(BLE_REQUEST_CHARACTERISTIC_CBUUID) {
                    // Save the request characteristic
                    self.requestCharacteristic = characteristic
                } else if characteristic.uuid.isEqual(BLE_RESPONSE_CHARACTERISTIC_CBUUID) {
                    // Subscribe to the response notification
                    self.bleToWifiBridgePeripheral?.setNotifyValue(true, for: characteristic)
                    
                    // Inform the listeners that we are connected
                    connectionStatusChangedListeners.forEach({listener in listener(.connected)})
                }
            }
        }
    }
    
    @objc func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        
        if let e = error {
            LOGGER.warn("Unable to write characteristic value: \(String(describing: error))")
            self.messageNotSentListeners.forEach({listener in listener(e as NSError)})
        } else {
            LOGGER.debug("Characteristic value written.")
        }
    }
    
    @objc func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let e = error {
            LOGGER.error("Error in didUpdateValueForCharacteristic: \(e.localizedDescription)")
        } else if characteristic.uuid.isEqual(BLE_RESPONSE_CHARACTERISTIC_CBUUID) {
            if let value = characteristic.value {
                let message: [UInt8] = Array<UInt8>(repeating: 0, count: value.count)
                (value as NSData).getBytes(UnsafeMutableRawPointer(mutating: message), length: value.count)
                
                LOGGER.debug("Characteristic value updated: \(message)")
                self.messageReceivedListeners.forEach({listener in listener(message)})
            }
        }
    }
}
