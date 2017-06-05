//
//  Handle the communication at a low-level.
//
//  Created by Marc Plouhinec on 31/08/16.
//  Copyright © 2016 Marc Plouhinec. All rights reserved.
//

import UIKit

///
/// Handle the low-level part of the communication between this application and a server.
///
protocol TransportManager {
    
    ///
    /// Register a listener that is called when the application connection status via BLE to the ble-wifi-bridge changes.
    ///
    func registerBleConnectionStatusChangedListener(listener: @escaping (_ status: BleConnectionStatus) -> Void)
    
    ///
    /// Start searching for ble-wifi-bridge and handling communication.
    ///
    func start()
    
    ///
    /// Opposite of the start() function.
    ///
    func stop()
    
    ///
    /// Make a request to the ble-wifi-bridge and get a result as JSON data.
    ///
    func requestJsonObject(action: BleRequestAction, payload: [UInt8], onMessageReceived: @escaping (NSDictionary, NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void)
    
    ///
    /// Make a request to the ble-wifi-bridge and get a result as binary data.
    ///
    func requestBinaryData(action: BleRequestAction, payload: [UInt8], onMessageReceived: @escaping (Data, NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void)
    
}
