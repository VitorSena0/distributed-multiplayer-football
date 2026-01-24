// services/roomSyncService.ts
// Serviço para sincronizar salas entre réplicas usando Redis

import redis from './redisClient';
import { Room } from '../game/types';

const ROOMS_KEY_PREFIX = 'game:rooms:';
const ROOM_COUNTER_KEY = 'game:room_counter';
const ROOM_LIST_KEY = 'game:active_rooms';

/**
 * Salva uma sala no Redis
 */
export async function saveRoom(room: Room): Promise<void> {
    try {
        const key = `${ROOMS_KEY_PREFIX}${room.id}`;
        // Converte Set para Array antes de serializar
        const roomToSave = {
            ...room,
            playersReady: Array.from(room.playersReady)
        };
        await redis.set(key, JSON.stringify(roomToSave), 'EX', 3600);
        await redis.sadd(ROOM_LIST_KEY, room.id);
    } catch (error) {
        console.error(`Erro ao salvar sala ${room.id} no Redis:`, error);
    }
}

/**
 * Busca uma sala do Redis
 */
export async function getRoom(roomId: string): Promise<Room | null> {
    try {
        const key = `${ROOMS_KEY_PREFIX}${roomId}`;
        const data = await redis.get(key);
        if (!data) return null;
        
        const room = JSON.parse(data) as Room;
        // Recria o Set que foi serializado como array
        room.playersReady = new Set(Array.isArray(room.playersReady) ? room.playersReady : []);
        return room;
    } catch (error) {
        console.error(`Erro ao buscar sala ${roomId} do Redis:`, error);
        return null;
    }
}

/**
 * Deleta uma sala do Redis
 */
export async function deleteRoom(roomId: string): Promise<void> {
    try {
        const key = `${ROOMS_KEY_PREFIX}${roomId}`;
        await redis.del(key);
        await redis.srem(ROOM_LIST_KEY, roomId);
    } catch (error) {
        console.error(`Erro ao deletar sala ${roomId} do Redis:`, error);
    }
}

/**
 * Lista todas as salas ativas
 */
export async function getAllRooms(): Promise<Room[]> {
    try {
        const roomIds = await redis.smembers(ROOM_LIST_KEY);
        const rooms: Room[] = [];
        
        for (const roomId of roomIds) {
            const room = await getRoom(roomId);
            if (room) {
                rooms.push(room);
            }
        }
        
        return rooms;
    } catch (error) {
        console.error('Erro ao buscar todas as salas do Redis:', error);
        return [];
    }
}

/**
 * Gera um ID único para uma nova sala usando Redis INCR (atômico)
 */
export async function generateRoomId(): Promise<string> {
    try {
        const sequence = await redis.incr(ROOM_COUNTER_KEY);
        return `room-${sequence}`;
    } catch (error) {
        console.error('Erro ao gerar ID de sala:', error);
        // Fallback para timestamp se Redis falhar
        return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Atualiza o timestamp de última atividade de uma sala
 */
export async function touchRoom(roomId: string): Promise<void> {
    try {
        const key = `${ROOMS_KEY_PREFIX}${roomId}`;
        await redis.expire(key, 3600); // Renova expiração para 1 hora
    } catch (error) {
        console.error(`Erro ao renovar sala ${roomId}:`, error);
    }
}
