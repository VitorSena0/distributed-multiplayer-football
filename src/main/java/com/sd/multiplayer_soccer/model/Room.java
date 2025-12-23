package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    private String id;
    private int width;
    private int height;
    private Map<String, Player> players = new HashMap<>();
    private Ball ball;
    private Score score;
    private Teams teams;
    private int matchTime;
    private boolean isPlaying;
    private boolean isResettingBall;
    private Point nextBallPosition;
    private boolean ballResetInProgress;
    private long lastGoalTime;
    private int goalCooldown;
    private boolean waitingForRestart;
    private Set<String> playersReady = new HashSet<>();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Point {
        private double x;
        private double y;
    }
}
