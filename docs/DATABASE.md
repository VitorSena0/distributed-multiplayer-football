# Documentação do Banco de Dados

## Estrutura das Tabelas

### Tabela: `users`

Armazena informações dos usuários registrados.

| Coluna       | Tipo         | Constraints        | Descrição                          |
|--------------|--------------|--------------------|------------------------------------|
| id           | SERIAL       | PRIMARY KEY        | Identificador único do usuário     |
| username     | VARCHAR(50)  | UNIQUE NOT NULL    | Nome de usuário (único)            |
| password     | VARCHAR(255) | NOT NULL           | Senha criptografada (bcrypt)       |
| created_at   | TIMESTAMP    | DEFAULT NOW()      | Data de criação da conta           |

### Tabela: `player_stats`

Armazena estatísticas de jogadores.

| Coluna                | Tipo      | Constraints           | Descrição                                    |
|-----------------------|-----------|-----------------------|----------------------------------------------|
| id                    | SERIAL    | PRIMARY KEY           | Identificador único da estatística           |
| user_id               | INTEGER   | UNIQUE NOT NULL FK    | Referência ao usuário                        |
| total_goals_scored    | INTEGER   | DEFAULT 0             | Total de gols marcados                       |
| total_goals_conceded  | INTEGER   | DEFAULT 0             | Total de gols sofridos                       |
| goals_difference      | INTEGER   | DEFAULT 0             | Saldo de gols (marcados - sofridos)          |
| wins                  | INTEGER   | DEFAULT 0             | Número de vitórias                           |
| losses                | INTEGER   | DEFAULT 0             | Número de derrotas                           |
| draws                 | INTEGER   | DEFAULT 0             | Número de empates                            |
| matches_played        | INTEGER   | DEFAULT 0             | Total de partidas jogadas                    |
| updated_at            | TIMESTAMP | DEFAULT NOW()         | Data da última atualização                   |

## Índices

- `idx_user_id`: Índice na coluna `user_id` da tabela `player_stats`
- `idx_username`: Índice na coluna `username` da tabela `users`
- `idx_ranking`: Índice composto para otimizar consultas de ranking (wins DESC, goals_difference DESC, total_goals_scored DESC)

## Relacionamentos

```
users (1) ←→ (1) player_stats
```

- Cada usuário tem exatamente uma entrada de estatísticas
- A exclusão de um usuário exclui automaticamente suas estatísticas (ON DELETE CASCADE)

## Consultas Comuns

### Buscar estatísticas de um usuário

```sql
SELECT u.username, ps.*
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
WHERE ps.user_id = $1;
```

### Buscar ranking global (TOP 10)

```sql
SELECT u.username, ps.*
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
WHERE ps.matches_played > 0
ORDER BY ps.wins DESC, ps.goals_difference DESC, ps.total_goals_scored DESC
LIMIT 10;
```

### Atualizar estatísticas após partida

```sql
UPDATE player_stats 
SET total_goals_scored = total_goals_scored + $1,
    total_goals_conceded = total_goals_conceded + $2,
    goals_difference = goals_difference + $3,
    wins = wins + $4,
    losses = losses + $5,
    draws = draws + $6,
    matches_played = matches_played + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $7;
```

## Regras de Negócio

1. **Usuários únicos**: O campo `username` deve ser único em toda a tabela
2. **Senhas criptografadas**: Todas as senhas são criptografadas usando bcrypt com salt rounds = 10
3. **Estatísticas automáticas**: Ao criar um usuário, uma entrada em `player_stats` é criada automaticamente
4. **Partidas completas**: Estatísticas só são atualizadas quando a partida chega ao final (matchTime = 0)
5. **Convidados**: Jogadores que entram como convidados não têm `user_id` e suas estatísticas não são salvas

## Acessando o Banco de Dados no Docker

### 1. Conectar ao container do PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d football_db
```

**Dentro do container PostgreSQL:**
- Sair: `\q`
- Listar tabelas: `\dt`
- Descrever tabela: `\d nome_da_tabela`

### 2. Verificar tabelas e dados

```bash
# Conectar ao banco
docker-compose exec postgres psql -U postgres -d football_db

# Dentro do psql, executar:
\dt                          # Lista todas as tabelas
\d users                      # Descreve a estrutura da tabela users
\d player_stats               # Descreve a estrutura de player_stats
```

### 3. Ver todos os usuários

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "SELECT id, username, created_at FROM users;"
```

### 4. Ver estatísticas de todos os jogadores

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
SELECT u.id, u.username, ps.wins, ps.losses, ps.draws, ps.goals_difference, ps.matches_played, ps.updated_at
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
ORDER BY ps.wins DESC;"
```

### 5. Ver ranking TOP 10

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
SELECT u.username, ps.wins, ps.losses, ps.draws, ps.goals_difference, ps.total_goals_scored, ps.matches_played
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
WHERE ps.matches_played > 0
ORDER BY ps.wins DESC, ps.goals_difference DESC
LIMIT 10;"
```

### 6. Ver estatísticas de um usuário específico

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
SELECT u.username, ps.*
FROM player_stats ps
JOIN users u ON u.id = ps.user_id
WHERE u.username = 'seu_usuario';"
```

### 7. Ver quantidade de usuários e estatísticas

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
SELECT (SELECT COUNT(*) FROM users) as total_usuarios, 
       (SELECT COUNT(*) FROM player_stats) as total_stats,
       (SELECT COUNT(*) FROM player_stats WHERE matches_played > 0) as usuarios_com_partidas;"
```

### 8. Executar comando SQL completo em um arquivo

```bash
# Criar arquivo com suas queries
cat > query.sql << EOF
SELECT * FROM users;
SELECT * FROM player_stats;
EOF

# Executar o arquivo
docker-compose exec -T postgres psql -U postgres -d football_db -f /dev/stdin < query.sql
```

### 9. Ver logs do PostgreSQL

```bash
docker-compose logs postgres
```

### 10. Verificar espaço em disco do banco

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## Backup e Manutenção

### Backup completo

```bash
docker-compose exec postgres pg_dump -U postgres football_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup para arquivo dentro do container

```bash
docker-compose exec postgres pg_dump -U postgres football_db > /tmp/backup.sql
```

### Restaurar backup

```bash
docker-compose exec -T postgres psql -U postgres football_db < backup.sql
```

### Resetar estatísticas de um usuário

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
UPDATE player_stats 
SET total_goals_scored = 0,
    total_goals_conceded = 0,
    goals_difference = 0,
    wins = 0,
    losses = 0,
    draws = 0,
    matches_played = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = 1;"
```

### Deletar usuário e suas estatísticas

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
DELETE FROM users WHERE id = 1;"
```

### Limpar todos os dados (CUIDADO!)

```bash
docker-compose exec postgres psql -U postgres -d football_db -c "
TRUNCATE player_stats CASCADE;
TRUNCATE users CASCADE;"
```
