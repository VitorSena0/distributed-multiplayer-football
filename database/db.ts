import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'football_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    
    // MELHORIA 1: Controle via .env (Padrão aumenta para 50 para testes leves)
    max: parseInt(process.env.DB_POOL_SIZE || '20'), 
    
    idleTimeoutMillis: 30000,
    
    // MELHORIA 2: Aumentar timeout de conexão. 
    // Sob carga pesada, o banco demora a responder. 2s é muito pouco.
    // Vamos subir para 10s (10000) para evitar falsos negativos no teste.
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '10000'),
});

pool.on('connect', () => {
    // Dica: Comente este log em produção/teste de carga massiva para não sujar o terminal
    // console.log('Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Erro inesperado no cliente PostgreSQL', err);
});

export default pool;