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

## Backup e Manutenção

### Backup completo

```bash
pg_dump -U postgres football_db > backup.sql
```

### Restaurar backup

```bash
psql -U postgres football_db < backup.sql
```

### Resetar estatísticas de um usuário

```sql
UPDATE player_stats 
SET total_goals_scored = 0,
    total_goals_conceded = 0,
    goals_difference = 0,
    wins = 0,
    losses = 0,
    draws = 0,
    matches_played = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $1;
```

### Deletar usuário e suas estatísticas

```sql
DELETE FROM users WHERE id = $1;
-- player_stats é deletado automaticamente devido ao ON DELETE CASCADE
```
