import { getUser } from "../../db/user";
import { getAllWallets } from "../../db/wallet";
import { User } from "../../types/user.types";

export const getUserAndAllWallets = async (
  userId: string
): Promise<User | undefined> => {
  const user = await getUser(undefined, userId);
  if (!user) {
    return undefined;
  }
  const wallets = await getAllWallets(userId);
  return { ...user, wallets };
};
