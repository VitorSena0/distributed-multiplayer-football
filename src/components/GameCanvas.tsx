import React, { useEffect, useRef } from 'react';
import { GameState } from '../types/game';
import { config } from '../config/gameConfig';

interface GameCanvasProps {
  gameState: GameState;
  socketId?: string;
  matchEnded: boolean;
  canMove: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, socketId, matchEnded, canMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);

      // Field base with gradient
      const gradient = ctx.createLinearGradient(0, 0, config.canvas.width, config.canvas.height);
      gradient.addColorStop(0, '#1e3a20');
      gradient.addColorStop(1, '#2d5016');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

      // Grass stripes for texture
      const stripeHeight = 24;
      for (let y = 0; y < config.canvas.height; y += stripeHeight) {
        ctx.fillStyle = Math.floor(y / stripeHeight) % 2 === 0 ? 'rgba(47, 75, 55, 0.3)' : 'rgba(37, 56, 43, 0.3)';
        ctx.fillRect(0, y, config.canvas.width, stripeHeight);
      }

      // Corner triangles (darker areas)
      const cornerSize = config.field.cornerSize;
      ctx.fillStyle = 'rgba(31, 47, 53, 0.6)';

      // Top-left
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fill();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(config.canvas.width - cornerSize, 0);
      ctx.lineTo(config.canvas.width, 0);
      ctx.lineTo(config.canvas.width, cornerSize);
      ctx.closePath();
      ctx.fill();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(0, config.canvas.height - cornerSize);
      ctx.lineTo(0, config.canvas.height);
      ctx.lineTo(cornerSize, config.canvas.height);
      ctx.closePath();
      ctx.fill();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(config.canvas.width - cornerSize, config.canvas.height);
      ctx.lineTo(config.canvas.width, config.canvas.height);
      ctx.lineTo(config.canvas.width, config.canvas.height - cornerSize);
      ctx.closePath();
      ctx.fill();

      // Field lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      
      // Outer boundary
      ctx.strokeRect(0, 0, config.canvas.width, config.canvas.height);

      // Center line
      ctx.beginPath();
      ctx.moveTo(config.canvas.width / 2, 0);
      ctx.lineTo(config.canvas.width / 2, config.canvas.height);
      ctx.stroke();

      // Center circle
      ctx.beginPath();
      ctx.arc(config.canvas.width / 2, config.canvas.height / 2, 60, 0, Math.PI * 2);
      ctx.stroke();
      
      // Center spot
      ctx.beginPath();
      ctx.arc(config.canvas.width / 2, config.canvas.height / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      // Penalty areas and boxes
      const bigBoxWidth = 140;
      const bigBoxHeight = 260;
      const smallBoxWidth = 70;
      const smallBoxHeight = 140;
      const goalLineTop = (config.canvas.height - bigBoxHeight) / 2;

      // Left side
      ctx.strokeRect(0, goalLineTop, bigBoxWidth, bigBoxHeight);
      ctx.strokeRect(0, (config.canvas.height - smallBoxHeight) / 2, smallBoxWidth, smallBoxHeight);
      ctx.beginPath();
      ctx.arc(90, config.canvas.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Right side
      ctx.strokeRect(config.canvas.width - bigBoxWidth, goalLineTop, bigBoxWidth, bigBoxHeight);
      ctx.strokeRect(
        config.canvas.width - smallBoxWidth,
        (config.canvas.height - smallBoxHeight) / 2,
        smallBoxWidth,
        smallBoxHeight
      );
      ctx.beginPath();
      ctx.arc(config.canvas.width - 90, config.canvas.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // Penalty arcs
      ctx.beginPath();
      ctx.arc(bigBoxWidth, config.canvas.height / 2, 60, Math.PI * 1.5, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(config.canvas.width - bigBoxWidth, config.canvas.height / 2, 60, Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();

      // Goals with enhanced styling
      // Left goal (red team)
      const goalGradient1 = ctx.createLinearGradient(0, 0, config.goal.width, 0);
      goalGradient1.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      goalGradient1.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
      ctx.fillStyle = goalGradient1;
      ctx.fillRect(0, config.canvas.height / 2 - config.goal.height / 2, config.goal.width, config.goal.height);
      
      // Right goal (blue team)
      const goalGradient2 = ctx.createLinearGradient(config.canvas.width - config.goal.width, 0, config.canvas.width, 0);
      goalGradient2.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
      goalGradient2.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
      ctx.fillStyle = goalGradient2;
      ctx.fillRect(
        config.canvas.width - config.goal.width,
        config.canvas.height / 2 - config.goal.height / 2,
        config.goal.width,
        config.goal.height
      );

      // Draw players with enhanced styling
      for (const [id, player] of Object.entries(gameState.players)) {
        if (player) {
          ctx.globalAlpha = matchEnded && !canMove ? 0.6 : 1.0;
          
          // Player shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(player.x + 3, player.y + 3, config.player.radius, config.player.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Player body with gradient
          const playerGradient = ctx.createRadialGradient(
            player.x - 5,
            player.y - 5,
            0,
            player.x,
            player.y,
            config.player.radius
          );
          
          if (player.team === 'red') {
            playerGradient.addColorStop(0, '#fca5a5');
            playerGradient.addColorStop(1, '#ef4444');
          } else {
            playerGradient.addColorStop(0, '#93c5fd');
            playerGradient.addColorStop(1, '#3b82f6');
          }
          
          ctx.fillStyle = playerGradient;
          ctx.beginPath();
          ctx.arc(player.x, player.y, config.player.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Player outline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.x, player.y, config.player.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Highlight current player
          if (id === socketId) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, config.player.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            
            // Glow effect
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x, player.y, config.player.radius + 9, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          ctx.globalAlpha = 1.0;
        }
      }

      // Draw ball with enhanced styling
      if (gameState.ball.x >= -50 && gameState.ball.x <= config.canvas.width + 50) {
        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(gameState.ball.x + 2, gameState.ball.y + 2, gameState.ball.radius, gameState.ball.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball with gradient
        const ballGradient = ctx.createRadialGradient(
          gameState.ball.x - 3,
          gameState.ball.y - 3,
          0,
          gameState.ball.x,
          gameState.ball.y,
          gameState.ball.radius
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(1, '#e0e0e0');
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    draw();
  }, [gameState, socketId, matchEnded, canMove]);

  return (
    <canvas
      ref={canvasRef}
      width={config.canvas.width}
      height={config.canvas.height}
    />
  );
};

export default GameCanvas;
