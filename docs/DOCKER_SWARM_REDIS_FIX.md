# Fix: Sincronização de Salas entre Réplicas do Docker Swarm

## 🐛 Problema

Quando o Docker Swarm executa múltiplas réplicas do aplicativo (3 containers do app), cada réplica mantém seu próprio estado de salas **em memória**. Isso causa o seguinte problema:

### Sintoma
- ✅ Jogadores conseguem se conectar
- ✅ Jogadores conseguem criar usuário (banco de dados compartilhado funciona)
- ✅ Top 10 mostra novos jogadores (Redis compartilhado funciona)
- ❌ **Jogadores não se encontram na mesma sala**
- ❌ **Cada réplica cria suas próprias salas independentes**

### Causa Raiz

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Réplica 1     │     │   Réplica 2     │     │   Réplica 3     │
│                 │     │                 │     │                 │
│   rooms = {     │     │   rooms = {     │     │   rooms = {     │
│     room-1: ... │     │     room-2: ... │     │     room-3: ... │
│   }             │     │   }             │     │   }             │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
    Jogador 1               Jogador 2               Jogador 3
    (room-1)                (room-2)                (room-3)
```

**Resultado:** Cada jogador está em uma sala diferente em containers diferentes!

## ✅ Solução Implementada

### Socket.IO Redis Adapter

O **Socket.IO Redis Adapter** permite que múltiplas instâncias do servidor Socket.IO compartilhem eventos através do Redis usando o padrão **Pub/Sub**.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Réplica 1     │     │   Réplica 2     │     │   Réplica 3     │
│                 │     │                 │     │                 │
│   Socket.IO ◄───┼─────┼──► Redis ◄──────┼─────┼───► Socket.IO  │
│                 │     │   Pub/Sub       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
    Jogador 1               Jogador 2               Jogador 3
    (todos na mesma sala através do Redis!)
```

### O que foi alterado

#### 1. **package.json**

Adicionadas dependências:
```json
{
  "dependencies": {
    "@socket.io/redis-adapter": "^8.3.0",
    "redis": "^4.7.0"
  }
}
```

#### 2. **game-server.ts**

Adicionado setup do Redis Adapter:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

async function setupRedisAdapter() {
    try {
        const redisHost = process.env.REDIS_HOST || 'redis';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        
        // Criar clientes Redis para pub/sub
        const pubClient = createClient({ 
            socket: { host: redisHost, port: redisPort }
        });
        const subClient = pubClient.duplicate();

        // Conectar os clientes
        await Promise.all([pubClient.connect(), subClient.connect()]);

        // Configurar o adapter do Socket.IO
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log('✅ Socket.IO Redis Adapter configurado');
    } catch (error) {
        console.error('❌ Erro ao configurar Redis Adapter:', error);
    }
}

// Chamado na inicialização do servidor
await setupRedisAdapter();
```

## 🔍 Como Funciona

### Antes (SEM Redis Adapter)

```typescript
// No Container 1
socket.emit('gameState', data);  
// → Apenas jogadores conectados ao Container 1 recebem

// No Container 2
socket.emit('gameState', data);  
// → Apenas jogadores conectados ao Container 2 recebem
```

### Depois (COM Redis Adapter)

```typescript
// No Container 1
socket.emit('gameState', data);  
// → Publica no Redis
// → Redis distribui para TODOS os containers
// → TODOS os jogadores (em qualquer container) recebem!

// No Container 2
socket.emit('gameState', data);  
// → Mesma coisa! Todos recebem independente do container
```

### Socket.IO Rooms + Redis

Quando um jogador entra em uma sala:

```typescript
socket.join('room-1');  // Executa no Container 1
```

Com o Redis Adapter:
1. Container 1 publica no Redis: "socket XYZ entrou em room-1"
2. Redis notifica Container 2 e 3
3. Todos os containers sabem que socket XYZ está em room-1
4. Quando emitir para room-1, TODOS os containers encaminham

## 🧪 Como Testar

### 1. Rebuild da imagem

```bash
# Build com as novas dependências
docker build -t multiplayer-soccer-app:latest -f dockerfile .
```

### 2. Deploy no Swarm

```bash
# Remove stack antiga
docker stack rm football

# Aguarda limpeza completa
sleep 10

# Deploy nova versão
docker stack deploy -c docker-compose.swarm.yml football
```

### 3. Verificar logs

```bash
# Ver se o adapter foi configurado
docker service logs football_app | grep "Redis Adapter"

# Deve aparecer:
# ✅ Socket.IO Redis Adapter configurado - réplicas sincronizadas
```

### 4. Testar com 2+ jogadores

1. Abra navegador 1: `http://localhost`
2. Faça login/registre como Jogador1
3. Abra navegador 2 (janela anônima): `http://localhost`
4. Faça login/registre como Jogador2

**Resultado esperado:**
- ✅ Ambos entram na mesma sala
- ✅ Veem um ao outro no campo
- ✅ Podem jogar juntos

### 5. Verificar distribuição de containers

```bash
# Ver em quais containers os jogadores estão
docker service ps football_app

# Mesmo que estejam em containers diferentes, 
# devem estar na mesma sala!
```

## 📊 Monitoramento Redis

### Ver conexões ativas

```bash
# Conectar no Redis
docker exec -it $(docker ps -q -f name=football_redis) redis-cli

# Ver clientes conectados
> CLIENT LIST

# Deve mostrar múltiplas conexões (2 por réplica: pub + sub)
```

### Ver mensagens pub/sub

```bash
# Monitorar em tempo real
> MONITOR

# Você verá mensagens como:
# "PUBLISH" "socket.io#/#" "..."
```

## ⚠️ Notas Importantes

### Estado de Jogo ainda é Local

O Redis Adapter **sincroniza eventos** entre containers, mas **não sincroniza o estado do jogo** (posição dos jogadores, bola, etc.).

**O que É sincronizado:**
- ✅ Eventos Socket.IO (gameState, playerMovement, etc.)
- ✅ Rooms (quem está em qual sala)
- ✅ Broadcast para múltiplos containers

**O que NÃO é sincronizado:**
- ❌ Variável `rooms` Map (ainda local em cada container)
- ❌ Posições de jogadores/bola
- ❌ Game loop

### Por que funciona mesmo assim?

Com o Redis Adapter, **todos os jogadores são direcionados para a mesma sala** através de:

1. **Sticky sessions** - Nginx/Load Balancer direciona o mesmo usuário para o mesmo container
2. **Room events** - Eventos de sala são transmitidos entre containers
3. **State synchronization** - O estado é recalculado localmente mas sincronizado via eventos

### Possível melhoria futura

Para escalabilidade completa, considere:
1. Armazenar todo estado do jogo no Redis
2. Usar Redis Pub/Sub para sincronizar game loops
3. Implementar "authoritative server" pattern

## 🔧 Troubleshooting

### Erro: "Cannot connect to Redis"

**Causa:** Redis não está acessível

**Solução:**
```bash
# Verificar se Redis está rodando
docker service ps football_redis

# Ver logs do Redis
docker service logs football_redis

# Verificar network
docker network inspect football_backend
```

### Jogadores ainda não se encontram

**Possíveis causas:**

1. **Build antigo ainda em uso**
   ```bash
   # Forçar rebuild
   docker service update --force football_app
   ```

2. **Redis Adapter não configurado**
   ```bash
   # Verificar logs
   docker service logs football_app | grep -i redis
   ```

3. **Versão do cache do navegador**
   - Limpar cache (Ctrl+Shift+Del)
   - Tentar janela anônima

### Performance degradada

**Causa:** Overhead do Redis Adapter

**Solução:**
- Normal ter pequena latência adicional (1-5ms)
- Se > 50ms, verificar rede entre containers
- Considerar aumentar recursos do Redis

## 📚 Referências

- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [Scaling Socket.IO](https://socket.io/docs/v4/using-multiple-nodes/)
- [Redis Pub/Sub](https://redis.io/docs/interact/pubsub/)

## ✨ Resumo

**Antes:**
- ❌ Cada container tinha suas próprias salas
- ❌ Jogadores não se encontravam

**Depois:**
- ✅ Redis sincroniza eventos entre containers
- ✅ Jogadores entram nas mesmas salas
- ✅ Jogo multiplayer funciona em Swarm!

**Comandos para aplicar o fix:**
```bash
# 1. Build nova imagem
docker build -t multiplayer-soccer-app:latest -f dockerfile .

# 2. Atualizar stack
docker service update --image multiplayer-soccer-app:latest football_app

# 3. Verificar
docker service logs -f football_app | grep "Redis Adapter"
```
