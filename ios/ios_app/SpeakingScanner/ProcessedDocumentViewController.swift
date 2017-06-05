//
//  ProcessedDocumentViewController.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 18/08/16.
//

import UIKit

class ProcessedDocumentViewController: UIViewController {
    
    var scannedDocument: ScannedDocument?
    
    @IBOutlet weak var documentNameLabel: UILabel!
    @IBOutlet weak var processResultTextView: UITextView!
    @IBOutlet weak var documentPreviewImageView: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let document = self.scannedDocument {
            documentNameLabel.text = document.name
            
            if let image = document.previewImage {
                documentPreviewImageView.image = image
            }
            
            processResultTextView.text = document.textContent
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
}
