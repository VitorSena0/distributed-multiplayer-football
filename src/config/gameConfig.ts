import { GameConfig } from '../types/game';

export const config: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  field: {
    cornerSize: 80,
  },
  player: {
    radius: 20,
  },
  ball: {
    radius: 10,
  },
  goal: {
    width: 50,
    height: 200,
  },
};
