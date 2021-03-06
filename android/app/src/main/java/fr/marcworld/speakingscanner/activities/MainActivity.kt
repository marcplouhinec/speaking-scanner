package fr.marcworld.speakingscanner.activities

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.support.v4.app.ActivityCompat
import android.support.v4.provider.DocumentFile
import android.support.v7.app.AppCompatActivity
import android.widget.ArrayAdapter
import fr.marcworld.speakingscanner.R
import fr.marcworld.speakingscanner.services.OcrService
import fr.marcworld.speakingscanner.services.UsbFileService
import fr.marcworld.speakingscanner.services.impl.OcrServiceImpl
import fr.marcworld.speakingscanner.services.impl.UsbFileServiceImpl
import io.reactivex.android.schedulers.AndroidSchedulers
import io.reactivex.disposables.CompositeDisposable
import io.reactivex.schedulers.Schedulers
import kotlinx.android.synthetic.main.activity_main.*
import org.jetbrains.anko.*
import java.io.File


/**
 * Application entry-point.
 * Display the available image to analyze.
 *
 * @author Marc Plouhinec
 */
class MainActivity : AppCompatActivity(), ActivityCompat.OnRequestPermissionsResultCallback, AnkoLogger {

    private val EXTERNAL_STORAGE_REQUEST_CODE = 1985
    private val OPEN_DOCUMENT_TREE_REQUEST_CODE = 1987

    private var usbFileService: UsbFileService? = null
    private var ocrService: OcrService? = null
    private var scannedDocumentFiles: List<DocumentFile> = listOf()
    private var selectedScannedDocument: DocumentFile? = null
    private var subscriptions = CompositeDisposable()
    private var imagePreviewBitmap: Bitmap? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setTitle(R.string.please_select_document)

        // Check if the application has the permission to read storage. If not, prompt the user.
        val permission = ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
        if (permission != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), EXTERNAL_STORAGE_REQUEST_CODE)
        } else {
            initializeServicesAndDisplayDocuments()
        }

        // Handle document selection
        documentListView.setOnItemClickListener { _, _, position, _ ->
            if (scannedDocumentFiles.lastIndex > position) {
                selectScannedDocument(scannedDocumentFiles[position])
            }
        }

        // When no document is selected, disable the analyze button
        analyzeButton.isEnabled = false

        // Handle the analyze button event
        analyzeButton.setOnClickListener {
            analyzeSelectedDocumentAndShowResult()
        }

        // Handle the refresh button event
        refreshButton.setOnClickListener {
            scannedDocumentFiles = listOf()
            selectedScannedDocument = null
            displayScannedDocuments()
        }
    }

    override fun onResume() {
        super.onResume()
        subscriptions = CompositeDisposable()
    }

    override fun onPause() {
        super.onPause()
        subscriptions.clear()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        if (requestCode == EXTERNAL_STORAGE_REQUEST_CODE) {
            val permissionNotGranted = grantResults.none { it == PackageManager.PERMISSION_GRANTED }
            if (permissionNotGranted) {
                alert(R.string.error_external_storage_not_granted) {
                    okButton { finish() }
                }.show()
            } else {
                initializeServicesAndDisplayDocuments()
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, intent: Intent?) {
        if (requestCode == OPEN_DOCUMENT_TREE_REQUEST_CODE) {
            if (resultCode == Activity.RESULT_OK) {
                // Initialize the UsbFileService and display the documents
                val rootDocumentFile = DocumentFile.fromTreeUri(this, intent?.data)
                val usbFileServiceImpl = UsbFileServiceImpl(rootDocumentFile, contentResolver, this)
                usbFileService = usbFileServiceImpl
                ocrService = OcrServiceImpl(usbFileServiceImpl, this)
                displayScannedDocuments()
            } else {
                alert(R.string.error_storage_not_available) {
                    okButton { finish() }
                }.show()
            }
        }
    }

    /**
     * Initialize the [UsbFileService] according to the current Android version, then call [displayScannedDocuments].
     */
    private fun initializeServicesAndDisplayDocuments() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT_TREE), OPEN_DOCUMENT_TREE_REQUEST_CODE)
        } else {
            val usbStorageFile = UsbFileServiceImpl.findLegacyUsbStorageFile()
            if (usbStorageFile !is File) {
                alert(R.string.error_storage_not_available) {
                    okButton { finish() }
                }.show()
            } else {
                val usbFileServiceImpl = UsbFileServiceImpl(DocumentFile.fromFile(usbStorageFile), contentResolver, this)
                usbFileService = usbFileServiceImpl
                ocrService = OcrServiceImpl(usbFileServiceImpl, this)
                displayScannedDocuments()
            }
        }
    }

    /**
     * Display the scanned documents to the user.
     */
    private fun displayScannedDocuments() {
        val currentUsbFileService = usbFileService ?: throw IllegalStateException("The usbFileService must be initialized.")

        val progressDialog = indeterminateProgressDialog(R.string.loading_documents)
        progressDialog.setCancelable(false)
        progressDialog.show()

        subscriptions.add(currentUsbFileService.findAllScannedDocumentFiles()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe { documentFiles ->
                    scannedDocumentFiles = documentFiles.sortedBy { -it.lastModified() }

                    val documentNames = scannedDocumentFiles.map { it.name }
                    documentListView.adapter = ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, documentNames)

                    progressDialog.dismiss()
                })
    }

    /**
     * Handle the case when the user select a document.
     */
    private fun selectScannedDocument(selectedScannedDocument: DocumentFile) {
        val currentUsbFileService = usbFileService ?: throw IllegalStateException("The usbFileService must be initialized.")
        this.selectedScannedDocument = selectedScannedDocument

        // Enable the analyze button
        analyzeButton.isEnabled = true

        // Show an image preview
        val maxWidth = previewLinearLayout.width
        val maxHeight = previewLinearLayout.height
        subscriptions.add(currentUsbFileService.readDocumentFileAsBitmap(selectedScannedDocument, maxWidth, maxHeight)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe({ bitmap ->
                    previewImageView.setImageBitmap(bitmap)
                    imagePreviewBitmap?.recycle()
                    imagePreviewBitmap = bitmap
                }, { exception ->
                    warn("Unable to preview the document.", exception)
                }))
    }

    /**
     * Use the [OcrService] to analyze the selected document and show the result.
     */
    private fun analyzeSelectedDocumentAndShowResult() {
        val progressDialog = indeterminateProgressDialog(R.string.analyzing_document)
        progressDialog.setCancelable(false)
        progressDialog.show()

        selectedScannedDocument?.let { scannedDocument ->
            subscriptions.add(ocrService!!.readDocument(scannedDocument)
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe({ recognizedText ->
                        progressDialog.dismiss()
                        startActivity<AnalysisResultActivity>(AnalysisResultActivity.RECOGNIZED_TEXT_INTENT_NAME to recognizedText)
                    }, { exception ->
                        progressDialog.dismiss()
                        warn("Unable to analyze the document.", exception)
                        alert(R.string.error_unable_to_read_document) { okButton { } }.show()
                    }))
        }
    }
}
