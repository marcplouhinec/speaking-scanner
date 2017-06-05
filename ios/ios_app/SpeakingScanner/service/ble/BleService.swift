//
//  BleFacade.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 13/09/16.
//

import UIKit

///
/// Give access to the rest of the application for the BLE-to-WiFi bridge.
///
protocol BleService {
    
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
    /// Get the number of scanned documents.
    ///
    func getNbDocuments(onResponseReceived: @escaping (_ nbDocuments: Int, _ error: NSError?) -> Void)
    
    ///
    /// Get the names of the scanned documents by the given index and count.
    ///
    func getDocumentNamesByIndexAndCount(index: UInt16, count: UInt16, onResponseReceived: @escaping (_ documentNames: [String], _ error: NSError?) -> Void)
    
    ///
    /// Get the document preview by index.
    ///
    func getDocumentPreviewByIndex(index: UInt16, onResponseReceived: @escaping (_ documentPreview: Data, _ error: NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void)
    
    ///
    /// Get the document in a compressed format by the given index.
    ///
    func getCompressedDocumentByIndex(index: UInt16, onResponseReceived: @escaping (_ documentData: Data, _ error: NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void)
    
}
