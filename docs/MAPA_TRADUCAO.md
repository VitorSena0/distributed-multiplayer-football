# MAPA COMPLETO DE TRADUÇÃO

Guia detalhado de todas as variáveis, funções, interfaces e argumentos que precisam ser traduzidos de inglês para português, mostrando as interconexões entre arquivos.

---

## ÍNDICE

### CÓDIGO (TypeScript/JavaScript)
1. [Constants e Variáveis Globais](#constants-e-variáveis-globais)
2. [Interfaces e Types](#interfaces-e-types)
3. [Funções Backend (Servidor)](#funções-backend)
4. [Funções Frontend (Cliente)](#funções-frontend)
5. [Argumentos de Funções](#argumentos-de-funções)
6. [Objetos Socket.IO (Eventos)](#objetos-socketio)
7. [Variáveis de Sessão/DOM](#variáveis-de-sessiondom)
8. [Campos de Interface](#campos-de-interface)
9. [Propriedades de Resposta API](#propriedades-de-resposta-api)

### INFRAESTRUTURA E CONFIGURAÇÃO
10. [Docker e docker-compose](#docker-e-docker-compose)
11. [Nginx (Proxy Reverso)](#nginx-proxy-reverso)
12. [Package.json (Scripts e Dependências)](#packagejson)
13. [TypeScript Config (tsconfig)](#typescript-config)
14. [Variáveis de Ambiente (.env)](#variáveis-de-ambiente)
15. [Scripts Bash](#scripts-bash)

### FRONTEND (HTML/CSS)
16. [HTML (index.html e auth.html)](#htmlindexhtml-e-authhtml)
17. [CSS (style.css e auth-style.css)](#cssstylecss-e-auth-stylecss)

### BANCO DE DADOS
18. [SQL (schema e migration)](#sql-schema-e-migration)

### DOCUMENTAÇÃO
19. [Markdown (README, API, DATABASE, etc.)](#markdown-readmeapidatabaseetc)

### RESUMO E CHECKLIST
20. [Checklist Completo (360°)](#checklist-completo-360)

---

## CONSTANTS E VARIÁVEIS GLOBAIS

### `game/constants.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `PLAYER_RADIUS` | const | `20` | `game/gameLoop.ts`, `public/game.ts` (como `config.player.radius`) |
| `BALL_RADIUS` | const | `10` | `game/gameLoop.ts`, `public/game.ts` (como `config.ball.radius`) |
| `GOAL_HEIGHT` | const | `200` | `game/gameLoop.ts` |
| `GOAL_WIDTH` | const | `50` | `game/gameLoop.ts` |
| `MATCH_DURATION` | const | `60` | `game/match.ts` (`room.matchTime = MATCH_DURATION`) |
| `MAX_PLAYERS_PER_ROOM` | const | `6` | `game/socketHandlers.ts` (verificação de lotação) |
| `CORNER_SIZE` | const | `80` | `game/ball.ts` (cantos) |

### `game-server.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `app` | const | `express()` | Toda parte de configuração HTTP |
| `server` | const | `http.createServer(app)` | Inicialização e `server.listen()` |
| `io` | const | `new SocketIOServer(server, {...})` | `registerSocketHandlers(io)`, loops |
| `PORT` | const | `parseInt(process.env.PORT \|\| '3000', 10)` | `server.listen(PORT, ...)` |

### `public/game.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `config` | const | Objeto com canvas, field, player, ball, goal | Referenciado em funções como `initCanvas()`, `draw()`, `drawField()` |
| `elements` | const | Objeto com elementos DOM | Usado em todas as funções UI |
| `state` | const | Objeto com estado do jogo cliente | Modificado em handlers Socket.IO e controles |
| `ctx` | const | Contexto 2D do canvas | Usado em `draw()` para desenhar tudo |
| `socket` | const | Conexão Socket.IO | Emite eventos e registra handlers |
| `userId` | const | `sessionStorage.getItem('userId')` | Passado em `socket = io()` query |
| `username` | const | `sessionStorage.getItem('username')` | Passado em `socket = io()` query |
| `isGuest` | const | `sessionStorage.getItem('isGuest') === 'true'` | Condicional para passar dados de autenticação |

### `services/authService.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `JWT_SECRET` | const | `process.env.JWT_SECRET \|\| 'seu_secret...'` | `jwt.sign()`, `jwt.verify()` |
| `SALT_ROUNDS` | const | `10` | `bcrypt.hash()` |

### `database/db.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `pool` | const | `new Pool({...})` | Exportado, usado em `services/authService.ts` |

### `routes/authRoutes.ts`

| Original | Tipo | Definição | Usado em |
|----------|------|-----------|----------|
| `router` | const | `Router()` | Montado em `app.use('/api/auth', router)` |

---

## INTERFACES E TYPES

### `public/game.ts`

| Original | Campos | Usado em | Observações |
|----------|--------|----------|-------------|
| `Config` | `canvas: {width, height}`, `field: {cornerSize}`, `player: {radius}`, `ball: {radius}`, `goal: {width, height}` | Instância `const config: Config` | Define tamanhos visuais do cliente |
| `Elements` | `container`, `canvas`, `ui`, `waitingScreen`, `winnerDisplay`, `restartButton`, `roomInfo`, `ping`, `scoreboard`, `hudBottom`, `timerBottom`, `goalscorersPanel`, `redGoalscorers`, `blueGoalscorers` | Instância `const elements: Elements` | Referências a elementos DOM |
| `PlayerInput` | `left`, `right`, `up`, `down`, `action` | `state.inputs: PlayerInput` | Input local do jogador |
| `Ball` | `x`, `y`, `radius`, `speedX`, `speedY`, `lastTouchPlayerId`, `lastTouchTeam` | `state.gameState.ball` | Espelha `game/types.ts` Ball |
| `Score` | `red`, `blue` | `state.gameState.score` | Espelha `game/types.ts` Score |
| `Teams` | `red: string[]`, `blue: string[]` | `state.gameState.teams` | Espelha `game/types.ts` Teams |
| `Player` | `x`, `y`, `team`, `input`, `goals`, `lastGoalTime`, `username` | `state.gameState.players[socketId]` | Espelha `game/types.ts` Player |
| `GameState` | `players`, `ball`, `score`, `teams`, `matchTime`, `isPlaying`, `width`, `height` | `state.gameState: GameState` | Sincronizado do servidor |
| `State` | `matchEnded`, `canMove`, `currentTeam`, `roomId`, `roomCapacity`, `roomPlayerCount`, `requestedRoomId`, `ping`, `inputs`, `gameState`, `isMobile` | Instância `const state: State` | Estado local do cliente |

### `game/types.ts`

| Original | Campos | Usado em | Observações |
|----------|--------|----------|-------------|
| `PlayerInput` | `left`, `right`, `up`, `down` | Argumentos de `socket.emit('input', ...)` | Espelhado em `public/game.ts` |
| `Player` | `x`, `y`, `team`, `input`, `goals`, `lastGoalTime`, `userId`, `username` | `room.players[socketId]` | Definição server-side |
| `Ball` | `x`, `y`, `radius`, `speedX`, `speedY`, `lastTouchPlayerId`, `lastTouchTeam` | `room.ball` | Definição server-side |
| `Score` | `red`, `blue` | `room.score` | Definição server-side |
| `Teams` | `red: string[]`, `blue: string[]` | `room.teams` | Definição server-side |
| `Room` | `id`, `width`, `height`, `players`, `ball`, `score`, `teams`, `matchTime`, `isPlaying`, `isResettingBall`, `nextBallPosition`, `ballResetInProgress`, `lastGoalTime`, `goalCooldown`, `waitingForRestart`, `playersReady` | Usado em `game/roomManager.ts`, `game/gameLoop.ts`, `game/match.ts`, `game/socketHandlers.ts` | Definição server-side |
| `GameState` | `width`, `height`, `players`, `ball`, `score`, `teams`, `matchTime`, `isPlaying`, `roomId` | Retornado por `buildGameState()` | Enviado aos clientes |
| `RoomAllocation` | `room?`, `error?`, `roomId?` | Retorno de `allocateRoom()` | Definição server-side |
| `Point` | `x`, `y` | Usado em `CornerDefinition` | Definição server-side |
| `CornerDefinition` | `region`, `p1`, `p2`, `inside` | Definição de cantos em `ball.ts` | Definição server-side |

### `services/authService.ts`

| Original | Campos | Usado em | Observações |
|----------|--------|----------|-------------|
| `User` | `id`, `username`, `password`, `created_at` | Retornado por queries (não exportado) | Interface interna |
| `UserStats` | `user_id`, `username`, `total_goals_scored`, `total_goals_conceded`, `goals_difference`, `wins`, `losses`, `draws`, `matches_played` | Retornado por `getUserStats()`, `getGlobalRanking()` | Interface de resposta |
| `AuthResponse` | `success`, `message`, `token`, `userId`, `username` | Retorno de `register()`, `login()` | Interface de resposta |

---

## FUNÇÕES BACKEND

### `game-server.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `runGameLoops` | — | `void` | `function runGameLoops(): void { rooms.forEach(...) }` | `setInterval(runGameLoops, 1000/60)` |
| `handleTimers` | — | `void` | `function handleTimers(): void { rooms.forEach(...) }` | `setInterval(handleTimers, 1000)` |

### `game/roomManager.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `defaultBallState` | — | `Ball` | Função que retorna estado inicial da bola | `createRoom()` |
| `sanitizeRoomId` | `roomId: string \| undefined` | `string \| null` | Valida e normaliza IDs de sala | `allocateRoom()` |
| `generateRoomId` | — | `string` | Gera ID único "room-N" | `allocateRoom()`, `createRoom()` |
| `createRoom` | `roomId?: string` | `Room` | Inicializa nova sala com estado padrão | `allocateRoom()`, `getOrCreateAvailableRoom()` |
| `getPlayerCount` | `room: Room` | `number` | Conta jogadores em sala | `allocateRoom()`, `getOrCreateAvailableRoom()` |
| `getOrCreateAvailableRoom` | — | `Room` | Encontra sala disponível ou cria nova | `allocateRoom()` |
| `allocateRoom` | `requestedRoomId?: string` | `RoomAllocation` | Aloca jogador em sala | `game/socketHandlers.ts` connection handler |
| `buildGameState` | `room: Room` | `GameState` | Cria snapshot serializável | Emitido em eventos Socket.IO |
| `cleanupRoomIfEmpty` | `room: Room` | `void` | Remove sala vazia | `game/socketHandlers.ts` disconnect |

### `game/gameLoop.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `gameLoop` | `room: Room, io: SocketIOServer` | `void` | Simula física e emite `update` | `setInterval(runGameLoops, 1000/60)` |

### `game/ball.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `resetBall` | `room: Room, io: SocketIOServer` | `void` | Reposiciona bola e emite `ballReset` | `game/match.ts` `startNewMatch()`, `game/gameLoop.ts` gol |
| `getCornerDefinitions` | `room: Room` | `CornerDefinition[]` | Define geometria dos cantos | `enforceCornerBoundaries()` |
| `enforceCornerBoundaries` | `room: Room` | `void` | Evita ficar preso em cantos | `game/gameLoop.ts` |

### `game/match.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `balanceTeams` | `room: Room, io: SocketIOServer` | `void` | Move jogador entre times | `checkRestartConditions()` |
| `startNewMatch` | `room: Room, io: SocketIOServer` | `void` | Inicia nova partida | `checkRestartConditions()` |
| `checkRestartConditions` | `room: Room, io: SocketIOServer` | `void` | Determina se pode iniciar/reiniciar | `game/socketHandlers.ts` connection/disconnect/requestRestart |
| `updateTimer` | `room: Room, io: SocketIOServer` | `void` | Decrementa timer e emite eventos | `setInterval(handleTimers, 1000)` |
| `saveMatchStats` | `room: Room, winner: 'red' \| 'blue' \| 'draw'` | `Promise<void>` | Persiste estatísticas no BD | `updateTimer()` |

### `game/socketHandlers.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `registerSocketHandlers` | `io: SocketIOServer` | `void` | Registra todos os handlers | `game-server.ts` |
| Dentro de `registerSocketHandlers`: | | | | |
| (anônima) `connection` | `socket: Socket` | — | Handler de nova conexão | `io.on('connection', ...)` |
| (anônima) `requestRestart` | — | — | Handler de reinício | `socket.on('requestRestart', ...)` |
| (anônima) `input` | `input: PlayerInput` | — | Handler de input | `socket.on('input', ...)` |
| (anônima) `disconnect` | — | — | Handler de desconexão | `socket.on('disconnect', ...)` |

### `services/authService.ts` (classe estática)

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `register` | `username: string, password: string` | `Promise<AuthResponse>` | Cria usuário + bcrypt + JWT | `routes/authRoutes.ts` POST /register |
| `login` | `username: string, password: string` | `Promise<AuthResponse>` | Autentica + JWT | `routes/authRoutes.ts` POST /login |
| `verifyToken` | `token: string` | `{ valid, userId?, username? }` | Valida JWT | `routes/authRoutes.ts` POST /verify |
| `getUserStats` | `userId: number` | `Promise<UserStats \| null>` | Query ao BD | `routes/authRoutes.ts` GET /stats/:userId |
| `updateStats` | `userId, goalsScored, goalsConceded, result` | `Promise<boolean>` | Update ao BD | `game/match.ts` `saveMatchStats()` |
| `getGlobalRanking` | `limit: number = 10` | `Promise<UserStats[]>` | Query ranking | `routes/authRoutes.ts` GET /ranking |

### `routes/authRoutes.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| POST `/register` | `req.body: {username, password}` | JSON response | Chama `AuthService.register()` | Chamado do frontend `auth.js` |
| POST `/login` | `req.body: {username, password}` | JSON response | Chama `AuthService.login()` | Chamado do frontend `auth.js` |
| POST `/verify` | `req.body: {token}` | JSON response | Chama `AuthService.verifyToken()` | Chamado do frontend `auth.js` |
| GET `/stats/:userId` | URL param: `userId` | JSON response | Chama `AuthService.getUserStats()` | — |
| GET `/ranking` | Query param: `limit?` | JSON response | Chama `AuthService.getGlobalRanking()` | Chamado do `index.html` script |

---

## FUNÇÕES FRONTEND

### `public/game.ts`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `getRequestedRoomId` | — | `string \| null` | Lê query param `?room=...` | Inicialização |
| `isMobileDevice` | — | `boolean` | Detecta touch | Inicialização |
| `initCanvas` | — | `CanvasRenderingContext2D` | Cria canvas + ctx | Inicialização (atribuído a `ctx`) |
| `resizeCanvasForViewport` | — | `void` | Ajusta tamanho visual | `window.addEventListener('load')`, `window.addEventListener('resize')` |
| `atualizarDisplayPing` | — | `void` | Atualiza texto de ping | `window.addEventListener('load')`, handler `socket.on('ping')` |
| `initUI` | — | `void` | Cria elementos HUD | Inicialização |
| `persistRoomInUrl` | `roomId: string` | `void` | Salva sala em query | Handler `init` e `roomAssigned` |
| `updateRoomInfoDisplay` | — | `void` | Atualiza texto de sala | Vários handlers |
| `updateUI` | — | `void` | Chama `updateRoomInfoDisplay()`, `updateScoreboard()`, `updateGoalscorersPanel()` | Handlers Socket.IO |
| `updateScoreboard` | — | `void` | Exibe placar | `updateUI()` |
| `updatePlayerIDs` | — | `void` | Renderiza `username` acima de jogadores | `draw()` |
| `updateGoalscorersPanel` | — | `void` | Exibe artilheiros por time | `updateUI()`, `draw()` |
| `showWinner` | `winner: 'red' \| 'blue' \| 'draw'` | `void` | Exibe tela de vencedor | Handler `matchEnd` |
| `hideWinner` | — | `void` | Oculta tela de vencedor | Handler `cleanPreviousMatch`, `matchStart` |
| `updateTimerDisplay` | — | `void` | Atualiza texto do timer | Handler `timerUpdate` |
| `setupControls` | — | `void` | Registra joystick + teclado | `window.addEventListener('load')` |
| `draw` | — | `void` | Renderiza campo, jogadores, bola | `requestAnimationFrame(draw)` |

### `public/auth.js`

| Original | Argumentos | Retorno | Definição | Usado em |
|----------|-----------|---------|-----------|----------|
| `showMessage` | `text, type` | `void` | Exibe mensagem de erro/sucesso | Handlers de form |
| `hideMessage` | — | `void` | Oculta mensagem | Handlers de form, click de toggles |
| `saveUserData` | `userId, username, token` | `void` | Salva em `sessionStorage` | Handlers `loginForm`, `registerForm` |
| `redirectToGame` | — | `void` | Navega para `index.html` | Handlers de login/registro sucesso, ou timeout |
| Listener `loginForm.submit` | — | — | POST `/api/auth/login` | Validações de input |
| Listener `registerForm.submit` | — | — | POST `/api/auth/register` | Validações de input + confirm password |
| Listener `guestBtn.click` | — | — | Marca `isGuest` e redireciona | — |
| Listener `window.DOMContentLoaded` | — | — | POST `/api/auth/verify` para auto-login | — |

---

## ARGUMENTOS DE FUNÇÕES

### Funções com múltiplos argumentos (mostrar correspondência)

#### `game/roomManager.ts`

**`allocateRoom(requestedRoomId?: string)`**
- `requestedRoomId` (opcional): ID da sala solicitada
  - Usado em `game/socketHandlers.ts` connection handler: `allocateRoom(socket.handshake.query?.roomId as string | undefined)`

#### `game/gameLoop.ts`

**`gameLoop(room: Room, io: SocketIOServer)`**
- `room`: referência ao estado da sala
- `io`: instância Socket.IO (para emitir eventos)
- Chamada em `setInterval(() => { rooms.forEach(room => gameLoop(room, io)) }, ...)`

#### `game/match.ts`

**`updateTimer(room: Room, io: SocketIOServer)`**
- `room`: referência ao estado da sala
- `io`: instância Socket.IO
- Chamada em `setInterval(() => { rooms.forEach(room => updateTimer(room, io)) }, ...)`

**`saveMatchStats(room: Room, winner: 'red' | 'blue' | 'draw')`**
- `room`: referência ao estado da sala
- `winner`: resultado da partida
- Chamada em `updateTimer()` ao terminar tempo

#### `services/authService.ts`

**`updateStats(userId: number, goalsScored: number, goalsConceded: number, result: 'win' | 'loss' | 'draw')`**
- `userId`: ID do usuário no BD
- `goalsScored`: quantidade de gols marcados
- `goalsConceded`: quantidade de gols sofridos
- `result`: resultado ('win', 'loss', 'draw')
- Chamada em `game/match.ts` `saveMatchStats()` para cada jogador

---

## OBJETOS SOCKET.IO

### Eventos Servidor → Cliente (payloads recebidos no client handler)

Definidos em `public/game.ts` com interfaces próprias:

| Evento | Interface/Payload | Tipo | Usado em |
|--------|-------------------|------|----------|
| `init` | `InitData` | Handler | Inicialização do cliente |
| `roomAssigned` | `RoomAssignedData` | Handler | Confirmação de alocação |
| `roomFull` | `RoomFullData` | Handler | Sala lotada |
| `sessionTaken` | `{ message: string }` | Handler | Sessão duplicada |
| `playerConnected` | `PlayerConnectedData` | Handler | Novo jogador na sala |
| `update` | `UpdateData` | Handler | Frame-by-frame game state |
| `cleanPreviousMatch` | — | Handler | Limpar antes de nova partida |
| `matchStart` | `MatchStartData` | Handler | Partida iniciada |
| `playerReadyUpdate` | `PlayerReadyUpdateData` | Handler | Status de pronto |
| `waitingForOpponent` | — | Handler | Aguardando segundo jogador |
| `teamChanged` | `TeamChangedData` | Handler | Mudança de time (balanceamento) |
| `playerDisconnected` | `PlayerDisconnectedData` | Handler | Saída de jogador |
| `matchEnd` | `MatchEndData` | Handler | Fim da partida |
| `timerUpdate` | `TimerUpdateData` | Handler | Atualização de cronômetro |
| `waitingForPlayers` | `WaitingForPlayersData` | Handler | Falta de jogadores |
| `goalScored` | `GoalScoredData` | Handler | Gol marcado |
| `ballReset` | `BallResetData` | Handler | Bola reposicionada |
| `ping` | `serverTimestamp: number` | Handler | Medição de latência |

### Eventos Cliente → Servidor (emitidos em `game-server.ts`)

| Evento | Payload | Origem | Destino |
|--------|---------|--------|---------|
| `input` | `PlayerInput` | `game/socketHandlers.ts` | Loop em `public/game.ts` |
| `requestRestart` | — | Button click | Handler em `game/socketHandlers.ts` |

---

## VARIÁVEIS DE SESSION/DOM

### `sessionStorage` (client-side, `public/auth.js` e `public/game.ts`)

| Chave | Tipo | Definição | Usado em |
|-------|------|-----------|----------|
| `userId` | string | Lido/escrito em `public/auth.js` | Passado ao Socket.IO em `game.ts` |
| `username` | string | Lido/escrito em `public/auth.js` | Passado ao Socket.IO em `game.ts` |
| `token` | string | Lido/escrito em `public/auth.js` | Para autenticação (não enviado ao Socket.IO) |
| `isGuest` | string (`'true'` ou `'false'`) | Setado em `public/auth.js` | Verificado em `public/game.ts` |

### Elementos DOM (`public/game.ts` interface `Elements`)

| Propriedade | ID/Seletor | Definição | Usado em |
|-------------|-----------|-----------|----------|
| `container` | `'game-container'` | Div principal | Inicialização |
| `canvas` | (direto) | Canvas de renderização | `initCanvas()`, `draw()` |
| `ui` | `'game-ui'` | Container de UI superior | Adiciona filhos |
| `waitingScreen` | `'waiting-screen'` | Mensagem de espera | Vários handlers |
| `winnerDisplay` | `'winner-display'` | Tela de vencedor | `showWinner()`, `hideWinner()` |
| `restartButton` | `'restart-button'` | Botão "Jogar Novamente" | Listener click, show/hide |
| `roomInfo` | `'room-info'` | Informação de sala | `updateRoomInfoDisplay()` |
| `ping` | `'ping'` | Latência | `atualizarDisplayPing()` |
| `scoreboard` | `'scoreboard'` | Placar | `updateScoreboard()` |
| `hudBottom` | `'hud-bottom'` | Container HUD inferior | Adiciona filhos |
| `timerBottom` | `'timer-bottom'` | Cronômetro | `updateTimerDisplay()` |
| `goalscorersPanel` | `'goalscorers-panel'` | Painel de artilheiros | `updateGoalscorersPanel()` |
| `redGoalscorers` | `'red-goalscorers'` | Lista vermelha | `updateGoalscorersPanel()` |
| `blueGoalscorers` | `'blue-goalscorers'` | Lista azul | `updateGoalscorersPanel()` |

---

## CAMPOS DE INTERFACE

### `Player` (definido em `game/types.ts`, espelhado em `public/game.ts`)

| Campo | Tipo | Usado em |
|-------|------|----------|
| `x` | number | Renderização, colisão, movimento |
| `y` | number | Renderização, colisão, movimento |
| `team` | 'red' \| 'blue' | Lógica de times, renderização |
| `input` | `Omit<PlayerInput, 'action'>` | Integração de movimento em `gameLoop()` |
| `goals` | number | Artilheiros, renderização |
| `lastGoalTime` | number | Ordenação de artilheiros |
| `userId` | number (opcional) | Identificação de usuário, salvar stats |
| `username` | string (opcional) | Renderização acima do jogador |

### `Room` (definido em `game/types.ts`)

| Campo | Tipo | Usado em |
|-------|------|----------|
| `id` | string | Identificação única |
| `width`, `height` | number | Limites de campo |
| `players` | `{ [socketId: string]: Player }` | Simulação, renderização |
| `ball` | `Ball` | Simulação, renderização |
| `score` | `Score` | Placar, transmissão |
| `teams` | `Teams` | Balanceamento, logística |
| `matchTime` | number | Timer, transmissão |
| `isPlaying` | boolean | Lógica de partida |
| `waitingForRestart` | boolean | Controle de reinício |
| `playersReady` | `Set<string>` | Coordenação de reinício |

### `Ball` (definido em `game/types.ts`)

| Campo | Tipo | Usado em |
|-------|------|----------|
| `x`, `y` | number | Simulação, renderização |
| `radius` | number | Colisão, renderização |
| `speedX`, `speedY` | number | Simulação física |
| `lastTouchPlayerId` | string \| null | Atribuição de gol |
| `lastTouchTeam` | 'red' \| 'blue' \| null | Cor da bola (renderização) |

---

## PROPRIEDADES DE RESPOSTA API

### `POST /api/auth/register` / `POST /api/auth/login`

Retorna `AuthResponse`:
```json
{
  "success": boolean,
  "message": string,
  "token": string,
  "userId": number,
  "username": string
}
```

**Campos usados em `public/auth.js`:**
- `success`: determina se redireciona ou mostra erro
- `message`: exibe em `showMessage()`
- `userId`, `username`, `token`: salvos em `sessionStorage`

### `POST /api/auth/verify`

Retorna:
```json
{
  "success": boolean,
  "userId": number,
  "username": string
}
```

**Usado em `public/auth.js`:** auto-login se token válido

### `GET /api/auth/stats/:userId`

Retorna `UserStats`:
```json
{
  "success": true,
  "stats": {
    "user_id": number,
    "username": string,
    "total_goals_scored": number,
    "total_goals_conceded": number,
    "goals_difference": number,
    "wins": number,
    "losses": number,
    "draws": number,
    "matches_played": number
  }
}
```

### `GET /api/auth/ranking?limit=10`

Retorna array de `UserStats`:
```json
{
  "success": true,
  "ranking": [
    { "user_id": 1, "username": "...", ... },
    ...
  ]
}
```

**Usado em `index.html` script:** renderiza painel lateral de ranking

---

## GUIA DE CORRESPONDÊNCIA (Tradução Sugerida)

### Tradução de Nomes Principais

| Inglês | Português | Contexto |
|--------|-----------|----------|
| `room` | `sala` | Instância de partida |
| `player` | `jogador` | Instância de jogador |
| `ball` | `bola` | Instância de bola |
| `score` | `placar` | Variável de pontuação |
| `teams` | `times` | Estrutura de times |
| `matchTime` | `tempoPartida` ou `duracaoPartida` | Cronômetro |
| `isPlaying` | `estaJogando` | Flag de estado |
| `input` | `entrada` ou `comando` | Eventos de teclado/joystick |
| `canvas` | `canvas` (manter) ou `tela` | Elemento de renderização |
| `socket` | `socket` (manter) | Conexão WebSocket |
| `config` | `configuracao` | Objeto de parametrização |
| `elements` | `elementos` | Referências DOM |
| `state` | `estado` | Estado local do cliente |
| `ctx` | `ctx` (manter) ou `contexto` | Contexto 2D do Canvas |
| `io` | `io` (manter) | Instância Socket.IO |
| `handler` | `manipulador` ou `tratador` | Função de evento |
| `emit` | `emitir` | Enviar evento |
| `on` | `em` | Registrar listener |
| `ping` | `ping` (manter) ou `latencia` | Medição de latência |
| `winner` | `vencedor` | Resultado da partida |

### Padrão para Nomes de Arquivos/Pastas

**Manter em inglês** ou traduzir com cautela:
- `game/` → `jogo/` (opcional)
- `services/` → `servicos/` (opcional)
- `routes/` → `rotas/` (opcional)
- `database/` → `banco/` (opcional)
- `public/` → `publico/` (opcional, mais comum manter)

---

## CHECKLIST DE TRADUÇÃO

Use este checklist para garantir que todas as dependências sejam atualizadas:

### Passo 1: Constants (`game/constants.ts`)
- [ ] Traduzir nomes das constantes (opcional, recomendado manter em inglês para compatibilidade numérica)

### Passo 2: Types (`game/types.ts`)
- [ ] Traduzir nomes de interfaces/types
- [ ] Traduzir nomes de campos de interface
- [ ] **Atualizar**: `game/roomManager.ts`, `game/gameLoop.ts`, `game/match.ts`, `game/socketHandlers.ts` (imports/uso)
- [ ] **Atualizar**: `public/game.ts` (imports/uso)

### Passo 3: Backend Funções (`game/**/*.ts`)
- [ ] Traduzir nomes de funções exportadas
- [ ] **Atualizar**: `game-server.ts` (imports/chamadas)
- [ ] **Atualizar**: Arquivos que fazem import (cross-file)

### Passo 4: Socket.IO (`game/socketHandlers.ts`)
- [ ] Traduzir nomes de variáveis internas (mas **manter nomes de eventos Socket.IO**)
- [ ] **CUIDADO**: `socket.on('nomeEvento', ...)` no servidor deve corresponder a `socket.emit('nomeEvento', ...)` no cliente

### Passo 5: Frontend (`public/game.ts`)
- [ ] Traduzir nomes de variáveis globais
- [ ] Traduzir nomes de funções
- [ ] Traduzir nomes de interfaces locais
- [ ] **CUIDADO**: Manter correspondência com payload dos eventos Socket.IO

### Passo 6: Serviços (`services/authService.ts`)
- [ ] Traduzir nomes de métodos estáticos
- [ ] Traduzir nomes de interfaces/types
- [ ] **Atualizar**: `routes/authRoutes.ts` (chamadas)

### Passo 7: Rotas (`routes/authRoutes.ts`)
- [ ] Traduzir nomes de variáveis internas
- [ ] **CUIDADO**: Manter paths HTTP (`/api/auth/register`, etc.) iguais

### Passo 8: Frontend Auth (`public/auth.js`)
- [ ] Traduzir nomes de funções
- [ ] Traduzir nomes de variáveis
- [ ] **CUIDADO**: Manter paths HTTP iguais
- [ ] **CUIDADO**: Manter chaves `sessionStorage` iguais (ou atualizar em `game.ts` também)

### Passo 9: HTML (`public/index.html`, `public/auth.html`)
- [ ] Traduzir textos de UI (dentro de HTML)
- [ ] **Manter**: IDs de elementos (`id="game-container"`, etc.) — ou atualizar em `game.ts` e `auth.js`

### Passo 10: CSS (`public/style.css`, `public/auth-style.css`)
- [ ] Traduzir comentários
- [ ] **Manter**: class names e IDs (ou atualizar em JS/HTML)

### Passo 11: Banco de Dados
- [ ] `database/schema.sql`: Traduzir comentários (não mexer em nomes de colunas/tabelas)
- [ ] `database/db.ts`: Traduzir comentários

### Passo 12: Teste de Integração
- [ ] Verificar se nenhum import foi quebrado
- [ ] Verificar se eventos Socket.IO ainda correspondem
- [ ] Compilar TypeScript (`npm run build`)
- [ ] Testar localmente (`npm run dev`)

---

## DIAGRAMA DE DEPENDÊNCIAS CRÍTICAS

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (public/)                        │
├─────────────────────────────────────────────────────────────┤
│ game.ts                                                     │
│  - Interfaces: Config, Elements, PlayerInput, Ball, Score  │
│  - Variáveis globais: config, elements, state, socket      │
│  - Funções: initCanvas, draw, updateUI, setupControls     │
│  → Socket.IO events: 'init', 'update', 'matchStart', etc. │
│  → Sockets enviados: 'input', 'requestRestart'             │
└────────────────────────┬────────────────────────────────────┘
                         │ Socket.IO (porta 3000)
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   SERVIDOR (game-server.ts)                 │
├─────────────────────────────────────────────────────────────┤
│ game-server.ts                                              │
│  - Variáveis: app, server, io, PORT                         │
│  - Funções: runGameLoops(), handleTimers()                  │
│  → Importa: roomManager, gameLoop, match, socketHandlers   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────┴──────┐   ┌────┴──────┐   ┌────┴──────┐
   │ gameLoop  │   │ match.ts  │   │socketHand │
   │ (Physics) │   │ (Timer)   │   │ (Events)  │
   └────┬──────┘   └────┬──────┘   └────┬──────┘
        │                │                │
   ┌────┴──────────────┬─┴────────────────┴──┐
   │                   │                     │
┌──┴──────┐    ┌───────┴────────┐    ┌──────┴──┐
│ ball.ts │    │roomManager.ts  │    │ auth... │
│(Corners)│    │(Room Lifecycle)│    │(Services)
└─────────┘    └────────────────┘    └─────────┘
                         │
                         │ HTTP (/api/auth)
                         │
                    ┌────┴──────────┐
                    │ authRoutes.ts │
                    │  + AuthService│
                    └────┬──────────┘
                         │
                    ┌────┴──────┐
                    │ PostgreSQL │
                    │   (users)  │
                    │ (stats)    │
                    └───────────┘
```

---

## EXEMPLO: TRADUZINDO UMA FUNÇÃO E SUAS DEPENDÊNCIAS

**Original:**
```typescript
// game/roomManager.ts
export function buildGameState(room: Room): GameState {
    return {
        width: room.width,
        height: room.height,
        players: room.players,
        ball: room.ball,
        score: room.score,
        teams: room.teams,
        matchTime: room.matchTime,
        isPlaying: room.isPlaying,
        roomId: room.id,
    };
}
```

**Traduzido:**
```typescript
// game/roomManager.ts
export function construirEstadoDoJogo(sala: Sala): EstadoDoJogo {
    return {
        largura: sala.largura,
        altura: sala.altura,
        jogadores: sala.jogadores,
        bola: sala.bola,
        placar: sala.placar,
        times: sala.times,
        tempoPartida: sala.tempoPartida,
        estaJogando: sala.estaJogando,
        idSala: sala.id,
    };
}
```

**Necessário atualizar em:**
1. `game-server.ts`: não importa diretamente (uses through roomManager module)
2. `game/gameLoop.ts`: `buildGameState` → `construirEstadoDoJogo`
3. `game/match.ts`: `buildGameState` → `construirEstadoDoJogo`
4. `game/socketHandlers.ts`: `buildGameState` → `construirEstadoDoJogo`
5. `public/game.ts`: não usa (recebe via Socket.IO)

---

## DOCKER E DOCKER-COMPOSE

### `dockerfile`

| Original | Tipo | Observações |
|----------|------|-------------|
| `FROM node:20-alpine` | Imagem base | Não traduzir (sintaxe Docker) |
| `WORKDIR /app` | Diretório de trabalho | Não traduzir (sintaxe Docker) |
| `COPY package*.json ./` | Comando | Não traduzir (sintaxe Docker) |
| `RUN npm install` | Comando | Não traduzir |
| `RUN npm run build` | Comando | Não traduzir |
| `RUN npm prune --production` | Comando | Não traduzir |
| `ENV PORT=3000` | Variável de ambiente | Manter |
| `EXPOSE 3000` | Porta | Não traduzir |
| `CMD ["node", "dist/game-server.js"]` | Comando de inicialização | Não traduzir |
| Comentários | `# Imagem base...`, `# Instala dependências...` | **TRADUZIR** |

### `docker-compose.yml`

| Original | Tipo | Definição | Observações |
|----------|------|-----------|-------------|
| `services:` | Seção | Não traduzir |  |
| `postgres:` | Serviço | Nome do serviço - **NÃO TRADUZIR** (usado em `depends_on`, `DB_HOST`) | Usado em: `app.environment.DB_HOST: postgres` |
| `app:` | Serviço | Nome do serviço - **NÃO TRADUZIR** (usado em `depends_on`, nginx proxy) | Usado em: `nginx` proxy `http://app:3000` |
| `nginx:` | Serviço | Nome do serviço - **NÃO TRADUZIR** | Porta 80:80 |
| `environment:` | Seção | Não traduzir |  |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Variáveis | Não traduzir (sintaxe PostgreSQL) | Usadas em `postgres` service |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Variáveis app | Não traduzir (usadas em código) | Referenciadas em `database/db.ts` |
| `JWT_SECRET` | Variável app | Não traduzir (usada em código) | Referenciada em `services/authService.ts` |
| `PORT` | Variável app | Não traduzir | Referenciada em `game-server.ts` |
| `volumes:` | Seção | Não traduzir |  |
| `postgres_data:` | Volume nomeado | **NÃO TRADUZIR** (referência de persistência) | Ponto de montagem do PostgreSQL |
| Comentários | Linhas com `#` | **TRADUZIR** | Se houver |

---

## NGINX (PROXY REVERSO)

### `nginx/default.conf`

| Original | Tipo | Observações |
|----------|------|-------------|
| `server { listen 80; }` | Bloco Nginx | Não traduzir |
| `server_name _;` | Diretiva | Não traduzir (sintaxe Nginx) |
| `location / { }` | Bloco | Não traduzir |
| `proxy_pass http://app:3000;` | Diretiva | **NÃO TRADUZIR** - aponta para serviço `app` do docker-compose |
| `proxy_http_version 1.1;` | Diretiva | Não traduzir |
| `proxy_set_header Upgrade $http_upgrade;` | Diretiva | Não traduzir (necessário para WebSocket) |
| `proxy_set_header Connection "upgrade";` | Diretiva | Não traduzir |
| `proxy_set_header Host $host;` | Diretiva | Não traduzir |
| `proxy_cache_bypass $http_upgrade;` | Diretiva | Não traduzir |
| Comentários | `#` | **TRADUZIR** se houver |

### `nginx/Dockerfile`

| Original | Tipo | Observações |
|----------|------|-------------|
| `FROM nginx:stable-alpine` | Imagem base | Não traduzir |
| `COPY default.conf /etc/nginx/conf.d/default.conf` | Comando | Não traduzir |
| Comentários | `#` | **TRADUZIR** |

---

## PACKAGE.JSON

### Scripts

| Original | Nome do Script | Observações | Usado em |
|----------|---|---|---|
| `"test"` | Chave | Não traduzir (padrão npm) |  |
| `"build"` | Chave | Não traduzir | `npm run build` (build automático) |
| `"build:server"` | Chave | Não traduzir | Compilação do TypeScript servidor |
| `"build:client"` | Chave | Não traduzir | Compilação do TypeScript cliente |
| `"start"` | Chave | Não traduzir | `npm start` |
| `"dev"` | Chave | Não traduzir | `npm run dev` (desenvolvimento) |
| `"tsc && tsc -p tsconfig.client.json"` | Comando | Não traduzir (sintaxe do TypeScript) |  |
| `"ts-node game-server.ts"` | Comando | Não traduzir |  |
| `"node dist/game-server.js"` | Comando | Não traduzir |  |

### Dependências (Não traduzir nomes)

| Pacote | Tipo | Observações |
|--------|------|-------------|
| `express` | dependency | Framework HTTP |
| `socket.io` | dependency | Servidor WebSocket |
| `pg` | dependency | Driver PostgreSQL |
| `bcryptjs` | dependency | Hashing de senhas |
| `jsonwebtoken` | dependency | JWT tokens |
| `typescript` | devDependency | Compilador TS |
| `ts-node` | devDependency | Executor TS |
| `@types/*` | devDependencies | Tipos TypeScript |

### Metadados (Traduzir opcionais)

| Campo | Original | Tradução Sugerida | Observações |
|-------|----------|---|---|
| `name` | `"jogomultplayersoccer"` | Manter (identificador único) |  |
| `version` | `"1.0.0"` | Manter |  |
| `main` | `"dist/game-server.js"` | Não traduzir |  |
| `description` | (vazio) | Pode traduzir se preencher |  |
| `author` | (vazio) | Pode traduzir se preencher |  |
| `license` | `"ISC"` | Manter |  |

---

## TYPESCRIPT CONFIG

### `tsconfig.json` (Servidor)

| Campo | Valor | Observações |
|-------|-------|-------------|
| `"target"` | `"ES2020"` | Não traduzir |
| `"module"` | `"commonjs"` | Não traduzir |
| `"lib"` | `["ES2020"]` | Não traduzir |
| `"outDir"` | `"./dist"` | Não traduzir (diretório de output) |
| `"rootDir"` | `"./"` | Não traduzir |
| `"strict"` | `true` | Não traduzir |
| `"esModuleInterop"` | `true` | Não traduzir |
| `"skipLibCheck"` | `true` | Não traduzir |
| `"forceConsistentCasingInFileNames"` | `true` | Não traduzir |
| `"resolveJsonModule"` | `true` | Não traduzir |
| `"moduleResolution"` | `"node"` | Não traduzir |
| `"types"` | `["node"]` | Não traduzir |
| `"include"` | Paths | Não traduzir |
| `"exclude"` | Paths | Não traduzir |
| Comentários | (se houver) | **TRADUZIR** |

### `tsconfig.client.json` (Cliente)

Mesma abordagem: **não traduzir config, traduzir comentários**.

---

## VARIÁVEIS DE AMBIENTE

### `.env.example` e `docker-compose.yml`

| Variável | Tipo | Valor Padrão | Usado em | Traduzir? |
|----------|------|-------|----------|-----------|
| `PORT` | App | `3000` | `game-server.ts` | Não |
| `DB_HOST` | App | `postgres` | `database/db.ts` | Não |
| `DB_PORT` | App | `5432` | `database/db.ts` | Não |
| `DB_NAME` | App | `football_db` | `database/db.ts` | Não |
| `DB_USER` | App | `postgres` | `database/db.ts` | Não |
| `DB_PASSWORD` | App | `postgres` | `database/db.ts` | Não |
| `JWT_SECRET` | App | `seu_secret_super_seguro_mude_em_producao` | `services/authService.ts` | **Sim** (comentário/documentação) |
| `POSTGRES_USER` | PostgreSQL | `postgres` | docker-compose | Não |
| `POSTGRES_PASSWORD` | PostgreSQL | `postgres` | docker-compose | Não |
| `POSTGRES_DB` | PostgreSQL | `football_db` | docker-compose | Não |

**Formato de .env (não traduzir nomes de variáveis):**
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=football_db
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
JWT_SECRET=seu_secret_super_seguro_mude_em_producao
```

---

## SCRIPTS BASH

### `scripts/init-db.sh`

| Elemento | Original | Tradução | Observações |
|----------|----------|----------|-------------|
| Shebang | `#!/bin/bash` | Não traduzir |  |
| `echo` (linhas 3-4) | `"🗄️  Iniciando PostgreSQL com Docker..."` | **TRADUZIR** | Mensagem para usuário |
| `docker stop` | Comando | Não traduzir |  |
| `docker rm` | Comando | Não traduzir |  |
| `docker run -d` | Comando | Não traduzir |  |
| `-e POSTGRES_USER=postgres` | Variável | Não traduzir |  |
| `-e POSTGRES_PASSWORD=postgres` | Variável | Não traduzir |  |
| `-e POSTGRES_DB=football_db` | Variável | Não traduzir |  |
| `echo "⏳ Aguardando PostgreSQL inicializar..."` | Mensagem | **TRADUZIR** (já em português) |  |
| `sleep 5` | Comando | Não traduzir |  |
| `echo "📝 Criando tabelas..."` | Mensagem | **TRADUZIR** |  |
| `docker exec -i` | Comando | Não traduzir |  |
| `psql -U postgres -d football_db` | Comando | Não traduzir |  |
| `echo "✅ Banco de dados inicializado..."` | Mensagem | **TRADUZIR** |  |
| Textos informativos finais | `"Informações de conexão:"`, etc. | **TRADUZIR** | Mensagens de ajuda |

---

## HTML (index.html e auth.html)

### `public/index.html`

| Elemento | Original | Tipo | Traduzir? |
|----------|----------|------|-----------|
| `<title>Multiplayer Soccer</title>` | Título | **Sim** → `<title>Futebol Multiplayer</title>` |  |
| `id="ranking-panel"` | ID | **Não** (referenciado em CSS/JS) |  |
| `<h3>🏆 TOP 10</h3>` | Texto | **Sim** → `<h3>🏆 TOP 10</h3>` (já em português) |  |
| `id="ranking-list"` | ID | **Não** |  |
| `Carregando...` | Texto | **Sim** |  |
| `id="mobile-controls"` | ID | **Não** |  |
| `id="joystick-container"` | ID | **Não** |  |
| `id="action-btn"` | ID | **Não** |  |
| `CHUTAR` | Botão | **Sim** (já em português) |  |
| Comentário JS | `// Verificar autenticação ANTES...` | **Sim** |  |
| `Não está logado...` | Comentário | **Sim** |  |
| `loadRanking()` | Função | **Não** (definida no script) |  |
| Comentário | `// Carregar ranking` | **Sim** |  |
| `Erro ao carregar ranking:` | Mensagem console | **Sim** |  |
| `Erro ao carregar` | Texto na tela | **Sim** |  |
| `// Atualiza ranking a cada 30 segundos` | Comentário | **Sim** |  |

### `public/auth.html`

| Elemento | Original | Tipo | Traduzir? |
|----------|----------|------|-----------|
| `<title>Login - Multiplayer Soccer</title>` | Título | **Sim** → `<title>Login - Futebol Multiplayer</title>` |  |
| `<h1>⚽ Multiplayer Soccer</h1>` | Heading | **Sim** → `<h1>⚽ Futebol Multiplayer</h1>` |  |
| `<h2>Entrar</h2>` | Heading | **Sim** (já em português) |  |
| `<h2>Criar Conta</h2>` | Heading | **Sim** (já em português) |  |
| `<label>Usuário</label>` | Label | **Sim** (já em português) |  |
| `<label>Senha</label>` | Label | **Sim** (já em português) |  |
| `<button>Entrar</button>` | Botão | **Sim** (já em português) |  |
| `Não tem uma conta?` | Texto | **Sim** (já em português) |  |
| `Registre-se` | Link | **Sim** (já em português) |  |
| `<label>Confirmar Senha</label>` | Label | **Sim** (já em português) |  |
| `Entre 3 e 50 caracteres` | Help text | **Sim** (já em português) |  |
| `Mínimo 6 caracteres` | Help text | **Sim** (já em português) |  |
| `<button>Registrar</button>` | Botão | **Sim** (já em português) |  |
| `Já tem uma conta?` | Texto | **Sim** (já em português) |  |
| `Faça login` | Link | **Sim** (já em português) |  |
| `<button>Jogar como Convidado</button>` | Botão | **Sim** (já em português) |  |
| `*Estatísticas não serão salvas` | Nota | **Sim** (já em português) |  |
| `🔒 Seus dados estão protegidos...` | Mensagem segurança | **Sim** (já em português) |  |

**IDs e Classes HTML: Não traduzir**
- `id="login-form"`, `id="register-form"`, `id="loginForm"`, etc.
- `class="form-container"`, `class="form-group"`, etc.

---

## CSS (style.css e auth-style.css)

### `public/style.css`

| Elemento | Original | Observações |
|----------|----------|-------------|
| Comentários | `/* Estilos gerais */` | **TRADUZIR** |
| Class names | `.ranking-panel`, `.ranking-header` | **Não traduzir** (usadas em HTML/JS) |
| ID selectors | `#ranking-panel`, `#game-container` | **Não traduzir** |
| Propriedades CSS | `color`, `width`, `border-radius` | Não traduzir (sintaxe CSS) |
| Valores | `#1a1a1a`, `rgba(...)`, `flex` | Não traduzir |
| Media queries | `@media (max-width: 768px)` | Não traduzir |
| Pseudo-elements | `::before`, `::after` | Não traduzir |
| Pseudo-classes | `:hover`, `:focus`, `:active` | Não traduzir |

### `public/auth-style.css`

Mesma abordagem: **traduzir comentários, não traduzir seletores/propriedades CSS**.

---

## SQL (SCHEMA E MIGRATION)

### `database/schema.sql`

| Elemento | Original | Traduzir? | Observações |
|----------|----------|-----------|-------------|
| `CREATE TABLE IF NOT EXISTS` | Comando | **Não** (sintaxe SQL) |  |
| `users` | Nome tabela | **Não** (referenciado em código: `pool.query('SELECT ... FROM users')`) |  |
| `player_stats` | Nome tabela | **Não** (referenciado em código) |  |
| `id`, `username`, `password` | Nomes colunas | **Não** (referenciados em queries SQL) |  |
| `total_goals_scored`, `wins`, `losses`, `draws` | Nomes colunas | **Não** |  |
| `SERIAL`, `VARCHAR`, `TIMESTAMP` | Tipos | **Não** |  |
| `PRIMARY KEY`, `UNIQUE`, `NOT NULL` | Constraints | **Não** |  |
| `ON DELETE CASCADE` | Constraint | **Não** |  |
| `CURRENT_TIMESTAMP` | Função | **Não** |  |
| `CREATE INDEX IF NOT EXISTS` | Comando | **Não** |  |
| Comentários | `-- Tabela de usuários` | **TRADUZIR** |  |

**Exemplo: não traduzir**
```sql
-- CORRETO (comentário traduzido, SQL não)
-- Tabela para armazenar usuários registrados
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## MARKDOWN (README, API, DATABASE, etc.)

### `README.md`, `API.md`, `DATABASE.md`, `DEPLOY.md`, `CHANGELOG.md`, `QUICKSTART.md`

**TRADUZIR TUDO**: Toda documentação em Markdown deve ser traduzida (já está em português, mas se houver trechos em inglês, traduzir).

| Arquivo | Prioridade | Observações |
|---------|-----------|-------------|
| `README.md` | 1️⃣ Alta | Primeiro arquivo que usuários veem |
| `QUICKSTART.md` | 1️⃣ Alta | Guia rápido |
| `API.md` | 2️⃣ Média | Referência técnica (endpoints já em português) |
| `DATABASE.md` | 2️⃣ Média | Schema e operações |
| `DEPLOY.md` | 2️⃣ Média | Instruções de deploy |
| `CHANGELOG.md` | 3️⃣ Baixa | Histórico de versões (traduzir se não estiver) |

**NÃO TRADUZIR em Markdown:**
- Nomes de comandos (ex: `npm run build`, `docker-compose up`)
- Paths de arquivo (ex: `src/game/constants.ts`)
- Nomes de variáveis de código (ex: `matchTime`, `playerInput`)
- URLs (ex: `http://localhost:3000`)
- Código inline (ex: `` `const x = 5` ``)

**TRADUZIR em Markdown:**
- Títulos (ex: `# Visão Geral`)
- Parágrafos explicativos
- Comentários dentro de exemplos de código (se em inglês)
- Labels de tabelas
- Descrições de parâmetros

---

## CHECKLIST COMPLETO (360°)

### FASE 1: TIPOS E CONSTANTES (Fundação)
- [ ] `game/constants.ts` — traduzir nomes de constantes (opcional)
- [ ] `game/types.ts` — traduzir todas as interfaces e tipos
- [ ] `services/authService.ts` — traduzir interfaces (`User`, `UserStats`, `AuthResponse`)

### FASE 2: FUNÇÕES BACKEND
- [ ] `game/roomManager.ts` — traduzir funções e variáveis locais
- [ ] `game/gameLoop.ts` — traduzir funções e variáveis locais
- [ ] `game/match.ts` — traduzir funções e variáveis locais
- [ ] `game/ball.ts` — traduzir funções e variáveis locais
- [ ] `game/socketHandlers.ts` — traduzir variáveis/funções internas (manter nomes de eventos!)
- [ ] `game-server.ts` — traduzir variáveis locais, comentários

### FASE 3: SERVIÇOS E ROTAS
- [ ] `services/authService.ts` — traduzir métodos e lógica interna
- [ ] `routes/authRoutes.ts` — traduzir variáveis internas, comentários

### FASE 4: FRONTEND (TypeScript/JavaScript)
- [ ] `public/game.ts` — traduzir tudo (variáveis, funções, interfaces, comentários)
- [ ] `public/auth.js` — traduzir tudo (funções, variáveis, comentários)

### FASE 5: FRONTEND (HTML/CSS)
- [ ] `public/index.html` — traduzir textos, títulos (manter IDs)
- [ ] `public/auth.html` — traduzir textos, títulos (manter IDs)
- [ ] `public/style.css` — traduzir comentários (manter seletores)
- [ ] `public/auth-style.css` — traduzir comentários (manter seletores)

### FASE 6: INFRAESTRUTURA
- [ ] `dockerfile` — traduzir comentários
- [ ] `nginx/Dockerfile` — traduzir comentários
- [ ] `nginx/default.conf` — traduzir comentários
- [ ] `docker-compose.yml` — traduzir comentários (manter nomes de serviços e variáveis)
- [ ] `tsconfig.json` — traduzir comentários
- [ ] `tsconfig.client.json` — traduzir comentários

### FASE 7: SCRIPTS E CONFIGURAÇÃO
- [ ] `scripts/init-db.sh` — traduzir mensagens (echo)
- [ ] `package.json` — traduzir description/author (se preencher), manter scripts
- [ ] `.env.example` — traduzir comentários, manter nomes de variáveis

### FASE 8: BANCO DE DADOS
- [ ] `database/schema.sql` — traduzir comentários, **MANTER nomes de tabelas/colunas**
- [ ] `database/db.ts` — traduzir comentários

### FASE 9: DOCUMENTAÇÃO
- [ ] `README.md` — traduzir tudo
- [ ] `QUICKSTART.md` — traduzir tudo
- [ ] `API.md` — traduzir descrições (manter endpoints)
- [ ] `DATABASE.md` — traduzir descrições (manter nomes de colunas)
- [ ] `DEPLOY.md` — traduzir tudo
- [ ] `CHANGELOG.md` — traduzir tudo

### FASE 10: TESTES
- [ ] Compilar TypeScript: `npm run build`
- [ ] Verificar erros de import
- [ ] Rodar localmente: `npm run dev`
- [ ] Testar Socket.IO (eventos devem corresponder)
- [ ] Testar REST API (endpoints devem corresponder)
- [ ] Testar BD (schema deve funcionar)
- [ ] Testar Docker: `docker-compose up -d`

---

## DIAGRAMA COMPLETO DE DEPENDÊNCIAS (360°)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USUÁRIO NA WEB                                 │
│                     http://localhost ou https://...                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTP/HTTPS (Porta 80)
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                     NGINX (Proxy Reverso)                               │
│  Arquivo: nginx/default.conf                                            │
│  - Ouve na porta 80                                                     │
│  - Proxy para app:3000 (Docker service name)                            │
│  - Suporta WebSocket (Upgrade headers)                                  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTP/WebSocket (porta 3000 internamente)
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
   ┌────┴──────────────────┐          ┌──────────────┴────┐
   │  Express + Socket.IO  │          │  Static Files     │
   │   (game-server.ts)    │          │  (public/*)       │
   ├───────────────────────┤          ├──────────────────┤
   │ HTTP Routes:          │          │ - index.html     │
   │ /api/auth/register    │          │ - auth.html      │
   │ /api/auth/login       │          │ - game.ts (dist) │
   │ /api/auth/verify      │          │ - auth.js        │
   │ /api/auth/stats       │          │ - *.css          │
   │ /api/auth/ranking     │          │ - style.css      │
   │                       │          │ - auth-style.css │
   │ Socket.IO Events:     │          └──────────────────┘
   │ - init, update        │
   │ - matchStart, matchEnd│
   │ - goalScored, etc     │
   └────┬──────────────────┘
        │
        ├─────────────────────┬──────────────────────┐
        │                     │                      │
   ┌────┴────────┐    ┌──────┴────────┐    ┌───────┴─────┐
   │ gameLoop.ts │    │ match.ts      │    │socket       │
   │ (física)    │    │ (timer, stats)│    │Handlers.ts  │
   │             │    │               │    │(eventos)    │
   └────┬────────┘    └──────┬────────┘    └───────┬─────┘
        │                    │                      │
   ┌────┴────────────────────┴──────────────────────┴────┐
   │         roomManager.ts                               │
   │    (criação/gerenciamento de salas)                  │
   │         + ball.ts (física da bola)                  │
   └────┬──────────────────────────────────────────────────┘
        │
   ┌────┴──────────────────────────────────────────────────┐
   │          services/authService.ts                      │
   │  (autenticação, hash, JWT, queries ao BD)            │
   └────┬──────────────────────────────────────────────────┘
        │
   ┌────┴──────────────────────────────────────────────────┐
   │      database/db.ts (pg.Pool)                         │
   │      Conecta ao PostgreSQL via variáveis ENV          │
   │      DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS    │
   └────┬──────────────────────────────────────────────────┘
        │
   ┌────┴──────────────────────────────────────────────────┐
   │         PostgreSQL 17 (Serviço Docker)                │
   ├─────────────────────────────────────────────────────┤
   │ database/schema.sql                                  │
   │  - CREATE TABLE users                               │
   │  - CREATE TABLE player_stats                        │
   │  - CREATE INDEX idx_ranking                         │
   │                                                      │
   │ Volume persistente: postgres_data (docker-compose)  │
   └──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    AMBIENTE DOCKER (docker-compose.yml)                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Services:                                                              │
│  - postgres (imagem: postgres:17)                                       │
│  - app (imagem: multiplayer-soccer-app:latest → Dockerfile)             │
│  - nginx (imagem: multiplayer-soccer-nginx:latest → nginx/Dockerfile)  │
│                                                                          │
│  Networks: Padrão (docker cria automaticamente)                         │
│  Volumes: postgres_data (persistência de BD)                            │
│  Portas Expostas: 80 (nginx)                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              FLUXO DE COMPILAÇÃO (TypeScript → JavaScript)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Servidor:                                                              │
│  game-server.ts ─────────┐                                             │
│  game/**/*.ts ────────────┼─→ (tsc) ──→ dist/ (JavaScript)             │
│  services/**/*.ts ────────┤                                             │
│  routes/**/*.ts ──────────┘                                             │
│  database/**/*.ts ────────┐                                             │
│                           ├─→ (tsc -p tsconfig.json)                    │
│  tsconfig.json ───────────┘                                             │
│                                                                          │
│  Cliente:                                                               │
│  public/game.ts ───────────────┐                                        │
│  tsconfig.client.json ─────────┼─→ (tsc -p tsconfig.client.json)       │
│                                ├─→ public/dist/game.js                 │
│  public/auth.html/auth.js ─────┘ (não compilado, usado direto)         │
│                                                                          │
│  Scripts:                                                               │
│  npm run build ──→ executa ambos (servidor + cliente)                   │
│  npm run dev ────→ ts-node game-server.ts (sem compilação prévia)       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

Este documento agora cobre **360°** do projeto: código TypeScript/JavaScript, infraestrutura Docker, configurações, HTML/CSS, scripts bash, banco de dados e documentação. Use em conjunto com o mapa anterior para uma tradução segura e completa! 🚀

Este documento serve como referência completa. Use-o para:
1. **Entender** quais variáveis/funções são interconectadas
2. **Planejar** a ordem de tradução (FASE 1 → FASE 10)
3. **Verificar** todas as dependências antes de mudar um nome
4. **Teste** após cada fase para garantir que não houve quebra de importações

Boa sorte com a tradução! 🚀
