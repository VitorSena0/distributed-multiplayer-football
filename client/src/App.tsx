import React, { useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { useGameSocket } from './hooks/useGameSocket';
import type { PlayerInput } from './types';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');

  const { state, setState, sendInput, requestRestart, socketId } = useGameSocket(roomId);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.canMove || state.currentTeam === 'spectator' || state.matchEnded) return;

      setState((prev) => {
        const newInputs = { ...prev.inputs };
        switch (e.key) {
          case 'ArrowLeft':
            newInputs.left = true;
            break;
          case 'ArrowRight':
            newInputs.right = true;
            break;
          case 'ArrowUp':
            newInputs.up = true;
            break;
          case 'ArrowDown':
            newInputs.down = true;
            break;
        }
        return { ...prev, inputs: newInputs };
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setState((prev) => {
        const newInputs = { ...prev.inputs };
        switch (e.key) {
          case 'ArrowLeft':
            newInputs.left = false;
            break;
          case 'ArrowRight':
            newInputs.right = false;
            break;
          case 'ArrowUp':
            newInputs.up = false;
            break;
          case 'ArrowDown':
            newInputs.down = false;
            break;
        }
        return { ...prev, inputs: newInputs };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.canMove, state.currentTeam, state.matchEnded, setState]);

  // Send inputs to server
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.currentTeam !== 'spectator' && state.canMove) {
        sendInput(state.inputs);
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [state.inputs, state.canMove, state.currentTeam, sendInput]);

  const handleMobileInput = useCallback(
    (inputs: PlayerInput) => {
      if (state.currentTeam !== 'spectator' && state.canMove) {
        sendInput(inputs);
      }
    },
    [state.canMove, state.currentTeam, sendInput]
  );

  // Waiting screen text
  const getWaitingScreenText = () => {
    if (!state.gameState.isPlaying && state.gameState.teams.red.length === 0) {
      return `Aguardando jogadores... Vermelho: ${state.gameState.teams.red.length} | Azul: ${state.gameState.teams.blue.length}`;
    }
    if (!state.gameState.isPlaying && state.gameState.teams.blue.length === 0) {
      return `Aguardando jogadores... Vermelho: ${state.gameState.teams.red.length} | Azul: ${state.gameState.teams.blue.length}`;
    }
    if (state.matchEnded) {
      return 'Partida terminada. Aguardando todos jogadores...';
    }
    return '';
  };

  // Winner display text
  const getWinnerText = () => {
    if (!state.matchEnded) return '';
    const { red, blue } = state.gameState.score;
    if (red > blue) return 'Time RED venceu!';
    if (blue > red) return 'Time BLUE venceu!';
    return 'Empate!';
  };

  // Room info text
  const getRoomInfo = () => {
    if (!state.roomId) return 'Conectando a uma sala...';
    const playersInRoom = state.roomPlayerCount || Object.keys(state.gameState.players).length;
    const capacityText = state.roomCapacity ? ` (${playersInRoom}/${state.roomCapacity})` : '';
    return `Sala ${state.roomId}${capacityText}`;
  };

  return (
    <>
      <div id="game-container">
        <GameCanvas
          gameState={state.gameState}
          socketId={socketId}
          matchEnded={state.matchEnded}
          canMove={state.canMove}
        />
        <GameUI
          waitingScreen={getWaitingScreenText()}
          winnerDisplay={getWinnerText()}
          showWinner={state.matchEnded}
          roomInfo={getRoomInfo()}
          onRestart={requestRestart}
          showRestartButton={state.matchEnded}
        />
        <HUD
          ping={state.ping}
          matchTime={state.gameState.matchTime}
          redScore={state.gameState.score.red}
          blueScore={state.gameState.score.blue}
        />
      </div>
      <MobileControls isMobile={state.isMobile} onInputChange={handleMobileInput} />
    </>
  );
};

export default App;
