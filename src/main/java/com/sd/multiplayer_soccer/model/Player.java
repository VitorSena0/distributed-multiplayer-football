package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    private double x;
    private double y;
    private Team team;
    private PlayerInput input;
    
    public enum Team {
        RED, BLUE
    }
}
