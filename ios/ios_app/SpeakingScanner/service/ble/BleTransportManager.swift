//
//  BleTransportManager.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 03/09/16.
//

import UIKit
import CoreBluetooth

///
/// Default implementation of TransportManager.
///
class BleTransportManager: TransportManager {

    fileprivate let LOGGER = Logger(name: "BleTransportManager")
    fileprivate static let INSTANCE = BleTransportManager()
    
    fileprivate static let BLE_MESSAGE_SIZE = 20
    fileprivate static let BLE_RESPONSE_PAYLOAD_SIZE = 18
    fileprivate static let RECEPTION_WINDOW_BUFFER_SIZE = 2048
    fileprivate static let ACKNOWLEDGEMENT_INDICTOR_SIZE =
        Int(ceil(Double(RECEPTION_WINDOW_BUFFER_SIZE) / Double(BLE_RESPONSE_PAYLOAD_SIZE)))
    fileprivate static let BLE_CONNECTION_INTERVAL_MS = 30
    fileprivate static let ACKNOWLEDGEMENT_SENDING_PERIOD_MS = BLE_CONNECTION_INTERVAL_MS * 10
    
    fileprivate let gattManager = GattManager()
    
    fileprivate var receptionWindowBuffer: [UInt8] = Array<UInt8>(repeating: 0, count: RECEPTION_WINDOW_BUFFER_SIZE)
    fileprivate var acknowledgementWindowIndicators: [Bool] = Array<Bool>(repeating: false, count: ACKNOWLEDGEMENT_INDICTOR_SIZE)
    fileprivate var completeResponseBuffer: [UInt8] = [] // contains: <total length> + <payload> + <CRC8 of the payload>
    fileprivate var receptionWindowCursor = 0 // Next byte index where to save the next reception window into the complete response
    var receptionWindowParityBit: Bool = false // Parity bit of the current reception window
    fileprivate var onResponseReceivedCompletely: (Data, NSError?) -> Void = {_ in }
    fileprivate var onProgressUpdate: (_ progressPercentage: Int) -> Void = {_ in }
    var nextCorrelationId: UInt8 = 0
    var currentRequestMessage : [UInt8] = []
    var requestMessageWaitingToBeSent = false
    
    ///
    /// Get the singleton instance.
    ///
    static func getInstance() -> BleTransportManager {
        return BleTransportManager.INSTANCE
    }
    
    fileprivate init() {
        self.gattManager.registerMessageReceivedListener(onMessageReceived)
        self.gattManager.registerMessageNotSentListener(onMessageNotSent)
    }
    
    func registerBleConnectionStatusChangedListener(listener: @escaping (_ status: BleConnectionStatus) -> Void) {
        self.gattManager.registerBleConnectionStatusChangedListener(listener)
    }

    func start() {
        self.gattManager.start()
    }
    
    func stop() {
        self.gattManager.stop()
    }
    
    func requestJsonObject(action: BleRequestAction, payload: [UInt8], onMessageReceived: @escaping (NSDictionary, NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void) {
        LOGGER.debug("Request JSON object (action = \(action), payload = \(payload)).")
        
        requestBinaryData(action: action, payload: payload, onMessageReceived: {result, error in
            if let e = error {
                onMessageReceived(NSDictionary(), e)
            } else {
                do {
                    let parsedValue: NSDictionary = try JSONSerialization.jsonObject(with: result, options: JSONSerialization.ReadingOptions()) as! NSDictionary
                    self.LOGGER.debug("JSON object received: \(parsedValue)")
                    onMessageReceived(parsedValue, nil)
                } catch {
                    self.LOGGER.error("Unable to parse the received message: \(error)", error: error)
                    onMessageReceived(NSDictionary(), NSError(domain: "fr.marcworld.scanandell", code: ErrorCode.invalid_JSON_OBJECT.rawValue, userInfo: nil))
                }
            }
            
        }, onProgressUpdate: onProgressUpdate)
    }

    func requestBinaryData(action: BleRequestAction, payload: [UInt8], onMessageReceived: @escaping (Data, NSError?) -> Void, onProgressUpdate: @escaping (_ progressPercentage: Int) -> Void) {
        LOGGER.debug("Request binary data (action = \(action), payload = \(payload)).")
        
        // TODO Handle a global timeout
        
        // Reset the response buffers and indicators
        self.receptionWindowBuffer = Array<UInt8>(repeating: 0, count: BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE)
        self.acknowledgementWindowIndicators = Array<Bool>(
            repeating: false, count: BleTransportManager.ACKNOWLEDGEMENT_INDICTOR_SIZE)
        self.completeResponseBuffer = []
        self.receptionWindowCursor = 0
        self.receptionWindowParityBit = false
        
        // Register the callbacks
        self.onResponseReceivedCompletely = onMessageReceived
        self.onProgressUpdate = onProgressUpdate
        
        // Set the progress to 0
        self.onProgressUpdate(0)
        
        // Generate a new correlation ID
        let correlationId = self.nextCorrelationId
        self.nextCorrelationId = (self.nextCorrelationId + 1) % 32
        
        // Build the request message
        var requestMessage : [UInt8] = Array<UInt8>(repeating: 0, count: BleTransportManager.BLE_MESSAGE_SIZE)
        requestMessage[0] = (action.rawValue << 5) + correlationId
        
        for i in 0..<(payload.count > 4 ? 4 : payload.count) {
            requestMessage[i + 1] = payload[i]
        }
        
        // Send the request message
        LOGGER.debug("Send the request message (correlationId = \(correlationId), action = \(action), payload = \(payload)).")
        overrideCurrentRequestMessageAndTriggerNextSendingSession(requestMessage)
    }
    
    ///
    /// Method called when a message was not sent.
    ///
    fileprivate func onMessageNotSent(_ error: NSError) {
        // Send the request message again after ACKNOWLEDGEMENT_SENDING_PERIOD_MS milliseconds
        LOGGER.warn("Error: unable to send the last request. Retry laters...")
        overrideCurrentRequestMessageAndTriggerNextSendingSession(self.currentRequestMessage)
    }
    
    ///
    /// Save the given request message instead of the current one, and trigger the next sending session
    /// if it is not already triggerred.
    ///
    fileprivate func overrideCurrentRequestMessageAndTriggerNextSendingSession(_ requestMessage: [UInt8]) {
        LOGGER.debug("Save the following value into the current request message: \(requestMessage)")
        self.currentRequestMessage = requestMessage
        
        if !self.requestMessageWaitingToBeSent {
            self.requestMessageWaitingToBeSent = true
            LOGGER.debug("Wait \(BleTransportManager.ACKNOWLEDGEMENT_SENDING_PERIOD_MS)ms before sending the request message.")
            
            let dispatchTime = DispatchTime.now() + Double(Int64(BleTransportManager.ACKNOWLEDGEMENT_SENDING_PERIOD_MS * Int(NSEC_PER_MSEC))) / Double(NSEC_PER_SEC)
            DispatchQueue.main.asyncAfter(deadline: dispatchTime, execute: {
                self.requestMessageWaitingToBeSent = false
                self.gattManager.sendMessage(self.currentRequestMessage)
            })
        } else {
            LOGGER.debug("The current sending session is already triggered.")
        }
    }
    
    ///
    /// Method called when a message has been received.
    ///
    fileprivate func onMessageReceived(_ message: [UInt8]) {
        let parityBit: Bool = (message[0] & 0b10000000) != 0
        let packetIndex = Int(message[0] & 0b01111111)
        let payload = Array<UInt8>(message.dropFirst().dropLast())
        let receivedCrc = message[BleTransportManager.BLE_RESPONSE_PAYLOAD_SIZE + 1]
        LOGGER.debug("Message received (parityBit = \(parityBit), packetIndex = \(packetIndex), payload = \(payload), receivedCrc = \(receivedCrc)): \(message)")
        
        // Check the CRC
        let computedCrc = CrcUtils.computeCrc8(payload)
        if receivedCrc != computedCrc {
            LOGGER.debug("Payload invalid because of the CRC check: receivedCrc = \(receivedCrc), computedCrc = \(computedCrc)")
            
            // Resend the current request message with non-updated ACK indicators
            overrideCurrentRequestMessageAndTriggerNextSendingSession(self.currentRequestMessage)
            
            return
        }
        
        // Check if we missed the first packet that contains the message size
        if packetIndex != 0 && self.completeResponseBuffer.count == 0 {
            LOGGER.debug("The first payload containing the total message length is missing!")
            
            // Resend the current request message with non-updated ACK indicators
            overrideCurrentRequestMessageAndTriggerNextSendingSession(self.currentRequestMessage)
            
            return
        }
        
        // Check if the packet belong to the current reception window
        if parityBit != self.receptionWindowParityBit {
            LOGGER.debug("New reception window detected thanks to the parity bit change (old value = \(self.receptionWindowParityBit), new value = \(parityBit)).")
            
            // Reset the response buffers and indicators
            self.receptionWindowBuffer = Array<UInt8>(
                repeating: 0, count: BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE)
            self.acknowledgementWindowIndicators = Array<Bool>(
                repeating: false, count: BleTransportManager.ACKNOWLEDGEMENT_INDICTOR_SIZE)
            self.receptionWindowParityBit = parityBit
            
            // Fill the ACK indicators
            fillAcknowledgementIndicatorsCorresponsingToNonExistentBytes()
        }
        
        // Check if we already got this message
        if self.acknowledgementWindowIndicators[packetIndex] {
            LOGGER.debug("This packet was already received (packetIndex = \(packetIndex)).")
            
            // Resend the current request message with non-updated ACK indicators
            overrideCurrentRequestMessageAndTriggerNextSendingSession(self.currentRequestMessage)
            
            return
        }
        
        // Copy the payload into the current window buffer
        for i in 0..<BleTransportManager.BLE_RESPONSE_PAYLOAD_SIZE {
            let receptionWindowBufferIndex = packetIndex * BleTransportManager.BLE_RESPONSE_PAYLOAD_SIZE + i
            if receptionWindowBufferIndex < self.receptionWindowBuffer.count {
                self.receptionWindowBuffer[receptionWindowBufferIndex] = payload[i]
            }
        }
        
        // Initialize the complete response buffer if applicable
        if packetIndex == 0 && self.completeResponseBuffer.count == 0 {
            let completeResponseSize =
                Int(receptionWindowBuffer[0]) * 0x1000000 +
                Int(receptionWindowBuffer[1]) * 0x10000 +
                Int(receptionWindowBuffer[2]) * 0x100 +
                Int(receptionWindowBuffer[3])
            LOGGER.debug("Initialize the complete response buffer to \(completeResponseSize) bytes.")
            self.completeResponseBuffer = Array<UInt8>(repeating: 0, count: completeResponseSize)
            
            // Fill the ACK indicators
            fillAcknowledgementIndicatorsCorresponsingToNonExistentBytes()
        }
        
        // Update the packet acknowledgement indicator
        LOGGER.debug("Update the ACK indicators at \(packetIndex): \(self.acknowledgementWindowIndicators)")
        self.acknowledgementWindowIndicators[packetIndex] = true
        fillCurrentRequestMessageAcknowledgementBit(packetIndex)
        
        // Send the acknowledgement message in the next session
        overrideCurrentRequestMessageAndTriggerNextSendingSession(self.currentRequestMessage)
        
        // Copy the reception window data into the complete response buffer if applicable
        let isReceptionWindowCompleted = !self.acknowledgementWindowIndicators.contains(false)
        if isReceptionWindowCompleted {
            let startIndex = self.receptionWindowCursor
            let endIndex = (startIndex + BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE) > self.completeResponseBuffer.count ?
                self.completeResponseBuffer.count : startIndex + BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE
            LOGGER.debug("Copy the reception window to the complete response buffer (startIndex = \(startIndex), endIndex = \(endIndex)).")
            
            for i in startIndex..<endIndex {
                self.completeResponseBuffer[i] = receptionWindowBuffer[i - startIndex]
            }
            
            self.receptionWindowCursor += BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE
                
            // Inform the progress callback
            self.onProgressUpdate(endIndex * 100 / self.completeResponseBuffer.count)
        }
        
        // Call the onCompleteResponseReceived listener if the message is complete
        let isResponseCompletelyReceived = self.receptionWindowCursor >= self.completeResponseBuffer.count
        if isResponseCompletelyReceived {
            // Extract the payload (remove the length and CRC)
            let payload: [UInt8] = Array<UInt8>(self.completeResponseBuffer.dropFirst(4).dropLast())
            
            // Check the CRC
            let receivedCrc = self.completeResponseBuffer[self.completeResponseBuffer.count - 1]
            let computedCrc = CrcUtils.computeCrc8(payload)
            
            // Inform the progress callback
            self.onProgressUpdate(100)
            
            // Before returning the result, make sure the last ACK message is sent
            LOGGER.debug("Wait for the last ACK message to be sent...")
            func waitForAckMessage(onAckMessageSend: @escaping () -> Void) {
                if (!self.requestMessageWaitingToBeSent) {
                    onAckMessageSend()
                } else {
                    let dispatchTime = DispatchTime.now() + Double(Int64(BleTransportManager.ACKNOWLEDGEMENT_SENDING_PERIOD_MS * Int(NSEC_PER_MSEC))) / Double(NSEC_PER_SEC)
                    DispatchQueue.main.asyncAfter(deadline: dispatchTime, execute: {
                        waitForAckMessage(onAckMessageSend: onAckMessageSend)
                    })
                }
            }
            waitForAckMessage(onAckMessageSend: {
                // Send the result
                self.LOGGER.debug("Return the complete response (receivedCrc = \(receivedCrc), computedCrc = \(computedCrc)): \(payload)")
                let payloadData = Data(bytes: UnsafePointer<UInt8>(payload), count: payload.count)
                if receivedCrc == computedCrc {
                    self.onResponseReceivedCompletely(payloadData, nil)
                } else {
                    self.onResponseReceivedCompletely(payloadData, NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.different_CRC.rawValue, userInfo: nil))
                }
            })
        }
    }
    
    ///
    /// If the next reception window is smaller than RECEPTION_WINDOW_BUFFER_SIZE,
    /// Set the ack indicators corresponding to the missing bytes to true.
    ///
    fileprivate func fillAcknowledgementIndicatorsCorresponsingToNonExistentBytes() {
        let nbRemainingBytes = self.completeResponseBuffer.count - self.receptionWindowCursor
        if nbRemainingBytes > 0 && nbRemainingBytes < BleTransportManager.RECEPTION_WINDOW_BUFFER_SIZE {
            let nbRemainingPackets =
                Int(ceil(Double(nbRemainingBytes) / Double(BleTransportManager.BLE_RESPONSE_PAYLOAD_SIZE)))
            let nbNonExistentPackets = BleTransportManager.ACKNOWLEDGEMENT_INDICTOR_SIZE - nbRemainingPackets
            let startIndex = BleTransportManager.ACKNOWLEDGEMENT_INDICTOR_SIZE - nbNonExistentPackets
            let endIndex = BleTransportManager.ACKNOWLEDGEMENT_INDICTOR_SIZE
            LOGGER.debug("Fill the last \(nbNonExistentPackets) ACK indicators that corresponds to non-existing packets (startIndex = \(startIndex), endIndex = \(endIndex)).")
            
            for i in startIndex..<endIndex {
                self.acknowledgementWindowIndicators[i] = true
                fillCurrentRequestMessageAcknowledgementBit(i)
            }
        }
    }
    
    ///
    /// Set the ACK bit corresponding to the given packet index to "1" in the current request message.
    ///
    fileprivate func fillCurrentRequestMessageAcknowledgementBit(_ packetIndex: Int) {
        let ackByte = UInt8(1 << (7 - (packetIndex % 8)))
        let ackByteIndex = 5 + Int(floor(Float(packetIndex) / 8.0))
        let newRequestMessageByte = self.currentRequestMessage[ackByteIndex] | ackByte
        /*
        LOGGER.debug("Update the current request message ACK indicator (packetIndex = \(packetIndex), ackByte = \(ackByte), ackByteIndex = \(ackByteIndex), old message byte = \(self.currentRequestMessage[ackByteIndex]), new message byte = \(newRequestMessageByte))")
        */
        self.currentRequestMessage[ackByteIndex] = newRequestMessageByte
    }
}
