# LIVRO TÉCNICO — Multiplayer Soccer

Guia técnico completo e progressivo (macro → micro) para entender a arquitetura, o funcionamento interno, e como evoluir o projeto com segurança.

Sumário
- Visão Geral
- Arquitetura Geral
- Frontend
- Backend
- Comunicação em Tempo Real
- Rotas e Serviços (REST)
- Banco de Dados
- Infraestrutura e Deploy
- Fluxo Ponta a Ponta
- Detalhamento por Arquivos e Pastas
- Pontos de Extensão e Evolução
- Apêndices (Eventos Socket.IO, Variáveis de Ambiente, Build/Run)

---

## Visão Geral

Problema: oferecer um jogo 2D de futebol multiplayer em tempo real na web, com servidor autoritativo, autenticação de usuários e ranking global persistente. O servidor mantém o “estado oficial” da partida (posições de jogadores/bola, placar, cronômetro) e os clientes atuam como terminais de input/visualização.

Componentes principais:
- Frontend (web): renderização via Canvas e UI (HUD, ranking, telas), captura de input e integração Socket.IO.
- Backend (Node.js/Express + Socket.IO): API REST mínima para autenticação/estatísticas e servidor de tempo real com o motor do jogo.
- Banco de dados (PostgreSQL): contas de usuários e estatísticas agregadas (usadas em ranking global).
- Infraestrutura (Docker + Nginx + docker-compose): orquestração local/produção e proxy reverso para WebSocket.

Comunicação:
- HTTP/REST: autenticação (registro/login/verify), estatísticas e ranking.
- Socket.IO: canal em tempo real para inputs e snapshots de estado do jogo, com eventos específicos de partida.

---

## Arquitetura Geral

Separação de responsabilidades:
- Frontend
  - UI e renderização do jogo (Canvas/DOM).
  - Sessão (JWT em `sessionStorage`) e modo convidado.
  - Integração Socket.IO (envio de inputs e recepção de snapshots/eventos).
- Backend
  - HTTP: serve estáticos (pasta `public/`) e expõe `/api/auth`.
  - Socket.IO: gerencia conexões, salas, times e eventos do jogo.
  - Motor do jogo: loop de física (60 FPS) e timer de partida (1 Hz).
- Dados
  - PostgreSQL: `users` e `player_stats`, com índices para ranking/performance.
- Infra
  - Nginx proxy (porta 80) → app Node (porta 3000); `docker-compose` coordena tudo.

Fluxo de dados (alto nível):
1) Cliente autentica (ou escolhe convidado) via REST e salva sessão em `sessionStorage`.
2) Cliente abre o jogo e conecta no Socket.IO com `userId`/`username` (ou convidado).
3) Servidor aloca sala/time, envia estado inicial e emite atualizações a cada frame.
4) Cliente envia inputs; servidor aplica física, atualiza placar/timer e emite eventos (gols, fim, reinício).

---

## Frontend

Responsabilidades:
- Renderizar campo, gols, jogadores (com `username`), bola, HUD (placar/timer) e painel de ranking.
- Capturar inputs (WASD/setas/joystick mobile) e enviar ao servidor via Socket.IO.
- Gerenciar sessão (JWT/guest) e roteamento entre `auth.html` e `index.html`.

Arquivos principais:
- `public/index.html`
  - Verifica sessão antes de carregar o jogo. Se não autenticado e não convidado → redireciona para `auth.html`.
  - Carrega `socket.io.js` e o bundle do jogo `public/dist/game.js` (compilado de `public/game.ts`).
  - Consulta ranking com `GET /api/auth/ranking?limit=10` e atualiza a cada 30s.
- `public/auth.html`, `public/auth.js`, `public/auth-style.css`
  - Registro (`POST /api/auth/register`), login (`POST /api/auth/login`) e verificação de token (`POST /api/auth/verify`).
  - “Jogar como Convidado” salva `isGuest=true` e navega para o jogo.
- `public/game.ts`
  - Constrói a UI do jogo (Canvas + HUD) e mantém o estado local espelhando o `GameState` do servidor.
  - Conecta com Socket.IO passando `userId`/`username` (ou convidado) na query do handshake.
  - Emite `input` continuamente (alterações de teclas/joystick).
  - Recebe eventos do servidor: `init`, `update`, `timerUpdate`, `goalScored`, `ballReset`, `matchStart`, `matchEnd`, `waitingForPlayers`, `waitingForOpponent`, `cleanPreviousMatch`, `teamChanged`, `playerReadyUpdate`, `playerDisconnected`, `sessionTaken`.
  - Renderiza nomes de jogadores, painel de goleadores por time, destaques visuais (ex.: seu jogador).

Build do cliente:
- `tsconfig.client.json` compila `public/game.ts` → `public/dist/game.js`.
- `npm run build:client` é chamado por `npm run build` (root), compilando servidor e cliente.

---

## Backend

Entrada do servidor: `game-server.ts`
- Express: `express.json`, `express.urlencoded`, estáticos de `public/`.
- Rotas: monta `/api/auth` via `routes/authRoutes.ts`.
- Socket.IO: instancia e registra handlers com `registerSocketHandlers(io)`.
- Agendadores:
  - `runGameLoops` a cada `1000/60` ms (60 FPS) → `game/gameLoop.ts`.
  - `handleTimers` a cada `1000` ms → `game/match.ts` (`updateTimer`).

Módulos centrais do jogo:
- `game/constants.ts`: parâmetros físicos (raios/medidas) e de sessão (duração, capacidade, cantos).
- `game/types.ts`: contratos de dados — `Player`, `Ball`, `Room`, `GameState`, etc.
- `game/roomManager.ts`
  - `rooms` (Map) com todas as salas.
  - `allocateRoom(requestedRoomId?)`: normaliza/cria ID, verifica lotação.
  - `buildGameState(room)`: snapshot serializável para clientes.
  - `createRoom` (estado inicial) e `cleanupRoomIfEmpty` (GC de salas vazias).
- `game/gameLoop.ts`
  - Integra inputs e movimenta jogadores, clamp nas bordas.
  - Colisão jogador–bola com empurrão e soma de velocidade do jogador.
  - Atualiza bola (integração + atrito); rebate em paredes; limita cantos via `ball.ts`.
  - Detecta gols por faixas laterais; diferencia gol contra (não credita ao jogador).
  - Emite `goalScored` e agenda `resetBall` com cooldown; emite `update` (snapshot completo).
- `game/ball.ts`
  - `resetBall`: reposiciona e reseta velocidade/flags; notifica clientes com `ballReset`.
  - `enforceCornerBoundaries`: evita “prender no canto” (geometria de projeção + reflexão amortecida).
- `game/match.ts`
  - `startNewMatch`: reseta placar/tempo/posições/gols, emite `cleanPreviousMatch` e `matchStart`.
  - `checkRestartConditions`: balanceia times e gerencia `playersReady` para reinício.
  - `updateTimer`: decrementa tempo; ao zerar → define vencedor, salva estatísticas (usuários registrados) com `AuthService.updateStats`, reposiciona jogadores fora do campo e emite `matchEnd`. Emite `timerUpdate` por tick.
- `game/socketHandlers.ts`
  - Sessão única: `loggedInUsers (Map<userId, socketId>)`; se o mesmo `userId` conecta, emite `sessionTaken` e desconecta a sessão anterior.
  - Na conexão: lê `roomId?`, `userId?`, `username?`, aloca sala, define time balanceado, cria `Player` (convidados → “Convidado N”). Emite `roomAssigned` e `init`.
  - Eventos cliente: `requestRestart` (marca pronto e coordena reinício), `input` (atualiza `player.input` se `isPlaying`).
  - `disconnect`: limpa ping, remove sessão única, retira jogador de times/estado, emite `playerDisconnected`, reavalia reinício e limpa sala vazia.

Rotas e serviços:
- `routes/authRoutes.ts`
  - `POST /register`, `POST /login`, `POST /verify`, `GET /stats/:userId`, `GET /ranking?limit=N`.
- `services/authService.ts`
  - `register` (bcrypt + criação de `player_stats` + JWT), `login` (bcrypt + JWT), `verifyToken` (JWT),
    `getUserStats`, `getGlobalRanking`, `updateStats` (aplica deltas e `matches_played + 1`).

---

## Comunicação em Tempo Real

Conexão Socket.IO:
- Cliente conecta com query `{ userId, username, roomId? }`.
- Servidor valida sessão única por `userId` (se houver) e desaloca sessão anterior.

Eventos (exemplos):
- Servidor → Cliente: `roomAssigned`, `init`, `update`, `timerUpdate`, `goalScored`, `ballReset`, `matchStart`, `matchEnd`, `waitingForPlayers`, `waitingForOpponent`, `playerDisconnected`, `cleanPreviousMatch`, `teamChanged`, `playerReadyUpdate`, `sessionTaken`, `roomFull`.
- Cliente → Servidor: `input`, `requestRestart`.

Sincronização:
- Autoridade do servidor: apenas o servidor simula física/placar/timer. O cliente renderiza e envia comandos.
- Snapshots frequentes mantêm consistência; o cliente deve sempre confiar no estado do servidor.

---

## Rotas e Serviços (REST)

Base: `/api/auth`
- `POST /register`: cria usuário (validações básicas), cria linha em `player_stats`, retorna JWT + `userId`/`username`.
- `POST /login`: autentica (bcrypt.compare), retorna JWT + `userId`/`username`.
- `POST /verify`: valida token JWT e retorna `userId`/`username` se válido.
- `GET /stats/:userId`: retorna estatísticas do usuário.
- `GET /ranking?limit=N`: retorna ranking global (ordenado por vitórias, saldo de gols e gols marcados).

Serviço (`AuthService`): encapsula acesso ao Postgres (`pg.Pool`) e regras de autenticação/estatísticas.

---

## Banco de Dados

Conexão: `database/db.ts` com `pg.Pool` e variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

Schema (ver `database/schema.sql` e `DATABASE.md`):
- `users(id, username UNIQUE, password bcrypt, created_at)`
- `player_stats(user_id UNIQUE FK → users.id, total_goals_scored, total_goals_conceded, goals_difference, wins, losses, draws, matches_played, updated_at)`

Índices:
- `idx_user_id` em `player_stats(user_id)`
- `idx_username` em `users(username)`
- `idx_ranking` composto `(wins DESC, goals_difference DESC, total_goals_scored DESC)`

Regras:
- Estatísticas são atualizadas apenas quando a partida termina (`matchTime` chega a 0).
- Convidados não possuem `user_id`; não salvam estatísticas.

---

## Infraestrutura e Deploy

docker-compose (`docker-compose.yml`):
- Serviços:
  - `postgres`: Postgres 17 com volume persistente e execução automática do schema.
  - `app`: imagem `multiplayer-soccer-app` (ver `dockerfile`), configurada com `DB_*`, `JWT_SECRET` e `PORT=3000`.
  - `nginx`: imagem `multiplayer-soccer-nginx` (ver `nginx/Dockerfile`), publica `80:80` e faz proxy (incluindo upgrade WebSocket) para `app:3000`.

Nginx (`nginx/default.conf`):
- Proxy reverso com `Upgrade`/`Connection` para suportar WebSocket/Socket.IO.

Dockerfile do app (`dockerfile`):
- Instala dependências, compila TypeScript (`npm run build`), remove devDeps (`npm prune --production`) e inicia `dist/game-server.js`.

Deploy: ver `DEPLOY.md` (build das imagens, variáveis sensíveis, start, logs, backup e troubleshooting).

---

## Fluxo Ponta a Ponta

1) Acesso e sessão
- Usuário abre `http://host`. Se sem `token` e não convidado → `auth.html`.

2) Autenticação
- Registro/Login via REST. Ao sucesso, cliente salva `userId`, `username`, `token` em `sessionStorage`.

3) Entrada no jogo
- `index.html` carrega `public/dist/game.js`; cliente conecta ao Socket.IO com `query` de sessão.
- Servidor aloca sala/time e envia `init` (estado inicial + `canMove`).

4) Partida
- Cliente envia `input`; servidor simula física, detecta gols, atualiza estado e emite `update` e `timerUpdate`.

5) Fim e estatísticas
- Ao `matchTime <= 0`: `matchEnd`, servidor persiste estatísticas para usuários registrados e aguarda reinício coordenado.

---

## Detalhamento por Arquivos e Pastas

Raiz
- `game-server.ts`: bootstrap Express/Socket.IO, montagem de rotas e intervalos de loops.
- `package.json`: scripts (`dev`, `build`, `start`) e dependências (express, socket.io, pg, bcryptjs, jsonwebtoken, typescript, ts-node, tipos).
- `tsconfig.json` (servidor) e `tsconfig.client.json` (cliente).
- Documentação: `README.md`, `QUICKSTART.md`, `API.md`, `DATABASE.md`, `DEPLOY.md`, `CHANGELOG.md`.
- Infra: `docker-compose.yml`, `dockerfile`, `nginx/`.

`game/`
- `constants.ts`: parâmetros do jogo.
- `types.ts`: contratos de dados.
- `roomManager.ts`: gerenciamento de salas, snapshots e ciclo de vida.
- `gameLoop.ts`: física e regras de gol; broadcasting de `update`.
- `ball.ts`: reset da bola e restrições em cantos.
- `match.ts`: início/fim de partida, timer, balanceamento e persistência.
- `socketHandlers.ts`: eventos Socket.IO e sessão única.

`routes/`
- `authRoutes.ts`: endpoints REST de autenticação/estatísticas.

`services/`
- `authService.ts`: acesso ao Postgres para usuários/estatísticas.

`database/`
- `db.ts`: `pg.Pool` e eventos de conexão.
- `schema.sql`: DDL inicial.

`public/`
- `index.html`: bootstrap do cliente, verificação de sessão e ranking.
- `game.ts`: cliente do jogo (render, inputs, sockets) — compilado em `public/dist/game.js`.
- `style.css`: estilos de UI/jogo + ranking.
- `auth.html`, `auth.js`, `auth-style.css`: fluxo de autenticação.

---

## Pontos de Extensão e Evolução

Rede e experiência do jogador
- Interpolação/lerp no cliente para suavizar movimento; client-side prediction + reconciliation (com cautela).
- Mensagens delta e/ou compressão (ex.: `socket.io-msgpack-parser`).

Escalabilidade
- Adaptador de cluster para Socket.IO (`socket.io-redis`) para múltiplas instâncias do servidor.
- Estratégia de shard por sala e balanceamento de carga (Nginx/ELB).

Persistência e telemetria
- Histórico de partidas e eventos com replays; auditoria de ações.
- Métricas (Prometheus), tracing distribuído e logs estruturados (pino/winston).

Segurança
- Gerenciar segredos (JWT/DB) via secret manager; rotação de chaves.
- Rate limiting e validação rígida dos payloads `input`.

Gameplay
- Mecânica de chute (força/direção), power-ups e novos modos.
- Ajustes dinâmicos de `MATCH_DURATION` e `MAX_PLAYERS_PER_ROOM` por sala.

Testes e qualidade
- Testes unitários para `gameLoop` (gol/colisão), `match` (timer e reinício), `authService` (queries/erros) e contratos de eventos.

---

## Apêndice A — Tabela de Eventos Socket.IO (resumo)

Servidor → Cliente
- `roomAssigned`: `{ roomId, capacity, players }`
- `init`: `{ team, gameState, canMove, roomId }`
- `update`: `{ players, ball, score, matchTime, isPlaying, teams }`
- `timerUpdate`: `{ matchTime }`
- `goalScored`: `{ team: 'red'|'blue', goalScoredBy: string|null }`
- `ballReset`: `{ ball }`
- `matchStart`: `{ gameState, canMove }`
- `matchEnd`: `{ winner: 'red'|'blue'|'draw', gameState }`
- `waitingForPlayers`: `{ redCount, blueCount }`
- `waitingForOpponent`: `{}`
- `playerDisconnected`: `{ playerId, gameState }`
- `cleanPreviousMatch`: `{}`
- `teamChanged`: `{ newTeam, gameState }`
- `playerReadyUpdate`: `{ players, readyCount, totalPlayers, canMove }`
- `sessionTaken`: `{ message }`
- `roomFull`: `{ roomId, capacity }`

Cliente → Servidor
- `input`: `{ left, right, up, down }`
- `requestRestart`: `{}`

---

## Apêndice B — Variáveis de Ambiente

Aplicação
- `PORT` (padrão: `3000`)
- `JWT_SECRET` (obrigatório em produção; troque o valor default do repositório)

Banco de dados
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

docker-compose
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` para o serviço `postgres`.

---

## Apêndice C — Build e Execução

Local
```
npm install

# Banco local via Docker
./scripts/init-db.sh

# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

Docker
```
# Build imagens
docker build -t multiplayer-soccer-app:latest .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# Subir stack
docker-compose up -d

# Logs
docker-compose logs -f
```

---

Este guia descreve como as peças se conectam, por que as escolhas tecnológicas fazem sentido e como evoluir o sistema com segurança e consciência arquitetural. Use-o como referência ao navegar pelo código e antes de realizar mudanças estruturais.
