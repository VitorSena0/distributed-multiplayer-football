import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Configuração do Pool de conexões
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'football_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Testa a conexão
pool.on('connect', () => {
    console.log('🔌 Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no cliente PostgreSQL', err);
});

// --- NOVA FUNÇÃO DE INICIALIZAÇÃO ---
export async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('🔄 Verificando estrutura do banco de dados...');

        // Define o caminho para a pasta database (funciona na raiz ou dentro do Docker)
        const databaseDir = path.join(process.cwd(), 'database');
        const schemaPath = path.join(databaseDir, 'schema.sql');
        const migrationPath = path.join(databaseDir, 'migration.sql');

        // 1. Executa o Schema (Criação de Tabelas)
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schemaSql);
            console.log('✅ Schema verificado/executado.');
        } else {
            console.warn(`⚠️ Arquivo schema.sql não encontrado em: ${schemaPath}`);
        }

        // 2. Executa a Migração (Dados iniciais/Verificações)
        if (fs.existsSync(migrationPath)) {
            const migrationSql = fs.readFileSync(migrationPath, 'utf8');
            await client.query(migrationSql);
            console.log('✅ Migrations verificadas/executadas.');
        } else {
            console.warn(`⚠️ Arquivo migration.sql não encontrado em: ${migrationPath}`);
        }

        console.log('🚀 Banco de dados pronto para uso!');

    } catch (error) {
        console.error('❌ Erro Crítico ao inicializar banco de dados:', error);
        throw error; // Lança o erro para impedir que o servidor suba com banco quebrado
    } finally {
        client.release();
    }
}

export default pool;