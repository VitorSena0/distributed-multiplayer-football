import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db'; // ajuste se o seu pool estiver em ../db
import redis from './redisClient';
import { PoolClient } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const SALT_ROUNDS = 10;
const RANKING_ZSET_KEY = 'global_ranking';
const PLAYER_HASH_PREFIX = 'player:';

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

function composeScore(stats: {
  wins: number;
  goals_difference: number;
  total_goals_scored: number;
}): number {
  // compõe um único score numérico para ordenar na ZSET.
  // Ajuste multiplicadores se precisar suportar números muito grandes.
  return stats.wins * 1e9 + stats.goals_difference * 1e4 + stats.total_goals_scored;
}

export class AuthService {
  // Registra um novo usuário
  static async register(username: string, password: string): Promise<AuthResponse> {
    try {
      const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);

      if (existingUser.rows.length > 0) {
        return { success: false, message: 'Nome de usuário já existe' };
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword]
      );

      const user = result.rows[0];

      // cria estatísticas iniciais
      await pool.query('INSERT INTO player_stats (user_id) VALUES ($1)', [user.id]);

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '30d'
      });

      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        token,
        userId: user.id,
        username: user.username
      };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return { success: false, message: 'Erro ao registrar usuário' };
    }
  }

  // Faz login de um usuário
  static async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const result = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [
        username
      ]);

      if (result.rows.length === 0) {
        return { success: false, message: 'Usuário ou senha incorretos' };
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return { success: false, message: 'Usuário ou senha incorretos' };
      }

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '30d'
      });

      return {
        success: true,
        message: 'Login realizado com sucesso',
        token,
        userId: user.id,
        username: user.username
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, message: 'Erro ao fazer login' };
    }
  }

  // Verifica token JWT
  static verifyToken(token: string): { valid: boolean; userId?: number; username?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
      return { valid: true, userId: decoded.userId, username: decoded.username };
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

      if (result.rows.length === 0) return null;
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  }

  // Atualiza estatísticas após uma partida completa.
  // Usa transação com client (pool.connect()) e atualiza Redis depois do commit.
  static async updateStats(
    userId: number,
    goalsScored: number,
    goalsConceded: number,
    result: 'win' | 'loss' | 'draw'
  ): Promise<boolean> {
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();            // <-- importante: conectar aqui
      await client.query('BEGIN');

      const goalsDiff = goalsScored - goalsConceded;

      await client.query(
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

      const res = await client.query(
        `SELECT u.username, ps.user_id, ps.total_goals_scored, ps.total_goals_conceded, 
                ps.goals_difference, ps.wins, ps.losses, ps.draws, ps.matches_played
         FROM player_stats ps
         JOIN users u ON u.id = ps.user_id
         WHERE ps.user_id = $1`,
        [userId]
      );

      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const updated = res.rows[0];

      await client.query('COMMIT');

      // Atualiza Redis (ZSET + hash do usuário) de forma atômica via pipeline
      const score = composeScore({
        wins: updated.wins,
        goals_difference: updated.goals_difference,
        total_goals_scored: updated.total_goals_scored
      });

      const userHashKey = PLAYER_HASH_PREFIX + userId;

      const pipeline = redis.multi();
      pipeline.zadd(RANKING_ZSET_KEY, score.toString(), String(userId));
      // hmset mantém compatibilidade; se usar ioredis v4+ prefira hset
      pipeline.hset(userHashKey, {
        username: updated.username,
        user_id: String(updated.user_id),
        total_goals_scored: String(updated.total_goals_scored),
        total_goals_conceded: String(updated.total_goals_conceded),
        goals_difference: String(updated.goals_difference),
        wins: String(updated.wins),
        losses: String(updated.losses),
        draws: String(updated.draws),
        matches_played: String(updated.matches_played)
      });
      await pipeline.exec();

      return true;
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
      }
      console.error('Erro ao atualizar estatísticas:', error);
      return false;
    } finally {
      if (client) client.release();
    }
  }

  // Busca ranking global: tenta Redis (ZREVRANGE + HGETALL), fallback para Postgres
  static async getGlobalRanking(limit: number = 10): Promise<UserStats[]> {
    try {
      const idsWithScores = await redis.zrevrange(RANKING_ZSET_KEY, 0, limit - 1, 'WITHSCORES');

      if (idsWithScores && idsWithScores.length > 0) {
        const userIds: string[] = [];
        for (let i = 0; i < idsWithScores.length; i += 2) {
          userIds.push(idsWithScores[i]);
        }

        const pipeline = redis.pipeline();
        userIds.forEach((id) => pipeline.hgetall(PLAYER_HASH_PREFIX + id));
        const results = await pipeline.exec();

        const ranking = results.map((r, idx) => {
          const data = (r && r[1]) || {};
          return {
            user_id: Number(data.user_id || userIds[idx]),
            username: data.username || 'Unknown',
            total_goals_scored: Number(data.total_goals_scored || 0),
            total_goals_conceded: Number(data.total_goals_conceded || 0),
            goals_difference: Number(data.goals_difference || 0),
            wins: Number(data.wins || 0),
            losses: Number(data.losses || 0),
            draws: Number(data.draws || 0),
            matches_played: Number(data.matches_played || 0)
          } as UserStats;
        });

        const needDbFetch = ranking.some((r) => !r.username || r.username === 'Unknown');
        if (!needDbFetch) {
          return ranking;
        }
        // else: reconstruir cache do DB abaixo
      }

      // Fallback para DB: seleciona e popula Redis
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

      const rows = result.rows as UserStats[];

      if (rows.length > 0) {
        const pipeline = redis.multi();
        for (const row of rows) {
          const score = composeScore({
            wins: row.wins,
            goals_difference: row.goals_difference,
            total_goals_scored: row.total_goals_scored
          });
          pipeline.zadd(RANKING_ZSET_KEY, score.toString(), String(row.user_id));
          pipeline.hset(PLAYER_HASH_PREFIX + row.user_id, {
            username: row.username,
            user_id: String(row.user_id),
            total_goals_scored: String(row.total_goals_scored),
            total_goals_conceded: String(row.total_goals_conceded),
            goals_difference: String(row.goals_difference),
            wins: String(row.wins),
            losses: String(row.losses),
            draws: String(row.draws),
            matches_played: String(row.matches_played)
          });
        }
        // opcional: pipeline.expire(RANKING_ZSET_KEY, 30);
        await pipeline.exec();
      }

      return rows;
    } catch (error) {
      console.error('Erro ao buscar ranking (Redis fallback):', error);
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
        return result.rows as UserStats[];
      } catch (dbErr) {
        console.error('Erro ao buscar ranking no DB:', dbErr);
        return [];
      }
    }
  }
}

export default AuthService;