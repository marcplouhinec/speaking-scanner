//
//  BleConnectionStatus.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 03/09/16.
//

import UIKit

enum BleConnectionStatus: Int {

    case bluetooth_RESETTING    = 1
    case bluetooth_UNSUPPORTED  = 2
    case bluetooth_UNAUTHORIZED = 3
    case bluetooth_POWEREDOFF   = 4
    
    case not_CONNECTED          = 5
    case searching_FOR_BRIDGE   = 6
    case connected              = 7
    
}
