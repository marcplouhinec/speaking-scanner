package fr.marcworld.speakingscanner.controller;

import fr.marcworld.speakingscanner.dto.MessageDto;
import fr.marcworld.speakingscanner.enums.TextRecognitionLanguage;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Minimalist home REST controller.
 *
 * @author Marc Plouhinec
 */
@RestController
public class IndexController {

    @RequestMapping("/")
    public MessageDto home() {
        String supportedLanguages = Arrays.stream(TextRecognitionLanguage.values())
                .map(TextRecognitionLanguage::name)
                .collect(Collectors.joining(", "));

        return new MessageDto("" +
                "Welcome! In order to recognize text on an image, please POST a request on the URL " +
                "\"/text_recognition/language/{language}\". " +
                "The request body must be an image in JPEG format and the {language} parameter must be one " +
                "of the following values: " + supportedLanguages);
    }
}
