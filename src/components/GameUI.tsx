import React from 'react';

interface GameUIProps {
  roomId: string | null;
  roomPlayerCount: number;
  roomCapacity: number;
  waitingForPlayers: boolean;
  matchEnded: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  showRestartButton: boolean;
  onRestartClick: () => void;
  currentTeam: 'red' | 'blue' | 'spectator';
}

const GameUI: React.FC<GameUIProps> = ({
  roomId,
  roomPlayerCount,
  roomCapacity,
  waitingForPlayers,
  matchEnded,
  winner,
  showRestartButton,
  onRestartClick,
  currentTeam,
}) => {
  return (
    <div className="game-ui">
      {/* Room Info */}
      <div className="info-card room-info">
        {roomId ? (
          <>
            <span className="room-badge">Sala {roomId}</span>
            {roomCapacity > 0 && (
              <span>
                {roomPlayerCount}/{roomCapacity} jogadores
              </span>
            )}
          </>
        ) : (
          <span>Conectando...</span>
        )}
      </div>

      {/* Waiting Screen */}
      {waitingForPlayers && !matchEnded && (
        <div className="info-card waiting-screen">
          <div className="loading" style={{ marginBottom: '8px' }}></div>
          <div>Aguardando jogadores...</div>
          <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.8 }}>
            É necessário pelo menos 1 jogador em cada time
          </div>
        </div>
      )}

      {/* Match Ended */}
      {matchEnded && (
        <>
          {winner && (
            <div className="winner-display">
              <h2>
                {winner === 'draw' 
                  ? '🤝 Empate!' 
                  : `🏆 Time ${winner === 'red' ? 'Vermelho' : 'Azul'} Venceu!`}
              </h2>
            </div>
          )}
          
          <div className="info-card waiting-screen">
            {currentTeam === 'spectator' ? (
              <div>Aguardando jogadores...</div>
            ) : (
              <div>
                {showRestartButton ? (
                  <div>Aguardando todos os jogadores...</div>
                ) : (
                  <div>Você está pronto!</div>
                )}
              </div>
            )}
          </div>

          {showRestartButton && currentTeam !== 'spectator' && (
            <button
              className="btn btn-success restart-button"
              onClick={onRestartClick}
            >
              ⚽ Jogar Novamente
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default GameUI;
