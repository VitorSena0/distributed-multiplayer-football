# Documento Técnico — Multiplayer Soccer

**Disciplina:** Sistemas Distribuídos  
**Universidade:** Universidade Federal de Sergipe (UFS)  
**Data:** 25/01/2026  
**Participantes:** Vitor Leonardo, Nicolas Matheus, João Pedro  

---

## 1. Apresentação do Projeto
O Multiplayer Soccer é um jogo de futebol 2D em tempo real, acessado pelo navegador, que demonstra uma arquitetura distribuída com comunicação cliente-servidor, persistência e consistência de dados. O servidor executa a lógica principal do jogo e mantém o estado autoritativo da partida, garantindo que todos os jogadores vejam a mesma evolução do jogo.

---

## 2. Requisitos Técnicos Atendidos

### 2.1 Arquitetura Distribuída
- **Modelo cliente-servidor** com servidor autoritativo.
- O servidor executa o **game loop** (60 FPS) e o **timer** (1 Hz) para coordenar a partida.
- **Containerização** com Docker/Compose, separando app, banco, cache e proxy.
- A arquitetura pode evoluir para um **cluster**, mantendo a separação de responsabilidades entre serviços.

### 2.2 Comunicação em Rede
- **Socket.IO (WebSocket)** para atualização em tempo real do jogo.
- **Express + REST API** para autenticação, ranking e estatísticas.
- Tráfego TCP com upgrade WebSocket via Nginx.

### 2.3 Consistência de Dados
- **Consistência forte** no estado da partida: o servidor é a única fonte de verdade.
- **Consistência eventual** no ranking: cache Redis com fallback no Postgres.

### 2.4 Gerenciamento de Sessões
- Autenticação com **JWT** e senha hash (bcrypt).
- Modos: **registro, login e convidado**.
- **Salas (lobbies)** com até 6 jogadores e balanceamento entre times.

### 2.5 Tolerância a Falhas
- Tratamento de **desconexões** com remoção de jogador e reequilíbrio de times.
- Limpeza automática de salas vazias.
- Reconexão simples via novo login e entrada em sala.

### 2.6 Escalabilidade
- Suporte a **múltiplas salas simultâneas** por instância.
- **Redis ZSET** permite ranking eficiente.
- Banco com **pool de conexões**.
- Em cenário de cluster, a comunicação pode ser distribuída entre instâncias.

### 2.7 Persistência de Dados
- **PostgreSQL** armazena usuários, estatísticas e histórico.
- **Redis** mantém ranking e cache de usuários.
- Volumes Docker garantem dados persistentes.

### 2.8 Interface do Usuário
- Interface em **Canvas** com HUD, placar e cronômetro.
- Ranking global em tempo real.
- Feedback visual do jogador atual.

---

## 3. Implementação dos Requisitos Avançados (Parte 2)
- **Consistência:** servidor autoritativo garante sincronização em tempo real.
- **Tolerância a falhas:** desconexões tratadas sem interromper o jogo.
- **Persistência:** Postgres + Redis.
- **Escalabilidade:** arquitetura containerizada e preparada para cluster.

---

## 4. Testes e Validação (Parte 2)
- **Testes funcionais:**
  - Autenticação (login/registro/guest).
  - Criação de salas e balanceamento de times.
  - Sincronização de estado entre múltiplos clientes.
  - Registro de estatísticas ao fim da partida.
- **Testes de desempenho:**
  - Simulação de várias salas simultâneas.
  - Verificação de latência WebSocket.
  - Benchmark de ranking com Redis.

---

## 5. Entrega Final (Parte 2)
- Demonstração prática do jogo em funcionamento.
- Explicação técnica da arquitetura e decisões.
- Apresentação dos resultados de testes e validações.

---

## 6. Critérios de Avaliação (Barema)

### 6.1 Aspectos Técnicos
- Arquitetura distribuída: cliente-servidor + containers.
- Comunicação eficiente: WebSocket + REST.
- Tolerância a falhas: tratamento de desconexões.
- Persistência: PostgreSQL + Redis.
- Segurança: JWT, bcrypt e prepared statements.
- Escalabilidade: múltiplas salas e base para cluster.

### 6.2 Funcionalidade e Criatividade
- Jogo multiplayer sincronizado em tempo real.
- Mecânica simples, porém consistente, com placar e reinício de partida.
- Ranking global e stats salvas após partidas.

### 6.3 Documentação e Apresentação
- README detalhado.
- Documentos técnicos e roteiro de slides.
- Demonstração prática do sistema funcionando.

---

## 7. Como Executar (Resumo)
1. `npm install`
2. Configurar `.env`
3. `npm run build && npm start`
4. Acessar `http://localhost:3000`

Para ambiente completo: `docker compose up`.

---

## 8. Conclusão
O Multiplayer Soccer atende aos requisitos da disciplina ao combinar comunicação em tempo real, persistência, consistência e tolerância a falhas dentro de uma arquitetura distribuída. O projeto está pronto para apresentação e demonstração, com documentação clara e base para evolução futura.

