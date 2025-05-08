import { useState, useEffect } from "react";

export default function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    try {
      // Get the current URL components
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname;
      const port = window.location.port;
      
      // Construct WebSocket URL with proper error handling
      let wsUrl = `${protocol}//${hostname}`;
      if (port) {
        wsUrl += `:${port}`;
      }
      wsUrl += '/ws';
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      // Save WebSocket connection
      setSocket(ws);
      
      // Clean up on unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
    }
  }, []);
  
  return socket;
}