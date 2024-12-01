import {
  JsonRpcProvider,
  parseEther,
  Wallet,
  ethers,
  formatEther,
} from "ethers";
import { UserWallet } from "../types/user.types";
import { WalletManager } from "../classes/WalletManager";

const providerUrl = "https://ethereum-sepolia.blockpi.network/v1/rpc/public";

export const getWalletBalance = async (address: string) => {
  const provider = new JsonRpcProvider(providerUrl);
  const balance = await provider.getBalance(address);
  return formatEther(balance);
};

export type SendTransactionResponse = {
  success: boolean;
  hash: string;
  blockNumber: number | undefined;
  gasUsed: string | undefined;
  effectiveGasPrice: string | undefined;
};

export const sendTransaction = async (
  userId: string,
  walletId: string,
  toAddress: string,
  amount: string
) => {
  try {
    const provider = new JsonRpcProvider(providerUrl);
    const walletManager = new WalletManager();
    const wallet = await walletManager.getWallet(userId, walletId);
    const connectedWallet = wallet.connect(provider); // Add this line

    console.log("sendTransaction", { wallet: connectedWallet });
    if (!connectedWallet) {
      throw new Error("Wallet not found when trying to send transaction");
    }
    // Validate address
    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    // Check if amount is valid
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new Error("Invalid amount");
    }

    // Check balance
    const balance = await provider.getBalance(connectedWallet.address);
    const amountWei = parseEther(amount);
    if (balance < amountWei) {
      throw new Error("Insufficient funds");
    }

    // Get the current gas price
    const gasPrice = await provider.getFeeData();

    // Create transaction object
    const tx = {
      to: toAddress,
      value: parseEther(amount),
      gasLimit: "21000", // Standard ETH transfer gas limit
      maxFeePerGas: gasPrice.maxFeePerGas,
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      nonce: await provider.getTransactionCount(connectedWallet.address),
      type: 2, // EIP-1559 transaction type
      chainId: 11155111, // Sepolia chain ID
    };

    // Send transaction
    const transaction = await connectedWallet.sendTransaction(tx);

    // Wait for transaction to be mined
    const receipt = await transaction.wait();

    // await db.transactions.create({
    //     walletId: userWallet.id,
    //     hash: transaction.hash,
    //     fromAddress: wallet.address,
    //     toAddress,
    //     amount: amount,
    //     status: 'completed',
    //   createdAt: Date.now(),
    // });

    return {
      success: true,
      hash: transaction.hash,
      blockNumber: receipt?.blockNumber,
      gasUsed: receipt?.gasUsed?.toString(),
      effectiveGasPrice: receipt?.gasPrice?.toString(),
    };
  } catch (error: any) {
    console.error("Transaction error:", error);
    throw new Error(error.message || "Transaction failed");
  }
};
