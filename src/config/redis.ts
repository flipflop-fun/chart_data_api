// import { createClient } from 'redis';
import { Redis } from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const client = new Redis(process.env.REDIS_URL as string);
client.on('error', (err: any) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connected'));

export default client;