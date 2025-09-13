import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pgPool = new Pool({
  connectionString: process.env.POSTGRES_DB_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on("connect", (client) => {
  console.log("Connected to PostgreSQL database");
});

pgPool.on("error", (err) => {
  console.error("Error with PostgreSQL database:", err);
});

export default pgPool;