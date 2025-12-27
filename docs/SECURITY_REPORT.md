# Relatório de Segurança - Variáveis de Ambiente

**Data**: 27 de dezembro de 2025  
**Projeto**: Multiplayer Soccer  
**Objetivo**: Documentar as discussões sobre segurança, variáveis de ambiente e configuração de produção

---

## 1. Variáveis de Ambiente

### 1.1 Implementação

O projeto utiliza variáveis de ambiente para configurar credenciais sensíveis. As variáveis estão definidas em um arquivo `.env` na raiz do projeto:

**Arquivo: `.env`**
```
# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=football_db
DB_USER=postgres
DB_PASSWORD=postgres

# Configuração JWT
JWT_SECRET=b88f827bd964659e2bf1e2f92dba6c140a1f0f1657cc9143f928f75bb98a518586516fc2505c3ffeec83d7d9d6d55b0a69e7fa07bd674c2cad0081c9b29b5117

# Porta do servidor
PORT=3000
```

### 1.2 Arquivos Modificados

Os seguintes arquivos foram atualizados para usar variáveis de ambiente:

#### [database/db.ts](database/db.ts)
- Implementação do pool de conexões PostgreSQL
- Todas as credenciais lidas via `process.env`
- Valores padrão definidos para desenvolvimento local

#### [services/authService.ts](services/authService.ts)
- JWT_SECRET removido do fallback inseguro
- Agora lê apenas `process.env.JWT_SECRET`
- Usado em três métodos: `register()`, `login()`, `verifyToken()`

#### [docker-compose.yml](docker-compose.yml)
- Atualizado para usar variáveis do arquivo `.env`
- Sintaxe: `${VARIAVEL:-valor_padrao}`
- JWT_SECRET agora obrigatório (`:?` força erro se não definido)

---

## 2. Análise de Segurança

### 2.1 SQL Injection

**Status**: ✅ SEGURO

**Análise**: 
- Todas as queries no projeto utilizam **prepared statements** (parameterized queries)
- Sintaxe: `pool.query('SELECT * FROM users WHERE id = $1', [id])`
- O driver `pg` (node-postgres) escapa automaticamente os parâmetros
- Nenhuma construção de query dinâmica ou interpolação de strings

**Exemplo de código seguro**:
```typescript
// ✅ SEGURO
const result = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
);

// ❌ INSEGURO (NÃO está no código)
pool.query(`SELECT id FROM users WHERE username = '${username}'`)
```

### 2.2 Autenticação

**Status**: ✅ BOM

**Pontos positivos**:
- Senhas hasheadas com `bcryptjs` (algoritmo PBKDF2)
- 10 salt rounds (padrão de segurança)
- JWT com expiração de 30 dias
- Tokens verificados via `jwt.verify()`

### 2.3 Senha Padrão do Banco (Desenvolvimento)

**Status**: ⚠️ RISCO EM PRODUÇÃO

**Problema**:
```
DB_PASSWORD=postgres
```

- Senha padrão é facilmente descoberta
- Qualquer pessoa com acesso ao código pode conectar ao banco
- Não é seguro para produção

**Solução**:
- Use uma senha forte e aleatória em produção
- Exemplo: `DB_PASSWORD=seu_senha_muito_forte_123!@#xyz`

### 2.4 JWT Secret

**Status**: ⚠️ CRÍTICO

**Problema anterior** (antes da mudança):
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_super_seguro_mude_em_producao';
```

- O valor padrão estava visível no código
- Qualquer pessoa poderia forjar tokens JWT válidos
- Comprometeria toda a autenticação

**Solução implementada**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
```

- JWT_SECRET deve estar definido no `.env`
- No docker-compose, agora é obrigatório: `:?JWT_SECRET deve ser definido no arquivo .env`
- Gerar chave segura: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

---

## 3. Configuração Docker

### 3.1 Desenvolvimento (localhost)

**docker-compose.yml**:
```yaml
postgres:
  ports:
    - "5433:5432"  # Porta exposta para desenvolvimento local
```

**`.env`**:
```
DB_HOST=localhost
DB_PASSWORD=postgres
JWT_SECRET=chave_desenvolvimento
```

### 3.2 Produção (AWS EC2)

#### Problemas de Segurança Identificados

**❌ Porta Exposta**:
```yaml
ports:
  - "5432:5432"  # PERIGOSO: Acessível de qualquer IP
```

**Riscos**:
1. **Port Scanning**: Hackers fazem varredura de portas abertas
2. **Força Bruta**: Tentam credenciais padrão (postgres/postgres)
3. **Roubo de Dados**: Acesso direto ao banco se credenciais forem fracas
4. **Ataques DoS**: Podem sobrecarregar o serviço

**Exemplo de ataque**:
```bash
# Qualquer pessoa na internet pode tentar:
psql -h seu-ip-ec2 -U postgres -d football_db
```

#### Solução para Produção (EC2)

**1. Não exponha a porta do PostgreSQL**:
```yaml
postgres:
  # REMOVA: ports: - "5432:5432"
  # O app acessa via hostname "postgres" interno
```

**2. Use senha forte**:
```
DB_PASSWORD=xyz123ABC!@#$%^&*()_+senha_aleatoria_muito_longa
```

**3. Acesso remoto via SSH tunnel** (se necessário):
```bash
ssh -L 5432:localhost:5432 ec2-user@seu-ip-ec2
psql -h localhost -U postgres -d football_db
```

**4. Arquivo `.env` seguro em EC2**:
```
# NÃO versione no Git
# Use AWS Secrets Manager ou Parameter Store
# Ou copie manualmente via SCP:
scp .env ec2-user@seu-ip:/app/.env
```

---

## 4. Checklist de Segurança

### Desenvolvimento Local
- [x] Arquivo `.env` criado com variáveis
- [x] `.env` adicionado ao `.gitignore`
- [x] Senhas padrão aceitáveis para dev (postgres/postgres)
- [x] JWT_SECRET definido

### Antes de Fazer Deploy
- [ ] Gerar nova senha forte para `DB_PASSWORD`
- [ ] Gerar nova chave para `JWT_SECRET`
- [ ] Não versionar `.env` no Git
- [ ] Usar AWS Secrets Manager para credenciais sensíveis
- [ ] Remover exposição da porta 5432 do PostgreSQL
- [ ] Testar conexão do app com banco em EC2
- [ ] Configurar HTTPS no Nginx (porta 443)
- [ ] Validar CORS settings se houver múltiplos domínios

### Produção (EC2)
- [ ] `.env` copiado manualmente via SCP
- [ ] Postgres sem porta exposta
- [ ] Senha do banco = caracteres aleatórios com símbolos
- [ ] JWT_SECRET = 64 caracteres hexadecimais aleatórios
- [ ] Logs monitorados regularmente
- [ ] Backups diários do PostgreSQL
- [ ] Firewall configurado (Security Groups)
- [ ] Certificado SSL/TLS ativo

---

## 5. Geração de Chaves Seguras

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Exemplo de saída**:
```
a7f8e9d2c4b5a6f3e8d9c2b4a5f6e7d8c9b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4
```

### Senha de Banco
```bash
openssl rand -base64 32
```

**Exemplo de saída**:
```
xK9mP2qL7vN8wQ3rB5sT6uY9zW1aC4dE5fG6hI7jK8
```

---

## 6. Resumo de Riscos

| Risco | Severidade | Status | Solução |
|-------|-----------|--------|---------|
| SQL Injection | Crítica | ✅ Mitigado | Prepared statements |
| Senha padrão do banco | Alta | ⚠️ Dev OK, Prod precisa | Gerar senha forte em prod |
| JWT Secret exposto | Crítica | ✅ Corrigido | Ler de `.env` obrigatoriamente |
| Porta 5432 exposta | Alta | ⚠️ Dev OK, Prod precisa | Remover em produção |
| `.env` versionado | Alta | ✅ Prevenido | `.gitignore` adicionado |
| HTTPS desativado | Alta | ⚠️ Não abordado | Configurar no Nginx |

---

## 7. Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [PostgreSQL Password Hashing](https://www.postgresql.org/docs/current/sql-createrole.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [Docker Security](https://docs.docker.com/engine/security/)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)

---

**Próximas Ações Recomendadas**:
1. Configurar HTTPS/SSL no Nginx antes de produção
2. Implementar rate limiting no Express
3. Adicionar logging de tentativas de acesso
4. Configurar backup automático do PostgreSQL
5. Implementar monitoramento de segurança (CloudWatch)
