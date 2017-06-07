package fr.marcworld.speakingscanner.dto;

/**
 * Response sent after recognizing some text on an image.
 *
 * @author Marc Plouhinec
 */
public class TextRecognitionResponseDto {

    private String recognizedText;
    private String errorCode;

    public TextRecognitionResponseDto(String recognizedText, String errorCode) {
        this.recognizedText = recognizedText;
        this.errorCode = errorCode;
    }

    public TextRecognitionResponseDto() {
    }

    public String getRecognizedText() {
        return recognizedText;
    }

    public void setRecognizedText(String recognizedText) {
        this.recognizedText = recognizedText;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
}
