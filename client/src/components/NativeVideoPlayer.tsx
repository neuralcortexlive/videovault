import { Video } from "@shared/schema";
import { useEffect, useRef } from "react";

interface NativeVideoPlayerProps {
  video: Video;
}

export default function NativeVideoPlayer({ video }: NativeVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.focus();
    }
  }, [video]);

  // Verifica se o campo filePath existe no objeto video
  const videoPath = (video as any).filePath || '';

  return (
    <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        src={`file://${videoPath}`}
        controls
        autoPlay
        controlsList="nodownload"
      />
    </div>
  );
} 