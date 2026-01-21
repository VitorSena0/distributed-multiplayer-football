import React, { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="App">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content animate-on-scroll">
            <h1 className="main-title">Multiplayer Soccer</h1>
            <h2 className="subtitle">Sistema Distribuído de Jogo em Tempo Real</h2>
            <div className="tech-stack">
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Socket.IO</span>
              <span className="tech-badge">PostgreSQL</span>
              <span className="tech-badge">Docker</span>
              <span className="tech-badge">Nginx</span>
            </div>
            <p className="hero-description">
              Jogo de futebol multiplayer 2D em tempo real com arquitetura distribuída, 
              suporte para até 6 jogadores por sala e sincronização em 60 FPS
            </p>
          </div>
          <div className="screenshot-placeholder hero-screenshot animate-on-scroll">
            <div className="placeholder-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Screenshot do Jogo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="section challenges-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Desafios de Sistemas Distribuídos</h2>
          <div className="challenges-grid">
            <div className="challenge-card animate-on-scroll">
              <div className="icon">⚡</div>
              <h3>Sincronização em Tempo Real</h3>
              <p>60 FPS de atualização com latência &lt; 50ms</p>
            </div>
            <div className="challenge-card animate-on-scroll">
              <div className="icon">🔄</div>
              <h3>Comunicação de Baixa Latência</h3>
              <p>WebSocket via Socket.IO para troca bidirecional</p>
            </div>
            <div className="challenge-card animate-on-scroll">
              <div className="icon">💾</div>
              <h3>Persistência Distribuída</h3>
              <p>PostgreSQL com garantias ACID</p>
            </div>
            <div className="challenge-card animate-on-scroll">
              <div className="icon">🛡️</div>
              <h3>Tolerância a Falhas</h3>
              <p>Reconexão automática e recuperação de estado</p>
            </div>
            <div className="challenge-card animate-on-scroll">
              <div className="icon">📈</div>
              <h3>Escalabilidade</h3>
              <p>Arquitetura preparada para cluster horizontal</p>
            </div>
            <div className="challenge-card animate-on-scroll">
              <div className="icon">🔐</div>
              <h3>Segurança</h3>
              <p>JWT, bcrypt e proteção contra SQL injection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="section architecture-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Arquitetura Distribuída</h2>
          
          <div className="architecture-content animate-on-scroll">
            <h3 className="subsection-title">Visão Geral do Sistema</h3>
            <div className="architecture-diagram">
              <pre className="diagram-code">{`
┌─────────────────────────────────────────────────────┐
│              CAMADA DE CLIENTES                     │
│  [Browser 1] [Browser 2] ... [Browser N]            │
└────────────────────┬────────────────────────────────┘
                     │ WebSocket/HTTP
┌────────────────────▼────────────────────────────────┐
│           NGINX (Porta 80)                          │
│  • Proxy Reverso                                    │
│  • Load Balancer                                    │
│  • Terminação SSL                                   │
│  • Suporte WebSocket (Upgrade headers)              │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│      SERVIDOR NODE.JS (Porta 3000)                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ Game Loop (60 FPS)                           │   │
│  │ • Física do jogo                             │   │
│  │ • Detecção de colisões                       │   │
│  │ • Lógica de gols e placar                    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ Socket.IO Server                             │   │
│  │ • Gerenciamento de salas                     │   │
│  │ • Broadcasting de estado                     │   │
│  │ • Sincronização de clientes                  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ API REST (Express)                           │   │
│  │ • Autenticação (JWT)                         │   │
│  │ • Estatísticas                               │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ TCP/IP
┌────────────────────▼────────────────────────────────┐
│      POSTGRESQL 17 (Porta 5432)                     │
│  • Dados de usuários (bcrypt)                       │
│  • Estatísticas de jogadores                        │
│  • Ranking global                                   │
│  • ACID compliance                                  │
└─────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          </div>

          <div className="architecture-content animate-on-scroll">
            <h3 className="subsection-title">Microsserviços em Containers</h3>
            <div className="microservices-grid">
              <div className="service-card">
                <h4>🌐 Nginx</h4>
                <ul>
                  <li>Proxy reverso</li>
                  <li>Load balancer</li>
                  <li>Porta 80 exposta</li>
                  <li>Suporte WebSocket</li>
                </ul>
              </div>
              <div className="service-card">
                <h4>⚙️ App Node.js</h4>
                <ul>
                  <li>Servidor de jogo</li>
                  <li>Game loop 60 FPS</li>
                  <li>Socket.IO + API REST</li>
                  <li>Porta 3000 interna</li>
                </ul>
              </div>
              <div className="service-card">
                <h4>🗄️ PostgreSQL</h4>
                <ul>
                  <li>Banco de dados</li>
                  <li>Volume persistente</li>
                  <li>Health checks</li>
                  <li>Porta 5432 interna</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="architecture-content animate-on-scroll">
            <h3 className="subsection-title">Servidor Autoritativo</h3>
            <div className="authority-model">
              <div className="model-description">
                <p>
                  <strong>Servidor = única fonte de verdade</strong><br/>
                  Toda a lógica de jogo é executada no servidor. Os clientes são apenas 
                  terminais de visualização e input. Isso garante consistência total entre 
                  todos os jogadores e previne trapaças.
                </p>
              </div>
              <div className="flow-diagram">
                <pre>{`
Cliente 1          SERVIDOR          Cliente 2
   │                  │                  │
   ├─► Input (WASD)   │                  │
   │             [AUTORIDADE]            │
   │          - Valida input             │
   │          - Simula física            │
   │          - Detecta colisões         │
   │          - Atualiza estado          │
   │                  │                  │
   │ ◄─ Estado ───────┼──── Estado ───► │
   │   (60 FPS)       │     (60 FPS)    │
                `}</pre>
              </div>
              <div className="benefits">
                <div className="benefit">🔒 Previne trapaças</div>
                <div className="benefit">🎯 Garante consistência</div>
                <div className="benefit">📊 Centraliza lógica</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Communication Section */}
      <section className="section communication-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Comunicação em Tempo Real</h2>
          
          <div className="comm-content animate-on-scroll">
            <div className="comm-features">
              <div className="feature-box">
                <h4>Protocolo: WebSocket + Socket.IO</h4>
                <ul>
                  <li>Full-duplex bidirecional</li>
                  <li>Latência típica: 30-50ms</li>
                  <li>Fallback HTTP long-polling</li>
                  <li>Reconexão automática</li>
                </ul>
              </div>
              <div className="feature-box">
                <h4>Frequência de Atualização</h4>
                <ul>
                  <li>Game state: 60 updates/segundo</li>
                  <li>Timer: 1 update/segundo</li>
                  <li>Eventos: sob demanda</li>
                  <li>Broadcasting por sala</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="comm-content animate-on-scroll">
            <h3 className="subsection-title">Game Loop Distribuído (60 FPS)</h3>
            <div className="code-block">
              <pre>{`setInterval(() => {
  for (sala in salas) {
    // 1. Coletar inputs de todos os jogadores
    // 2. Atualizar posições (física)
    // 3. Detectar colisões (jogador-bola)
    // 4. Atualizar bola (velocidade, atrito)
    // 5. Verificar gols
    // 6. Construir snapshot do estado
    // 7. Broadcast para todos da sala
    io.to(sala.id).emit('update', gameState);
  }
}, 1000 / 60); // ~16.67ms`}</pre>
            </div>
            <p className="code-description">
              Cada sala é isolada e independente, facilitando escalabilidade natural.
            </p>
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="section infrastructure-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Infraestrutura e Escalabilidade</h2>
          
          <div className="infra-content animate-on-scroll">
            <h3 className="subsection-title">Gerenciamento de Salas</h3>
            <div className="rooms-info">
              <div className="info-card">
                <h4>Capacidade por Sala</h4>
                <p className="big-number">6</p>
                <p>jogadores simultâneos</p>
              </div>
              <div className="info-card">
                <h4>Times Balanceados</h4>
                <p>Red vs Blue</p>
                <p>Alocação automática</p>
              </div>
              <div className="info-card">
                <h4>Salas Customizadas</h4>
                <p>Via URL</p>
                <p>Jogar com amigos</p>
              </div>
            </div>
          </div>

          <div className="infra-content animate-on-scroll">
            <h3 className="subsection-title">Tolerância a Falhas</h3>
            <div className="fault-tolerance">
              <div className="ft-item">
                <div className="ft-number">1</div>
                <div className="ft-text">
                  <strong>Detecção de Desconexão</strong>
                  <p>Socket.IO detecta automaticamente via evento disconnect</p>
                </div>
              </div>
              <div className="ft-item">
                <div className="ft-number">2</div>
                <div className="ft-text">
                  <strong>Limpeza de Estado</strong>
                  <p>Remove jogador, notifica outros, libera recursos</p>
                </div>
              </div>
              <div className="ft-item">
                <div className="ft-number">3</div>
                <div className="ft-text">
                  <strong>Reconexão Automática</strong>
                  <p>Exponential backoff, estado completo em init</p>
                </div>
              </div>
            </div>
          </div>

          <div className="infra-content animate-on-scroll">
            <h3 className="subsection-title">Estratégias de Escalabilidade</h3>
            <div className="scalability-comparison">
              <div className="scale-column">
                <h4>Arquitetura Atual</h4>
                <div className="scale-diagram">
                  <pre>{`
[Nginx]
   ↓
[Node.js]
   ↓
[PostgreSQL]

Limite:
~100 salas
~600 jogadores
                  `}</pre>
                </div>
              </div>
              <div className="scale-arrow">→</div>
              <div className="scale-column">
                <h4>Cluster Horizontal</h4>
                <div className="scale-diagram">
                  <pre>{`
[Load Balancer]
    ↓
┌───┴───┬────┐
│       │    │
Node1 Node2 Node3
└───┬───┴────┘
    ↓
  [Redis]
    ↓
[PostgreSQL]

Capacidade:
~300 salas
~1800 jogadores
                  `}</pre>
                </div>
              </div>
            </div>
            <div className="scale-features">
              <div className="scale-feature">Socket.IO Redis Adapter</div>
              <div className="scale-feature">Sticky Sessions</div>
              <div className="scale-feature">Sharding por Sala</div>
              <div className="scale-feature">PostgreSQL Replica Set</div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="section security-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Segurança e Consistência</h2>
          
          <div className="security-content animate-on-scroll">
            <h3 className="subsection-title">Camadas de Segurança</h3>
            <div className="security-layers">
              <div className="security-layer">
                <h4>🔐 Autenticação</h4>
                <ul>
                  <li>bcrypt (10 salt rounds)</li>
                  <li>JWT (HMAC SHA256)</li>
                  <li>Tokens com expiração</li>
                  <li>Sessão única por usuário</li>
                </ul>
              </div>
              <div className="security-layer">
                <h4>🛡️ Proteção de Dados</h4>
                <ul>
                  <li>Queries parametrizadas</li>
                  <li>Sanitização de inputs</li>
                  <li>Anti-SQL injection</li>
                  <li>PostgreSQL não exposto</li>
                </ul>
              </div>
              <div className="security-layer">
                <h4>🔒 Infraestrutura</h4>
                <ul>
                  <li>Variáveis em .env</li>
                  <li>Nginx como proxy</li>
                  <li>SSL/TLS em produção</li>
                  <li>Health checks</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="security-content animate-on-scroll">
            <h3 className="subsection-title">Consistência de Dados</h3>
            <div className="consistency-grid">
              <div className="consistency-card">
                <h4>Problema: Gol Duplicado</h4>
                <p><strong>Solução:</strong> Cooldown de 1s + flag no servidor</p>
              </div>
              <div className="consistency-card">
                <h4>Problema: Sessão Múltipla</h4>
                <p><strong>Solução:</strong> Map&lt;userId, socketId&gt; + desconexão automática</p>
              </div>
              <div className="consistency-card">
                <h4>Problema: Reinício Assíncrono</h4>
                <p><strong>Solução:</strong> Set de playersReady, todos confirmam</p>
              </div>
              <div className="consistency-card">
                <h4>Problema: Estado Desatualizado</h4>
                <p><strong>Solução:</strong> Snapshot completo 60x/s</p>
              </div>
            </div>
            <div className="consistency-model">
              <strong>Modelo:</strong> Strong Consistency (Consistência Forte)
              <p>Servidor é a única fonte de verdade - sem conflitos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="section performance-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Performance e Métricas</h2>
          
          <div className="metrics-grid animate-on-scroll">
            <div className="metric-card">
              <div className="metric-value">60</div>
              <div className="metric-label">FPS Game Loop</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">30-50</div>
              <div className="metric-label">ms Latência</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">~100</div>
              <div className="metric-label">Salas Simultâneas</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">10-20</div>
              <div className="metric-label">KB/s por Jogador</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">&lt;5</div>
              <div className="metric-label">ms Query Ranking</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">6</div>
              <div className="metric-label">Jogadores por Sala</div>
            </div>
          </div>

          <div className="screenshot-placeholder large animate-on-scroll">
            <div className="placeholder-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Screenshot - Gameplay em Tempo Real</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="section tech-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Stack Tecnológico</h2>
          
          <div className="tech-categories animate-on-scroll">
            <div className="tech-category">
              <h3>Frontend</h3>
              <div className="tech-list">
                <span>HTML5 Canvas</span>
                <span>TypeScript</span>
                <span>CSS3</span>
                <span>Socket.IO Client</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Backend</h3>
              <div className="tech-list">
                <span>Node.js 20</span>
                <span>Express 5</span>
                <span>Socket.IO 4.8</span>
                <span>TypeScript 5.9</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Banco de Dados</h3>
              <div className="tech-list">
                <span>PostgreSQL 17</span>
                <span>pg Driver</span>
                <span>ACID Compliance</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Segurança</h3>
              <div className="tech-list">
                <span>bcryptjs</span>
                <span>jsonwebtoken</span>
                <span>dotenv</span>
              </div>
            </div>
            <div className="tech-category">
              <h3>Infraestrutura</h3>
              <div className="tech-list">
                <span>Docker</span>
                <span>Docker Compose</span>
                <span>Nginx</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="section requirements-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Requisitos Atendidos</h2>
          
          <div className="requirements-checklist animate-on-scroll">
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Arquitetura Distribuída</strong>
                <p>Cliente-servidor + microsserviços em cluster Docker</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Comunicação em Rede</strong>
                <p>TCP/WebSocket em tempo real via Socket.IO</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Consistência de Dados</strong>
                <p>Servidor autoritativo com strong consistency</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Gerenciamento de Sessões</strong>
                <p>JWT + autenticação + lobby com salas</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Tolerância a Falhas</strong>
                <p>Detecção, reconexão automática e health checks</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Escalabilidade</strong>
                <p>Salas isoladas, preparado para cluster horizontal</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Persistência de Dados</strong>
                <p>PostgreSQL com garantias ACID</p>
              </div>
            </div>
            <div className="req-item checked">
              <div className="check-icon">✓</div>
              <div className="req-text">
                <strong>Interface do Usuário</strong>
                <p>Feedback em tempo real com ranking e estatísticas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conclusion Section */}
      <section className="section conclusion-section">
        <div className="container">
          <h2 className="section-title animate-on-scroll">Conclusão e Trabalhos Futuros</h2>
          
          <div className="conclusion-content animate-on-scroll">
            <div className="conclusion-box">
              <h3>🎯 Principais Conquistas</h3>
              <ul>
                <li>Sistema distribuído completo e funcional</li>
                <li>Arquitetura em microsserviços containerizados</li>
                <li>Comunicação de baixa latência (30-50ms)</li>
                <li>Tolerância a falhas implementada</li>
                <li>Escalabilidade preparada para cluster</li>
                <li>100% dos requisitos técnicos atendidos</li>
              </ul>
            </div>
            
            <div className="conclusion-box">
              <h3>🚀 Próximos Passos</h3>
              <ul>
                <li>Implementar cluster Socket.IO com Redis</li>
                <li>Prometheus + Grafana para métricas</li>
                <li>Deploy multi-region para latência global</li>
                <li>Auto-scaling baseado em carga</li>
                <li>Distributed tracing com Jaeger</li>
                <li>Client-side prediction para suavização</li>
              </ul>
            </div>
          </div>

          <div className="screenshot-placeholder large animate-on-scroll">
            <div className="placeholder-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Screenshot - Ranking e Estatísticas</p>
            </div>
          </div>

          <div className="final-cta animate-on-scroll">
            <h3>Multiplayer Soccer</h3>
            <p>Sistema Distribuído de Jogo em Tempo Real</p>
            <div className="repo-link">
              <span>📦 GitHub: VitorSena0/distributed-multiplayer-football</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Trabalho de Sistemas Distribuídos</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
