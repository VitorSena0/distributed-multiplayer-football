-- Migração para adicionar sistema de autenticação e estatísticas
-- Execute este script se você já tem um banco de dados existente

-- Verificar e criar tabela de usuários se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Tabela users criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela users já existe';
    END IF;
END $$;

-- Verificar e criar tabela de estatísticas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'player_stats') THEN
        CREATE TABLE player_stats (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total_goals_scored INTEGER DEFAULT 0,
            total_goals_conceded INTEGER DEFAULT 0,
            goals_difference INTEGER DEFAULT 0,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0,
            matches_played INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Tabela player_stats criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela player_stats já existe';
    END IF;
END $$;

-- Criar índices se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_id') THEN
        CREATE INDEX idx_user_id ON player_stats(user_id);
        RAISE NOTICE 'Índice idx_user_id criado';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_username') THEN
        CREATE INDEX idx_username ON users(username);
        RAISE NOTICE 'Índice idx_username criado';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_ranking') THEN
        CREATE INDEX idx_ranking ON player_stats(wins DESC, goals_difference DESC, total_goals_scored DESC);
        RAISE NOTICE 'Índice idx_ranking criado';
    END IF;
END $$;

-- Verificar se a migração foi bem-sucedida
SELECT 
    'users' as tabela,
    COUNT(*) as registros
FROM users
UNION ALL
SELECT 
    'player_stats' as tabela,
    COUNT(*) as registros
FROM player_stats;

DO $$
BEGIN
    RAISE NOTICE 'Migração concluída com sucesso!';
END $$;