import { UserWallet } from "../types/user.types";
import { WalletManager } from "./WalletManager";
import { Wallet as EthersWallet } from "ethers";
const { Client, Wallet } = require("@xmtp/xmtp-js");

export class XMTP {
  private userWallet: EthersWallet | undefined;

  constructor() {}

  public async initialize(userId: string, walletId: string): Promise<void> {
    const walletManager = new WalletManager();
    this.userWallet = await walletManager.getWallet(userId, walletId);
  }

  public getClientKeys = async () => {
    if (!this.userWallet?.getAddress()) {
      console.log("No address");
      return null;
    }
    const keys = await Client.getKeys(this.userWallet, {
      skipContactPublishing: true,
      persistConversations: false,
      env: "production",
    });
    return keys;
  };

  public createClient = async () => {
    let keys = await this.getClientKeys();
    if (!keys) {
      console.log("No keys");
      return undefined;
    }
    const xmtpClient = await Client.create(null, {
      privateKeyOverride: keys,
      env: "production",
    });
    return xmtpClient;
  };

  public sendXMTPMessage = async (params: {
    walletAddress: string;
    message: string;
  }): Promise<boolean> => {
    const { walletAddress, message } = params;

    if (!walletAddress) {
      console.log("No wallet address");
      return false;
    }
    const xmtp = await this.createClient();
    if (!xmtp) {
      console.log("No xmtp client");
      return false;
    }

    const conversation = await xmtp.conversations.newConversation(
      walletAddress.toLowerCase(),
      undefined
    );

    try {
      const preparedMessage = await conversation?.prepareMessage(message);
      const xmtpMessageId = await preparedMessage?.messageID();
      console.log("XMTP SENDING MESSAGE WITH ID", { xmtpMessageId });
      await preparedMessage?.send();
      return true;
    } catch (e) {
      console.log("error sending message", e);
    }

    console.log("Message not sent");
    return false;
  };
}
