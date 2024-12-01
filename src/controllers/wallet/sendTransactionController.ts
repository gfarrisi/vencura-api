import { Response } from "express";
import { getWallet } from "../../db/wallet";
import { getWalletBalance, sendTransaction } from "../../utils/rpcs";
import { CustomRequest } from "../routeWrapper";
import { WalletManager } from "../../classes/WalletManager";

export const sendTransactionController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  const userId = req.userId;
  console.log({ userId });
  if (!userId) {
    throw new Error("User ID is required");
  }
  const { walletId } = req.params;
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount) {
    throw new Error("To address and amount are required");
  }

  try {
    const walletManager = new WalletManager();
    const txn = await walletManager.sendTransaction(
      userId,
      walletId,
      toAddress,
      amount
    );
    console.log({ txn });
    return res.status(200).json(txn);
  } catch (error: any) {
    console.error("Transaction error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Transaction failed" });
  }
};
