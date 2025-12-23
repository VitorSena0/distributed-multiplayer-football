import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Game types
interface Player {
  x: number;
  y: number;
  team: 'red' | 'blue';
  input: PlayerInput;
}

interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface Ball {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
}

interface Score {
  red: number;
  blue: number;
}

interface GameState {
  players: { [id: string]: Player };
  ball: Ball;
  score: Score;
  teams: { red: string[]; blue: string[] };
  matchTime: number;
  isPlaying: boolean;
  roomId: string;
}

interface GameCallbacks {
  onRoomAssigned: (roomId: string) => void;
  onPingUpdate: (ping: number) => void;
  onTimerUpdate: (time: number) => void;
  onScoreUpdate: (score: Score) => void;
  onWaitingMessage: (message: string) => void;
  onMatchEnd: () => void;
  onMatchStart: () => void;
}

const PLAYER_RADIUS = 20;
const BALL_RADIUS = 10;
const GOAL_WIDTH = 50;
const GOAL_HEIGHT = 200;
const CORNER_SIZE = 80;

export class GameService {
  private client: Client;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private gameState: GameState;
  private currentTeam: 'red' | 'blue' | 'spectator' = 'spectator';
  private inputs: PlayerInput = { left: false, right: false, up: false, down: false };

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks, _requestedRoomId: string = '') {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    
    // Initialize game state
    this.gameState = {
      players: {},
      ball: { x: 400, y: 300, radius: BALL_RADIUS, speedX: 0, speedY: 0 },
      score: { red: 0, blue: 0 },
      teams: { red: [], blue: [] },
      matchTime: 60,
      isPlaying: false,
      roomId: ''
    };

    // Setup input listeners
    this.setupInputListeners();
    
    // Initialize STOMP client
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Connected to WebSocket');
      this.subscribeToEvents();
      this.startGameLoop();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };
  }

  connect() {
    this.client.activate();
  }

  disconnect() {
    this.client.deactivate();
  }

  private subscribeToEvents() {
    // Subscribe to user-specific queues
    this.client.subscribe('/user/queue/roomAssigned', (message) => {
      const data = JSON.parse(message.body);
      this.gameState.roomId = data.roomId;
      this.callbacks.onRoomAssigned(data.roomId);
    });

    this.client.subscribe('/user/queue/init', (message) => {
      const data = JSON.parse(message.body);
      this.currentTeam = data.team;
      Object.assign(this.gameState, data.gameState);
    });

    // Subscribe to room-specific topics
    this.client.subscribe('/topic/room/*/update', (message) => {
      const data = JSON.parse(message.body);
      this.gameState = { ...this.gameState, ...data };
      this.callbacks.onScoreUpdate(data.score);
    });

    this.client.subscribe('/topic/room/*/timerUpdate', (message) => {
      const data = JSON.parse(message.body);
      this.gameState.matchTime = data.matchTime;
      this.callbacks.onTimerUpdate(data.matchTime);
    });

    this.client.subscribe('/topic/room/*/matchStart', (message) => {
      const data = JSON.parse(message.body);
      Object.assign(this.gameState, data.gameState);
      this.callbacks.onMatchStart();
      this.callbacks.onWaitingMessage('');
    });

    this.client.subscribe('/topic/room/*/matchEnd', (message) => {
      const data = JSON.parse(message.body);
      this.gameState.isPlaying = false;
      this.callbacks.onMatchEnd();
      
      const winner = data.winner;
      if (winner === 'draw') {
        this.callbacks.onWaitingMessage('Empate!');
      } else {
        this.callbacks.onWaitingMessage(`Time ${winner.toUpperCase()} venceu!`);
      }
    });

    this.client.subscribe('/topic/room/*/waitingForPlayers', (message) => {
      const data = JSON.parse(message.body);
      this.callbacks.onWaitingMessage(
        `Aguardando jogadores... Vermelho: ${data.redCount} | Azul: ${data.blueCount}`
      );
    });
  }

  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          this.inputs.left = true;
          break;
        case 'ArrowRight':
          this.inputs.right = true;
          break;
        case 'ArrowUp':
          this.inputs.up = true;
          break;
        case 'ArrowDown':
          this.inputs.down = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          this.inputs.left = false;
          break;
        case 'ArrowRight':
          this.inputs.right = false;
          break;
        case 'ArrowUp':
          this.inputs.up = false;
          break;
        case 'ArrowDown':
          this.inputs.down = false;
          break;
      }
    });
  }

  private startGameLoop() {
    // Send input updates
    setInterval(() => {
      if (this.currentTeam !== 'spectator' && this.gameState.isPlaying) {
        this.client.publish({
          destination: '/app/input',
          body: JSON.stringify(this.inputs)
        });
      }
    }, 1000 / 60);

    // Render loop
    const render = () => {
      this.draw();
      requestAnimationFrame(render);
    };
    render();
  }

  private draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw field
    ctx.fillStyle = '#28412f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass stripes
    const stripeHeight = 24;
    for (let y = 0; y < canvas.height; y += stripeHeight) {
      ctx.fillStyle = Math.floor(y / stripeHeight) % 2 === 0 ? '#2f4b37' : '#25382b';
      ctx.fillRect(0, y, canvas.width, stripeHeight);
    }

    // Draw corners
    ctx.fillStyle = '#1f2f35';
    const cs = CORNER_SIZE;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cs, 0);
    ctx.lineTo(0, cs);
    ctx.closePath();
    ctx.fill();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - cs, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, cs);
    ctx.closePath();
    ctx.fill();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - cs);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(cs, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(canvas.width - cs, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - cs);
    ctx.closePath();
    ctx.fill();

    // Draw field lines
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Draw goals
    ctx.fillStyle = '#ff000055';
    ctx.fillRect(0, canvas.height / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT);
    ctx.fillStyle = '#0000ff55';
    ctx.fillRect(canvas.width - GOAL_WIDTH, canvas.height / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT);

    // Draw players
    Object.entries(this.gameState.players).forEach(([_id, player]) => {
      ctx.fillStyle = player.team;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ball
    const ball = this.gameState.ball;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  requestRestart() {
    this.client.publish({
      destination: '/app/requestRestart',
      body: ''
    });
  }
}
