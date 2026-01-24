import express from 'express'; 
import { Server as SocketIOServer } from 'socket.io'; 
import http from 'http'; 
import 'dotenv/config'; 
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { rooms } from './game/roomManager';
import { gameLoop } from './game/gameLoop';
import { updateTimer } from './game/match';
import { registerSocketHandlers } from './game/socketHandlers';
import authRoutes from './routes/authRoutes';
// Importação da nova função de banco de dados
import { initializeDatabase } from './database/db'; 

const app = express(); 

// Middleware para processar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app); 
const io = new SocketIOServer(server, { 
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'], 
    },
    allowEIO3: true, 
});

// Configurar Redis Adapter para sincronizar Socket.IO entre múltiplas réplicas
async function setupRedisAdapter() {
    try {
        const redisHost = process.env.REDIS_HOST || 'redis';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        
        // Criar clientes Redis para pub/sub
        const pubClient = createClient({ 
            socket: {
                host: redisHost, 
                port: redisPort 
            }
        });
        const subClient = pubClient.duplicate();

        // Conectar os clientes
        await Promise.all([pubClient.connect(), subClient.connect()]);

        // Configurar o adapter do Socket.IO
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log('✅ Socket.IO Redis Adapter configurado - réplicas sincronizadas');
    } catch (error) {
        console.error('❌ Erro ao configurar Redis Adapter:', error);
        console.error('⚠️  Continuando sem sincronização entre réplicas');
        // Não mata o servidor, apenas continua sem o adapter
        // Isso permite funcionar em desenvolvimento sem Redis
    }
}

// Rotas da API de autenticação
app.use('/api/auth', authRoutes);

app.use(express.static('public')); 

// Registra os manipuladores de eventos do Socket.IO
registerSocketHandlers(io);

// Função para executar os loops de jogo em cada sala
function runGameLoops(): void {
    rooms.forEach((room) => gameLoop(room, io));
}

// Função para atualizar os temporizadores em cada sala
function handleTimers(): void {
    rooms.forEach((room) => updateTimer(room, io));
}

// Configura intervalos 
setInterval(runGameLoops, 1000 / 60); 
setInterval(handleTimers, 1000); 

const PORT: number = parseInt(process.env.PORT || '3000', 10);

// --- NOVA INICIALIZAÇÃO DO SERVIDOR ---
async function startServer() {
    try {
        // 1. Aguarda o banco de dados criar as tabelas
        await initializeDatabase();

        // 2. Configurar Redis Adapter para Swarm
        await setupRedisAdapter();

        // 3. Só inicia o servidor se o banco estiver OK
        server.listen(PORT, '0.0.0.0', () => { 
            console.log(`⚽ Servidor Multiplayer rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error('Falha fatal ao iniciar o servidor:', error);
        process.exit(1); // Encerra o processo se o banco falhar
    }
}

// Executa a função de inicialização
startServer();