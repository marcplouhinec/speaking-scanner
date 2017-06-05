package fr.marcworld.speakingscanner.controller;

import fr.marcworld.speakingscanner.dto.TextRecognitionResponseDto;
import fr.marcworld.speakingscanner.enums.TextRecognitionLanguage;
import fr.marcworld.speakingscanner.service.TextRecognitionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * Created by marcplouhinec on 13/09/16.
 */
@RestController
public class TextRecognitionController {

    private static final Logger LOGGER = LoggerFactory.getLogger(TextRecognitionController.class);

    @Autowired
    private TextRecognitionService textRecognitionService;

    @RequestMapping(value = "/text_recognition/language/{language}", method = RequestMethod.POST)
    public TextRecognitionResponseDto textRecognition(
            @RequestBody byte[] imageData,
            @PathVariable("language") TextRecognitionLanguage language) {
        LOGGER.info("textRecognition request (imageData of " + imageData.length + " bytes, language = " + language + ")");
        File file;
        try {
            file = File.createTempFile("uploaded_image", ".png");
            try (FileOutputStream outputStream = new FileOutputStream(file)) {
                outputStream.write(imageData);
                outputStream.flush();
            }
            LOGGER.info("Temporary file: " + file.getAbsolutePath());
        } catch (IOException e) {
            return new TextRecognitionResponseDto(null, "UNABLE_TO_UPLOAD_FILE");
        }

        String recognizedText = null;
        try {
            recognizedText = textRecognitionService.processFile(file, language);
        } catch (Exception e) {
            LOGGER.error("Unable to recognize the text in the uploaded file.", e);
        }
        if (recognizedText == null) {
            return new TextRecognitionResponseDto(null, "UNABLE_TO_RECOGNIZE_FILE");
        }

        return new TextRecognitionResponseDto(recognizedText, null);
    }

}
