import { Request, Response, NextFunction, RequestHandler } from "express";

const routeWrapper = (
  handler: (req: Request, res: Response) => Promise<any>
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};

export default routeWrapper;
