package com.sd.multiplayer_soccer.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity to store match history for future use.
 * Currently not persisting any data, just the model structure.
 */
@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "room_id")
    private String roomId;
    
    @Column(name = "red_score")
    private Integer redScore;
    
    @Column(name = "blue_score")
    private Integer blueScore;
    
    @Column(name = "winner")
    private String winner; // "red", "blue", or "draw"
    
    @Column(name = "duration")
    private Integer duration; // in seconds
    
    @Column(name = "played_at")
    private LocalDateTime playedAt;
    
    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
}
