import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { NextFunction, Request, Response, Router } from "express";
import { postgress } from "./middleware/postgres";
import _api from "./routes/index.routes";

config();

const app = express();

export const ENABLE_SENTRY_LOGGING =
  process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN_EXPRESS;

postgress();
const port = process.env.PORT || 3004;

app.use((req, res, next) => {
  bodyParser.json({ limit: "100mb" })(req, res, next);
});

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/", _api);

const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`)
);
server.timeout = 120000;
