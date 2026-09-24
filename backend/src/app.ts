import express from "express";
import cors from "cors";
import apiRouter from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
