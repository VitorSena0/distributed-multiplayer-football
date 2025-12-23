import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, PlayerInput } from '../types/game';

export interface UseSocketReturn {
  socket: Socket | null;
  gameState: GameState;
  currentTeam: 'red' | 'blue' | 'spectator';
  roomId: string | null;
  roomCapacity: number;
  roomPlayerCount: number;
  ping: number | null;
  matchEnded: boolean;
  canMove: boolean;
  sendInput: (inputs: PlayerInput) => void;
  requestRestart: () => void;
}

const initialGameState: GameState = {
  players: {},
  ball: { x: 400, y: 300, radius: 10, speedX: 0, speedY: 0 },
  score: { red: 0, blue: 0 },
  teams: { red: [], blue: [] },
  matchTime: 60,
  isPlaying: false,
  width: 800,
  height: 600,
};

export const useSocket = (requestedRoomId: string | null): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentTeam, setCurrentTeam] = useState<'red' | 'blue' | 'spectator'>('spectator');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCapacity, setRoomCapacity] = useState(0);
  const [roomPlayerCount, setRoomPlayerCount] = useState(0);
  const [ping, setPing] = useState<number | null>(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [canMove, setCanMove] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      query: { roomId: requestedRoomId || '' },
    });

    setSocket(newSocket);

    // Init handler
    newSocket.on('init', (data: any) => {
      setCurrentTeam(data.team);
      setGameState(prev => ({ ...prev, ...data.gameState }));
      setCanMove(data.canMove);
      setRoomId(data.roomId || roomId);
      setRoomPlayerCount(Object.keys(data.gameState?.players || {}).length);
    });

    // Room assigned
    newSocket.on('roomAssigned', (data: any) => {
      setRoomId(data.roomId);
      setRoomCapacity(data.capacity);
      setRoomPlayerCount(data.players);
      
      // Update URL
      const params = new URLSearchParams(window.location.search);
      params.set('room', data.roomId);
      window.history.replaceState({}, '', `/?${params.toString()}`);
    });

    // Room full
    newSocket.on('roomFull', (data: any) => {
      alert(`Sala ${data.roomId} está cheia (${data.capacity} jogadores). Escolha outra sala.`);
      setCanMove(false);
    });

    // Player connected
    newSocket.on('playerConnected', (data: any) => {
      setGameState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [data.playerId]: {
            x: data.team === 'red' ? 100 : 700,
            y: 300,
            team: data.team,
            input: { left: false, right: false, up: false, down: false },
          },
        },
        teams: data.gameState.teams,
      }));
      setRoomPlayerCount(Object.keys(data.gameState.teams.red).length + Object.keys(data.gameState.teams.blue).length);
    });

    // Update handler
    newSocket.on('update', (newState: any) => {
      setGameState(prev => ({ ...prev, ...newState }));
      setRoomId(newState.roomId || roomId);
      setRoomPlayerCount(Object.keys(newState.players || {}).length);
    });

    // Match start
    newSocket.on('matchStart', (data: any) => {
      setGameState(prev => ({ ...prev, ...data.gameState, isPlaying: true }));
      setMatchEnded(false);
      setCanMove(true);
      setRoomPlayerCount(Object.keys(data.gameState?.players || {}).length);
    });

    // Match end
    newSocket.on('matchEnd', (data: any) => {
      setGameState(prev => ({ ...prev, isPlaying: false, players: data.gameState.players }));
      setMatchEnded(true);
      setRoomPlayerCount(Object.keys(data.gameState?.players || {}).length);
    });

    // Timer update
    newSocket.on('timerUpdate', (data: any) => {
      setGameState(prev => ({ ...prev, matchTime: data.matchTime }));
    });

    // Waiting for players
    newSocket.on('waitingForPlayers', (data: any) => {
      setCanMove(false);
      setRoomPlayerCount(data.redCount + data.blueCount);
    });

    // Team changed
    newSocket.on('teamChanged', (data: any) => {
      setCurrentTeam(data.newTeam);
      setGameState(data.gameState);
      alert(`Você foi movido para o time ${data.newTeam.toUpperCase()}`);
    });

    // Player disconnected
    newSocket.on('playerDisconnected', (data: any) => {
      setGameState(data.gameState);
      setRoomPlayerCount(Object.keys(data.gameState?.players || {}).length);
    });

    // Player ready update
    newSocket.on('playerReadyUpdate', (data: any) => {
      setGameState(prev => ({ ...prev, players: data.players }));
      setRoomPlayerCount(Object.keys(data.players || {}).length);
    });

    // Clean previous match
    newSocket.on('cleanPreviousMatch', () => {
      setMatchEnded(false);
    });

    // Ping
    newSocket.on('ping', (serverTimestamp: number) => {
      const latency = Date.now() - serverTimestamp;
      setPing(latency);
    });

    // Goal scored
    newSocket.on('goalScored', (data: any) => {
      console.log(`GOL do time ${data.team}!`);
    });

    // Ball reset
    newSocket.on('ballReset', (data: any) => {
      setGameState(prev => ({ ...prev, ball: data.ball }));
    });

    // Waiting for opponent
    newSocket.on('waitingForOpponent', () => {
      // Handle waiting state
    });

    return () => {
      newSocket.close();
    };
  }, [requestedRoomId]);

  const sendInput = useCallback((inputs: PlayerInput) => {
    if (socket && canMove && currentTeam !== 'spectator') {
      socket.emit('input', inputs);
    }
  }, [socket, canMove, currentTeam]);

  const requestRestart = useCallback(() => {
    if (socket) {
      socket.emit('requestRestart');
    }
  }, [socket]);

  return {
    socket,
    gameState,
    currentTeam,
    roomId,
    roomCapacity,
    roomPlayerCount,
    ping,
    matchEnded,
    canMove,
    sendInput,
    requestRestart,
  };
};
