import { Response } from "express";
import { WalletManager } from "../../classes/WalletManager";
import { CustomRequest } from "../routeWrapper";
import { getUserAndAllWallets } from "../helpers/getUserWithAllWallets";

const fundWalletFromOtherWalletController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error(
        "User ID not found, please make sure user is authenticated."
      );
    }
    const { fromWalletId, amount } = req.body;
    const toWalletId = req.params.walletId;
    if (!fromWalletId || !amount || !toWalletId) {
      throw new Error("fromWalletId, amount, and toWalletId are required");
    }
    const walletManager = new WalletManager();
    const txn = await walletManager.fundWalletFromOtherWallet(
      userId,
      fromWalletId,
      toWalletId,
      amount
    );

    return res.status(200).json(txn);
  } catch (error: any) {
    console.error("Transaction error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Transaction failed" });
  }
};

export default fundWalletFromOtherWalletController;
