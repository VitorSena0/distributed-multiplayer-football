package com.sd.multiplayer_soccer.service;

import com.sd.multiplayer_soccer.model.Ball;
import com.sd.multiplayer_soccer.model.Room;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;

import static com.sd.multiplayer_soccer.constants.GameConstants.*;

@Service
public class BallService {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();
    
    public BallService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }
    
    public void resetBall(Room room) {
        double thirdWidth = room.getWidth() / 3.0;
        double minX = room.getWidth() / 2.0 - thirdWidth / 2.0;
        double maxX = room.getWidth() / 2.0 + thirdWidth / 2.0;
        double thirdHeight = room.getHeight() / 3.0;
        double minY = room.getHeight() / 2.0 - thirdHeight / 2.0;
        double maxY = room.getHeight() / 2.0 + thirdHeight / 2.0;
        
        Ball ball = new Ball();
        ball.setX(minX + random.nextDouble() * (maxX - minX));
        ball.setY(minY + random.nextDouble() * (maxY - minY));
        ball.setRadius(BALL_RADIUS);
        ball.setSpeedX(0);
        ball.setSpeedY(0);
        
        room.setBall(ball);
        room.setBallResetInProgress(false);
        
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/ballReset", 
            Map.of("ball", ball));
    }
    
    public void enforceCornerBoundaries(Room room) {
        Ball ball = room.getBall();
        int cs = CORNER_SIZE;
        
        // Define corner regions
        CornerDefinition[] corners = new CornerDefinition[] {
            new CornerDefinition(
                b -> b.getX() < cs && b.getY() < cs,
                new Point(0, cs), new Point(cs, 0), new Point(cs * 2, cs * 2)
            ),
            new CornerDefinition(
                b -> b.getX() > room.getWidth() - cs && b.getY() < cs,
                new Point(room.getWidth() - cs, 0), new Point(room.getWidth(), cs),
                new Point(Math.max(room.getWidth() - cs * 2, room.getWidth() / 2.0), cs * 2)
            ),
            new CornerDefinition(
                b -> b.getX() < cs && b.getY() > room.getHeight() - cs,
                new Point(0, room.getHeight() - cs), new Point(cs, room.getHeight()),
                new Point(cs * 2, Math.max(room.getHeight() - cs * 2, room.getHeight() / 2.0))
            ),
            new CornerDefinition(
                b -> b.getX() > room.getWidth() - cs && b.getY() > room.getHeight() - cs,
                new Point(room.getWidth() - cs, room.getHeight()), 
                new Point(room.getWidth(), room.getHeight() - cs),
                new Point(
                    Math.max(room.getWidth() - cs * 2, room.getWidth() / 2.0),
                    Math.max(room.getHeight() - cs * 2, room.getHeight() / 2.0)
                )
            )
        };
        
        for (CornerDefinition corner : corners) {
            if (!corner.inRegion(ball)) {
                continue;
            }
            
            Point p1 = corner.p1;
            Point p2 = corner.p2;
            Point inside = corner.inside;
            
            double A = p2.y - p1.y;
            double B = -(p2.x - p1.x);
            double C = (p2.x - p1.x) * p1.y - (p2.y - p1.y) * p1.x;
            double norm = Math.hypot(A, B);
            if (norm == 0) norm = 1;
            
            double insideValue = A * inside.x + B * inside.y + C;
            double insideSign = Math.signum(insideValue);
            if (insideSign == 0) insideSign = 1;
            
            double signedDistance = ((A * ball.getX() + B * ball.getY() + C) / norm) * insideSign;
            
            if (signedDistance >= BALL_RADIUS) {
                continue;
            }
            
            double penetration = BALL_RADIUS - signedDistance;
            double normalX = (A / norm) * insideSign;
            double normalY = (B / norm) * insideSign;
            
            ball.setX(ball.getX() + normalX * penetration);
            ball.setY(ball.getY() + normalY * penetration);
            
            double velocityAlongNormal = ball.getSpeedX() * normalX + ball.getSpeedY() * normalY;
            if (velocityAlongNormal < 0) {
                double damping = 0.7;
                ball.setSpeedX(ball.getSpeedX() - (1 + damping) * velocityAlongNormal * normalX);
                ball.setSpeedY(ball.getSpeedY() - (1 + damping) * velocityAlongNormal * normalY);
            }
            
            break;
        }
    }
    
    private static class Point {
        double x, y;
        Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }
    
    private static class CornerDefinition {
        interface RegionCheck {
            boolean test(Ball ball);
        }
        
        RegionCheck check;
        Point p1, p2, inside;
        
        CornerDefinition(RegionCheck check, Point p1, Point p2, Point inside) {
            this.check = check;
            this.p1 = p1;
            this.p2 = p2;
            this.inside = inside;
        }
        
        boolean inRegion(Ball ball) {
            return check.test(ball);
        }
    }
}
