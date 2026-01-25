# Guia de Testes de Carga e Escalabilidade AWS EC2

Este guia explica como ajustar a potência dos testes de carga e como configurar a capacidade da máquina EC2 da AWS para suportar diferentes cargas de trabalho.

## Índice

- [Guia de Testes de Carga e Escalabilidade AWS EC2](#guia-de-testes-de-carga-e-escalabilidade-aws-ec2)
  - [Índice](#índice)
  - [Parte 1: Ajustando a Potência dos Testes de Carga](#parte-1-ajustando-a-potência-dos-testes-de-carga)
    - [1.1 Entendendo o Arquivo load-test.yaml](#11-entendendo-o-arquivo-load-testyaml)
    - [1.2 Parâmetros Principais](#12-parâmetros-principais)
    - [1.3 Cenários de Teste Recomendados](#13-cenários-de-teste-recomendados)
      - [Teste Leve (10-20 jogadores simultâneos)](#teste-leve-10-20-jogadores-simultâneos)
      - [Teste Médio (30-50 jogadores simultâneos)](#teste-médio-30-50-jogadores-simultâneos)
      - [Teste Intenso (80-100 jogadores simultâneos)](#teste-intenso-80-100-jogadores-simultâneos)
      - [Teste de Estresse (150+ jogadores simultâneos)](#teste-de-estresse-150-jogadores-simultâneos)
    - [1.4 Executando os Testes](#14-executando-os-testes)
    - [1.5 Interpretando os Resultados](#15-interpretando-os-resultados)
  - [Parte 2: Escalabilidade da Máquina EC2](#parte-2-escalabilidade-da-máquina-ec2)
    - [2.1 Tipos de Instância EC2 Recomendados](#21-tipos-de-instância-ec2-recomendados)
    - [2.2 Como Mudar o Tipo de Instância (Escalamento Vertical)](#22-como-mudar-o-tipo-de-instância-escalamento-vertical)
      - [Através do Console AWS](#através-do-console-aws)
      - [Através do AWS CLI](#através-do-aws-cli)
    - [2.3 Monitorando Recursos da EC2](#23-monitorando-recursos-da-ec2)
      - [Via Console AWS (CloudWatch)](#via-console-aws-cloudwatch)
      - [Via SSH na Própria Instância](#via-ssh-na-própria-instância)
      - [Via Docker Stats (se usando containers)](#via-docker-stats-se-usando-containers)
    - [2.4 Quando Escalar Para Cima (Scale Up)](#24-quando-escalar-para-cima-scale-up)
    - [2.5 Quando Escalar Para Baixo (Scale Down)](#25-quando-escalar-para-baixo-scale-down)
    - [2.6 Comparação de Capacidade por Tipo de Instância](#26-comparação-de-capacidade-por-tipo-de-instância)
  - [Parte 3: Correlacionando Testes com Capacidade EC2](#parte-3-correlacionando-testes-com-capacidade-ec2)
    - [3.1 Metodologia de Teste](#31-metodologia-de-teste)
    - [3.2 Tabela de Referência Rápida](#32-tabela-de-referência-rápida)
    - [3.3 Otimizações de Performance](#33-otimizações-de-performance)
  - [Parte 4: Melhores Práticas](#parte-4-melhores-práticas)
    - [4.1 Para Testes de Carga](#41-para-testes-de-carga)
    - [4.2 Para Escalabilidade EC2](#42-para-escalabilidade-ec2)
    - [4.3 Para Custos](#43-para-custos)
  - [Parte 5: Troubleshooting](#parte-5-troubleshooting)
    - [5.1 Problemas Comuns em Testes](#51-problemas-comuns-em-testes)
    - [5.2 Problemas Comuns na EC2](#52-problemas-comuns-na-ec2)
  - [Recursos Adicionais](#recursos-adicionais)

---

## Parte 1: Ajustando a Potência dos Testes de Carga

### 1.1 Entendendo o Arquivo load-test.yaml

O arquivo `load-test.yaml` usa o **Artillery** para simular múltiplos jogadores conectando e jogando simultaneamente. O teste atual está configurado assim:

```yaml
config:
  target: "http://localhost"
  socketio:
    transports: ["websocket"]
  
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Aquecimento"
    - duration: 60
      arrivalRate: 20
      rampTo: 50
      name: "Subindo a Carga"
    - duration: 60
      arrivalRate: 50
      name: "Pico Sustentado"

scenarios:
  - engine: "socketio"
    name: "Fluxo de Jogador"
    flow:
      - think: 1
      - emit:
          channel: "enter_room"
          data: 
             playerId: "load_test_user"
             roomId: "room-1"
      - think: 5
      - emit:
          channel: "player_move"
          data: 
             x: 10
             y: 20
```

### 1.2 Parâmetros Principais

| Parâmetro | Descrição | Impacto |
|-----------|-----------|---------|
| **duration** | Duração da fase em segundos | Define por quanto tempo cada fase do teste durará |
| **arrivalRate** | Novos usuários por segundo | Controla quantos usuários NOVOS chegam a cada segundo |
| **rampTo** | Taxa final de chegada | Aumenta gradualmente de `arrivalRate` até `rampTo` durante a fase |
| **think** | Pausa em segundos | Simula tempo de "pensar" do usuário entre ações |
| **target** | URL do servidor | Endereço que será testado (localhost ou IP da EC2) |

**Como calcular jogadores simultâneos:**
- Se `arrivalRate = 10` e `duration = 60`, você terá aproximadamente **600 novos usuários** chegando durante essa fase
- Mas usuários também saem (quando o cenário termina), então a contagem real depende da duração do cenário

**Fórmula aproximada:**
```
Jogadores Simultâneos Máximo ≈ arrivalRate × (duração média do cenário)
```

### 1.3 Cenários de Teste Recomendados

#### Teste Leve (10-20 jogadores simultâneos)
**Ideal para:** Instâncias t3.micro/t3.small em desenvolvimento

```yaml
phases:
  - duration: 30
    arrivalRate: 2
    name: "Aquecimento"
  - duration: 60
    arrivalRate: 5
    rampTo: 10
    name: "Carga Moderada"
  - duration: 30
    arrivalRate: 10
    name: "Pico"
```

**Carga esperada:** ~15 jogadores no pico

---

#### Teste Médio (30-50 jogadores simultâneos)
**Ideal para:** Instâncias t3.medium/t3.large

```yaml
phases:
  - duration: 30
    arrivalRate: 5
    name: "Aquecimento"
  - duration: 60
    arrivalRate: 10
    rampTo: 30
    name: "Subindo a Carga"
  - duration: 90
    arrivalRate: 30
    name: "Pico Sustentado"
```

**Carga esperada:** ~40 jogadores no pico

---

#### Teste Intenso (80-100 jogadores simultâneos)
**Ideal para:** Instâncias c5.large/c5.xlarge

```yaml
phases:
  - duration: 30
    arrivalRate: 10
    name: "Aquecimento"
  - duration: 90
    arrivalRate: 20
    rampTo: 60
    name: "Subindo a Carga"
  - duration: 120
    arrivalRate: 60
    name: "Pico Sustentado"
  - duration: 60
    arrivalRate: 60
    rampTo: 30
    name: "Descida Gradual"
```

**Carga esperada:** ~90 jogadores no pico

---

#### Teste de Estresse (150+ jogadores simultâneos)
**Ideal para:** Instâncias c5.xlarge/c5.2xlarge ou superior

```yaml
phases:
  - duration: 30
    arrivalRate: 15
    name: "Aquecimento"
  - duration: 120
    arrivalRate: 30
    rampTo: 100
    name: "Subindo a Carga"
  - duration: 180
    arrivalRate: 100
    name: "Estresse Máximo"
  - duration: 90
    arrivalRate: 100
    rampTo: 20
    name: "Descida Gradual"
```

**Carga esperada:** ~150+ jogadores no pico

---

### 1.4 Executando os Testes

**Pré-requisito:** Instalar Artillery

```bash
npm install -g artillery
```

**Executar teste local:**

```bash
artillery run load-test.yaml
```

**Executar teste contra EC2:**

1. Edite `load-test.yaml` e mude o target:

```yaml
config:
  target: "http://seu-ip-ec2"  # ou seu domínio
```

2. Execute:

```bash
artillery run load-test.yaml
```

**Executar teste com relatório HTML:**

```bash
artillery run --output report.json load-test.yaml
artillery report report.json
```

Isso gera um arquivo `report.json.html` com gráficos visuais.

---

### 1.5 Interpretando os Resultados

**Métricas importantes no relatório:**

| Métrica | O que significa | Valor Ideal |
|---------|----------------|-------------|
| **scenarios.completed** | Cenários completados com sucesso | 100% do total lançado |
| **http.response_time.p95** | 95% das respostas em X ms | < 200ms (excelente), < 500ms (aceitável) |
| **http.response_time.p99** | 99% das respostas em X ms | < 500ms (excelente), < 1000ms (aceitável) |
| **socketio.emit** | Mensagens enviadas | Deve corresponder às ações do cenário |
| **socketio.receive** | Mensagens recebidas | Deve receber atualizações do servidor |
| **errors** | Erros durante o teste | 0 (zero) é o ideal |

**Sinais de que o servidor está sobrecarregado:**
- ❌ Taxa de erro > 1%
- ❌ p95 response time > 1000ms
- ❌ Cenários não completados (timeout)
- ❌ Conexões WebSocket sendo recusadas

**Sinais de que o servidor está saudável:**
- ✅ Taxa de erro = 0%
- ✅ p95 response time < 200ms
- ✅ Todos os cenários completados
- ✅ CPU < 80%, Memória < 80%

---

## Parte 2: Escalabilidade da Máquina EC2

### 2.1 Tipos de Instância EC2 Recomendados

Para um jogo multiplayer em tempo real com WebSocket, os tipos mais importantes são:
- **CPU**: Para processar o game loop (60 FPS) e múltiplas conexões
- **Rede**: Para baixa latência nas comunicações WebSocket
- **Memória**: Para manter estado de múltiplas salas e jogadores

#### Família T3 (Propósito Geral - Desenvolvimento/Pequeno Porte)

| Tipo | vCPUs | RAM | Rede | Jogadores Estimados* | Custo/mês** |
|------|-------|-----|------|---------------------|-------------|
| t3.micro | 2 | 1 GB | Baixa | 10-15 | ~$7.50 |
| t3.small | 2 | 2 GB | Baixa | 15-25 | ~$15 |
| t3.medium | 2 | 4 GB | Moderada | 30-40 | ~$30 |
| t3.large | 2 | 8 GB | Moderada | 50-70 | ~$60 |

**Nota T3:** Usa CPU "burstable" (créditos). Bom para desenvolvimento, mas pode ter performance inconsistente sob carga constante.

---

#### Família C5 (Otimizado para Computação - Produção)

| Tipo | vCPUs | RAM | Rede | Jogadores Estimados* | Custo/mês** |
|------|-------|-----|------|---------------------|-------------|
| c5.large | 2 | 4 GB | Alta | 60-80 | ~$61 |
| c5.xlarge | 4 | 8 GB | Alta | 100-150 | ~$122 |
| c5.2xlarge | 8 | 16 GB | Alta | 200-300 | ~$244 |
| c5.4xlarge | 16 | 32 GB | 10 Gbps | 400-600 | ~$488 |

**Nota C5:** CPU dedicada e consistente. Ideal para produção e cargas sustentadas.

---

#### Família M5 (Balanceado - Uso Geral)

| Tipo | vCPUs | RAM | Rede | Jogadores Estimados* | Custo/mês** |
|------|-------|-----|------|---------------------|-------------|
| m5.large | 2 | 8 GB | Moderada | 50-70 | ~$69 |
| m5.xlarge | 4 | 16 GB | Alta | 100-150 | ~$138 |
| m5.2xlarge | 8 | 32 GB | Alta | 200-300 | ~$276 |

**Nota M5:** Equilíbrio entre CPU e memória. Bom para aplicações com múltiplas salas simultâneas.

---

\* Estimativas baseadas em 6 jogadores por sala, múltiplas salas simultâneas, game loop a 60 FPS.  
\** Preços aproximados na região us-east-1 (Janeiro 2026). Consulte a calculadora AWS para valores exatos.

---

### 2.2 Como Mudar o Tipo de Instância (Escalamento Vertical)

⚠️ **IMPORTANTE:** A instância precisa ser **parada** para mudar o tipo.

#### Através do Console AWS

1. **Acesse o Console EC2:**
   - Vá para: https://console.aws.amazon.com/ec2/
   - Selecione a região correta (ex: us-east-1)

2. **Pare a Instância:**
   - Selecione sua instância
   - Actions → Instance State → Stop
   - Aguarde até o status ficar "Stopped" (~1-2 minutos)

3. **Mude o Tipo:**
   - Com a instância parada, selecione:
   - Actions → Instance Settings → Change Instance Type
   - Escolha o novo tipo (ex: de t3.micro para t3.medium)
   - Clique em "Apply"

4. **Inicie a Instância:**
   - Actions → Instance State → Start
   - Aguarde inicializar (~1-2 minutos)
   - **Anote o novo IP público** (o IP muda ao parar/iniciar)

5. **Reconecte-se:**
   ```bash
   ssh -i sua-chave.pem ubuntu@novo-ip-ec2
   ```

6. **Verifique o serviço:**
   ```bash
   # Se usando PM2
   pm2 status
   pm2 logs
   
   # Se usando Docker
   docker-compose ps
   docker-compose logs -f
   ```

---

#### Através do AWS CLI

```bash
# 1. Obter ID da instância
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=seu-jogo-multiplayer" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text

# 2. Parar a instância
aws ec2 stop-instances --instance-ids i-0123456789abcdef0

# 3. Aguardar parar (pode demorar ~1 minuto)
aws ec2 wait instance-stopped --instance-ids i-0123456789abcdef0

# 4. Mudar o tipo
aws ec2 modify-instance-attribute \
  --instance-id i-0123456789abcdef0 \
  --instance-type "{\"Value\": \"t3.medium\"}"

# 5. Iniciar a instância
aws ec2 start-instances --instance-ids i-0123456789abcdef0

# 6. Aguardar inicializar
aws ec2 wait instance-running --instance-ids i-0123456789abcdef0

# 7. Obter novo IP público
aws ec2 describe-instances \
  --instance-ids i-0123456789abcdef0 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

---

### 2.3 Monitorando Recursos da EC2

#### Via Console AWS (CloudWatch)

1. Acesse: https://console.aws.amazon.com/cloudwatch/
2. No menu lateral: Metrics → EC2 → Per-Instance Metrics
3. Selecione sua instância e escolha métricas:
   - **CPUUtilization** (mais importante)
   - **NetworkIn / NetworkOut**
   - **StatusCheckFailed**

**Criar Alarme de CPU:**
1. CloudWatch → Alarms → Create Alarm
2. Selecione métrica: EC2 → CPUUtilization
3. Configure:
   - Threshold: Static
   - Condition: Greater than 80
   - Datapoints: 2 out of 5 minutes
4. Action: Enviar email (SNS)

---

#### Via SSH na Própria Instância

**Instalar htop (monitor visual):**
```bash
sudo apt update
sudo apt install htop -y
htop
```

**Comandos rápidos de monitoramento:**

```bash
# CPU e Memória em tempo real
top

# Uso de memória detalhado
free -h

# Uso de disco
df -h

# Conexões de rede ativas (importante para WebSocket)
netstat -an | grep ESTABLISHED | wc -l

# Ver processos do Node.js
ps aux | grep node

# Ver uso de CPU por processo
ps aux --sort=-%cpu | head -10

# Ver uso de memória por processo
ps aux --sort=-%mem | head -10
```

**Script de monitoramento contínuo:**

```bash
#!/bin/bash
# Salve como monitor.sh e execute: bash monitor.sh

while true; do
    clear
    echo "=== Monitor de Recursos - $(date) ==="
    echo ""
    echo "CPU e Memória:"
    top -bn1 | head -5
    echo ""
    echo "Memória:"
    free -h
    echo ""
    echo "Conexões WebSocket ativas:"
    netstat -an | grep ESTABLISHED | wc -l
    echo ""
    echo "Processos Node.js:"
    ps aux | grep node | grep -v grep
    echo ""
    sleep 5
done
```

---

#### Via Docker Stats (se usando containers)

```bash
# Ver uso de recursos de todos os containers
docker stats

# Ver uso de um container específico
docker stats multiplayer-soccer-app

# Salvar estatísticas em arquivo
docker stats --no-stream > docker-stats-$(date +%Y%m%d-%H%M%S).txt
```

---

### 2.4 Quando Escalar Para Cima (Scale Up)

**Sinais de que você precisa de uma instância maior:**

| Sinal | O que monitorar | Ação recomendada |
|-------|----------------|------------------|
| ⚠️ CPU > 80% consistentemente | CloudWatch ou `htop` | Mudar para tipo com mais vCPUs |
| ⚠️ Memória > 85% | `free -h` | Mudar para tipo com mais RAM |
| ⚠️ Game loop lento (< 60 FPS) | Logs do servidor | Mudar para família C5 (CPU dedicada) |
| ⚠️ Latência alta no WebSocket | Tempo de resposta nos clientes | Mudar para tipo com melhor rede |
| ⚠️ Conexões recusadas | Logs de erro | Aumentar capacidade geral |
| ⚠️ Erros em testes de carga | Artillery report | Escalar antes do horário de pico |

**Exemplo de decisão:**
```
Situação: t3.micro com CPU em 95% e 30 jogadores online
Problema: Lag no jogo, alguns jogadores sendo desconectados
Solução: Escalar para t3.medium ou c5.large
```

---

### 2.5 Quando Escalar Para Baixo (Scale Down)

**Sinais de que você pode economizar com instância menor:**

| Sinal | O que monitorar | Ação recomendada |
|-------|----------------|------------------|
| ✅ CPU < 30% na maioria do tempo | CloudWatch (7 dias) | Pode reduzir vCPUs |
| ✅ Memória < 50% sempre | `free -h` | Pode reduzir RAM |
| ✅ Horários de baixo uso | Logs de acesso | Agendar scale down fora do pico |
| ✅ Poucos jogadores online | Logs do servidor | Reduzir temporariamente |

**Exemplo de decisão:**
```
Situação: c5.xlarge com CPU em 20% e apenas 15 jogadores online
Oportunidade: Fora do horário de pico (madrugada)
Solução: Escalar para t3.medium e economizar ~60% nos custos
```

⚠️ **CUIDADO:** Sempre teste em horários de baixo uso antes de escalar permanentemente para baixo.

---

### 2.6 Comparação de Capacidade por Tipo de Instância

**Cenário de Teste:** Artillery com arrivalRate=50, duration=120s

| Tipo EC2 | CPU (%) | RAM (%) | Latência p95 | Jogadores OK | Status | Custo/mês |
|----------|---------|---------|--------------|--------------|--------|-----------|
| t3.micro | 98% | 87% | 1200ms | ❌ 15 | Sobrecarregado | $7.50 |
| t3.small | 85% | 65% | 450ms | ⚠️ 25 | Limite | $15 |
| t3.medium | 62% | 45% | 180ms | ✅ 40 | Saudável | $30 |
| t3.large | 38% | 28% | 120ms | ✅ 70 | Folga | $60 |
| c5.large | 45% | 35% | 90ms | ✅ 80 | Saudável | $61 |
| c5.xlarge | 28% | 22% | 65ms | ✅ 150 | Excelente | $122 |
| c5.2xlarge | 15% | 15% | 45ms | ✅ 300 | Excesso | $244 |

**Interpretação:**
- ❌ Sobrecarregado: Não use em produção
- ⚠️ Limite: Pode funcionar mas sem margem para crescimento
- ✅ Saudável: Ideal para produção
- ✅ Folga/Excelente: Bom para picos inesperados
- ✅ Excesso: Sobre-dimensionado, pode reduzir custos

---

## Parte 3: Correlacionando Testes com Capacidade EC2

### 3.1 Metodologia de Teste

**Passo a passo para determinar a capacidade ideal:**

1. **Comece com instância pequena (t3.small ou t3.medium)**
2. **Execute teste leve** (arrivalRate=10)
3. **Monitore métricas durante o teste:**
   ```bash
   # Em um terminal
   ssh -i chave.pem ubuntu@ip-ec2
   htop
   
   # Em outro terminal
   artillery run load-test.yaml
   ```
4. **Analise resultados:**
   - CPU < 70% e latência < 200ms? → **Aumente o teste**
   - CPU > 85% ou latência > 500ms? → **Aumente a instância**
5. **Repita até encontrar o limite**
6. **Adicione 30-40% de margem** para picos inesperados

---

### 3.2 Tabela de Referência Rápida

| Jogadores Simultâneos | Tipo EC2 Mínimo | Tipo EC2 Recomendado | Load Test (arrivalRate) |
|----------------------|-----------------|---------------------|-------------------------|
| 10-15 | t3.micro | t3.small | 5 |
| 20-30 | t3.small | t3.medium | 10 |
| 40-50 | t3.medium | t3.large | 20 |
| 60-80 | t3.large | c5.large | 30-40 |
| 100-150 | c5.large | c5.xlarge | 50-60 |
| 200-300 | c5.xlarge | c5.2xlarge | 80-100 |
| 400+ | c5.2xlarge | c5.4xlarge | 120+ |

---

### 3.3 Otimizações de Performance

**Antes de escalar a EC2, considere otimizar o código:**

1. **Reduza frequência de broadcast** (se muito alta):
   ```typescript
   // Em game-server.ts, ajustar de 60 FPS para 30 FPS
   const FPS = 30;  // em vez de 60
   setInterval(runGameLoops, 1000 / FPS);
   ```

2. **Implemente compressão WebSocket** (se ainda não habilitado):
   ```typescript
   // Em game-server.ts
   const io = new SocketIOServer(server, {
     perMessageDeflate: true,  // Ativa compressão
     httpCompression: true
   });
   ```

3. **Use Nginx para cache de assets estáticos:**
   ```nginx
   # Em nginx/default.conf
   location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

4. **Ative PM2 cluster mode** (se não usando Docker):
   ```bash
   pm2 start dist/game-server.js -i max
   # Isso cria um processo por CPU core
   ```

---

## Parte 4: Melhores Práticas

### 4.1 Para Testes de Carga

✅ **Faça:**
- Execute testes em horários de baixo uso
- Comece com carga baixa e aumente gradualmente
- Salve os relatórios para comparação futura
- Teste tanto a média quanto os picos esperados
- Simule diferentes tipos de usuários (ativos e ociosos)

❌ **Evite:**
- Testar em produção sem aviso prévio
- Aumentar carga bruscamente (use `rampTo`)
- Ignorar métricas de latência (foque apenas em throughput)
- Testar de máquinas com conexão lenta

---

### 4.2 Para Escalabilidade EC2

✅ **Faça:**
- Configure CloudWatch Alarms para CPU > 80%
- Use Elastic IP se não quiser que o IP mude
- Documente mudanças de tipo de instância
- Agende escalabilidade para horários conhecidos (ex: eventos)
- Mantenha backups antes de grandes mudanças

❌ **Evite:**
- Escalar durante horário de pico
- Usar T3 com cargas constantes > 50% CPU (esgota créditos)
- Esquecer de atualizar DNS após mudança de IP
- Escalar sem testar primeiro

---

### 4.3 Para Custos

💰 **Economize:**
- Use **Reserved Instances** se uso for previsível (até 72% desconto)
- Use **Savings Plans** para flexibilidade (até 66% desconto)
- Agende **parada automática** fora de horário (ex: dev à noite)
- Use **Spot Instances** para ambientes de teste (até 90% desconto)

**Exemplo de economia:**
```
Cenário: c5.xlarge rodando 24/7
On-Demand: $122/mês
Reserved (1 ano): $78/mês (-36%)
Reserved (3 anos): $50/mês (-59%)
Spot Instance: $12-36/mês (variável, pode ser interrompida)
```

**Script para parar/iniciar automaticamente:**
```bash
# Parar às 23h (cron)
0 23 * * * aws ec2 stop-instances --instance-ids i-XXXXX --region us-east-1

# Iniciar às 7h (cron)
0 7 * * * aws ec2 start-instances --instance-ids i-XXXXX --region us-east-1
```

---

## Parte 5: Troubleshooting

### 5.1 Problemas Comuns em Testes

**Problema:** Teste falha com "ECONNREFUSED"
```
Causa: Servidor não está rodando ou porta errada
Solução: Verificar se o servidor está UP e acessível:
  curl http://seu-ip-ec2
  telnet seu-ip-ec2 80
```

**Problema:** Teste lento mas servidor OK
```
Causa: Conexão de rede lenta de onde está rodando o Artillery
Solução: Rodar Artillery de uma máquina mais próxima da EC2:
  - Use EC2 na mesma região para rodar o teste
  - Use VPS com boa conectividade
```

**Problema:** WebSocket não conecta durante teste
```
Causa: Nginx não configurado corretamente para WebSocket
Solução: Verificar nginx.conf tem:
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
```

**Problema:** Resultados inconsistentes entre testes
```
Causa: Cache, créditos T3 esgotados, ou outros processos na EC2
Solução:
  1. Reiniciar servidor entre testes
  2. Verificar se não há outros processos pesados
  3. Se T3, migrar para C5 para CPU consistente
```

---

### 5.2 Problemas Comuns na EC2

**Problema:** Não consegue mudar tipo de instância
```
Erro: "The instance 'i-xxxxx' is not in a stopped state"
Solução: Precisa parar a instância primeiro:
  aws ec2 stop-instances --instance-ids i-xxxxx
  aws ec2 wait instance-stopped --instance-ids i-xxxxx
```

**Problema:** IP mudou após restart
```
Causa: IP público é efêmero por padrão
Solução: Alocar um Elastic IP:
  1. EC2 Console → Elastic IPs → Allocate
  2. Associar à instância
  3. Agora o IP não muda mais
  Custo: Grátis se instância está rodando, $0.005/hora se parada
```

**Problema:** Instância lenta após upgrade
```
Causa possível: Problema na inicialização ou volumes antigos
Solução:
  1. Verificar logs: /var/log/syslog
  2. Verificar se todos os serviços subiram: systemctl status
  3. Se usando Docker: docker-compose ps
```

**Problema:** Custo mais alto que esperado
```
Causa: Múltiplas instâncias, snapshots, volumes não usados
Solução:
  1. Ver fatura: AWS Console → Billing
  2. Listar recursos: aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]'
  3. Deletar recursos não usados: snapshots, volumes, IPs não associados
```

---

## Recursos Adicionais

- **Artillery Documentation:** https://www.artillery.io/docs
- **AWS EC2 Instance Types:** https://aws.amazon.com/ec2/instance-types/
- **AWS CloudWatch:** https://aws.amazon.com/cloudwatch/
- **AWS Pricing Calculator:** https://calculator.aws/
- **Node.js Performance Best Practices:** https://nodejs.org/en/docs/guides/simple-profiling/

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.0  
**Autor:** Documentação do projeto Multiplayer Soccer
