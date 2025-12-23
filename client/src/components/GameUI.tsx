import React from 'react';

interface GameUIProps {
  waitingScreen: string;
  winnerDisplay: string;
  showWinner: boolean;
  roomInfo: string;
  onRestart: () => void;
  showRestartButton: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  waitingScreen,
  winnerDisplay,
  showWinner,
  roomInfo,
  onRestart,
  showRestartButton,
}) => {
  return (
    <div id="game-ui">
      {waitingScreen && (
        <div id="waiting-screen" style={{ display: 'block' }}>
          {waitingScreen}
        </div>
      )}
      {showWinner && (
        <div id="winner-display" className="show">
          {winnerDisplay}
        </div>
      )}
      <div id="room-info">{roomInfo}</div>
      {showRestartButton && (
        <button id="restart-button" onClick={onRestart}>
          Jogar Novamente
        </button>
      )}
    </div>
  );
};
