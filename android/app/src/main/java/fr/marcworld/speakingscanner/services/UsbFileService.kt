package fr.marcworld.speakingscanner.services

import android.support.v4.provider.DocumentFile

/**
 * Provide files from the USB storage.
 *
 * @author Marc Plouhinec
 */
interface UsbFileService {

    /**
     * @return all the image and PDF files in the USB storage.
     */
    fun findAllScannedDocumentFiles(): List<DocumentFile>
}