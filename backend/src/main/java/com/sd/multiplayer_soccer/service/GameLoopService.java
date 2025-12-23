package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for game loop physics
 * Translated from TypeScript gameLoop.ts
 */
@Service
public class GameLoopService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private BallService ballService;
    
    /**
     * Main game loop - processes physics and collisions
     */
    public void gameLoop(Room room) {
        if (!room.isPlaying()) {
            return;
        }
        
        // Player movement
        room.getPlayers().values().forEach(player -> {
            double speed = GameConstants.PLAYER_SPEED;
            PlayerInput input = player.getInput();
            
            double dx = (input.isRight() ? speed : 0) - (input.isLeft() ? speed : 0);
            double dy = (input.isDown() ? speed : 0) - (input.isUp() ? speed : 0);
            
            player.setX(player.getX() + dx);
            player.setY(player.getY() + dy);
            
            // Clamp player position to field boundaries
            player.setX(Math.max(GameConstants.PLAYER_RADIUS, 
                Math.min(room.getWidth() - GameConstants.PLAYER_RADIUS, player.getX())));
            player.setY(Math.max(GameConstants.PLAYER_RADIUS, 
                Math.min(room.getHeight() - GameConstants.PLAYER_RADIUS, player.getY())));
        });
        
        Ball ball = room.getBall();
        
        // Player-ball collision
        room.getPlayers().values().forEach(player -> {
            double dx = ball.getX() - player.getX();
            double dy = ball.getY() - player.getY();
            double distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < GameConstants.PLAYER_RADIUS + GameConstants.BALL_RADIUS) {
                double angle = Math.atan2(dy, dx);
                double overlap = GameConstants.PLAYER_RADIUS + GameConstants.BALL_RADIUS - distance;
                
                ball.setX(ball.getX() + Math.cos(angle) * overlap * 1.1);
                ball.setY(ball.getY() + Math.sin(angle) * overlap * 1.1);
                
                PlayerInput input = player.getInput();
                double playerVelocityX = (input.isRight() ? GameConstants.PLAYER_SPEED : 0) - 
                                        (input.isLeft() ? GameConstants.PLAYER_SPEED : 0);
                double playerVelocityY = (input.isDown() ? GameConstants.PLAYER_SPEED : 0) - 
                                        (input.isUp() ? GameConstants.PLAYER_SPEED : 0);
                
                ball.setSpeedX(Math.cos(angle) * GameConstants.BALL_KICK_SPEED + playerVelocityX);
                ball.setSpeedY(Math.sin(angle) * GameConstants.BALL_KICK_SPEED + playerVelocityY);
            }
        });
        
        // Update ball position
        ball.setX(ball.getX() + ball.getSpeedX());
        ball.setY(ball.getY() + ball.getSpeedY());
        
        // Apply friction
        ball.setSpeedX(ball.getSpeedX() * GameConstants.BALL_FRICTION);
        ball.setSpeedY(ball.getSpeedY() * GameConstants.BALL_FRICTION);
        
        // Horizontal wall collision
        if (ball.getX() < GameConstants.BALL_RADIUS || 
            ball.getX() > room.getWidth() - GameConstants.BALL_RADIUS) {
            ball.setSpeedX(ball.getSpeedX() * -GameConstants.WALL_BOUNCE_DAMPING);
            ball.setX(Math.max(GameConstants.BALL_RADIUS, 
                Math.min(room.getWidth() - GameConstants.BALL_RADIUS, ball.getX())));
        }
        
        // Vertical wall collision
        if (ball.getY() < GameConstants.BALL_RADIUS || 
            ball.getY() > room.getHeight() - GameConstants.BALL_RADIUS) {
            ball.setSpeedY(ball.getSpeedY() * -GameConstants.WALL_BOUNCE_DAMPING);
            ball.setY(Math.max(GameConstants.BALL_RADIUS, 
                Math.min(room.getHeight() - GameConstants.BALL_RADIUS, ball.getY())));
        }
        
        // Corner boundaries
        ballService.enforceCornerBoundaries(room);
        
        // Goal detection
        long now = System.currentTimeMillis();
        if (!room.isBallResetInProgress() && 
            now - room.getLastGoalTime() > room.getGoalCooldown()) {
            
            double goalTop = room.getHeight() / 2.0 - GameConstants.GOAL_HEIGHT / 2.0;
            double goalBottom = room.getHeight() / 2.0 + GameConstants.GOAL_HEIGHT / 2.0;
            
            // Blue team goal (left side)
            if (ball.getX() < GameConstants.GOAL_WIDTH) {
                if (ball.getY() > goalTop && ball.getY() < goalBottom) {
                    room.getScore().setBlue(room.getScore().getBlue() + 1);
                    room.setLastGoalTime(now);
                    room.setBallResetInProgress(true);
                    
                    Map<String, String> goalEvent = new HashMap<>();
                    goalEvent.put("team", "blue");
                    messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/goalScored", 
                        goalEvent);
                    
                    // Schedule ball reset
                    new Thread(() -> {
                        try {
                            Thread.sleep(room.getGoalCooldown());
                            ballService.resetBall(room);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }).start();
                }
            }
            // Red team goal (right side)
            else if (ball.getX() > room.getWidth() - GameConstants.GOAL_WIDTH) {
                if (ball.getY() > goalTop && ball.getY() < goalBottom) {
                    room.getScore().setRed(room.getScore().getRed() + 1);
                    room.setLastGoalTime(now);
                    room.setBallResetInProgress(true);
                    
                    Map<String, String> goalEvent = new HashMap<>();
                    goalEvent.put("team", "red");
                    messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/goalScored", 
                        goalEvent);
                    
                    // Schedule ball reset
                    new Thread(() -> {
                        try {
                            Thread.sleep(room.getGoalCooldown());
                            ballService.resetBall(room);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                        }
                    }).start();
                }
            }
        }
        
        // Ball out of bounds fallback
        if (!room.isBallResetInProgress() && 
            (ball.getX() < 0 || ball.getX() > room.getWidth())) {
            ballService.resetBall(room);
        }
        
        // Send update to all clients in room
        Map<String, Object> updateEvent = new HashMap<>();
        updateEvent.put("players", room.getPlayers());
        updateEvent.put("ball", room.getBall());
        updateEvent.put("score", room.getScore());
        updateEvent.put("matchTime", room.getMatchTime());
        updateEvent.put("isPlaying", room.isPlaying());
        updateEvent.put("teams", room.getTeams());
        updateEvent.put("roomId", room.getId());
        
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/update", updateEvent);
    }
}
