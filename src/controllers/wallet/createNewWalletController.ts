import { Response } from "express";
import { CustomRequest } from "../routeWrapper";
import { createWallet } from "../../db/wallet";
import { WalletManager } from "../../classes/WalletManager";
import { getUser } from "../../db/user";
import { getUserAndAllWallets } from "../helpers/getUserWithAllWallets";

export const createNewWalletController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  const userId = req.userId;
  if (!userId) {
    throw new Error("User ID is required");
  }
  const walletManager = new WalletManager();
  await walletManager.createWallet(userId);
  //return new user object with wallet
  const user = await getUserAndAllWallets(userId);
  return res.status(200).json({ updatedUser: user });
};
