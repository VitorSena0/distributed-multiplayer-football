# Multiplayer Soccer

Jogo de futebol **multiplayer 2D em tempo real** construído com **Spring Boot**, **WebSocket** e **Java 17**.  
O servidor simula a física básica do jogo (movimentação, colisão jogador x bola, cantos, gols) e transmite o estado oficial para todos os clientes conectados, garantindo que todos vejam a mesma partida.

> **📝 Nota sobre Refatoração**: Este projeto foi completamente refatorado de TypeScript/Node.js para Java/Spring Boot para melhorar a escalabilidade, desempenho e manutenibilidade do código. Toda a lógica do jogo foi portada para Java com tipagem estática e arquitetura Spring.

---

## 🎮 Visão Geral

O Multiplayer Soccer é um jogo de futebol top‑down onde vários jogadores controlam seus bonecos em **tempo real** pela web.

O servidor Spring Boot é responsável por:
- Gerenciar **salas de jogo** independentes
- Balancear e manter **times vermelho e azul**
- Rodar o **game loop** (atualização de posições, colisões, placar)
- Controlar o **temporizador da partida** e o fluxo de início/fim/reinício
- Enviar para cada cliente o **estado oficial** da partida (snapshot do jogo)

---

## 🛠️ Tecnologias Utilizadas

### Servidor
- **Java 17**
- **Spring Boot 3.2.1**
- **WebSocket (STOMP)**
- **Maven**
- **Spring Data JPA**
- **Lombok**

### Cliente
- **HTML5**
- **CSS3**
- **JavaScript/TypeScript**
- **Canvas API**

### Banco de Dados (futuro)
- **PostgreSQL 13+**
- **Hibernate/JPA**

---

## 📋 Pré-requisitos

Para rodar localmente:
- **Java 17+**
- **Maven 3.6+**
- Porta **TCP 3000** liberada (configurável em `application.properties`)
- (Opcional) **PostgreSQL** para persistência futura

---

## 🚀 Instalação e Execução Local

Na raiz do projeto:

```bash
# Compilar o projeto
mvn clean compile

# Executar o servidor
mvn spring-boot:run
```

Ou para executar o JAR compilado:

```bash
# Criar o arquivo JAR
mvn clean package

# Executar o JAR
java -jar target/multiplayer-soccer-0.0.1-SNAPSHOT.jar
```

O servidor escuta na porta **3000** por padrão.

Abra no navegador:
- `http://localhost:3000`

---

## 🏠 Salas, Times e Balanceamento

A lógica de salas está em `RoomManagerService`:

- Cada sala comporta até **6 jogadores simultâneos** (`MAX_PLAYERS_PER_ROOM`)
- Ao acessar o jogo, o servidor:
  - Procura uma sala disponível com vagas
  - Caso não encontre, **cria uma nova** (`room-1`, `room-2`, ...)
- Para entrar em uma sala específica, use o parâmetro `room` na URL:
  - `http://localhost:3000/?room=amigos`

### Balanceamento de Times
- Jogadores são automaticamente alocados ao time com menos membros
- Times são rebalanceados quando jogadores entram/saem

---

## ⚽ Recursos do Jogo

- ✅ Movimentação de jogadores em tempo real
- ✅ Física de bola (velocidade, atrito, colisões)
- ✅ Detecção de gols
- ✅ Sistema de pontuação (placar)
- ✅ Temporizador de partida (60 segundos)
- ✅ Colisão com paredes e cantos
- ✅ Sistema de salas múltiplas
- ✅ Balanceamento automático de times
- ✅ Reinício de partida

---

## 📁 Estrutura do Projeto

```text
distributed-multiplayer-football/
├─ src/
│  ├─ main/
│  │  ├─ java/com/sd/multiplayer_soccer/
│  │  │  ├─ config/               # Configurações Spring (WebSocket, Scheduler)
│  │  │  ├─ constants/            # Constantes do jogo
│  │  │  ├─ entity/               # Entidades JPA (PlayerEntity)
│  │  │  ├─ model/                # Modelos de dados (Player, Ball, Room, etc.)
│  │  │  ├─ service/              # Lógica de negócio
│  │  │  │  ├─ BallService        # Física da bola
│  │  │  │  ├─ GameLoopService    # Loop principal do jogo
│  │  │  │  ├─ MatchService       # Controle de partidas
│  │  │  │  └─ RoomManagerService # Gerenciamento de salas
│  │  │  ├─ websocket/            # Handlers WebSocket
│  │  │  └─ MultiplayerSoccerApplication.java
│  │  └─ resources/
│  │     ├─ application.properties # Configurações da aplicação
│  │     ├─ static/                # Arquivos estáticos
│  │     └─ templates/             # Templates
│  └─ test/                        # Testes unitários
├─ public/                         # Cliente HTML/CSS/JS (atual)
│  ├─ index.html
│  ├─ style.css
│  └─ game.ts
├─ pom.xml                         # Configuração Maven
└─ README.md
```

---

## 🎯 Backend (Servidor de Jogo)

### Ponto de Entrada
`MultiplayerSoccerApplication.java` - Inicializa a aplicação Spring Boot

### Componentes Principais

#### Schedulers (60 FPS)
- `runGameLoops()` - Executa o game loop em todas as salas (~60 FPS)
- `handleTimers()` - Atualiza temporizadores a cada segundo

#### Services
- **RoomManagerService**: Criação, alocação e limpeza de salas
- **MatchService**: Controle de partidas, balanceamento de times
- **BallService**: Física da bola, colisões com cantos
- **GameLoopService**: Loop principal com física e detecção de colisões

#### WebSocket
- **GameWebSocketHandler**: Gerencia conexões, desconexões e inputs dos jogadores
- **WebSocketConfig**: Configuração STOMP para comunicação bidirecional

---

## 🗄️ Banco de Dados

### Entidades JPA (Estrutura Futura)

A aplicação está preparada para persistência de dados no futuro:

#### PlayerEntity
Armazenará estatísticas dos jogadores:
- `username` - Nome do jogador (único)
- `password` - Senha para login
- `goalsScored` - Número de gols marcados
- `wins` - Vitórias conquistadas
- `draws` - Empates
- `losses` - Derrotas
- `createdAt` / `updatedAt` - Timestamps

### Configuração
Edite `src/main/resources/application.properties` para conectar ao PostgreSQL:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/multiplayer_soccer
spring.datasource.username=postgres
spring.datasource.password=postgres
```

---

## 🎮 Front-end (Cliente)

Os arquivos estão em `public/`:
- `index.html` - Página principal
- `style.css` - Estilos do jogo
- `game.ts` - Lógica do cliente (será refatorado para React)

### Funcionalidades do Cliente
- Renderização do campo, jogadores e bola
- Captura de inputs (WASD/Setas)
- Exibição de placar e cronômetro
- Conexão WebSocket com o servidor

---

## 🚀 Próximos Passos

- [ ] Refatorar frontend para React
- [ ] Implementar autenticação de jogadores
- [ ] Persistir estatísticas no PostgreSQL
- [ ] Adicionar sistema de ranking
- [ ] Implementar chat em tempo real
- [ ] Adicionar power-ups e habilidades especiais
- [ ] Criar sistema de torneios
- [ ] Deploy em produção (AWS/Heroku)

---

## 📝 Licença

Este projeto está sob licença livre para uso educacional.

---

## 👥 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
