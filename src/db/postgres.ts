import { config } from "dotenv";
import { Request, Response } from "express";
import { Pool } from "pg";
import { INIT_SCRIPT } from "./createTable";
config();

let pgClient: Pool;

export const connectToPostgres = async (pgClient: Pool) => {
  if (!pgClient) {
    pgClient = new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "6543"),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 100, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // 30 seconds idle time before closing a client
      connectionTimeoutMillis: 30000, // 30 seconds timeout when acquiring a connection from the pool
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  console.log("🟢 Connected to postgres");
  return pgClient;
};

export const disconnectPostgres = async () => {
  try {
    await pgClient.end();
    console.log("🟢 Disconnecting from postgres");
  } catch (error) {
    console.error("Error closing PostgreSQL connection pool:", error);
  } finally {
    process.exit(0);
  }
};

export async function getDb() {
  console.log("getDb", { pgClient });
  if (!pgClient) {
    pgClient = await connectToPostgres(pgClient);
  }
  return pgClient;
}
