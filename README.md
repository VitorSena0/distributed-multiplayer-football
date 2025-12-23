# Multiplayer Soccer - Professional Edition

Jogo de futebol **multiplayer 2D em tempo real** construído com **React**, **Node.js**, **Express**, **Socket.IO** e **TypeScript**.  
O servidor simula a física básica do jogo (movimentação, colisão jogador x bola, cantos, gols) e transmite o estado oficial para todos os clientes conectados, garantindo que todos vejam a mesma partida.

> **✨ Nova Interface**: O jogo agora conta com uma interface moderna e profissional construída com React, apresentando design responsivo, gradientes elegantes, animações suaves e uma experiência de usuário aprimorada.

> **📝 Nota sobre TypeScript**: Este projeto utiliza TypeScript em todo o stack (frontend e backend) para melhorar a manutenibilidade do código e proporcionar uma melhor experiência de desenvolvimento com tipagem estática.

---

## Demonstração Visual

### Interface Moderna e Profissional
![Multiplayer Soccer - Loading Screen](https://github.com/user-attachments/assets/b612a349-02f7-4853-9feb-3361e62cc3ad)
*Tela de carregamento com design moderno e gradientes elegantes*

![Multiplayer Soccer - Gameplay](https://github.com/user-attachments/assets/f0c07c1e-f57f-4bd5-9d7e-59d496da6bc4)
*Jogo em ação com 2 jogadores conectados*

---

## Índice

- [Multiplayer Soccer](#multiplayer-soccer)
  - [Índice](#índice)
  - [Visão Geral](#visão-geral)
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

O cliente web (HTML/Canvas/JS) renderiza o campo, jogadores, bola, placar e cronômetro, além de enviar os comandos de input (setas/WASD, etc.) para o servidor via Socket.IO.

---

## Demonstração

Exemplos de deploy já usados (podem não estar ativos no momento):

- Render: `https://multiplayer-soccer.onrender.com`
- Histórico de endpoints úteis (ngrok / IPs de testes):
	- `191.34.226.49`
	- `https://4726-2804-1b1-1293-7fcc-2167-4b14-41da-1f38.ngrok-free.app`

Para testar localmente, veja a seção [Instalação e Execução Local](#instalação-e-execução-local).

---

## Arquitetura

- **Node.js + Express**: servidor HTTP responsável por expor uma API mínima e servir os arquivos estáticos do cliente React.
- **React + TypeScript**: interface moderna e componentizada com hooks personalizados para gerenciar estado e comunicação Socket.IO.
- **Vite**: ferramenta de build rápida e moderna para o frontend React.
- **Socket.IO**: canal de comunicação em tempo real entre cliente e servidor, usado para:
	- Enviar inputs do jogador para o servidor.
	- Receber o estado atualizado do jogo (posição de jogadores, bola, placar, timer).
- **Game Loop no servidor**:
	- Roda a **60 FPS** (`setInterval` a cada `1000 / 60` ms).
	- Atualiza física básica: velocidade, posições, colisões, limites de campo, gol, cantos etc.
- **Timer de partida**:
	- Atualizado a cada 1 segundo.
	- Emite eventos de início, atualização de cronômetro e fim de partida.

### Design Moderno
- **Gradientes e Sombras**: Interface com gradientes elegantes e sombras profissionais
- **Animações Suaves**: Transições e animações CSS para melhor UX
- **Tipografia Aprimorada**: Uso da fonte Inter para melhor legibilidade
- **Componentes Reutilizáveis**: Arquitetura React com componentes modulares
- **Responsivo**: Adaptado para desktop e dispositivos móveis

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
- **Frontend**:
	- React 19
	- TypeScript
	- Vite (build tool)
	- Socket.IO Client
	- HTML5 Canvas
	- CSS3 (com variáveis CSS e animações)
	- Google Fonts (Inter)
- **Servidor**:
	- Node.js 18+
	- Express 5
	- Socket.IO
	- TypeScript
	- CSS3
	- TypeScript (compilado para JavaScript)
	- Canvas / DOM
- **Infra / Deploy**:
	- Docker / Docker Compose
	- Nginx (como proxy reverso)
	- AWS EC2 (exemplo de ambiente de produção)
	- ngrok (para tunel HTTP em desenvolvimento remoto)

---

## Pré-requisitos

Para rodar **localmente**:

- **Node.js 18+** e **npm**
- Porta **TCP 3000** liberada (ou configure outra via variável `PORT`)

Para usar **Docker**:

- Docker instalado e em execução
- (Opcional) Docker Compose

Para seguir o guia de deploy na **AWS EC2**:

- Conta AWS
- Instância EC2 (Ubuntu ou Amazon Linux recomendados)
- Acesso SSH

---

## Instalação e Execução Local

Na raiz do projeto:

```bash
# Instalar dependências
npm install

# Compilar o TypeScript
npm run build

# Executar o servidor
npm run start
```

Ou para desenvolvimento:

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (com ts-node)
npm run dev
```

O servidor, por padrão, escuta em `PORT` (se definida) ou `3000`.

Abra no navegador:

- `http://localhost:3000`

O front-end é servido automaticamente a partir da pasta `public/`.

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

O frontend foi completamente reconstruído com React para proporcionar uma experiência moderna e profissional:

### Estrutura React

- `src/` — código-fonte do frontend React
  - `components/` — componentes React
    - `Game.tsx` — componente principal que orquestra o jogo
    - `GameCanvas.tsx` — renderização do campo usando Canvas com gradientes e sombras
    - `GameUI.tsx` — overlay de UI (sala, aguardando jogadores, vencedor)
    - `HUD.tsx` — HUD inferior com ping, cronômetro e placar
    - `PlayerIDs.tsx` — labels de ID dos jogadores
    - `MobileControls.tsx` — controles touch para dispositivos móveis
  - `hooks/` — hooks personalizados
    - `useSocket.ts` — gerenciamento da conexão Socket.IO e estado do jogo
  - `types/` — definições de tipos TypeScript
  - `config/` — configurações do jogo
  - `styles/` — estilos CSS modernos com variáveis CSS
  - `index.html` — página HTML principal
  - `main.tsx` — ponto de entrada do React

### Build
- O frontend é compilado com **Vite** para `public/dist/`
- A build gera assets otimizados com hash para cache-busting
- O servidor Express serve os arquivos estáticos da pasta `public/dist/`

### Funcionalidades da Interface
- **Design Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Loading Screen**: Tela de carregamento animada
- **HUD Moderno**: Informações do jogo com design limpo e profissional
- **Animações Suaves**: Transições e animações CSS
- **Controles Mobile**: Joystick virtual para dispositivos touch
- **Campo Aprimorado**: Renderização com gradientes, sombras e texturas
- **Player Highlighting**: Destaque visual do jogador atual
- **Ping Display**: Indicador de latência com cores baseadas na qualidade

---

## Backend (servidor de jogo)

Ponto de entrada: `game-server.ts` (compilado para `dist/game-server.js`).

Responsabilidades principais:

- Criar o servidor HTTP (`http.createServer(app)`).
- Plugar o Socket.IO (`const io = new SocketIOServer(server, { ... })`).
- Servir arquivos estáticos da pasta `public/dist/` via Express (build do React).
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
├─ docker-compose.yml     # Compose para subir app + nginx
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
├─ dist/                     # Código JavaScript compilado do servidor
│  ├─ game-server.js
│  └─ game/
│
├─ src/                      # Código-fonte do frontend React
│  ├─ components/            # Componentes React
│  │  ├─ Game.tsx
│  │  ├─ GameCanvas.tsx
│  │  ├─ GameUI.tsx
│  │  ├─ HUD.tsx
│  │  ├─ MobileControls.tsx
│  │  └─ PlayerIDs.tsx
│  ├─ hooks/                 # Hooks personalizados
│  │  └─ useSocket.ts
│  ├─ types/                 # Tipos TypeScript
│  │  └─ game.ts
│  ├─ config/                # Configurações
│  │  └─ gameConfig.ts
│  ├─ styles/                # Estilos CSS
│  │  └─ game.css
│  ├─ App.tsx                # Componente principal
│  ├─ main.tsx               # Ponto de entrada React
│  └─ index.html             # HTML base
│
├─ public/                   # Arquivos servidos pelo servidor
│  └─ dist/                  # Build do React (gerado pelo Vite)
│     ├─ index.html
│     └─ assets/
│        ├─ main-*.js
│        └─ main-*.css
│
├─ nginx/                    # Configuração Nginx para proxy reverso
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

Variáveis utilizadas:

- `PORT`:
	- Porta na qual o servidor Node/Express/Socket.IO irá escutar.
	- Padrão: `3000` se não definido.

Exemplos:

```bash
# Rodar em outra porta localmente
PORT=4000 node game-server.js

# Com Docker
docker run --rm -e PORT=3000 -p 3000:3000 multiplayer-soccer-app
```

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
