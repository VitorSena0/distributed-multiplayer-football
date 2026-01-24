#!/bin/bash

# Script de Build das Imagens Docker
# Cria as imagens necessárias para o Docker Swarm

set -e  # Para em caso de erro

echo "================================================"
echo "  Build das Imagens - Multiplayer Soccer"
echo "================================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "dockerfile" ]; then
    echo "❌ Erro: dockerfile não encontrado!"
    echo "Execute este script a partir da raiz do projeto."
    exit 1
fi

if [ ! -d "nginx" ]; then
    echo "❌ Erro: pasta nginx/ não encontrada!"
    exit 1
fi

# Build da imagem do app Node.js
echo "🔨 Buildando imagem do App Node.js..."
docker build -t multiplayer-soccer-app:latest -f dockerfile .

if [ $? -eq 0 ]; then
    echo "✅ Imagem multiplayer-soccer-app:latest criada com sucesso!"
else
    echo "❌ Erro ao criar imagem do app"
    exit 1
fi

echo ""

# Build da imagem do Nginx
echo "🔨 Buildando imagem do Nginx..."
docker build -t multiplayer-soccer-nginx:latest ./nginx

if [ $? -eq 0 ]; then
    echo "✅ Imagem multiplayer-soccer-nginx:latest criada com sucesso!"
else
    echo "❌ Erro ao criar imagem do nginx"
    exit 1
fi

echo ""
echo "================================================"
echo "  Imagens criadas com sucesso!"
echo "================================================"
echo ""

# Listar imagens criadas
echo "📦 Imagens disponíveis:"
docker images | grep multiplayer-soccer

echo ""
echo "Próximo passo: Deploy da stack"
echo "  ./scripts/deploy-local.sh"
echo ""
