import { Response } from "express";
import { CustomRequest } from "../routeWrapper";
import { createWallet, getPrimaryWallet } from "../../db/wallet";
import { WalletManager } from "../../classes/WalletManager";
import { getUser } from "../../db/user";
import { getUserAndAllWallets } from "../helpers/getUserWithAllWallets";
import { ethers } from "ethers";

export const createNewWalletController = async (
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

    //get the signature from the primary wallet to verify before creating the new wallet
    const email = user.email;
    const walletManager = new WalletManager();
    const signingData = await walletManager.getSignatureFromPrimaryWallet(
      userId,
      email
    );
    if (!signingData) {
      throw new Error("Failed to get signature");
    }

    const newWallet = await walletManager.createWallet(userId);
    if (!newWallet) {
      throw new Error("Failed to create new wallet");
    }
    const updatedUser = await getUserAndAllWallets(userId);
    return res.status(200).json({ updatedUser });
  } catch (error: any) {
    console.error("Error creating new wallet:", error);
    return res.status(500).json({
      error: "Failed to create new wallet server error",
      msg: error.message,
    });
  }
};
