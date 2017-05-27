package fr.marcworld.speakingscanner.services.impl

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.support.v4.provider.DocumentFile
import com.shockwave.pdfium.PdfiumCore
import fr.marcworld.speakingscanner.services.UsbFileService
import io.reactivex.Observable
import java.io.File
import java.lang.Exception


/**
 * Default implementation of [UsbFileService].
 *
 * @author Marc Plouhinec
 */
class UsbFileServiceImpl(
        val rootDocumentFile: DocumentFile,
        val contentResolver: ContentResolver,
        val context: Context,
        val pdfiumCore: PdfiumCore = PdfiumCore(context)
) : UsbFileService {

    companion object {
        val SCANNED_FILE_EXTENSIONS = listOf("jpg", "jpeg", "pdf")

        /**
         * This method finds the path where USB storage is mounted on Android version older than
         * [Build.VERSION_CODES.LOLLIPOP].
         *
         * @return A [File] corresponding to the top USB storage folder, if available.
         */
        fun findLegacyUsbStorageFile(): File? {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                return null
            }

            return try {
                File("/storage").listFiles().find { it.exists() && it.name.toLowerCase().contains("usb") && it.canExecute() }
            } catch (e: Exception) {
                val alternativeFiles = listOf(File("/mnt/sdcard/usbStorage"), File("/mnt/sdcard/usb_storage"))
                alternativeFiles.find { it.exists() && it.canExecute() }
            }
        }
    }

    override fun findAllScannedDocumentFiles(): Observable<List<DocumentFile>> {
        return Observable.create { subscriber ->
            subscriber.onNext(recursivelyFindScannedDocumentFiles(rootDocumentFile))
            subscriber.onComplete()
        }
    }

    override fun readDocumentFileAsByteArray(documentFile: DocumentFile): Observable<ByteArray> {
        return Observable.create { subscriber ->
            val byteArray = contentResolver.openInputStream(documentFile.uri).use {
                it.buffered().readBytes()
            }
            if (byteArray is ByteArray) {
                subscriber.onNext(byteArray)
            } else {
                subscriber.onError(IllegalStateException("Unable to read the documentFile: '${documentFile.name}'."))
            }
            subscriber.onComplete()
        }
    }

    override fun readDocumentFileAsBitmap(documentFile: DocumentFile, maxWidth: Int, maxHeight: Int): Observable<Bitmap> {
        return readDocumentFileAsByteArray(documentFile).map {
            val bitmap = if (documentFile.name.toLowerCase().endsWith(".pdf")) {
                val pdfDocument = pdfiumCore.newDocument(it)
                pdfiumCore.openPage(pdfDocument, 0)
                val pageWidth = pdfiumCore.getPageWidth(pdfDocument, 0)
                val pageHeight = pdfiumCore.getPageHeight(pdfDocument, 0)
                val bitmap = Bitmap.createBitmap(pageWidth, pageHeight, Bitmap.Config.ARGB_8888)
                pdfiumCore.renderPageBitmap(pdfDocument, bitmap, 0, 0, 0, pageWidth, pageHeight, false)
                bitmap
            } else {
                BitmapFactory.decodeByteArray(it, 0, it.size)
            }
            if (bitmap is Bitmap) {
                scaleBitmapIfTooBig(bitmap, maxWidth, maxHeight)
            } else {
                throw IllegalStateException("Unable to read the documentFile as a bitmap: '${documentFile.name}'.")
            }
        }
    }

    /**
     * Recursively find the image files in the given directory.
     */
    private fun recursivelyFindScannedDocumentFiles(directoryDocumentFile: DocumentFile): List<DocumentFile> {
        val childrenDocumentFiles = directoryDocumentFile.listFiles()

        val childrenScannedDocuments = childrenDocumentFiles.filter {
            val fileExtension = it.name.toLowerCase().substring(it.name.lastIndexOf('.') + 1)
            SCANNED_FILE_EXTENSIONS.contains(fileExtension)
        }

        val grandChildrenScannedDocuments = childrenDocumentFiles
                .filter { it.isDirectory }
                .flatMap { recursivelyFindScannedDocumentFiles(it) }

        return childrenScannedDocuments + grandChildrenScannedDocuments
    }

    private fun scaleBitmapIfTooBig(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val scaledBitmap = when {
            bitmap.width > maxWidth && bitmap.height > maxHeight -> when {
                bitmap.width > bitmap.height -> Bitmap.createScaledBitmap(bitmap, maxWidth, bitmap.height * maxWidth / bitmap.width, false)
                else -> Bitmap.createScaledBitmap(bitmap, bitmap.width * maxHeight / bitmap.height, maxHeight, false)
            }
            bitmap.width > maxWidth -> Bitmap.createScaledBitmap(bitmap, maxWidth, bitmap.height * maxWidth / bitmap.width, false)
            bitmap.height > maxHeight -> Bitmap.createScaledBitmap(bitmap, bitmap.width * maxHeight / bitmap.height, maxHeight, false)
            else -> return bitmap
        }

        bitmap.recycle()

        return scaledBitmap
    }
}