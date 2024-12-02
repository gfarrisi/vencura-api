import { formatEther, JsonRpcProvider } from "ethers";
import { WalletManager } from "../../classes/WalletManager";
import { getWallet } from "../../db/wallet";
import { CustomRequest } from "../routeWrapper";
import { Response } from "express";

const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const SEPOLIA_ETHERSCAN_API = "https://api-sepolia.etherscan.io";

export interface EtherscanTransaction {
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  txreceipt_status: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
}

export interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTransaction[];
}

const getTxnsFromEtherscan = async (
  address: string
): Promise<EtherscanResponse> => {
  const url = `${SEPOLIA_ETHERSCAN_API}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${etherscanApiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log({ data, address });
  return data;
};

export type TransactionHistory = {
  toAddress: string;
  fromAddress: string;
  amount: string;
  timestamp: string;
  txnHash: string;
};

export const getTransactionHistoryController = async (
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> => {
  const userId = req.userId;
  if (!userId) {
    throw new Error(
      "User ID not found, please make sure user is authenticated."
    );
  }
  const { walletId } = req.params;
  const wallet = await getWallet(userId, walletId);
  if (!wallet) {
    throw new Error("Wallet not found when trying to get transaction history");
  }
  const txns = await getTxnsFromEtherscan(wallet.address);
  const txnHistory: TransactionHistory[] = txns.result.map(
    (txn: EtherscanTransaction) => ({
      toAddress: txn.to,
      fromAddress: txn.from,
      amount: parseFloat(formatEther(txn.value)).toFixed(4),
      timestamp: txn.timeStamp,
      txnHash: txn.hash,
    })
  );
  //order by most recent timestamp
  const sortedTxnHistory = txnHistory.sort(
    (a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)
  );
  return res.status(200).json({ transactions: sortedTxnHistory });
};
