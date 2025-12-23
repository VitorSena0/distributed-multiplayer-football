import React, { useEffect, useState } from 'react';
import { GameState } from '../types/game';
import { config } from '../config/gameConfig';

interface PlayerIDsProps {
  gameState: GameState;
  socketId?: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface PlayerLabel {
  id: string;
  x: number;
  y: number;
  isMe: boolean;
}

const PlayerIDs: React.FC<PlayerIDsProps> = ({ gameState, socketId, canvasRef }) => {
  const [labels, setLabels] = useState<PlayerLabel[]>([]);

  useEffect(() => {
    const updateLabels = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / config.canvas.width;
      const scaleY = canvasRect.height / config.canvas.height;

      const newLabels: PlayerLabel[] = Object.entries(gameState.players)
        .filter(([_, player]) => player)
        .map(([id, player]) => ({
          id: id.substring(0, 5),
          x: canvasRect.left + player.x * scaleX,
          y: canvasRect.top + player.y * scaleY - config.player.radius,
          isMe: id === socketId,
        }));

      setLabels(newLabels);
    };

    updateLabels();
    
    // Update on resize or scroll
    window.addEventListener('resize', updateLabels);
    window.addEventListener('scroll', updateLabels);

    return () => {
      window.removeEventListener('resize', updateLabels);
      window.removeEventListener('scroll', updateLabels);
    };
  }, [gameState.players, socketId, canvasRef]);

  return (
    <>
      {labels.map((label, index) => (
        <div
          key={index}
          className={`player-id ${label.isMe ? 'my-player' : ''}`}
          style={{
            left: `${label.x}px`,
            top: `${label.y}px`,
          }}
        >
          {label.id}
        </div>
      ))}
    </>
  );
};

export default PlayerIDs;
