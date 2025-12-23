package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for managing game rooms
 * Translated from TypeScript roomManager.ts
 */
@Service
public class RoomManagerService {
    
    private static final Logger logger = LoggerFactory.getLogger(RoomManagerService.class);
    
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final AtomicInteger roomSequence = new AtomicInteger(1);
    
    /**
     * Sanitizes room ID to ensure valid format
     */
    private String sanitizeRoomId(String roomId) {
        if (roomId == null || roomId.trim().isEmpty()) {
            return null;
        }
        
        String normalized = roomId.trim().toLowerCase()
            .replaceAll("\\s+", "-")
            .replaceAll("[^a-z0-9-_]", "");
        
        if (normalized.length() > 32) {
            normalized = normalized.substring(0, 32);
        }
        
        return normalized.isEmpty() ? null : normalized;
    }
    
    /**
     * Generates a unique room ID
     */
    private String generateRoomId() {
        String candidate;
        do {
            candidate = "room-" + roomSequence.getAndIncrement();
        } while (rooms.containsKey(candidate));
        return candidate;
    }
    
    /**
     * Creates a new room
     */
    public Room createRoom(String roomId) {
        String id = roomId != null && rooms.containsKey(roomId) ? generateRoomId() : 
                    (roomId != null ? roomId : generateRoomId());
        
        Room room = new Room(id);
        rooms.put(id, room);
        logger.info("Room created: {}", id);
        return room;
    }
    
    /**
     * Gets player count in a room
     */
    public int getPlayerCount(Room room) {
        return room.getPlayers().size();
    }
    
    /**
     * Gets or creates an available room
     */
    public Room getOrCreateAvailableRoom() {
        for (Room room : rooms.values()) {
            if (getPlayerCount(room) < GameConstants.MAX_PLAYERS_PER_ROOM) {
                return room;
            }
        }
        return createRoom(null);
    }
    
    /**
     * Allocates a room based on requested room ID
     */
    public RoomAllocation allocateRoom(String requestedRoomId) {
        if (requestedRoomId != null) {
            String sanitized = sanitizeRoomId(requestedRoomId);
            if (sanitized == null) {
                return new RoomAllocation(getOrCreateAvailableRoom(), null, null);
            }
            
            Room room = rooms.get(sanitized);
            if (room == null) {
                room = createRoom(sanitized);
            }
            
            if (getPlayerCount(room) < GameConstants.MAX_PLAYERS_PER_ROOM) {
                return new RoomAllocation(room, null, null);
            }
            
            return new RoomAllocation(null, "room-full", sanitized);
        }
        
        return new RoomAllocation(getOrCreateAvailableRoom(), null, null);
    }
    
    /**
     * Builds game state to send to clients
     */
    public GameState buildGameState(Room room) {
        return new GameState(
            room.getWidth(),
            room.getHeight(),
            room.getPlayers(),
            room.getBall(),
            room.getScore(),
            room.getTeams(),
            room.getMatchTime(),
            room.isPlaying(),
            room.getId()
        );
    }
    
    /**
     * Cleans up room if empty
     */
    public void cleanupRoomIfEmpty(Room room) {
        if (room != null && getPlayerCount(room) == 0) {
            rooms.remove(room.getId());
            logger.info("Room removed: {}", room.getId());
        }
    }
    
    /**
     * Gets a room by ID
     */
    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }
    
    /**
     * Gets all rooms
     */
    public Map<String, Room> getRooms() {
        return rooms;
    }
    
    /**
     * Room allocation result
     */
    public static class RoomAllocation {
        private final Room room;
        private final String error;
        private final String roomId;
        
        public RoomAllocation(Room room, String error, String roomId) {
            this.room = room;
            this.error = error;
            this.roomId = roomId;
        }
        
        public Room getRoom() {
            return room;
        }
        
        public String getError() {
            return error;
        }
        
        public String getRoomId() {
            return roomId;
        }
    }
}
