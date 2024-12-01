import { Response } from "express";
import { CustomRequest } from "../routeWrapper";
import { createWallet } from "../../db/wallet";
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

    const {
      custodialSignature,
      userSignature,
      message,
      custodialAddress,
      userAddress,
    } = req.body;

    // verify custodial signature
    const recoveredCustodialAddress = ethers.verifyMessage(
      message,
      custodialSignature
    );
    if (
      recoveredCustodialAddress.toLowerCase() !== custodialAddress.toLowerCase()
    ) {
      throw new Error("Invalid custodial signature");
    }

    // verify user browser wallet signature
    const recoveredUserAddress = ethers.verifyMessage(message, userSignature);
    if (recoveredUserAddress.toLowerCase() !== userAddress.toLowerCase()) {
      throw new Error("Invalid user signature");
    }

    const walletManager = new WalletManager();
    await walletManager.createWallet(userId);

    //-->could store the message in the db for future reference

    const user = await getUserAndAllWallets(userId);
    return res.status(200).json({ updatedUser: user });
  } catch (error) {
    console.error("Error creating new wallet:", error);
    return res.status(500).json({ error: "Failed to create new wallet" });
  }
};
