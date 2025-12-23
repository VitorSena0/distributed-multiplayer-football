package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents the score of the match
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Score {
    private int red;
    private int blue;
}
