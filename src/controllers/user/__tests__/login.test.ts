// import request from "supertest";
// import express from "express";
// import { userLoginController, verifyUser } from "../loginController";
// import routeWrapper from "../../routeWrapper";
// // import { mockUser } from "./mocks/mockData";

// // Mock dependencies
// jest.mock("jsonwebtoken");
// jest.mock("../../../db/user");
// jest.mock("../../../db/wallet");
// jest.mock("../../../classes/WalletManager");

// const app = express();
// app.use(express.json());
// app.post("/login", routeWrapper(userLoginController));

// // Sample mock data
// const mockAuthToken = "valid.jwt.token";
// const mockJwtPayload = {
//   verified_credentials: [{ format: "email", email: "test@example.com" }],
//   // Add other required JWTSessionData fields
// };

// const mockUser = {
//   id: "test-user-id",
//   email: "test@example.com",
// };

// const mockCookieOptions = {
//   expires: expect.any(Date),
//   httpOnly: false,
//   secure: false,
//   sameSite: "lax",
// };

// describe("User Login Controller", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//     process.env.NODE_ENV = "development";
//   });

//   it("should handle successful login for existing user", async () => {
//     console.time("login-test");

//     console.time("mock-setup");
//     const mockVerifiedResponse = {
//       token: "new.auth.token",
//       user: mockUser,
//     };
//     jest
//       .spyOn(require("../loginController"), "verifyUser")
//       .mockResolvedValueOnce(mockVerifiedResponse);
//     console.timeEnd("mock-setup");

//     console.time("request");
//     const response = await request(app)
//       .post("/login")
//       .send({ authToken: mockAuthToken });
//     console.timeEnd("request");

//     console.time("assertions");
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({
//       status: "Authorized",
//       user: mockUser,
//     });
//     expect(response.headers["set-cookie"][0]).toContain("VencuraAuthToken");
//     console.timeEnd("assertions");

//     console.timeEnd("login-test");
//   });

//   it("should handle unauthorized access", async () => {
//     jest
//       .spyOn(require("../loginController"), "verifyUser")
//       .mockResolvedValueOnce(undefined);

//     const response = await request(app)
//       .post("/login")
//       .send({ authToken: mockAuthToken });

//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({ status: "Unauthorized" });
//   });

//   it("should create new user account on first login", async () => {
//     const newUserResponse = {
//       token: "new.user.token",
//       user: { ...mockUser, id: "new-user-id" },
//     };

//     jest
//       .spyOn(require("../loginController"), "verifyUser")
//       .mockResolvedValueOnce(newUserResponse);

//     const response = await request(app)
//       .post("/login")
//       .send({ authToken: mockAuthToken });

//     expect(response.status).toBe(200);
//     expect(response.body.user.id).toBe("new-user-id");
//   });

//   it("should handle validation errors", async () => {
//     const response = await request(app).post("/login").send({});

//     expect(response.status).toBe(400);
//     expect(response.body).toHaveProperty("errors");
//   });

//   it("should handle internal errors", async () => {
//     jest
//       .spyOn(require("../loginController"), "verifyUser")
//       .mockRejectedValueOnce(new Error("Internal error"));

//     const response = await request(app)
//       .post("/login")
//       .send({ authToken: mockAuthToken });

//     expect(response.status).toBe(500);
//     expect(response.body).toEqual({ status: "Internal Server Error" });
//   });
// });

import request from "supertest";
import express from "express";
import router from "../../../routes/index.routes";
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
