# 🚀 Guia Rápido de Início

## Opção 1: Docker (Recomendado)

A maneira mais rápida de começar!

```bash
# 1. Build das imagens
docker build -t multiplayer-soccer-app:latest .
docker build -t multiplayer-soccer-nginx:latest ./nginx

# 2. Iniciar tudo
docker-compose up -d

# 3. Acessar
# Abra http://localhost no navegador
```

✅ Pronto! O banco de dados, servidor e nginx estão rodando.

---

## Opção 2: Desenvolvimento Local

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Inicializar Banco de Dados

```bash
# Usando Docker (recomendado)
./scripts/init-db.sh

# OU manualmente com PostgreSQL local
createdb football_db
psql -d football_db -f database/schema.sql
```

### Passo 3: Configurar Ambiente

```bash
# Copiar e editar variáveis de ambiente
cp .env.example .env
nano .env  # Editar se necessário
```

### Passo 4: Iniciar Servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# OU Produção
npm run build
npm start
```

### Passo 5: Acessar

Abra `http://localhost:3000` no navegador

---

## 🎮 Como Jogar

### 1. Criar Conta ou Entrar como Convidado

- **Criar conta**: Clique em "Registre-se", escolha usuário e senha
- **Login**: Se já tem conta, faça login
- **Convidado**: Clique em "Jogar como Convidado" (estatísticas não são salvas)

### 2. Controles

**Desktop:**
- `W A S D` ou `↑ ← ↓ →` - Mover jogador
- `ESPAÇO` - Chutar (quando perto da bola)

**Mobile:**
- Joystick virtual - Mover
- Botão de ação - Chutar

### 3. Regras

- ⏱️ Partida dura 2 minutos
- ⚽ Marque gols no gol adversário
- 🔴🔵 Dois times: Vermelho vs Azul
- 🏆 Time com mais gols vence
- 📊 Estatísticas salvas apenas se partida terminar

---

## 📊 Sistema de Ranking

O ranking aparece no lado esquerdo da tela e mostra:

1. **#** - Posição no ranking
2. **Jogador** - Nome do usuário
3. **VIT** - Vitórias
4. **DER** - Derrotas
5. **EMP** - Empates
6. **SG** - Saldo de gols (diferença entre gols marcados e sofridos)
7. **PJ** - Partidas jogadas

**Ordenação**: Vitórias > Saldo de Gols > Total de Gols Marcados

**Atualização**: O ranking é atualizado automaticamente a cada 30 segundos

---

## 🎭 Identificação de Jogadores

Durante o jogo, você verá o nome acima de cada jogador:

- **Usuários registrados**: Nome de usuário escolhido no registro
- **Convidados**: "Convidado 1", "Convidado 2", etc. (numeração automática)
- **Seu jogador**: Destacado com cor amarela pulsante para fácil localização

---

## 🔒 Segurança e Sessões

### Proteção de Dados
- Senhas criptografadas com **bcrypt** (hash seguro)
- Autenticação via **JWT** (JSON Web Tokens)
- Sessões temporárias (não persistem após fechar navegador)

### Sessão Única
- Apenas **uma sessão ativa** por conta de usuário
- Se fizer login em outro dispositivo/aba, a sessão anterior é **desconectada automaticamente**
- Você receberá um aviso se sua conta for acessada em outro lugar
- **Convidados** não têm essa restrição (podem ter múltiplas sessões)

---

## 🔧 Comandos Úteis

```bash
# Ver logs (Docker)
docker-compose logs -f

# Parar servidor (Docker)
docker-compose down

# Backup do banco
docker-compose exec postgres pg_dump -U postgres football_db > backup.sql

# Resetar banco (CUIDADO!)
docker-compose down -v
docker-compose up -d

# Verificar erros de compilação
npm run build

# Modo desenvolvimento
npm run dev
```

---

## 🆘 Problemas Comuns

### Erro: "Não foi possível conectar ao banco de dados"

```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Erro: "Porta 3000 já está em uso"

```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# OU mudar porta no .env
PORT=3001
```

### Erro: "Token inválido ou expirado"

```bash
# Fazer logout e login novamente
# No navegador: F12 → Console → executar:
localStorage.clear()
# Recarregar página
```

### Ranking não aparece

```bash
# Verificar se há jogadores com estatísticas
docker-compose exec postgres psql -U postgres -d football_db -c "SELECT * FROM player_stats;"

# Verificar logs do servidor
docker-compose logs app
```

---

## 📱 Acessar de Outro Dispositivo

### Na mesma rede local:

1. Descobrir seu IP:
   ```bash
   # Linux/Mac
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```

2. No outro dispositivo, acessar:
   ```
   http://SEU-IP:3000
   ```

### Pela internet (usando ngrok):

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel
ngrok http 3000

# Compartilhar URL gerada
```

---

## 🎯 Próximos Passos

1. ✅ Criar sua conta
2. ✅ Jogar algumas partidas
3. ✅ Aparecer no ranking
4. ✅ Convidar amigos
5. ✅ Dominar o ranking!

---

## 📚 Documentação Completa

- [`README.md`](README.md) - Visão geral do projeto
- [`API.md`](API.md) - Documentação da API REST
- [`DATABASE.md`](DATABASE.md) - Estrutura do banco de dados
- [`DEPLOY.md`](DEPLOY.md) - Guia de deploy
- [`CHANGELOG.md`](CHANGELOG.md) - Histórico de mudanças

---

## 🤝 Contribuir

Encontrou um bug? Tem uma sugestão?

1. Abra uma issue no GitHub
2. Faça um fork do projeto
3. Crie uma branch para sua feature
4. Envie um Pull Request

---

## 📄 Licença

Este projeto está sob a licença especificada no arquivo LICENSE.

---

**Divirta-se jogando! ⚽🎮**
