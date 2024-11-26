import { body, validationResult } from "express-validator";
import routeWrapper from "../controllers/routeWrapper";
import { userLoginController } from "../controllers/user/loginController";
import { Router, Request, Response } from "express";

const router = Router();

router.post(
  "/login",
  //   body("authToken").isString(),
  routeWrapper(userLoginController)
);

router.get("/", (req: any, res: any) => {
  return res.status(200).send("pinged");
});

//might not need this, because i think you'll just create the new user when you verify and they dont have an account already
router.post("/", body("email").isEmail());
// router.post(
//   "/",
//   body("email").isEmail(),
//   routeWrapper(addUserAccountChangeController)
// );

export default router;
