import { useEffect, useRef, useState } from 'react';
import { GameService } from './services/GameService';
import './Game.css';

// Game configuration constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameServiceRef = useRef<GameService | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [ping, setPing] = useState<number | null>(null);
  const [matchTime, setMatchTime] = useState<number>(60);
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [waitingMessage, setWaitingMessage] = useState<string>('Conectando...');
  const [showRestart, setShowRestart] = useState(false);

  useEffect(() => {
    // Get requested room ID from URL
    const params = new URLSearchParams(window.location.search);
    const requestedRoomId = params.get('room') || '';
    
    // Initialize game service
    const gameService = new GameService(
      canvasRef.current!,
      {
        onRoomAssigned: (id) => setRoomId(id),
        onPingUpdate: (p) => setPing(p),
        onTimerUpdate: (t) => setMatchTime(t),
        onScoreUpdate: (s) => setScore(s),
        onWaitingMessage: (m) => setWaitingMessage(m),
        onMatchEnd: () => setShowRestart(true),
        onMatchStart: () => setShowRestart(false),
      },
      requestedRoomId
    );
    
    gameServiceRef.current = gameService;
    gameService.connect();
    
    return () => {
      gameService.disconnect();
    };
  }, []);

  const handleRestart = () => {
    gameServiceRef.current?.requestRestart();
    setShowRestart(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        style={{ border: '2px solid #333' }}
      />
      
      <div className="game-ui">
        <div className="waiting-screen">{waitingMessage}</div>
        {showRestart && (
          <button className="restart-button" onClick={handleRestart}>
            Jogar Novamente
          </button>
        )}
      </div>

      <div className="hud-bottom">
        <div className="ping">Ping: {ping !== null ? `${ping} ms` : '-- ms'}</div>
        <div className="timer-bottom">{formatTime(matchTime)}</div>
        <div className="scoreboard">Red: {score.red} | Blue: {score.blue}</div>
      </div>

      {roomId && (
        <div className="room-info">Sala {roomId}</div>
      )}
    </div>
  );
}

export default App;
