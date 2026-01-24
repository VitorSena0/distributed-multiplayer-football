# Quick Start: Docker Swarm

Guia rápido para começar a usar Docker Swarm com o Multiplayer Soccer.

## 🖥️ Prefere Interface Gráfica?

**Novo!** Use o **Portainer** para gerenciar tudo visualmente:

```bash
# Instalar interface gráfica
./scripts/install-portainer.sh

# Acesse: http://localhost:9000
```

✅ **Mais intuitivo** - Cliques ao invés de comandos  
✅ **Visualização gráfica** - Ver status de todos os serviços  
✅ **Logs fáceis** - Ver logs com busca e filtros  
✅ **Escalar visualmente** - Usar slider para ajustar réplicas

📘 **Guia completo:** [DOCKER_SWARM_PORTAINER.md](./DOCKER_SWARM_PORTAINER.md)

---

## 🚀 Deploy Local (Via Terminal)

### Opção 1: Scripts Automatizados (Recomendado)

```bash
# 1. Inicializar Swarm
./scripts/swarm-init.sh

# 2. Build das imagens
./scripts/build-images.sh

# 3. Deploy da aplicação
./scripts/deploy-local.sh
```

Acesse: **http://localhost**

### Opção 2: Manual

```bash
# 1. Inicializar Swarm
docker swarm init

# 2. Build das imagens
docker build -t multiplayer-soccer-app:latest -f dockerfile .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# 3. Configurar variáveis (se ainda não tiver .env)
cp .env.example .env

# 4. Deploy
docker stack deploy -c docker-compose.swarm.yml football
```

---

## 📊 Comandos Úteis

### Monitoramento

```bash
# Listar serviços
docker service ls

# Ver logs do app
docker service logs -f football_app

# Ver distribuição de containers
docker stack ps football

# Estatísticas de recursos
docker stats
```

### Escalabilidade

```bash
# Aumentar réplicas do app para 5
docker service scale football_app=5

# Reduzir para 2
docker service scale football_app=2
```

### Atualização

```bash
# Build nova versão
docker build -t multiplayer-soccer-app:v2 -f dockerfile .

# Atualizar serviço (rolling update)
docker service update --image multiplayer-soccer-app:v2 football_app

# Rollback se der problema
docker service rollback football_app
```

### Limpeza

```bash
# Usar script (recomendado)
./scripts/swarm-cleanup.sh

# Ou manual:
docker stack rm football
docker swarm leave --force
```

---

## 🖥️ Interface Gráfica (Portainer)

**Alternativa aos comandos de terminal:**

### Instalação

```bash
./scripts/install-portainer.sh
# Acesse: http://localhost:9000
```

### O que você pode fazer com Portainer

✅ **Ver todos os serviços** - Tabela visual com status  
✅ **Escalar com slider** - Arrastar para ajustar réplicas  
✅ **Logs com busca** - Filtrar logs facilmente  
✅ **Monitorar recursos** - Gráficos de CPU/RAM  
✅ **Deploy visual** - Upload YAML e clique  
✅ **Rolling updates** - Atualizar com cliques

### Exemplos visuais

**Ver serviços:**
- Menu → Swarm → Services
- Tabela com réplicas, status, ações

**Escalar:**
- Clique no serviço → Scale service
- Use slider: 3 → 5 réplicas
- Apply

**Ver logs:**
- Clique no serviço → Service logs
- Auto-refresh ativado
- Buscar por texto

📘 **Guia completo:** [DOCKER_SWARM_PORTAINER.md](./DOCKER_SWARM_PORTAINER.md)

---

## 🌐 Deploy AWS

Para deploy em produção na AWS, siga o guia completo:

📘 **[DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md)**

**Resumo dos passos:**

1. Criar 3 instâncias EC2 (1 manager + 2 workers)
2. Configurar Security Groups
3. Instalar Docker em todas
4. Inicializar Swarm no manager
5. Juntar workers ao cluster
6. Fazer deploy da stack
7. Configurar Application Load Balancer

---

## 📚 Documentação Completa

- **[DOCKER_SWARM.md](./DOCKER_SWARM.md)** - Guia completo local
- **[DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md)** - Deploy na AWS
- **[ARQUITETURA.md](./ARQUITETURA.md)** - Arquitetura da aplicação
- **[README.md](../README.md)** - Documentação principal

---

## 🔧 Troubleshooting Rápido

### Serviço não inicia

```bash
docker service ps football_app --no-trunc
docker service logs football_app --tail 100
```

### Remover tudo e começar de novo

```bash
./scripts/swarm-cleanup.sh
./scripts/swarm-init.sh
./scripts/build-images.sh
./scripts/deploy-local.sh
```

### Banco de dados não conecta

```bash
# Ver logs do postgres
docker service logs football_postgres

# Verificar se está rodando
docker service ps football_postgres
```

---

## ⚙️ Configurações Importantes

### Arquivo docker-compose.swarm.yml

- **Réplicas do App**: 3 (altere em `deploy.replicas`)
- **Réplicas do Nginx**: 2
- **Limites de CPU/Memória**: Configurados em `deploy.resources`
- **Redes**: `frontend` (nginx ↔ app) e `backend` (app ↔ db)

### Variáveis de Ambiente (.env)

```bash
DB_USER=postgres
DB_PASSWORD=senha_segura_aqui
DB_NAME=football_db
JWT_SECRET=chave_secreta_64_chars
```

**Gerar JWT_SECRET seguro:**
```bash
openssl rand -hex 64
```

---

## 📈 Diferenças vs Docker Compose

| Docker Compose | Docker Swarm |
|---------------|--------------|
| Desenvolvimento | Produção |
| 1 máquina | Múltiplas máquinas |
| Sem HA | Alta disponibilidade |
| Escala limitada | Escala horizontal |
| `docker-compose up` | `docker stack deploy` |

---

## 🎯 Próximos Passos

1. ✅ Testar localmente com Swarm
2. ✅ Entender os comandos básicos
3. 📘 Ler documentação completa ([DOCKER_SWARM.md](./DOCKER_SWARM.md))
4. 🚀 Deploy na AWS ([DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md))
5. 📊 Configurar monitoramento (Prometheus + Grafana)
6. 🔒 Implementar HTTPS com SSL/TLS

---

**Dúvidas?** Consulte a documentação completa ou abra uma issue no GitHub.
