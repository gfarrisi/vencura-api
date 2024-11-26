import { Wallet } from "ethers";
import * as crypto from "crypto";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { createWallet, getWallet } from "../db/wallet";

interface WalletSecret {
  masterKey: string;
}

export class WalletManager {
  private readonly algorithm = "aes-256-gcm";
  private masterKey: Buffer | null = null;
  private readonly secretsManager: SecretsManagerClient;

  constructor() {
    this.secretsManager = new SecretsManagerClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  private async getMasterKey(): Promise<Buffer> {
    if (this.masterKey) return this.masterKey;

    const command = new GetSecretValueCommand({
      SecretId: process.env.MASTER_KEY_SECRET_NAME,
    });

    const response = await this.secretsManager.send(command);
    const secret: WalletSecret = JSON.parse(response.SecretString!);
    this.masterKey = Buffer.from(secret.masterKey, "hex");
    return this.masterKey;
  }

  async createWallet(userId: string): Promise<{ address: string }> {
    const masterKey = await this.getMasterKey();
    const wallet = Wallet.createRandom();
    const iv = crypto.randomBytes(16);
    const encrypted = this.encryptPrivateKey(wallet.privateKey, masterKey, iv);

    const walletData = await createWallet(
      userId,
      wallet.address,
      encrypted,
      iv.toString("hex")
    );
    if (!walletData) {
      throw new Error("Wallet could not be created");
    }

    return {
      address: walletData.address,
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
    iv: Buffer
  ): string {
    const data = Buffer.from(encryptedData, "base64");

    // Split encrypted data and auth tag
    const encryptedKey = data.slice(0, -16);
    const authTag = data.slice(-16);

    const decipher = crypto.createDecipheriv(this.algorithm, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedKey);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }

  async getWallet(userId: string, walletId: string): Promise<Wallet> {
    const masterKey = await this.getMasterKey();

    const wallet = await getWallet(userId, walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    const { encryptedPrivateKey, encryptionIv } = wallet;

    // Decrypt the private key using the stored IV
    const privateKey = this.decryptPrivateKey(
      encryptedPrivateKey,
      masterKey,
      Buffer.from(encryptionIv, "hex")
    );

    return new Wallet(privateKey);
  }
}
