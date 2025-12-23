package com.sd.multiplayer_soccer.model;

import lombok.Data;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Represents a game room
 */
@Data
public class Room {
    private String id;
    private int width;
    private int height;
    private Map<String, Player> players;
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
    private Set<String> playersReady;
    
    public Room(String id) {
        this.id = id;
        this.width = GameConstants.ROOM_WIDTH;
        this.height = GameConstants.ROOM_HEIGHT;
        this.players = new ConcurrentHashMap<>();
        this.ball = createDefaultBall();
        this.score = new Score(0, 0);
        this.teams = new Teams();
        this.matchTime = GameConstants.MATCH_DURATION;
        this.isPlaying = false;
        this.isResettingBall = false;
        this.nextBallPosition = null;
        this.ballResetInProgress = false;
        this.lastGoalTime = 0;
        this.goalCooldown = GameConstants.GOAL_COOLDOWN;
        this.waitingForRestart = false;
        this.playersReady = new HashSet<>();
    }
    
    private Ball createDefaultBall() {
        return new Ball(400, 300, GameConstants.BALL_RADIUS, 0, 0);
    }
}
