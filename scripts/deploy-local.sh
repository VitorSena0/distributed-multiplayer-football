#!/bin/bash

# Script de Deploy Local do Docker Swarm
# Faz o deploy da stack no swarm local

set -e  # Para em caso de erro

STACK_NAME="football"
COMPOSE_FILE="docker-compose.swarm.yml"

echo "================================================"
echo "  Deploy Local - Docker Swarm"
echo "  Stack: $STACK_NAME"
echo "================================================"
echo ""

# Verificar se o swarm está ativo
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "❌ Swarm não está ativo!"
    echo "Execute primeiro: ./scripts/swarm-init.sh"
    exit 1
fi

# Verificar se o arquivo compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Arquivo $COMPOSE_FILE não encontrado!"
    exit 1
fi

# Verificar se as imagens existem
echo "🔍 Verificando imagens necessárias..."
if ! docker images | grep -q "multiplayer-soccer-app"; then
    echo "❌ Imagem multiplayer-soccer-app não encontrada!"
    echo "Execute primeiro: ./scripts/build-images.sh"
    exit 1
fi

if ! docker images | grep -q "multiplayer-soccer-nginx"; then
    echo "❌ Imagem multiplayer-soccer-nginx não encontrada!"
    echo "Execute primeiro: ./scripts/build-images.sh"
    exit 1
fi

echo "✅ Imagens encontradas"
echo ""

# Verificar se existe arquivo .env
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "Criando .env a partir de .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        
        # Gerar JWT_SECRET seguro automaticamente
        JWT_SECRET=$(openssl rand -hex 64)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        
        echo "✅ Arquivo .env criado"
        echo "✅ JWT_SECRET gerado automaticamente (seguro)"
        echo ""
        echo "⚠️  IMPORTANTE: Edite o arquivo .env e configure:"
        echo "   - DB_PASSWORD (troque para uma senha segura)"
        echo ""
        read -p "Deseja continuar? (s/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo "Abortando. Configure o .env e execute novamente."
            exit 1
        fi
    else
        echo "❌ .env.example não encontrado!"
        echo "Crie um arquivo .env com as variáveis necessárias."
        exit 1
    fi
fi

# Validar que JWT_SECRET não está vazio ou com valor padrão
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2)
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secure-jwt-secret-here" ]; then
    echo "❌ JWT_SECRET não configurado ou usando valor padrão!"
    echo "Gerando JWT_SECRET seguro..."
    NEW_JWT_SECRET=$(openssl rand -hex 64)
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env
    echo "✅ JWT_SECRET gerado e salvo em .env"
fi

# Verificar se a stack já existe
if docker stack ls | grep -q "$STACK_NAME"; then
    echo "⚠️  Stack '$STACK_NAME' já existe!"
    echo ""
    read -p "Deseja atualizar a stack existente? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Atualizando stack..."
    else
        echo "Abortando."
        exit 0
    fi
fi

# Deploy da stack
echo "🚀 Fazendo deploy da stack '$STACK_NAME'..."
echo ""

docker stack deploy -c "$COMPOSE_FILE" "$STACK_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Stack deployada com sucesso!"
else
    echo ""
    echo "❌ Erro ao fazer deploy da stack"
    exit 1
fi

echo ""
echo "================================================"
echo "  Deploy concluído!"
echo "================================================"
echo ""

# Aguardar um pouco para os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# Mostrar status dos serviços
echo ""
echo "📊 Status dos serviços:"
docker service ls

echo ""
echo "📋 Tasks em execução:"
docker stack ps "$STACK_NAME" --filter "desired-state=running"

echo ""
echo "================================================"
echo "  Comandos úteis:"
echo "================================================"
echo ""
echo "  Ver logs:          docker service logs -f ${STACK_NAME}_app"
echo "  Ver serviços:      docker service ls"
echo "  Ver tasks:         docker stack ps $STACK_NAME"
echo "  Escalar app:       docker service scale ${STACK_NAME}_app=5"
echo "  Remover stack:     docker stack rm $STACK_NAME"
echo ""
echo "🌐 Acesse o jogo em: http://localhost"
echo ""
