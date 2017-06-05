package fr.marcworld.speakingscanner.controller;

import fr.marcworld.speakingscanner.dto.MessageDto;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by marcplouhinec on 13/09/16.
 */
@RestController
public class IndexController {

    @RequestMapping("/")
    public MessageDto home() {
        return new MessageDto("Welcome!");
    }
}
