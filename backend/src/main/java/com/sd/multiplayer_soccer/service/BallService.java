package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Random;

/**
 * Service for ball physics and reset
 * Translated from TypeScript ball.ts
 */
@Service
public class BallService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    private final Random random = new Random();
    
    /**
     * Resets ball to center area of the field
     */
    public void resetBall(Room room) {
        double thirdWidth = room.getWidth() / 3.0;
        double minX = room.getWidth() / 2.0 - thirdWidth / 2.0;
        double maxX = room.getWidth() / 2.0 + thirdWidth / 2.0;
        
        double thirdHeight = room.getHeight() / 3.0;
        double minY = room.getHeight() / 2.0 - thirdHeight / 2.0;
        double maxY = room.getHeight() / 2.0 + thirdHeight / 2.0;
        
        Ball ball = new Ball(
            minX + random.nextDouble() * (maxX - minX),
            minY + random.nextDouble() * (maxY - minY),
            GameConstants.BALL_RADIUS,
            0,
            0
        );
        
        room.setBall(ball);
        room.setBallResetInProgress(false);
        
        // Send ball reset event to room
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/ballReset", 
            new BallResetEvent(ball));
    }
    
    /**
     * Enforces corner boundaries for the ball
     */
    public void enforceCornerBoundaries(Room room) {
        Ball ball = room.getBall();
        CornerDefinition[] corners = getCornerDefinitions(room);
        
        for (CornerDefinition corner : corners) {
            if (!corner.isInRegion(ball)) {
                continue;
            }
            
            Point p1 = corner.getP1();
            Point p2 = corner.getP2();
            Point inside = corner.getInside();
            
            double A = p2.getY() - p1.getY();
            double B = -(p2.getX() - p1.getX());
            double C = (p2.getX() - p1.getX()) * p1.getY() - (p2.getY() - p1.getY()) * p1.getX();
            
            double norm = Math.hypot(A, B);
            if (norm == 0) norm = 1;
            
            double insideValue = A * inside.getX() + B * inside.getY() + C;
            double insideSign = Math.signum(insideValue);
            if (insideSign == 0) insideSign = 1;
            
            double signedDistance = ((A * ball.getX() + B * ball.getY() + C) / norm) * insideSign;
            
            if (signedDistance >= GameConstants.BALL_RADIUS) {
                continue;
            }
            
            double penetration = GameConstants.BALL_RADIUS - signedDistance;
            double normalX = (A / norm) * insideSign;
            double normalY = (B / norm) * insideSign;
            
            ball.setX(ball.getX() + normalX * penetration);
            ball.setY(ball.getY() + normalY * penetration);
            
            double velocityAlongNormal = ball.getSpeedX() * normalX + ball.getSpeedY() * normalY;
            if (velocityAlongNormal < 0) {
                double damping = GameConstants.CORNER_BOUNCE_DAMPING;
                ball.setSpeedX(ball.getSpeedX() - (1 + damping) * velocityAlongNormal * normalX);
                ball.setSpeedY(ball.getSpeedY() - (1 + damping) * velocityAlongNormal * normalY);
            }
            
            break;
        }
    }
    
    /**
     * Gets corner definitions for collision detection
     */
    private CornerDefinition[] getCornerDefinitions(Room room) {
        int cs = GameConstants.CORNER_SIZE;
        
        return new CornerDefinition[] {
            // Top-left corner
            new CornerDefinition(
                ball -> ball.getX() < cs && ball.getY() < cs,
                new Point(0, cs),
                new Point(cs, 0),
                new Point(cs * 2, cs * 2)
            ),
            // Top-right corner
            new CornerDefinition(
                ball -> ball.getX() > room.getWidth() - cs && ball.getY() < cs,
                new Point(room.getWidth() - cs, 0),
                new Point(room.getWidth(), cs),
                new Point(Math.max(room.getWidth() - cs * 2, room.getWidth() / 2.0), cs * 2)
            ),
            // Bottom-left corner
            new CornerDefinition(
                ball -> ball.getX() < cs && ball.getY() > room.getHeight() - cs,
                new Point(0, room.getHeight() - cs),
                new Point(cs, room.getHeight()),
                new Point(cs * 2, Math.max(room.getHeight() - cs * 2, room.getHeight() / 2.0))
            ),
            // Bottom-right corner
            new CornerDefinition(
                ball -> ball.getX() > room.getWidth() - cs && ball.getY() > room.getHeight() - cs,
                new Point(room.getWidth() - cs, room.getHeight()),
                new Point(room.getWidth(), room.getHeight() - cs),
                new Point(
                    Math.max(room.getWidth() - cs * 2, room.getWidth() / 2.0),
                    Math.max(room.getHeight() - cs * 2, room.getHeight() / 2.0)
                )
            )
        };
    }
    
    /**
     * Corner definition for collision detection
     */
    public static class CornerDefinition {
        private final RegionCheck regionCheck;
        private final Point p1;
        private final Point p2;
        private final Point inside;
        
        public CornerDefinition(RegionCheck regionCheck, Point p1, Point p2, Point inside) {
            this.regionCheck = regionCheck;
            this.p1 = p1;
            this.p2 = p2;
            this.inside = inside;
        }
        
        public boolean isInRegion(Ball ball) {
            return regionCheck.check(ball);
        }
        
        public Point getP1() {
            return p1;
        }
        
        public Point getP2() {
            return p2;
        }
        
        public Point getInside() {
            return inside;
        }
    }
    
    @FunctionalInterface
    public interface RegionCheck {
        boolean check(Ball ball);
    }
    
    public static class BallResetEvent {
        private final Ball ball;
        
        public BallResetEvent(Ball ball) {
            this.ball = ball;
        }
        
        public Ball getBall() {
            return ball;
        }
    }
}
