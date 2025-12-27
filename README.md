# Multiplayer Soccer

Jogo de futebol **multiplayer 2D em tempo real** construído com **Node.js**, **Express**, **Socket.IO**, **PostgreSQL** e **TypeScript**.  
O servidor simula a física básica do jogo (movimentação, colisão jogador x bola, cantos, gols) e transmite o estado oficial para todos os clientes conectados, garantindo que todos vejam a mesma partida.

> **📝 Nota sobre TypeScript**: Este projeto foi completamente refatorado de JavaScript para TypeScript para melhorar a manutenibilidade do código e proporcionar uma melhor experiência de desenvolvimento com tipagem estática. Todos os arquivos `.js` foram convertidos para `.ts` com tipos bem definidos para variáveis, funções e estruturas de dados.

> **🔐 Sistema de Autenticação**: O jogo agora possui um sistema completo de login e registro com PostgreSQL 17, onde os jogadores podem criar contas, fazer login ou jogar como convidado. As estatísticas de partidas completas (gols marcados, gols sofridos, vitórias, derrotas, empates) são salvas automaticamente e exibidas em um ranking global.

---

## Índice

- [Multiplayer Soccer](#multiplayer-soccer)
  - [Índice](#índice)
  - [Visão Geral](#visão-geral)
  - [Sistema de Autenticação e Estatísticas](#sistema-de-autenticação-e-estatísticas)
  - [Demonstração](#demonstração)
  - [Arquitetura](#arquitetura)
  - [Recursos do Jogo](#recursos-do-jogo)
  - [Tecnologias Utilizadas](#tecnologias-utilizadas)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação e Execução Local](#instalação-e-execução-local)
  - [Salas, Times e Balanceamento](#salas-times-e-balanceamento)
  - [Regras de Partida e Temporizador](#regras-de-partida-e-temporizador)
  - [Front-end (cliente)](#front-end-cliente)
  - [Backend (servidor de jogo)](#backend-servidor-de-jogo)
  - [Estrutura de Pastas](#estrutura-de-pastas)
  - [Docker e Docker Compose](#docker-e-docker-compose)
    - [1. Imagem do app Node](#1-imagem-do-app-node)
    - [2. Docker Compose (app + Nginx)](#2-docker-compose-app--nginx)
  - [Deploy em Produção (AWS EC2 + Nginx)](#deploy-em-produção-aws-ec2--nginx)
  - [Variáveis de Ambiente](#variáveis-de-ambiente)
  - [Roteiro de Desenvolvimento Futuro](#roteiro-de-desenvolvimento-futuro)
  - [Licença](#licença)

---

## Visão Geral

O Multiplayer Soccer é um jogo de futebol top‑down onde vários jogadores controlam seus bonecos em **tempo real** pela web.  
O servidor Node é responsável por:

- Gerenciar **salas de jogo** independentes.
- Balancear e manter **times vermelho e azul**.
- Rodar o **game loop** (atualização de posições, colisões, placar).
- Controlar o **temporizador da partida** e o fluxo de início/fim/reinício.
- Enviar para cada cliente o **estado oficial** da partida (snapshot do jogo).
- **Autenticar usuários** e salvar **estatísticas de partidas** no PostgreSQL.

O cliente web (HTML/Canvas/JS) renderiza o campo, jogadores, bola, placar e cronômetro, além de enviar os comandos de input (setas/WASD, etc.) para o servidor via Socket.IO.

---

## Sistema de Autenticação e Estatísticas

### 🔐 Autenticação

O jogo possui três modos de acesso:

1. **Login**: Usuários registrados fazem login com usuário e senha
2. **Registro**: Novos jogadores criam uma conta com usuário único e senha criptografada (bcrypt)
3. **Convidado**: Jogar sem criar conta (estatísticas não são salvas)

### 📊 Estatísticas Salvas

Para jogadores registrados, o sistema salva automaticamente após cada partida completa:

- **Gols marcados**: Total de gols feitos pelo jogador
- **Gols sofridos**: Total de gols que o time do jogador levou
- **Saldo de gols**: Diferença entre gols marcados e sofridos
- **Vitórias**: Quantidade de partidas vencidas
- **Derrotas**: Quantidade de partidas perdidas
- **Empates**: Quantidade de partidas empatadas
- **Partidas jogadas**: Total de partidas completas

### 🏆 Ranking Global

Um ranking TOP 10 é exibido no lado esquerdo da tela do jogo, mostrando:
- Posição no ranking (#)
- Nome do jogador
- Vitórias (VIT)
- Derrotas (DER)
- Empates (EMP)
- Saldo de gols (SG)
- Partidas jogadas (PJ)

O ranking é ordenado por: Vitórias > Saldo de Gols > Total de Gols Marcados

### 🎮 Identificação de Jogadores

- **Usuários registrados**: O nome de usuário é exibido acima do jogador no jogo
- **Convidados**: Aparecem como "Convidado 1", "Convidado 2", etc. (até "Convidado 6" se todos forem convidados)
- **Seu jogador**: Destacado com cor amarela pulsante para fácil identificação

### 🔒 Segurança

- **Proteção de sessão**: Um usuário só pode estar logado em uma sessão por vez. Se tentar fazer login em outro dispositivo/aba, a sessão anterior é desconectada automaticamente
- **Mensagem de segurança**: Interface de registro informa que os dados são protegidos com bcrypt (hash de senha) e JWT (autenticação segura)
- **Armazenamento temporário**: Dados de sessão são armazenados em `sessionStorage` (não persistem após fechar o navegador)

### 🛠️ Tecnologias de Autenticação

- **PostgreSQL 17**: Banco de dados relacional
- **bcryptjs**: Criptografia de senhas
- **jsonwebtoken (JWT)**: Tokens de autenticação
- **RESTful API**: Endpoints para login, registro, estatísticas e ranking

---

## Arquitetura

- **Node.js + Express**: servidor HTTP responsável por expor uma API mínima e servir os arquivos estáticos do cliente (pasta `public/`).
- **Socket.IO**: canal de comunicação em tempo real entre cliente e servidor, usado para:
	- Enviar inputs do jogador para o servidor.
	- Receber o estado atualizado do jogo (posição de jogadores, bola, placar, timer).
- **Game Loop no servidor**:
	- Roda a **60 FPS** (`setInterval` a cada `1000 / 60` ms).
	- Atualiza física básica: velocidade, posições, colisões, limites de campo, gol, cantos etc.
- **Timer de partida**:
	- Atualizado a cada 1 segundo.
	- Emite eventos de início, atualização de cronômetro e fim de partida.

---

## Recursos do Jogo

- Multiplayer em tempo real via WebSockets (Socket.IO).
- Gestão de múltiplas salas independentes.
- Times **vermelho** e **azul**, com balanceamento automático.
- Placar e cronômetro visíveis para todos os clientes.
- Reinício de partida quando o tempo zera e todos clicam em “Jogar Novamente”.
- Colisão básica jogador x bola, limites de campo e regras de cantos.
- Detecção de sala cheia com evento específico para o cliente.

---

## Tecnologias Utilizadas

- **Linguagem**: TypeScript (compilado para JavaScript)
- **Servidor**:
	- Node.js 18+
	- Express
	- Socket.IO
	- TypeScript
	- PostgreSQL 17
	- bcryptjs (criptografia de senhas)
	- jsonwebtoken (JWT para autenticação)
- **Cliente**:
	- HTML5
	- CSS3
	- TypeScript (compilado para JavaScript)
	- Canvas / DOM
- **Banco de Dados**:
	- PostgreSQL 17
	- pg (driver Node.js)
- **Infra / Deploy**:
	- Docker / Docker Compose
	- Nginx (como proxy reverso)
	- AWS EC2 (exemplo de ambiente de produção)
	- ngrok (para tunel HTTP em desenvolvimento remoto)

---

## Pré-requisitos

Para rodar **localmente**:

- **Node.js 18+** e **npm**
- **PostgreSQL 17** (ou usar Docker)
- Porta **TCP 3000** liberada (ou configure outra via variável `PORT`)
- Porta **TCP 5432** liberada para PostgreSQL (se rodando localmente)

Para usar **Docker**:

- Docker instalado e em execução
- (Opcional) Docker Compose

Para seguir o guia de deploy na **AWS EC2**:

- Conta AWS
- Instância EC2 (Ubuntu ou Amazon Linux recomendados)
- Acesso SSH

---

## Instalação e Execução Local

### 1. Instalar Dependências

Na raiz do projeto:

```bash
npm install
```

### 2. Configurar Banco de Dados

#### Opção A: Usando Docker (Recomendado)

Execute o script de inicialização:

```bash
./scripts/init-db.sh
```

Este script irá:
- Iniciar um container PostgreSQL 17
- Criar o banco de dados `football_db`
- Executar o schema SQL para criar as tabelas

#### Opção B: PostgreSQL Local

Se você tem PostgreSQL instalado localmente:

```bash
# Criar banco de dados
createdb football_db

# Executar schema
psql -d football_db -f database/schema.sql
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste as configurações:

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário. Para desenvolvimento local com Docker, os valores padrão já funcionam.

### 4. Compilar e Executar

```bash
# Compilar o TypeScript
npm run build

# Executar o servidor
npm run start
```

Ou para desenvolvimento:

```bash
# Executar em modo desenvolvimento (com ts-node)
npm run dev
```

O servidor, por padrão, escuta em `PORT` (se definida) ou `3000`.

### 5. Acessar o Jogo

Abra no navegador:

- `http://localhost:3000` - Redireciona para a tela de login
- `http://localhost:3000/auth.html` - Tela de login/registro
- `http://localhost:3000/index.html` - Jogo (requer autenticação)

### API Endpoints

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/verify` - Verificar token JWT
- `GET /api/auth/stats/:userId` - Buscar estatísticas de um usuário
- `GET /api/auth/ranking?limit=10` - Buscar ranking global

---

## Salas, Times e Balanceamento

A lógica de salas está em `game/roomManager.ts`.

- Cada sala comporta até **6 jogadores simultâneos** (`MAX_PLAYERS_PER_ROOM`).
- Ao acessar o jogo sem parâmetros (`/`), o servidor:
	- Procura uma sala disponível com vagas.
	- Caso não encontre, **cria uma nova** (`room-1`, `room-2`, ...).
- Para entrar em uma sala específica, use o parâmetro `room` na URL, por exemplo:
	- `https://seu-dominio.com/?room=amigos`
- O identificador de sala é **sanitizado**:
	- Apenas letras, números, `-` e `_` são aceitos.
	- Entradas inválidas são descartadas.

**Sala cheia**:

- Se uma sala estiver com todos os slots ocupados, o servidor:
	- Emite o evento `roomFull` para o cliente.
	- Encerra a conexão para evitar sobrecarga.

- **Balanceamento de times**:
	- O servidor tenta manter a diferença de jogadores entre os times `red` e `blue` em **no máximo 1**.
	- Quando necessário, jogadores podem ser realocados de um time para outro (lógica em `game/match.ts`).

---

## Regras de Partida e Temporizador

A lógica de partida está em `game/match.ts`:

- **Início/Reinício de partida**:
	- A partida é iniciada quando há ao menos um jogador em cada time.
	- Ao reiniciar, o servidor:
		- Zera o cronômetro.
		- Reseta posições de todos os jogadores.
		- Chama `resetBall` para reposicionar a bola (ver `game/ball.ts`).
- **Temporizador**:
	- Atualizado pela função `updateTimer(room, io)` a cada 1 segundo.
	- Emite o evento `timerUpdate` com `matchTime` para todos da sala.
	- Ao chegar em zero:
		- Emite `matchEnd`.
		- A partida entra em estado de espera.

**Reinício após fim da partida**:

- Quando o cronômetro chega a zero:
	- Todos os jogadores precisam clicar em **“Jogar Novamente”**.
	- O servidor registra quem está “pronto”.
	- Assim que **todos** estiverem prontos **e** houver pelo menos um jogador em cada time:
		- A partida é reiniciada (novo kick-off, bola e posições resetadas).

---

## Front-end (cliente)

Os arquivos do cliente estão em `public/`:

- `public/index.html` — página principal do jogo.
- `public/style.css` — estilos do campo, HUD, botões, etc.
- `public/game.ts` — lógica do cliente em TypeScript (compilada para `public/dist/game.js`):
	- Conecta ao Socket.IO do servidor.
	- Envia inputs (teclas pressionadas) para o servidor.
	- Renderiza o campo, jogadores, bola, placar e cronômetro.
	- Trata eventos como:
		- Snapshot de estado do jogo.
		- Atualizações de timer.
		- Mensagens de sala cheia, início/fim de partida, etc.
	- Utiliza tipagem forte para garantir segurança de tipos nas interfaces de comunicação.

---

## Backend (servidor de jogo)

Ponto de entrada: `game-server.ts` (compilado para `dist/game-server.js`).

Responsabilidades principais:

- Criar o servidor HTTP (`http.createServer(app)`).
- Plugar o Socket.IO (`const io = new SocketIOServer(server, { ... })`).
- Servir arquivos estáticos da pasta `public/` via Express.
- Registrar os handlers de Socket.IO (`game/socketHandlers.ts`).
- Executar o game loop e o timer:

	- `runGameLoops()`:
		- Percorre todas as salas (`rooms`) e chama `gameLoop(room, io)`.
		- Rodando a **60 FPS** (`setInterval(runGameLoops, 1000 / 60)`).
	- `handleTimers()`:
		- Percorre todas as salas e chama `updateTimer(room, io)`.
		- Rodando a cada **1 segundo** (`setInterval(handleTimers, 1000)`).

Outros módulos importantes:

- `game/types.ts` — definições de tipos TypeScript para todas as estruturas do jogo (Room, Player, Ball, etc.).
- `game/constants.ts` — constantes de jogo (tamanhos, duração, limites).
- `game/roomManager.ts` — criação, alocação e limpeza de salas com tipos bem definidos.
- `game/match.ts` — temporizador, início/fim de partida, balanceamento de times.
- `game/ball.ts` — estado e reposicionamento da bola, cantos.
- `game/gameLoop.ts` — lógica central de atualização a cada tick.
- `game/socketHandlers.ts` — mapeamento de eventos Socket.IO (conexão, desconexão, inputs, "jogar novamente" etc.) com tipagem forte.
- `game/gameLoop.js` — lógica central de atualização a cada tick.
- `game/socketHandlers.js` — mapeamento de eventos Socket.IO (conexão, desconexão, inputs, “jogar novamente” etc.).

---

## Estrutura de Pastas

Estrutura simplificada do repositório:

```text
Multiplayer-Soccer/
├─ game-server.ts         # Ponto de entrada do servidor Node/Express/Socket.IO (TypeScript)
├─ package.json           # Metadados e scripts npm
├─ tsconfig.json          # Configuração TypeScript para o servidor
├─ tsconfig.client.json   # Configuração TypeScript para o cliente
├─ dockerfile             # Dockerfile do app Node
├─ docker-compose.yml     # Compose para subir app + nginx + postgres
├─ .env.example           # Exemplo de variáveis de ambiente
├─ README.md              # Este arquivo
│
├─ game/                  # Lado servidor: lógica de jogo (TypeScript)
│  ├─ types.ts
│  ├─ constants.ts
│  ├─ roomManager.ts
│  ├─ match.ts
│  ├─ ball.ts
│  ├─ gameLoop.ts
│  └─ socketHandlers.ts
│
├─ database/              # Esquema e configuração do banco de dados
│  ├─ schema.sql         # Definição de tabelas PostgreSQL
│  └─ db.ts              # Configuração da conexão com o banco
│
├─ services/              # Serviços da aplicação
│  └─ authService.ts     # Lógica de autenticação e estatísticas
│
├─ routes/                # Rotas da API REST
│  └─ authRoutes.ts      # Endpoints de autenticação
│
├─ scripts/               # Scripts auxiliares
│  └─ init-db.sh         # Script para inicializar banco de dados
│
├─ dist/                  # Código JavaScript compilado do servidor
│  ├─ game-server.js
│  ├─ game/
│  ├─ database/
│  ├─ services/
│  └─ routes/
│
├─ public/                # Lado cliente (front-end)
│  ├─ index.html         # Página principal do jogo
│  ├─ auth.html          # Página de login/registro
│  ├─ style.css          # Estilos do jogo
│  ├─ auth-style.css     # Estilos da autenticação
│  ├─ auth.js            # JavaScript da autenticação
│  ├─ game.ts            # Código TypeScript do cliente
│  └─ dist/              # Código JavaScript compilado do cliente
│     └─ game.js
│
├─ nginx/                 # Configuração Nginx para proxy reverso
│  ├─ default.conf
│  └─ Dockerfile
```

---

## Docker e Docker Compose

O projeto já vem preparado para rodar em containers.

### 1. Imagem do app Node

O arquivo `dockerfile` na raiz contém algo como:

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig*.json ./
COPY game-server.ts ./
COPY game ./game
COPY public ./public
RUN npm run build
RUN npm prune --production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/game-server.js"]
```

**Build da imagem:**

```bash
docker build -t multiplayer-soccer-app -f dockerfile .
```

**Rodar o container (sem Nginx):**

```bash
docker run --rm -p 3000:3000 --name multiplayer-soccer-app multiplayer-soccer-app
```

Acesse em:

- `http://localhost:3000`

### 2. Docker Compose (app + Nginx)

O arquivo `docker-compose.yml` define dois serviços:

- `app`: imagem `multiplayer-soccer-app:latest`
- `nginx`: imagem `multiplayer-soccer-nginx:latest`, expondo porta **80** e fazendo proxy para `app:3000`.

Fluxo típico:

1. Build da imagem do app:

	 ```bash
	 docker build -t multiplayer-soccer-app -f dockerfile .
	 ```

2. Build da imagem do Nginx (dentro da pasta `nginx/`):

	 ```bash
	 cd nginx
	 docker build -t multiplayer-soccer-nginx .
	 cd ..
	 ```

3. Subir tudo com Docker Compose (na raiz do projeto):

	 ```bash
	 docker compose up
	 # ou
	 docker-compose up
	 ```

4. Acessar no navegador:

	 - `http://localhost` (porta 80 → Nginx → app:3000)

---

## Deploy em Produção (AWS EC2 + Nginx)

1. **Sem Docker**:
	 - Node.js + npm instalados direto na EC2.
	 - PM2 para gerenciar o processo (`pm2 start game-server.js`).
	 - Nginx como proxy reverso, escutando na porta 80 e encaminhando para `localhost:3000`.

2. **Com Docker**:
	 - Container com o app Node.
	 - (Opcional) Container com Nginx na frente.
	 - Opções para:
		 - Enviar somente a imagem `.tar` (via `docker save` / `docker load`).
		 - Ou enviar apenas arquivos necessários (`Dockerfile`, `docker-compose.yml` etc.).

É recomendável **ler esse guia** quando for fazer deploy real, pois ele também explica:

- Configuração de **Security Groups** (liberando portas 80/3000).
- Boas práticas de não enviar o projeto inteiro para a EC2 sem necessidade.
- Rotinas de start/stop, logs e troubleshooting.

---

## Variáveis de Ambiente

### Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=football_db
DB_USER=postgres
DB_PASSWORD=postgres

# Configuração JWT (MUDE ESTE SECRET EM PRODUÇÃO! Consulte a seção de Segurança abaixo para gerar um secret forte com o comando crypto.)
JWT_SECRET=your-secure-jwt-secret-here # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" Gera um secrete forte

# Porta do servidor
PORT=3000
```

### Instalação do `dotenv`

```bash
npm install dotenv
```

Carregue as variáveis no início do seu arquivo principal:

```typescript
import 'dotenv/config';
// resto do código...
```

### Variáveis Principais

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DB_HOST` | `localhost` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `football_db` | Nome do banco de dados |
| `DB_USER` | `postgres` | Usuário do PostgreSQL |
| `DB_PASSWORD` | `postgres` | Senha do PostgreSQL |
| `JWT_SECRET` | (obrigatório) | Chave secreta para assinar tokens JWT |
| `PORT` | `3000` | Porta do servidor Node |

### ⚠️ Segurança

- **NUNCA** versione o arquivo `.env` no Git
- Adicione `.env` ao `.gitignore`
- Em produção, use senhas fortes e chaves JWT geradas aleatoriamente
- Gerar JWT_SECRET seguro: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Exemplos de Uso

```bash
# Rodar localmente (usa valores do .env)
npm start

# Rodar em outra porta
PORT=4000 npm start

# Com Docker Compose (lê variáveis do .env)
docker-compose up
```

---

## 🔐 Relatório de Segurança

Este projeto implementa boas práticas de segurança. Consulte o arquivo [SECURITY_REPORT.md](SECURITY_REPORT.md) para:

- **Análise de SQL Injection**: Status ✅ SEGURO (prepared statements)
- **Autenticação JWT**: Implementação segura com expiração
- **Criptografia de Senha**: bcryptjs com 10 salt rounds
- **Variáveis de Ambiente**: Separação de credenciais sensíveis
- **Checklist de Produção**: Guia completo para deploy em AWS EC2
- **Geração de Chaves Seguras**: Como criar JWT_SECRET e senhas fortes
- **Configuração Docker**: Segurança em desenvolvimento vs produção

### Resumo de Riscos Mitigados

| Risco | Status |
|-------|--------|
| SQL Injection | ✅ Mitigado (prepared statements) |
| Senha padrão em produção | ⚠️ Precisa configuração |
| JWT Secret exposto | ✅ Corrigido (leitura de `.env`) |
| Porta do banco exposta | ⚠️ Remover em produção |
| `.env` versionado | ✅ Prevenido (`.gitignore`) |

Para mais detalhes, **[leia o relatório completo](SECURITY_REPORT.md)**.

---

## Roteiro de Desenvolvimento Futuro

Algumas ideias de evolução do projeto:

- Sistema de autenticação / login simples (apelidos persistentes).
- Ranking de jogadores (gols, vitórias, partidas jogadas).
- Sala de espera / lobby antes de entrar nos jogos.
- Modo espectador.
- Suporte a dispositivos móveis (controles touch).
- Efeitos visuais e sonoros mais elaborados.
- Testes automatizados para módulos de jogo (game loop, colisões, etc.).

---

## Licença

Este projeto está licenciado sob a licença **ISC** (ver campo `license` em `package.json`).  
Adapte o texto da licença conforme necessário para o uso que você pretende.
