import { BALL_RADIUS, MATCH_DURATION, MAX_PLAYERS_PER_ROOM } from './constants';
import { Room, Ball, RoomAllocation, GameState } from './types';
import * as RoomSync from '../services/roomSyncService';

const rooms = new Map<string, Room>();
let roomSequence = 1;

const defaultBallState = (): Ball => ({
    x: 400,
    y: 300,
    radius: BALL_RADIUS,
    speedX: 0,
    speedY: 0,
    lastTouchPlayerId: null,
    lastTouchTeam: null,
});

function sanitizeRoomId(roomId: string | undefined): string | null {
    if (typeof roomId !== 'string') return null;
    const trimmed = roomId.trim().toLowerCase();
    if (!trimmed) return null;
    const normalized = trimmed
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')
        .slice(0, 32);
    return normalized || null;
}

async function generateRoomId(): Promise<string> {
    try {
        return await RoomSync.generateRoomId();
    } catch (error) {
        console.error('Erro ao gerar ID via Redis, usando fallback local:', error);
        let candidate: string;
        do {
            candidate = `room-${roomSequence++}`;
        } while (rooms.has(candidate));
        return candidate;
    }
}

async function createRoom(roomId?: string): Promise<Room> {
    const id = roomId || await generateRoomId();
    
    const existingRoom = await RoomSync.getRoom(id);
    if (existingRoom) {
        rooms.set(id, existingRoom);
        return existingRoom;
    }
    
    const roomState: Room = {
        id,
        width: 800,
        height: 600,
        players: {},
        ball: defaultBallState(),
        score: { red: 0, blue: 0 },
        teams: { red: [], blue: [] },
        matchTime: MATCH_DURATION,
        isPlaying: false,
        isResettingBall: false,
        nextBallPosition: null,
        ballResetInProgress: false,
        lastGoalTime: 0,
        goalCooldown: 500,
        waitingForRestart: false,
        playersReady: new Set<string>(),
    };
    
    rooms.set(id, roomState);
    await RoomSync.saveRoom(roomState);
    console.log(`🆕 Sala criada e sincronizada: ${id}`);
    return roomState;
}

function getPlayerCount(room: Room): number {
    return Object.keys(room.players).length;
}

async function getOrCreateAvailableRoom(): Promise<Room> {
    const allRooms = await RoomSync.getAllRooms();
    
    for (const room of allRooms) {
        rooms.set(room.id, room);
    }
    
    for (const room of rooms.values()) {
        if (getPlayerCount(room) < MAX_PLAYERS_PER_ROOM) {
            console.log(`♻️  Reutilizando sala existente: ${room.id} (${getPlayerCount(room)}/${MAX_PLAYERS_PER_ROOM} jogadores)`);
            return room;
        }
    }
    
    return await createRoom();
}

async function allocateRoom(requestedRoomId?: string): Promise<RoomAllocation> {
    if (requestedRoomId) {
        const sanitized = sanitizeRoomId(requestedRoomId);
        if (!sanitized) {
            return { room: await getOrCreateAvailableRoom() };
        }
        
        let room = await RoomSync.getRoom(sanitized);
        if (!room) {
            room = await createRoom(sanitized);
        } else {
            rooms.set(sanitized, room);
        }
        
        if (getPlayerCount(room) < MAX_PLAYERS_PER_ROOM) {
            return { room };
        }
        return { error: 'room-full', roomId: sanitized };
    }

    return { room: await getOrCreateAvailableRoom() };
}

function buildGameState(room: Room): GameState {
    return {
        width: room.width,
        height: room.height,
        players: room.players,
        ball: room.ball,
        score: room.score,
        teams: room.teams,
        matchTime: room.matchTime,
        isPlaying: room.isPlaying,
        roomId: room.id,
    };
}

async function cleanupRoomIfEmpty(room: Room): Promise<void> {
    if (room && getPlayerCount(room) === 0) {
        rooms.delete(room.id);
        await RoomSync.deleteRoom(room.id);
        console.log(`🗑️  Sala removida (local + Redis): ${room.id}`);
    }
}

async function syncRoomToRedis(room: Room): Promise<void> {
    await RoomSync.saveRoom(room);
    await RoomSync.touchRoom(room.id);
}

export {
    rooms,
    allocateRoom,
    createRoom,
    getPlayerCount,
    getOrCreateAvailableRoom,
    buildGameState,
    cleanupRoomIfEmpty,
    syncRoomToRedis,
};
