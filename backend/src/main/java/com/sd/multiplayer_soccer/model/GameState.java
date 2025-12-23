package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Represents the game state sent to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameState {
    private int width;
    private int height;
    private Map<String, Player> players;
    private Ball ball;
    private Score score;
    private Teams teams;
    private int matchTime;
    private boolean isPlaying;
    private String roomId;
}
