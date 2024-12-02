import crypto from "crypto";
import { config } from "dotenv";
import jwt, { sign } from "jsonwebtoken";
import { createUser, getUser } from "../../db/user";
import { User, UserWallet } from "../../types/user.types";
import { validationResult } from "express-validator";
import { Request, Response } from "express";
import { WalletManager } from "../../classes/WalletManager";
import { getAllWallets } from "../../db/wallet";
import { CustomRequest } from "../routeWrapper";
config();

export function validateAccessToken(
  userId: string,
  userEmail?: string,
  userWallets?: Pick<
    UserWallet,
    "id" | "userId" | "address" | "createdAt" | "updatedAt"
  >[]
) {
  if (!process.env.SECRET_TOKEN) {
    throw new Error("SECRET_TOKEN is not defined");
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

async function setUpUser(email: string): Promise<User> {
  const newUser = await createUser(email);
  if (!newUser) {
    throw new Error("User could not be created");
  }
  const walletManager = new WalletManager();
  const { newWallet } = await walletManager.createWallet(newUser.id);
  if (!newWallet) {
    throw new Error("Wallet could not be created");
  }
  return {
    ...newUser,
    wallets: [newWallet],
  };
}

async function setUpWallet(userId: string): Promise<UserWallet> {
  const walletManager = new WalletManager();
  const { newWallet } = await walletManager.createWallet(userId, true);
  if (!newWallet) {
    throw new Error("Wallet could not be created");
  }
  return newWallet;
}

export async function verifyUser(
  authToken: string
): Promise<{ token: string; user: User | undefined } | undefined> {
  const publicKey = process.env.DYNAMIC_PUBLIC_KEY_BASE64
    ? Buffer.from(process.env.DYNAMIC_PUBLIC_KEY_BASE64, "base64").toString(
        "ascii"
      )
    : "";
  try {
    const data: JWTSessionData = await verifyAsync(authToken, publicKey);
    const email = data.verified_credentials.filter(
      (x) => x.format === "email"
    )[0]?.email;
    const existingUser = await getUser(email);
    let user: User | undefined;
    //if user does not exist this means it is a new user and we should create their account
    if (!existingUser && email) {
      const newUser = await setUpUser(email);
      //todo: this is where i create their custodial wallet
      if (!newUser || "error" in newUser) {
        throw new Error(
          "User could not be created: " +
            (newUser && "error" in newUser ? newUser?.error : "")
        );
      }
      user = newUser;
    } else {
      if (existingUser) {
        let wallets = await getAllWallets(existingUser.id);
        if (wallets.length === 0) {
          const newWallet = await setUpWallet(existingUser.id);
          wallets.push(newWallet);
        }
        user = { ...existingUser, wallets };
      }
    }

    if (!!user?.id) {
      const token = validateAccessToken(user.id, email, user.wallets);
      return { token, user };
    } else {
      throw new Error("User not found or could not be verified");
    }
  } catch (e) {
    console.log(e);
    throw new Error("User authorization could not be verified");
  }
}

export async function userLoginController(
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> {
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
    return res
      .status(200)
      .json({ status: "Authorized", user: verifiedUser.user });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ status: "Internal Server Error" });
  }
}
