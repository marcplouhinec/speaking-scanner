package fr.marcworld.speakingscanner.enums

import java.util.*

/**
 * Supported languages of the Tesseract trained data located in the folder "/app/src/main/assets/tessdata".
 *
 * @author Marc Plouhinec
 */
enum class TrainedDataLanguage(
        val locale: Locale,
        val filePrefix: String
) {
    ENGLISH(Locale.ENGLISH, "eng"),
    FRENCH(Locale.FRENCH, "fra")
}