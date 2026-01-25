# Roteiro de Slides — Multiplayer Soccer (Sistemas Distribuídos)

Documento de apoio para montar os **slides de apresentação** conforme o barema. Cada seção abaixo pode virar 1 ou mais slides.

---

## 1. Capa
- **Projeto:** Multiplayer Soccer (jogo de futebol 2D em tempo real)
- **Disciplina:** Sistemas Distribuídos
- **Universidade:** Universidade Federal de Sergipe (UFS)
- **Data:** 25/01/2026
- **Equipe:** Vitor Leonardo, Nicolas Matheus, João Pedro

---

## 2. Motivação e Objetivo
- Criar um jogo multiplayer em tempo real com **sincronização distribuída**.
- Explorar arquitetura cliente-servidor, comunicação em rede e persistência.
- Garantir experiência consistente entre vários jogadores simultâneos.

---

## 3. Visão Geral do Sistema
- **Cliente Web** (HTML/Canvas/TS) renderiza o jogo e envia inputs.
- **Servidor Node.js** mantém o estado oficial e distribui snapshots.
- **PostgreSQL** armazena usuários e estatísticas.
- **Redis** cacheia ranking global.
- **Nginx** como proxy reverso e entrada HTTP/WebSocket.

> Sugestão de slide: diagrama cliente → servidor → banco/cache.

---

## 4. Arquitetura Distribuída (Requisito)
- **Modelo cliente-servidor** com servidor autoritativo.
- O servidor executa o **game loop** (60 FPS) e o **timer** (1 Hz).
- **Serviços separados em contêineres** (app, banco, cache, proxy).
- **Microserviços na prática:** cada contêiner com responsabilidade única.
- Base pronta para escalar horizontalmente com múltiplas instâncias.

---

## 5. Comunicação em Rede
- **WebSocket (Socket.IO)** para trocas em tempo real.
  - Inputs dos jogadores → servidor.
  - Snapshots de estado → clientes.
- **REST API (Express)** para login, registro, ranking e stats.
- Tráfego sobre **TCP**, com upgrade WebSocket via Nginx.

---

## 6. Consistência de Dados
- **Servidor como fonte de verdade** (posições, placar, bola, timer).
- Estado atualizado em **broadcast** para todos da sala.
- **Consistência forte** no estado da partida (snapshot autoritativo).
- **Consistência eventual** no ranking (Redis cache + fallback Postgres).

---

## 7. Gerenciamento de Sessões
- **JWT** para autenticação e verificação de sessão.
- Modos de acesso: **login**, **registro** e **convidado**.
- **Salas/lobbies** com até 6 jogadores.
- Balanceamento automático entre times vermelho/azul.

---

## 8. Tolerância a Falhas
- Desconexões tratadas pelo servidor:
  - jogador removido da sala;
  - times reequilibrados;
  - loop continua sem interromper a partida.
- Limpeza automática de salas vazias.
- Reconexão via Socket.IO e retorno ao fluxo do jogo após reentrar.

---

## 9. Escalabilidade
- Várias salas simultâneas por processo.
- **Redis** para ranking com operações eficientes (ZSET).
- **Pool de conexões** no PostgreSQL.
- Em cluster: usar múltiplas instâncias e balanceador (roadmap).

---

## 10. Persistência de Dados
- **PostgreSQL**: usuários, estatísticas, histórico de partidas.
- **Redis**: ranking global e cache de usuários.
- Persistência em contêiner com volume (Docker).

---

## 11. Interface do Usuário
- Renderização em **Canvas**.
- HUD com placar e cronômetro.
- Ranking TOP 10 em tempo real.
- Feedback visual do jogador atual (destaque).

---

## 12. Requisitos Avançados (Parte 2)
- **Consistência:** servidor autoritativo + snapshots.
- **Tolerância a falhas:** tratamento de desconexões.
- **Persistência:** stats no Postgres + cache Redis.
- **Escalabilidade:** arquitetura containerizada e pronta para cluster.

---

## 13. Testes e Validação (Parte 2)
- **Testes funcionais** (manual):
  - login/registro/guest;
  - criação de salas;
  - jogo sincronizado entre múltiplas janelas;
  - registro de stats ao fim da partida.
- **Testes de desempenho** (sugeridos):
  - várias salas simultâneas;
  - latência e estabilidade do WebSocket;
  - stress de ranking com Redis.

---

## 14. Demonstração (Entrega Final)
- Subir stack com Docker Compose.
- Abrir múltiplas abas para simular jogadores.
- Mostrar:
  - autenticação;
  - partida em tempo real;
  - atualização de placar e ranking.

---

## 15. Critérios do Barema — Como Atendemos
- **Aspectos Técnicos:** arquitetura distribuída, comunicação eficiente, segurança e persistência.
- **Funcionalidade:** jogo real-time com salas e placar consistente.
- **Criatividade:** futebol multiplayer top‑down com ranking global.
- **Documentação/Apresentação:** README + documentos técnicos + slides.

---

## 16. Próximos Passos
- Escalar com Redis Adapter + balanceador.
- Observabilidade avançada (metrics e tracing).
- Testes automatizados de carga.

