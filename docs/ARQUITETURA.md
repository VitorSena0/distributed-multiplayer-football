# Arquitetura da Aplicação

Este documento descreve a arquitetura técnica do projeto Multiplayer Soccer.

## Visão Geral

A aplicação utiliza uma **arquitetura híbrida** combinando:

- **API REST** (HTTP) - Para autenticação e operações CRUD
- **WebSocket** (Socket.IO) - Para gameplay em tempo real

---

## API REST

### Tecnologias
- **Express.js** - Framework web Node.js
- **JWT** - Autenticação via tokens
- **bcrypt** - Hash de senhas

### Endpoints Disponíveis

#### Autenticação

**POST** `/api/auth/register`
- Criar nova conta de usuário
- Body: `{ username, password }`
- Retorna: `{ success, token, userId, username }`

**POST** `/api/auth/login`
- Login de usuário existente
- Body: `{ username, password }`
- Retorna: `{ success, token, userId, username }`

**POST** `/api/auth/verify`
- Verificar validade de token JWT
- Body: `{ token }`
- Retorna: `{ success, userId, username }`

#### Estatísticas

**GET** `/api/auth/stats/:userId`
- Buscar estatísticas de um jogador
- Params: `userId` (número)
- Retorna: `{ success, stats }`

**GET** `/api/auth/ranking?limit=10`
- Buscar ranking global
- Query: `limit` (opcional, padrão 10)
- Retorna: `{ success, ranking: [{ userId, score }] }`

### Implementação

```
routes/
  └── authRoutes.ts  → Define todas as rotas REST
services/
  ├── authService.ts → Lógica de autenticação e estatísticas
  └── rankingService.ts → Lógica de ranking (Redis)
```

---

## WebSocket (Socket.IO)

### Tecnologias
- **Socket.IO** - Comunicação bidirecional em tempo real
- **Game Loop** - Atualização a 60 FPS

### Eventos do Cliente para Servidor

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `playerMovement` | Movimento do jogador | `{ up, down, left, right, action }` |
| `playerAction` | Ação do jogador (chute) | `{ action: boolean }` |
| `disconnect` | Desconexão do jogador | - |

### Eventos do Servidor para Cliente

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `connected` | Confirmação de conexão | `{ playerId, teamId }` |
| `gameState` | Estado completo do jogo | `{ players, ball, score, time }` |
| `goal` | Evento de gol | `{ teamId, scorer }` |
| `matchEnd` | Fim da partida | `{ winner, finalScore }` |
| `playerDisconnected` | Outro jogador desconectou | `{ playerId }` |
| `forceDisconnect` | Desconexão forçada (sessão duplicada) | `{ reason }` |

### Implementação

```
game/
  ├── socketHandlers.ts  → Gerencia eventos Socket.IO
  ├── roomManager.ts     → Gerencia salas e matchmaking
  ├── match.ts           → Lógica de partida e estado do jogo
  ├── gameLoop.ts        → Loop de atualização (60 FPS)
  ├── ball.ts            → Física da bola
  ├── types.ts           → Tipos TypeScript
  └── constants.ts       → Constantes do jogo
```

---

## Fluxo Completo

### 1. Autenticação (REST)

```
Cliente                    Servidor
  │                           │
  ├──POST /api/auth/login───→│
  │                           ├─ Valida credenciais (PostgreSQL)
  │                           ├─ Gera token JWT
  │←────{ token, userId }────┤
  │                           │
```

### 2. Conexão ao Jogo (WebSocket)

```
Cliente                    Servidor
  │                           │
  ├──connect (Socket.IO)────→│
  │  + token JWT              ├─ Valida token
  │                           ├─ Cria/busca sala disponível
  │                           ├─ Adiciona jogador à partida
  │←─────connected───────────┤
  │  { playerId, teamId }     │
```

### 3. Gameplay (WebSocket em loop)

```
Cliente                    Servidor
  │                           │
  ├──playerMovement─────────→│
  │  { up, down, left, ... }  ├─ Atualiza posição do jogador
  │                           ├─ Processa física da bola
  │                           ├─ Detecta colisões e gols
  │←─────gameState───────────┤ (broadcast a todos)
  │  { players, ball, ... }   │
  │                           │
  ├──playerAction───────────→│
  │  { action: true }         ├─ Processa chute
  │←─────gameState───────────┤
```

### 4. Fim da Partida

```
Cliente                    Servidor
  │                           │
  │←──────matchEnd───────────┤
  │  { winner, finalScore }   ├─ Atualiza estatísticas (PostgreSQL)
  │                           ├─ Atualiza ranking (Redis)
  │                           ├─ Remove sala
  │                           │
```

---

## Banco de Dados

### PostgreSQL
- **Usuários** (`users`)
- **Estatísticas** (`player_stats`)
- Usado para: dados persistentes, autenticação, histórico

### Redis
- **Ranking Global** (`global:ranking` - ZSET)
- Usado para: ranking em tempo real, cache, alta performance

---

## Por Que Arquitetura Híbrida?

### REST API
✅ **Quando usar:**
- Operações CRUD (Create, Read, Update, Delete)
- Autenticação e autorização
- Consultas de dados (ranking, estatísticas)
- Stateless (sem necessidade de conexão persistente)

✅ **Vantagens:**
- Simples de implementar
- Fácil de cachear
- Compatível com qualquer cliente HTTP
- Escalável horizontalmente

### WebSocket
✅ **Quando usar:**
- Comunicação em tempo real
- Baixa latência (< 50ms)
- Atualizações bidirecionais frequentes
- Sincronização entre múltiplos clientes

✅ **Vantagens:**
- Conexão persistente (sem overhead de HTTP)
- Push do servidor para cliente
- Ideal para jogos multiplayer
- Broadcast eficiente

---

## Escalabilidade

### Atual (Single Server)
```
┌──────────────────┐
│   Nginx          │ :80
└────────┬─────────┘
         │
┌────────▼─────────┐
│   Node.js        │ :3000
│   ├── REST API   │
│   └── Socket.IO  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ PG   │  │ Redis │
└──────┘  └───────┘
```

### Futuro (Múltiplos Servidores)

Para escalar horizontalmente com Socket.IO:

1. **Redis Adapter** - Sincronizar eventos entre servidores
2. **Load Balancer** - Distribuir conexões (sticky sessions)
3. **Separate Workers** - Game loops em processos separados

```
                ┌──────────┐
                │  Nginx   │
                └────┬─────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼───┐  ┌───▼────┐  ┌───▼────┐
    │ Node 1 │  │ Node 2 │  │ Node 3 │
    └────┬───┘  └───┬────┘  └───┬────┘
         │          │           │
         └──────────┼───────────┘
                    │
            ┌───────┴────────┐
            │                │
        ┌───▼──┐      ┌─────▼─────┐
        │  PG  │      │   Redis   │
        └──────┘      │ (Adapter) │
                      └───────────┘
```

---

## Segurança

### REST API
- ✅ Senhas hasheadas com bcrypt (salt rounds: 10)
- ✅ JWT com expiração (30 dias)
- ✅ Validação de input
- ✅ HTTPS em produção (via Nginx)

### WebSocket
- ✅ Autenticação via token JWT
- ✅ Validação de origem (CORS)
- ✅ Rate limiting de eventos
- ✅ Sessão única por usuário (desconexão automática)

---

## Performance

### Otimizações Implementadas

1. **Redis para Ranking**
   - ZSET com score composto
   - O(log N) para inserção/busca
   - Fallback para PostgreSQL se necessário

2. **Game Loop Eficiente**
   - 60 FPS (16.67ms por frame)
   - Apenas broadcast quando há mudanças
   - Interpolação de movimento

3. **Nginx como Reverse Proxy**
   - Compressão gzip
   - Cache de arquivos estáticos
   - Reduz carga no Node.js

4. **Connection Pooling**
   - Pool de conexões PostgreSQL
   - Reutilização de conexões Redis

---

## Monitoramento

### Logs
```bash
# Logs do servidor
docker-compose logs -f app

# Logs do nginx
docker-compose logs -f nginx

# Logs do PostgreSQL
docker-compose logs -f postgres
```

### Métricas Importantes
- Latência de WebSocket (< 50ms ideal)
- Tempo de resposta da API (< 200ms)
- Conexões simultâneas
- Taxa de erros
- Uso de memória/CPU

---

## Referências

- **Express.js**: https://expressjs.com/
- **Socket.IO**: https://socket.io/
- **JWT**: https://jwt.io/
- **Redis**: https://redis.io/
- **PostgreSQL**: https://www.postgresql.org/

---

## Changelog de Arquitetura

### v2.0.0 - Redis Integration
- ✅ Adicionado Redis para ranking global
- ✅ Sistema de cache para estatísticas
- ✅ Melhor performance em leitura de ranking

### v1.0.0 - Initial Release
- ✅ API REST com Express
- ✅ WebSocket com Socket.IO
- ✅ PostgreSQL para persistência
- ✅ Sistema de autenticação JWT
