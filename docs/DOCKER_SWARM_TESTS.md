# Guia de Testes - Docker Swarm

Este documento contém instruções para testar a implementação do Docker Swarm.

## ✅ Checklist de Validação

### 1. Pré-requisitos

```bash
# Verificar instalação do Docker
docker --version
# Esperado: Docker version 20.10 ou superior

# Verificar se Docker está rodando
docker info
# Esperado: sem erros

# Verificar arquivos necessários
ls -la docker-compose.swarm.yml scripts/swarm-*.sh
# Esperado: todos os arquivos existem
```

### 2. Teste de Inicialização do Swarm

```bash
# Inicializar swarm
docker swarm init

# Verificar status
docker info | grep Swarm
# Esperado: Swarm: active

# Listar nós
docker node ls
# Esperado: 1 nó com status Ready e MANAGER STATUS Leader
```

**Saída esperada:**
```
ID                            HOSTNAME    STATUS    AVAILABILITY   MANAGER STATUS
abc123xyz *                   laptop      Ready     Active         Leader
```

### 3. Teste de Build das Imagens

```bash
# Build da imagem do app
docker build -t multiplayer-soccer-app:latest -f dockerfile .

# Build da imagem do nginx
docker build -t multiplayer-soccer-nginx:latest ./nginx

# Verificar imagens criadas
docker images | grep multiplayer-soccer
```

**Saída esperada:**
```
multiplayer-soccer-app     latest    abc123    X minutes ago   500MB
multiplayer-soccer-nginx   latest    def456    X minutes ago   50MB
```

### 4. Teste de Configuração

```bash
# Verificar arquivo .env
cat .env

# Se não existir, criar
cp .env.example .env

# Validar variáveis mínimas
grep -E "DB_USER|DB_PASSWORD|JWT_SECRET" .env
```

**Variáveis obrigatórias:**
- `DB_USER=postgres`
- `DB_PASSWORD=alguma_senha`
- `JWT_SECRET=chave_minimo_32_caracteres`

### 5. Teste de Deploy da Stack

```bash
# Deploy
docker stack deploy -c docker-compose.swarm.yml football

# Aguardar 10 segundos
sleep 10

# Verificar serviços
docker service ls
```

**Saída esperada:**
```
ID          NAME               MODE        REPLICAS   IMAGE
abc123      football_app       replicated  3/3        multiplayer-soccer-app:latest
def456      football_nginx     replicated  2/2        multiplayer-soccer-nginx:latest
ghi789      football_postgres  replicated  1/1        postgres:17
jkl012      football_redis     replicated  1/1        redis:7-alpine
```

**Critérios de sucesso:**
- ✅ Todos os serviços mostram `X/X` (réplicas iguais)
- ✅ Nenhum serviço em estado `0/X`

### 6. Teste de Health Checks

```bash
# Aguardar mais 30 segundos para health checks
sleep 30

# Verificar tasks em execução
docker stack ps football --filter "desired-state=running"
```

**Saída esperada:**
Todas as tasks devem estar em `CURRENT STATE: Running`

**Se alguma task estiver em Failed:**
```bash
# Ver detalhes do erro
docker service ps football_NOME_SERVICO --no-trunc
```

### 7. Teste de Conectividade entre Serviços

```bash
# Verificar logs do app (deve conectar ao postgres e redis)
docker service logs football_app --tail 50
```

**Logs esperados devem conter:**
- `✅ Connected to PostgreSQL`
- `✅ Connected to Redis`
- `Server listening on port 3000`
- Sem erros de conexão

**Se houver erros de conexão:**
```bash
# Verificar redes
docker network ls | grep football

# Inspecionar rede backend
docker network inspect football_backend
```

### 8. Teste de Acesso HTTP

```bash
# Testar endpoint do app diretamente
curl -I http://localhost
# Esperado: HTTP/1.1 200 OK

# Ou usar wget
wget --spider http://localhost
```

**Resposta esperada:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

**Se retornar erro:**
```bash
# Verificar logs do nginx
docker service logs football_nginx --tail 50
```

### 9. Teste de Distribuição de Containers

```bash
# Ver em qual nó cada container está rodando
docker stack ps football
```

**Validar:**
- ✅ Múltiplas réplicas do app distribuídas
- ✅ PostgreSQL no manager (por causa do constraint)
- ✅ Redis no manager (por causa do constraint)

### 10. Teste de Escalabilidade

```bash
# Escalar app para 5 réplicas
docker service scale football_app=5

# Aguardar 10 segundos
sleep 10

# Verificar
docker service ls | grep football_app
# Esperado: 5/5 replicas
```

### 11. Teste de Rolling Update

```bash
# Simular atualização
docker service update --force football_app

# Acompanhar atualização
docker service ps football_app
```

**Comportamento esperado:**
- Containers são atualizados 1 por vez (parallelism: 1)
- Aguarda 10s entre cada atualização
- Novos containers iniciam antes dos antigos pararem (start-first)

### 12. Teste de Logs

```bash
# Ver logs de todas as réplicas do app
docker service logs -f football_app --tail 100

# Em outra janela, fazer requisições
for i in {1..10}; do curl http://localhost > /dev/null 2>&1; sleep 1; done
```

**Validar:**
- ✅ Logs de diferentes réplicas (app.1, app.2, app.3, etc.)
- ✅ Requisições distribuídas entre réplicas

### 13. Teste de Recursos

```bash
# Ver uso de CPU e memória
docker stats --no-stream
```

**Validar limites configurados:**
- App: max 512MB RAM por container
- Nginx: max 256MB RAM por container
- PostgreSQL: max 1GB RAM
- Redis: max 512MB RAM

### 14. Teste de Failover

```bash
# Matar um container do app
docker ps | grep football_app
# Anotar um CONTAINER ID

docker kill <CONTAINER_ID>

# Aguardar 5 segundos
sleep 5

# Verificar que swarm recriou
docker service ps football_app
```

**Comportamento esperado:**
- ✅ Swarm detecta container morto
- ✅ Cria novo container automaticamente
- ✅ Serviço continua acessível

### 15. Teste de Cleanup

```bash
# Remover stack
docker stack rm football

# Aguardar remoção completa
sleep 10

# Verificar que tudo foi removido
docker service ls
# Esperado: vazio ou sem serviços do football

# Sair do swarm
docker swarm leave --force
```

---

## 🐛 Troubleshooting

### Serviço não inicia (0/X replicas)

**Problema:** `docker service ls` mostra `0/3` em vez de `3/3`

**Diagnóstico:**
```bash
docker service ps football_app --no-trunc
docker service logs football_app --tail 100
```

**Causas comuns:**
1. **Imagem não encontrada**
   - Solução: Fazer build da imagem
   
2. **Erro de conexão com banco**
   - Verificar: logs do postgres
   - Solução: Aguardar postgres inicializar completamente
   
3. **Falta variável de ambiente**
   - Verificar: arquivo `.env` existe e tem todas as variáveis
   - Solução: Configurar JWT_SECRET e DB_PASSWORD

4. **Porta já em uso**
   - Verificar: `netstat -tulpn | grep :80`
   - Solução: Parar outro serviço ou mudar porta

### Health check falhando

**Problema:** Container reinicia continuamente

**Diagnóstico:**
```bash
docker service inspect football_app --format '{{json .UpdateStatus}}'
```

**Solução:**
- Aumentar `start_period` no health check
- Verificar se aplicação está respondendo corretamente

### Erro "No such service"

**Problema:** `docker service logs` retorna erro

**Causa:** Nome do serviço incorreto

**Solução:**
```bash
# Listar serviços exatos
docker service ls

# Usar nome completo (com prefixo da stack)
docker service logs football_app  # ✅ correto
docker service logs app           # ❌ errado
```

### Containers não se comunicam

**Problema:** App não conecta ao postgres/redis

**Diagnóstico:**
```bash
# Verificar redes
docker network ls | grep football
docker network inspect football_backend
```

**Solução:**
- Verificar que serviços estão na mesma rede
- No `docker-compose.swarm.yml`, app deve estar em `backend` network

### "Swarm: inactive"

**Problema:** Swarm não está ativo

**Solução:**
```bash
docker swarm init
```

---

## 📊 Métricas de Sucesso

Um deploy bem-sucedido deve ter:

- ✅ **4 serviços** rodando (postgres, redis, app, nginx)
- ✅ **7 containers** no total (1 postgres + 1 redis + 3 app + 2 nginx)
- ✅ Todos os health checks **passando**
- ✅ HTTP localhost retornando **200 OK**
- ✅ Logs sem **erros de conexão**
- ✅ Consumo de memória **dentro dos limites**
- ✅ Failover **automático** ao matar container

---

## 📝 Template de Relatório de Teste

Use este template para documentar seus testes:

```markdown
# Relatório de Teste - Docker Swarm

**Data:** YYYY-MM-DD
**Testador:** Nome
**Ambiente:** Local / AWS / Outro

## Resultados

### Inicialização
- [ ] Swarm inicializado
- [ ] Nó manager ativo
- [ ] Build de imagens concluído

### Deploy
- [ ] Stack deployada sem erros
- [ ] Todos os serviços com réplicas corretas
- [ ] Health checks passando

### Conectividade
- [ ] App conecta ao PostgreSQL
- [ ] App conecta ao Redis
- [ ] HTTP retorna 200 OK

### Escalabilidade
- [ ] Escala para 5 réplicas
- [ ] Rolling update sem downtime
- [ ] Failover automático funciona

### Limpeza
- [ ] Stack removida
- [ ] Volumes limpos
- [ ] Swarm desativado

## Problemas Encontrados

(Descrever qualquer problema)

## Notas Adicionais

(Observações)
```

---

## 🎯 Próximos Testes

Depois de validar localmente:

1. **Teste em cluster AWS** (veja [DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md))
2. **Teste de carga** com múltiplos jogadores simultâneos
3. **Teste de latência** entre nós em diferentes AZs
4. **Teste de backup/restore** do PostgreSQL
5. **Teste de monitoramento** com Prometheus/Grafana

---

**Dúvidas?** Consulte:
- [DOCKER_SWARM.md](./DOCKER_SWARM.md) - Guia completo
- [DOCKER_SWARM_QUICKSTART.md](./DOCKER_SWARM_QUICKSTART.md) - Quick start
- [DOCKER_SWARM_AWS.md](./DOCKER_SWARM_AWS.md) - Deploy AWS
