const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Connected to Redis Cache');
  } catch (err) {
    console.error('Could not connect to Redis:', err);
  }
})();

module.exports = redisClient;
