package fr.marcworld.speakingscanner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * Application entry-point.
 *
 * @author Marc Plouhinec
 */
@EnableAutoConfiguration
@ComponentScan("fr.marcworld.speakingscanner.service")
@ComponentScan("fr.marcworld.speakingscanner.controller")
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}
