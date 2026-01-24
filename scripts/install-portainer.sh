#!/bin/bash

# Script de Instalação do Portainer para Docker Swarm
# Interface gráfica para gerenciar Docker Swarm

set -e  # Para em caso de erro

echo "================================================"
echo "  Instalando Portainer - Interface Gráfica"
echo "  para Docker Swarm"
echo "================================================"
echo ""

# Verificar se Swarm está ativo
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "❌ Docker Swarm não está ativo!"
    echo ""
    echo "Execute primeiro: ./scripts/swarm-init.sh"
    exit 1
fi

echo "✅ Docker Swarm está ativo"
echo ""

# Verificar se Portainer já está instalado
if docker service ls 2>/dev/null | grep -q "portainer"; then
    echo "⚠️  Portainer já está instalado!"
    echo ""
    read -p "Deseja reinstalar? Isso removerá a instalação atual (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "Removendo instalação atual..."
        docker service rm portainer 2>/dev/null || true
        echo "✅ Portainer removido"
        echo ""
    else
        echo "Mantendo instalação atual."
        echo ""
        echo "Acesse: http://localhost:9000"
        exit 0
    fi
fi

# Criar volume para dados do Portainer
echo "🔧 Criando volume para dados do Portainer..."
docker volume create portainer_data 2>/dev/null || echo "Volume já existe"
echo "✅ Volume criado"
echo ""

# Deploy do Portainer
echo "🚀 Fazendo deploy do Portainer..."
docker service create \
  --name portainer \
  --publish published=9000,target=9000,mode=ingress \
  --publish published=8000,target=8000,mode=ingress \
  --constraint 'node.role == manager' \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  --mount type=volume,src=portainer_data,dst=/data \
  --replicas=1 \
  --update-parallelism=1 \
  --update-delay=10s \
  portainer/portainer-ce:latest \
  -H unix:///var/run/docker.sock

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Portainer instalado com sucesso!"
else
    echo ""
    echo "❌ Erro ao instalar Portainer"
    exit 1
fi

echo ""
echo "⏳ Aguardando Portainer inicializar..."

# Aguardar até Portainer estar rodando
PORTAINER_RUNNING=false
for i in {1..30}; do
    if docker service ps portainer 2>/dev/null | grep -q "Running"; then
        echo ""
        echo "✅ Portainer está rodando!"
        PORTAINER_RUNNING=true
        break
    fi
    sleep 2
    echo -n "."
done

echo ""

# Verificar se inicializou com sucesso
if [ "$PORTAINER_RUNNING" = false ]; then
    echo ""
    echo "⚠️  Portainer demorou para inicializar"
    echo "Verificando status..."
    docker service ps portainer
    echo ""
    echo "Você pode verificar os logs com:"
    echo "  docker service logs portainer"
fi

echo ""
echo "================================================"
echo "  Portainer instalado e rodando!"
echo "================================================"
echo ""
echo "🌐 Acesse a interface web:"
echo "   http://localhost:9000"
echo ""
echo "📋 Primeira vez:"
echo "   1. Crie uma senha de administrador"
echo "   2. Clique em 'Get Started'"
echo "   3. Selecione o ambiente 'Primary'"
echo ""
echo "💡 Dica: Marque esta página nos favoritos!"
echo ""
echo "================================================"
echo ""
echo "📚 Para mais informações, veja:"
echo "   docs/DOCKER_SWARM_PORTAINER.md"
echo ""
