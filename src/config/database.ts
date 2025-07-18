import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_DB_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", (client) => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Error with PostgreSQL database:", err);
});

export default pool;