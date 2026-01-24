# Guia Completo: Deploy Docker Swarm na AWS

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração de Infraestrutura AWS](#configuração-de-infraestrutura-aws)
4. [Configuração do Cluster Swarm](#configuração-do-cluster-swarm)
5. [Deploy da Aplicação](#deploy-da-aplicação)
6. [Load Balancer (ALB)](#load-balancer-alb)
7. [Monitoramento e Logs](#monitoramento-e-logs)
8. [Backup e Disaster Recovery](#backup-e-disaster-recovery)
9. [Escalabilidade e Auto-Scaling](#escalabilidade-e-auto-scaling)
10. [Segurança](#segurança)
11. [Custos Estimados](#custos-estimados)
12. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Arquitetura Proposta na AWS

```
                        INTERNET
                           │
                           ▼
                    ┌──────────────┐
                    │   Route 53   │ (Opcional: DNS)
                    │   (DNS)      │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Application │
                    │ Load Balancer│ (Distribui tráfego)
                    │    (ALB)     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │  EC2    │      │  EC2    │      │  EC2    │
    │ Manager │◄────►│ Worker  │◄────►│ Worker  │
    │  Node   │      │  Node   │      │  Node   │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                    ┌─────▼──────┐
                    │   EBS      │ (Volumes persistentes)
                    │  Volumes   │
                    └────────────┘
```

### Componentes

- **1 Manager Node** (EC2 t3.medium): Gerencia o cluster
- **2 Worker Nodes** (EC2 t3.small): Executam containers
- **ALB**: Distribui tráfego HTTP/HTTPS
- **EBS Volumes**: Armazenamento persistente (PostgreSQL, Redis)
- **Security Groups**: Firewall para cada componente
- **VPC**: Rede isolada e segura

---

## Pré-requisitos

### Conta AWS
- Conta AWS ativa
- Usuário IAM com permissões de EC2, VPC, ELB
- Par de chaves SSH (.pem) criado

### Ferramentas locais
- AWS CLI instalado e configurado
- SSH client
- Docker (para build das imagens)

### Verificar AWS CLI

```bash
aws --version
# aws-cli/2.x.x

aws configure
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region name: us-east-1
# Default output format: json
```

---

## Configuração de Infraestrutura AWS

### Passo 1: Criar VPC e Subnets

#### Opção A: Usar VPC Default (Mais Simples)

A maioria das contas AWS já tem uma VPC default. Verificar:

```bash
aws ec2 describe-vpcs --filters "Name=is-default,Values=true"
```

Se existir, anote o `VpcId`.

#### Opção B: Criar VPC Customizada (Recomendado para Produção)

```bash
# Criar VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=football-vpc}]'

# Anotar o VpcId que aparece (ex: vpc-0abc123)
VPC_ID=vpc-0abc123

# Criar subnet pública
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=football-subnet-1}]'

# Criar segunda subnet (para alta disponibilidade do ALB)
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=football-subnet-2}]'
```

### Passo 2: Criar Security Groups

Vamos criar 3 security groups:
1. **swarm-manager-sg**: Para o nó manager
2. **swarm-worker-sg**: Para os nós workers
3. **swarm-alb-sg**: Para o Application Load Balancer

#### Security Group para ALB

```bash
# Criar SG para ALB
aws ec2 create-security-group \
  --group-name swarm-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID

# Anotar o GroupId (ex: sg-0abc123)
ALB_SG_ID=sg-0abc123

# Permitir HTTP (porta 80) de qualquer lugar
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Permitir HTTPS (porta 443) - se usar SSL
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

**Por que essas portas?**
- Porta 80 (HTTP): Permite acesso público ao jogo
- Porta 443 (HTTPS): Para conexão segura (recomendado em produção)

#### Security Group para Manager Node

```bash
# Criar SG para Manager
aws ec2 create-security-group \
  --group-name swarm-manager-sg \
  --description "Security group for Swarm Manager" \
  --vpc-id $VPC_ID

MANAGER_SG_ID=sg-0def456

# SSH (porta 22) - para acesso administrativo
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr SEU_IP/32  # Substitua SEU_IP pelo seu IP público

# Portas do Swarm - comunicação entre nós
# Porta 2377 (TCP): Management do cluster
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol tcp \
  --port 2377 \
  --source-group $MANAGER_SG_ID

# Porta 7946 (TCP e UDP): Comunicação entre nós
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol tcp \
  --port 7946 \
  --source-group $MANAGER_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol udp \
  --port 7946 \
  --source-group $MANAGER_SG_ID

# Porta 4789 (UDP): Overlay network
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol udp \
  --port 4789 \
  --source-group $MANAGER_SG_ID

# Porta 80 (HTTP): do ALB para os nós
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $ALB_SG_ID
```

**Por que essas portas?**
- **22 (SSH)**: Acesso remoto para administração
- **2377 (TCP)**: Comunicação de gerenciamento do Swarm
- **7946 (TCP/UDP)**: Descoberta de nós e comunicação
- **4789 (UDP)**: Rede overlay (containers em diferentes hosts)
- **80 (HTTP)**: ALB encaminha tráfego para containers

#### Security Group para Worker Nodes

```bash
# Criar SG para Workers
aws ec2 create-security-group \
  --group-name swarm-worker-sg \
  --description "Security group for Swarm Workers" \
  --vpc-id $VPC_ID

WORKER_SG_ID=sg-0ghi789

# SSH (porta 22)
aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr SEU_IP/32

# Permitir comunicação com Manager
aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol tcp \
  --port 2377 \
  --source-group $MANAGER_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol tcp \
  --port 7946 \
  --source-group $MANAGER_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol udp \
  --port 7946 \
  --source-group $MANAGER_SG_ID

aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol udp \
  --port 4789 \
  --source-group $MANAGER_SG_ID

# Porta 80 do ALB
aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol tcp \
  --port 80 \
  --source-group $ALB_SG_ID

# Permitir comunicação entre workers
aws ec2 authorize-security-group-ingress \
  --group-id $WORKER_SG_ID \
  --protocol all \
  --source-group $WORKER_SG_ID
```

### Passo 3: Criar as Instâncias EC2

#### Manager Node (1x t3.medium)

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name SUA_CHAVE_SSH \
  --security-group-ids $MANAGER_SG_ID \
  --subnet-id subnet-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=swarm-manager}]' \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]'
```

**Por que t3.medium?**
- 2 vCPUs, 4GB RAM
- Suficiente para gerenciar o cluster e rodar alguns containers
- O manager também pode executar tarefas (opcional)

#### Worker Nodes (2x t3.small)

```bash
# Worker 1
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name SUA_CHAVE_SSH \
  --security-group-ids $WORKER_SG_ID \
  --subnet-id subnet-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=swarm-worker-1}]' \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]'

# Worker 2
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name SUA_CHAVE_SSH \
  --security-group-ids $WORKER_SG_ID \
  --subnet-id subnet-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=swarm-worker-2}]' \
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]'
```

**Por que t3.small?**
- 2 vCPUs, 2GB RAM
- Barato e suficiente para rodar containers do jogo
- Escalável horizontalmente (adicionar mais workers se necessário)

**Nota sobre AMI:**
- `ami-0c55b159cbfafe1f0`: Amazon Linux 2 (us-east-1)
- Para outras regiões, encontre a AMI correta: https://aws.amazon.com/amazon-linux-2/

### Passo 4: Anotar IPs das Instâncias

```bash
# Listar instâncias e seus IPs
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=swarm-*" \
  --query 'Reservations[*].Instances[*].[Tags[?Key==`Name`].Value|[0],PublicIpAddress,PrivateIpAddress]' \
  --output table
```

**Anote:**
- IP Público do Manager (para SSH)
- IPs Privados de todos os nós (para comunicação interna)

---

## Configuração do Cluster Swarm

### Passo 1: Instalar Docker em todas as EC2

Conecte em **cada instância** via SSH e execute:

#### Manager Node

```bash
# Conectar
ssh -i sua-chave.pem ec2-user@IP_PUBLICO_MANAGER

# Atualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install docker -y

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker
sudo usermod -aG docker ec2-user

# Sair e reconectar para aplicar grupo
exit
ssh -i sua-chave.pem ec2-user@IP_PUBLICO_MANAGER

# Verificar
docker --version
```

**Repita para Worker 1 e Worker 2** (conecte em cada um e execute os mesmos comandos).

### Passo 2: Inicializar o Swarm no Manager

No **Manager Node**:

```bash
docker swarm init --advertise-addr IP_PRIVADO_MANAGER
```

**Exemplo:**
```bash
docker swarm init --advertise-addr 10.0.1.50
```

**Saída esperada:**
```
Swarm initialized: current node (abc123) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-xxxxxxxxxxxxxx 10.0.1.50:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

**⚠️ IMPORTANTE:** Copie o comando `docker swarm join` que apareceu. Você vai usar nos workers.

**Por que --advertise-addr?**
- Diz ao Swarm qual IP usar para comunicação
- Use o **IP PRIVADO** da EC2 (não o público)
- Isso permite que os workers se conectem internamente (mais rápido e seguro)

### Passo 3: Juntar Workers ao Swarm

Conecte em **cada Worker Node** e execute o comando que foi gerado:

#### Worker 1

```bash
ssh -i sua-chave.pem ec2-user@IP_PUBLICO_WORKER1

docker swarm join --token SWMTKN-1-xxxxxxxxxxxxxx 10.0.1.50:2377
```

**Saída esperada:**
```
This node joined a swarm as a worker.
```

#### Worker 2

```bash
ssh -i sua-chave.pem ec2-user@IP_PUBLICO_WORKER2

docker swarm join --token SWMTKN-1-xxxxxxxxxxxxxx 10.0.1.50:2377
```

### Passo 4: Verificar o Cluster

No **Manager Node**:

```bash
docker node ls
```

**Saída esperada:**
```
ID                           HOSTNAME                     STATUS   AVAILABILITY   MANAGER STATUS
abc123xyz *                  ip-10-0-1-50.ec2.internal    Ready    Active         Leader
def456uvw                    ip-10-0-1-51.ec2.internal    Ready    Active
ghi789rst                    ip-10-0-1-52.ec2.internal    Ready    Active
```

**Explicação:**
- 3 nós no total ✅
- 1 Manager (Leader) ✅
- 2 Workers ✅
- Todos `Ready` e `Active` ✅

**Se algo estiver diferente**, veja a seção [Troubleshooting](#troubleshooting).

---

## Deploy da Aplicação

### Passo 1: Preparar Imagens Docker

Você tem 2 opções para levar as imagens para o cluster:

#### Opção A: Usar Docker Registry (Recomendado)

**1. Criar conta no Docker Hub** (gratuito): https://hub.docker.com

**2. Na sua máquina local, fazer login:**

```bash
docker login
# Username: seu_usuario
# Password: sua_senha
```

**3. Fazer build e push das imagens:**

```bash
cd /caminho/do/projeto/distributed-multiplayer-football

# Build com tag do seu usuário
docker build -t seu_usuario/multiplayer-soccer-app:latest -f dockerfile .
docker build -t seu_usuario/multiplayer-soccer-nginx:latest ./nginx

# Push para Docker Hub
docker push seu_usuario/multiplayer-soccer-app:latest
docker push seu_usuario/multiplayer-soccer-nginx:latest
```

**4. Atualizar `docker-compose.swarm.yml`:**

Edite o arquivo e troque:
```yaml
app:
  image: seu_usuario/multiplayer-soccer-app:latest  # <-- Seu usuário aqui
```

**Por que usar Registry?**
- ✅ Todos os nós baixam a imagem automaticamente
- ✅ Fácil atualizar (só fazer push e update)
- ✅ Não precisa copiar arquivos manualmente
- ✅ Funciona com auto-scaling

#### Opção B: Carregar imagens manualmente (para teste)

**1. Salvar imagens localmente:**

```bash
docker save -o app.tar multiplayer-soccer-app:latest
docker save -o nginx.tar multiplayer-soccer-nginx:latest
```

**2. Enviar para TODAS as EC2 (manager e workers):**

```bash
scp -i sua-chave.pem app.tar ec2-user@IP_MANAGER:~/
scp -i sua-chave.pem nginx.tar ec2-user@IP_MANAGER:~/

scp -i sua-chave.pem app.tar ec2-user@IP_WORKER1:~/
scp -i sua-chave.pem nginx.tar ec2-user@IP_WORKER1:~/

scp -i sua-chave.pem app.tar ec2-user@IP_WORKER2:~/
scp -i sua-chave.pem nginx.tar ec2-user@IP_WORKER2:~/
```

**3. Em CADA nó, carregar as imagens:**

```bash
ssh -i sua-chave.pem ec2-user@IP_DO_NO

docker load -i app.tar
docker load -i nginx.tar
docker images  # Verificar
```

**⚠️ Desvantagem:** Toda vez que atualizar a imagem, precisa repetir isso!

### Passo 2: Enviar arquivos de configuração para o Manager

No **Manager Node**, vamos criar os arquivos necessários:

```bash
ssh -i sua-chave.pem ec2-user@IP_MANAGER

# Criar diretório do projeto
mkdir -p ~/football-swarm
cd ~/football-swarm
```

**Enviar da sua máquina local:**

```bash
scp -i sua-chave.pem docker-compose.swarm.yml ec2-user@IP_MANAGER:~/football-swarm/
scp -i sua-chave.pem .env.example ec2-user@IP_MANAGER:~/football-swarm/.env
```

### Passo 3: Configurar variáveis de ambiente

No **Manager Node**:

```bash
cd ~/football-swarm

# Editar .env
nano .env
```

**Configurar:**
```bash
DB_USER=postgres
DB_PASSWORD=SENHA_FORTE_AQUI_123!@#
DB_NAME=football_db
JWT_SECRET=$(openssl rand -hex 64)  # Gerar automaticamente
```

**Para gerar JWT_SECRET seguro:**
```bash
openssl rand -hex 64
```

Cole o resultado no `.env`.

### Passo 4: Deploy da Stack

No **Manager Node**:

```bash
cd ~/football-swarm

# Deploy
docker stack deploy -c docker-compose.swarm.yml football
```

**Saída esperada:**
```
Creating network football_frontend
Creating network football_backend
Creating service football_postgres
Creating service football_redis
Creating service football_app
Creating service football_nginx
```

### Passo 5: Verificar o Deploy

```bash
# Ver serviços
docker service ls

# Ver distribuição de containers pelos nós
docker stack ps football
```

**Saída esperada:**
```
NAME                  NODE         DESIRED STATE   CURRENT STATE
football_app.1        worker-1     Running         Running 30 seconds ago
football_app.2        worker-2     Running         Running 30 seconds ago
football_app.3        manager      Running         Running 30 seconds ago
football_nginx.1      worker-1     Running         Running 25 seconds ago
football_nginx.2      worker-2     Running         Running 25 seconds ago
football_postgres.1   manager      Running         Running 35 seconds ago
football_redis.1      manager      Running         Running 35 seconds ago
```

**Observe:**
- Containers distribuídos entre os nós ✅
- PostgreSQL e Redis no manager (por causa do `constraint`) ✅
- App e Nginx distribuídos pelos workers ✅

### Passo 6: Testar acesso direto

Você já pode testar acessando um dos nós diretamente:

```bash
curl http://IP_PUBLICO_MANAGER
# ou
curl http://IP_PUBLICO_WORKER1
```

Deve retornar a página do jogo!

**Mas ainda não tem load balancing externo.** Vamos configurar isso agora.

---

## Load Balancer (ALB)

### Por que usar ALB?

Sem ALB, você precisa:
- ❌ Acessar cada IP de EC2 separadamente
- ❌ Gerenciar failover manualmente
- ❌ Expor IPs públicos de todos os nós

Com ALB:
- ✅ Um único DNS para acessar
- ✅ Distribui tráfego automaticamente
- ✅ Health checks e failover automático
- ✅ SSL/TLS gratuito (com ACM)

### Passo 1: Criar Target Group

```bash
# Criar target group
aws elbv2 create-target-group \
  --name football-targets \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Anotar o TargetGroupArn
TG_ARN=arn:aws:elasticloadbalancing:...
```

**O que é Target Group?**
- Lista de instâncias EC2 que vão receber tráfego
- Faz health check para garantir que estão saudáveis
- Remove automaticamente instâncias com problema

### Passo 2: Registrar instâncias no Target Group

```bash
# Registrar Manager
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=i-manager-id

# Registrar Worker 1
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=i-worker1-id

# Registrar Worker 2
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=i-worker2-id
```

### Passo 3: Criar Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name football-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups $ALB_SG_ID \
  --scheme internet-facing

# Anotar o LoadBalancerArn e DNSName
ALB_ARN=arn:aws:elasticloadbalancing:...
ALB_DNS=football-alb-1234567890.us-east-1.elb.amazonaws.com
```

**Explicação:**
- `--subnets`: Pelo menos 2 subnets em AZs diferentes (alta disponibilidade)
- `--scheme internet-facing`: Acessível da internet

### Passo 4: Criar Listener (porta 80)

```bash
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

**O que é Listener?**
- Escuta na porta 80 (HTTP)
- Encaminha tráfego para o Target Group
- Pode ter regras de roteamento (path-based, host-based)

### Passo 5: Acessar o jogo pelo ALB

```bash
echo "Acesse: http://$ALB_DNS"
```

**Exemplo:**
```
http://football-alb-1234567890.us-east-1.elb.amazonaws.com
```

**Teste:**
1. Abra no navegador
2. Jogue algumas partidas
3. Veja os logs para confirmar que diferentes containers estão respondendo

```bash
# No Manager Node
docker service logs -f football_app
```

Você verá logs de diferentes réplicas!

### (Opcional) Configurar SSL/HTTPS

Para produção, use HTTPS:

1. **Solicitar certificado no ACM (AWS Certificate Manager)**
2. **Criar listener na porta 443**
3. **Redirecionar HTTP (80) → HTTPS (443)**

Documentação: https://docs.aws.amazon.com/acm/latest/userguide/gs.html

---

## Monitoramento e Logs

### CloudWatch Logs

**1. Instalar CloudWatch Agent nas EC2:**

```bash
# Em cada EC2
sudo yum install amazon-cloudwatch-agent -y
```

**2. Configurar para enviar logs do Docker:**

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "/aws/ec2/docker/football",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
```

### Metrics do Swarm

No **Manager Node**, use Prometheus + Grafana (avançado):

```bash
# Deploy do Prometheus
docker service create \
  --name prometheus \
  --publish 9090:9090 \
  --mount type=bind,source=/etc/prometheus/prometheus.yml,target=/etc/prometheus/prometheus.yml \
  prom/prometheus

# Deploy do Grafana
docker service create \
  --name grafana \
  --publish 3001:3000 \
  grafana/grafana
```

Acesse:
- Prometheus: `http://IP_MANAGER:9090`
- Grafana: `http://IP_MANAGER:3001`

---

## Backup e Disaster Recovery

### Backup do PostgreSQL

**Script de backup automático:**

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER=$(docker ps -q -f name=football_postgres)

mkdir -p $BACKUP_DIR

# Backup do banco
docker exec $CONTAINER pg_dump -U postgres football_db > $BACKUP_DIR/db_$DATE.sql

# Compactar
gzip $BACKUP_DIR/db_$DATE.sql

# Enviar para S3 (opcional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://meu-bucket/backups/

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
```

**Agendar com cron:**

```bash
crontab -e

# Adicionar linha (backup às 2h da manhã):
0 2 * * * /home/ec2-user/backup-db.sh
```

### Snapshot de Volumes EBS

```bash
# Criar snapshot de um volume
aws ec2 create-snapshot \
  --volume-id vol-xxx \
  --description "Backup football database"

# Automatizar com Lambda + EventBridge
```

---

## Escalabilidade e Auto-Scaling

### Escalar serviços manualmente

```bash
# Aumentar réplicas do app
docker service scale football_app=6

# Nginx
docker service scale football_nginx=3
```

### Adicionar mais Worker Nodes

**1. Criar nova EC2:**

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name SUA_CHAVE \
  --security-group-ids $WORKER_SG_ID \
  --subnet-id subnet-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=swarm-worker-3}]'
```

**2. Instalar Docker (veja seção anterior)**

**3. Juntar ao Swarm:**

No Manager, obter o token:
```bash
docker swarm join-token worker
```

No novo worker:
```bash
docker swarm join --token SWMTKN-1-xxx IP_MANAGER:2377
```

**4. Registrar no Target Group:**

```bash
aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=i-worker3-id
```

**Pronto!** O Swarm automaticamente distribuirá containers para o novo nó.

### Auto Scaling Group (Avançado)

Para escalar automaticamente baseado em métricas (CPU, memória):

1. Criar Launch Template
2. Criar Auto Scaling Group
3. Configurar scaling policies
4. Script de user-data para juntar ao Swarm automaticamente

Documentação: https://docs.aws.amazon.com/autoscaling/

---

## Segurança

### Checklist de Segurança

- [ ] **Security Groups**: Apenas portas necessárias abertas
- [ ] **SSH**: Apenas do seu IP, não de 0.0.0.0/0
- [ ] **Senhas**: JWT_SECRET e DB_PASSWORD fortes
- [ ] **HTTPS**: Usar SSL/TLS em produção (ACM + ALB)
- [ ] **IAM Roles**: EC2 com role mínima necessária
- [ ] **Atualizar OS**: `sudo yum update -y` regularmente
- [ ] **Docker Security**: Usar imagens oficiais, atualizar regularmente
- [ ] **Secrets**: Usar Docker Secrets ao invés de variáveis de ambiente

### Usar Docker Secrets (Recomendado)

```bash
# Criar secret
echo "minha_senha_super_secreta" | docker secret create db_password -

# Usar no docker-compose.swarm.yml
services:
  app:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true
```

---

## Custos Estimados

### Calculadora de Custos (us-east-1)

| Recurso | Tipo | Quantidade | Custo/mês (aprox) |
|---------|------|------------|-------------------|
| EC2 Manager | t3.medium | 1 | $30 |
| EC2 Workers | t3.small | 2 | $30 ($15 cada) |
| ALB | - | 1 | $23 |
| EBS (gp3) | 30GB | 1 | $3 |
| EBS (gp3) | 20GB | 2 | $4 |
| Data Transfer | - | 10GB | $1 |
| **TOTAL** | | | **~$91/mês** |

**Notas:**
- Valores aproximados (pode variar por região)
- Não inclui custos de CloudWatch, S3, etc.
- Reserved Instances podem reduzir custo em ~40%
- Spot Instances para workers podem economizar até 70%

### Como reduzir custos

1. **Usar t3/t4g.micro/small** para ambiente de desenvolvimento
2. **Reserved Instances** (1-3 anos) para produção
3. **Auto Scaling** para desligar à noite/fins de semana
4. **Spot Instances** para workers (com fallback para on-demand)

---

## Troubleshooting

### Serviço não inicia

```bash
# Ver por que falhou
docker service ps football_app --no-trunc

# Logs detalhados
docker service logs football_app --tail 200
```

**Problemas comuns:**
- Imagem não encontrada → Fazer push para registry
- Falta de recursos → Reduzir limits ou adicionar nós
- Health check falhando → Aumentar `start_period`

### Nó não se junta ao Swarm

```bash
# Verificar conectividade
ping IP_MANAGER

# Testar porta 2377
telnet IP_MANAGER 2377

# Verificar security groups
```

**Soluções:**
- Verificar se security groups permitem porta 2377
- Usar IP privado, não público
- Verificar se Docker está rodando

### ALB retorna 502/503

```bash
# Ver health do target group
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

**Soluções:**
- Health check path correto?
- Containers realmente respondendo na porta 80?
- Security group permite tráfego do ALB?

### Performance ruim

```bash
# Ver recursos dos containers
docker stats

# Ver distribuição de containers
docker node ps $(docker node ls -q)
```

**Soluções:**
- Aumentar réplicas
- Adicionar mais workers
- Aumentar limites de CPU/memória

---

## Resumo dos Comandos AWS

```bash
# Criar Security Groups
aws ec2 create-security-group --group-name swarm-alb-sg ...
aws ec2 create-security-group --group-name swarm-manager-sg ...
aws ec2 create-security-group --group-name swarm-worker-sg ...

# Criar Instâncias
aws ec2 run-instances --instance-type t3.medium ...  # Manager
aws ec2 run-instances --instance-type t3.small ...   # Workers

# Criar ALB
aws elbv2 create-target-group --name football-targets ...
aws elbv2 create-load-balancer --name football-alb ...
aws elbv2 create-listener --protocol HTTP --port 80 ...

# Cleanup (deletar tudo)
docker stack rm football
docker swarm leave --force
aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN
aws elbv2 delete-target-group --target-group-arn $TG_ARN
aws ec2 terminate-instances --instance-ids i-xxx i-yyy i-zzz
```

---

## Próximos Passos

✅ Você agora tem um cluster Docker Swarm rodando na AWS!

**Melhorias futuras:**
- [ ] Configurar HTTPS com ACM
- [ ] Implementar Auto Scaling
- [ ] Configurar CI/CD (GitHub Actions + ECR)
- [ ] Monitoramento com Prometheus + Grafana
- [ ] Backup automatizado para S3
- [ ] Multi-AZ para alta disponibilidade
- [ ] CDN (CloudFront) para assets estáticos

**Documentação relacionada:**
- [DOCKER_SWARM.md](./DOCKER_SWARM.md) - Guia de uso local
- [ARQUITETURA.md](./ARQUITETURA.md) - Arquitetura da aplicação
- [SECURITY_REPORT.md](./SECURITY_REPORT.md) - Segurança

---

**🚀 Boa sorte com seu deploy em produção!**
