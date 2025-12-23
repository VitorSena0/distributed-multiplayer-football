package com.sd.multiplayer_soccer.model;

/**
 * Game constants translated from TypeScript constants.ts
 */
public final class GameConstants {
    
    // Player and ball dimensions
    public static final int PLAYER_RADIUS = 20;
    public static final int BALL_RADIUS = 10;
    
    // Goal dimensions
    public static final int GOAL_HEIGHT = 200;
    public static final int GOAL_WIDTH = 50;
    
    // Match settings
    public static final int MATCH_DURATION = 60; // seconds
    public static final int MAX_PLAYERS_PER_ROOM = 6;
    
    // Field settings
    public static final int CORNER_SIZE = 80;
    public static final int ROOM_WIDTH = 800;
    public static final int ROOM_HEIGHT = 600;
    
    // Game loop settings
    public static final int GAME_LOOP_FPS = 60;
    public static final int TIMER_UPDATE_INTERVAL = 1000; // milliseconds
    
    // Physics settings
    public static final double PLAYER_SPEED = 5.0;
    public static final double BALL_FRICTION = 0.89;
    public static final double WALL_BOUNCE_DAMPING = 0.7;
    public static final double CORNER_BOUNCE_DAMPING = 0.7;
    public static final double BALL_KICK_SPEED = 12.0;
    
    // Goal detection
    public static final int GOAL_COOLDOWN = 500; // milliseconds
    
    private GameConstants() {
        // Prevent instantiation
    }
}
