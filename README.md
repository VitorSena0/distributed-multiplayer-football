# Distributed Multiplayer Football

## Documentação Técnica

Jogo de futebol **multiplayer 2D em tempo real** construído com arquitetura distribuída utilizando **Node.js**, **Express**, **Socket.IO**, **PostgreSQL**, **Redis** e **TypeScript**.

O servidor simula a física básica do jogo (movimentação, colisão jogador x bola, cantos, gols) e transmite o estado oficial para todos os clientes conectados, garantindo sincronização em tempo real através de WebSockets.

---

## Informações Acadêmicas

**Disciplina:** Sistemas Distribuídos  
**Instituição:** Universidade Federal de Sergipe (UFS)  
**Data:** 25/01/2026

**Equipe:**
- Vitor Leonardo
- Nicolas Matheus  
- João Pedro

---

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura Distribuída](#arquitetura-distribuída)
- [Comunicação em Rede](#comunicação-em-rede)
- [Consistência de Dados](#consistência-de-dados)
- [Gerenciamento de Sessões](#gerenciamento-de-sessões)
- [Tolerância a Falhas](#tolerância-a-falhas)
- [Escalabilidade](#escalabilidade)
- [Persistência de Dados](#persistência-de-dados)
- [Interface do Usuário](#interface-do-usuário)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação e Execução](#instalação-e-execução)
- [Docker e Containers](#docker-e-containers)
- [Testes de Carga](#testes-de-carga-load-testing)
- [Documentação Adicional](#documentação-adicional)
- [Licença](#licença)

---

## Visão Geral

O Distributed Multiplayer Football é um jogo de futebol top‑down onde múltiplos jogadores controlam seus avatares em **tempo real** pela web, demonstrando conceitos fundamentais de **sistemas distribuídos**.

### Funcionalidades Principais

- **Multiplayer em tempo real** via WebSockets (Socket.IO)
- **Servidor autoritativo** - O servidor mantém o estado oficial do jogo
- **Gestão de múltiplas salas** independentes
- **Balanceamento automático** de times (vermelho e azul)
- **Sistema de autenticação** com JWT e bcrypt
- **Ranking global** com cache Redis
- **Persistência de estatísticas** em PostgreSQL
- **Containerização** completa com Docker

<img width="1911" height="767" alt="Tela do jogo" src="https://github.com/user-attachments/assets/9e0962bc-fe47-4865-a3ff-edb069c746cc" />

---

## Arquitetura Distribuída

### Padrão Cliente-Servidor com Microsserviços

O sistema implementa uma **arquitetura híbrida** combinando:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                        │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │   HTML5 Canvas  │    │     Socket.IO Client           │  │
│  │   (Renderização)│    │  (Comunicação em tempo real)   │  │
│  └─────────────────┘    └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Proxy Reverso)                   │
│                        Container :80                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  NODE.JS APP (Game Server)                   │
│                      Container :3000                         │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │   REST API      │    │       Socket.IO Server         │  │
│  │ (Autenticação)  │    │   (Game Loop 60 FPS)           │  │
│  └─────────────────┘    └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│     POSTGRESQL       │       │        REDIS         │
│   Container :5432    │       │   Container :6379    │
│  (Dados Persistentes)│       │   (Cache/Ranking)    │
└──────────────────────┘       └──────────────────────┘
```

### Cluster de Contêineres (Docker Compose)

O sistema roda em um cluster de **4 contêineres** orquestrados via Docker Compose:

| Serviço | Imagem | Porta | Função |
|---------|--------|-------|--------|
| `postgres` | postgres:17 | 5432 | Banco de dados relacional |
| `redis` | redis:7 | 6379 | Cache e ranking em tempo real |
| `app` | multiplayer-soccer-app | 3000 | Servidor Node.js (game server) |
| `nginx` | multiplayer-soccer-nginx | 80 | Proxy reverso e load balancer |

---

## Comunicação em Rede

### Protocolos Utilizados

| Protocolo | Tecnologia | Uso |
|-----------|------------|-----|
| **HTTP/HTTPS** | Express.js | API REST (autenticação, estatísticas) |
| **WebSocket** | Socket.IO | Gameplay em tempo real |
| **TCP** | PostgreSQL/Redis | Conexões persistentes com bancos |

### Troca de Mensagens em Tempo Real

#### Eventos Cliente → Servidor

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `playerInput` | Comandos de movimento | `{ left, right, up, down }` |
| `requestRestart` | Solicitar reinício | - |
| `pong` | Resposta ao ping | `timestamp` |

#### Eventos Servidor → Cliente

| Evento | Descrição | Payload |
|--------|-----------|---------|
| `init` | Estado inicial | `{ team, gameState, canMove, roomId }` |
| `update` | Snapshot do jogo | `{ players, ball, score, matchTime }` |
| `goalScored` | Notificação de gol | `{ team, goalScoredBy }` |
| `matchEnd` | Fim da partida | `{ winner, gameState }` |
| `playerConnected` | Novo jogador | `{ playerId, team }` |
| `playerDisconnected` | Jogador saiu | `{ playerId }` |

### Game Loop (60 FPS)

```typescript
// Servidor processa a cada ~16.67ms
setInterval(() => {
    for (const room of rooms.values()) {
        gameLoop(room, io);  // Atualiza física, colisões, placar
    }
}, 1000 / 60);
```

---

## Consistência de Dados

### Modelo de Consistência: Servidor Autoritativo

O servidor mantém o **estado oficial** do jogo, garantindo:

- **Sincronização de posições**: Jogadores, bola, placar
- **Validação de ações**: Apenas inputs válidos são processados
- **Broadcast atômico**: Todos recebem o mesmo snapshot

```
┌──────────────────────────────────────────────────────────┐
│                 ESTADO DO SERVIDOR (Room)                │
├──────────────────────────────────────────────────────────┤
│ players: { socketId: { x, y, team, input, goals } }      │
│ ball: { x, y, speedX, speedY, radius }                   │
│ score: { red: number, blue: number }                     │
│ teams: { red: string[], blue: string[] }                 │
│ matchTime: number                                        │
│ isPlaying: boolean                                       │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼ broadcast
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌─────────┐        ┌─────────┐        ┌─────────┐
│ Client1 │        │ Client2 │        │ Client3 │
└─────────┘        └─────────┘        └─────────┘
```

### Consistência Redis/PostgreSQL

- **Redis**: Cache de ranking com ZSET (consistência eventual)
- **PostgreSQL**: Dados persistentes com transações ACID
- **Fallback automático**: Se Redis falhar, consulta PostgreSQL

---

## Gerenciamento de Sessões

### Autenticação de Jogadores

| Método | Descrição |
|--------|-----------|
| **Login** | Usuário/senha → JWT Token |
| **Registro** | Criar conta com senha bcrypt |
| **Convidado** | Jogar sem conta (sem estatísticas) |

### Criação e Gerenciamento de Salas (Lobby)

```typescript
// Alocação automática de sala
function allocateRoom(requestedRoomId?: string): RoomAllocation {
    // 1. Tenta usar sala específica (se solicitado)
    // 2. Busca sala com vagas
    // 3. Cria nova sala se necessário
}
```

- **Máximo 6 jogadores** por sala
- **Balanceamento automático** entre times
- **Salas nomeadas** via URL: `?room=minha-sala`
- **Cleanup automático** de salas vazias

### Segurança de Sessão

- **Sessão única**: Um usuário por vez por conta
- **JWT com expiração**: 30 dias
- **Senhas hasheadas**: bcrypt com 10 salt rounds
- **Proteção CORS**: Validação de origem

<img width="1507" height="800" alt="Tela de autenticação" src="https://github.com/user-attachments/assets/98adaf7f-81ca-417b-9534-c5cb53fa5d67" />

---

## Tolerância a Falhas

### Tratamento de Desconexões

```typescript
socket.on('disconnect', () => {
    // 1. Remove jogador do time
    room.teams[player.team] = room.teams[player.team].filter(id => id !== socket.id);
    
    // 2. Remove do mapa de jogadores
    delete room.players[socket.id];
    
    // 3. Notifica demais jogadores
    io.to(room.id).emit('playerDisconnected', { playerId: socket.id });
    
    // 4. Reavalia condições de jogo
    checkRestartConditions(room, io);
    
    // 5. Limpa sala se vazia
    cleanupRoomIfEmpty(room);
});
```

### Mecanismos Implementados

| Mecanismo | Descrição |
|-----------|-----------|
| **Detecção de desconexão** | Socket.IO heartbeat automático |
| **Rebalanceamento** | Times são rebalanceados automaticamente |
| **Continuidade** | Partida continua se houver jogadores suficientes |
| **Recuperação de estado** | Novos jogadores recebem estado atual completo |
| **Healthchecks** | Containers reiniciam automaticamente |

### Docker Restart Policy

```yaml
services:
  app:
    restart: unless-stopped  # Reinicia automaticamente em caso de falha
```

---

## Escalabilidade

### Suporte a Múltiplos Jogadores

- **6 jogadores por sala** (configurável)
- **Salas ilimitadas** criadas sob demanda
- **Isolamento**: Cada sala tem seu próprio estado

### Arquitetura Atual (Single Server)

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

### Escalabilidade Horizontal (Futuro)

Para múltiplas instâncias do servidor:

```
                ┌──────────┐
                │  Nginx   │ (Load Balancer)
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

1. **Redis Adapter** - Sincronizar eventos Socket.IO entre servidores
2. **Load Balancer** - Sticky sessions para WebSocket
3. **Separate Workers** - Game loops em processos separados

---

## Persistência de Dados

### Banco de Dados Distribuído

#### PostgreSQL (Dados Persistentes)

```sql
-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estatísticas
CREATE TABLE player_stats (
    user_id INTEGER UNIQUE REFERENCES users(id),
    total_goals_scored INTEGER DEFAULT 0,
    total_goals_conceded INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_ranking ON player_stats(wins DESC, goals_difference DESC);
```

#### Redis (Cache e Ranking)

```redis
# ZSET para ranking global
ZADD global_ranking <score> <userId>

# Hash para dados do jogador
HSET player:<userId> username "jogador1" wins 10 losses 5

# Consulta TOP 10
ZREVRANGE global_ranking 0 9 WITHSCORES
```

### Dados Armazenados

| Dado | Armazenamento | Descrição |
|------|---------------|-----------|
| Credenciais | PostgreSQL | username, password (hash) |
| Estatísticas | PostgreSQL + Redis | gols, vitórias, derrotas |
| Ranking | Redis (cache) + PostgreSQL (persistente) | TOP 10 global |
| Estado do jogo | Memória (RAM) | Posições, placar, timer |

---

## Interface do Usuário

### Renderização em Tempo Real

- **HTML5 Canvas** para renderização do campo
- **60 FPS** de atualização visual
- **Feedback visual** de estado do jogo

### Elementos da Interface

| Elemento | Descrição |
|----------|-----------|
| Campo | Área de jogo com gols e linhas |
| Jogadores | Círculos coloridos (vermelho/azul) |
| Bola | Elemento central do gameplay |
| Placar | Pontuação de ambos os times |
| Cronômetro | Tempo restante da partida |
| Ranking | TOP 10 jogadores no lado esquerdo |
| HUD | Ping, sala atual, controles |

<img width="1513" height="919" alt="Interface do jogo" src="https://github.com/user-attachments/assets/b9dea00f-daf0-4038-a2b8-4ddbabedbd8a" />

---

## Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20+ | Runtime JavaScript |
| Express | 4.x | Framework web |
| Socket.IO | 4.x | WebSockets |
| TypeScript | 5.x | Tipagem estática |
| PostgreSQL | 17 | Banco relacional |
| Redis | 7 | Cache/ranking |
| bcryptjs | 2.x | Hash de senhas |
| jsonwebtoken | 9.x | Autenticação JWT |

### Frontend
| Tecnologia | Uso |
|------------|-----|
| HTML5 Canvas | Renderização do jogo |
| TypeScript | Lógica do cliente |
| Socket.IO Client | Comunicação em tempo real |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Docker | Containerização |
| Docker Compose | Orquestração |
| Nginx | Proxy reverso |

---

## Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose instalados
- Git

### Execução com Docker (Recomendado)

```bash
# 1. Clonar o repositório
git clone https://github.com/VitorSena0/distributed-multiplayer-football.git
cd distributed-multiplayer-football

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 3. Build das imagens
docker build -t multiplayer-soccer-app:latest .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# 4. Iniciar os containers
docker-compose up -d

# 5. Acessar o jogo
# Abra http://localhost no navegador
```

### Execução Local (Desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar banco de dados
./scripts/init-db.sh

# 3. Compilar TypeScript
npm run build

# 4. Executar servidor
npm run start

# Ou em modo desenvolvimento
npm run dev
```

---

## Docker e Containers

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: football_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
    restart: unless-stopped

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    restart: unless-stopped

  app:
    image: multiplayer-soccer-app:latest
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  nginx:
    image: multiplayer-soccer-nginx:latest
    ports:
      - "80:80"
    depends_on:
      - app
    restart: unless-stopped
```

### Comandos Úteis

```bash
# Ver logs
docker-compose logs -f app

# Acessar Redis CLI
docker-compose exec redis redis-cli

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d football_db

# Reiniciar serviços
docker-compose restart
```

---

## Testes de Carga (Load Testing) - Branch: [artillery-load-test](https://github.com/rafael-dcomp/projeto-sempre-destruidos/tree/copilot/add-artillery-load-testing)


O projeto inclui testes de carga completos usando **Artillery** para validar a performance e capacidade do sistema sob diferentes condições.

### Arquivos de Teste Disponíveis

| Arquivo | Descrição | Carga | Duração |
|---------|-----------|-------|---------|
| `http-light-load.yml` | Carga leve | 10-20 usuários/seg | ~2 min |
| `http-medium-load.yml` | Carga média | 20-50 usuários/seg | ~4 min |
| `http-heavy-load.yml` | Carga pesada | 30-150 usuários/seg | ~3.5 min |
| `stress-test.yml` | Teste de estresse | 50-300 usuários/seg | ~3 min |
| `websocket-test.yml` | Teste WebSocket | 2-5 conexões/seg | ~3 min |

### Executar Testes de Carga

```bash
# Certifique-se de que o servidor está rodando
docker-compose up -d

# Testes HTTP
npm run load-test:light      # Carga leve
npm run load-test:medium     # Carga média
npm run load-test:heavy      # Carga pesada
npm run load-test:stress     # Teste de estresse

# Teste WebSocket
npm run load-test:websocket

# Executar todos os testes HTTP
npm run load-test:all
```

### Gerar Relatórios HTML

```bash
# Executar teste e gerar relatório
npx artillery run --output report.json load-tests/http-medium-load.yml
npx artillery report report.json

# Abrir relatório no navegador
open report.json.html
```

### Parâmetros Principais

Os testes podem ser customizados editando os arquivos `.yml` em `load-tests/`:

```yaml
config:
  target: 'http://localhost'  # Servidor a testar
  phases:
    - duration: 60        # Duração em segundos
      arrivalRate: 20     # Usuários virtuais por segundo
      rampTo: 50          # Aumentar até este valor (opcional)
```

---

## Licença

Este projeto está licenciado sob a licença **ISC**.

---

## Contribuidores

- **Vitor Leonardo** 
- **Nicolas Matheus**
- **João Pedro**

---

*Desenvolvido como projeto acadêmico para a disciplina de Sistemas Distribuídos - Universidade Federal de Sergipe (UFS) - 2026*
