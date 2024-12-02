import { Response } from "express";
import { getWallet } from "../../db/wallet";
import { getWalletBalance, sendTransaction } from "../../utils/rpcs";
import { CustomRequest } from "../routeWrapper";
import { WalletManager } from "../../classes/WalletManager";
import { XMTP } from "../../classes/XMTP";
import { getUser } from "../../db/user";

export const sendTransactionController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  const userId = req.userId;
  if (!userId) {
    throw new Error("User ID is required");
  }
  const { walletId } = req.params;
  const { toAddress, amount } = req.body;
  if (!toAddress || !amount) {
    throw new Error("To address and amount are required");
  }

  const user = await getUser(undefined, userId);
  if (!user) {
    throw new Error("User not found");
  }

  try {
    const walletManager = new WalletManager();
    const txn = await walletManager.sendTransaction(
      userId,
      walletId,
      toAddress,
      amount
    );

    if (!txn.success) {
      throw new Error("Transaction failed");
    }

    const txnHash = txn.hash;

    //send xmtp message to the wallet who received the transaction
    const xmtp = new XMTP();
    await xmtp.initialize(userId, walletId);

    const blockScanUrl = `https://sepolia.etherscan.io/tx/${txnHash}`;
    const messageSent = await xmtp.sendXMTPMessage({
      walletAddress: toAddress,
      message: `You have received ${amount} from ${
        user.email
      } on ${new Date().toLocaleString()}. View transaction here: ${blockScanUrl}`,
    });

    if (!messageSent) {
      throw new Error("Message not sent");
    }

    return res.status(200).json({ txn });
  } catch (error: any) {
    console.error("Transaction error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Transaction failed" });
  }
};
