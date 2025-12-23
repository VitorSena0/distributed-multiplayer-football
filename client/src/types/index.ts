export interface Config {
  canvas: {
    width: number;
    height: number;
  };
  field: {
    cornerSize: number;
  };
  player: {
    radius: number;
  };
  ball: {
    radius: number;
  };
  goal: {
    width: number;
    height: number;
  };
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  action: boolean;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
}

export interface Score {
  red: number;
  blue: number;
}

export interface Teams {
  red: string[];
  blue: string[];
}

export interface Player {
  x: number;
  y: number;
  team: 'red' | 'blue';
  input: Omit<PlayerInput, 'action'>;
}

export interface GameState {
  players: { [socketId: string]: Player };
  ball: Ball;
  score: Score;
  teams: Teams;
  matchTime: number;
  isPlaying: boolean;
  width: number;
  height: number;
}

export interface AppState {
  matchEnded: boolean;
  canMove: boolean;
  currentTeam: 'red' | 'blue' | 'spectator';
  roomId: string | null;
  roomCapacity: number;
  roomPlayerCount: number;
  requestedRoomId: string | null;
  ping: number | null;
  inputs: PlayerInput;
  gameState: GameState;
  isMobile: boolean;
}
