//
//  RecognitionServiceImpl.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 17/09/16.
//

import UIKit

///
/// Default implementation of RecognitionService.
///
class RecognitionServiceImpl: RecognitionService {
    
    let LOGGER = Logger(name: "RecognitionServiceImpl")
    fileprivate let WS_URL = "http://10.10.100.100:8080/text_recognition/language/FRENCH" // TODO set a production host with https and remove the option in the plist: http://stackoverflow.com/questions/31254725/transport-security-has-blocked-a-cleartext-http
    fileprivate static let INSTANCE = RecognitionServiceImpl()
    
    static func getInstance() -> RecognitionServiceImpl {
        return RecognitionServiceImpl.INSTANCE
    }
    
    fileprivate init() {}
    
    func recognizeText(_ documentImageData: Data, onResponse: @escaping (String, NSError?) -> Void) {
        LOGGER.info("Create a REST request for recognizing text in a document image of \(documentImageData.count) bytes.")
        
        var request = URLRequest(url: URL(string: WS_URL)!)
        let session = URLSession.shared
        request.httpMethod = "POST"
        request.httpBody = documentImageData
        request.addValue("image/png", forHTTPHeaderField: "Content-Type")
        request.addValue("application/json", forHTTPHeaderField: "Accept")
        
        let task = session.dataTask(with: request, completionHandler: { data, response, error in
            self.LOGGER.info("Text recognition REST response received: \(String(describing: response))")
            
            // Stop if an error occurred
            if let e = error {
                onResponse("", e as NSError?)
                return
            }
            
            // Parse the response
            var responseJson: NSDictionary? = nil
            if let d = data {
                let dataString = NSString(data: d, encoding: String.Encoding.utf8.rawValue)
                self.LOGGER.debug("Received data: \(String(describing: dataString))")
                
                do {
                    responseJson = try JSONSerialization.jsonObject(with: d, options: .mutableLeaves) as? NSDictionary
                } catch {
                    self.LOGGER.error("Unable to parse the received data: \(String(describing: dataString))", error: error)
                    onResponse("", NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.response_NOT_PARSEABLE.rawValue, userInfo: nil))
                    return
                }
            } else {
                onResponse("", NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.empty_RESPONSE.rawValue, userInfo: nil))
                return
            }
            
            // Check the reponse content
            if let response = responseJson {
                if let recognizedText = response["recognizedText"] as? String {
                    onResponse(recognizedText, nil)
                    return
                }
                else if let errorCode = response["errorCode"] as? String {
                    // TODO UNABLE_TO_UPLOAD_FILE, UNABLE_TO_RECOGNIZE_FILE
                    self.LOGGER.warn("The server was unable to recognize the document. Error code: \(errorCode).")
                    onResponse("", NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.server_UNABLE_TO_RECOGNIZE_TEXT.rawValue, userInfo: nil))
                    return
                }
            }
            
            onResponse("", NSError(domain: "fr.marcworld.speakingscanner", code: ErrorCode.empty_RESPONSE.rawValue, userInfo: nil))
        })
        task.resume()
    }

}
