import { redis } from "./redisClient";

const RANKING_KEY = "global:ranking";

export async function updateGlobalRanking(userId: number, points: number) {
  if (points <= 0) return;

  // 🔥 Redis SEMPRE usa string como member
  await redis.zincrby(RANKING_KEY, points, userId.toString());
}

export async function getGlobalRanking(limit = 10) {
  return await redis.zrevrange(RANKING_KEY, 0, limit - 1, "WITHSCORES");
}

export async function getPlayerRank(userId: number) {
  return await redis.zrevrank(RANKING_KEY, userId.toString());
}
