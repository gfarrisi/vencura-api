import { Response } from "express";
import { CustomRequest } from "../routeWrapper";
import { WalletManager } from "../../classes/WalletManager";
import { getUser } from "../../db/user";

const getSignatureFromPrimaryWalletController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await getUser(undefined, userId);
    if (!user) {
      throw new Error("User not found");
    }
    const email = user.email;
    const walletManager = new WalletManager();
    const signingData = await walletManager.getSignatureFromPrimaryWallet(
      userId,
      email
    );

    return res.status(200).json(signingData);
  } catch (error) {
    console.error("Error getting signature:", error);
    return res.status(500).json({ error: "Failed to get signature" });
  }
};

export default getSignatureFromPrimaryWalletController;
