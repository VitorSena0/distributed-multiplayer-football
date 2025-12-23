import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, PlayerInput, AppState } from '../types';

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

export const useGameSocket = (roomId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<AppState>({
    matchEnded: false,
    canMove: false,
    currentTeam: 'spectator',
    roomId: null,
    roomCapacity: 0,
    roomPlayerCount: 0,
    requestedRoomId: roomId,
    ping: null,
    inputs: { left: false, right: false, up: false, down: false, action: false },
    gameState: initialGameState,
    isMobile: /Mobi|Android|iPhone/i.test(navigator.userAgent),
  });

  useEffect(() => {
    const socket = io(window.location.origin, {
      query: { roomId: roomId || '' },
    });

    socketRef.current = socket;

    // Socket event handlers
    socket.on('init', (data: any) => {
      setState((prev) => ({
        ...prev,
        currentTeam: data.team,
        gameState: { ...prev.gameState, ...data.gameState },
        canMove: data.canMove,
        roomId: data.roomId || prev.roomId,
        roomPlayerCount: Object.keys(data.gameState?.players || {}).length,
      }));
    });

    socket.on('roomAssigned', (data: any) => {
      setState((prev) => ({
        ...prev,
        roomId: data.roomId,
        roomCapacity: data.capacity,
        roomPlayerCount: data.players,
      }));
    });

    socket.on('playerConnected', (data: any) => {
      setState((prev) => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          players: {
            ...prev.gameState.players,
            [data.playerId]: {
              x: data.team === 'red' ? 100 : 700,
              y: 300,
              team: data.team,
              input: { left: false, right: false, up: false, down: false },
            },
          },
          teams: data.gameState.teams,
        },
        canMove: data.gameState.teams.red.length > 0 && data.gameState.teams.blue.length > 0,
        roomPlayerCount: Object.keys(prev.gameState.players).length + 1,
      }));
    });

    socket.on('update', (newState: any) => {
      setState((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, ...newState },
        roomId: newState.roomId || prev.roomId,
        roomPlayerCount: Object.keys(newState.players).length,
        canMove:
          newState.isPlaying &&
          ((prev.currentTeam === 'red' && newState.teams.blue.length > 0) ||
            (prev.currentTeam === 'blue' && newState.teams.red.length > 0)),
      }));
    });

    socket.on('matchStart', (data: any) => {
      setState((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, ...data.gameState, isPlaying: true },
        matchEnded: false,
        canMove: true,
        roomPlayerCount: Object.keys(data.gameState.players).length,
      }));
    });

    socket.on('matchEnd', (data: any) => {
      setState((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, isPlaying: false },
        matchEnded: true,
        roomPlayerCount: Object.keys(data.gameState.players).length,
      }));
    });

    socket.on('timerUpdate', (data: any) => {
      setState((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, matchTime: data.matchTime },
      }));
    });

    socket.on('ping', (serverTimestamp: number) => {
      const latencia = Date.now() - serverTimestamp;
      setState((prev) => ({ ...prev, ping: latencia }));
    });

    socket.on('goalScored', () => {
      setState((prev) => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          ball: { ...prev.gameState.ball, x: -1000, y: -1000 },
        },
      }));
    });

    socket.on('ballReset', (data: any) => {
      setState((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, ball: data.ball },
      }));
    });

    socket.on('playerDisconnected', (data: any) => {
      setState((prev) => {
        const newPlayers = { ...prev.gameState.players };
        delete newPlayers[data.playerId];
        return {
          ...prev,
          gameState: { ...prev.gameState, players: newPlayers },
          roomPlayerCount: Object.keys(newPlayers).length,
        };
      });
    });

    socket.on('waitingForPlayers', (data: any) => {
      setState((prev) => ({
        ...prev,
        canMove: false,
        roomPlayerCount: data.redCount + data.blueCount,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendInput = (inputs: PlayerInput) => {
    if (socketRef.current && state.canMove && state.currentTeam !== 'spectator') {
      socketRef.current.emit('input', inputs);
    }
  };

  const requestRestart = () => {
    if (socketRef.current) {
      socketRef.current.emit('requestRestart');
    }
  };

  return {
    state,
    setState,
    sendInput,
    requestRestart,
    socketId: socketRef.current?.id,
  };
};
