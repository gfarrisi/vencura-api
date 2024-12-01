import { Router } from "express";
import { body, validationResult } from "express-validator";
import routeWrapper from "../controllers/routeWrapper";
import { getBalanceController } from "../controllers/wallet/getBalanceController";
import { sendTransactionController } from "../controllers/wallet/sendTransactionController";
import { getTransactionHistoryController } from "../controllers/wallet/getTransactionHistory";
import fundWalletFromOtherWalletController from "../controllers/wallet/fundWalletFromOtherWalletController";
import getSignatureFromPrimaryWalletController from "../controllers/wallet/getSignatureFromPrimaryWalletController";

const router = Router();

router.get(
  "/get-signature-from-primary-wallet",
  routeWrapper(getSignatureFromPrimaryWalletController)
);
router.get("/:walletId/balance", routeWrapper(getBalanceController));
router.get(
  "/:walletId/transaction-history",
  routeWrapper(getTransactionHistoryController)
);
router.post(
  "/:walletId/send",
  body("toAddress").isString(),
  body("amount").isString(),
  routeWrapper(sendTransactionController)
);

router.post(
  "/:walletId/fund-from-other-wallet",
  body("fromWalletId").isString(),
  body("amount").isString(),
  routeWrapper(fundWalletFromOtherWalletController)
);

export default router;
