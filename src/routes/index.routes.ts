import cookieParser from "cookie-parser";
import { Router } from "express";
import helmet from "helmet";
import { rateLimiterMiddleware } from "../middleware/ratelimit";
import _user from "./user.routes";
import _wallet from "./wallet.routes";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();

router.use(cookieParser());
router.use(helmet());
router.use(authenticateToken);
router.use("/user", _user);
router.use("/wallet", _wallet);

export default router;
