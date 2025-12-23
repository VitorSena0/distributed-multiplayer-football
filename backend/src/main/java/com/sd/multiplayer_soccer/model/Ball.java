package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents the ball in the game
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ball {
    private double x;
    private double y;
    private int radius;
    private double speedX;
    private double speedY;
    
    public Ball(double x, double y, int radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = 0;
        this.speedY = 0;
    }
}
