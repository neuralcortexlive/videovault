import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { searchYouTubeVideos, getVideoDetails } from "./youtube";
import { YtDlpDownloader, FfmpegProcessor } from "./ytdlp";
import { InsertDownload } from "@shared/schema";
import path from "path";
import fs from "fs";


// Define a map to track active downloads
const activeDownloads = new Map();

// Define a persistent download directory
const downloadsDir = path.join(process.cwd(), "downloads");
console.log("Download directory path:", downloadsDir);
if (!fs.existsSync(downloadsDir)) {
  console.log("Creating download directory...");
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Set yt-dlp and ffmpeg paths
process.env.YTDLP_PATH = "/opt/anaconda3/bin/yt-dlp";
process.env.FFMPEG_PATH = "/usr/local/bin/ffmpeg";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Config routes
  app.get("/api/config", async (req: Request, res: Response) => {
    try {
      const config = await storage.getApiConfig();
      res.json({
        youtubeApiKey: config?.youtubeApiKey || process.env.YOUTUBE_API_KEY || "",
      });
    } catch (error) {
      console.error("Error fetching API config:", error);
      res.status(500).json({ error: "Failed to fetch API configuration" });
    }
  });

  app.post("/api/config", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        youtubeApiKey: z.string().min(1),
      });

      const validatedData = schema.parse(req.body);
      const config = await storage.saveApiConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error saving API config:", error);
      res.status(400).json({ error: "Invalid API configuration" });
    }
  });

  // YouTube search routes
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const pageToken = req.query.pageToken as string | undefined;
      const maxResults = parseInt(req.query.maxResults as string || "25", 10);

      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      // Get API key from database or environment variable or use hardcoded key
      const config = await storage.getApiConfig();
      const apiKey = config?.youtubeApiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBotvakfTmSC-f3m4RSLsMjnc83GB6xMs8";

      if (!apiKey) {
        return res.status(400).json({ error: "YouTube API key is not configured" });
      }

      const results = await searchYouTubeVideos(query, apiKey, maxResults, pageToken);
      res.json(results);
    } catch (error: any) {
      console.error("Error searching YouTube:", error);
      res.status(500).json({ error: "Failed to search YouTube videos", details: error.message });
    }
  });

  app.get("/api/videos/:videoId", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;

      // First check if we already have this video in our database
      const storedVideo = await storage.getVideoByVideoId(videoId);
      if (storedVideo) {
        return res.json(storedVideo);
      }

      // Otherwise fetch from YouTube API
      const config = await storage.getApiConfig();
      const apiKey = config?.youtubeApiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBotvakfTmSC-f3m4RSLsMjnc83GB6xMs8";

      if (!apiKey) {
        return res.status(400).json({ error: "YouTube API key is not configured" });
      }

      const videoDetails = await getVideoDetails(videoId, apiKey);
      res.json(videoDetails);
    } catch (error: any) {
      console.error("Error fetching video details:", error);
      res.status(500).json({ error: "Failed to fetch video details", details: error.message });
    }
  });

  // Download routes
  app.post("/api/downloads", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        videoId: z.string().min(1),
        format: z.string().optional(),
        quality: z.string().optional(),
        audioOnly: z.boolean().optional(),
        saveMetadata: z.boolean().optional(),
      });

      const validatedData = schema.parse(req.body);
      const { videoId, format, quality, audioOnly, saveMetadata } = validatedData;

      // Check if download is already in progress
      const existingDownload = await storage.getDownloadByVideoId(videoId);
      if (existingDownload && existingDownload.status === "downloading") {
        return res.status(409).json({ 
          error: "Download already in progress", 
          downloadId: existingDownload.id 
        });
      }

      // Fetch video details first
      const config = await storage.getApiConfig();
      const apiKey = config?.youtubeApiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBotvakfTmSC-f3m4RSLsMjnc83GB6xMs8";

      if (!apiKey) {
        return res.status(400).json({ error: "YouTube API key is not configured" });
      }

      // Get or create the video in our database
      let video = await storage.getVideoByVideoId(videoId);
      if (!video) {
        const videoDetails = await getVideoDetails(videoId, apiKey);
        video = await storage.createVideo({
          videoId,
          title: videoDetails.title,
          channelTitle: videoDetails.channelTitle,
          description: videoDetails.description || "",
          thumbnail: videoDetails.thumbnail,
          duration: videoDetails.duration,
          publishedAt: new Date(videoDetails.publishedAt),
          viewCount: videoDetails.viewCount,
          likeCount: videoDetails.likeCount,
          downloaded: false,
          metadata: videoDetails,
          format: format || "mp4",
          quality: quality || "best",
        });
      }

      // Create a download record
      const download = await storage.createDownload({
        videoId,
        status: "pending",
        progress: 0,
        format: format || "mp4",
      });

      // Set up the downloader in a non-blocking way
      process.nextTick(async () => {
        try {
          // Update status to downloading
          await storage.updateDownload(download.id, { status: "downloading" });

          const outputFormat = audioOnly ? "m4a" : "mp4";
          
          // Usar o título do vídeo como nome do arquivo, removendo caracteres inválidos
          const safeTitle = video.title.replace(/[^\w\s\-\.]/g, "").replace(/\s+/g, "_");
          const filename = `${safeTitle}.${outputFormat}`;
          const filepath = path.join(downloadsDir, filename);

          // Verificar se o diretório de downloads existe
          if (!fs.existsSync(downloadsDir)) {
            console.log(`[download] Creating downloads directory: ${downloadsDir}`);
            fs.mkdirSync(downloadsDir, { recursive: true });
          }

          // Create downloader
          const downloader = new YtDlpDownloader(videoId, {
            output: filepath,
            audioOnly: audioOnly,
            format: determineYtDlpFormat(format, quality, audioOnly),
            metadata: saveMetadata,
          });

          // Store the downloader reference for potential cancellation
          activeDownloads.set(download.id, downloader);

          // Listen for progress updates
          downloader.on("progress", async (progress) => {
            await storage.updateDownload(download.id, {
              progress: Math.round(progress.percent),
              totalSize: progress.totalBytes,
              downloadedSize: progress.downloadedBytes,
            });
          });

          // Start download
          let outputPath;
          try {
            outputPath = await downloader.download();
          } catch (downloadError: any) {
            console.error("Download error:", downloadError.message);
            await storage.updateDownload(download.id, {
              status: "failed",
              error: downloadError.message,
            });
            activeDownloads.delete(download.id);
            return; // Encerrar o processo para evitar erro se o download falhar
          }

          // Process with ffmpeg if needed
          if (!audioOnly && format === "mp4") {
            try {
              const processor = new FfmpegProcessor();
              const processedPath = path.join(downloadsDir, `${videoId}_processed.mp4`);
              
              await processor.processVideo(outputPath, processedPath, [
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
              ]);
              
              // Replace the original file with the processed one
              fs.renameSync(processedPath, outputPath);
            } catch (ffmpegError: any) {
              console.error("FFmpeg processing error:", ffmpegError.message);
              // Não falhar o download se o ffmpeg falhar, apenas logar o erro
            }
          }

          // Update download and video records
          const fileStats = fs.statSync(outputPath);
          await storage.updateDownload(download.id, {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            totalSize: fileStats.size,
            downloadedSize: fileStats.size,
          });

          await storage.updateVideo(video.id, {
            downloaded: true,
            downloadedAt: new Date(),
            filepath: outputPath,
            filesize: fileStats.size,
          });

          // Clean up
          activeDownloads.delete(download.id);
        } catch (error: any) {
          console.error("Download error:", error);
          await storage.updateDownload(download.id, {
            status: "failed",
            error: error.message,
          });
          activeDownloads.delete(download.id);
        }
      });

      res.status(201).json(download);
    } catch (error: any) {
      console.error("Error starting download:", error);
      res.status(500).json({ error: "Failed to start download", details: error.message });
    }
  });

  app.get("/api/downloads", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "10", 10);
      const offset = parseInt(req.query.offset as string || "0", 10);
      const downloads = await storage.listDownloads(limit, offset);
      res.json(downloads);
    } catch (error: any) {
      console.error("Error listing downloads:", error);
      res.status(500).json({ error: "Failed to list downloads", details: error.message });
    }
  });

  app.get("/api/downloads/active", async (req: Request, res: Response) => {
    try {
      const downloads = await storage.listInProgressDownloads();
      res.json(downloads);
    } catch (error: any) {
      console.error("Error listing active downloads:", error);
      res.status(500).json({ error: "Failed to list active downloads", details: error.message });
    }
  });

  app.delete("/api/downloads/:id", async (req: Request, res: Response) => {
    try {
      const downloadId = parseInt(req.params.id, 10);
      const download = await storage.getDownload(downloadId);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }

      // If download is in progress, abort it
      if (download.status === "downloading" && activeDownloads.has(downloadId)) {
        const downloader = activeDownloads.get(downloadId);
        downloader.abort();
        activeDownloads.delete(downloadId);
      }

      // Update the download status
      await storage.updateDownload(downloadId, { status: "cancelled" });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error cancelling download:", error);
      res.status(500).json({ error: "Failed to cancel download", details: error.message });
    }
  });
  
  // Rota para limpar todos os downloads (botão "Clear")
  app.delete("/api/downloads/all", async (req: Request, res: Response) => {
    try {
      // Primeiro cancela todos os downloads ativos
      const activeDownloadsList = await storage.listInProgressDownloads();
      
      for (const download of activeDownloadsList) {
        const downloader = activeDownloads.get(download.id);
        if (downloader) {
          downloader.abort();
          activeDownloads.delete(download.id);
        }
        await storage.updateDownload(download.id, { status: "cancelled" });
      }
      
      // Então exclui todos os downloads do banco de dados
      await storage.deleteAllDownloads();
      
      // Limpa o mapa de downloads ativos
      activeDownloads.clear();
      
      res.json({ success: true, message: "Histórico de downloads limpo com sucesso" });
    } catch (error: any) {
      console.error("Erro ao limpar histórico de downloads:", error);
      res.status(500).json({ 
        error: "Falha ao limpar histórico de downloads", 
        details: error.message 
      });
    }
  });

  // Video Library routes
  app.get("/api/library", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "10", 10);
      const offset = parseInt(req.query.offset as string || "0", 10);
      const videos = await storage.listVideos(limit, offset);
      res.json(videos);
    } catch (error: any) {
      console.error("Error listing videos:", error);
      res.status(500).json({ error: "Failed to list videos", details: error.message });
    }
  });

  app.get("/api/library/:id", async (req: Request, res: Response) => {
    try {
      const videoId = parseInt(req.params.id, 10);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json(video);
    } catch (error: any) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video", details: error.message });
    }
  });
  
  // Rotas para coleções
  app.get("/api/collections", async (req: Request, res: Response) => {
    try {
      const collections = await storage.listCollections();
      res.json(collections);
    } catch (error: any) {
      console.error("Error listing collections:", error);
      res.status(500).json({ error: "Failed to list collections", details: error.message });
    }
  });
  
  app.post("/api/collections", async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Collection name is required" });
      }
      
      const collection = await storage.createCollection({ 
        name, 
        description: description || null 
      });
      
      res.status(201).json(collection);
    } catch (error: any) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection", details: error.message });
    }
  });
  
  app.put("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }
      
      const { name, description } = req.body;
      const updates: any = {};
      
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      updates.updatedAt = new Date();
      
      const collection = await storage.updateCollection(id, updates);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error: any) {
      console.error("Error updating collection:", error);
      res.status(500).json({ error: "Failed to update collection", details: error.message });
    }
  });
  
  app.delete("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }
      
      const success = await storage.deleteCollection(id);
      if (!success) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection", details: error.message });
    }
  });
  
  app.get("/api/collections/:id/videos", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }
      
      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      const videos = await storage.getVideosInCollection(id);
      res.json(videos);
    } catch (error: any) {
      console.error("Error getting videos in collection:", error);
      res.status(500).json({ error: "Failed to get videos in collection", details: error.message });
    }
  });
  
  app.post("/api/collections/:collectionId/videos/:videoId", async (req: Request, res: Response) => {
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
  
  app.delete("/api/collections/:collectionId/videos/:videoId", async (req: Request, res: Response) => {
    try {
      const collectionId = parseInt(req.params.collectionId, 10);
      const videoId = parseInt(req.params.videoId, 10);
      
      if (isNaN(collectionId) || isNaN(videoId)) {
        return res.status(400).json({ error: "Invalid collection or video ID" });
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

  // Video streaming route
  app.get("/api/stream/:videoId", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      
      // Buscar o vídeo no banco de dados para obter o caminho do arquivo
      const video = await storage.getVideoByVideoId(videoId);
      if (!video || !video.filepath) {
        return res.status(404).json({ error: "Video file not found" });
      }
      
      const videoPath = video.filepath;
      
      if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: "Video file not found" });
      }
      
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });
        
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
        });
        
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (error: any) {
      console.error("Error streaming video:", error);
      res.status(500).json({ error: "Failed to stream video", details: error.message });
    }
  });
  
  // Quality Presets endpoints
  app.get("/api/quality-presets", async (req: Request, res: Response) => {
    try {
      const presets = await storage.listQualityPresets();
      res.json(presets);
    } catch (error: any) {
      console.error("Error listing quality presets:", error);
      res.status(500).json({ error: "Failed to list quality presets", details: error.message });
    }
  });

  app.get("/api/quality-presets/default", async (req: Request, res: Response) => {
    try {
      const preset = await storage.getDefaultQualityPreset();
      if (!preset) {
        return res.status(404).json({ error: "No default quality preset found" });
      }
      res.json(preset);
    } catch (error: any) {
      console.error("Error getting default quality preset:", error);
      res.status(500).json({ error: "Failed to get default quality preset", details: error.message });
    }
  });

  app.get("/api/quality-presets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const preset = await storage.getQualityPreset(id);
      if (!preset) {
        return res.status(404).json({ error: "Quality preset not found" });
      }
      res.json(preset);
    } catch (error: any) {
      console.error("Error getting quality preset:", error);
      res.status(500).json({ error: "Failed to get quality preset", details: error.message });
    }
  });

  app.post("/api/quality-presets", async (req: Request, res: Response) => {
    try {
      const preset = req.body;
      const newPreset = await storage.createQualityPreset(preset);
      res.status(201).json(newPreset);
    } catch (error: any) {
      console.error("Error creating quality preset:", error);
      res.status(400).json({ error: "Failed to create quality preset", details: error.message });
    }
  });

  app.put("/api/quality-presets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const presetUpdate = req.body;
      const updatedPreset = await storage.updateQualityPreset(id, presetUpdate);
      
      if (!updatedPreset) {
        return res.status(404).json({ error: "Quality preset not found" });
      }
      
      res.json(updatedPreset);
    } catch (error: any) {
      console.error("Error updating quality preset:", error);
      res.status(400).json({ error: "Failed to update quality preset", details: error.message });
    }
  });

  app.delete("/api/quality-presets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteQualityPreset(id);
      
      if (!success) {
        return res.status(404).json({ error: "Quality preset not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting quality preset:", error);
      res.status(500).json({ error: "Failed to delete quality preset", details: error.message });
    }
  });

  app.post("/api/quality-presets/:id/set-default", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.setDefaultQualityPreset(id);
      
      if (!success) {
        return res.status(404).json({ error: "Quality preset not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error setting default quality preset:", error);
      res.status(500).json({ error: "Failed to set default quality preset", details: error.message });
    }
  });

  // Batch Download endpoints
  app.get("/api/batch-downloads", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "10", 10);
      const offset = parseInt(req.query.offset as string || "0", 10);
      const batches = await storage.listBatchDownloads(limit, offset);
      res.json(batches);
    } catch (error: any) {
      console.error("Error listing batch downloads:", error);
      res.status(500).json({ error: "Failed to list batch downloads", details: error.message });
    }
  });

  app.get("/api/batch-downloads/active", async (req: Request, res: Response) => {
    try {
      const batches = await storage.listActiveBatchDownloads();
      res.json(batches);
    } catch (error: any) {
      console.error("Error listing active batch downloads:", error);
      res.status(500).json({ error: "Failed to list active batch downloads", details: error.message });
    }
  });

  app.get("/api/batch-downloads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const batch = await storage.getBatchDownload(id);
      
      if (!batch) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      res.json(batch);
    } catch (error: any) {
      console.error("Error getting batch download:", error);
      res.status(500).json({ error: "Failed to get batch download", details: error.message });
    }
  });

  app.post("/api/batch-downloads", async (req: Request, res: Response) => {
    try {
      const batch = req.body;
      const newBatch = await storage.createBatchDownload(batch);
      res.status(201).json(newBatch);
    } catch (error: any) {
      console.error("Error creating batch download:", error);
      res.status(400).json({ error: "Failed to create batch download", details: error.message });
    }
  });

  app.put("/api/batch-downloads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const batchUpdate = req.body;
      const updatedBatch = await storage.updateBatchDownload(id, batchUpdate);
      
      if (!updatedBatch) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      res.json(updatedBatch);
    } catch (error: any) {
      console.error("Error updating batch download:", error);
      res.status(400).json({ error: "Failed to update batch download", details: error.message });
    }
  });

  app.delete("/api/batch-downloads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteBatchDownload(id);
      
      if (!success) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting batch download:", error);
      res.status(500).json({ error: "Failed to delete batch download", details: error.message });
    }
  });

  // Batch Download Items endpoints
  app.get("/api/batch-downloads/:batchId/items", async (req: Request, res: Response) => {
    try {
      const batchId = parseInt(req.params.batchId, 10);
      const batch = await storage.getBatchDownload(batchId);
      
      if (!batch) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      const items = await storage.getBatchDownloadItems(batchId);
      res.json(items);
    } catch (error: any) {
      console.error("Error listing batch download items:", error);
      res.status(500).json({ error: "Failed to list batch download items", details: error.message });
    }
  });

  app.post("/api/batch-downloads/:batchId/items", async (req: Request, res: Response) => {
    try {
      const batchId = parseInt(req.params.batchId, 10);
      const batch = await storage.getBatchDownload(batchId);
      
      if (!batch) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      const item = {
        ...req.body,
        batchId
      };
      
      const newItem = await storage.createBatchDownloadItem(item);
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Error creating batch download item:", error);
      res.status(400).json({ error: "Failed to create batch download item", details: error.message });
    }
  });

  app.put("/api/batch-downloads/items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const itemUpdate = req.body;
      const updatedItem = await storage.updateBatchDownloadItem(id, itemUpdate);
      
      if (!updatedItem) {
        return res.status(404).json({ error: "Batch download item not found" });
      }
      
      res.json(updatedItem);
    } catch (error: any) {
      console.error("Error updating batch download item:", error);
      res.status(400).json({ error: "Failed to update batch download item", details: error.message });
    }
  });

  app.delete("/api/batch-downloads/items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteBatchDownloadItem(id);
      
      if (!success) {
        return res.status(404).json({ error: "Batch download item not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting batch download item:", error);
      res.status(500).json({ error: "Failed to delete batch download item", details: error.message });
    }
  });

  // Start batch download process
  app.post("/api/batch-downloads/:id/start", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const batch = await storage.getBatchDownload(id);
      
      if (!batch) {
        return res.status(404).json({ error: "Batch download not found" });
      }
      
      if (batch.status !== 'pending') {
        return res.status(400).json({ error: "Batch download is already in progress or completed" });
      }
      
      // Update batch status to in-progress
      await storage.updateBatchDownload(id, { status: 'in-progress' });
      
      // Get batch items
      const items = await storage.getBatchDownloadItems(id);
      
      if (items.length === 0) {
        return res.status(400).json({ error: "Batch download has no items" });
      }
      
      // Get quality preset if specified
      let preset = null;
      if (batch.qualityPresetId) {
        preset = await storage.getQualityPreset(batch.qualityPresetId);
      }
      
      if (!preset) {
        preset = await storage.getDefaultQualityPreset();
      }
      
      // Queue items for download
      // We'll process the first item immediately and return 
      // The rest will be processed in the background
      
      // Prepare download options based on preset
      const downloadOptions: any = {
        format: preset?.format || 'mp4',
        videoQuality: preset?.videoQuality || 'best',
        audioQuality: preset?.audioQuality || 'best',
        audioOnly: preset?.audioOnly || false,
        videoOnly: preset?.videoOnly || false,
        extractSubtitles: preset?.extractSubtitles || false
      };
      
      // Start the first download
      if (items.length > 0) {
        const firstItem = items[0];
        
        // Create download entry for this item
        const download: InsertDownload = {
          videoId: firstItem.videoId,
          status: 'pending',
          format: downloadOptions.format
        };
        
        const newDownload = await storage.createDownload(download);
        
        // Update batch item with download ID
        await storage.updateBatchDownloadItem(firstItem.id, {
          downloadId: newDownload.id,
          status: 'in-progress'
        });
        
        // Respond that batch processing has started
        res.json({
          success: true,
          message: "Batch download started",
          batchId: id,
          totalItems: items.length,
          firstDownloadId: newDownload.id
        });
        
        // Start batch processing in background
        processBatch(id).catch(err => {
          console.error(`Background batch processing error for batch ${id}:`, err);
        });
        
      } else {
        res.status(400).json({ error: "No items to process in batch" });
      }
      
    } catch (error: any) {
      console.error("Error starting batch download:", error);
      res.status(500).json({ error: "Failed to start batch download", details: error.message });
    }
  });

  // Rota para limpar apenas vídeos baixados do histórico
  app.delete("/api/library/clear-downloaded", async (req: Request, res: Response) => {
    try {
      await storage.deleteDownloadedVideos();
      res.json({ success: true, message: "Histórico de vídeos baixados limpo com sucesso." });
    } catch (error: any) {
      console.error("Erro ao limpar histórico de vídeos baixados:", error);
      res.status(500).json({ error: "Falha ao limpar histórico de vídeos baixados", details: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Process batch download items sequentially
async function processBatch(batchId: number): Promise<void> {
  console.log(`Starting batch process for batch ID ${batchId}`);
  
  try {
    // Get batch details
    const batch = await storage.getBatchDownload(batchId);
    if (!batch) {
      console.error(`Batch ${batchId} not found`);
      return;
    }
    
    // Update batch status to in-progress
    await storage.updateBatchDownload(batchId, { status: "in-progress" });
    
    // Get batch items
    const items = await storage.getBatchDownloadItems(batchId);
    
    // Get quality preset if specified
    let preset: any = null;
    if (batch.qualityPresetId) {
      preset = await storage.getQualityPreset(batch.qualityPresetId);
    } else {
      preset = await storage.getDefaultQualityPreset();
    }
    
    // Process each item sequentially
    for (const item of items) {
      console.log(`Processing batch item ${item.id} (${item.title})`);
      
      try {
        // Update item status to in-progress
        await storage.updateBatchDownloadItem(item.id, { status: "in-progress" });
        
        // Check if video exists in database
        let video = await storage.getVideoByVideoId(item.videoId);
        
        // If video doesn't exist, create it
        if (!video) {
          // Get video details from YouTube
          try {
            const config = await storage.getApiConfig();
            const apiKey = config?.youtubeApiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBotvakfTmSC-f3m4RSLsMjnc83GB6xMs8";
            const videoDetails = await getVideoDetails(item.videoId, apiKey);
            video = await storage.createVideo({
              videoId: item.videoId,
              title: videoDetails.title,
              channelTitle: videoDetails.channelTitle,
              description: videoDetails.description,
              thumbnail: videoDetails.thumbnail,
              duration: videoDetails.duration,
              publishedAt: new Date(videoDetails.publishedAt),
              viewCount: videoDetails.viewCount,
              likeCount: videoDetails.likeCount,
              downloaded: false
            });
          } catch (error: any) {
            console.error(`Failed to get details for video ${item.videoId}:`, error);
            await storage.updateBatchDownloadItem(item.id, { 
              status: "failed", 
              error: `Failed to get video details: ${error.message || "Unknown error"}` 
            });
            continue;
          }
        }
        
        // Create a download entry
        const download = await storage.createDownload({
          videoId: item.videoId,
          status: "pending",
          format: preset?.format || "mp4"
        });
        
        // Update batch item with download ID
        await storage.updateBatchDownloadItem(item.id, { downloadId: download.id });
        
        // Start download
        const ytDlpOptions: any = {
          output: `${downloadsDir}/${video.title.replace(/[/\\?%*:|"<>]/g, '-')}.%(ext)s`,
          format: determineYtDlpFormat(
            preset?.format || "mp4", 
            preset?.videoQuality || "720p",
            preset?.audioOnly || false
          ),
          subtitles: preset?.extractSubtitles || false,
          audioOnly: preset?.audioOnly || false,
          videoOnly: preset?.videoOnly || false,
          quality: preset?.videoQuality || "720p",
          metadata: true
        };
        
        const downloader = new YtDlpDownloader(item.videoId, ytDlpOptions);
        
        // Setup progress event handler
        downloader.on("progress", async (progress: any) => {
          await storage.updateDownload(download.id, {
            progress: progress.percent,
            downloadedSize: progress.downloadedBytes,
            totalSize: progress.totalBytes,
            status: "downloading"
          });
        });
        
        // Download the video
        try {
          const outputPath = await downloader.download();
          
          // Update video record
          await storage.updateVideo(video.id, {
            downloaded: true,
            downloadedAt: new Date(),
            filepath: outputPath,
            filesize: fs.statSync(outputPath).size
          });
          
          // Update download record
          await storage.updateDownload(download.id, {
            status: "completed",
            completedAt: new Date()
          });
          
          // Update batch item
          await storage.updateBatchDownloadItem(item.id, { status: "completed" });
          
        } catch (error: any) {
          console.error(`Failed to download video ${item.videoId}:`, error);
          
          // Update download record
          await storage.updateDownload(download.id, {
            status: "failed",
            error: error.message || "Unknown error"
          });
          
          // Update batch item
          await storage.updateBatchDownloadItem(item.id, { 
            status: "failed", 
            error: `Download failed: ${error.message || "Unknown error"}` 
          });
        }
        
      } catch (error: any) {
        console.error(`Error processing batch item ${item.id}:`, error);
        await storage.updateBatchDownloadItem(item.id, { 
          status: "failed", 
          error: `Processing error: ${error.message || "Unknown error"}` 
        });
      }
    }
    
    // Update batch progress (will automatically set status based on item statuses)
    await storage.updateBatchDownloadProgress(batchId);
    
    console.log(`Batch ${batchId} processing completed`);
    
  } catch (error: any) {
    console.error(`Error processing batch ${batchId}:`, error);
    
    // Update batch status to failed
    try {
      await storage.updateBatchDownload(batchId, { 
        status: "failed", 
        completedAt: new Date() 
      });
    } catch (updateError) {
      console.error(`Failed to update batch ${batchId} status:`, updateError);
    }
  }
}

// Helper function to determine the best format for yt-dlp
function determineYtDlpFormat(format?: string, quality?: string, audioOnly?: boolean): string {
  if (audioOnly) {
    return "bestaudio[ext=m4a]/bestaudio";
  }
  
  if (format === "mp4") {
    if (quality === "1080p") {
      return "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best";
    } else if (quality === "720p") {
      return "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best";
    } else if (quality === "480p") {
      return "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best";
    }
  }
  
  // Default to best format
  return "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
}
