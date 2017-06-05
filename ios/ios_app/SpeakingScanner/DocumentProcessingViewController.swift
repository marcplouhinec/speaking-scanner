//
//  DocumentProcessingViewController.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 18/08/16.
//

import UIKit

class DocumentProcessingViewController: UIViewController {
    
    let LOGGER = Logger(name: "DocumentProcessingViewController")
    
    let bleService: BleService = BleServiceImpl.getInstance()
    let recognitionService: RecognitionService = RecognitionServiceImpl.getInstance()
    var scannedDocument: ScannedDocument?
    var scannedDocumentType: ScannedDocumentType?
    
    @IBOutlet weak var documentNameLabel: UILabel!
    @IBOutlet weak var documentProgressView: UIProgressView!
    @IBOutlet weak var documentProcessStatusLabel: UILabel!
    @IBOutlet weak var documentPreviewImageView: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let document = self.scannedDocument {
            documentNameLabel.text = document.name
            
            if let image = document.previewImage {
                documentPreviewImageView.image = image
            }
            
            // Abreviate the process if the document already contain text
            if document.textContent != nil {
                self.performSegue(withIdentifier: "ShowProcessResult", sender: self)
                return
            }
            
            // Download the document from the BLE-to-WiFi bridge
            self.downloadDocumentImageFromBridge(document)
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "ShowProcessResult" {
            let processedDocumentViewController = segue.destination as! ProcessedDocumentViewController
            processedDocumentViewController.scannedDocument = self.scannedDocument
        }
    }
    
    ///
    /// Download the document from the BLE-to-WiFi bridge and jump to the next step when it is done.
    ///
    fileprivate func downloadDocumentImageFromBridge(_ document: ScannedDocument) {
        self.documentProgressView.setProgress(0.0, animated: false)
        self.documentProcessStatusLabel.text = "Downloading from BLE-to-WiFi bridge..."
        self.bleService.getCompressedDocumentByIndex(index: document.index, onResponseReceived: { documentData, error in
            if let e = error {
                self.showProcessError(e)
            } else {
                self.uploadDocumentToWebService(document, documentData: documentData)
            }
        }, onProgressUpdate: { progressPercentage in
            self.documentProcessStatusLabel.text = "Downloading from BLE-to-WiFi bridge (\(progressPercentage)%)..."
            self.documentProgressView.setProgress(Float(progressPercentage) / 200.0, animated: true)
        })
    }
    
    ///
    /// Upload the given document to the OCR webservice.
    ///
    fileprivate func uploadDocumentToWebService(_ document: ScannedDocument, documentData: Data) {
        self.documentProgressView.setProgress(0.75, animated: true)
        self.documentProcessStatusLabel.text = "Process the document in the cloud..."
        
        self.recognitionService.recognizeText(documentData, onResponse: {recognizedText, error in
            // dispatch_after(dispatchTime, dispatch_get_main_queue(), {
            DispatchQueue.main.async(execute: {
                if let e = error {
                    self.showProcessError(e)
                } else {
                    self.documentProgressView.setProgress(1.0, animated: true)
                    self.scannedDocument!.textContent = recognizedText
                    self.performSegue(withIdentifier: "ShowProcessResult", sender: self)
                }
            })
        })
    }
    
    ///
    /// Display an error message in case of a problem.
    ///
    fileprivate func showProcessError(_ error: NSError) {
        LOGGER.error("Unable to process the current document: \(error)")
        self.documentProcessStatusLabel.text = "An error occurred during the processing."
    }
    
}
