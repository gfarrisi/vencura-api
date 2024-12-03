import { Response } from "express";
import { CustomRequest } from "../../routeWrapper";
import { userLogoutController } from "../logoutController";

describe("userLogoutController", () => {
  let mockReq: Partial<CustomRequest>;
  let mockRes: Partial<Response>;
  let clearCookieMock: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    clearCookieMock = jest.fn();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();

    mockRes = {
      clearCookie: clearCookieMock,
      json: jsonMock,
      status: statusMock,
    };

    mockReq = {
      userId: "test-user-id",
    };

    // Suppress console.log during tests
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    jest.restoreAllMocks();
  });

  it("should successfully logout user and clear cookie", async () => {
    await userLogoutController(mockReq as CustomRequest, mockRes as Response);

    expect(clearCookieMock).toHaveBeenCalledWith("VencuraAuthToken", {
      secure: true,
      sameSite: "none",
    });
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      status: "success",
      msg: "Logged out",
    });
  });

  it("should handle missing userId", async () => {
    // Mock console.log to track the error
    const consoleSpy = jest.spyOn(console, "log");
    mockReq.userId = undefined;

    await userLogoutController(mockReq as CustomRequest, mockRes as Response);

    // Verify the error was logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      status: "error",
      msg: "Internal Server Error",
    });

    // Clean up
    consoleSpy.mockRestore();
  });

  it("should use different cookie options in development mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    await userLogoutController(mockReq as CustomRequest, mockRes as Response);

    expect(clearCookieMock).toHaveBeenCalledWith("VencuraAuthToken", {
      secure: false,
      sameSite: "lax",
    });

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
