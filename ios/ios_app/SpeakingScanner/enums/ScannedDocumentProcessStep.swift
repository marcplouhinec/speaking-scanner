//
//  ScannedDocumentProcessStep.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 18/08/16.
//

import UIKit

enum ScannedDocumentProcessStep: String {
    case DownloadingFromScanner = "Downloading from scanner..."
    case UploadingToCloud = "Uploadind to the cloud..."
    case Success = "Success!"
}
