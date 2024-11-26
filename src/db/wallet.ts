import { Wallet } from "../types/user.types";
import { getDb } from "./postgres";

export const getWallet = async (
  userId: string,
  walletId: string
): Promise<Wallet | undefined> => {
  try {
    const db = await getDb();
    const query = `
    SELECT id, user_id, address, encrypted_private_key as encryptedKey, encryption_iv as encryptionIv, created_at, updated_at
    FROM vencura.wallets
    WHERE id = $1 AND user_id = $2 AND is_active = true
  `;
    const result = await db.query<Wallet>(query, [walletId, userId]);
    if (result.rows.length === 0) {
      throw new Error("Wallet not found");
    }
    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw "Error getting wallet: " + e;
  }
};

export const createWallet = async (
  userId: string,
  address: string,
  encryptedKey: string,
  encryptionIv: string
): Promise<Wallet | undefined> => {
  const db = await getDb();
  const query = `
    INSERT INTO vencura.wallets (user_id, address, encrypted_private_key, encryption_iv)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, address, encrypted_private_key as encryptedKey, encryption_iv as encryptionIv, created_at, updated_at
    `;

  const result = await db.query<Wallet>(query, [
    userId,
    address,
    encryptedKey,
    encryptionIv,
  ]);
  return result.rows[0];
};
