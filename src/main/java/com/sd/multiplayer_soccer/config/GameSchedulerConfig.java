package com.sd.multiplayer_soccer.config;

import com.sd.multiplayer_soccer.service.GameLoopService;
import com.sd.multiplayer_soccer.service.MatchService;
import com.sd.multiplayer_soccer.service.RoomManagerService;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class GameSchedulerConfig {
    
    private final RoomManagerService roomManagerService;
    private final GameLoopService gameLoopService;
    private final MatchService matchService;
    
    public GameSchedulerConfig(RoomManagerService roomManagerService,
                              GameLoopService gameLoopService,
                              MatchService matchService) {
        this.roomManagerService = roomManagerService;
        this.gameLoopService = gameLoopService;
        this.matchService = matchService;
    }
    
    @Scheduled(fixedRate = 16) // ~60 FPS (1000ms / 60 = 16.67ms)
    public void runGameLoops() {
        roomManagerService.getRooms().values().forEach(gameLoopService::gameLoop);
    }
    
    @Scheduled(fixedRate = 1000) // Every 1 second
    public void handleTimers() {
        roomManagerService.getRooms().values().forEach(matchService::updateTimer);
    }
}
