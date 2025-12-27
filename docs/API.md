# Documentação da API

## Endpoints de Autenticação

Base URL: `http://localhost:3000/api/auth`

---

## POST /register

Registra um novo usuário no sistema.

### Request Body

```json
{
  "username": "jogador123",
  "password": "senha123"
}
```

### Validações

- `username`: 3-50 caracteres, deve ser único
- `password`: Mínimo 6 caracteres

### Response Success (201)

```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "jogador123"
}
```

### Response Error (400)

```json
{
  "success": false,
  "message": "Nome de usuário já existe"
}
```

### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jogador123","password":"senha123"}'
```

---

## POST /login

Realiza login de um usuário existente.

### Request Body

```json
{
  "username": "jogador123",
  "password": "senha123"
}
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "jogador123"
}
```

### Response Error (401)

```json
{
  "success": false,
  "message": "Usuário ou senha incorretos"
}
```

### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jogador123","password":"senha123"}'
```

---

## POST /verify

Verifica se um token JWT é válido.

### Request Body

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response Success (200)

```json
{
  "success": true,
  "userId": 1,
  "username": "jogador123"
}
```

### Response Error (401)

```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

### Exemplo cURL

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

---

## GET /stats/:userId

Busca as estatísticas de um usuário específico.

### URL Parameters

- `userId` (integer): ID do usuário

### Response Success (200)

```json
{
  "success": true,
  "stats": {
    "user_id": 1,
    "username": "jogador123",
    "total_goals_scored": 45,
    "total_goals_conceded": 32,
    "goals_difference": 13,
    "wins": 15,
    "losses": 8,
    "draws": 5,
    "matches_played": 28
  }
}
```

### Response Error (404)

```json
{
  "success": false,
  "message": "Estatísticas não encontradas"
}
```

### Exemplo cURL

```bash
curl http://localhost:3000/api/auth/stats/1
```

---

## GET /ranking

Busca o ranking global dos jogadores.

### Query Parameters

- `limit` (integer, opcional): Número de jogadores a retornar (padrão: 10)

### Response Success (200)

```json
{
  "success": true,
  "ranking": [
    {
      "user_id": 5,
      "username": "campeao",
      "total_goals_scored": 120,
      "total_goals_conceded": 45,
      "goals_difference": 75,
      "wins": 35,
      "losses": 5,
      "draws": 10,
      "matches_played": 50
    },
    {
      "user_id": 12,
      "username": "artilheiro",
      "total_goals_scored": 95,
      "total_goals_conceded": 60,
      "goals_difference": 35,
      "wins": 28,
      "losses": 12,
      "draws": 8,
      "matches_played": 48
    }
  ]
}
```

### Exemplo cURL

```bash
# Top 10 (padrão)
curl http://localhost:3000/api/auth/ranking

# Top 20
curl http://localhost:3000/api/auth/ranking?limit=20
```

---

## WebSocket Events

O jogo usa Socket.IO para comunicação em tempo real. Ao conectar, envie as informações de autenticação:

```javascript
const socket = io('http://localhost:3000', {
  query: {
    roomId: 'room-1',        // Opcional
    userId: '1',             // ID do usuário (vazio para convidado)
    username: 'jogador123'   // Nome do usuário (ou 'Convidado')
  }
});
```

### Eventos do Cliente → Servidor

- `playerInput`: Envia comandos de movimento
  ```javascript
  socket.emit('playerInput', {
    left: false,
    right: true,
    up: false,
    down: false
  });
  ```

- `requestRestart`: Solicita reiniciar a partida após o fim
  ```javascript
  socket.emit('requestRestart');
  ```

- `pong`: Responde ao ping do servidor
  ```javascript
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });
  ```

### Eventos do Servidor → Cliente

- `init`: Estado inicial do jogo ao conectar
- `roomAssigned`: Confirmação de sala atribuída
- `gameState`: Atualização do estado do jogo (60 FPS)
- `matchStart`: Início de uma nova partida
- `matchEnd`: Fim da partida com resultado
- `timerUpdate`: Atualização do tempo restante
- `goalScored`: Evento de gol marcado
- `waitingForPlayers`: Aguardando mais jogadores
- `teamChanged`: Time do jogador foi alterado

---

## Fluxo de Autenticação

1. **Usuário acessa `/`** → Redireciona para `/auth.html`
2. **Usuário faz login ou registro** → Recebe token JWT
3. **Token é salvo no localStorage**
4. **Ao conectar no WebSocket** → Envia userId e username
5. **Ao terminar partida** → Servidor salva estatísticas automaticamente
6. **Ranking é atualizado** → Visível no painel lateral do jogo

---

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso (registro)
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Credenciais inválidas ou token expirado
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

---

## Segurança

- Senhas são criptografadas com **bcrypt** (10 salt rounds)
- Tokens JWT expiram em **30 dias**
- **Nunca** exponha o `JWT_SECRET` em código público
- Use HTTPS em produção
- Validação de entrada em todos os endpoints
- Proteção contra SQL injection (queries parametrizadas)
