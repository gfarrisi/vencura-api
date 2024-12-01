import {
  formatEther,
  isAddress,
  JsonRpcProvider,
  parseEther,
  Wallet,
} from "ethers";
import * as crypto from "crypto";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { createWallet, getPrimaryWallet, getWallet } from "../db/wallet";
import { UserWallet } from "../types/user.types";

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

interface WalletSecret {
  "vencura-master-key": string;
}

export class WalletManager {
  private readonly algorithm = "aes-256-gcm";
  private masterKey: Buffer | null = null;
  private readonly secretsManager: SecretsManagerClient;

  constructor() {
    this.secretsManager = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) return this.masterKey;

    const command = new GetSecretValueCommand({
      SecretId: process.env.MASTER_KEY_SECRET_NAME,
    });

    const response = await this.secretsManager.send(command);
    const secret: WalletSecret = JSON.parse(response.SecretString!);
    console.log({ secret });
    this.masterKey = Buffer.from(secret["vencura-master-key"], "hex");
    return this.masterKey;
  }

  async createWallet(
    userId: string,
    isPrimaryWallet: boolean = false
  ): Promise<{ newWallet: UserWallet }> {
    const masterKey = await this.getMasterKey();
    const wallet = Wallet.createRandom();
    const iv = crypto.randomBytes(16);
    const encrypted = this.encryptPrivateKey(wallet.privateKey, masterKey, iv);
    const walletData = await createWallet(
      userId,
      wallet.address,
      encrypted,
      iv.toString("hex"),
      isPrimaryWallet
    );
    if (!walletData) {
      throw new Error("Wallet could not be created");
    }

    return {
      newWallet: walletData,
    };
  }

  private encryptPrivateKey(
    privateKey: string,
    masterKey: Buffer,
    iv: Buffer
  ): string {
    const cipher = crypto.createCipheriv(this.algorithm, masterKey, iv);

    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Return only the encrypted data and auth tag (IV is stored separately)
    return Buffer.concat([Buffer.from(encrypted, "hex"), authTag]).toString(
      "base64"
    );
  }

  private decryptPrivateKey(
    encryptedData: string,
    masterKey: Buffer,
    iv: string | Buffer
  ): string {
    let ivBuffer: Buffer;

    if (Buffer.isBuffer(iv)) {
      // If it's the 32-byte buffer from the database, convert it to the actual 16-byte IV
      const hexString = iv.toString("utf8"); // Convert buffer to hex string
      ivBuffer = Buffer.from(hexString, "hex"); // Convert hex to final buffer
    } else {
      ivBuffer = Buffer.from(iv, "hex");
    }

    console.log("IV debugging:", {
      originalLength: iv.length,
      finalLength: ivBuffer.length,
      finalIV: ivBuffer.toString("hex"),
    });

    const data = Buffer.from(encryptedData, "base64");
    const encryptedKey = data.slice(0, -16);
    const authTag = data.slice(-16);

    console.log({ data, encryptedKey, authTag });

    try {
      console.log("IV Buffer:", ivBuffer.toString("hex"));
      console.log("Master Key:", masterKey.toString("hex"));
      console.log("Encrypted Data Length:", encryptedKey.length);
      console.log("Auth Tag Length:", authTag.length);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        masterKey,
        ivBuffer
      );
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedKey),
        decipher.final(),
      ]);
      console.log({ decrypted });
      return decrypted.toString("utf8");
    } catch (e) {
      console.error("Decryption error details:", {
        originalIV: iv,
        decodedIVLength: ivBuffer.length,
        decodedIV: ivBuffer.toString("hex"),
        masterKeyLength: masterKey.length,
        encryptedKeyLength: encryptedKey.length,
        authTagLength: authTag.length,
      });
      throw e;
    }
  }

  async getWallet(userId: string, walletId: string): Promise<Wallet> {
    const masterKey = await this.getMasterKey();

    const wallet = await getWallet(userId, walletId);
    console.log("getWallet", { wallet });

    if (!wallet) {
      throw new Error("Wallet not found in wallet manager");
    }
    // const { encryptedPrivateKey, encryptionIv } = wallet;

    // Decrypt the private key using the stored IV
    const privateKey = this.decryptPrivateKey(
      wallet.encryptedPrivateKey,
      masterKey,
      Buffer.from(wallet.encryptionIv, "hex")
    );
    console.log({ privateKey });

    return new Wallet(privateKey);
  }

  async sendTransaction(
    userId: string,
    walletId: string,
    toAddress: string,
    amount: string
  ) {
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
      if (!isAddress(toAddress)) {
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
  }

  async fundWalletFromOtherWallet(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
    amount: string
  ): Promise<SendTransactionResponse> {
    const fromWallet = await getWallet(userId, fromWalletId);
    if (!fromWallet) {
      throw new Error("Source wallet not found");
    }
    const toWallet = await getWallet(userId, toWalletId);
    if (!toWallet) {
      throw new Error("Destination wallet not found");
    }

    return this.sendTransaction(userId, fromWalletId, toWallet.address, amount);
  }

  async getSignatureFromPrimaryWallet(
    userId: string,
    userEmail: string
  ): Promise<{ signature: string; message: string; custodialAddress: string }> {
    const primaryWallet = await getPrimaryWallet(userId);
    if (!primaryWallet) {
      throw new Error("Primary wallet not found");
    }
    const wallet = await this.getWallet(userId, primaryWallet.id);
    const message = `Authorize new wallet creation for account ${userEmail} at timestamp ${Date.now()} using primary wallet ${
      primaryWallet.address
    }`;

    const signature = await wallet.signMessage(message);
    return { signature, message, custodialAddress: primaryWallet.address };
  }
}
