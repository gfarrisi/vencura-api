export type User = {
  id: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  wallets: Wallet[];
};

export type Wallet = {
  id: string;
  address: string;
  encryptedPrivateKey: string;
  encryptionIv: string;
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
