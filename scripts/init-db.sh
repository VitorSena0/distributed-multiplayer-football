#!/bin/bash

# Script para inicializar o banco de dados PostgreSQL localmente

echo "🗄️  Iniciando PostgreSQL com Docker..."

# Para o container se já estiver rodando
docker stop multiplayer-soccer-db 2>/dev/null
docker rm multiplayer-soccer-db 2>/dev/null

# Inicia um novo container PostgreSQL
docker run -d \
  --name multiplayer-soccer-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=football_db \
  -p 5432:5432 \
  postgres:17

echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 5

# Executa o schema SQL
echo "📝 Criando tabelas..."
docker exec -i multiplayer-soccer-db psql -U postgres -d football_db < database/schema.sql

echo "✅ Banco de dados inicializado com sucesso!"
echo ""
echo "Informações de conexão:"
echo "  Host: localhost"
echo "  Porta: 5432"
echo "  Banco: football_db"
echo "  Usuário: postgres"
echo "  Senha: postgres"
