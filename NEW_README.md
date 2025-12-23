# Multiplayer Soccer - Java Spring Boot + React

Este projeto foi refatorado de TypeScript/Node.js para Java Spring Boot (backend) e React (frontend).

## Estrutura do Projeto

```
├── backend/                # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sd/multiplayer_soccer/
│   │   │   │   ├── config/         # Configurações (WebSocket, etc)
│   │   │   │   ├── entity/         # Entidades JPA (para uso futuro)
│   │   │   │   ├── model/          # Modelos do jogo
│   │   │   │   ├── service/        # Lógica de negócio
│   │   │   │   └── websocket/      # Handlers WebSocket
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/       # WebSocket e lógica do jogo
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml      # Orquestração de todos os serviços
```

## Tecnologias Utilizadas

### Backend
- Java 21
- Spring Boot 3.2.1
- Spring WebSocket (STOMP)
- Spring Data JPA
- PostgreSQL
- Lombok

### Frontend
- React 18
- TypeScript
- Vite
- STOMP.js (WebSocket client)
- SockJS

### Infraestrutura
- Docker
- Docker Compose
- Nginx (como proxy reverso no frontend)
- PostgreSQL

## Modelos de Dados (Preparados para Uso Futuro)

O projeto inclui entidades JPA prontas para armazenar:
- **PlayerEntity**: Nome do jogador, senha, gols, vitórias, empates, derrotas
- **MatchEntity**: Histórico de partidas

**Nota**: Atualmente, nenhum dado está sendo persistido no banco. As entidades estão apenas estruturadas para implementação futura.

## Executando o Projeto

### Usando Docker Compose (Recomendado)

1. Certifique-se de ter Docker e Docker Compose instalados
2. Na raiz do projeto, execute:

```bash
docker-compose up --build
```

3. Acesse o jogo em: http://localhost

### Desenvolvimento Local

#### Backend

```bash
cd backend
./mvnw spring-boot:run
```

O backend estará disponível em: http://localhost:8080

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:3000

## Como Jogar

1. Acesse http://localhost (ou http://localhost:3000 em desenvolvimento)
2. Você será automaticamente alocado em uma sala
3. Use as setas do teclado para mover seu jogador
4. O jogo começa automaticamente quando houver jogadores nos dois times
5. Marque gols no gol adversário!
6. Após o término da partida, clique em "Jogar Novamente"

## Lógica do Jogo

Toda a lógica do jogo foi migrada de TypeScript para Java:

- **GameLoopService**: Loop principal do jogo (60 FPS)
- **BallService**: Física da bola e colisões com cantos
- **MatchService**: Gerenciamento de partidas, times e reinício
- **RoomManagerService**: Gerenciamento de salas
- **GameWebSocketHandler**: Comunicação WebSocket

## Arquitetura

O projeto segue uma arquitetura cliente-servidor:

1. **Backend (Spring Boot)**:
   - Gerencia o estado do jogo
   - Processa física e colisões
   - Coordena múltiplas salas de jogo
   - Comunica-se com clientes via WebSocket (STOMP)

2. **Frontend (React)**:
   - Renderiza o jogo no canvas
   - Captura entrada do jogador
   - Se comunica com backend via WebSocket
   - Atualiza UI em tempo real

3. **Infraestrutura**:
   - Nginx serve o frontend e proxy para backend
   - PostgreSQL preparado para persistência futura
   - Docker Compose orquestra todos os serviços

## Próximos Passos

- [ ] Implementar autenticação de jogadores
- [ ] Ativar persistência de dados (estatísticas, histórico)
- [ ] Adicionar sistema de ranking
- [ ] Implementar chat entre jogadores
- [ ] Adicionar power-ups e variações de jogo
- [ ] Melhorar UI/UX do frontend
- [ ] Adicionar testes automatizados

## Licença

Este projeto é para fins educacionais.
