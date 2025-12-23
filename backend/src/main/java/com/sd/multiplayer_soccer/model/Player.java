package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a player in the game
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    private double x;
    private double y;
    private String team; // "red" or "blue"
    private PlayerInput input;
    
    public Player(double x, double y, String team) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.input = new PlayerInput();
    }
}
