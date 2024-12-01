export type User = {
  id: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  wallets: Pick<
    UserWallet,
    "id" | "userId" | "address" | "createdAt" | "updatedAt"
  >[];
};

export type UserWallet = {
  id: string;
  userId: string;
  address: string;
  encryptedPrivateKey: string;
  encryptionIv: string;
  isPrimaryWallet: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Transaction = {
  id: string;
  walletId: string;
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};
