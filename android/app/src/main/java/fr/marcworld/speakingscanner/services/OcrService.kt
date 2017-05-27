package fr.marcworld.speakingscanner.services

import android.support.v4.provider.DocumentFile
import io.reactivex.Observable

/**
 * Recognize text in images.
 *
 * @author Marc Plouhinec
 */
interface OcrService {

    /**
     * Recognize the text on the image located in the given [DocumentFile].
     *
     * @return recognized text.
     */
    fun readDocument(documentFile: DocumentFile): Observable<String>
}