package com.sd.multiplayer_soccer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents the teams in the game
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teams {
    private List<String> red = new ArrayList<>();
    private List<String> blue = new ArrayList<>();
}
