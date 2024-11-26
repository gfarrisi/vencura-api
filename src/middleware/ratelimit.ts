import { NextFunction, Request, Response } from "express";

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //   const redisClient = await initializeRedis();
  //   const rateLimiter = new RateLimiterRedis({
  //     storeClient: redisClient,
  //     points: 20, // 20 requests
  //     duration: 1, // per 1 second by IP,
  //   });
  //   const ipAddress = requestIp.getClientIp(req) || "";
  //   console.log("ip address", ipAddress);
  //   rateLimiter
  //     .consume(ipAddress)
  //     .then(() => next())
  //     .catch(() =>
  //       res.status(429).send("Too Many Requests. Please try again in a bit.")
  //     );
};
