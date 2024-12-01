import { NextFunction, Response } from "express";
import { CustomRequest } from "../controllers/routeWrapper";
import jwt from "jsonwebtoken";

export function authenticateToken(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  console.log("🟢 Authenticate Token", req.originalUrl);
  const token = req.cookies["VencuraAuthToken"];
  console.log("VencuraAuthToken cookie", !!req.cookies["VencuraAuthToken"]);

  if (token) {
    jwt.verify(
      token,
      process.env.SECRET_TOKEN as string,
      async (err: any, user: any) => {
        console.log({ err, user });
        if (err && err?.name === "TokenExpiredError") {
          return res.status(403).json({ status: "Token expired" });
        }
        if (err) return res.status(403).json({ status: "Token invalid" });

        req.userId = user.userId;
      }
    );
  }
  next();
}
