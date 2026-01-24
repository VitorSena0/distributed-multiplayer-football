# Interface Gráfica para Docker Swarm - Portainer

## 🖥️ Por que Interface Gráfica?

Gerenciar Docker Swarm via terminal pode ser complexo. O **Portainer** oferece uma interface web intuitiva para:

- ✅ Visualizar todos os serviços e containers
- ✅ Ver logs em tempo real com um clique
- ✅ Escalar serviços com slider
- ✅ Atualizar imagens sem comandos
- ✅ Monitorar recursos (CPU, memória) graficamente
- ✅ Gerenciar stacks, volumes e redes

**Vantagens:**
- Mais intuitivo que comandos de terminal
- Visualização gráfica do cluster
- Acesso fácil aos logs
- Gerenciamento centralizado

---

## 🚀 Instalação do Portainer

### Opção 1: Instalação Rápida (Recomendada)

Execute este script que instala o Portainer automaticamente:

```bash
./scripts/install-portainer.sh
```

### Opção 2: Instalação Manual

#### Passo 1: Criar volume para dados do Portainer

```bash
docker volume create portainer_data
```

**Por que criar volume?**
- Mantém configurações e dados do Portainer
- Sobrevive a reinicializações
- Permite backup fácil

#### Passo 2: Deploy do Portainer no Swarm

```bash
docker service create \
  --name portainer \
  --publish 9000:9000 \
  --publish 8000:8000 \
  --constraint 'node.role == manager' \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  --mount type=volume,src=portainer_data,dst=/data \
  portainer/portainer-ce:latest \
  -H unix:///var/run/docker.sock
```

**Explicação dos parâmetros:**
- `--publish 9000:9000`: Porta da interface web
- `--publish 8000:8000`: Porta para Edge Agent (opcional)
- `--constraint 'node.role == manager'`: Roda no manager (tem acesso ao Swarm)
- `--mount type=bind,src=/var/run/docker.sock`: Acesso ao Docker daemon
- `--mount type=volume,src=portainer_data`: Volume para persistência

#### Passo 3: Aguardar inicialização

```bash
# Verificar se está rodando
docker service ls | grep portainer

# Aguardar até mostrar 1/1
docker service ps portainer
```

---

## 🌐 Acessar Portainer

### Primeira vez

1. Abra o navegador: **http://localhost:9000**
2. Crie uma senha de administrador (mínimo 12 caracteres)
3. Clique em **"Get Started"**
4. Selecione o ambiente **"Primary"**

### Login

- URL: **http://localhost:9000**
- Usuário: **admin**
- Senha: a que você criou

---

## 📊 Usando o Portainer

### Dashboard Principal

Após login, você verá:

```
┌─────────────────────────────────────────┐
│        Portainer Dashboard              │
├─────────────────────────────────────────┤
│  Environments                           │
│  ├─ Primary (local)                     │
│  │  ├─ Stacks:        1                 │
│  │  ├─ Services:      4                 │
│  │  ├─ Containers:    7                 │
│  │  ├─ Networks:      3                 │
│  │  └─ Volumes:       2                 │
└─────────────────────────────────────────┘
```

### 1. Visualizar Serviços

**Menu lateral → Swarm → Services**

Você verá uma tabela com:
- Nome do serviço
- Stack
- Réplicas (ex: 3/3)
- Imagem
- Status

**Ações disponíveis (botões):**
- 👁️ View - Ver detalhes
- 📊 Logs - Ver logs
- ✏️ Edit - Editar configurações
- 🔄 Update - Atualizar imagem
- 🗑️ Remove - Remover serviço

### 2. Escalar Serviços

**Forma Gráfica:**

1. Clique no serviço (ex: `football_app`)
2. Clique em **"Edit service"** ou **"Scale service"**
3. Use o **slider** ou digite o número de réplicas
4. Clique em **"Apply changes"**

**Resultado:**
- Swarm cria/remove containers automaticamente
- Você vê o progresso em tempo real

**Vs Terminal:**
```bash
# Terminal (antigo)
docker service scale football_app=5

# Portainer: 2 cliques + slider
```

### 3. Ver Logs

**Forma Gráfica:**

1. **Services** → Clique no serviço
2. Aba **"Service logs"**
3. Opções:
   - ✅ Auto-refresh (atualização automática)
   - ✅ Search (buscar texto)
   - ✅ Filter by timestamp
   - ✅ Download logs

**Vs Terminal:**
```bash
# Terminal
docker service logs -f football_app

# Portainer: 2 cliques + interface amigável
```

### 4. Monitorar Recursos

**Menu → Swarm → Nodes**

Visualização gráfica:
- CPU usage (%)
- Memory usage (MB/GB)
- Número de containers por nó
- Status (Ready/Down)

**Cards visuais:**
```
┌─────────────────────┐
│   Manager Node      │
│   CPU:  45%  ▓▓▓░░ │
│   RAM:  2.1/4GB     │
│   Containers: 5     │
└─────────────────────┘
```

### 5. Gerenciar Stacks

**Menu → Stacks**

**Ver stack existente (football):**
1. Clique em **"football"**
2. Veja todos os serviços
3. Botões:
   - **Stop stack** - Parar tudo
   - **Remove stack** - Remover
   - **Edit stack** - Editar YAML
   - **Duplicate** - Duplicar

**Deploy nova stack:**
1. Clique em **"Add stack"**
2. Opções:
   - **Web editor**: Cole o YAML
   - **Upload**: Enviar arquivo
   - **Git**: Clonar repositório
3. Clique em **"Deploy stack"**

### 6. Atualizar Serviço (Rolling Update)

**Forma Gráfica:**

1. **Services** → Clique no serviço
2. **Edit service**
3. Seção **"Image"**
4. Altere a tag (ex: `app:latest` → `app:v2`)
5. **Update service**

Portainer mostra:
- Progresso da atualização
- Quantos containers foram atualizados
- Status de cada réplica

**Vs Terminal:**
```bash
docker service update --image app:v2 football_app
```

### 7. Ver Containers (Tasks)

**Services → football_app → Tasks**

Tabela com:
- Task name (app.1, app.2, app.3)
- Node (em qual servidor está)
- Desired state vs Current state
- Error (se houver)
- Botões: View logs, Inspect

### 8. Gerenciar Volumes

**Menu → Volumes**

- Lista todos os volumes
- Ver tamanho
- Remover volumes não usados
- Criar novos volumes

**Vs Terminal:**
```bash
docker volume ls
docker volume rm volume_name
```

### 9. Gerenciar Redes

**Menu → Networks**

- Ver redes overlay (frontend, backend)
- Ver containers conectados
- Criar/remover redes

Visualização:
```
Network: football_frontend
├─ football_app.1
├─ football_app.2
├─ football_nginx.1
└─ football_nginx.2
```

---

## 🎯 Fluxo de Trabalho Típico

### Deploy Inicial (Usando Interface)

1. **Portainer → Stacks → Add stack**
2. Nome: `football`
3. Upload do arquivo `docker-compose.swarm.yml`
4. **Variáveis de ambiente**:
   - Adicionar DB_PASSWORD
   - Adicionar JWT_SECRET
5. **Deploy stack**

### Monitoramento Diário

1. **Dashboard** - Ver overview
2. **Services** - Verificar réplicas (3/3, 2/2, etc.)
3. **Logs** - Ver erros
4. **Nodes** - Ver recursos (CPU, RAM)

### Escalar em Horário de Pico

1. **Services** → `football_app`
2. **Scale service**
3. Slider: 3 → 10 réplicas
4. **Apply**
5. Ver criação em tempo real

### Atualizar Aplicação

1. **Services** → `football_app`
2. **Edit** → Seção **Image**
3. Trocar tag: `latest` → `v2`
4. **Update**
5. Ver rolling update acontecendo

---

## 📱 Acesso Remoto (AWS)

### Configuração de Security Group

Adicione regra no Security Group do Manager:

```bash
# Via AWS CLI
aws ec2 authorize-security-group-ingress \
  --group-id $MANAGER_SG_ID \
  --protocol tcp \
  --port 9000 \
  --cidr SEU_IP/32
```

**Ou via Console AWS:**
1. EC2 → Security Groups
2. Selecione o SG do Manager
3. Inbound rules → Add rule
4. Type: Custom TCP
5. Port: 9000
6. Source: Meu IP

### Acessar remotamente

URL: **http://IP_DO_MANAGER_AWS:9000**

Exemplo: `http://54.123.45.67:9000`

### Segurança

⚠️ **IMPORTANTE:**
- Use HTTPS em produção (veja seção abaixo)
- Restrinja acesso ao seu IP
- Use senha forte (mínimo 12 chars)
- Habilite autenticação de dois fatores

---

## 🔒 HTTPS com SSL (Produção)

### Usando Nginx reverso

1. Criar certificado SSL (Let's Encrypt)
2. Configurar Nginx para proxy reverso
3. Apontar para Portainer (porta 9000)

**Exemplo nginx.conf:**
```nginx
server {
    listen 443 ssl;
    server_name portainer.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Acesso: **https://portainer.seudominio.com**

---

## 📊 Comparação: Terminal vs Portainer

| Tarefa | Terminal | Portainer |
|--------|----------|-----------|
| **Ver serviços** | `docker service ls` | Menu → Services (tabela visual) |
| **Escalar** | `docker service scale app=5` | Slider ou input + clique |
| **Logs** | `docker service logs -f app` | Services → Logs (busca, filtro) |
| **Monitorar CPU/RAM** | `docker stats` | Dashboard gráfico |
| **Rolling update** | `docker service update --image` | Edit → Image → Update |
| **Deploy stack** | `docker stack deploy` | Upload YAML + Deploy |
| **Ver containers** | `docker service ps app` | Tasks tab (tabela visual) |
| **Remover stack** | `docker stack rm football` | Stack → Remove (confirmar) |

**Conclusão:**
- **Terminal**: Mais rápido para quem sabe comandos
- **Portainer**: Mais intuitivo para iniciantes e visualização

---

## 🎓 Tutoriais Interativos

### 1. Primeiro Deploy com Portainer

**Passo a passo:**

1. Abra Portainer: `http://localhost:9000`
2. Login com admin
3. Clique em **"Stacks"** no menu
4. Clique em **"Add stack"**
5. Nome: `football-test`
6. **Web editor** → Cole este YAML:

```yaml
version: '3.8'
services:
  hello:
    image: nginx:alpine
    ports:
      - "8080:80"
    deploy:
      replicas: 2
```

7. Clique em **"Deploy the stack"**
8. Veja os serviços criando
9. Acesse: `http://localhost:8080`

### 2. Escalar Visualmente

1. **Services** → `football-test_hello`
2. Note: **Replicas: 2/2**
3. Clique em **"Scale service"**
4. Use o **slider** para mudar de 2 para 5
5. **Apply**
6. Veja os novos containers sendo criados em tempo real!

### 3. Ver Logs com Filtros

1. **Services** → `football_app`
2. Aba **"Service logs"**
3. Enable **"Auto-refresh"**
4. Caixa de busca: Digite `error` ou `connected`
5. Veja apenas logs relevantes

---

## 🛠️ Funcionalidades Avançadas

### 1. Templates

Portainer tem templates pré-configurados:
- WordPress + MySQL
- PostgreSQL
- Redis
- Nginx

**Usar template:**
1. **App Templates**
2. Escolha template
3. Customize
4. Deploy

### 2. Registries

Adicionar Docker Hub, AWS ECR, etc:
1. **Registries** → Add
2. Tipo: Docker Hub / ECR
3. Credenciais
4. Salvar

Deploy com imagens privadas fica fácil!

### 3. Usuários e Permissões

Para times:
1. **Users** → Add user
2. Definir role (admin, operator, user)
3. Cada um tem seu acesso

### 4. Webhooks

Atualizar serviço via webhook:
1. Service → Webhooks
2. Copiar URL
3. Configurar CI/CD para chamar URL
4. Deploy automático!

### 5. Edge Computing

Gerenciar Swarm remoto:
1. **Endpoints** → Add endpoint
2. Edge Agent
3. Instalar agent no cluster remoto
4. Gerenciar vários clusters de um Portainer!

---

## 📈 Monitoramento Avançado

### Grafana + Prometheus (via Portainer)

1. **Stacks** → Add stack
2. Nome: `monitoring`
3. Copiar stack monitoring (disponível em `stacks/monitoring.yml`)
4. Deploy

Acesse:
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

Dashboards incluem:
- CPU por serviço
- Memória por nó
- Network I/O
- Réplicas ao longo do tempo

---

## 💡 Dicas e Truques

### 1. Atalhos de Teclado

- `Ctrl + K`: Busca global
- `Ctrl + /`: Ajuda

### 2. Filtros Rápidos

Na lista de serviços:
- Clique em tag para filtrar
- Use barra de busca

### 3. Favoritos

Marque páginas favoritas (⭐) para acesso rápido

### 4. Dark Mode

**User settings** → **Theme** → Dark

### 5. Export/Import

**Settings** → Backup
- Download configuração
- Restaurar em outro Portainer

---

## 🔧 Troubleshooting

### Portainer não inicia

```bash
# Ver logs
docker service logs portainer

# Verificar se porta está livre
sudo netstat -tulpn | grep 9000

# Reiniciar
docker service update --force portainer
```

### Não conecta ao Swarm

1. Verificar se está no manager node
2. Volume do Docker socket montado corretamente?
3. Permissões do socket: `ls -la /var/run/docker.sock`

### Interface lenta

1. Muitos containers? (>100)
2. Considere aumentar recursos do Portainer
3. Ou use filtros para reduzir dados na tela

---

## 📚 Recursos

### Documentação Oficial
- Portainer: https://docs.portainer.io/
- Swarm no Portainer: https://docs.portainer.io/user/docker/swarm

### Vídeos
- YouTube: "Portainer Tutorial"
- YouTube: "Docker Swarm with Portainer"

### Comunidade
- Forum: https://forum.portainer.io/
- Discord: Link no site oficial

---

## 🎯 Conclusão

O Portainer transforma gerenciamento de Docker Swarm de **comandos complexos** em **interface visual intuitiva**.

**Vantagens:**
- ✅ Mais fácil para iniciantes
- ✅ Visualização clara do cluster
- ✅ Acesso rápido aos logs
- ✅ Monitoramento gráfico
- ✅ Menos erros de digitação

**Recomendação:**
- **Desenvolvimento**: Use Portainer
- **Produção**: Portainer + comandos (para automação)
- **Time**: Portainer para todos, CI/CD com comandos

**Próximo passo:**
```bash
./scripts/install-portainer.sh
# Acesse: http://localhost:9000
```

---

**Documentação relacionada:**
- [DOCKER_SWARM.md](./DOCKER_SWARM.md) - Comandos de terminal
- [DOCKER_SWARM_QUICKSTART.md](./DOCKER_SWARM_QUICKSTART.md) - Quick start
- [DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md) - Deploy AWS
