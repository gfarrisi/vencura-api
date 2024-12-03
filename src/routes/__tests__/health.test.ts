import request from "supertest";
import express from "express";
import router from "../index.routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();
app.use(helmet());
app.use(cookieParser());
app.use("/", router);

describe("Index Routes", () => {
  describe("GET /ping", () => {
    it('should return 200 and "pinged"', async () => {
      const response = await request(app).get("/ping");
      expect(response.status).toBe(200);
      expect(response.text).toBe("pinged");
    });
  });

  describe("Middleware Setup", () => {
    it("should have security headers (helmet)", async () => {
      const response = await request(app).get("/ping");
      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers).toHaveProperty("x-xss-protection");
    });
  });
});
