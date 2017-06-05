//
//  DocumentTypeViewController.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 17/08/16.
//

import UIKit

class DocumentTypeSelectionViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    let LOGGER = Logger(name: "DocumentTypeSelectionViewController")
    let documentTypes: [ScannedDocumentType] = [ScannedDocumentType.Text, ScannedDocumentType.Picture]
    let cellReuseIdentifier = "cell"
    var scannedDocument: ScannedDocument?
    let bleService: BleService = BleServiceImpl.getInstance()
    
    @IBOutlet weak var documentNameLabel: UILabel!
    @IBOutlet weak var documentTypeTableView: UITableView!
    @IBOutlet weak var documentPreviewImageView: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if let document = self.scannedDocument {
            documentNameLabel.text = document.name
            
            if let image = document.previewImage {
                self.documentPreviewImageView.image = image
            } else {
                LOGGER.info("Load the preview of the scanned document \(document.name) (index = \(document.index)).")
                self.bleService.getDocumentPreviewByIndex(index: document.index, onResponseReceived: {documentPreview, error in
                    if let e = error {
                        // TODO: display the error
                        self.LOGGER.error("Unable to get the document preview: \(e)")
                    } else {
                        self.LOGGER.info("Document preview loaded with success (size = \(documentPreview.count))!")
                        document.previewImage = UIImage(data: documentPreview)
                        self.documentPreviewImageView.image = document.previewImage
                    }
                }, onProgressUpdate: { _ in })
            }
        }
        
        documentTypeTableView.register(UITableViewCell.self, forCellReuseIdentifier: cellReuseIdentifier)
        documentTypeTableView.delegate = self
        documentTypeTableView.dataSource = self
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return documentTypes.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell: UITableViewCell = documentTypeTableView.dequeueReusableCell(withIdentifier: cellReuseIdentifier) as UITableViewCell!
        cell.textLabel?.text = documentTypes[indexPath.row].rawValue
        return cell
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        performSegue(withIdentifier: "ProcessDocument", sender: self)
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "ProcessDocument" {
            let documentProcessingViewController = segue.destination as! DocumentProcessingViewController
            let documentType = documentTypes[documentTypeTableView.indexPathForSelectedRow!.row]
            documentProcessingViewController.scannedDocument = self.scannedDocument
            documentProcessingViewController.scannedDocumentType = documentType
        }
    }
    
}
