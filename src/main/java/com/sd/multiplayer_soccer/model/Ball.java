package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ball {
    private double x;
    private double y;
    private int radius;
    private double speedX;
    private double speedY;
}
