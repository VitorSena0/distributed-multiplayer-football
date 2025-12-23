package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service for match management
 * Translated from TypeScript match.ts
 */
@Service
public class MatchService {
    
    private static final Logger logger = LoggerFactory.getLogger(MatchService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private BallService ballService;
    
    @Autowired
    private RoomManagerService roomManagerService;
    
    /**
     * Balances teams in the room
     */
    private void balanceTeams(Room room) {
        int redCount = room.getTeams().getRed().size();
        int blueCount = room.getTeams().getBlue().size();
        
        if (Math.abs(redCount - blueCount) <= 1) {
            return;
        }
        
        String largerTeam = redCount > blueCount ? "red" : "blue";
        String smallerTeam = redCount > blueCount ? "blue" : "red";
        
        List<String> largerTeamList = largerTeam.equals("red") ? 
            room.getTeams().getRed() : room.getTeams().getBlue();
        List<String> smallerTeamList = smallerTeam.equals("red") ? 
            room.getTeams().getRed() : room.getTeams().getBlue();
        
        if (largerTeamList.isEmpty()) {
            return;
        }
        
        String playerToMove = largerTeamList.remove(largerTeamList.size() - 1);
        smallerTeamList.add(playerToMove);
        
        Player player = room.getPlayers().get(playerToMove);
        if (player != null) {
            player.setTeam(smallerTeam);
            player.setX(smallerTeam.equals("red") ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
            
            Map<String, Object> teamChangedEvent = new HashMap<>();
            teamChangedEvent.put("newTeam", smallerTeam);
            teamChangedEvent.put("gameState", roomManagerService.buildGameState(room));
            
            messagingTemplate.convertAndSendToUser(playerToMove, "/queue/teamChanged", teamChangedEvent);
        }
    }
    
    /**
     * Starts a new match
     */
    public void startNewMatch(Room room) {
        room.setPlaying(true);
        room.setWaitingForRestart(false);
        room.getPlayersReady().clear();
        room.setScore(new Score(0, 0));
        room.setMatchTime(GameConstants.MATCH_DURATION);
        ballService.resetBall(room);
        
        // Reset player positions
        room.getPlayers().forEach((id, player) -> {
            player.setX(player.getTeam().equals("red") ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
        });
        
        // Notify clients
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/cleanPreviousMatch", 
            Collections.emptyMap());
        
        Map<String, Object> matchStartEvent = new HashMap<>();
        matchStartEvent.put("gameState", roomManagerService.buildGameState(room));
        matchStartEvent.put("canMove", true);
        
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/matchStart", matchStartEvent);
        
        logger.info("Match started in room: {}", room.getId());
    }
    
    /**
     * Checks conditions to restart or start a match
     */
    public void checkRestartConditions(Room room) {
        balanceTeams(room);
        
        boolean hasRedPlayers = !room.getTeams().getRed().isEmpty();
        boolean hasBluePlayers = !room.getTeams().getBlue().isEmpty();
        
        // All current players
        Set<String> allPlayerIds = new HashSet<>();
        allPlayerIds.addAll(room.getTeams().getRed());
        allPlayerIds.addAll(room.getTeams().getBlue());
        
        // Clean playersReady removing players who left
        room.getPlayersReady().removeIf(playerId -> !allPlayerIds.contains(playerId));
        
        if (hasRedPlayers && hasBluePlayers) {
            if (room.isWaitingForRestart()) {
                // Check if new players joined
                boolean hasNewPlayers = allPlayerIds.stream()
                    .anyMatch(id -> !room.getPlayersReady().contains(id));
                
                if (hasNewPlayers) {
                    // New player joined -> new match
                    startNewMatch(room);
                } else {
                    // All are from previous game and ready
                    boolean allReady = !allPlayerIds.isEmpty() && 
                        allPlayerIds.stream().allMatch(id -> room.getPlayersReady().contains(id));
                    
                    if (allReady) {
                        startNewMatch(room);
                    }
                }
            } else if (!room.isPlaying()) {
                // Not playing nor waiting restart -> start match
                startNewMatch(room);
            }
        } else {
            room.setPlaying(false);
            Map<String, Object> waitingEvent = new HashMap<>();
            waitingEvent.put("redCount", room.getTeams().getRed().size());
            waitingEvent.put("blueCount", room.getTeams().getBlue().size());
            
            messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/waitingForPlayers", 
                waitingEvent);
        }
    }
    
    /**
     * Updates match timer
     */
    public void updateTimer(Room room) {
        if (!room.isPlaying()) {
            return;
        }
        
        room.setMatchTime(room.getMatchTime() - 1);
        
        if (room.getMatchTime() <= 0) {
            room.setPlaying(false);
            room.setWaitingForRestart(true);
            
            String winner;
            if (room.getScore().getRed() > room.getScore().getBlue()) {
                winner = "red";
            } else if (room.getScore().getBlue() > room.getScore().getRed()) {
                winner = "blue";
            } else {
                winner = "draw";
            }
            
            // Move players off screen
            room.getPlayers().forEach((id, player) -> {
                player.setX(-100);
                player.setY(-100);
            });
            
            Map<String, Object> matchEndEvent = new HashMap<>();
            matchEndEvent.put("winner", winner);
            matchEndEvent.put("gameState", roomManagerService.buildGameState(room));
            
            messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/matchEnd", matchEndEvent);
            
            logger.info("Match ended in room: {} - Winner: {}", room.getId(), winner);
        }
        
        Map<String, Object> timerUpdate = new HashMap<>();
        timerUpdate.put("matchTime", room.getMatchTime());
        
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/timerUpdate", timerUpdate);
    }
}
