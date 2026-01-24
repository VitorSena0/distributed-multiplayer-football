# Guia Completo: Docker Swarm - Multiplayer Soccer

## 📋 Índice

1. [O que é Docker Swarm?](#o-que-é-docker-swarm)
2. [Por que usar Docker Swarm?](#por-que-usar-docker-swarm)
3. [Pré-requisitos](#pré-requisitos)
4. [Preparação das Imagens](#preparação-das-imagens)
5. [Teste Local (Swarm em Máquina Única)](#teste-local-swarm-em-máquina-única)
6. [Comandos Úteis](#comandos-úteis)
7. [Escalabilidade e Atualização](#escalabilidade-e-atualização)
8. [Monitoramento](#monitoramento)
9. [Troubleshooting](#troubleshooting)
10. [Diferenças: Docker Compose vs Docker Swarm](#diferenças-docker-compose-vs-docker-swarm)

---

## O que é Docker Swarm?

**Docker Swarm** é a solução nativa de orquestração de containers do Docker. Ele permite:

- 🔄 **Gerenciar múltiplos containers** em vários hosts (máquinas)
- ⚖️ **Balanceamento de carga** automático entre containers
- 🔒 **Alta disponibilidade** com replicação de serviços
- 📈 **Escalabilidade horizontal** fácil (aumentar/diminuir replicas)
- 🔄 **Rolling updates** sem downtime
- 🌐 **Rede overlay** para comunicação entre containers em diferentes hosts

### Arquitetura do Swarm

```
┌─────────────────────────────────────────────┐
│           DOCKER SWARM CLUSTER              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │   MANAGER    │◄────►│   MANAGER    │   │
│  │    NODE      │      │    NODE      │   │
│  └──────┬───────┘      └──────┬───────┘   │
│         │                     │            │
│         │  ┌──────────────────┘            │
│         │  │                               │
│  ┌──────▼──▼───┐  ┌──────────────┐        │
│  │   WORKER    │  │   WORKER     │        │
│  │    NODE     │  │    NODE      │        │
│  └─────────────┘  └──────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

**Manager Nodes**: Gerenciam o cluster, tomam decisões de orquestração
**Worker Nodes**: Executam os containers (tasks)

---

## Por que usar Docker Swarm?

### Vantagens sobre Docker Compose Simples

| Característica | Docker Compose | Docker Swarm |
|---------------|----------------|--------------|
| **Múltiplos Hosts** | ❌ Apenas uma máquina | ✅ Cluster de máquinas |
| **Alta Disponibilidade** | ❌ Se cair, para tudo | ✅ Failover automático |
| **Escalabilidade** | ⚠️ Manual e limitada | ✅ Automática e horizontal |
| **Load Balancing** | ❌ Não nativo | ✅ Automático |
| **Rolling Updates** | ❌ Reinicia tudo | ✅ Atualização sem downtime |
| **Recuperação** | ⚠️ Manual | ✅ Automática |
| **Complexidade** | 🟢 Simples | 🟡 Moderada |

### Quando usar Docker Swarm?

✅ **Use Docker Swarm quando:**
- Precisa escalar horizontalmente (mais containers)
- Quer alta disponibilidade (se um container cair, outro assume)
- Precisa distribuir carga entre múltiplos servidores
- Quer atualizações sem downtime
- Planeja crescer no futuro

❌ **Use Docker Compose quando:**
- Está apenas desenvolvendo localmente
- Tem apenas uma máquina/servidor
- Não precisa de alta disponibilidade
- Projeto pequeno sem planos de crescimento

---

## Pré-requisitos

### Para teste local
- Docker 20.10+ instalado
- Docker Compose (opcional, para comparação)
- 4GB RAM mínimo (recomendado 8GB para múltiplas réplicas)
- Sistema operacional: Linux, macOS ou Windows com WSL2

### Verificar instalação

```bash
docker --version
# Docker version 24.0.0 ou superior

docker info | grep Swarm
# Swarm: inactive (ainda não inicializado)
```

---

## Preparação das Imagens

Antes de usar o Swarm, você precisa **construir as imagens** Docker dos serviços.

### Passo 1: Build da imagem do App Node.js

```bash
cd /caminho/do/projeto/distributed-multiplayer-football

# Build da imagem do app
docker build -t multiplayer-soccer-app:latest -f dockerfile .
```

**O que esse comando faz:**
- `-t multiplayer-soccer-app:latest`: Define o nome e tag da imagem
- `-f dockerfile`: Especifica qual Dockerfile usar
- `.`: Contexto de build (diretório atual)

### Passo 2: Build da imagem do Nginx

```bash
# Build da imagem do nginx (dentro da pasta nginx/)
docker build -t multiplayer-soccer-nginx:latest ./nginx
```

### Passo 3: Verificar as imagens criadas

```bash
docker images | grep multiplayer-soccer
```

**Saída esperada:**
```
multiplayer-soccer-app     latest    abc123def456   2 minutes ago   500MB
multiplayer-soccer-nginx   latest    xyz789uvw123   1 minute ago    50MB
```

### Por que fazer o build antes?

O arquivo `docker-compose.swarm.yml` referencia estas imagens pelo nome:
```yaml
app:
  image: multiplayer-soccer-app:latest  # <-- Procura esta imagem
```

Se a imagem não existir, o Swarm **não conseguirá criar** o serviço.

---

## Teste Local (Swarm em Máquina Única)

Mesmo em uma única máquina, você pode testar o Swarm para entender como funciona.

### Passo 1: Inicializar o Swarm

```bash
docker swarm init
```

**Saída esperada:**
```
Swarm initialized: current node (abc123) is now a manager.

To add a worker to this swarm, run the following command:
    docker swarm join --token SWMTKN-1-xxxxx 192.168.1.10:2377
```

**O que aconteceu:**
- Sua máquina agora é um **Manager Node**
- O Swarm está ativo e pronto para receber serviços
- Você pode adicionar outros nós (workers) com o token exibido

### Passo 2: Verificar o status do Swarm

```bash
docker node ls
```

**Saída esperada:**
```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
abc123xyz * (Este nó)         laptop     Ready     Active         Leader           24.0.0
```

**Explicação das colunas:**
- `ID`: Identificador único do nó
- `HOSTNAME`: Nome da máquina
- `STATUS`: Ready = funcionando
- `AVAILABILITY`: Active = pode receber tarefas
- `MANAGER STATUS`: Leader = é o gerenciador principal
- `*`: Indica o nó atual

### Passo 3: Criar arquivo .env (Variáveis de Ambiente)

Antes de fazer o deploy, configure as variáveis:

```bash
# Criar arquivo .env na raiz do projeto
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=postgres_secure_password_123
DB_NAME=football_db
JWT_SECRET=$(openssl rand -hex 64)
EOF
```

**Por que isso é importante:**
- `JWT_SECRET`: Chave secreta para autenticação (deve ser único e seguro)
- `DB_PASSWORD`: Senha do banco (troque em produção!)
- O Swarm vai ler essas variáveis do arquivo `.env`

### Passo 4: Fazer o deploy da stack no Swarm

```bash
docker stack deploy -c docker-compose.swarm.yml football
```

**Explicação do comando:**
- `docker stack deploy`: Comando para subir uma stack de serviços
- `-c docker-compose.swarm.yml`: Arquivo de configuração da stack
- `football`: Nome da stack (você escolhe)

**Saída esperada:**
```
Creating network football_frontend
Creating network football_backend
Creating service football_postgres
Creating service football_redis
Creating service football_app
Creating service football_nginx
```

**O que aconteceu:**
1. Criou 2 redes overlay (`frontend` e `backend`)
2. Criou 4 serviços (postgres, redis, app, nginx)
3. Cada serviço vai criar suas réplicas conforme o `docker-compose.swarm.yml`

### Passo 5: Verificar os serviços

```bash
docker service ls
```

**Saída esperada:**
```
ID             NAME               MODE         REPLICAS   IMAGE                              PORTS
abc123         football_app       replicated   3/3        multiplayer-soccer-app:latest
def456         football_nginx     replicated   2/2        multiplayer-soccer-nginx:latest    *:80->80/tcp
ghi789         football_postgres  replicated   1/1        postgres:17
jkl012         football_redis     replicated   1/1        redis:7-alpine
```

**Explicação das colunas:**
- `NAME`: Nome do serviço (prefixo = nome da stack)
- `MODE`: replicated = múltiplas réplicas; global = uma por nó
- `REPLICAS`: Quantas réplicas estão rodando vs. esperadas
  - `3/3` = 3 containers rodando, 3 esperados ✅
  - `1/3` = 1 rodando, 3 esperados ⚠️ (ainda subindo ou com erro)
- `PORTS`: Portas expostas externamente

### Passo 6: Verificar os containers (tasks)

```bash
docker service ps football_app
```

**Saída esperada:**
```
ID             NAME             IMAGE                           NODE      DESIRED STATE   CURRENT STATE
abc1           football_app.1   multiplayer-soccer-app:latest   laptop    Running         Running 2 minutes ago
def2           football_app.2   multiplayer-soccer-app:latest   laptop    Running         Running 2 minutes ago
ghi3           football_app.3   multiplayer-soccer-app:latest   laptop    Running         Running 2 minutes ago
```

**O que isso mostra:**
- Há **3 réplicas** do serviço `app` rodando
- Todas estão no mesmo `NODE` (sua máquina) porque é um swarm local
- `CURRENT STATE`: Running = funcionando corretamente

### Passo 7: Acessar a aplicação

Abra o navegador e acesse:

```
http://localhost
```

**O que está acontecendo nos bastidores:**
1. Requisição chega na porta **80**
2. Nginx (2 réplicas) recebe e **balanceia** entre as 3 réplicas do app
3. App se conecta ao PostgreSQL e Redis
4. Resposta retorna para o navegador

### Passo 8: Testar o balanceamento de carga

Abra várias abas do navegador e recarregue a página. O Swarm irá **distribuir** automaticamente as requisições entre as 3 réplicas do app.

Para ver isso em ação, veja os logs de todas as réplicas:

```bash
docker service logs -f football_app
```

**Saída (exemplo):**
```
football_app.1@abc123 | Server listening on port 3000
football_app.2@def456 | Server listening on port 3000
football_app.3@ghi789 | Server listening on port 3000
football_app.2@def456 | New connection from 172.18.0.5
football_app.1@abc123 | New connection from 172.18.0.6
football_app.3@ghi789 | New connection from 172.18.0.7
```

Veja como as conexões vão para **réplicas diferentes**!

---

## Comandos Úteis

### Gerenciamento de Stack

```bash
# Listar todas as stacks
docker stack ls

# Ver serviços de uma stack
docker stack services football

# Ver tasks (containers) de uma stack
docker stack ps football

# Remover uma stack (para tudo e remove)
docker stack rm football
```

### Gerenciamento de Serviços

```bash
# Listar todos os serviços
docker service ls

# Detalhes de um serviço específico
docker service inspect football_app

# Ver logs de um serviço
docker service logs football_app

# Logs em tempo real (follow)
docker service logs -f football_app

# Escalar um serviço (aumentar/diminuir réplicas)
docker service scale football_app=5

# Atualizar imagem de um serviço
docker service update --image multiplayer-soccer-app:v2 football_app
```

### Informações do Cluster

```bash
# Listar nós do swarm
docker node ls

# Detalhes de um nó
docker node inspect self

# Ver tarefas rodando em um nó
docker node ps self
```

### Redes

```bash
# Listar redes overlay
docker network ls | grep overlay

# Inspecionar uma rede
docker network inspect football_frontend
```

### Limpeza

```bash
# Remover a stack
docker stack rm football

# Sair do modo swarm
docker swarm leave --force

# Limpar volumes não utilizados
docker volume prune
```

---

## Escalabilidade e Atualização

### Escalar Serviços

**Aumentar número de réplicas do app:**

```bash
docker service scale football_app=5
```

**O que acontece:**
- O Swarm cria 2 novos containers (de 3 para 5)
- O load balancer automaticamente inclui as novas réplicas
- Zero downtime!

**Reduzir réplicas:**

```bash
docker service scale football_app=2
```

**Quando escalar?**
- ⬆️ **Aumentar** quando tiver muitos jogadores conectados
- ⬇️ **Reduzir** em horários de baixo uso (economizar recursos)

### Rolling Updates (Atualização sem Downtime)

Imagine que você corrigiu um bug e criou uma nova versão da imagem:

```bash
# 1. Build da nova versão
docker build -t multiplayer-soccer-app:v2 -f dockerfile .

# 2. Atualizar o serviço (rolling update)
docker service update --image multiplayer-soccer-app:v2 football_app
```

**O que acontece:**
```
Passo 1: Swarm para 1 container antigo
Passo 2: Swarm cria 1 container novo (v2)
Passo 3: Aguarda 10s (delay configurado)
Passo 4: Repete para o próximo container
```

**Resultado:**
- ✅ Sempre há containers rodando
- ✅ Zero downtime
- ✅ Se der erro, faz rollback automático

**Configuração no docker-compose.swarm.yml:**
```yaml
deploy:
  update_config:
    parallelism: 1        # Atualiza 1 de cada vez
    delay: 10s            # Espera 10s entre atualizações
    failure_action: rollback  # Se der erro, volta versão anterior
    order: start-first    # Cria novo antes de matar o antigo
```

### Rollback Manual

Se algo der errado:

```bash
docker service rollback football_app
```

Volta para a versão anterior automaticamente!

---

## Monitoramento

### Ver status geral

```bash
# Status de todos os serviços
docker service ls

# Tasks de um serviço específico
docker service ps football_app

# Logs em tempo real
docker service logs -f football_app --tail 100
```

### Estatísticas de recursos

```bash
# CPU e Memória de todos os containers
docker stats

# Estatísticas de um serviço específico
docker stats $(docker ps -q -f name=football_app)
```

**Saída esperada:**
```
CONTAINER ID   NAME             CPU %   MEM USAGE / LIMIT   MEM %   NET I/O
abc123         football_app.1   5.2%    250MB / 512MB       48.8%   1.2MB / 800KB
def456         football_app.2   4.8%    245MB / 512MB       47.8%   1.1MB / 750KB
```

### Health Checks

Os serviços têm health checks configurados. Para ver o status:

```bash
docker service inspect football_app --format '{{json .UpdateStatus}}' | jq
```

---

## Troubleshooting

### Serviço não inicia (0/3 replicas)

```bash
# Ver logs do serviço
docker service logs football_app

# Ver detalhes das tasks
docker service ps football_app --no-trunc
```

**Problemas comuns:**
- ❌ Imagem não encontrada → Fazer build da imagem
- ❌ Variável de ambiente faltando → Verificar arquivo `.env`
- ❌ Porta já em uso → Mudar porta ou parar outro serviço
- ❌ Falta de recursos → Reduzir réplicas ou limites de memória

### Containers reiniciando constantemente

```bash
# Ver logs detalhados
docker service logs football_app --tail 200

# Ver health check status
docker service inspect football_app | grep -A 10 Health
```

**Soluções:**
- Aumentar `start_period` no health check
- Verificar se banco de dados está acessível
- Verificar conexões entre redes

### Banco de dados não conecta

```bash
# Verificar se postgres está rodando
docker service ps football_postgres

# Testar conexão
docker exec -it $(docker ps -q -f name=football_postgres) psql -U postgres -d football_db
```

### Reset completo

Se algo der muito errado:

```bash
# 1. Remover a stack
docker stack rm football

# 2. Aguardar tudo parar
sleep 10

# 3. Limpar volumes (CUIDADO: apaga dados!)
docker volume prune -f

# 4. Sair do swarm
docker swarm leave --force

# 5. Inicializar novamente
docker swarm init

# 6. Deploy novamente
docker stack deploy -c docker-compose.swarm.yml football
```

---

## Diferenças: Docker Compose vs Docker Swarm

### Comandos equivalentes

| Docker Compose | Docker Swarm Stack |
|----------------|-------------------|
| `docker-compose up -d` | `docker stack deploy -c <file> <name>` |
| `docker-compose down` | `docker stack rm <name>` |
| `docker-compose ps` | `docker stack ps <name>` |
| `docker-compose logs -f` | `docker service logs -f <service>` |
| `docker-compose scale app=3` | `docker service scale <service>=3` |

### Arquivo de configuração

**Docker Compose:**
```yaml
services:
  app:
    build: .           # Build local
    ports:
      - "3000:3000"    # Porta simples
```

**Docker Swarm:**
```yaml
services:
  app:
    image: app:latest  # Usa imagem já construída
    ports:
      - target: 3000   # Configuração avançada
        published: 3000
    deploy:            # Seção específica do Swarm
      replicas: 3
      resources:
        limits:
          cpus: '1'
```

### Principais diferenças

| Aspecto | Compose | Swarm |
|---------|---------|-------|
| **Propósito** | Desenvolvimento local | Produção/Cluster |
| **Build** | Faz build automático | Precisa de imagem pronta |
| **Volumes** | Mapeamento local | Named volumes |
| **Redes** | Bridge | Overlay |
| **Escalabilidade** | Limitada | Horizontal |
| **HA** | Não | Sim |

---

## Próximos Passos

Agora que você testou localmente, aprenda a fazer deploy em produção na AWS:

📘 Leia o guia completo: **[DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md)**

Você aprenderá:
- Como configurar um cluster Swarm multi-node na AWS
- Security Groups e configuração de rede
- Load Balancer externo (ALB)
- Monitoramento e auto-scaling
- Backup e disaster recovery

---

## Resumo dos Comandos Principais

```bash
# Iniciar Swarm
docker swarm init

# Build das imagens
docker build -t multiplayer-soccer-app:latest -f dockerfile .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# Deploy da stack
docker stack deploy -c docker-compose.swarm.yml football

# Verificar serviços
docker service ls
docker service ps football_app

# Ver logs
docker service logs -f football_app

# Escalar
docker service scale football_app=5

# Atualizar
docker service update --image multiplayer-soccer-app:v2 football_app

# Remover
docker stack rm football

# Sair do swarm
docker swarm leave --force
```

---

**🎮 Divirta-se orquestrando seu jogo multiplayer com Docker Swarm!**
