// Update the WebSocket server setup in registerRoutes function
export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server with explicit path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

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

  // Rest of the routes...
}