import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { videos, videoCollections } from "@shared/schema";
import { inArray, desc, eq } from "drizzle-orm";

const router = Router();

// Rota para obter todos os vídeos em coleções
router.get("/videos", async (req: Request, res: Response) => {
  try {
    const videosInCollections = await db
      .select()
      .from(videos)
      .where(eq(videos.inCollection, true))
      .orderBy(desc(videos.createdAt));
    
    res.json(videosInCollections);
  } catch (error: any) {
    console.error("Error getting all videos in collections:", error);
    res.status(500).json({ error: "Failed to get videos in collections", details: error.message });
  }
});

// Rota para adicionar vídeo à coleção
router.post("/:collectionId/videos/:videoId", async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.collectionId, 10);
    const videoId = parseInt(req.params.videoId, 10);
    
    if (isNaN(collectionId) || isNaN(videoId)) {
      return res.status(400).json({ error: "Invalid collection or video ID" });
    }
    
    const collection = await storage.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    const videoCollection = await storage.addVideoToCollection(videoId, collectionId);
    res.status(201).json(videoCollection);
  } catch (error: any) {
    console.error("Error adding video to collection:", error);
    res.status(500).json({ error: "Failed to add video to collection", details: error.message });
  }
});

// Rota para remover vídeo da coleção
router.delete("/:collectionId/videos/:videoId", async (req: Request, res: Response) => {
  try {
    const collectionId = parseInt(req.params.collectionId, 10);
    const videoId = parseInt(req.params.videoId, 10);
    
    if (isNaN(collectionId) || isNaN(videoId)) {
      return res.status(400).json({ error: "Invalid collection or video ID" });
    }
    
    const collection = await storage.getCollection(collectionId);
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    const video = await storage.getVideo(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    const success = await storage.removeVideoFromCollection(videoId, collectionId);
    if (!success) {
      return res.status(404).json({ error: "Video not found in collection" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error removing video from collection:", error);
    res.status(500).json({ error: "Failed to remove video from collection", details: error.message });
  }
});

export default router; 