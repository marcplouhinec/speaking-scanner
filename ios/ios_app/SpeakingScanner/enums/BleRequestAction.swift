//
//  RequestAction.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 31/08/16.
//

import UIKit

enum BleRequestAction: UInt8 {

    case get_NB_DOCUMENTS = 1
    case get_DOCUMENT_NAMES_BY_INDEX_AND_COUNT = 2
    case get_DOCUMENT_PREVIEW_BY_INDEX = 3
    case get_COMPRESSED_DOCUMENT_BY_INDEX = 4
    
}
