package fr.marcworld.speakingscanner.service;

import fr.marcworld.speakingscanner.enums.TextRecognitionLanguage;

import java.io.File;

/**
 * Created by marcplouhinec on 13/09/16.
 */
public interface TextRecognitionService {

    /**
     * Recognize the text on the given file.
     *
     * @param file File that contains an image.
     * @param language OCR language.
     * @return Recognized text.
     */
    String processFile(File file, TextRecognitionLanguage language);

}
