package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

import static com.sd.multiplayer_soccer.constants.GameConstants.MATCH_DURATION;

@Service
public class MatchService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final BallService ballService;
    private final RoomManagerService roomManagerService;
    
    public MatchService(SimpMessagingTemplate messagingTemplate, 
                       BallService ballService,
                       RoomManagerService roomManagerService) {
        this.messagingTemplate = messagingTemplate;
        this.ballService = ballService;
        this.roomManagerService = roomManagerService;
    }
    
    public void balanceTeams(Room room) {
        int redCount = room.getTeams().getRed().size();
        int blueCount = room.getTeams().getBlue().size();
        
        if (Math.abs(redCount - blueCount) <= 1) {
            return;
        }
        
        Player.Team largerTeam = redCount > blueCount ? Player.Team.RED : Player.Team.BLUE;
        Player.Team smallerTeam = redCount > blueCount ? Player.Team.BLUE : Player.Team.RED;
        
        List<String> largerTeamList = largerTeam == Player.Team.RED ? 
            room.getTeams().getRed() : room.getTeams().getBlue();
        List<String> smallerTeamList = smallerTeam == Player.Team.RED ? 
            room.getTeams().getRed() : room.getTeams().getBlue();
        
        if (largerTeamList.isEmpty()) {
            return;
        }
        
        String playerToMove = largerTeamList.remove(largerTeamList.size() - 1);
        smallerTeamList.add(playerToMove);
        
        Player player = room.getPlayers().get(playerToMove);
        if (player != null) {
            player.setTeam(smallerTeam);
            player.setX(smallerTeam == Player.Team.RED ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
            
            messagingTemplate.convertAndSendToUser(
                playerToMove, 
                "/queue/teamChanged",
                Map.of(
                    "newTeam", smallerTeam,
                    "gameState", roomManagerService.buildGameState(room)
                )
            );
        }
    }
    
    public void startNewMatch(Room room) {
        room.setPlaying(true);
        room.setWaitingForRestart(false);
        room.getPlayersReady().clear();
        room.setScore(new Score(0, 0));
        room.setMatchTime(MATCH_DURATION);
        ballService.resetBall(room);
        
        room.getPlayers().forEach((id, player) -> {
            player.setX(player.getTeam() == Player.Team.RED ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
        });
        
        messagingTemplate.convertAndSend(
            "/topic/room/" + room.getId() + "/cleanPreviousMatch", 
            Map.of()
        );
        
        messagingTemplate.convertAndSend(
            "/topic/room/" + room.getId() + "/matchStart",
            Map.of(
                "gameState", roomManagerService.buildGameState(room),
                "canMove", true
            )
        );
    }
    
    public void checkRestartConditions(Room room) {
        balanceTeams(room);
        
        boolean hasRedPlayers = !room.getTeams().getRed().isEmpty();
        boolean hasBluePlayers = !room.getTeams().getBlue().isEmpty();
        
        List<String> allPlayerIds = new ArrayList<>();
        allPlayerIds.addAll(room.getTeams().getRed());
        allPlayerIds.addAll(room.getTeams().getBlue());
        
        Set<String> allPlayerIdsSet = new HashSet<>(allPlayerIds);
        
        // Remove players who left from the ready set
        room.getPlayersReady().removeIf(playerId -> !allPlayerIdsSet.contains(playerId));
        
        if (hasRedPlayers && hasBluePlayers) {
            if (room.isWaitingForRestart()) {
                boolean hasNewPlayers = allPlayerIds.stream()
                    .anyMatch(id -> !room.getPlayersReady().contains(id));
                
                if (hasNewPlayers) {
                    startNewMatch(room);
                } else {
                    boolean allReady = !allPlayerIds.isEmpty() && 
                        allPlayerIds.stream().allMatch(id -> room.getPlayersReady().contains(id));
                    
                    if (allReady) {
                        startNewMatch(room);
                    }
                }
            } else if (!room.isPlaying()) {
                startNewMatch(room);
            }
        } else {
            room.setPlaying(false);
            messagingTemplate.convertAndSend(
                "/topic/room/" + room.getId() + "/waitingForPlayers",
                Map.of(
                    "redCount", room.getTeams().getRed().size(),
                    "blueCount", room.getTeams().getBlue().size()
                )
            );
        }
    }
    
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
            
            room.getPlayers().forEach((id, player) -> {
                player.setX(-100);
                player.setY(-100);
            });
            
            messagingTemplate.convertAndSend(
                "/topic/room/" + room.getId() + "/matchEnd",
                Map.of(
                    "winner", winner,
                    "gameState", roomManagerService.buildGameState(room)
                )
            );
        }
        
        messagingTemplate.convertAndSend(
            "/topic/room/" + room.getId() + "/timerUpdate",
            Map.of("matchTime", room.getMatchTime())
        );
    }
}
