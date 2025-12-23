package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents player input state
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerInput {
    private boolean left;
    private boolean right;
    private boolean up;
    private boolean down;
}
