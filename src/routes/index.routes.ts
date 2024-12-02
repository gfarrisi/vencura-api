import cookieParser from "cookie-parser";
import { Router, Response, Request } from "express";
import helmet from "helmet";
import _user from "./user.routes";
import _wallet from "./wallet.routes";
import { authenticateToken } from "../middleware/authenticateToken";

const router = Router();
router.get("/ping", (_: Request, res: Response) => {
  res.status(200).send("pinged");
});

router.use(cookieParser());
router.use(helmet());
router.use(authenticateToken);
router.use("/user", _user);
router.use("/wallet", _wallet);

export default router;
