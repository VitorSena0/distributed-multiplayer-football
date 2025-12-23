package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.GameConstants;
import com.sd.multiplayer_soccer.model.Room;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Service for scheduled game tasks
 */
@Service
public class GameSchedulerService {
    
    @Autowired
    private RoomManagerService roomManagerService;
    
    @Autowired
    private GameLoopService gameLoopService;
    
    @Autowired
    private MatchService matchService;
    
    /**
     * Game loop - runs at 60 FPS
     */
    @Scheduled(fixedRate = 1000 / GameConstants.GAME_LOOP_FPS)
    public void runGameLoops() {
        roomManagerService.getRooms().values().forEach(gameLoopService::gameLoop);
    }
    
    /**
     * Timer update - runs every second
     */
    @Scheduled(fixedRate = GameConstants.TIMER_UPDATE_INTERVAL)
    public void handleTimers() {
        roomManagerService.getRooms().values().forEach(matchService::updateTimer);
    }
}
