package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.Ball;
import com.sd.multiplayer_soccer.model.Player;
import com.sd.multiplayer_soccer.model.Room;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

import static com.sd.multiplayer_soccer.constants.GameConstants.*;

@Service
public class GameLoopService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final BallService ballService;
    private final RoomManagerService roomManagerService;
    
    public GameLoopService(SimpMessagingTemplate messagingTemplate,
                          BallService ballService,
                          RoomManagerService roomManagerService) {
        this.messagingTemplate = messagingTemplate;
        this.ballService = ballService;
        this.roomManagerService = roomManagerService;
    }
    
    public void gameLoop(Room room) {
        if (!room.isPlaying()) {
            return;
        }
        
        // Player movement
        room.getPlayers().values().forEach(player -> {
            double speed = 5;
            double dx = (player.getInput().isRight() ? speed : 0) - (player.getInput().isLeft() ? speed : 0);
            double dy = (player.getInput().isDown() ? speed : 0) - (player.getInput().isUp() ? speed : 0);
            
            player.setX(player.getX() + dx);
            player.setY(player.getY() + dy);
            
            // Boundary constraints
            player.setX(Math.max(PLAYER_RADIUS, Math.min(room.getWidth() - PLAYER_RADIUS, player.getX())));
            player.setY(Math.max(PLAYER_RADIUS, Math.min(room.getHeight() - PLAYER_RADIUS, player.getY())));
        });
        
        Ball ball = room.getBall();
        
        // Player-ball collision
        room.getPlayers().values().forEach(player -> {
            double dx = ball.getX() - player.getX();
            double dy = ball.getY() - player.getY();
            double distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < PLAYER_RADIUS + BALL_RADIUS) {
                double angle = Math.atan2(dy, dx);
                double overlap = PLAYER_RADIUS + BALL_RADIUS - distance;
                
                ball.setX(ball.getX() + Math.cos(angle) * overlap * 1.1);
                ball.setY(ball.getY() + Math.sin(angle) * overlap * 1.1);
                
                double playerVelocityX = (player.getInput().isRight() ? 5 : 0) - (player.getInput().isLeft() ? 5 : 0);
                double playerVelocityY = (player.getInput().isDown() ? 5 : 0) - (player.getInput().isUp() ? 5 : 0);
                
                ball.setSpeedX(Math.cos(angle) * 12 + playerVelocityX);
                ball.setSpeedY(Math.sin(angle) * 12 + playerVelocityY);
            }
        });
        
        // Update ball position
        ball.setX(ball.getX() + ball.getSpeedX());
        ball.setY(ball.getY() + ball.getSpeedY());
        
        // Friction
        ball.setSpeedX(ball.getSpeedX() * 0.89);
        ball.setSpeedY(ball.getSpeedY() * 0.89);
        
        // Horizontal wall collision
        if (ball.getX() < BALL_RADIUS || ball.getX() > room.getWidth() - BALL_RADIUS) {
            ball.setSpeedX(ball.getSpeedX() * -0.7);
            ball.setX(Math.max(BALL_RADIUS, Math.min(room.getWidth() - BALL_RADIUS, ball.getX())));
        }
        
        // Vertical wall collision
        if (ball.getY() < BALL_RADIUS || ball.getY() > room.getHeight() - BALL_RADIUS) {
            ball.setSpeedY(ball.getSpeedY() * -0.7);
            ball.setY(Math.max(BALL_RADIUS, Math.min(room.getHeight() - BALL_RADIUS, ball.getY())));
        }
        
        // Corner boundaries
        ballService.enforceCornerBoundaries(room);
        
        // Goal detection
        long now = System.currentTimeMillis();
        if (!room.isBallResetInProgress() && now - room.getLastGoalTime() > room.getGoalCooldown()) {
            if (ball.getX() < GOAL_WIDTH) { // Blue team scores
                if (ball.getY() > room.getHeight() / 2.0 - GOAL_HEIGHT / 2.0 &&
                    ball.getY() < room.getHeight() / 2.0 + GOAL_HEIGHT / 2.0) {
                    
                    room.getScore().setBlue(room.getScore().getBlue() + 1);
                    room.setLastGoalTime(now);
                    room.setBallResetInProgress(true);
                    
                    messagingTemplate.convertAndSend(
                        "/topic/room/" + room.getId() + "/goalScored",
                        Map.of("team", "blue")
                    );
                    
                    scheduleResetBall(room);
                }
            } else if (ball.getX() > room.getWidth() - GOAL_WIDTH) { // Red team scores
                if (ball.getY() > room.getHeight() / 2.0 - GOAL_HEIGHT / 2.0 &&
                    ball.getY() < room.getHeight() / 2.0 + GOAL_HEIGHT / 2.0) {
                    
                    room.getScore().setRed(room.getScore().getRed() + 1);
                    room.setLastGoalTime(now);
                    room.setBallResetInProgress(true);
                    
                    messagingTemplate.convertAndSend(
                        "/topic/room/" + room.getId() + "/goalScored",
                        Map.of("team", "red")
                    );
                    
                    scheduleResetBall(room);
                }
            }
        }
        
        // Ball out of bounds fallback
        if (!room.isBallResetInProgress() && (ball.getX() < 0 || ball.getX() > room.getWidth())) {
            ballService.resetBall(room);
        }
        
        // Send update to clients
        messagingTemplate.convertAndSend(
            "/topic/room/" + room.getId() + "/update",
            Map.of(
                "players", room.getPlayers(),
                "ball", room.getBall(),
                "score", room.getScore(),
                "matchTime", room.getMatchTime(),
                "isPlaying", room.isPlaying(),
                "teams", room.getTeams(),
                "roomId", room.getId()
            )
        );
    }
    
    private void scheduleResetBall(Room room) {
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
