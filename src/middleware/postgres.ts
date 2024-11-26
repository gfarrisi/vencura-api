import { config } from "dotenv";
import { Request, Response } from "express";
import { Pool } from "pg";
import { INIT_SCRIPT } from "../db/createTable";
import { connectToPostgres } from "../db/postgres";
config();

let pgClient: Pool;

export const postgress = async function (req?: Request, res?: Response) {
  try {
    console.log("🟢 Connecting to postgres");
    pgClient = await connectToPostgres(pgClient);
    const res = (await pgClient.query(INIT_SCRIPT)) as any;
    console.log({ res });
    console.log({ pgClient });
    console.log("🟢 CONNECTED TO POSTGRESS");
  } catch (e) {
    console.error(e);
    throw e;
  }
};
