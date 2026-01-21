# EXEMPLO DE PROMPT PARA IA GERAR SLIDES

## Como Usar este Documento

Este arquivo contém exemplos de prompts para usar com IAs como ChatGPT, Claude, ou outras ferramentas de geração de slides.

---

## 📝 PROMPT 1: Geração Completa de Slides

```
Preciso que você gere slides de apresentação profissional baseados no documento APRESENTACAO.md anexado.

CONTEXTO:
- Apresentação de 20-25 minutos sobre projeto de Sistemas Distribuídos
- Público: professor e colegas de faculdade (técnico)
- Projeto: Jogo multiplayer em tempo real com arquitetura distribuída
- Foco: Arquitetura, comunicação, tolerância a falhas, segurança e escalabilidade

REQUISITOS:
1. Gerar slides no formato [PowerPoint/Google Slides/Markdown]
2. Seguir a estrutura de seções do documento (9 seções principais)
3. Converter diagramas ASCII em visuais profissionais
4. Incluir syntax highlighting para código
5. Usar ícones e cores conforme sugerido no documento
6. Criar animações para diagramas (aparecer por camadas)
7. Manter timing de 20-25 minutos total

ESTILO:
- Design: Moderno e profissional
- Cores: Azul escuro (primária), Verde (positivo), Vermelho (alertas)
- Fontes: Sans-serif para títulos, monospace para código
- Layout: Título + 3-5 bullet points por slide

Por favor, comece pela Seção 1 (Introdução) e gere os primeiros 3 slides.
Após aprovação, continuaremos com as demais seções.
```

---

## 📝 PROMPT 2: Geração de Slides por Seção

**Para cada seção importante:**

```
Com base no documento APRESENTACAO.md, gere os slides da SEÇÃO 2: ARQUITETURA DISTRIBUÍDA.

Requisitos específicos:
- Slides 2.1 a 2.6 (total: 6 slides)
- Tempo total: 6 minutos (1 min por slide)
- Incluir todos os diagramas visuais
- Destacar que esta seção vale 15% da nota
- Usar bullets concisos e técnicos
- Incluir frases de impacto do GUIA_RAPIDO

Formato de saída: [especifique seu formato preferido]
```

---

## 📝 PROMPT 3: Melhoria de Slides Específicos

```
Revise e melhore o Slide 2.1 (Visão Geral da Arquitetura) com base nestas diretrizes:

PROBLEMAS ATUAIS:
- Diagrama muito textual
- Falta hierarquia visual
- Cores não destacam componentes importantes

MELHORIAS DESEJADAS:
1. Converter diagrama ASCII em visual com ícones
2. Usar cores: Azul (Clientes), Verde (Nginx), Roxo (App), Laranja (DB)
3. Adicionar setas de fluxo de dados
4. Destacar "Servidor Autoritativo" como conceito-chave
5. Incluir legenda de tecnologias (Node.js, Socket.IO, PostgreSQL)

Mantenha os bullet points originais, mas melhore o layout visual.
```

---

## 📝 PROMPT 4: Criação de Diagramas Específicos

```
Crie um diagrama visual profissional baseado nesta descrição do APRESENTACAO.md:

DIAGRAMA: Arquitetura de Comunicação (Seção 3)

COMPONENTES:
- Camada 1: Clientes Web (3 navegadores)
- Camada 2: Nginx (Proxy Reverso, porta 80)
- Camada 3: Node.js Server (App, porta 3000)
- Camada 4: PostgreSQL (Database, porta 5432)

CONEXÕES:
- Clientes ↔ Nginx: WebSocket (Socket.IO) + HTTP (REST)
- Nginx ↔ Node.js: Proxy reverso com WebSocket upgrade
- Node.js ↔ PostgreSQL: Pool de conexões pg

ELEMENTOS VISUAIS:
- Use ícones para cada camada
- Setas bidirecionais com labels
- Cores diferentes por camada
- Destaque WebSocket em verde (tempo real)
- Destaque REST em azul (operações CRUD)

Formato: [SVG/PNG/PowerPoint Shape]
```

---

## 📝 PROMPT 5: Tabelas e Métricas

```
Converta esta informação do APRESENTACAO.md em uma tabela visual atraente:

SEÇÃO: 6.5 - Análise de Desempenho

DADOS:
| Métrica | Desenvolvimento | Produção (AWS) |
|---------|-----------------|----------------|
| Latência (ping) | 1-5ms | 20-50ms |
| FPS (cliente) | 60 | 58-60 |
| Taxa de atualização | 60 Hz | 60 Hz |
| Memória (Node) | ~150 MB | ~200 MB |
| CPU (Node) | 5-10% | 10-20% |
| Banda por jogador | 80 KB/s | 100 KB/s |
| Jogadores/sala | 6 máx | 6 máx |
| Salas simultâneas | Testado: 10 | Testado: 5 |

REQUISITOS:
- Design moderno e limpo
- Cores alternadas para linhas (zebra)
- Destaque para valores importantes
- Ícones representando cada métrica
- Legenda: Verde = ótimo, Amarelo = bom, Vermelho = atenção

Formato: [Especifique]
```

---

## 📝 PROMPT 6: Animações e Transições

```
Defina sequência de animações para o Slide 2.4 (Cluster de Containers):

SLIDE CONTENT:
- Título: "Cluster de Containers (Docker)"
- Diagrama: 3 containers (postgres, app, nginx)
- Código: docker-compose.yml
- Bullet points: 5 benefícios

SEQUÊNCIA DE ANIMAÇÃO:
1. Fade in título (0s)
2. Aparecer container PostgreSQL (1s) + texto "Container 1: Banco de dados"
3. Aparecer container App (2s) + texto "Container 2: Aplicação" + seta depends_on
4. Aparecer container Nginx (3s) + texto "Container 3: Proxy" + seta depends_on
5. Destacar healthcheck do PostgreSQL (4s)
6. Fade in código docker-compose.yml (5s)
7. Aparecer bullets um por um (6-10s)

TIMING TOTAL: 10 segundos
TRANSIÇÃO PARA PRÓXIMO SLIDE: Fade (1s)
```

---

## 📝 PROMPT 7: Slides de Código

```
Formate o código do Slide 3.2 (Eventos Socket.IO) para apresentação:

CÓDIGO ORIGINAL (do APRESENTACAO.md):
[Cole o código TypeScript aqui]

REQUISITOS:
1. Syntax highlighting (TypeScript)
2. Destacar linhas importantes com background amarelo:
   - Linha do query (credenciais)
   - Linha do input (frequência)
   - Linha do requestRestart (consenso)
3. Adicionar comentários inline explicativos
4. Usar fonte monospace legível (Consolas/Fira Code)
5. Tamanho de fonte adequado para projeção
6. Número de linhas visível à esquerda
7. Tema de cores: Dark (fundo escuro)

Incluir no slide:
- Título: "Eventos Cliente → Servidor"
- Código formatado
- 3 bullet points explicativos abaixo
```

---

## 📝 PROMPT 8: Slide de Conclusão

```
Crie slide de conclusão impactante baseado na Seção 8 do APRESENTACAO.md:

ELEMENTOS:
1. Título: "Requisitos Atendidos - Sistema Completo"
2. 8 checkboxes verdes com ✅:
   - Arquitetura Distribuída (Cliente-servidor + containers)
   - Comunicação em Rede (WebSocket + REST)
   - Consistência de Dados (Servidor autoritativo)
   - Gerenciamento de Sessões (JWT + salas)
   - Tolerância a Falhas (Reconexão automática)
   - Escalabilidade (Multi-instância ready)
   - Persistência de Dados (PostgreSQL)
   - Interface do Usuário (Canvas 2D responsivo)

3. Box destacado no centro:
   "60% TÉCNICOS IMPLEMENTADOS
   100% DOS REQUISITOS ATENDIDOS"

4. Rodapé com métricas:
   - 3.500 linhas de código
   - 30+ jogadores testados
   - 3 containers Docker
   - Segurança auditada ✅

ESTILO:
- Layout: Grade 2x4 para checkboxes
- Cores: Verde para checks, azul para box central
- Animação: Aparecer check por check (efeito de "completar")
```

---

## 📝 PROMPT 9: Slides de Backup

```
Gere 3 slides extras (backup) para perguntas:

SLIDE EXTRA 1: "Como Escalar para 1000+ Jogadores?"
- Diagrama com Redis Adapter
- 3 instâncias Node.js
- Load balancer Nginx
- Código de configuração

SLIDE EXTRA 2: "Comparação com Arquitetura P2P"
- Tabela comparativa (6 critérios)
- Conclusão técnica
- Quando usar cada uma

SLIDE EXTRA 3: "Roadmap Futuro"
- Timeline com 5 melhorias planejadas
- Estimativa de tempo
- Impacto esperado

Use o conteúdo da SEÇÃO 9 (Slides Extras) do APRESENTACAO.md
```

---

## 📝 PROMPT 10: Revisão Final

```
Revise todos os slides gerados e verifique:

CHECKLIST:
- [ ] Total de 35-40 slides
- [ ] Timing de 20-25 minutos
- [ ] Todas as seções do APRESENTACAO.md cobertas
- [ ] Diagramas convertidos e visuais
- [ ] Código com syntax highlighting
- [ ] Cores consistentes (paleta definida)
- [ ] Animações configuradas
- [ ] Transições suaves
- [ ] Fonte legível para projeção
- [ ] Logo/título em todas as páginas
- [ ] Numeração de slides
- [ ] Slide de perguntas ao final

Gere um relatório resumido com:
1. Total de slides por seção
2. Tempo estimado por seção
3. Elementos que precisam de ajuste
4. Sugestões de melhoria
```

---

## 🎨 ESPECIFICAÇÕES DE DESIGN

### Paleta de Cores Sugerida

```
Primária: #1E3A8A (Azul Escuro)
Secundária: #10B981 (Verde)
Alerta: #EF4444 (Vermelho)
Aviso: #F59E0B (Amarelo)
Neutro: #6B7280 (Cinza)
Fundo: #FFFFFF (Branco)
Código: #1F2937 (Cinza Escuro)
```

### Fontes

```
Títulos: Inter Bold / Roboto Bold
Corpo: Inter Regular / Roboto Regular
Código: Fira Code / Consolas / Monaco
```

### Dimensões

```
Slide: 16:9 (1920x1080)
Margens: 60px todas as bordas
Título: 48-54pt
Subtítulo: 32-36pt
Corpo: 24-28pt
Código: 18-22pt
```

---

## 💡 DICAS PARA USO COM IA

### ChatGPT / Claude
1. Divida em prompts menores (seção por seção)
2. Peça revisões iterativas
3. Use formato Markdown para fácil conversão
4. Solicite exportação em formato compatível

### Gamma.app
1. Cole o APRESENTACAO.md inteiro
2. Deixe a IA gerar automaticamente
3. Ajuste slides manualmente depois
4. Exporte para PowerPoint se necessário

### Beautiful.ai
1. Comece com template profissional
2. Use prompts de seção individual
3. Aproveite sugestões de design da IA
4. Adicione animações inteligentes

### Canva
1. Use templates de apresentação acadêmica
2. Importe conteúdo de cada slide
3. Customize cores com paleta sugerida
4. Exporte como PDF ou PowerPoint

---

## ⚡ PROMPT RÁPIDO (All-in-One)

```
Sou estudante de Sistemas Distribuídos e preciso criar uma apresentação de 20-25 minutos sobre meu projeto: um jogo multiplayer em tempo real.

Tenho um documento DETALHADO (APRESENTACAO.md) com TODO o conteúdo estruturado em 9 seções, incluindo diagramas, código e pontos-chave.

Por favor:
1. Leia o documento APRESENTACAO.md anexado
2. Gere 35-40 slides profissionais seguindo a estrutura
3. Converta diagramas ASCII em visuais
4. Adicione syntax highlighting ao código
5. Use as cores e ícones sugeridos no documento
6. Configure animações conforme instruções
7. Mantenha timing de ~40 segundos por slide

Foco principal (60% da nota):
- Arquitetura Distribuída (15%)
- Comunicação em Rede (15%)
- Tolerância a Falhas (15%)
- Segurança + Escalabilidade (15%)

Comece gerando os primeiros 5 slides (Seção 1: Introdução) e aguarde minha aprovação antes de continuar.
```

---

## 📚 RECURSOS ADICIONAIS

### Ferramentas Recomendadas
- **Gamma.app**: IA nativa para slides
- **Beautiful.ai**: Design automático inteligente
- **Canva**: Templates e customização
- **Marp**: Markdown para slides (para desenvolvedores)
- **reveal.js**: HTML/CSS slides (web)

### Conversor de Diagramas
- **Mermaid**: Diagramas a partir de texto
- **Draw.io**: Editor visual
- **Lucidchart**: Diagramas profissionais
- **Excalidraw**: Estilo hand-drawn

### Testes de Apresentação
- Apresentar para amigos/familiares
- Gravar e assistir depois
- Usar timer para cada seção
- Praticar respostas para perguntas

---

## ✅ CHECKLIST FINAL

Antes de finalizar os slides, verifique:

- [ ] Todos os 35-40 slides criados
- [ ] Diagramas convertidos e visuais
- [ ] Código com syntax highlighting
- [ ] Cores e fontes consistentes
- [ ] Animações funcionando
- [ ] Timing total: 20-25 minutos
- [ ] Slide de título com nome/data
- [ ] Slide de conclusão com agradecimentos
- [ ] Slides extras de backup incluídos
- [ ] Numeração de páginas
- [ ] Logo/branding consistente
- [ ] Exportado em formato final (PPTX/PDF)
- [ ] Backup em nuvem
- [ ] Testado no computador de apresentação

---

**Sucesso na sua apresentação! 🎉**
