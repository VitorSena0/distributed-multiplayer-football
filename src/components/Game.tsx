import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { PlayerInput } from '../types/game';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import HUD from './HUD';
import PlayerIDs from './PlayerIDs';
import MobileControls from './MobileControls';
import Toast from './Toast';

const Game: React.FC = () => {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputs, setInputs] = useState<PlayerInput>({
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
  });
  const [showRestartButton, setShowRestartButton] = useState(true);
  const [winner, setWinner] = useState<'red' | 'blue' | 'draw' | null>(null);
  const [isMobile] = useState(() => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone/i.test(navigator.userAgent)
    );
  });

  // Get room ID from URL
  const getRequestedRoomId = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('room');
    return value ? value.trim() : null;
  };

  const requestedRoomId = getRequestedRoomId();
  
  const {
    socket,
    gameState,
    currentTeam,
    roomId,
    roomCapacity,
    roomPlayerCount,
    ping,
    matchEnded,
    canMove,
    notification,
    sendInput,
    requestRestart,
    clearNotification,
  } = useSocket(requestedRoomId);

  // Determine if waiting for players
  const waitingForPlayers = 
    !matchEnded && 
    (gameState.teams.red.length === 0 || gameState.teams.blue.length === 0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canMove || currentTeam === 'spectator' || matchEnded) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setInputs((prev) => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setInputs((prev) => ({ ...prev, right: true }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setInputs((prev) => ({ ...prev, up: true }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setInputs((prev) => ({ ...prev, down: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setInputs((prev) => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setInputs((prev) => ({ ...prev, right: false }));
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setInputs((prev) => ({ ...prev, up: false }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setInputs((prev) => ({ ...prev, down: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canMove, currentTeam, matchEnded]);

  // Send inputs to server
  useEffect(() => {
    const interval = setInterval(() => {
      sendInput(inputs);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [inputs, sendInput]);

  // Handle match end
  useEffect(() => {
    if (matchEnded) {
      setShowRestartButton(true);
      
      // Determine winner
      if (gameState.score.red > gameState.score.blue) {
        setWinner('red');
      } else if (gameState.score.blue > gameState.score.red) {
        setWinner('blue');
      } else {
        setWinner('draw');
      }
    } else {
      setShowRestartButton(true);
      setWinner(null);
    }
  }, [matchEnded, gameState.score]);

  const handleRestartClick = () => {
    setShowRestartButton(false);
    requestRestart();
  };

  const handleMobileInputChange = (mobileInputs: Partial<PlayerInput>) => {
    setInputs((prev) => ({ ...prev, ...mobileInputs }));
  };

  // Get canvas element for PlayerIDs
  useEffect(() => {
    if (canvasWrapperRef.current) {
      const canvas = canvasWrapperRef.current.querySelector('canvas');
      if (canvas) {
        // Type-safe way to assign canvas element
        Object.assign(canvasRef, { current: canvas });
      }
    }
  }, []);

  return (
    <div className="game-container">
      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <GameCanvas
          gameState={gameState}
          socketId={socket?.id}
          matchEnded={matchEnded}
          canMove={canMove}
        />
        
        <GameUI
          roomId={roomId}
          roomPlayerCount={roomPlayerCount}
          roomCapacity={roomCapacity}
          waitingForPlayers={waitingForPlayers}
          matchEnded={matchEnded}
          winner={winner}
          showRestartButton={showRestartButton}
          onRestartClick={handleRestartClick}
          currentTeam={currentTeam}
        />
      </div>

      <HUD
        ping={ping}
        matchTime={gameState.matchTime}
        scoreRed={gameState.score.red}
        scoreBlue={gameState.score.blue}
      />

      <PlayerIDs
        gameState={gameState}
        socketId={socket?.id}
        canvasRef={canvasRef}
      />

      <MobileControls
        onInputChange={handleMobileInputChange}
        isMobile={isMobile}
      />

      {notification && (
        <Toast message={notification} onClose={clearNotification} />
      )}
    </div>
  );
};

export default Game;
