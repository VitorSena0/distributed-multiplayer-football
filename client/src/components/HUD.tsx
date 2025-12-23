import React from 'react';

interface HUDProps {
  ping: number | null;
  matchTime: number;
  redScore: number;
  blueScore: number;
}

export const HUD: React.FC<HUDProps> = ({ ping, matchTime, redScore, blueScore }) => {
  const minutes = Math.floor(matchTime / 60);
  const seconds = matchTime % 60;
  const timeText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div id="hud-bottom">
      <div id="ping">Ping: {ping === null ? '--' : ping} ms</div>
      <div id="timer-bottom">{timeText}</div>
      <div id="scoreboard">
        Red: {redScore} | Blue: {blueScore}
      </div>
    </div>
  );
};
