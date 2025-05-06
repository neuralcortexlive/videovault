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

// YouTube API key - use environment variable only
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
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
      console.log(`Starting download process for task ${taskId}, video: ${videoInfo.videoDetails.title}`);
      
      const task = await storage.getDownloadTask(taskId);
      if (!task) {
        console.error(`Task ${taskId} not found`);
        return;
      }

      // Update task to downloading status with initial status
      await storage.updateDownloadTask(taskId, { 
        status: "downloading",
        progress: 0,
        errorMessage: null
      });
      
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
      
      console.log(`Output files: 
      Video: ${videoFilePath}
      Audio: ${audioFilePath}
      Final: ${outputFilePath}`);

      // Select formats - add better error handling
      let videoFormat: ytdl.videoFormat;
      let audioFormat: ytdl.videoFormat;
      
      try {
        videoFormat = ytdl.chooseFormat(videoInfo.formats, { 
          quality: task.quality === "highest" ? "highestvideo" : task.quality || "highest"
        });
        
        audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: "highestaudio" });
        
        console.log(`Selected video format: ${videoFormat.qualityLabel || videoFormat.quality}, ${videoFormat.container}`);
        console.log(`Selected audio format: ${audioFormat.audioBitrate}kbps, ${audioFormat.container}`);
      } catch (formatError) {
        console.error("Format selection error:", formatError);
        throw new Error(`Could not select video/audio formats: ${formatError.message}`);
      }

      if (!videoFormat || !audioFormat) {
        throw new Error("Could not find suitable video or audio format");
      }

      // Download video stream with better error handling
      const videoStream = ytdl.downloadFromInfo(videoInfo, { format: videoFormat });
      const videoWriter = fs.createWriteStream(videoFilePath);

      let videoProgress = 0;
      let audioProgress = 0;
      let totalProgress = 0;
      let lastProgressUpdate = 0;
      
      videoStream.on("progress", (chunkLength, downloaded, total) => {
        // Only update on significant changes (every 1%) to reduce DB writes
        const progress = Math.round((downloaded / total) * 100);
        
        if (progress <= lastProgressUpdate && progress < 100) return;
        lastProgressUpdate = progress;
        
        videoProgress = downloaded / total;
        totalProgress = (videoProgress + audioProgress) / 2 * 100;
        
        console.log(`Video download progress: ${Math.round(videoProgress * 100)}%, Total: ${Math.round(totalProgress)}%`);
        
        // Update database every 2%
        if (Math.round(totalProgress) % 2 === 0 || Math.round(totalProgress) === 100) {
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
          }).catch(err => {
            console.error("Failed to update download progress in DB:", err);
          });
        }

        // Always broadcast progress for real-time updates
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

      videoStream.on("error", (err) => {
        console.error(`Video stream error for task ${taskId}:`, err);
        throw new Error(`Video download failed: ${err.message}`);
      });

      try {
        await pipeline(videoStream, videoWriter);
        console.log("Video download complete");
      } catch (videoError) {
        console.error("Video pipeline error:", videoError);
        throw new Error(`Video download failed: ${videoError.message}`);
      }

      // Download audio stream
      const audioStream = ytdl.downloadFromInfo(videoInfo, { format: audioFormat });
      const audioWriter = fs.createWriteStream(audioFilePath);
      
      lastProgressUpdate = 0;
      
      audioStream.on("progress", (chunkLength, downloaded, total) => {
        // Only update on significant changes
        const progress = Math.round((downloaded / total) * 100);
        
        if (progress <= lastProgressUpdate && progress < 100) return;
        lastProgressUpdate = progress;
        
        audioProgress = downloaded / total;
        totalProgress = (videoProgress + audioProgress) / 2 * 100;
        
        console.log(`Audio download progress: ${Math.round(audioProgress * 100)}%, Total: ${Math.round(totalProgress)}%`);
        
        // Update database every 2%
        if (Math.round(totalProgress) % 2 === 0 || Math.round(totalProgress) === 100) {
          storage.updateDownloadProgress(taskId, {
            taskId,
            videoId,
            progress: Math.round(totalProgress),
            status: "downloading"
          }).catch(err => {
            console.error("Failed to update download progress in DB:", err);
          });
        }

        // Always broadcast progress
        broadcastDownloadProgress({
          taskId,
          videoId,
          progress: Math.round(totalProgress),
          status: "downloading",
          speed: `${(chunkLength / 1024 / 1024).toFixed(2)} MB/s`,
          eta: "calculating..."
        });
      });

      audioStream.on("error", (err) => {
        console.error(`Audio stream error for task ${taskId}:`, err);
        throw new Error(`Audio download failed: ${err.message}`);
      });

      try {
        await pipeline(audioStream, audioWriter);
        console.log("Audio download complete");
      } catch (audioError) {
        console.error("Audio pipeline error:", audioError);
        throw new Error(`Audio download failed: ${audioError.message}`);
      }

      // Update status to merging
      console.log("Starting merge process");
      await storage.updateDownloadTask(taskId, { 
        status: "processing", 
        progress: 95
      });
      
      // Broadcast merging status
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 95,
        status: "processing"
      });

      // Merge video and audio using ffmpeg
      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(videoFilePath)
            .input(audioFilePath)
            .outputOptions(["-c:v copy", "-c:a aac"])
            .output(outputFilePath)
            .on("start", (cmd) => {
              console.log(`FFmpeg started with command: ${cmd}`);
            })
            .on("progress", (progress) => {
              console.log(`FFmpeg progress: ${JSON.stringify(progress)}`);
            })
            .on("end", () => {
              console.log("FFmpeg processing finished");
              resolve();
            })
            .on("error", (err) => {
              console.error("FFmpeg error:", err);
              reject(new Error(`Failed to merge video and audio: ${err.message}`));
            })
            .run();
        });
      } catch (ffmpegError) {
        console.error("FFmpeg merge failed:", ffmpegError);
        throw ffmpegError;
      }

      // Get file size
      let fileSize = 0;
      try {
        const stats = fs.statSync(outputFilePath);
        fileSize = stats.size;
        console.log(`Merged file size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      } catch (statError) {
        console.error("Error getting file stats:", statError);
        throw new Error(`Could not get file size: ${statError.message}`);
      }

      // Create/update video record
      let video = await storage.getVideoByYouTubeId(videoId);
      
      if (video) {
        console.log(`Updating existing video record ID ${video.id}`);
        await storage.updateVideo(video.id, {
          isDownloaded: true,
          downloadPath: outputFilePath,
          fileSize,
          quality: task.quality || "highest",
          format: "mp4",
          downloadedAt: new Date()
        });
      } else {
        // Create video record if it doesn't exist yet
        console.log("Creating new video record");
        const videoData = {
          videoId,
          title: task.title,
          isDownloaded: true,
          downloadPath: outputFilePath,
          fileSize,
          quality: task.quality || "highest",
          format: "mp4",
          thumbnailUrl: videoInfo.videoDetails.thumbnails.length > 0 
            ? videoInfo.videoDetails.thumbnails[videoInfo.videoDetails.thumbnails.length - 1].url 
            : null,
          channelTitle: videoInfo.videoDetails.author.name,
          description: videoInfo.videoDetails.description,
          duration: videoInfo.videoDetails.lengthSeconds,
          downloadedAt: new Date()
        };
        
        video = await storage.createVideo(videoData);
      }

      // If a collection was specified, add video to that collection
      if (task.collectionId) {
        console.log(`Adding video to collection ID ${task.collectionId}`);
        await storage.addVideoToCollection(video.id, task.collectionId);
      }

      // Update task to completed
      await storage.updateDownloadTask(taskId, {
        status: "completed",
        progress: 100,
        completedAt: new Date(),
        fileSize
      });

      // Broadcast completion
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 100,
        status: "completed"
      });

      console.log("Download task completed successfully");

      // Clean up temporary files
      fs.unlink(videoFilePath, (err) => {
        if (err) console.error(`Error deleting temporary video file: ${err.message}`);
        else console.log(`Deleted temporary video file: ${videoFilePath}`);
      });
      
      fs.unlink(audioFilePath, (err) => {
        if (err) console.error(`Error deleting temporary audio file: ${err.message}`);
        else console.log(`Deleted temporary audio file: ${audioFilePath}`);
      });

    } catch (error) {
      console.error(`Error processing download task ${taskId}:`, error);
      
      // Update task with error
      try {
        await storage.updateDownloadTask(taskId, {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date()
        });

        // Broadcast error
        const task = await storage.getDownloadTask(taskId);
        if (task) {
          broadcastDownloadProgress({
            taskId,
            videoId: task.videoId,
            progress: task.progress || 0,
            status: "failed"
          });
        }
      } catch (updateError) {
        console.error("Failed to update task status after error:", updateError);
      }
    }
  }

  return httpServer;
}
