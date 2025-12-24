# Guia de Deploy com Docker

Este guia mostra como fazer deploy completo da aplicação usando Docker e Docker Compose.

## Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Porta 80 disponível (ou configure outra no nginx)

## Estrutura dos Containers

O sistema utiliza 3 containers:

1. **postgres** - Banco de dados PostgreSQL 17
2. **app** - Servidor Node.js com o jogo
3. **nginx** - Proxy reverso e servidor web

## Passo 1: Build das Imagens

### 1.1 Build da Aplicação

```bash
docker build -t multiplayer-soccer-app:latest .
```

### 1.2 Build do Nginx

```bash
docker build -t multiplayer-soccer-nginx:latest ./nginx
```

## Passo 2: Configurar Variáveis de Ambiente

Edite o arquivo `docker-compose.yml` e ajuste as variáveis de ambiente, especialmente:

```yaml
environment:
  JWT_SECRET: "MUDE_ESTE_SECRET_EM_PRODUCAO_USE_ALGO_COMPLEXO"
  DB_PASSWORD: "senha_segura_do_banco"
  POSTGRES_PASSWORD: "senha_segura_do_banco"
```

⚠️ **IMPORTANTE**: Nunca use senhas fracas em produção!

## Passo 3: Iniciar os Containers

```bash
docker-compose up -d
```

Este comando irá:
- Criar e iniciar o container PostgreSQL
- Executar o schema SQL automaticamente
- Iniciar o servidor Node.js
- Iniciar o Nginx

## Passo 4: Verificar Status

```bash
# Ver logs de todos os containers
docker-compose logs -f

# Ver apenas logs do app
docker-compose logs -f app

# Ver status dos containers
docker-compose ps
```

## Passo 5: Acessar a Aplicação

Abra no navegador:
- `http://localhost` ou `http://seu-ip`

## Comandos Úteis

### Parar os containers

```bash
docker-compose down
```

### Parar e remover volumes (CUIDADO: apaga banco de dados)

```bash
docker-compose down -v
```

### Reiniciar apenas um serviço

```bash
docker-compose restart app
```

### Ver logs em tempo real

```bash
docker-compose logs -f app
```

### Executar comandos no container

```bash
# Acessar shell do container app
docker-compose exec app sh

# Acessar PostgreSQL
docker-compose exec postgres psql -U postgres -d football_db
```

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose exec postgres pg_dump -U postgres football_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres football_db < backup.sql
```

## Troubleshooting

### Container não inicia

```bash
# Verificar logs detalhados
docker-compose logs app

# Verificar se todas as portas estão disponíveis
netstat -tuln | grep -E '80|3000|5432'
```

### Banco de dados não conecta

```bash
# Verificar se o PostgreSQL está rodando
docker-compose exec postgres pg_isready -U postgres

# Ver logs do PostgreSQL
docker-compose logs postgres
```

### Erro de permissão

```bash
# Dar permissões corretas para o script
chmod +x scripts/init-db.sh
```

## Deploy em Servidor de Produção

### AWS EC2

1. **Conectar via SSH**

```bash
ssh -i sua-chave.pem ubuntu@seu-ip-ec2
```

2. **Instalar Docker e Docker Compose**

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Clonar o repositório**

```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
```

4. **Configurar variáveis de ambiente**

```bash
# Editar docker-compose.yml com senhas seguras
nano docker-compose.yml
```

5. **Build e Start**

```bash
docker build -t multiplayer-soccer-app:latest .
docker build -t multiplayer-soccer-nginx:latest ./nginx
docker-compose up -d
```

6. **Configurar Firewall**

```bash
# Permitir porta 80 (HTTP)
sudo ufw allow 80/tcp

# Permitir porta 443 (HTTPS) se usar SSL
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
```

### DigitalOcean / Outros Provedores

O processo é similar ao AWS EC2. Certifique-se de:

1. Ter Docker e Docker Compose instalados
2. Configurar o firewall para permitir portas 80 e 443
3. Usar senhas fortes em produção
4. Considerar usar um domínio com SSL/TLS (Let's Encrypt)

## SSL/TLS com Let's Encrypt

Para adicionar HTTPS:

1. **Instalar Certbot**

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obter certificado**

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

3. **Atualizar nginx/default.conf** para usar o certificado

4. **Renovação automática** (já configurado por padrão)

```bash
sudo certbot renew --dry-run
```

## Monitoramento

### Ver uso de recursos

```bash
docker stats
```

### Ver logs de acesso do Nginx

```bash
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

### Ver logs de erro do Nginx

```bash
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

## Atualizações

Para atualizar a aplicação:

```bash
# 1. Pull das mudanças
git pull

# 2. Rebuild das imagens
docker-compose build

# 3. Reiniciar containers
docker-compose up -d

# 4. Remover imagens antigas
docker image prune -a
```

## Backup Automático

Criar script de backup automático:

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U postgres football_db > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Adicionar ao crontab:

```bash
# Executar todo dia às 2h da manhã
0 2 * * * /caminho/para/backup.sh
```

## Segurança em Produção

- ✅ Use senhas fortes e únicas
- ✅ Nunca exponha JWT_SECRET publicamente
- ✅ Use HTTPS (SSL/TLS)
- ✅ Mantenha Docker e sistema operacional atualizados
- ✅ Configure firewall corretamente
- ✅ Faça backups regulares
- ✅ Monitore logs regularmente
- ✅ Limite acesso SSH (use chaves, não senhas)
- ✅ Configure rate limiting no Nginx
