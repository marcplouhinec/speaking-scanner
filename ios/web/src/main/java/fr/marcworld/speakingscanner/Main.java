package fr.marcworld.speakingscanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * Created by marcplouhinec on 13/09/16.
 */
@EnableAutoConfiguration
@ComponentScan("fr.mworld.speakingscanner.service")
@ComponentScan("fr.mworld.speakingscanner.controller")
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}
