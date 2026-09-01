import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

import { prisma } from "./prisma.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up", uptime: process.uptime() });
    } catch {
      res.status(503).json({ status: "degraded", database: "down" });
    }
  });

  return app;
}
