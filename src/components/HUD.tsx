import React from 'react';

interface HUDProps {
  ping: number | null;
  matchTime: number;
  scoreRed: number;
  scoreBlue: number;
}

const HUD: React.FC<HUDProps> = ({ ping, matchTime, scoreRed, scoreBlue }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPingClass = (latency: number | null): string => {
    if (latency === null) return '';
    if (latency > 150) return 'critical';
    if (latency > 80) return 'high';
    return '';
  };

  return (
    <div className="hud-bottom">
      <div className={`hud-item ping-display ${getPingClass(ping)}`}>
        <span className="label">Ping:</span>
        <span className="value">{ping !== null ? `${ping} ms` : '-- ms'}</span>
      </div>
      
      <div className="hud-item">
        <span className="timer-display">{formatTime(matchTime)}</span>
      </div>
      
      <div className="hud-item scoreboard">
        <span className="score-red">{scoreRed}</span>
        <span className="score-separator">×</span>
        <span className="score-blue">{scoreBlue}</span>
      </div>
    </div>
  );
};

export default HUD;
