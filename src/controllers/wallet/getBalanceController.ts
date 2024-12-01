import { Response } from "express";
import { getWallet } from "../../db/wallet";
import { getWalletBalance } from "../../utils/rpcs";
import { CustomRequest } from "../routeWrapper";

export const getBalanceController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }
    const { walletId } = req.params;
    const wallet = await getWallet(userId, walletId);
    if (!wallet) {
      throw new Error("Wallet not found when trying to get balance");
    }
    const balance = await getWalletBalance(wallet.address);
    return res.status(200).json({ balance });
  } catch (error) {
    console.error("Error getting balance:", error);
    return res.status(500).json({ error: "Failed to get balance" });
  }
};
