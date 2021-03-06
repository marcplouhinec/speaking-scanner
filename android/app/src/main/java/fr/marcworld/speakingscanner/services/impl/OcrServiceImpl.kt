package fr.marcworld.speakingscanner.services.impl

import android.content.Context
import android.support.v4.provider.DocumentFile
import com.googlecode.tesseract.android.TessBaseAPI
import fr.marcworld.speakingscanner.enums.TrainedDataLanguage
import fr.marcworld.speakingscanner.services.OcrService
import fr.marcworld.speakingscanner.services.UsbFileService
import io.reactivex.Observable
import java.io.File
import java.io.FileOutputStream

/**
 * Default implementation of [OcrService].
 *
 * @author Marc Plouhinec
 */
class OcrServiceImpl(
        val usbFileService: UsbFileService,
        val context: Context
) : OcrService {

    private val TESS_DATA_FOLDER_NAME = "tessdata"

    private val tessBaseAPI: TessBaseAPI by lazy {
        // Assets must be extracted for Tesseract
        val appDirectory = context.filesDir

        val extractedTessDataFile = File(appDirectory, TESS_DATA_FOLDER_NAME)
        if (extractedTessDataFile.exists()) {
            extractedTessDataFile.delete()
        }
        extractedTessDataFile.mkdir()

        context.assets.list(TESS_DATA_FOLDER_NAME)?.forEach { fileName ->
            val newFile = File(extractedTessDataFile, fileName)
            FileOutputStream(newFile).use { outStream ->
                context.assets.open(TESS_DATA_FOLDER_NAME + "/" + fileName).use { inStream ->
                    inStream.copyTo(outStream)
                }
            }
        }

        // Check which language Tesseract must support
        val trainedDataLanguage = TrainedDataLanguage.values().find {
            context.resources.configuration.locale.language == it.locale.language
        }

        // Initialize Tesseract
        val initializingTessBaseAPI = TessBaseAPI()
        initializingTessBaseAPI.init(appDirectory.absolutePath, trainedDataLanguage?.filePrefix ?: "eng")
        initializingTessBaseAPI
    }

    override fun readDocument(documentFile: DocumentFile): Observable<String> {
        return usbFileService.readDocumentFileAsBitmap(documentFile, Int.MAX_VALUE, Int.MAX_VALUE).map { bitmap ->
            tessBaseAPI.setImage(bitmap)
            val utF8Text = tessBaseAPI.utF8Text
            bitmap.recycle()
            utF8Text
        }
    }

}