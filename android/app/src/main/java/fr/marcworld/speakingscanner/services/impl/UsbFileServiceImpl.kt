package fr.marcworld.speakingscanner.services.impl

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.support.v4.provider.DocumentFile
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
        val contentResolver: ContentResolver
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

    override fun findAllScannedDocumentFiles(): List<DocumentFile> {
        return recursivelyFindScannedDocumentFiles(rootDocumentFile)
    }

    override fun readDocumentFileAsBitmap(documentFile: DocumentFile): Observable<Bitmap> {
        return Observable.create { subscriber ->
            val parcelFileDescriptor = contentResolver.openFileDescriptor(documentFile.uri, "r")
            val image = parcelFileDescriptor.use {
                BitmapFactory.decodeFileDescriptor(parcelFileDescriptor.fileDescriptor)
            }
            subscriber.onNext(image)
            subscriber.onComplete()
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
}