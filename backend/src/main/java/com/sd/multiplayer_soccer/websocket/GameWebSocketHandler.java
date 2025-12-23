package com.sd.multiplayer_soccer.websocket;

import com.sd.multiplayer_soccer.model.*;
import com.sd.multiplayer_soccer.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for game events
 * Translated from TypeScript socketHandlers.ts
 */
@Controller
public class GameWebSocketHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GameWebSocketHandler.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private RoomManagerService roomManagerService;
    
    @Autowired
    private MatchService matchService;
    
    // Maps session ID to room ID
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();
    
    /**
     * Handles player connection
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Get requested room ID from connection parameters
        List<String> roomIdHeader = headerAccessor.getNativeHeader("roomId");
        String requestedRoomId = (roomIdHeader != null && !roomIdHeader.isEmpty()) ? 
            roomIdHeader.get(0) : null;
        
        // Allocate room
        RoomManagerService.RoomAllocation allocation = roomManagerService.allocateRoom(requestedRoomId);
        
        if ("room-full".equals(allocation.getError())) {
            Map<String, Object> roomFullEvent = new HashMap<>();
            roomFullEvent.put("roomId", allocation.getRoomId());
            roomFullEvent.put("capacity", GameConstants.MAX_PLAYERS_PER_ROOM);
            
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/roomFull", roomFullEvent);
            return;
        }
        
        Room room = allocation.getRoom();
        sessionRoomMap.put(sessionId, room.getId());
        
        // Determine team
        int redCount = room.getTeams().getRed().size();
        int blueCount = room.getTeams().getBlue().size();
        String team = redCount <= blueCount ? "red" : "blue";
        
        if (team.equals("red")) {
            room.getTeams().getRed().add(sessionId);
        } else {
            room.getTeams().getBlue().add(sessionId);
        }
        
        // Create player
        Player player = new Player(
            team.equals("red") ? 100 : room.getWidth() - 100,
            room.getHeight() / 2.0,
            team
        );
        room.getPlayers().put(sessionId, player);
        
        // Send room assigned event
        Map<String, Object> roomAssignedEvent = new HashMap<>();
        roomAssignedEvent.put("roomId", room.getId());
        roomAssignedEvent.put("capacity", GameConstants.MAX_PLAYERS_PER_ROOM);
        roomAssignedEvent.put("players", room.getPlayers().size());
        
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/roomAssigned", roomAssignedEvent);
        
        // Send init event
        Map<String, Object> initEvent = new HashMap<>();
        initEvent.put("team", team);
        initEvent.put("gameState", roomManagerService.buildGameState(room));
        initEvent.put("canMove", room.isPlaying() && 
            !room.getTeams().getRed().isEmpty() && 
            !room.getTeams().getBlue().isEmpty());
        initEvent.put("roomId", room.getId());
        
        messagingTemplate.convertAndSendToUser(sessionId, "/queue/init", initEvent);
        
        // Check restart conditions
        matchService.checkRestartConditions(room);
        
        logger.info("Player {} connected to room {}", sessionId, room.getId());
    }
    
    /**
     * Handles player disconnection
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        String roomId = sessionRoomMap.remove(sessionId);
        if (roomId == null) {
            return;
        }
        
        Room room = roomManagerService.getRoom(roomId);
        if (room == null) {
            return;
        }
        
        Player player = room.getPlayers().remove(sessionId);
        if (player != null) {
            // Remove from team
            room.getTeams().getRed().remove(sessionId);
            room.getTeams().getBlue().remove(sessionId);
            
            // Remove from ready list
            room.getPlayersReady().remove(sessionId);
            
            // Notify other players
            Map<String, Object> disconnectEvent = new HashMap<>();
            disconnectEvent.put("playerId", sessionId);
            disconnectEvent.put("gameState", roomManagerService.buildGameState(room));
            
            messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/playerDisconnected", 
                disconnectEvent);
            
            // Check restart conditions
            matchService.checkRestartConditions(room);
        }
        
        // Cleanup room if empty
        roomManagerService.cleanupRoomIfEmpty(room);
        
        logger.info("Player {} disconnected from room {}", sessionId, roomId);
    }
    
    /**
     * Handles player input
     */
    @MessageMapping("/input")
    public void handleInput(@Payload PlayerInput input, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String roomId = sessionRoomMap.get(sessionId);
        
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
    
    /**
     * Handles restart request
     */
    @MessageMapping("/requestRestart")
    public void handleRestartRequest(SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String roomId = sessionRoomMap.get(sessionId);
        
        if (roomId == null) {
            return;
        }
        
        Room room = roomManagerService.getRoom(roomId);
        if (room == null || !room.isWaitingForRestart()) {
            return;
        }
        
        // Mark player as ready
        room.getPlayersReady().add(sessionId);
        
        // Reset player position
        Player player = room.getPlayers().get(sessionId);
        if (player != null) {
            player.setX(player.getTeam().equals("red") ? 100 : room.getWidth() - 100);
            player.setY(room.getHeight() / 2.0);
        }
        
        // Get all players
        Set<String> allPlayers = new HashSet<>();
        allPlayers.addAll(room.getTeams().getRed());
        allPlayers.addAll(room.getTeams().getBlue());
        
        // Check if all ready
        boolean allReady = !allPlayers.isEmpty() && 
            allPlayers.stream().allMatch(id -> room.getPlayersReady().contains(id));
        
        if (allReady) {
            if (!room.getTeams().getRed().isEmpty() && !room.getTeams().getBlue().isEmpty()) {
                matchService.startNewMatch(room);
            } else {
                messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/waitingForOpponent", 
                    Collections.emptyMap());
            }
        }
        
        // Send ready update
        Map<String, Object> readyUpdate = new HashMap<>();
        readyUpdate.put("players", room.getPlayers());
        readyUpdate.put("readyCount", room.getPlayersReady().size());
        readyUpdate.put("totalPlayers", allPlayers.size());
        readyUpdate.put("canMove", false);
        
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/playerReadyUpdate", 
            readyUpdate);
    }
}
