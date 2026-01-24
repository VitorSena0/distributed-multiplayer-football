#!/bin/bash

# Script de Limpeza do Docker Swarm
# Remove a stack e opcionalmente o swarm

set -e

STACK_NAME="football"

echo "================================================"
echo "  Limpeza do Docker Swarm"
echo "================================================"
echo ""

# Verificar se a stack existe
if docker stack ls 2>/dev/null | grep -q "$STACK_NAME"; then
    echo "🗑️  Removendo stack '$STACK_NAME'..."
    docker stack rm "$STACK_NAME"
    
    echo ""
    echo "⏳ Aguardando remoção completa dos serviços..."
    sleep 10
    
    echo "✅ Stack removida"
else
    echo "ℹ️  Stack '$STACK_NAME' não encontrada"
fi

echo ""

# Perguntar se quer sair do swarm
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    read -p "Deseja sair do modo swarm? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Saindo do swarm..."
        docker swarm leave --force
        echo "✅ Saiu do swarm"
    fi
fi

echo ""

# Perguntar se quer limpar volumes
read -p "Deseja remover volumes do projeto football? (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Limpando volumes do projeto..."
    # Remover apenas volumes específicos do football
    docker volume ls --filter "name=football" --format "{{.Name}}" | xargs -r docker volume rm 2>/dev/null || true
    echo "✅ Volumes do projeto removidos"
fi

echo ""

# Perguntar se quer limpar redes
read -p "Deseja remover redes não utilizadas? (s/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Limpando redes..."
    docker network prune -f
    echo "✅ Redes limpas"
fi

echo ""
echo "================================================"
echo "  Limpeza concluída!"
echo "================================================"
echo ""
