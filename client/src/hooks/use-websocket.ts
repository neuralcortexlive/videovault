import { useState, useEffect } from "react";

export default function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server using wss protocol
    const wsUrl = `wss://${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    // Save WebSocket connection
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, []);
  
  return socket;
}