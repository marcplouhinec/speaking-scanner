//
//  RecognitionService.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 17/09/16.
//

import UIKit


///
/// Handle the communication with the recognition web service.
///
protocol RecognitionService {
    
    ///
    /// Recognize the text in the given scanned document image.
    ///
    func recognizeText(_ documentImageData: Data, onResponse: @escaping (_ recognizedText: String, _ error: NSError?) -> Void)
    
}
