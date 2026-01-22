import { Server as SocketIOServer, Socket } from 'socket.io';
import { MATCH_DURATION } from './constants';
import { buildGameState } from './roomManager';
import { resetBall } from './ball';
import { Room, Player } from './types';
import { AuthService } from '../services/authService';
import { updateGlobalRanking } from '../services/rankingService';

function balanceTeams(room: Room, io: SocketIOServer): void {
    const redCount = room.teams.red.length;
    const blueCount = room.teams.blue.length;

    if (Math.abs(redCount - blueCount) <= 1) {
        return;
    }

    const [largerTeam, smallerTeam]: ['red' | 'blue', 'red' | 'blue'] = redCount > blueCount ? ['red', 'blue'] : ['blue', 'red'];
    const playerToMove = room.teams[largerTeam].pop();

    if (!playerToMove) {
        return;
    }

    room.teams[smallerTeam].push(playerToMove);

    const player = room.players[playerToMove];
    if (player) {
        player.team = smallerTeam;
        player.x = smallerTeam === 'red' ? 100 : room.width - 100;
        player.y = room.height / 2;

        const playerSocket = io.sockets.sockets.get(playerToMove);
        if (playerSocket) {
            playerSocket.emit('teamChanged', {
                newTeam: smallerTeam,
                gameState: buildGameState(room),
            });
        }
    }
}

export function startNewMatch(room: Room, io: SocketIOServer): void {
    room.isPlaying = true;
    room.waitingForRestart = false;
    room.playersReady.clear();
    room.score = { red: 0, blue: 0 };
    room.matchTime = MATCH_DURATION;
    resetBall(room, io);

    Object.keys(room.players).forEach((id) => {
        const player = room.players[id];
        player.x = player.team === 'red' ? 100 : room.width - 100;
        player.y = room.height / 2;
        player.goals = 0; // Reseta gols individuais dos jogadores para a nova partida
    });

    io.to(room.id).emit('cleanPreviousMatch');
    io.to(room.id).emit('matchStart', {
        gameState: buildGameState(room),
        canMove: true,
    });
}

export function checkRestartConditions(room: Room, io: SocketIOServer): void {
    balanceTeams(room, io);

    const hasRedPlayers = room.teams.red.length > 0;
    const hasBluePlayers = room.teams.blue.length > 0;

    // Todos os jogadores atualmente na sala
    const allPlayerIds: string[] = [
        ...room.teams.red,
        ...room.teams.blue,
    ];

    const allPlayerIdsSet = new Set<string>(allPlayerIds);

    // Limpa playersReady removendo jogadores que saíram da sala
    room.playersReady.forEach((playerId) => {
        if (!allPlayerIdsSet.has(playerId)) {
            room.playersReady.delete(playerId);
        }
    });

    if (hasRedPlayers && hasBluePlayers) {
        // Caso esteja aguardando restart, decide se reinicia ou começa do zero
        if (room.waitingForRestart) {
            // Se algum jogador atual não está marcado como ready,
            // significa que entrou alguém novo durante o restart
            const hasNewPlayers = allPlayerIds.some(
                (id) => !room.playersReady.has(id)
            );

            if (hasNewPlayers) {
                // Jogador novo entrou → partida nova
                startNewMatch(room, io);
            } else {
                // Todos são do jogo anterior e estão prontos
                const allReady =
                    allPlayerIds.length > 0 &&
                    allPlayerIds.every((id) =>
                        room.playersReady.has(id)
                    );

                if (allReady) {
                    startNewMatch(room, io);
                }
            }
        } else if (!room.isPlaying) {
            // Não está jogando nem aguardando restart → inicia partida
            startNewMatch(room, io);
        }
    } else {
        room.isPlaying = false;
        io.to(room.id).emit('waitingForPlayers', {
            redCount: room.teams.red.length,
            blueCount: room.teams.blue.length,
        });
    }
}

export function updateTimer(room: Room, io: SocketIOServer): void {
    if (!room.isPlaying) {
        return;
    }

    room.matchTime -= 1;

    if (room.matchTime <= 0) {
        room.isPlaying = false;
        room.waitingForRestart = true;
        const winner =
            room.score.red > room.score.blue
                ? 'red'
                : room.score.blue > room.score.red
                ? 'blue'
                : 'draw';

        // Salva estatísticas dos jogadores registrados
        saveMatchStats(room, winner);

        Object.keys(room.players).forEach((id) => {
            room.players[id].x = -100;
            room.players[id].y = -100;
        });

        io.to(room.id).emit('matchEnd', {
            winner,
            gameState: buildGameState(room),
        });
    }

    io.to(room.id).emit('timerUpdate', { matchTime: room.matchTime });
}

// Função auxiliar para salvar estatísticas dos jogadores
async function saveMatchStats(room: Room, winner: 'red' | 'blue' | 'draw'): Promise<void> {
    const redPlayers = room.teams.red;
    const bluePlayers = room.teams.blue;
    
    // Salva estatísticas do time vermelho
    for (const playerId of redPlayers) {
        const player = room.players[playerId];
        if (player && player.userId) {
            const goalsScored = player.goals;
            const goalsConceded = room.score.blue;
            let result: 'win' | 'loss' | 'draw';
            
            if (winner === 'red') result = 'win';
            else if (winner === 'blue') result = 'loss';
            else result = 'draw';
            
            try {
                await AuthService.updateStats(player.userId, goalsScored, goalsConceded, result);
                await updateGlobalRanking(player.userId, goalsScored);
                console.log(`Estatísticas atualizadas para usuário ${player.userId}: ${goalsScored} gols`);
            } catch (error) {
                console.error(`Erro ao salvar estatísticas do usuário ${player.userId}:`, error);
            }
        }
    }
    
    // Salva estatísticas do time azul
    for (const playerId of bluePlayers) {
        const player = room.players[playerId];
        if (player && player.userId) {
            const goalsScored = player.goals;
            const goalsConceded = room.score.red;
            let result: 'win' | 'loss' | 'draw';
            
            if (winner === 'blue') result = 'win';
            else if (winner === 'red') result = 'loss';
            else result = 'draw';
            
            try {
                await AuthService.updateStats(player.userId, goalsScored, goalsConceded, result);
                await updateGlobalRanking(player.userId, goalsScored);
                console.log(`Estatísticas atualizadas para usuário ${player.userId}: ${goalsScored} gols`);
            } catch (error) {
                console.error(`Erro ao salvar estatísticas do usuário ${player.userId}:`, error);
            }
        }
    }
}
