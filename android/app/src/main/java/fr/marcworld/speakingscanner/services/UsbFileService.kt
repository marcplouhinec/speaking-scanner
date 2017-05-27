package fr.marcworld.speakingscanner.services

import android.graphics.Bitmap
import android.support.v4.provider.DocumentFile
import io.reactivex.Observable

/**
 * Provide files from the USB storage.
 *
 * @author Marc Plouhinec
 */
interface UsbFileService {

    /**
     * @return all the image and PDF files in the USB storage.
     */
    fun findAllScannedDocumentFiles(): Observable<List<DocumentFile>>

    /**
     * Read the given [DocumentFile] and put the result in a [Bitmap].
     * Note that if the [DocumentFile] is a PDF, the conversion is automatically done.
     */
    fun readDocumentFileAsBitmap(documentFile: DocumentFile): Observable<Bitmap>
}