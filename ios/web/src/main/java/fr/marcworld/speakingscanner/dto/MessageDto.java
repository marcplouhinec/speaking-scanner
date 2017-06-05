package fr.marcworld.speakingscanner.dto;

/**
 * Created by marcplouhinec on 18/09/16.
 */
public class MessageDto {

    private String message;

    public MessageDto(String message) {
        this.message = message;
    }

    public MessageDto() {
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
