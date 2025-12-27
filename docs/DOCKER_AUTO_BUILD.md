# Docker Compose - Build Automático

Este guia explica como configurar o Docker Compose para construir as imagens automaticamente, sem precisar executar comandos separados de build.

---

## 📋 Situação Atual

O arquivo `docker-compose.yml` atual usa imagens pré-construídas:

```yaml
app:
  image: multiplayer-soccer-app:latest  # ❌ Assume que a imagem já existe
  
nginx:
  image: multiplayer-soccer-nginx:latest  # ❌ Assume que a imagem já existe
```

**Processo manual** (situação atual):
```bash
# 1. Construir as imagens manualmente
docker build -t multiplayer-soccer-app:latest .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# 2. Subir os containers
docker-compose up
```

---

## ✨ Opção 1: Build Automático Completo

### Modificação no docker-compose.yml

Substitua `image:` por `build:` nos serviços `app` e `nginx`:

```yaml
services:
  postgres:
    # ... (mantém igual)

  app:
    build: .  # ✅ Constrói automaticamente a partir do Dockerfile na raiz
    container_name: multiplayer-soccer-app
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-football_db}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:?JWT_SECRET deve ser definido no arquivo .env}
      PORT: 3000
    expose:
      - "3000"
    depends_on:
      postgres:
        condition: service_healthy

  nginx:
    build: ./nginx  # ✅ Constrói automaticamente a partir do Dockerfile em ./nginx
    container_name: multiplayer-soccer-nginx
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  postgres_data:
```

### Comandos

```bash
# Build e inicia tudo de uma vez
docker-compose up --build

# Ou em modo detached (background)
docker-compose up -d --build

# Rebuild forçado (ignora cache)
docker-compose build --no-cache
docker-compose up
```

### ✅ Vantagens

- **Simplicidade**: Um único comando para tudo
- **Desenvolvimento**: Rebuilds automáticos durante desenvolvimento
- **CI/CD**: Facilita pipelines de integração contínua
- **Sem imagens órfãs**: Docker Compose gerencia as imagens automaticamente

### ⚠️ Desvantagens

- **Tempo de build**: Reconstrói toda vez que rodar `--build`
- **Uso de espaço**: Pode criar múltiplas camadas de imagens

---

## 🔄 Opção 2: Build Automático com Nome de Imagem

Se você quiser manter os nomes das imagens para referência:

```yaml
app:
  build: .
  image: multiplayer-soccer-app:latest  # ✅ Nomeia a imagem construída
  container_name: multiplayer-soccer-app
  # ... resto da configuração

nginx:
  build: ./nginx
  image: multiplayer-soccer-nginx:latest  # ✅ Nomeia a imagem construída
  container_name: multiplayer-soccer-nginx
  # ... resto da configuração
```

### Comandos

```bash
# Constrói e nomeia as imagens
docker-compose build

# Inicia os containers
docker-compose up

# Ou tudo junto
docker-compose up --build
```

### ✅ Vantagens

- **Rastreabilidade**: Imagens têm nomes consistentes
- **Compartilhamento**: Pode fazer push para Docker Hub
- **Cache inteligente**: Reutiliza camadas quando possível

---

## 🚀 Opção 3: Build com Contexto Customizado

Para mais controle sobre o processo de build:

```yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
    args:
      NODE_ENV: production
  image: multiplayer-soccer-app:latest
  # ... resto da configuração

nginx:
  build:
    context: ./nginx
    dockerfile: Dockerfile
    args:
      NGINX_VERSION: 1.25
  image: multiplayer-soccer-nginx:latest
  # ... resto da configuração
```

### ✅ Vantagens

- **Build arguments**: Passa variáveis para o Dockerfile
- **Multi-stage builds**: Otimiza tamanho da imagem
- **Flexibilidade**: Controle fino sobre o processo

---

## 📊 Comparação: Manual vs Automático

| Aspecto | Build Manual | Build Automático |
|---------|-------------|------------------|
| **Comandos necessários** | 3 (2 builds + 1 up) | 1 (`up --build`) |
| **Facilidade** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Controle** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **CI/CD** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Desenvolvimento rápido** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Produção** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recomendações

### Para Desenvolvimento Local
```yaml
# Use build automático para agilidade
app:
  build: .
  # ...
```

**Comando**:
```bash
docker-compose up --build
```

### Para Produção (AWS EC2)
```yaml
# Use imagens pré-construídas para consistência
app:
  image: multiplayer-soccer-app:v1.0.0
  # ...
```

**Processo**:
```bash
# 1. Build local com tag versionada
docker build -t multiplayer-soccer-app:v1.0.0 .

# 2. (Opcional) Push para registry
docker tag multiplayer-soccer-app:v1.0.0 seu-dockerhub/multiplayer-soccer-app:v1.0.0
docker push seu-dockerhub/multiplayer-soccer-app:v1.0.0

# 3. Na EC2, pull e execute
docker pull seu-dockerhub/multiplayer-soccer-app:v1.0.0
docker-compose up -d
```

---

## 🛠️ Workflow Recomendado

### Desenvolvimento
```bash
# Primeira vez
docker-compose up --build

# Após mudanças no código
docker-compose up --build

# Apenas app mudou (mais rápido)
docker-compose build app
docker-compose up
```

### Staging/Produção
```bash
# Tag com versão
docker build -t multiplayer-soccer-app:1.0.0 .
docker build -t multiplayer-soccer-nginx:1.0.0 ./nginx

# Suba com versões específicas
docker-compose up -d
```

---

## 🔧 Troubleshooting

### Imagem não atualiza após mudanças no código

```bash
# Força rebuild sem cache
docker-compose build --no-cache app
docker-compose up
```

### Erro "image not found"

```bash
# Certifique-se de que o Dockerfile existe
ls -la Dockerfile
ls -la nginx/Dockerfile

# Build manual para debug
docker build -t multiplayer-soccer-app:latest .
```

### Container não conecta ao PostgreSQL

```bash
# Verifica se todos os containers estão na mesma rede
docker network ls
docker network inspect distributed-multiplayer-football_default

# Verifica logs
docker-compose logs postgres
docker-compose logs app
```

---

## 📝 Exemplo Completo: docker-compose.yml com Build Automático

```yaml
services:
  # Banco de dados PostgreSQL
  postgres:
    image: postgres:17
    container_name: multiplayer-soccer-db
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-football_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "127.0.0.1:5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Aplicação Node.js
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: multiplayer-soccer-app:latest
    container_name: multiplayer-soccer-app
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-football_db}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      JWT_SECRET: ${JWT_SECRET:?JWT_SECRET deve ser definido no arquivo .env}
      PORT: 3000
    expose:
      - "3000"
    depends_on:
      postgres:
        condition: service_healthy

  # Nginx Reverse Proxy
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    image: multiplayer-soccer-nginx:latest
    container_name: multiplayer-soccer-nginx
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  postgres_data:
```

---

## 🚀 Comandos Rápidos

```bash
# Build e inicia (desenvolvimento)
docker-compose up --build

# Build em background
docker-compose up -d --build

# Rebuild forçado
docker-compose build --no-cache
docker-compose up

# Para tudo
docker-compose down

# Para e remove volumes (CUIDADO: perde dados do banco)
docker-compose down -v

# Logs em tempo real
docker-compose logs -f

# Rebuild apenas um serviço
docker-compose build app
docker-compose up app
```

---

## 📚 Referências

- [Docker Compose Build Documentation](https://docs.docker.com/compose/compose-file/build/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Conclusão**: Para desenvolvimento local, recomenda-se usar `build:` para facilitar iterações rápidas. Para produção, use imagens pré-construídas e versionadas para garantir consistência e rastreabilidade.
