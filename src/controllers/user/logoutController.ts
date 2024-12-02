import { Response } from "express";
import { CustomRequest } from "../routeWrapper";

export async function userLogoutController(
  req: CustomRequest,
  res: Response<any, Record<string, any>>
): Promise<Response<any, Record<string, any>>> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new Error(
        "User ID not found, please make sure user is authenticated."
      );
    }
    const isDevelopment = process?.env?.NODE_ENV === "production";

    res.clearCookie("VencuraAuthToken", {
      secure: isDevelopment ? false : true, // false in development mode
      sameSite: isDevelopment ? "lax" : "none", // "lax" in development mode
    });
    return res.status(200).json({ status: "success", msg: "Logged out" });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .json({ status: "error", msg: "Internal Server Error" });
  }
}
