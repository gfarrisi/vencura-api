import { User } from "../types/user.types";
import { connectToPostgres, getDb } from "./postgres";

export const getUser = async (
  email?: string,
  userId?: string
): Promise<User | undefined> => {
  if (!email && !userId) {
    return undefined;
  }
  try {
    const db = await getDb();
    let query = `
      SELECT id, email, created_at, updated_at
      FROM vencura.users
      WHERE email = $1 OR id = $2
    `;
    const result = await db.query<User>(query, [email, userId]);
    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw "Error getting user: " + e;
  }
};

export const createUser = async (email: string): Promise<User | undefined> => {
  const db = await getDb();
  const query = `
    INSERT INTO vencura.users (email)
    VALUES ($1)
    RETURNING id, email, created_at, updated_at
  `;
  const result = await db.query<User>(query, [email]);
  return result.rows[0];
};
