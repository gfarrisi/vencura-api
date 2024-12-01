import { UserWallet } from "../types/user.types";
import { getDb } from "./postgres";

export const getWallet = async (
  userId: string,
  walletId: string
): Promise<UserWallet | undefined> => {
  try {
    const db = await getDb();
    const query = `
    SELECT id, user_id as "userId", address, encrypted_private_key as "encryptedPrivateKey", encryption_iv as "encryptionIv", is_primary_wallet as "isPrimaryWallet", created_at as "createdAt", updated_at as "updatedAt"
    FROM vencura.wallets
    WHERE id = $1 AND user_id = $2 AND is_active = true 
  `;
    const result = await db.query<UserWallet>(query, [walletId, userId]);
    if (result.rows.length === 0) {
      throw new Error("Wallet not found when trying to get wallet from db");
    }
    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw "Error getting wallet: " + e;
  }
};

export const getPrimaryWallet = async (
  userId: string
): Promise<UserWallet | undefined> => {
  try {
    const db = await getDb();
    const query = `
    SELECT id, user_id as "userId", address, encrypted_private_key as "encryptedPrivateKey", encryption_iv as "encryptionIv", is_primary_wallet as "isPrimaryWallet", created_at as "createdAt", updated_at as "updatedAt"
    FROM vencura.wallets
    WHERE user_id = $1 AND is_primary_wallet = true AND is_active = true
  `;
    const result = await db.query<UserWallet>(query, [userId]);
    if (result.rows.length === 0) {
      return undefined;
    }
    return result.rows[0];
  } catch (e) {
    console.error(e);
    throw "Error getting primary wallet: " + e;
  }
};

export const getAllWallets = async (
  userId: string
): Promise<
  Pick<
    UserWallet,
    "id" | "userId" | "address" | "isPrimaryWallet" | "createdAt" | "updatedAt"
  >[]
> => {
  try {
    const db = await getDb();
    const query = `
      SELECT id, user_id as userId, address, is_primary_wallet as isPrimaryWallet, created_at as createdAt, updated_at as updatedAt
      FROM vencura.wallets
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await db.query<
      Pick<
        UserWallet,
        | "id"
        | "userId"
        | "address"
        | "isPrimaryWallet"
        | "createdAt"
        | "updatedAt"
      >
    >(query, [userId]);
    if (result.rows.length === 0) {
      return [];
    }
    return result.rows;
  } catch (e) {
    console.error(e);
    throw "Error getting wallet: " + e;
  }
};

export const createWallet = async (
  userId: string,
  address: string,
  encryptedKey: string,
  encryptionIv: string,
  isPrimaryWallet: boolean
): Promise<UserWallet | undefined> => {
  const db = await getDb();
  const query = `
    INSERT INTO vencura.wallets (user_id, address, encrypted_private_key, encryption_iv, is_primary_wallet)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, address, encrypted_private_key as encryptedKey, encryption_iv as encryptionIv, created_at, updated_at
    `;

  const result = await db.query<UserWallet>(query, [
    userId,
    address,
    encryptedKey,
    encryptionIv,
    isPrimaryWallet,
  ]);
  return result.rows[0];
};
