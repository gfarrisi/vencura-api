import crypto from "crypto";
import { config } from "dotenv";
import jwt, { sign } from "jsonwebtoken";
import { createUser, getUser } from "../../db/user";
import { User, Wallet } from "../../types/user.types";
import { validationResult } from "express-validator";
import { Request, Response } from "express";
import { WalletManager } from "../../classes/WalletManager";
import { getWalletConfig } from "../../utils/walletConfig";
config();

export function validateAccessToken(
  userId: string,
  userEmail?: string,
  userWallets?: Wallet[]
) {
  if (!process.env.SECRET_TOKEN) {
    throw new Error("TOP_SECRET_TOKEN is not defined");
  }
  return sign({ userId, userEmail, userWallets }, process.env.SECRET_TOKEN, {
    expiresIn: `${60 * 60 * 24 * 60}s`, //60 day expiration
  });
}
interface NameService {
  name: string;
}

interface VerifiedCredential {
  address?: string;
  chain: string;
  id: string;
  name_service: NameService;
  public_identifier: string;
  wallet_name: string;
  wallet_provider: string;
  format: "email" | "blockchain";
  email: string;
  embedded_wallet_id?: string | null;
}

interface JWTSessionData {
  kid: string;
  aud: string;
  iss: string;
  sub: string;
  sid: string;
  environment_id: string;
  lists: any[]; // if the type of list items is known, replace any with that type
  missing_fields: any[]; // same as above, replace any if the type is known
  scope: string;
  verified_credentials: VerifiedCredential[];
  last_verified_credential_id: string;
  first_visit: string;
  last_visit: string;
  new_user: boolean;
  iat: number;
  exp: number;
}

function verifyAsync(
  token: string,
  secretOrPublicKey: string
): Promise<JWTSessionData> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err: any, decoded: any) => {
      console.log({ err, decoded });
      if (err) {
        return reject(err);
      }
      if (!decoded) {
        return reject(new Error("No payload decoded"));
      }
      resolve(decoded as JWTSessionData);
    });
  });
}

async function setUpUser(email: string) {
  const newUser = await createUser(email);
  if (!newUser) {
    throw new Error("User could not be created");
  }
  const config = getWalletConfig();
  if (!config.ENCRYPTION_KEY || !config.ENCRYPTION_IV) {
    throw new Error("Wallet config not found");
  }
  const walletManager = new WalletManager({
    ENCRYPTION_KEY: config.ENCRYPTION_KEY,
    ENCRYPTION_IV: config.ENCRYPTION_IV,
  });
  await walletManager.createWallet(newUser.id);
}

export async function verifyUser(
  authToken: string
): Promise<{ token: string } | undefined> {
  const publicKey = process.env.DYNAMIC_PUBLIC_KEY_BASE64
    ? Buffer.from(process.env.DYNAMIC_PUBLIC_KEY_BASE64, "base64").toString(
        "ascii"
      )
    : "";
  try {
    const data: JWTSessionData = await verifyAsync(authToken, publicKey);
    console.log({ data });
    const email = data.verified_credentials.filter(
      (x) => x.format === "email"
    )[0]?.email;
    const existingUser = await getUser(email);
    console.log({ existingUser });
    let user: User | undefined;
    //if user does not exist this means it is a new user and we should create their account
    if (!existingUser && email) {
      const newUser = await createUser(email);
      //todo: this is where i create their custodial wallet
      if (!newUser || "error" in newUser) {
        throw new Error(
          "User could not be created: " +
            (newUser && "error" in newUser ? newUser?.error : "")
        );
      }
      console.log({ newUser });
      user = newUser;
    } else {
      user = existingUser;
    }

    if (!!user?.id) {
      const token = validateAccessToken(user.id, email);
      return { token };
    } else {
      throw new Error("User not found or could not be verified");
    }
  } catch (e) {
    console.log(e);
    throw new Error("User authorization could not be verified");
  }
}

export async function userLoginController(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { authToken } = req.body;
    const verifiedUser = await verifyUser(authToken);
    console.log({ verifiedUser });
    if (!verifiedUser || !verifiedUser.token) {
      return res.status(200).json({ status: "Unauthorized" });
    }

    const { token } = verifiedUser;
    const isDevelopment = process?.env?.NODE_ENV === "development";
    res.cookie("VencuraAuthToken", token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      httpOnly: isDevelopment ? false : true,
      secure: isDevelopment ? false : true, //needs to be set to false for localhost
      sameSite: isDevelopment ? "lax" : "strict", //should be set to "strict" for prod and "none" for localhost
    });
    return res.status(200).json({ status: "Authorized" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ status: "Internal Server Error" });
  }
}
