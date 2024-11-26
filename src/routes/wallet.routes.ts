import { Router } from "express";
import { body, validationResult } from "express-validator";
import routeWrapper from "../controllers/routeWrapper";

const router = Router();

router.get("/");

//might not need this, because i think you'll just create the new user when you verify and they dont have an account already
router.post("/", body("email").isEmail());
// router.post(
//   "/",
//   body("email").isEmail(),
//   routeWrapper(addUserAccountChangeController)
// );

export default router;
