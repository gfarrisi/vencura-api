import { body, validationResult } from "express-validator";
import routeWrapper, { CustomRequest } from "../controllers/routeWrapper";
import { userLoginController } from "../controllers/user/loginController";
import { Router, Request, Response } from "express";
import { createNewWalletController } from "../controllers/wallet/createNewWalletController";

const router = Router();

router.post(
  "/login",
  //   body("authToken").isString(),
  routeWrapper(userLoginController)
); //verify user, set jwt cookie

router.post("/new-wallet", routeWrapper(createNewWalletController));

export default router;
