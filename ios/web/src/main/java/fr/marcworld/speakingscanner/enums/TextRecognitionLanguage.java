package fr.marcworld.speakingscanner.enums;

/**
 * Supported language for Tesseract.
 *
 * @author Marc Plouhinec
 */
public enum TextRecognitionLanguage {
    ENGLISH("eng"),
    FRENCH("fra");

    private final String code;

    TextRecognitionLanguage(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
