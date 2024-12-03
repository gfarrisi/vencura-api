import { createNewWalletController } from "../createNewWalletController";
import { WalletManager } from "../../../classes/WalletManager";
import { getUser } from "../../../db/user";
import { getUserAndAllWallets } from "../../helpers/getUserWithAllWallets";
import { Request, Response } from "express";
import { CustomRequest } from "../../routeWrapper";

jest.mock("../../../classes/WalletManager");
jest.mock("../../../db/user");
jest.mock("../../helpers/getUserWithAllWallets");

describe("createNewWalletController", () => {
  let mockReq: Partial<CustomRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let getSignatureMock: jest.Mock;
  let createWalletMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    getSignatureMock = jest.fn().mockResolvedValue("signature");
    createWalletMock = jest.fn().mockResolvedValue({ id: "new-wallet-id" });

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockReq = {
      userId: "test-user-id",
    };

    // Setup WalletManager mock
    (WalletManager as jest.Mock).mockImplementation(() => ({
      getSignatureFromPrimaryWallet: getSignatureMock,
      createWallet: createWalletMock,
    }));

    // Suppress console.error during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    jest.restoreAllMocks();
  });

  it("should create a new wallet and return updated user", async () => {
    const mockUser = { email: "test@example.com" };
    const mockUpdatedUser = { id: "test-user-id", wallets: [] };

    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getUserAndAllWallets as jest.Mock).mockResolvedValue(mockUpdatedUser);

    await createNewWalletController(
      mockReq as CustomRequest,
      mockRes as Response
    );

    expect(getUser).toHaveBeenCalledWith(undefined, "test-user-id");
    expect(getSignatureMock).toHaveBeenCalledWith(
      "test-user-id",
      "test@example.com"
    );
    expect(createWalletMock).toHaveBeenCalledWith("test-user-id");
    expect(getUserAndAllWallets).toHaveBeenCalledWith("test-user-id");
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ updatedUser: mockUpdatedUser });
  });

  it("should return 500 if user is not found", async () => {
    (getUser as jest.Mock).mockResolvedValue(null);

    await createNewWalletController(
      mockReq as CustomRequest,
      mockRes as Response
    );

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Failed to create new wallet",
    });
  });
});
