package com.sd.multiplayer_soccer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MultiplayerSoccerApplication {
    public static void main(String[] args) {
        SpringApplication.run(MultiplayerSoccerApplication.class, args);
    }
}
