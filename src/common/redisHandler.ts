import { createClient, RedisClientType } from "redis";

export const getRedisClient = async (): Promise<RedisClientType> => {
  const host = process.env.REDIS_HOST!;
  const port = process.env.REDIS_PORT!;
  const password = process.env.REDIS_PASSWORD!;

  const redisClient = createClient({
    socket: {
      host: host,
      port: parseInt(port),
    },
    password: password,
    username: "default",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redisClient.on("error", (err: any) => {
    console.error("Redis Client Error", err);
    throw new Error("failed to connect to redis");
  });

  return redisClient as RedisClientType; // Only create the client, but don't connect yet
};

export const connectRedisClient = async (
  redisClient: RedisClientType
): Promise<void> => {
  try {
    await redisClient.connect();

    console.log("Connected to Redis");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    throw err;
  }
};

export const redisGet = async (
  redisClient: RedisClientType,
  key: string
): Promise<object | null> => {
  try {
    console.log(`Redis GET: ${key}`);

    const value = await redisClient.get(key);

    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Redis GET Error for key ${key}:`, error);
    throw error;
  }
};

/**
 * @param ttl - Time-to-live in seconds (default: 1 hour)
 */
export const redisSet = async (
  redisClient: RedisClientType,
  key: string,
  value: object,
  ttl = 3600
): Promise<void> => {
  try {
    console.log(`Redis SET: ${key} -> ${value} (TTL: ${ttl}s)`);

    const serializedValue = JSON.stringify(value);
    const result = await redisClient.set(key, serializedValue, { EX: ttl });

    if (result === "OK") {
      console.log(`Successfully set key: ${key}`);
    } else {
      console.error(`Failed to set key: ${key}`);
    }
  } catch (error) {
    console.error(`Redis SET Error for key ${key}:`, error);
    throw error;
  }
};

export const redisDelete = async (
  redisClient: RedisClientType,
  key: string
): Promise<void> => {
  try {
    console.log(`Redis DELETE: ${key}`);

    const result = await redisClient.del(key);

    if (result === 1) {
      console.log(`Successfully deleted key: ${key}`);
    } else {
      console.warn(`Key not found or already deleted: ${key}`);
    }
  } catch (error) {
    console.error(`Redis DELETE Error for key ${key}:`, error);
    throw error;
  }
};
