import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const SALT_ROUNDS = 10;

export interface User {
    id: number;
    username: string;
    password: string;
    created_at: Date;
}

export interface UserStats {
    user_id: number;
    username: string;
    total_goals_scored: number;
    total_goals_conceded: number;
    goals_difference: number;
    wins: number;
    losses: number;
    draws: number;
    matches_played: number;
}

export interface AuthResponse {
    success: boolean;
    message?: string;
    token?: string;
    userId?: number;
    username?: string;
}

export class AuthService {
    // Registra um novo usuário
    static async register(username: string, password: string): Promise<AuthResponse> {
        try {
            // Verifica se o usuário já existe
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );

            if (existingUser.rows.length > 0) {
                return {
                    success: false,
                    message: 'Nome de usuário já existe'
                };
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            // Insere o novo usuário
            const result = await pool.query(
                'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
                [username, hashedPassword]
            );

            const user = result.rows[0];

            // Cria estatísticas iniciais para o usuário
            await pool.query(
                'INSERT INTO player_stats (user_id) VALUES ($1)',
                [user.id]
            );

            // Gera token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            return {
                success: true,
                message: 'Usuário registrado com sucesso',
                token,
                userId: user.id,
                username: user.username
            };
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            return {
                success: false,
                message: 'Erro ao registrar usuário'
            };
        }
    }

    // Faz login de um usuário
    static async login(username: string, password: string): Promise<AuthResponse> {
        try {
            // Busca o usuário
            const result = await pool.query(
                'SELECT id, username, password FROM users WHERE username = $1',
                [username]
            );

            if (result.rows.length === 0) {
                return {
                    success: false,
                    message: 'Usuário ou senha incorretos'
                };
            }

            const user = result.rows[0];

            // Verifica a senha
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return {
                    success: false,
                    message: 'Usuário ou senha incorretos'
                };
            }

            // Gera token JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            return {
                success: true,
                message: 'Login realizado com sucesso',
                token,
                userId: user.id,
                username: user.username
            };
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return {
                success: false,
                message: 'Erro ao fazer login'
            };
        }
    }

    // Verifica se um token é válido
    static verifyToken(token: string): { valid: boolean; userId?: number; username?: string } {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
            return {
                valid: true,
                userId: decoded.userId,
                username: decoded.username
            };
        } catch (error) {
            return { valid: false };
        }
    }

    // Busca estatísticas de um usuário
    static async getUserStats(userId: number): Promise<UserStats | null> {
        try {
            const result = await pool.query(
                `SELECT u.username, ps.user_id, ps.total_goals_scored, ps.total_goals_conceded, 
                        ps.goals_difference, ps.wins, ps.losses, ps.draws, ps.matches_played
                 FROM player_stats ps
                 JOIN users u ON u.id = ps.user_id
                 WHERE ps.user_id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return null;
        }
    }

    // Atualiza estatísticas após uma partida completa
    static async updateStats(
        userId: number,
        goalsScored: number,
        goalsConceded: number,
        result: 'win' | 'loss' | 'draw'
    ): Promise<boolean> {
        try {
            const goalsDiff = goalsScored - goalsConceded;
            
            await pool.query(
                `UPDATE player_stats 
                 SET total_goals_scored = total_goals_scored + $1,
                     total_goals_conceded = total_goals_conceded + $2,
                     goals_difference = goals_difference + $3,
                     wins = wins + $4,
                     losses = losses + $5,
                     draws = draws + $6,
                     matches_played = matches_played + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $7`,
                [
                    goalsScored,
                    goalsConceded,
                    goalsDiff,
                    result === 'win' ? 1 : 0,
                    result === 'loss' ? 1 : 0,
                    result === 'draw' ? 1 : 0,
                    userId
                ]
            );

            return true;
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
            return false;
        }
    }

    // Busca ranking global dos jogadores
    static async getGlobalRanking(limit: number = 10): Promise<UserStats[]> {
        try {
            const result = await pool.query(
                `SELECT u.username, ps.user_id, ps.total_goals_scored, ps.total_goals_conceded, 
                        ps.goals_difference, ps.wins, ps.losses, ps.draws, ps.matches_played
                 FROM player_stats ps
                 JOIN users u ON u.id = ps.user_id
                 WHERE ps.matches_played > 0
                 ORDER BY ps.wins DESC, ps.goals_difference DESC, ps.total_goals_scored DESC
                 LIMIT $1`,
                [limit]
            );

            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar ranking:', error);
            return [];
        }
    }
}
