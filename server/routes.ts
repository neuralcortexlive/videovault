import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import ffmpeg from "fluent-ffmpeg";
import os from "os";
import {
  insertCollectionSchema,
  insertDownloadTaskSchema,
  insertVideoSchema,
  type YouTubeSearchResult,
  type DownloadProgress,
  type DownloadOptions
} from "@shared/schema";
import axios from "axios";
import { randomUUID } from "crypto";

// YouTube API key
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBSNhXtWwrGPcqyHsvuZ0RlMZWjzbXE3Nk';
const DOWNLOADS_DIR = path.join(os.tmpdir(), "ytmanager-downloads");

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    
    // Send current download tasks on connection
    sendActiveDownloads(ws);
    
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Helper function to broadcast download progress to all connected clients
  function broadcastDownloadProgress(progress: DownloadProgress) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "downloadProgress",
          data: progress
        }));
      }
    });
  }

  // Helper function to send active downloads to a client
  async function sendActiveDownloads(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      const activeTasks = await storage.getActiveDownloadTasks();
      ws.send(JSON.stringify({
        type: "activeDownloads",
        data: activeTasks
      }));
    }
  }

  // YouTube Search API
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const { query, maxResults = 12, order = "date" } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      if (!YOUTUBE_API_KEY) {
        return res.status(500).json({ message: "YouTube API key not configured" });
      }

      const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          maxResults,
          q: query,
          type: "video",
          order,
          key: YOUTUBE_API_KEY
        }
      });

      return res.json(response.data);
    } catch (error) {
      console.error("YouTube search error:", error);
      if (axios.isAxiosError(error) && error.response) {
        return res.status(error.response.status).json({
          message: `YouTube API error: ${error.response.data.error?.message || 'Unknown error'}`
        });
      }
      return res.status(500).json({ message: "Failed to search YouTube videos" });
    }
  });

  // Get video details
  app.get("/api/youtube/videos/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      
      if (!YOUTUBE_API_KEY) {
        return res.status(500).json({ message: "YouTube API key not configured" });
      }

      const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params: {
          part: "snippet,contentDetails,statistics",
          id: videoId,
          key: YOUTUBE_API_KEY
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        return res.status(404).json({ message: "Video not found" });
      }

      return res.json(response.data.items[0]);
    } catch (error) {
      console.error("YouTube video details error:", error);
      return res.status(500).json({ message: "Failed to fetch video details" });
    }
  });

  // Get video formats
  app.get("/api/youtube/formats/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      
      const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
      const formats = info.formats
        .filter(format => {
          // Filter to include videos with audio or high-quality video formats
          return format.hasAudio || (format.hasVideo && format.qualityLabel);
        })
        .map(format => ({
          itag: format.itag,
          qualityLabel: format.qualityLabel,
          container: format.container,
          hasVideo: format.hasVideo,
          hasAudio: format.hasAudio,
          codecs: format.codecs,
          bitrate: format.bitrate,
          audioBitrate: format.audioBitrate
        }));

      return res.json({ formats });
    } catch (error) {
      console.error("YouTube formats error:", error);
      return res.status(500).json({ message: "Failed to fetch video formats" });
    }
  });

  // Download video
  app.post("/api/youtube/download", async (req, res) => {
    try {
      const downloadOptions = req.body as DownloadOptions;
      const validatedData = insertDownloadTaskSchema.safeParse(downloadOptions);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid download options", errors: validatedData.error });
      }

      // Get video info
      const videoInfo = await ytdl.getInfo(`https://www.youtube.com/watch?v=${downloadOptions.videoId}`);
      const videoDetails = {
        videoId: downloadOptions.videoId,
        title: videoInfo.videoDetails.title,
        format: downloadOptions.format || "mp4",
        quality: downloadOptions.quality || "highest",
        collectionId: downloadOptions.collectionId
      };

      // Create download task
      const downloadTask = await storage.createDownloadTask(videoDetails);

      // Return task immediately so client can track progress
      res.status(201).json(downloadTask);

      // Start download process asynchronously
      processVideoDownload(downloadTask.id, videoInfo);
      
    } catch (error) {
      console.error("Download error:", error);
      return res.status(500).json({ message: "Failed to start download" });
    }
  });

  // Cancel download
  app.delete("/api/youtube/download/:taskId", async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getDownloadTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Download task not found" });
      }

      await storage.updateDownloadTask(taskId, { 
        status: "failed", 
        errorMessage: "Download canceled by user",
        completedAt: new Date()
      });

      // Broadcast the update
      broadcastDownloadProgress({
        taskId,
        videoId: task.videoId,
        progress: task.progress,
        status: "failed"
      });

      return res.json({ message: "Download canceled" });
    } catch (error) {
      console.error("Cancel download error:", error);
      return res.status(500).json({ message: "Failed to cancel download" });
    }
  });

  // Collections API endpoints
  app.get("/api/collections", async (req, res) => {
    try {
      const collections = await storage.getAllCollections();
      return res.json(collections);
    } catch (error) {
      console.error("Get collections error:", error);
      return res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid collection data", errors: validatedData.error });
      }

      const collection = await storage.createCollection(validatedData.data);
      return res.status(201).json(collection);
    } catch (error) {
      console.error("Create collection error:", error);
      return res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const validatedData = insertCollectionSchema.partial().safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid collection data", errors: validatedData.error });
      }

      const updatedCollection = await storage.updateCollection(id, validatedData.data);
      return res.json(updatedCollection);
    } catch (error) {
      console.error("Update collection error:", error);
      return res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const deleted = await storage.deleteCollection(id);
      if (!deleted) {
        return res.status(404).json({ message: "Collection not found" });
      }

      return res.json({ message: "Collection deleted" });
    } catch (error) {
      console.error("Delete collection error:", error);
      return res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  app.get("/api/collections/:id/videos", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const videos = await storage.getVideoCollections(id);
      return res.json(videos);
    } catch (error) {
      console.error("Get collection videos error:", error);
      return res.status(500).json({ message: "Failed to fetch collection videos" });
    }
  });

  app.post("/api/collections/:id/videos", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const { videoId } = req.body;
      
      if (isNaN(collectionId) || !videoId) {
        return res.status(400).json({ message: "Invalid collection ID or video ID" });
      }

      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      // Check if video exists in our system, if not, create it
      let video = await storage.getVideoByYouTubeId(videoId);
      
      if (!video) {
        // Get video details from YouTube
        if (!YOUTUBE_API_KEY) {
          return res.status(500).json({ message: "YouTube API key not configured" });
        }

        const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            part: "snippet,contentDetails,statistics",
            id: videoId,
            key: YOUTUBE_API_KEY
          }
        });

        if (!response.data.items || response.data.items.length === 0) {
          return res.status(404).json({ message: "Video not found on YouTube" });
        }

        const videoData = response.data.items[0];
        
        // Insert video to our system
        const newVideo = {
          videoId: videoId,
          title: videoData.snippet.title,
          description: videoData.snippet.description,
          channelTitle: videoData.snippet.channelTitle,
          thumbnailUrl: videoData.snippet.thumbnails.high.url,
          publishedAt: videoData.snippet.publishedAt,
          duration: videoData.contentDetails.duration,
          viewCount: videoData.statistics.viewCount,
          isDownloaded: false,
          isWatched: false
        };

        const validatedData = insertVideoSchema.safeParse(newVideo);
        if (!validatedData.success) {
          return res.status(400).json({ message: "Invalid video data", errors: validatedData.error });
        }

        video = await storage.createVideo(validatedData.data);
      }

      // Add to collection
      const videoCollection = await storage.addVideoToCollection(video.id, collectionId);
      return res.status(201).json(videoCollection);
    } catch (error) {
      console.error("Add video to collection error:", error);
      return res.status(500).json({ message: "Failed to add video to collection" });
    }
  });

  app.delete("/api/collections/:collectionId/videos/:videoId", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.collectionId);
      const videoId = parseInt(req.params.videoId);
      
      if (isNaN(collectionId) || isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid collection ID or video ID" });
      }

      const deleted = await storage.removeVideoFromCollection(videoId, collectionId);
      if (!deleted) {
        return res.status(404).json({ message: "Video not found in collection" });
      }

      return res.json({ message: "Video removed from collection" });
    } catch (error) {
      console.error("Remove video from collection error:", error);
      return res.status(500).json({ message: "Failed to remove video from collection" });
    }
  });

  // Get all videos
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      return res.json(videos);
    } catch (error) {
      console.error("Get videos error:", error);
      return res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Get downloaded videos
  app.get("/api/videos/downloaded", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      const downloadedVideos = videos.filter(video => video.isDownloaded);
      return res.json(downloadedVideos);
    } catch (error) {
      console.error("Get downloaded videos error:", error);
      return res.status(500).json({ message: "Failed to fetch downloaded videos" });
    }
  });

  // Mark video as watched/unwatched
  app.put("/api/videos/:id/watched", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isWatched } = req.body;
      
      if (isNaN(id) || typeof isWatched !== 'boolean') {
        return res.status(400).json({ message: "Invalid video ID or watched status" });
      }

      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const updatedVideo = await storage.updateVideo(id, { isWatched });
      return res.json(updatedVideo);
    } catch (error) {
      console.error("Update video watched status error:", error);
      return res.status(500).json({ message: "Failed to update video watched status" });
    }
  });

  // Get active downloads
  app.get("/api/downloads/active", async (req, res) => {
    try {
      const activeTasks = await storage.getActiveDownloadTasks();
      return res.json(activeTasks);
    } catch (error) {
      console.error("Get active downloads error:", error);
      return res.status(500).json({ message: "Failed to fetch active downloads" });
    }
  });

  // Get download history
  app.get("/api/downloads/history", async (req, res) => {
    try {
      const completedTasks = await storage.getCompletedDownloadTasks();
      return res.json(completedTasks);
    } catch (error) {
      console.error("Get download history error:", error);
      return res.status(500).json({ message: "Failed to fetch download history" });
    }
  });

  // Helper function to process video download
  async function processVideoDownload(taskId: number, videoInfo: ytdl.videoInfo) {
    try {
      const task = await storage.getDownloadTask(taskId);
      if (!task) {
        console.error(`Task ${taskId} not found`);
        return;
      }

      // Update task to downloading status
      await storage.updateDownloadTask(taskId, { status: "downloading" });
      
      // Broadcast status update
      broadcastDownloadProgress({
        taskId,
        videoId: task.videoId,
        progress: 0,
        status: "downloading"
      });

      const videoId = task.videoId;
      const fileName = `${videoId}-${randomUUID()}`;
      const videoFilePath = path.join(DOWNLOADS_DIR, `${fileName}-video.mp4`);
      const audioFilePath = path.join(DOWNLOADS_DIR, `${fileName}-audio.mp4`);
      const outputFilePath = path.join(DOWNLOADS_DIR, `${fileName}.mp4`);

      // Select formats
      const videoFormat = ytdl.chooseFormat(videoInfo.formats, { 
        quality: task.quality === "highest" ? "highestvideo" : task.quality
      });
      
      const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: "highestaudio" });

      if (!videoFormat || !audioFormat) {
        throw new Error("Could not find suitable video or audio format");
      }

      // Download video stream
      const videoStream = ytdl.downloadFromInfo(videoInfo, { format: videoFormat });
      const videoWriter = fs.createWriteStream(videoFilePath);

      let videoProgress = 0;
      let audioProgress = 0;
      let totalProgress = 0;
      
      videoStream.on("progress", (chunkLength, downloaded, total) => {
        videoProgress = downloaded / total;
        totalProgress = (videoProgress + audioProgress) / 2 * 100;
        
        storage.updateDownloadProgress(taskId, {
          taskId,
          videoId,
          progress: Math.round(totalProgress),
          status: "downloading",
          size: {
            total,
            transferred: downloaded,
            totalMb: (total / 1024 / 1024).toFixed(2) + " MB",
            transferredMb: (downloaded / 1024 / 1024).toFixed(2) + " MB"
          }
        });

        // Broadcast progress
        broadcastDownloadProgress({
          taskId,
          videoId,
          progress: Math.round(totalProgress),
          status: "downloading",
          speed: `${(chunkLength / 1024 / 1024).toFixed(2)} MB/s`,
          eta: "calculating...",
          size: {
            total,
            transferred: downloaded,
            totalMb: (total / 1024 / 1024).toFixed(2),
            transferredMb: (downloaded / 1024 / 1024).toFixed(2)
          }
        });
      });

      await pipeline(videoStream, videoWriter);

      // Download audio stream
      const audioStream = ytdl.downloadFromInfo(videoInfo, { format: audioFormat });
      const audioWriter = fs.createWriteStream(audioFilePath);

      audioStream.on("progress", (chunkLength, downloaded, total) => {
        audioProgress = downloaded / total;
        totalProgress = (videoProgress + audioProgress) / 2 * 100;
        
        storage.updateDownloadProgress(taskId, {
          taskId,
          videoId,
          progress: Math.round(totalProgress),
          status: "downloading"
        });

        // Broadcast progress
        broadcastDownloadProgress({
          taskId,
          videoId,
          progress: Math.round(totalProgress),
          status: "downloading",
          speed: `${(chunkLength / 1024 / 1024).toFixed(2)} MB/s`,
          eta: "calculating..."
        });
      });

      await pipeline(audioStream, audioWriter);

      // Update status to merging
      await storage.updateDownloadTask(taskId, { 
        status: "downloading", 
        progress: 95
      });
      
      // Broadcast merging status
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 95,
        status: "downloading"
      });

      // Merge video and audio using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(videoFilePath)
          .input(audioFilePath)
          .outputOptions(["-c:v copy", "-c:a aac"])
          .output(outputFilePath)
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .run();
      });

      // Get file size
      const stats = fs.statSync(outputFilePath);
      const fileSize = stats.size;

      // Create/update video record
      let video = await storage.getVideoByYouTubeId(videoId);
      
      if (video) {
        await storage.updateVideo(video.id, {
          isDownloaded: true,
          downloadPath: outputFilePath,
          fileSize,
          quality: task.quality,
          format: task.format,
          downloadedAt: new Date()
        });
      } else {
        // Create video record if it doesn't exist yet
        const videoData = {
          videoId,
          title: task.title,
          isDownloaded: true,
          downloadPath: outputFilePath,
          fileSize,
          quality: task.quality,
          format: task.format,
          downloadedAt: new Date()
        };
        
        video = await storage.createVideo(videoData);
      }

      // If a collection was specified, add video to that collection
      if (task.collectionId) {
        await storage.addVideoToCollection(video.id, task.collectionId);
      }

      // Update task to completed
      await storage.updateDownloadTask(taskId, {
        status: "completed",
        progress: 100,
        fileSize
      });

      // Broadcast completion
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 100,
        status: "completed"
      });

      // Clean up temporary files
      fs.unlink(videoFilePath, (err) => {
        if (err) console.error(`Error deleting temporary video file: ${err.message}`);
      });
      
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error(`Error deleting temporary audio file: ${err.message}`);
      });

    } catch (error) {
      console.error(`Error processing download task ${taskId}:`, error);
      
      // Update task with error
      await storage.updateDownloadTask(taskId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      // Broadcast error
      const task = await storage.getDownloadTask(taskId);
      if (task) {
        broadcastDownloadProgress({
          taskId,
          videoId: task.videoId,
          progress: task.progress,
          status: "failed"
        });
      }
    }
  }

  return httpServer;
}
