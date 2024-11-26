import cookieParser from "cookie-parser";
import { Router } from "express";
import helmet from "helmet";
import { rateLimiterMiddleware } from "../middleware/ratelimit";
import _verify from "./verify.routes";
import _user from "./user.routes";
import _wallet from "./wallet.routes";

const router = Router();

router.use(cookieParser());
router.use(helmet());

router.use("/verify", _verify); //verify siwe signature for user, set jwt cookie
router.use("/user", _user);
router.use("/wallet", _wallet); //webhook for stripe

export default router;
