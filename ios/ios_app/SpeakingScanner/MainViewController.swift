//
//  ViewController.swift
//  SpeakingScanner
//
//  Created by Marc Plouhinec on 17/08/16.
//
// Thanks to http://stackoverflow.com/a/33234181
//

import UIKit

class MainViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    let LOGGER = Logger(name: "MainViewController")
    let cellReuseIdentifier = "cell"
    let bleService: BleService = BleServiceImpl.getInstance()
    
    var scannedDocuments: [ScannedDocument] = []
    
    @IBOutlet weak var scannerStatusLabel: UILabel!
    @IBOutlet weak var scannedDocumentTableView: UITableView!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Update the scanner status
        self.scannerStatusLabel.text = "Bluetooth to WiFi bridge not connected."
        self.bleService.registerBleConnectionStatusChangedListener(listener: { status in
            switch status {
            case .bluetooth_RESETTING:
                self.scannerStatusLabel.text = "Bluetooth resetting."
                break
            case .bluetooth_UNSUPPORTED:
                self.scannerStatusLabel.text = "Bluetooth unsupported."
                break
            case .bluetooth_UNAUTHORIZED:
                self.scannerStatusLabel.text = "Bluetooth unauthorized."
                break
            case .bluetooth_POWEREDOFF:
                self.scannerStatusLabel.text = "Bluetooth powered off."
                break
            case .not_CONNECTED:
                self.scannerStatusLabel.text = "Bluetooth to WiFi bridge not connected."
                break
            case .searching_FOR_BRIDGE:
                self.scannerStatusLabel.text = "Searching for the Bluetooth to WiFi bridge..."
                break
            case .connected:
                self.scannerStatusLabel.text = "Bluetooth to WiFi bridge connected."
                
                // Initialize the scanned document list if necessary
                if self.scannedDocuments.count == 0 {
                    self.updateScannedDocumentTable()
                }
                break
            }
        })
        
        // Initialize the scanned document view
        scannedDocumentTableView.register(UITableViewCell.self, forCellReuseIdentifier: cellReuseIdentifier)
        scannedDocumentTableView.delegate = self
        scannedDocumentTableView.dataSource = self
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return scannedDocuments.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell: UITableViewCell = scannedDocumentTableView.dequeueReusableCell(withIdentifier: cellReuseIdentifier) as UITableViewCell!
        cell.textLabel?.text = scannedDocuments[indexPath.row].name
        return cell
    }
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        performSegue(withIdentifier: "ChooseDocumentType", sender: self)
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "ChooseDocumentType" {
            let documentTypeSelectionViewController = segue.destination as! DocumentTypeSelectionViewController
            let selectedDocument = scannedDocuments[scannedDocumentTableView.indexPathForSelectedRow!.row]
            documentTypeSelectionViewController.scannedDocument = selectedDocument
        }
    }

    ///
    /// Load the scanned documents and update them.
    ///
    fileprivate func updateScannedDocumentTable() {
        LOGGER.info("Update the scanned document table...")
        
        self.bleService.getNbDocuments(onResponseReceived: {nbDocuments, error in
            if let e = error {
                // TODO display the error
                self.LOGGER.error("Unable to get the number of scanned documents: \(e)")
            } else {
                self.LOGGER.info("\(nbDocuments) scanned document found. Load their names...")
                
                self.bleService.getDocumentNamesByIndexAndCount(index: 0, count: UInt16(nbDocuments), onResponseReceived: { documentNames, error in
                    if let e = error {
                        // TODO display the error
                        self.LOGGER.error("Unable to get the scanned document names: \(e)")
                    } else {
                        self.LOGGER.info("Document names found: \(documentNames)")
                        var index: UInt16 = 0
                        self.scannedDocuments = documentNames.map({ name in
                            let scannedDocument = ScannedDocument(index: index, name: name)
                            index += 1
                            return scannedDocument
                        })
                        self.scannedDocumentTableView.reloadData()
                    }
                })
            }
            
        })
    }
}

