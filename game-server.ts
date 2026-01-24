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
    const redisHost = process.env.REDIS_HOST || 'redis';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    let pubClient;
    let subClient;
    
    try {
        // Criar cliente de publicação
        pubClient = createClient({ 
            socket: {
                host: redisHost, 
                port: redisPort,
                // Configurações para resolver DNS no Docker Swarm
                family: 4,  // Force IPv4
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis: Máximo de tentativas de reconexão atingido');
                        return new Error('Too many retries');
                    }
                    return Math.min(retries * 100, 3000);
                }
            },
            // Desabilita verificação de disponibilidade offline
            disableOfflineQueue: false
        });
        
        // Criar cliente de subscrição (duplicado do pub)
        try {
            subClient = pubClient.duplicate();
        } catch (duplicateError) {
            console.error('❌ Erro ao duplicar cliente Redis para subscriber:', duplicateError);
            throw duplicateError;
        }

        // Conectar ambos os clientes
        try {
            await Promise.all([
                pubClient.connect(),
                subClient.connect()
            ]);
        } catch (connectError) {
            console.error('❌ Erro ao conectar clientes Redis (pub/sub):', connectError);
            throw connectError;
        }

        // Configurar o adapter do Socket.IO
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log(`✅ Socket.IO Redis Adapter configurado (${redisHost}:${redisPort}) - réplicas sincronizadas`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Falha ao configurar Redis Adapter para sincronização entre réplicas:', {
            host: redisHost,
            port: redisPort,
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined
        });
        console.error('⚠️  Continuando sem sincronização entre réplicas - funciona apenas em modo single-instance');
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