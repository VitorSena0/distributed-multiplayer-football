import React, { useEffect, useRef } from 'react';
import type { GameState, Config } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  socketId?: string;
  matchEnded: boolean;
  canMove: boolean;
}

const config: Config = {
  canvas: { width: 800, height: 600 },
  field: { cornerSize: 80 },
  player: { radius: 20 },
  ball: { radius: 10 },
  goal: { width: 50, height: 200 },
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  socketId,
  matchEnded,
  canMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      try {
        ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);

        // Fundo base com gradiente
        const gradient = ctx.createRadialGradient(
          config.canvas.width / 2,
          config.canvas.height / 2,
          0,
          config.canvas.width / 2,
          config.canvas.height / 2,
          config.canvas.width / 2
        );
        gradient.addColorStop(0, '#2d5a3d');
        gradient.addColorStop(1, '#1a3827');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

        // Textura de gramado aprimorada
        const stripeHeight = 24;
        for (let y = 0; y < config.canvas.height; y += stripeHeight) {
          ctx.fillStyle =
            Math.floor(y / stripeHeight) % 2 === 0
              ? 'rgba(47, 75, 55, 0.5)'
              : 'rgba(37, 56, 43, 0.5)';
          ctx.fillRect(0, y, config.canvas.width, stripeHeight);
        }

        // Cantos triangulares
        const cornerSize = config.field.cornerSize || 0;
        if (cornerSize > 0) {
          ctx.fillStyle = '#1f2f35';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(cornerSize, 0);
          ctx.lineTo(0, cornerSize);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(config.canvas.width - cornerSize, 0);
          ctx.lineTo(config.canvas.width, 0);
          ctx.lineTo(config.canvas.width, cornerSize);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(0, config.canvas.height - cornerSize);
          ctx.lineTo(0, config.canvas.height);
          ctx.lineTo(cornerSize, config.canvas.height);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(config.canvas.width - cornerSize, config.canvas.height);
          ctx.lineTo(config.canvas.width, config.canvas.height);
          ctx.lineTo(config.canvas.width, config.canvas.height - cornerSize);
          ctx.closePath();
          ctx.fill();
        }

        // Linhas do campo com brilho (otimizado - usando rgba)
        ctx.lineWidth = 4;
        ctx.setLineDash([]);
        const padding = 0;
        const innerWidth = config.canvas.width - padding * 2;
        const innerHeight = config.canvas.height - padding * 2;

        // Linha de brilho (mais grossa, semitransparente)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 8;
        ctx.strokeRect(padding, padding, innerWidth, innerHeight);

        // Linha principal
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(padding, padding, innerWidth, innerHeight);

        // Linha central
        ctx.beginPath();
        ctx.moveTo(config.canvas.width / 2, padding);
        ctx.lineTo(config.canvas.width / 2, config.canvas.height - padding);
        ctx.stroke();

        // Círculo central com brilho
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(config.canvas.width / 2, config.canvas.height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(config.canvas.width / 2, config.canvas.height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(config.canvas.width / 2, config.canvas.height / 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Áreas e gols
        const bigBoxWidth = 140;
        const bigBoxHeight = 260;
        const smallBoxWidth = 70;
        const smallBoxHeight = 140;
        const goalLineTop = (config.canvas.height - bigBoxHeight) / 2;

        ctx.strokeRect(padding, goalLineTop, bigBoxWidth, bigBoxHeight);
        ctx.strokeRect(
          padding,
          (config.canvas.height - smallBoxHeight) / 2,
          smallBoxWidth,
          smallBoxHeight
        );
        ctx.beginPath();
        ctx.arc(padding + 90, config.canvas.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeRect(
          config.canvas.width - padding - bigBoxWidth,
          goalLineTop,
          bigBoxWidth,
          bigBoxHeight
        );
        ctx.strokeRect(
          config.canvas.width - padding - smallBoxWidth,
          (config.canvas.height - smallBoxHeight) / 2,
          smallBoxWidth,
          smallBoxHeight
        );
        ctx.beginPath();
        ctx.arc(config.canvas.width - padding - 90, config.canvas.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(padding + bigBoxWidth, config.canvas.height / 2, 60, Math.PI * 1.5, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          config.canvas.width - padding - bigBoxWidth,
          config.canvas.height / 2,
          60,
          Math.PI / 2,
          Math.PI * 1.5
        );
        ctx.stroke();

        // Gols com efeito de rede
        const redGoalGradient = ctx.createLinearGradient(0, 0, config.goal.width, 0);
        redGoalGradient.addColorStop(0, 'rgba(231, 76, 60, 0.4)');
        redGoalGradient.addColorStop(1, 'rgba(231, 76, 60, 0.1)');
        ctx.fillStyle = redGoalGradient;
        ctx.fillRect(
          0,
          config.canvas.height / 2 - config.goal.height / 2,
          config.goal.width,
          config.goal.height
        );

        const blueGoalGradient = ctx.createLinearGradient(
          config.canvas.width - config.goal.width,
          0,
          config.canvas.width,
          0
        );
        blueGoalGradient.addColorStop(0, 'rgba(52, 152, 219, 0.1)');
        blueGoalGradient.addColorStop(1, 'rgba(52, 152, 219, 0.4)');
        ctx.fillStyle = blueGoalGradient;
        ctx.fillRect(
          config.canvas.width - config.goal.width,
          config.canvas.height / 2 - config.goal.height / 2,
          config.goal.width,
          config.goal.height
        );

        // Jogadores com gradiente (otimizado - sombra simplificada)
        for (const [id, player] of Object.entries(gameState.players)) {
          if (player) {
            const isDimmed = matchEnded && !canMove;

            // Sombra simplificada (círculo escuro abaixo)
            ctx.fillStyle = isDimmed ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(player.x + 2, player.y + 4, config.player.radius, 0, Math.PI * 2);
            ctx.fill();

            // Gradiente para o jogador
            const playerGradient = ctx.createRadialGradient(
              player.x - 5,
              player.y - 5,
              0,
              player.x,
              player.y,
              config.player.radius
            );

            if (player.team === 'red') {
              playerGradient.addColorStop(0, isDimmed ? 'rgba(231, 76, 60, 0.7)' : '#e74c3c');
              playerGradient.addColorStop(1, isDimmed ? 'rgba(192, 57, 43, 0.7)' : '#c0392b');
            } else {
              playerGradient.addColorStop(0, isDimmed ? 'rgba(52, 152, 219, 0.7)' : '#3498db');
              playerGradient.addColorStop(1, isDimmed ? 'rgba(41, 128, 185, 0.7)' : '#2980b9');
            }

            ctx.fillStyle = playerGradient;
            ctx.beginPath();
            ctx.arc(player.x, player.y, config.player.radius, 0, Math.PI * 2);
            ctx.fill();

            // Destaque para o próprio jogador (brilho simplificado)
            if (id === socketId) {
              // Brilho externo
              ctx.strokeStyle =
                player.team === 'red'
                  ? 'rgba(231, 76, 60, 0.4)'
                  : 'rgba(52, 152, 219, 0.4)';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(player.x, player.y, config.player.radius + 6, 0, Math.PI * 2);
              ctx.stroke();

              // Borda branca
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(player.x, player.y, config.player.radius + 5, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }

        // Bola com gradiente (otimizado - sombra simplificada)
        if (gameState.ball.x >= -50 && gameState.ball.x <= config.canvas.width + 50) {
          // Sombra simplificada (círculo escuro abaixo)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(
            gameState.ball.x + 1,
            gameState.ball.y + 3,
            gameState.ball.radius,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Gradiente para a bola
          const ballGradient = ctx.createRadialGradient(
            gameState.ball.x - 3,
            gameState.ball.y - 3,
            0,
            gameState.ball.x,
            gameState.ball.y,
            gameState.ball.radius
          );
          ballGradient.addColorStop(0, '#ffffff');
          ballGradient.addColorStop(1, '#ecf0f1');

          ctx.fillStyle = ballGradient;
          ctx.strokeStyle = '#2c3e50';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } catch (error) {
        console.error('Erro na renderização:', error);
      }
    };

    draw();
    const animationId = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [gameState, socketId, matchEnded, canMove]);

  return (
    <canvas
      ref={canvasRef}
      width={config.canvas.width}
      height={config.canvas.height}
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '100%',
        height: 'auto',
        aspectRatio: '4 / 3',
      }}
    />
  );
};
