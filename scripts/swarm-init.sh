#!/bin/bash

# Script de Inicialização do Docker Swarm (Local)
# Este script configura um swarm local para testes

set -e  # Para em caso de erro

echo "================================================"
echo "  Inicializando Docker Swarm - Multiplayer Soccer"
echo "================================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "Por favor, instale o Docker primeiro: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando!"
    echo "Inicie o Docker e tente novamente."
    exit 1
fi

echo "✅ Docker instalado e rodando"
echo ""

# Verificar se já existe um swarm ativo
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "⚠️  Swarm já está ativo!"
    echo ""
    read -p "Deseja sair e reinicializar o swarm? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Saindo do swarm atual..."
        docker swarm leave --force
        echo "✅ Saiu do swarm"
        echo ""
    else
        echo "Mantendo swarm atual. Pulando inicialização."
        echo ""
        docker node ls
        exit 0
    fi
fi

# Inicializar Swarm
echo "🔧 Inicializando Docker Swarm..."
docker swarm init

echo ""
echo "✅ Swarm inicializado com sucesso!"
echo ""

# Mostrar informações do nó
echo "📊 Informações do Cluster:"
docker node ls

echo ""
echo "================================================"
echo "  Swarm pronto para uso!"
echo "================================================"
echo ""
echo "Próximos passos:"
echo "  1. Build das imagens: ./scripts/build-images.sh"
echo "  2. Deploy da stack: ./scripts/deploy-local.sh"
echo ""
