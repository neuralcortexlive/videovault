import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatBytes } from "@/lib/utils";

interface DownloadSpeedMeterProps {
  downloadSpeed: number; // bytes per second
  progress: number; // 0-100
}

export default function DownloadSpeedMeter({ downloadSpeed, progress }: DownloadSpeedMeterProps) {
  const [speedCategory, setSpeedCategory] = useState<"slow" | "medium" | "fast" | "ultra">("medium");
  
  // Determine speed category based on download speed
  useEffect(() => {
    if (downloadSpeed < 500000) { // < 500KB/s
      setSpeedCategory("slow");
    } else if (downloadSpeed < 2000000) { // < 2MB/s
      setSpeedCategory("medium");
    } else if (downloadSpeed < 10000000) { // < 10MB/s
      setSpeedCategory("fast");
    } else {
      setSpeedCategory("ultra");
    }
  }, [downloadSpeed]);
  
  // Colors for different speed categories
  const speedColors = {
    slow: "bg-yellow-400",
    medium: "bg-green-400",
    fast: "bg-blue-500",
    ultra: "bg-purple-600"
  };
  
  // Animation settings
  const needleVariants = {
    slow: { rotate: -20 },
    medium: { rotate: 30 },
    fast: { rotate: 80 },
    ultra: { rotate: 130 }
  };
  
  const particleVariants = {
    hidden: { opacity: 0, y: 0 },
    visible: { 
      opacity: [0, 1, 0],
      y: [-5, -20],
      transition: { 
        duration: 1.5, 
        repeat: Infinity, 
        repeatType: "loop" as const
      }
    }
  };
  
  // Generate random particles based on speed
  const particleCount = {
    slow: 3,
    medium: 6,
    fast: 10,
    ultra: 15
  };
  
  return (
    <div className="flex flex-col items-center mb-4">
      <div className="text-center mb-2">
        <span className="text-sm font-medium">Download Speed</span>
        <div className="text-xl font-bold tracking-tight">
          {formatBytes(downloadSpeed)}/s
        </div>
      </div>
      
      {/* Speed meter */}
      <div className="relative w-full h-24 flex items-center justify-center">
        {/* Meter background */}
        <div className="absolute w-32 h-32 rounded-full border-8 border-background bottom-0" 
             style={{ clipPath: 'polygon(0% 50%, 100% 50%, 100% 100%, 0% 100%)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-green-400 to-purple-600 opacity-40"></div>
        </div>
        
        {/* Speed indicator needle */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-1 h-16 bg-card rounded-full origin-bottom"
          variants={needleVariants}
          animate={speedCategory}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
        >
          <div className="absolute -left-1.5 -top-1.5 w-4 h-4 rounded-full bg-card border-2 border-primary"></div>
        </motion.div>
        
        {/* Speed particles */}
        <div className="absolute bottom-0 w-full h-full flex justify-center overflow-hidden">
          {Array.from({ length: particleCount[speedCategory] }).map((_, i) => (
            <motion.div
              key={i}
              className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${speedColors[speedCategory]}`}
              style={{ 
                left: `${40 + Math.random() * 20}%`,
                opacity: 0
              }}
              variants={particleVariants}
              animate="visible"
              initial="hidden"
              transition={{ 
                delay: Math.random() * 2,
                duration: 1 + Math.random()
              }}
            />
          ))}
        </div>
        
        {/* Progress indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs">
          <span>0</span>
          <span className="opacity-50">2MB/s</span>
          <span className="opacity-50">10MB/s</span>
          <span>20MB/s+</span>
        </div>
      </div>
      
      {/* Fun message based on speed */}
      <div className="text-sm text-center mt-1 italic opacity-75">
        {speedCategory === "slow" && "Taking it slow... ☕"}
        {speedCategory === "medium" && "Cruising along! 🚗"}
        {speedCategory === "fast" && "Now we're talking! 🏎️"}
        {speedCategory === "ultra" && "Hyperspeed engaged! 🚀"}
      </div>
    </div>
  );
}