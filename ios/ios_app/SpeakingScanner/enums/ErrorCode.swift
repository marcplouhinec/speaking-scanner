//
//  InternalError.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 13/09/16.
//

import UIKit

///
/// Internal error code for NSError.
///
enum ErrorCode: Int {
    case not_CONNECTED = 1
    case invalid_JSON_OBJECT = 2
    case different_CRC = 3
    case empty_RESPONSE = 4
    case response_NOT_PARSEABLE = 5
    case server_UNABLE_TO_RECOGNIZE_TEXT = 6
}
