const { createClient } = require('redis');
require('dotenv').config();

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || '';

const client = createClient({
  url: `redis://:${redisPassword}@${redisHost}:${redisPort}`
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Could not connect to Redis', err);
  }
})();

module.exports = client;
