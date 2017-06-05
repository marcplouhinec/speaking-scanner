//
//  BleFacadeImpl.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 13/09/16.
//

import UIKit

///
/// Default implementation of BleFacade.
///
class BleServiceImpl : BleService {
    
    fileprivate static let INSTANCE = BleServiceImpl()
    let transportManager: TransportManager = BleTransportManager.getInstance()
    var isConnected = false;
    
    ///
    /// Get the singleton instance.
    ///
    static func getInstance() -> BleServiceImpl {
        return BleServiceImpl.INSTANCE
    }
    
    fileprivate init() {
        self.transportManager.registerBleConnectionStatusChangedListener(listener: { status in
            if status.rawValue >= BleConnectionStatus.connected.rawValue {
                self.isConnected = true
            } else {
                self.isConnected = false
            }
        })
    }

    func registerBleConnectionStatusChangedListener(listener: @escaping (_ status: BleConnectionStatus) -> Void) {
        self.transportManager.registerBleConnectionStatusChangedListener(listener: listener)
    }
    
    func start() {
        self.transportManager.start()
    }
    
    func stop() {
        self.transportManager.stop()
    }
    
    func getNbDocuments(onResponseReceived: @escaping (_ nbDocuments: Int, _ error: NSError?) -> Void) {
        if !self.isConnected {
            onResponseReceived(0, NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.not_CONNECTED.rawValue, userInfo: nil))
            return
        }
        
        self.transportManager.requestJsonObject(action: .get_NB_DOCUMENTS, payload: [], onMessageReceived: { result, error in
            if let e = error {
                onResponseReceived(0, e)
            } else {
                let nbDocuments = result["nbDocuments"] as! Int
                onResponseReceived(nbDocuments, nil)
            }
        }, onProgressUpdate: { _ in })
    }
    
    func getDocumentNamesByIndexAndCount(index: UInt16, count: UInt16, onResponseReceived: @escaping (_ documentNames: [String], _ error: NSError?) -> Void) {
        if !self.isConnected {
            onResponseReceived([], NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.not_CONNECTED.rawValue, userInfo: nil))
            return
        }
        
        let indexByte1: UInt8 = UInt8(floor(Double(index) / 0x100))
        let indexByte2: UInt8 = UInt8(index - UInt16(indexByte1) * 0x100)
        let countByte1: UInt8 = UInt8(floor(Double(count) / 0x100))
        let countByte2: UInt8 = UInt8(count - UInt16(countByte1) * 0x100)
        let payload: [UInt8] = [indexByte1, indexByte2, countByte1, countByte2]
        
        self.transportManager.requestJsonObject(action: .get_DOCUMENT_NAMES_BY_INDEX_AND_COUNT, payload: payload, onMessageReceived: { result, error in
            if let e = error {
                onResponseReceived([], e)
            } else {
                let documentNames = result["documentNames"] as! [String]
                onResponseReceived(documentNames, nil)
            }
        }, onProgressUpdate: {_ in })
    }
    
    func getDocumentPreviewByIndex(index: UInt16, onResponseReceived: @escaping (_ documentPreview: Data, _ error: NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void) {
        if !self.isConnected {
            onResponseReceived(Data(), NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.not_CONNECTED.rawValue, userInfo: nil))
            return
        }
        
        let indexByte1: UInt8 = UInt8(floor(Double(index) / 0x100))
        let indexByte2: UInt8 = UInt8(index - UInt16(indexByte1) * 0x100)
        let payload: [UInt8] = [indexByte1, indexByte2, 0, 0]
        self.transportManager.requestBinaryData(action: .get_DOCUMENT_PREVIEW_BY_INDEX, payload: payload, onMessageReceived: { result, error in
            if let e = error {
                onResponseReceived(Data(), e)
            } else {
                onResponseReceived(result, nil)
            }
        }, onProgressUpdate: onProgressUpdate)
    }
    
    func getCompressedDocumentByIndex(index: UInt16, onResponseReceived: @escaping (_ documentData: Data, _ error: NSError?) -> Void, onProgressUpdate: @escaping  (_ progressPercentage: Int) -> Void) {
        if !self.isConnected {
            onResponseReceived(Data(), NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.not_CONNECTED.rawValue, userInfo: nil))
            return
        }
        
        let indexByte1: UInt8 = UInt8(floor(Double(index) / 0x100))
        let indexByte2: UInt8 = UInt8(index - UInt16(indexByte1) * 0x100)
        let payload: [UInt8] = [indexByte1, indexByte2, 0, 0]
        self.transportManager.requestBinaryData(action: .get_COMPRESSED_DOCUMENT_BY_INDEX, payload: payload, onMessageReceived: { result, error in
            if let e = error {
                onResponseReceived(Data(), e)
            } else {
                onResponseReceived(result, nil)
            }
        }, onProgressUpdate: onProgressUpdate)
    }


}
