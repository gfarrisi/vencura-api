import { body, validationResult } from "express-validator";
import routeWrapper, { CustomRequest } from "../controllers/routeWrapper";
import { userLoginController } from "../controllers/user/loginController";
import { Router, Request, Response } from "express";
import { createNewWalletController } from "../controllers/wallet/createNewWalletController";
import { userLogoutController } from "../controllers/user/logoutController";

const router = Router();

router.post(
  "/login",
  body("authToken").isString(),
  routeWrapper(userLoginController)
); //verify/setup user, set jwt cookie

router.post("/logout", routeWrapper(userLogoutController));

router.post("/new-wallet", routeWrapper(createNewWalletController));

export default router;
