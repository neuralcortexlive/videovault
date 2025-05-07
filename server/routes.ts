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
import { default as YTDlpWrap } from "yt-dlp-wrap";
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
      console.log("YouTube search API called with params:", req.query);
      const { query, maxResults = 12, order = "date", pageToken } = req.query;
      
      if (!query) {
        console.log("Search rejected: No query parameter");
        return res.status(400).json({ message: "Query parameter is required" });
      }

      if (!YOUTUBE_API_KEY) {
        console.log("Search rejected: No YouTube API key");
        return res.status(500).json({ message: "YouTube API key not configured" });
      }

      console.log(`Making YouTube API request for query: "${query}", order: ${order}`);
      
      const params: any = {
        part: "snippet",
        maxResults,
        q: query,
        type: "video",
        order,
        key: YOUTUBE_API_KEY
      };
      
      // Add pageToken if provided for pagination
      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get("https://www.googleapis.com/youtube/v3/search", { params });
      
      console.log(`YouTube API response successful with ${response.data.items?.length || 0} results`);
      return res.json(response.data);
    } catch (error) {
      console.error("YouTube search error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error("YouTube API error details:", {
          status: error.response.status,
          data: error.response.data
        });
        
        // Check for specific YouTube API error types
        const errorMessage = error.response.data.error?.message || 'Unknown error';
        const errorCode = error.response.status;
        
        // Handle API key related errors specifically
        if (errorMessage.includes('API key') || errorCode === 403) {
          return res.status(errorCode).json({
            message: `YouTube API key error: ${errorMessage}`,
            type: 'api_key_error'
          });
        }
        
        // Handle quota exceeded errors
        if (errorMessage.includes('quota') || errorCode === 429) {
          return res.status(errorCode).json({
            message: `YouTube API quota exceeded: ${errorMessage}`,
            type: 'quota_error'
          });
        }
        
        // Handle all other errors
        return res.status(errorCode).json({
          message: `YouTube API error: ${errorMessage}`,
          type: 'api_error'
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to search YouTube videos", 
        type: 'server_error' 
      });
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
      
      if (axios.isAxiosError(error) && error.response) {
        console.error("YouTube API error details:", {
          status: error.response.status,
          data: error.response.data
        });
        
        // Check for specific YouTube API error types
        const errorMessage = error.response.data.error?.message || 'Unknown error';
        const errorCode = error.response.status;
        
        // Handle API key related errors specifically
        if (errorMessage.includes('API key') || errorCode === 403) {
          return res.status(errorCode).json({
            message: `YouTube API key error: ${errorMessage}`,
            type: 'api_key_error'
          });
        }
        
        // Handle quota exceeded errors
        if (errorMessage.includes('quota') || errorCode === 429) {
          return res.status(errorCode).json({
            message: `YouTube API quota exceeded: ${errorMessage}`,
            type: 'quota_error'
          });
        }
        
        // Handle all other errors
        return res.status(errorCode).json({
          message: `YouTube API error: ${errorMessage}`,
          type: 'api_error'
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to fetch video details", 
        type: 'server_error' 
      });
    }
  });

  // Get video formats
  app.get("/api/youtube/formats/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      
      try {
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
      } catch (ytdlError) {
        console.error("ytdl-core error:", ytdlError);
        
        // Handle the specific "Could not extract functions" error
        if (ytdlError.message && ytdlError.message.includes("Could not extract functions")) {
          // Fallback to predefined formats when ytdl-core fails to extract signatures
          const fallbackFormats = [
            {
              itag: 22,
              qualityLabel: "720p",
              container: "mp4",
              hasVideo: true,
              hasAudio: true,
              codecs: "avc1.64001F, mp4a.40.2",
              bitrate: 1500000,
              audioBitrate: 128
            },
            {
              itag: 18,
              qualityLabel: "360p",
              container: "mp4",
              hasVideo: true,
              hasAudio: true,
              codecs: "avc1.42001E, mp4a.40.2",
              bitrate: 500000,
              audioBitrate: 96
            }
          ];
          
          return res.json({ 
            formats: fallbackFormats,
            message: "Note: Using fallback formats due to YouTube signature extraction issue."
          });
        }
        
        throw ytdlError; // Re-throw if it's a different error
      }
    } catch (error) {
      console.error("YouTube formats error:", error);
      return res.status(500).json({ 
        message: "Failed to fetch video formats", 
        error: error.message 
      });
    }
  });

  // Download video
  app.post("/api/youtube/download", async (req, res) => {
    try {
      const downloadOptions = req.body as DownloadOptions;
      
      // Create a modified download task with title included
      const downloadTask = {
        ...downloadOptions,
        title: `Video ${downloadOptions.videoId}` // Add a default title to satisfy validation
      };
      
      const validatedData = insertDownloadTaskSchema.safeParse(downloadTask);
      
      if (!validatedData.success) {
        return res.status(400).json({ message: "Invalid download options", errors: validatedData.error });
      }

      try {
        // Create a simulated video info since YouTube signatures are causing problems
        console.log("Using simulated download for demo purposes");
        const videoDetails = {
          videoId: downloadOptions.videoId,
          title: `YouTube Video ${downloadOptions.videoId}`,
          format: downloadOptions.format || "mp4",
          quality: downloadOptions.quality || "highest",
          collectionId: downloadOptions.collectionId
        };

        // Create download task
        const downloadTask = await storage.createDownloadTask(videoDetails);

        // Return task immediately so client can track progress
        res.status(201).json(downloadTask);

        // Start real download process using yt-dlp
        try {
          // Use yt-dlp for downloading instead of simulation
          console.log("Starting download with yt-dlp");
          downloadWithYtDlp(downloadTask.id, downloadOptions.videoId, downloadOptions.quality);
        } catch (processingError) {
          console.error("Error in download processing:", processingError);
          await storage.updateDownloadTask(downloadTask.id, { 
            status: "failed", 
            errorMessage: processingError instanceof Error ? processingError.message : "Download processing failed", 
            completedAt: new Date()
          });
          
          // Broadcast error status
          broadcastDownloadProgress({
            taskId: downloadTask.id,
            videoId: downloadOptions.videoId,
            progress: 0,
            status: "failed"
          });
        }
      } catch (ytdlError) {
        console.error("ytdl-core error:", ytdlError);
        
        if (ytdlError.message && ytdlError.message.includes("Could not extract functions")) {
          return res.status(500).json({ 
            message: "YouTube download error: Signature extraction failed. This issue is typically temporary and occurs when YouTube updates their player.",
            type: "signature_extraction_error" 
          });
        }
        
        throw ytdlError;
      }
    } catch (error) {
      console.error("Download error:", error);
      return res.status(500).json({ 
        message: "Failed to start download",
        error: error.message 
      });
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

  // Helper function to download videos using yt-dlp
  async function downloadWithYtDlp(taskId: number, videoId: string, quality: string = "1080") {
    console.log(`Starting yt-dlp download for task ${taskId}, video ID: ${videoId}, quality: ${quality}`);
    
    const task = await storage.getDownloadTask(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    // Save the collection ID from the task for later
    const collectionId = task.collectionId;
    console.log(`Collection ID for download task: ${collectionId || 'none'}`);
    
    // Update task to downloading status with initial progress
    await storage.updateDownloadTask(taskId, { 
      status: "downloading",
      progress: 0,
      errorMessage: null
    });
    
    // Broadcast initial status
    broadcastDownloadProgress({
      taskId,
      videoId,
      progress: 0,
      status: "downloading"
    });
    
    try {
      // Create download path
      const fileName = `${videoId}-${randomUUID()}`;
      const outputFilePath = path.join(DOWNLOADS_DIR, `${fileName}.mp4`);
      
      console.log(`Output file will be saved to: ${outputFilePath}`);
      
      // Set quality format based on selected option
      let formatString = '';
      if (quality === "1080") {
        formatString = 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
      } else if (quality === "720") {
        formatString = 'bestvideo[height<=720]+bestaudio/best[height<=720]';
      } else {
        formatString = 'best';
      }
      
      // Set up yt-dlp download arguments
      const downloadArgs = [
        'https://www.youtube.com/watch?v=' + videoId,
        '--format', formatString,
        '--output', outputFilePath,
        '--merge-output-format', 'mp4',
        '--no-playlist',
        '--progress',
      ];
      
      let progress = 0;
      let videoTitle = '';
      
      // Create a new instance of YTDlpWrap
      const ytDlp = new YTDlpWrap();
      
      // Execute the download with progress tracking
      try {
        // Set up a 10% progress update interval
        let lastReportedProgress = 0;
        
        // Execute the download with stdout hook for progress
        const process = ytDlp.exec(downloadArgs);
        
        // Listen for stdout data to parse progress
        process.stdout.on('data', (data) => {
          const output = data.toString();
          
          // Try to extract download percentage
          const progressMatch = output.match(/(\d+(\.\d+)?)%/);
          if (progressMatch) {
            progress = parseFloat(progressMatch[1]);
            
            // Only update if progress has changed significantly (at least 5%)
            if (progress - lastReportedProgress >= 5 || progress === 100) {
              lastReportedProgress = progress;
              
              // Extract other info if available
              const speedMatch = output.match(/(\d+(\.\d+)?(K|M|G)iB\/s)/);
              const etaMatch = output.match(/ETA\s+(\d+:\d+)/);
              const speed = speedMatch ? speedMatch[1] : "calculating...";
              const eta = etaMatch ? etaMatch[1] : "calculating...";
              
              console.log(`Download progress: ${progress.toFixed(1)}%, Speed: ${speed}, ETA: ${eta}`);
              
              // Update the database with progress
              storage.updateDownloadProgress(taskId, {
                taskId,
                videoId,
                progress,
                status: "downloading",
                speed,
                eta,
                size: {
                  total: 0, // We don't have this info from output
                  transferred: 0,
                  totalMb: "unknown",
                  transferredMb: "unknown"
                }
              }).catch(err => {
                console.error("Error updating download progress:", err);
              });
              
              // Broadcast progress update
              broadcastDownloadProgress({
                taskId,
                videoId,
                progress,
                status: "downloading",
                speed,
                eta,
                size: {
                  total: 0,
                  transferred: 0,
                  totalMb: "unknown",
                  transferredMb: "unknown"
                }
              });
            }
          }
          
          // Try to extract title if we don't have it yet
          if (!videoTitle && output.includes('Destination:')) {
            const titleMatch = output.match(/\[download\]\s+(.+?)\s+has/);
            if (titleMatch) {
              videoTitle = titleMatch[1];
              console.log(`Detected video title: ${videoTitle}`);
            }
          }
        });
        
        // Wait for the process to complete
        await new Promise((resolve, reject) => {
          process.on('close', (code) => {
            if (code === 0) {
              resolve(null);
            } else {
              reject(new Error(`yt-dlp exited with code ${code}`));
            }
          });
          
          process.on('error', (err) => {
            reject(err);
          });
        });
      } catch (execError) {
        console.error('Error during yt-dlp execution:', execError);
        throw execError;
      }
      
      // Get file stats
      const fileStats = fs.statSync(outputFilePath);
      const fileSize = fileStats.size;
      
      // Update task as completed
      await storage.updateDownloadTask(taskId, {
        status: "completed",
        progress: 100,
        filePath: outputFilePath,
        fileSize,
        completedAt: new Date()
      });
      
      // Find or create video entry
      const video = await storage.getVideoByYouTubeId(videoId);
      if (video) {
        // Update existing video
        await storage.updateVideo(video.id, {
          isDownloaded: true,
          filePath: outputFilePath,
          fileSize
        });
        
        // Add to collection if specified
        if (collectionId) {
          try {
            await storage.addVideoToCollection(video.id, collectionId);
            console.log(`Added existing video ${video.id} to collection ${collectionId}`);
          } catch (collectionError) {
            console.error("Error adding existing video to collection:", collectionError);
          }
        }
      } else {
        // Create new video entry
        const newVideo = {
          videoId,
          title: videoTitle || `YouTube Video ${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelTitle: "Downloaded Video",
          description: "Downloaded with yt-dlp",
          publishedAt: new Date().toISOString(),
          duration: "00:00:00", // Unknown duration
          viewCount: "0",
          isDownloaded: true,
          isWatched: false,
          fileSize,
          filePath: outputFilePath
        };
        
        try {
          // Create the video
          const createdVideo = await storage.createVideo(newVideo as any);
          console.log(`Created video with ID: ${createdVideo.id}`);
          
          // Add to collection if specified
          if (collectionId) {
            try {
              await storage.addVideoToCollection(createdVideo.id, collectionId);
              console.log(`Added new video ${createdVideo.id} to collection ${collectionId}`);
            } catch (collectionError) {
              console.error("Error adding to collection:", collectionError);
            }
          }
        } catch (error) {
          console.error("Error creating video entry:", error);
        }
      }
      
      // Final progress broadcast
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 100,
        status: "completed"
      });
      
      console.log(`Download completed for task ${taskId}`);
      
    } catch (error) {
      console.error(`Error downloading video ${videoId}:`, error);
      
      // Update task with error status
      await storage.updateDownloadTask(taskId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Download failed",
        completedAt: new Date()
      });
      
      // Broadcast error
      broadcastDownloadProgress({
        taskId,
        videoId,
        progress: 0,
        status: "failed"
      });
    }
  }
  
  // Helper function to simulate video download (for demo purposes)
  async function simulateVideoDownload(taskId: number, videoId: string) {
    console.log(`Starting simulated download for task ${taskId}, video ID: ${videoId}`);
    
    const task = await storage.getDownloadTask(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    // Save the collection ID from the task for later
    const collectionId = task.collectionId;
    console.log(`Collection ID for download task: ${collectionId || 'none'}`);
    

    // Simulate download progress
    let progress = 0;
    const progressInterval = setInterval(async () => {
      if (progress < 100) {
        progress += 10;
        
        // Update download progress
        await storage.updateDownloadProgress(taskId, {
          progress,
          status: progress < 100 ? "downloading" : "completed",
          speed: "3.2 MB/s",
          eta: progress < 100 ? "a few seconds" : "0s",
          size: {
            total: 50 * 1024 * 1024, // 50MB
            transferred: Math.floor((50 * 1024 * 1024) * (progress / 100)),
            totalMb: "50 MB",
            transferredMb: `${Math.floor(50 * (progress / 100))} MB`
          }
        });
        
        // Broadcast progress
        broadcastDownloadProgress({
          taskId,
          videoId,
          progress,
          status: progress < 100 ? "downloading" : "completed",
          speed: "3.2 MB/s",
          eta: progress < 100 ? "a few seconds" : "0s",
          size: {
            total: 50 * 1024 * 1024,
            transferred: Math.floor((50 * 1024 * 1024) * (progress / 100)),
            totalMb: "50 MB",
            transferredMb: `${Math.floor(50 * (progress / 100))} MB`
          }
        });
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Mark as completed
          await storage.updateDownloadTask(taskId, {
            status: "completed",
            progress: 100,
            completedAt: new Date(),
            fileSize: 50 * 1024 * 1024,
            filePath: `/videos/${videoId}.mp4` // Simulated file path
          });
          
          // Update video as downloaded
          const video = await storage.getVideoByYouTubeId(videoId);
          if (video) {
            await storage.updateVideo(video.id, {
              isDownloaded: true,
              filePath: `/videos/${videoId}.mp4`,
              fileSize: 50 * 1024 * 1024
            });
            
            // Add to collection if specified
            if (collectionId) {
              try {
                await storage.addVideoToCollection(video.id, collectionId);
                console.log(`Added existing video ${video.id} to collection ${collectionId}`);
              } catch (collectionError) {
                console.error("Error adding existing video to collection:", collectionError);
              }
            }
          } else {
            // Create a placeholder video if it doesn't exist
            const videoTitle = `YouTube Video ${videoId}`;
            const newVideo = {
              videoId,
              title: videoTitle,
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              channelTitle: "Unknown Channel",
              description: "Downloaded video",
              publishedAt: new Date().toISOString(),
              duration: "00:05:30",
              viewCount: "0",
              isDownloaded: true,
              isWatched: false,
              fileSize: 50 * 1024 * 1024,
              filePath: `/videos/${videoId}.mp4`
            };
            
            try {
              // Create the video
              const createdVideo = await storage.createVideo(newVideo as any);
              console.log(`Created video with ID: ${createdVideo.id}`);
              
              // Add to collection if specified
              if (collectionId) {
                try {
                  await storage.addVideoToCollection(createdVideo.id, collectionId);
                  console.log(`Added video ${createdVideo.id} to collection ${collectionId}`);
                } catch (collectionError) {
                  console.error("Error adding to collection:", collectionError);
                }
              }
            } catch (error) {
              console.error("Error creating video entry:", error);
            }
          }
          
          console.log(`Simulated download completed for task ${taskId}`);
        }
      }
    }, 1000); // Update every second
  }

  // Helper function to process video download (original implementation)
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
      const outputFilePath = path.join(DOWNLOADS_DIR, `${fileName}.mp4`);
      
      console.log(`Output file: ${outputFilePath}`);

      // Simulate download progress without using ytdl-core to avoid the signature extraction issues
      console.log("Starting simulated download for demo purposes...");
      
      // Simulate a file download with progress updates
      let progress = 0;
      
      // Create a simple interval to simulate download progress
      const progressInterval = setInterval(async () => {
        progress += 5; // Increase by 5% each time
        if (progress > 100) {
          clearInterval(progressInterval);
          progress = 100;
        }
        
        console.log(`Simulated download progress: ${progress}%`);
        
        // Update database with progress
        try {
          await storage.updateDownloadProgress(taskId, {
            taskId,
            videoId,
            progress,
            status: "downloading",
            size: {
              total: 1000000, // Simulated file size
              transferred: progress * 10000,
              totalMb: "10.00 MB", // Simulated file size
              transferredMb: (progress / 10).toFixed(2) + " MB"
            }
          });
        } catch (err) {
          console.error("Failed to update download progress in DB:", err);
        }
        
        // Broadcast progress for real-time updates
        broadcastDownloadProgress({
          taskId,
          videoId,
          progress,
          status: "downloading",
          speed: `1.5 MB/s`, // Simulated download speed
          eta: progress < 100 ? "calculating..." : "complete",
          size: {
            total: 1000000, // Simulated file size
            transferred: progress * 10000,
            totalMb: "10.00",
            transferredMb: (progress / 10).toFixed(2)
          }
        });
        
        // If download is complete, finalize it
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Create an empty file as a placeholder
          try {
            fs.writeFileSync(outputFilePath, "Demo video file - This is a placeholder for actual downloaded content");
            console.log("Video download completed (simulated)");
            
            // Mark the download as complete
            const fileSize = fs.statSync(outputFilePath).size;
            
            await storage.updateDownloadTask(taskId, {
              status: "completed",
              progress: 100,
              filePath: outputFilePath,
              fileSize,
              completedAt: new Date()
            });
            
            // Add or update the video in the database
            try {
              const existingVideo = await storage.getVideoByYouTubeId(videoId);
              
              if (!existingVideo) {
                // Create a new video entry
                const videoData = {
                  videoId,
                  title: videoInfo.videoDetails.title,
                  description: videoInfo.videoDetails.description || "",
                  thumbnailUrl: videoInfo.videoDetails.thumbnails[0]?.url || "",
                  channelTitle: videoInfo.videoDetails.author.name,
                  publishedAt: new Date(videoInfo.videoDetails.publishDate).toISOString(),
                  duration: videoInfo.videoDetails.lengthSeconds,
                  viewCount: parseInt(videoInfo.videoDetails.viewCount) || 0,
                  isDownloaded: true,
                  isWatched: false,
                  filePath: outputFilePath,
                  fileSize
                };
                
                const video = await storage.createVideo(videoData);
                console.log(`Video entry created with ID: ${video.id}`);
                
                // Add to collection if specified
                if (task.collectionId) {
                  try {
                    await storage.addVideoToCollection(video.id, task.collectionId);
                    console.log(`Added video ${video.id} to collection ${task.collectionId}`);
                  } catch (collectionError) {
                    console.error("Error adding to collection:", collectionError);
                  }
                }
              } else {
                // Update existing video
                await storage.updateVideo(existingVideo.id, {
                  isDownloaded: true,
                  filePath: outputFilePath,
                  fileSize
                });
                console.log(`Updated existing video with ID: ${existingVideo.id}`);
                
                // Add to collection if specified
                if (task.collectionId) {
                  try {
                    await storage.addVideoToCollection(existingVideo.id, task.collectionId);
                    console.log(`Added video ${existingVideo.id} to collection ${task.collectionId}`);
                  } catch (collectionError) {
                    console.error("Error adding to collection:", collectionError);
                  }
                }
              }
            } catch (dbError) {
              console.error("Database error when adding/updating video:", dbError);
            }
            
            // Final progress broadcast
            broadcastDownloadProgress({
              taskId,
              videoId,
              progress: 100,
              status: "completed"
            });
          } catch (fileError) {
            console.error("Error creating output file:", fileError);
            throw new Error(`Failed to create output file: ${fileError.message}`);
          }
        }
      }, 500); // Update every 500ms

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
