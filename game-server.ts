import express from 'express'; 
import { Server as SocketIOServer } from 'socket.io'; 
import http from 'http'; 
import 'dotenv/config'; 

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

        // 2. Só inicia o servidor se o banco estiver OK
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