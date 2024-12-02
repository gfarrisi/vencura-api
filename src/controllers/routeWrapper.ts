import { NextFunction, Request, Response } from "express";
export interface CustomRequest extends Request {
  userId?: string;
}

interface CustomError extends Error {
  status?: number;
  data?: object;
}

const routeWrapper = (routeHandler: any): any => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      return await routeHandler(req, res, next);
    } catch (error: any) {
      // Log detailed information about the request that caused the error
      console.error(
        `Error occurred at ${req.method} ${req.originalUrl}:`,
        error
      );
      const customError: CustomError = new Error(
        error?.message || "An unexpected error occurred"
      );
      customError.status = 500;
      customError.data = {
        ...req.params,
        method: req.method,
        endpoint: req.originalUrl,
        msg: error?.message || "An unexpected error occurred",
        status: "error",
      };
      // error is thrown to the error handler middleware
      throw customError;
    }
  };
};

export default routeWrapper;
