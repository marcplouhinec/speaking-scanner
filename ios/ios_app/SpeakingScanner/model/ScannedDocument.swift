//
//  ScannedDocument.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 17/08/16.
//

import UIKit

class ScannedDocument {

    var index: UInt16
    var name: String
    var textContent: String?
    var imageDescription: String?
    var previewImage: UIImage?
    
    init(index: UInt16, name: String) {
        self.index = index
        self.name = name
    }
}
