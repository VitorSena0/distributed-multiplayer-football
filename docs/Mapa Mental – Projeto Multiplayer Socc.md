# Mapa Mental – Projeto Multiplayer Soccer

## 1. Visão Geral

- **Tipo de projeto**: jogo de futebol multiplayer 2D em tempo real.
- **Stack principal**:
  - **Back-end**: Node.js + Express + Socket.IO.
  - **Game server**: simulação de física, salas, timer, placar.
  - **Front-end**: HTML5 Canvas + JS puro (sem framework) + controles mobile.
  - **Infra**:
    - Docker para containerizar o app.
    - Nginx como proxy reverso.
    - `docker-compose` para orquestrar app + Nginx.
    - Guiais de deploy para EC2, PM2, etc.

---

## 2. Back-end – Entrada do Servidor

### 2.1 `game-server.js` (ponto de entrada Node)

- **Responsabilidade**:
  - Criar o servidor HTTP, plugar Express e Socket.IO, servir o front-end e rodar os loops do jogo.
- **Fluxo**:
  - Importa:
    - `express`, `http`, `socket.io`.
    - `rooms` (estado global das salas) de `game/roomManager`.
    - `gameLoop` de `game/gameLoop`.
    - `updateTimer` de `game/match`.
    - `registerSocketHandlers` de `game/socketHandlers`.
  - Cria:
    - `app = express()`.
    - `server = http.createServer(app)`.
    - `io = socketio(server, { cors: { origin: '*', methods: ['GET', 'POST'] }, allowEIO3: true })`.
  - **Servir front-end**:
    - `app.use(express.static('public'))` → tudo em `public/` é servido direto.
  - **Sockets**:
    - `registerSocketHandlers(io)` registra todos os eventos (`connection`, `input`, `requestRestart`, etc.).
  - **Loops globais**:
    - `runGameLoops`: percorre `rooms` e chama `gameLoop(room, io)` → 60 FPS.
    - `handleTimers`: percorre `rooms` e chama `updateTimer(room, io)` → 1 vez por segundo.
    - `setInterval(runGameLoops, 1000 / 60)`.
    - `setInterval(handleTimers, 1000)`.
  - **Porta**:
    - `PORT = process.env.PORT || 3000`.
    - `server.listen(PORT, '0.0.0.0', ...)`.

> No diagrama: bloco “Servidor Node (game-server.js)” ligado a “Express”, “Socket.IO (io)”, “Game Loop” e “Timer”.

#### Tipos (conceituais)

- `Port`: `number`.
- `App`: instância de `express.Application`.
- `Server`: instância de `http.Server`.
- `IO` (Socket.IO server, simplificado):
  ```ts
  {
    on(event: 'connection', handler: (socket: ServerSocket) => void): void;
    to(roomId: string): { emit(event: string, payload: any): void };
  }
  ```

#### Assinaturas de funções

- `runGameLoops(): void` – percorre todas as salas e chama `gameLoop(room, io)`.
- `handleTimers(): void` – percorre todas as salas e chama `updateTimer(room, io)`.
- `server.listen(port: Port, host: string, callback: () => void): void`.

---

## 3. Módulos de Jogo (lado servidor – pasta `game/`)

### 3.1 `constants.js` (configuração do jogo)

- Define constantes do campo e regras:
  - `PLAYER_RADIUS = 20`.
  - `BALL_RADIUS = 10`.
  - `GOAL_HEIGHT = 200`.
  - `GOAL_WIDTH = 50`.
  - `MATCH_DURATION = 60` (segundos).
  - `MAX_PLAYERS_PER_ROOM = 6`.
  - `CORNER_SIZE = 80` (área dos cantos).
- Exporta tudo para outros módulos.

> Bloco “Constantes” → usado por `gameLoop`, `ball`, `roomManager`, etc.

#### Tipos (conceituais)

- `PLAYER_RADIUS: number`.
- `BALL_RADIUS: number`.
- `GOAL_HEIGHT: number`.
- `GOAL_WIDTH: number`.
- `MATCH_DURATION: number`.
- `MAX_PLAYERS_PER_ROOM: number`.
- `CORNER_SIZE: number`.

---

### 3.2 `roomManager.js` (gerência de salas)

- **Estado global**:
  - `rooms = new Map()` → chave: `roomId` (string), valor: objeto `roomState`.
  - `roomSequence` para gerar nomes automáticos (`room-1`, `room-2`, ...).
- **Estado de uma sala** (`createRoom`):
  - `id`: identificador da sala.
  - `width: 800`, `height: 600`.
  - `players: { [socketId]: { x, y, team, input } }`.
  - `ball: defaultBallState()` → `x,y,radius,speedX,speedY`.
  - `score: { red: 0, blue: 0 }`.
  - `teams: { red: [], blue: [] }` (arrays com `socket.id`).
  - `matchTime: MATCH_DURATION`.
  - `isPlaying: false`.
  - Flags e controles de bola:
    - `isResettingBall`, `nextBallPosition`, `ballResetInProgress`, `lastGoalTime`, `goalCooldown`.
  - Lógica de restart de partida:
    - `waitingForRestart: false`.
    - `playersReady: new Set()` → quem clicou “Jogar novamente”.
- **Funções principais**:
  - `sanitizeRoomId(roomId)`: normaliza string de sala vinda da URL.
  - `generateRoomId()`: `room-1`, `room-2`… garantindo não colidir.
  - `createRoom(roomId?)`: cria sala, registra em `rooms`.
  - `getPlayerCount(room)`: conta jogadores.
  - `getOrCreateAvailableRoom()`: encontra sala com espaço ou cria nova.
  - `allocateRoom(requestedRoomId)`: lógica de alocação:
    - Se `roomId` solicitado:
      - Sanitiza.
      - Usa sala existente ou cria uma com esse nome.
      - Se estiver cheia → retorna `{ error: 'room-full', roomId }`.
    - Se não tiver room pedido:
      - Usa `getOrCreateAvailableRoom()`.
  - `buildGameState(room)`: devolve snapshot do estado pro cliente (largura, altura, players, bola, score, teams, matchTime, isPlaying, roomId).
  - `cleanupRoomIfEmpty(room)`: remove sala do Map se não tiver players.

> No mapa: “Room Manager” com ramos: “criação de sala”, “alocação de jogador”, “limpeza” e “gameState para cliente”.

#### Tipos (conceituais)

- **`RoomId`**: `string`.
- **`PlayerId`**: `string`.
- **`PlayerInput`**:
  ```ts
  { left: boolean; right: boolean; up: boolean; down: boolean }
  ```
- **`Player`**:
  ```ts
  { x: number; y: number; team: 'red' | 'blue'; input: PlayerInput }
  ```
- **`Ball`**:
  ```ts
  { x: number; y: number; radius: number; speedX: number; speedY: number }
  ```
- **`Score`**:
  ```ts
  { red: number; blue: number }
  ```
- **`Teams`**:
  ```ts
  { red: PlayerId[]; blue: PlayerId[] }
  ```
- **`Room`** (simplificado):
  ```ts
  {
    id: RoomId;
    width: number;
    height: number;
    players: Record<PlayerId, Player>;
    ball: Ball;
    score: Score;
    teams: Teams;
    matchTime: number;
    isPlaying: boolean;
    isResettingBall: boolean;
    nextBallPosition: Ball | null;
    ballResetInProgress: boolean;
    lastGoalTime: number;
    goalCooldown: number;
    waitingForRestart: boolean;
    playersReady: Set<PlayerId>;
  }
  ```

#### Assinaturas de funções (conceituais)

- `defaultBallState(): Ball`.
- `sanitizeRoomId(roomId: unknown): string | null` – tenta normalizar um id de sala vindo de string; retorna `null` se inválido.
- `generateRoomId(): RoomId` – gera ids sequenciais únicos (`room-1`, `room-2`, ...).
- `createRoom(roomId?: RoomId): Room` – cria e registra uma nova sala no `Map` global.
- `getPlayerCount(room: Room): number` – retorna quantidade de jogadores na sala.
- `getOrCreateAvailableRoom(): Room` – encontra uma sala com espaço ou cria uma nova.
- `allocateRoom(requestedRoomId?: string | null): { room: Room } | { error: 'room-full'; roomId: RoomId }` – faz a lógica de alocação de salas.
- `buildGameState(room: Room): { width: number; height: number; players: Record<PlayerId, Player>; ball: Ball; score: Score; teams: Teams; matchTime: number; isPlaying: boolean; roomId: RoomId }` – constrói o snapshot enviado ao cliente.
- `cleanupRoomIfEmpty(room: Room | undefined): void` – remove a sala do `Map` se ficar vazia.

---

### 3.3 `match.js` (lógica de partida)

- Importa:
  - `MATCH_DURATION` de `constants`.
  - `buildGameState` de `roomManager`.
  - `resetBall` de `ball`.
- **Funções**:

1. **`balanceTeams(room, io)`**:
   - Compara tamanho dos times `red` e `blue`.
   - Se diferença > 1:
     - Move um jogador do time maior para o menor.
     - Atualiza `player.team` e reposiciona (`x = 100` ou `width - 100`).
     - Emite para o jogador `teamChanged` com:
       - `newTeam`.
       - `gameState` atualizado.
2. **`startNewMatch(room, io)`**:
   - Marca:
     - `isPlaying = true`.
     - `waitingForRestart = false`.
     - `playersReady.clear()`.
     - `score = { red: 0, blue: 0 }`.
     - `matchTime = MATCH_DURATION`.
   - Chama `resetBall(room, io)`.
   - Reposiciona todos os jogadores (lado de cada time).
   - Emite:
     - `cleanPreviousMatch` (limpa UI antiga).
     - `matchStart` (envia `gameState` e `canMove: true`).
3. **`checkRestartConditions(room, io)`**:
   - Chama `balanceTeams`.
   - Verifica se há pelo menos 1 jogador em cada time.
   - Se ambos tem players:
     - Se o jogo não está rodando e não está em `waitingForRestart` → chama `startNewMatch`.
   - Se um time ficou vazio:
     - `isPlaying = false`.
     - Emite `waitingForPlayers` (avisando que precisa de jogadores).
4. **`updateTimer(room, io)`** (rodando 1x/seg em `game-server`):
   - Se `!room.isPlaying` → sai.
   - Decrementa `room.matchTime`.
   - Se chegou a 0:
     - `isPlaying = false`.
     - `waitingForRestart = true`.
     - Calcula vencedor (`red`, `blue` ou `draw`).
     - Teleporta jogadores para `(-100, -100)` (tira do campo).
     - Emite `matchEnd` com `winner` e `gameState`.
   - Emite sempre `timerUpdate` com `matchTime` atual.

> Bloco “Match” com setas para “Timer”, “Balanceamento de times”, “Start/End de partida”.

#### Tipos (conceituais)

- Reutiliza `Room`, `Player`, `Ball`, `Score`, `Teams` de `roomManager`.
- `IO` (Socket.IO server simplificado):
  ```ts
  {
    to(roomId: RoomId): { emit(event: string, payload: any): void };
    sockets: { sockets: Map<PlayerId, ServerSocket> };
  }
  ```

#### Assinaturas de funções

- `balanceTeams(room: Room, io: IO): void` – rebalanceia jogadores entre times se necessário.
- `startNewMatch(room: Room, io: IO): void` – reinicia o estado de partida e notifica clientes.
- `checkRestartConditions(room: Room, io: IO): void` – decide se a partida deve iniciar/reiniciar ou entrar em modo de espera.
- `updateTimer(room: Room, io: IO): void` – decrementa o tempo da partida e emite `timerUpdate`/`matchEnd`.

---

### 3.4 `ball.js` (bola e cantos)

- Importa:
  - `BALL_RADIUS`, `CORNER_SIZE`.
- **`resetBall(room, io)`**:
  - Calcula uma região central (terço central do campo).
  - Seta `room.ball` com:
    - `x, y` aleatórios nesse retângulo.
    - `radius`, `speedX=0`, `speedY=0`.
  - `room.ballResetInProgress = false`.
  - Emite `ballReset` com o novo estado da bola.
- **Controle de cantos**:
  - `getCornerDefinitions(room)`:
    - Define 4 regiões de canto (top-left, top-right, bottom-left, bottom-right) com:
      - `region(ball)`: função que detecta se a bola está naquele canto.
      - Segmento de linha (`p1`, `p2`) representando a diagonal do triângulo do canto.
      - `inside`: ponto usado para saber qual lado é “dentro do campo”.
  - `enforceCornerBoundaries(room)`:
    - Para cada canto:
      - Se bola está naquele canto:
        - Calcula equação da linha, normal, distância assinada até a borda.
        - Se a bola entrou para “fora” além do raio:
          - Move a bola de volta para dentro ao longo da normal.
          - Reflete velocidade na normal (bounce), com amortecimento (`damping = 0.7`).

> No diagrama: “Bola” com subnós “Reset” e “Limite nos cantos (geometria / colisão com triângulos)”.

#### Tipos (conceituais)

- Reutiliza `Ball` e `Room`.
- `CornerDefinition`:
  ```ts
  {
    region: (ball: Ball) => boolean;
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    inside: { x: number; y: number };
  }
  ```

#### Assinaturas de funções

- `resetBall(room: Room, io: IO): void` – reposiciona a bola na área central e notifica a sala.
- `getCornerDefinitions(room: Room): CornerDefinition[]` – gera a definição geométrica dos 4 cantos do campo.
- `enforceCornerBoundaries(room: Room): void` – ajusta posição/velocidade da bola caso ela entre nos triângulos de canto.

---

### 3.5 `gameLoop.js` (física e atualização)

- Importa:
  - `PLAYER_RADIUS`, `BALL_RADIUS`, `GOAL_HEIGHT`, `GOAL_WIDTH`.
  - `enforceCornerBoundaries`, `resetBall`.
- **Função `gameLoop(room, io)`**:
  - Se `!room.isPlaying` → nada acontece.
  - **1) Movimento de jogadores**:
    - Para cada `player`:
      - Calcula deslocamento baseado em `input`:
        - `left/right/up/down` → move a 5 px/frame.
      - Limita o jogador dentro do campo (clamp em X e Y).
  - **2) Colisão jogador–bola**:
    - Para cada player:
      - Calcula distância `dx, dy` entre player e bola.
      - Se `distance < PLAYER_RADIUS + BALL_RADIUS`:
        - Resolve overlap empurrando bola para fora.
        - Calcula `angle` e “velocidade do jogador” a partir do input.
        - Seta `ball.speedX/speedY` como combinação de vetor direção + influência do jogador.
  - **3) Atualiza bola**:
    - `ball.x += speedX`, `ball.y += speedY`.
    - Aplica atrito:
      - `speedX *= 0.89`, `speedY *= 0.89`.
  - **4) Colisão com paredes**:
    - Horizontais:
      - Inverte `speedX`, aplica amortecimento (`* -0.7`) e clamp em X.
    - Verticais:
      - Inverte `speedY`, amortecimento e clamp em Y.
  - **5) Cantos**:
    - Chama `enforceCornerBoundaries(room)` para impedir que a bola cole nos triângulos dos cantos.
  - **6) Gols**:
    - Usa `now = Date.now()` e `room.goalCooldown` + `lastGoalTime` para não registrar gol em loop.
    - Se `ball.x < GOAL_WIDTH` e `ball.y` dentro da altura do gol:
      - Gol do time **azul** (`score.blue++`).
    - Se `ball.x > room.width - GOAL_WIDTH` e dentro da faixa:
      - Gol do time **vermelho** (`score.red++`).
    - Em ambos:
      - Atualiza `lastGoalTime`.
      - `ballResetInProgress = true`.
      - Emite `goalScored` (lado que fez).
      - Agenda `resetBall(room, io)` após `goalCooldown` ms.
  - **7) Fallback – bola perdida**:
    - Se `ball.x < 0` ou `> room.width` e não está resetando:
      - Chama `resetBall`.
  - **8) Envio de estado pros clientes**:
    - Emite `update` para a sala com:
      - `players`, `ball`, `score`, `matchTime`, `isPlaying`, `teams`, `roomId`.

> Bloco “Game Loop (60 FPS)” com ramos: “movimento players”, “colisão”, “gols”, “emit update”.

#### Assinaturas de funções

- `gameLoop(room: Room, io: IO): void` – atualiza física dos jogadores e bola, detecta gols e emite o estado atualizado.

---

### 3.6 `socketHandlers.js` (protocolo multiplayer)

- Importa:
  - `MAX_PLAYERS_PER_ROOM`.
  - `allocateRoom`, `buildGameState`, `cleanupRoomIfEmpty`.
  - `checkRestartConditions`, `startNewMatch`.
- **Função `registerSocketHandlers(io)`**:
  - `io.on('connection', (socket) => { ... })`:
    1. **Alocação de sala**:
       - Lê `requestedRoomId` de `socket.handshake.query.roomId` (vem da URL).
       - Chama `allocateRoom`.
       - Se `error === 'room-full'` → emite `roomFull` e desconecta.
       - Caso contrário:
         - `socket.join(room.id)`.
         - `socket.data.roomId = room.id`.
    2. **Escolha de time**:
       - Compara `room.teams.red.length` e `room.teams.blue.length`.
       - Entra no time com menos jogadores.
       - Adiciona `socket.id` no array do time.
       - Cria `room.players[socket.id]` com posição inicial e estado de input.
    3. **Eventos enviados ao cliente na entrada**:
       - `roomAssigned`:
         - `roomId`, `capacity`, `players` atuais.
       - `init`:
         - `team`, `gameState` (snapshot completo), `canMove` e `roomId`.
    4. **Início de partida**:
       - Chama `checkRestartConditions(room, io)` para ver se já pode começar uma partida.
    5. **Ping/latência**:
       - Cria um `setInterval` pra enviar `ping` a cada 1s:
         - `socket.emit('ping', Date.now())` (front pode medir RTT).
    6. **Evento `requestRestart`**:
       - Só vale se `room.waitingForRestart === true`.
       - Adiciona `socket.id` em `room.playersReady`.
       - Opcionalmente reposiciona o player na posição inicial.
       - Calcula `allPlayers = teams.red + teams.blue`.
       - Se todos em `allPlayers` estão em `playersReady`:
         - Se ambos os times têm jogadores:
           - `startNewMatch(room, io)`.
         - Senão:
           - `io.to(room.id).emit('waitingForOpponent')`.
       - Emite `playerReadyUpdate` com players, `readyCount`, `totalPlayers` e `canMove: false`.
    7. **Evento `input`**:
       - Se `room.players[socket.id]` existe e `room.isPlaying`:
         - Atualiza `player.input` com as teclas recebidas.
    8. **Evento `disconnect`**:
       - Limpa `pingInterval`.
       - Remove o jogador de `room.players` e de `room.teams[team]`.
       - Remove de `playersReady`.
       - Emite `playerDisconnected` com `playerId` e novo `gameState`.
       - Chama `checkRestartConditions` (para pausar ou reiniciar se necessário).
       - Chama `cleanupRoomIfEmpty(room)` se a sala ficar vazia.

> No diagrama: “Socket.IO (server)” com ramificações: “connection”, “input”, “requestRestart”, “disconnect”, “roomFull / init / update”.

#### Tipos (conceituais)

- `ServerSocket` (simplificado):
  ```ts
  {
    id: PlayerId;
    handshake: { query?: { roomId?: string } };
    data: { roomId?: RoomId };
    join(roomId: RoomId): void;
    emit(event: string, payload?: any): void;
    on(event: string, handler: (...args: any[]) => void): void;
    disconnect(close?: boolean): void;
  }
  ```
- `IO` (versão mais detalhada):
  ```ts
  {
    on(event: 'connection', handler: (socket: ServerSocket) => void): void;
    to(roomId: RoomId): { emit(event: string, payload: any): void };
    sockets: { sockets: Map<PlayerId, ServerSocket> };
  }
  ```

#### Assinaturas de funções

- `registerSocketHandlers(io: IO): void` – registra todos os listeners de conexão, input, restart e disconnect.

---

## 4. Front-end – Cliente do Jogo (`public/`)

### 4.1 `index.html`

- Estrutura mínima:
  - `<body>`:
    - Div `#mobile-controls`:
      - Joystick virtual (`#joystick-base` + `#joystick-thumb`).
      - Botão `#action-btn` (“CHUTAR”).
  - Scripts:
    - `/socket.io/socket.io.js` (injetado pelo servidor socket.io).
    - `/game.js` (lógica do cliente).
  - Script inline:
    - Se user agent mobile → mostra `#mobile-controls`.

> Bloco “Front-end HTML” → aponta para “Canvas”, “Controles Mobile” e “game.js”.

---

### 4.2 `style.css` (layout e UI)

- **Body**:
  - Centraliza conteúdo, fundo escuro, `overflow: hidden`, `touch-action: none`.
- **Canvas**:
  - Borda, sombra, centralizado.
- **UI overlay** (`#game-ui`):
  - Container fixo no canto (timer, mensagens, info de sala, botão restart).
- **Elementos-chave**:
  - `#timer`: mostra contagem regressiva (`mm:ss`).
  - `#waiting-screen`: mensagens de “aguardando outro jogador”, “partida terminada”, etc.
  - `#room-info`: mostra `Sala <id> (X/Y)`.
  - `#winner-display`: animação de vencedor “Time RED/BLUE venceu!”.
  - `#restart-button`: botão “Jogar Novamente”.
  - `.player-id`: rótulo com ID dos jogadores acima dos avatares (e destaque para o próprio jogador).
- **Mobile controls**:
  - `#mobile-controls`: barra inferior com joystick e botão de chute.
  - `#joystick-base`, `#joystick-thumb`: círculo base e “thumb” móvel.
  - `#action-btn`: botão vermelho circular, muda cor quando pressionado.

> Em Excalidraw: um agrupamento “UI” com sub-nós “Timer”, “Waiting”, “Room Info”, “Winner”, “Restart”, “Controles Mobile”.

---

### 4.3 `game.js` (cliente do jogo)

Divida mentalmente em 5 grandes blocos:

#### 4.3.1 Configuração e Estado

- `config`: tamanhos do canvas, raio do jogador e bola, tamanho do gol, `cornerSize`.
- `elements`: cria dinamicamente:
  - `canvas`, `ui`, `timer`, `waitingScreen`, `winnerDisplay`, `restartButton`, `roomInfo`.
- `state`:
  - `matchEnded`, `canMove`, `currentTeam`, `roomId`, `roomCapacity`, `roomPlayerCount`.
  - `requestedRoomId`: lido da query `?room=...`.
  - `inputs`: `left/right/up/down/action`.
  - `gameState`: espelho do que vem do server:
    - `players`, `ball`, `score`, `teams`, `matchTime`, `isPlaying`, `width`, `height`.

- Funções auxiliares:
  - `getRequestedRoomId()`: lê `room` da URL.
  - `initCanvas()`: cria canvas, adiciona ao body, devolve `ctx`.
  - `initUI()`: monta `#game-ui` e filhos.
  - `persistRoomInUrl(roomId)`: atualiza URL (`window.history.replaceState`) com `?room=<id>`.
  - `updateRoomInfoDisplay()`: atualiza texto de sala no header.

> Bloco “Estado do Cliente” com ramos: “inputs”, “gameState”, “room info”.

#### Tipos (conceituais – lado cliente)

- `ClientPlayerInput`:
  ```ts
  { left: boolean; right: boolean; up: boolean; down: boolean; action: boolean }
  ```
- `ClientPlayer`:
  ```ts
  { x: number; y: number; team: 'red' | 'blue' | 'spectator'; input: ClientPlayerInput }
  ```
- `ClientGameState`:
  ```ts
  {
    players: Record<string, ClientPlayer>;
    ball: { x: number; y: number; radius: number; speedX: number; speedY: number };
    score: { red: number; blue: number };
    teams: { red: string[]; blue: string[] };
    matchTime: number;
    isPlaying: boolean;
    width: number;
    height: number;
    roomId?: string;
  }
  ```
- `SocketClient` (simplificado, vindo de `socket.io` no browser):
  ```ts
  {
    id: string;
    emit(event: string, payload?: any): void;
    on(event: string, handler: (...args: any[]) => void): void;
  }
  ```

---

#### 4.3.2 Conexão via Socket.IO

- Cria `socket = io(window.location.origin, { query: { roomId: state.requestedRoomId || '' } })`.
- **Handlers (`socketHandlers`)** mapeiam eventos do servidor para ações locais:

Principais eventos:

1. **`init`**:
   - Recebe `team`, `gameState`, `canMove`, `roomId`.
   - Atualiza `state.currentTeam`, `state.gameState`.
   - Atualiza `state.roomId`, `roomPlayerCount`, `URL`.
   - Chama `updateRoomInfoDisplay()` e `updateUI()`.

2. **`roomAssigned`**:
   - Recebe `roomId`, `capacity`, `players`.
   - Atualiza `roomId`, capacidade, contagem de players.

3. **`roomFull`**:
   - Mostra mensagem de sala cheia, bloqueia movimento, dá `alert`.

4. **`update`**:
   - Recebe snapshot do servidor (players, ball, score, matchTime, isPlaying, teams, roomId).
   - Mescla em `state.gameState`.
   - Atualiza `canMove` baseado em:
     - Jogo estar rolando.
     - Haver oponente no outro time.

5. **`matchStart` / `cleanPreviousMatch`**:
   - Limpa texto de vencedor, marca `matchEnded=false`, `canMove=true`.

6. **`matchEnd`**:
   - Marca `isPlaying=false`, `matchEnded=true`.
   - Atualiza players e chama `showWinner(winner)`.
   - Mostra botão “Jogar Novamente”.
   - Atualiza `waitingScreen` para “Partida terminada...”.

7. **`playerReadyUpdate`**:
   - Atualiza lista de players, contagem `readyCount/totalPlayers`.
   - Mostra mensagem apropriada quando já clicou em “Jogar novamente”.

8. **`waitingForPlayers` / `waitingForOpponent`**:
   - Mensagens de espera específicas, desabilitam movimento.

9. **`teamChanged`**:
   - Atualiza `currentTeam`, substitui `gameState`.
   - Reposiciona o próprio player e mostra `alert`.

10. **`playerDisconnected`**:
    - Remove player localmente, atualiza `gameState`, contagem de sala.
    - Se partida terminou e ainda tem 2 times, o cliente pode automaticamente `requestRestart`.

11. **`timerUpdate`**:
    - Atualiza `state.gameState.matchTime`.
    - Chama `updateTimerDisplay()`.

12. **`goalScored` / `ballReset`**:
    - `goalScored`: move temporariamente a bola para fora da tela.
    - `ballReset`: atualiza bola depois do reset no servidor.

- Todos os handlers são registrados em:
  - `Object.entries(socketHandlers).forEach(([event, handler]) => socket.on(event, handler));`

> Em Excalidraw: bloco “Socket.IO Client” com setas para eventos e efeitos na UI/estado.

#### Assinaturas de eventos (lado cliente)

- `socket.on('init', (data: { team: 'red' | 'blue' | 'spectator'; gameState: ClientGameState; canMove: boolean; roomId?: string }) => void): void`.
- `socket.on('roomAssigned', (data: { roomId: string; capacity: number; players: number }) => void): void`.
- `socket.on('roomFull', (data: { roomId: string; capacity: number }) => void): void`.
- `socket.on('update', (newState: Partial<ClientGameState> & { roomId?: string }) => void): void`.
- `socket.on('cleanPreviousMatch', () => void): void`.
- `socket.on('matchStart', (data: { gameState: ClientGameState; canMove: boolean }) => void): void`.
- `socket.on('playerReadyUpdate', (data: { players: ClientGameState['players']; readyCount: number; totalPlayers: number; canMove: boolean }) => void): void`.
- `socket.on('waitingForOpponent', () => void): void`.
- `socket.on('teamChanged', (data: { newTeam: 'red' | 'blue'; gameState: ClientGameState }) => void): void`.
- `socket.on('playerDisconnected', (data: { playerId: string; gameState: ClientGameState }) => void): void`.
- `socket.on('matchEnd', (data: { winner: 'red' | 'blue' | 'draw'; gameState: ClientGameState }) => void): void`.
- `socket.on('timerUpdate', (data: { matchTime: number }) => void): void`.
- `socket.on('waitingForPlayers', (data: { redCount: number; blueCount: number }) => void): void`.
- `socket.on('goalScored', (data: { team: 'red' | 'blue' }) => void): void`.
- `socket.on('ballReset', (data: { ball: ClientGameState['ball'] }) => void): void`.

---

#### 4.3.3 UI e Controles

- **updateUI()**:
  - Decide quando mostrar `waitingScreen` e quando `canMove` é true/false (dependendo de oponente e se partida acabou).
- **updatePlayerIDs()**:
  - Cria divs `.player-id` posicionadas absolutas sobre o canvas (usando `getBoundingClientRect`).
- **showWinner/hideWinner**:
  - Controlam visibilidade e transição de `#winner-display`.
- **updateTimerDisplay()**:
  - Converte `matchTime` em `mm:ss` e atualiza `#timer`.

- **Controles de teclado (desktop)**:
  - `keydown` / `keyup`:
    - Atualizam `state.inputs.left/right/up/down`.
    - Só funcionam se `state.canMove`, não for `spectator`, não estiver `matchEnded`.

- **Controles mobile (joystick)** (`setupControls()`):
  - Lê elementos `#mobile-controls`, `#joystick-*`, `#action-btn`.
  - Mantém `activeTouchId`, `joystickRadius`.
  - Função `updateJoystickPosition(touch)`:
    - Converte posição de toque em vetores normalizados.
    - Aplica “dead zone”.
    - Seta `state.inputs.left/right/up/down`.
  - Eventos:
    - `touchstart/move/end` e também `mousedown/mousemove/up` para testes no desktop.
  - `actionBtn`:
    - Marca `state.inputs.action` (apesar de não haver lógica de chute no servidor ainda).

- **Botão `restartButton`**:
  - `click` → emite `requestRestart`.
  - Esconde botão e mostra mensagem de “Você está pronto! Aguardando adversário...”.

#### Assinaturas de funções principais (cliente)

- `getRequestedRoomId(): string | null` – lê o parâmetro `room` da URL.
- `initCanvas(): CanvasRenderingContext2D` – cria e configura o `<canvas>` e retorna o contexto 2D.
- `initUI(): void` – cria e anexa os elementos de UI ao `document.body`.
- `persistRoomInUrl(roomId: string): void` – atualiza a URL com o id da sala.
- `updateRoomInfoDisplay(): void` – atualiza o texto de informações da sala na UI.
- `updateUI(): void` – controla exibição de telas de espera e flag `canMove`.
- `updatePlayerIDs(): void` – desenha/remover rótulos com os IDs dos jogadores acima dos avatares.
- `showWinner(winner: 'red' | 'blue' | 'draw'): void` – mostra a mensagem de vencedor.
- `hideWinner(): void` – esconde gradualmente a mensagem de vencedor.
- `updateTimerDisplay(): void` – converte `matchTime` em `mm:ss` e atualiza o timer.
- `setupControls(): void` – configura joystick/botão mobile e listeners de mouse/toque.
- `draw(): void` – função de renderização chamada em loop com `requestAnimationFrame`.

---

#### 4.3.4 Loop de Input e Renderização

- **Loop de input (cliente → servidor)**:
  - `setInterval(() => { if (team != spectator && canMove) socket.emit('input', state.inputs); }, 1000/60)`.
  - Ou seja: 60 vezes por segundo manda as teclas para o servidor.

- **Renderização (`draw()`)**:
  - Chamada recursiva com `requestAnimationFrame(draw)`.
  - Passos:
    1. Limpa o canvas.
    2. Desenha gramado:
       - Fundo verde escuro.
       - Listras horizontais alternando cores.
       - Triângulos dos cantos (rebatendo com `config.field.cornerSize`).
    3. Desenha marcações de campo:
       - Retângulo externo, linha central, círculo central, áreas grandes/pequenas, pontos de pênalti, semicírculos, etc.
    4. Gols:
       - Retângulos semi-transparentes vermelhos e azuis onde o gol “conta”.
    5. Jogadores:
       - Círculos coloridos (`team` = `red/blue`).
       - Se `matchEnded && !canMove` → ligeiramente opacos.
       - Destaca o player local com uma borda branca extra.
    6. Bola:
       - Círculo branco na posição `state.gameState.ball`.
       - Não desenha se estiver muito fora da tela.
    7. Placar:
       - Texto `Red: X | Blue: Y` no canto.

  - Ao final chama `updatePlayerIDs()` para manter rótulos de IDs.

---

## 5. Configuração e Infraestrutura

### 5.1 `package.json`

- `main: "server.js"` (apenas um detalhe – na prática o entry real é `game-server.js`).
- `scripts`:
  - `"start": "node server.js"` (poderia ser ajustado para `game-server.js`).
- `dependencies`:
  - `"express"`, `"socket.io"`.

> No diagrama, coloque um lembrete: “script start ainda aponta para server.js – conferir se é usado”.

---

### 5.2 Docker do Aplicativo (`dockerfile` na raiz)

- Base: `FROM node:20-alpine`.
- `WORKDIR /app`.
- Copia `package*.json` e roda:
  - `RUN npm install --only=production`.
- Copia todo o código `COPY . .`.
- `ENV PORT=3000`.
- `EXPOSE 3000`.
- `CMD ["node", "game-server.js"]`.

> Bloco “Docker App” → imagem `multiplayer-soccer-app`.

---

### 5.3 Docker do Nginx (`nginx/Dockerfile` + `nginx/default.conf`)

- `nginx/default.conf`:
  - `server { listen 80; ... }`.
  - `location /`:
    - `proxy_pass http://app:3000;`
    - Configurações para WebSocket:
      - `proxy_http_version 1.1`.
      - `proxy_set_header Upgrade $http_upgrade;`
      - `proxy_set_header Connection "upgrade";`
- `nginx/Dockerfile` (não mostrado aqui, mas normalmente):
  - Base `nginx:alpine`.
  - Copia `default.conf` para `/etc/nginx/conf.d/default.conf`.

> Bloco “Nginx container” → seta para “App container (porta 3000)” e expõe porta 80.

---

### 5.4 `docker-compose.yml`

- **Serviços**:
  - `app`:
    - `image: multiplayer-soccer-app:latest`.
    - `container_name: multiplayer-soccer-app`.
    - `expose: "3000"` (só para a rede interna Docker).
  - `nginx`:
    - `image: multiplayer-soccer-nginx:latest`.
    - `container_name: multiplayer-soccer-nginx`.
    - `ports: "80:80"` → expõe HTTP público.
    - `depends_on: [app]`.

> Em Excalidraw: “docker-compose” como nó que relaciona “app” e “nginx” em rede interna.

---

### 5.5 Guias de Deploy

- `DOCKER.md`:
  - Explica:
    - Construir imagem Docker.
    - Rodar container localmente.
    - Deploy simples em EC2 com Docker.
- `guia_deploy_AWS_Docker_Nginx.md`:
  - Duas abordagens:
    - **Sem Docker**: Node + PM2 + Nginx direto na EC2.
    - **Com Docker**: app containerizado + Nginx container.
  - Também fala de:
    - Enviar apenas a imagem `.tar` para a EC2.
    - Configuração de Nginx como proxy reverso para WebSockets.
    - Security Groups (portas 80/3000).

> Bloco “Deploy” com ramos “Sem Docker (PM2 + Nginx)” e “Com Docker (App + Nginx)”.

---

## 6. Linha do Tempo / Fluxo Geral

Use isto como “linha crescente” para o seu mapa:

1. **Usuário abre** `http://seu-dominio/`:
   - Nginx recebe (porta 80) → proxy para `app:3000`.
   - Express serve `index.html`, `style.css`, `game.js`.
2. **Front-end carrega**:
   - Cria `canvas` + UI.
   - Lê `?room=` da URL, configura `requestedRoomId`.
   - Abre conexão Socket.IO com query `roomId`.
3. **Back-end aceita socket**:
   - `socketHandlers` aloca sala (`allocateRoom`).
   - Atribui time, cria `player` em `room.players`.
   - Envia `roomAssigned`, `init`.
   - Chama `checkRestartConditions` → pode iniciar partida.
4. **Loops do servidor**:
   - `gameLoop` (60 FPS por sala):
     - Move players, resolve colisões, atualiza bola, detecta gols, emite `update`.
   - `updateTimer` (1 Hz por sala):
     - Atualiza cronômetro, dispara `matchEnd` quando zera.
5. **Cliente**:
   - Desenha quadro a quadro (`draw()`).
   - Envia inputs (`input`) 60x/s.
   - Atualiza UI com `update`, `matchStart`, `matchEnd`, `timerUpdate`, etc.
6. **Reinício de partida**:
   - Quando acaba:
     - Servidor marca `waitingForRestart = true`.
     - Cliente mostra botão “Jogar Novamente”.
   - Cada clique envia `requestRestart`.
   - Servidor guarda IDs em `playersReady`.
   - Quando todos da sala estão prontos e há jogadores em ambos os times:
     - `startNewMatch` → zera placar, reposiciona, reseta bola, recomeça o loop.