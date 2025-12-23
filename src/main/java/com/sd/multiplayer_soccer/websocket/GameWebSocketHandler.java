package com.sd.multiplayer_soccer.websocket;

import com.sd.multiplayer_soccer.model.*;
import com.sd.multiplayer_soccer.service.GameLoopService;
import com.sd.multiplayer_soccer.service.MatchService;
import com.sd.multiplayer_soccer.service.RoomManagerService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;

import static com.sd.multiplayer_soccer.constants.GameConstants.MAX_PLAYERS_PER_ROOM;

@Controller
public class GameWebSocketHandler {
    
    private final RoomManagerService roomManagerService;
    private final MatchService matchService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Map<String, String> sessionToRoom = new HashMap<>();
    
    public GameWebSocketHandler(RoomManagerService roomManagerService,
                                MatchService matchService,
                                SimpMessagingTemplate messagingTemplate) {
        this.roomManagerService = roomManagerService;
        this.matchService = matchService;
        this.messagingTemplate = messagingTemplate;
    }
    
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String sessionId = headers.getSessionId();
        
        // Get roomId from connection parameters if provided
        String requestedRoomId = (String) headers.getSessionAttributes().get("roomId");
        
        RoomManagerService.RoomAllocation allocation = roomManagerService.allocateRoom(requestedRoomId);
        
        if ("room-full".equals(allocation.getError())) {
            messagingTemplate.convertAndSendToUser(
                sessionId,
                "/queue/roomFull",
                Map.of(
                    "roomId", allocation.getRoomId(),
                    "capacity", MAX_PLAYERS_PER_ROOM
                )
            );
            return;
        }
        
        Room room = allocation.getRoom();
        sessionToRoom.put(sessionId, room.getId());
        
        // Determine team
        int redCount = room.getTeams().getRed().size();
        int blueCount = room.getTeams().getBlue().size();
        Player.Team team = redCount <= blueCount ? Player.Team.RED : Player.Team.BLUE;
        
        if (team == Player.Team.RED) {
            room.getTeams().getRed().add(sessionId);
        } else {
            room.getTeams().getBlue().add(sessionId);
        }
        
        // Create player
        Player player = new Player();
        player.setX(team == Player.Team.RED ? 100 : room.getWidth() - 100);
        player.setY(room.getHeight() / 2.0);
        player.setTeam(team);
        player.setInput(new PlayerInput(false, false, false, false));
        
        room.getPlayers().put(sessionId, player);
        
        // Send room assignment
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/roomAssigned",
            Map.of(
                "roomId", room.getId(),
                "capacity", MAX_PLAYERS_PER_ROOM,
                "players", room.getPlayers().size()
            )
        );
        
        // Send initial state
        boolean canMove = room.isPlaying() && 
                         !room.getTeams().getRed().isEmpty() && 
                         !room.getTeams().getBlue().isEmpty();
        
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/init",
            Map.of(
                "team", team,
                "gameState", roomManagerService.buildGameState(room),
                "canMove", canMove,
                "roomId", room.getId()
            )
        );
        
        matchService.checkRestartConditions(room);
        
        // Start ping interval (handled by client)
    }
    
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        String roomId = sessionToRoom.get(sessionId);
        
        if (roomId == null) {
            return;
        }
        
        Room room = roomManagerService.getRoom(roomId);
        if (room == null) {
            return;
        }
        
        Player player = room.getPlayers().get(sessionId);
        if (player != null) {
            // Remove from team
            if (player.getTeam() == Player.Team.RED) {
                room.getTeams().getRed().remove(sessionId);
            } else {
                room.getTeams().getBlue().remove(sessionId);
            }
            
            // Remove player
            room.getPlayers().remove(sessionId);
            room.getPlayersReady().remove(sessionId);
            
            // Notify others
            messagingTemplate.convertAndSend(
                "/topic/room/" + room.getId() + "/playerDisconnected",
                Map.of(
                    "playerId", sessionId,
                    "gameState", roomManagerService.buildGameState(room)
                )
            );
            
            matchService.checkRestartConditions(room);
        }
        
        sessionToRoom.remove(sessionId);
        roomManagerService.cleanupRoomIfEmpty(room);
    }
    
    @MessageMapping("/input")
    public void handleInput(@Payload PlayerInput input, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String roomId = sessionToRoom.get(sessionId);
        
        if (roomId == null) {
            return;
        }
        
        Room room = roomManagerService.getRoom(roomId);
        if (room == null || !room.isPlaying()) {
            return;
        }
        
        Player player = room.getPlayers().get(sessionId);
        if (player != null) {
            player.setInput(input);
        }
    }
    
    @MessageMapping("/requestRestart")
    public void handleRequestRestart(SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String roomId = sessionToRoom.get(sessionId);
        
        if (roomId == null) {
            return;
        }
        
        Room room = roomManagerService.getRoom(roomId);
        if (room == null || !room.isWaitingForRestart()) {
            return;
        }
        
        room.getPlayersReady().add(sessionId);
        
        // Reset player position
        Player player = room.getPlayers().get(sessionId);
        if (player != null) {
            player.setX(player.getTeam() == Player.Team.RED ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
        }
        
        List<String> allPlayers = new ArrayList<>();
        allPlayers.addAll(room.getTeams().getRed());
        allPlayers.addAll(room.getTeams().getBlue());
        
        boolean allReady = !allPlayers.isEmpty() && 
                          allPlayers.stream().allMatch(id -> room.getPlayersReady().contains(id));
        
        if (allReady) {
            if (!room.getTeams().getRed().isEmpty() && !room.getTeams().getBlue().isEmpty()) {
                matchService.startNewMatch(room);
            } else {
                messagingTemplate.convertAndSend(
                    "/topic/room/" + room.getId() + "/waitingForOpponent",
                    Map.of()
                );
            }
        }
        
        messagingTemplate.convertAndSend(
            "/topic/room/" + room.getId() + "/playerReadyUpdate",
            Map.of(
                "players", room.getPlayers(),
                "readyCount", room.getPlayersReady().size(),
                "totalPlayers", allPlayers.size(),
                "canMove", false
            )
        );
    }
}
