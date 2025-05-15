import { Express } from "express";
import { createServer } from "http";
import videoRoutes from "./videos";
import downloadRoutes from "./downloads";
import configRoutes from "./config";
import collectionRoutes from "./collections";
import qualityPresetRoutes from "./quality-presets";
import batchDownloadRoutes from "./batch-downloads";
import databaseRoutes from "./database";

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Registrar todas as rotas
  app.use("/api/videos", videoRoutes);
  app.use("/api/downloads", downloadRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use("/api/quality-presets", qualityPresetRoutes);
  app.use("/api/batch-downloads", batchDownloadRoutes);
  app.use("/api/database", databaseRoutes);

  return server;
} 