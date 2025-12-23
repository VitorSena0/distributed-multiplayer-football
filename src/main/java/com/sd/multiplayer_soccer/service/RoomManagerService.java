package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import static com.sd.multiplayer_soccer.constants.GameConstants.*;

@Service
public class RoomManagerService {
    
    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final AtomicInteger roomSequence = new AtomicInteger(1);
    
    public Map<String, Room> getRooms() {
        return rooms;
    }
    
    public Room getRoom(String roomId) {
        return rooms.get(roomId);
    }
    
    public String sanitizeRoomId(String roomId) {
        if (roomId == null || roomId.trim().isEmpty()) {
            return null;
        }
        
        String trimmed = roomId.trim().toLowerCase();
        String normalized = trimmed
            .replaceAll("\\s+", "-")
            .replaceAll("[^a-z0-9-_]", "");
        
        if (normalized.length() > 32) {
            normalized = normalized.substring(0, 32);
        }
        
        return normalized.isEmpty() ? null : normalized;
    }
    
    public String generateRoomId() {
        String candidate;
        do {
            candidate = "room-" + roomSequence.getAndIncrement();
        } while (rooms.containsKey(candidate));
        return candidate;
    }
    
    public Room createRoom(String roomId) {
        String id = rooms.containsKey(roomId) ? generateRoomId() : roomId;
        
        Room room = new Room();
        room.setId(id);
        room.setWidth(ROOM_WIDTH);
        room.setHeight(ROOM_HEIGHT);
        room.setPlayers(new HashMap<>());
        
        Ball ball = new Ball();
        ball.setX(400);
        ball.setY(300);
        ball.setRadius(BALL_RADIUS);
        ball.setSpeedX(0);
        ball.setSpeedY(0);
        room.setBall(ball);
        
        room.setScore(new Score(0, 0));
        room.setTeams(new Teams());
        room.setMatchTime(MATCH_DURATION);
        room.setPlaying(false);
        room.setResettingBall(false);
        room.setNextBallPosition(null);
        room.setBallResetInProgress(false);
        room.setLastGoalTime(0);
        room.setGoalCooldown(GOAL_COOLDOWN);
        room.setWaitingForRestart(false);
        
        rooms.put(id, room);
        System.out.println("Sala criada: " + id);
        return room;
    }
    
    public int getPlayerCount(Room room) {
        return room.getPlayers().size();
    }
    
    public Room getOrCreateAvailableRoom() {
        for (Room room : rooms.values()) {
            if (getPlayerCount(room) < MAX_PLAYERS_PER_ROOM) {
                return room;
            }
        }
        return createRoom(generateRoomId());
    }
    
    public RoomAllocation allocateRoom(String requestedRoomId) {
        if (requestedRoomId != null && !requestedRoomId.isEmpty()) {
            String sanitized = sanitizeRoomId(requestedRoomId);
            if (sanitized == null) {
                return new RoomAllocation(getOrCreateAvailableRoom(), null, null);
            }
            
            Room room = rooms.get(sanitized);
            if (room == null) {
                room = createRoom(sanitized);
            }
            
            if (getPlayerCount(room) < MAX_PLAYERS_PER_ROOM) {
                return new RoomAllocation(room, null, null);
            }
            return new RoomAllocation(null, "room-full", sanitized);
        }
        
        return new RoomAllocation(getOrCreateAvailableRoom(), null, null);
    }
    
    public GameState buildGameState(Room room) {
        GameState state = new GameState();
        state.setWidth(room.getWidth());
        state.setHeight(room.getHeight());
        state.setPlayers(room.getPlayers());
        state.setBall(room.getBall());
        state.setScore(room.getScore());
        state.setTeams(room.getTeams());
        state.setMatchTime(room.getMatchTime());
        state.setPlaying(room.isPlaying());
        state.setRoomId(room.getId());
        return state;
    }
    
    public void cleanupRoomIfEmpty(Room room) {
        if (room != null && getPlayerCount(room) == 0) {
            rooms.remove(room.getId());
            System.out.println("Sala removida: " + room.getId());
        }
    }
    
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
