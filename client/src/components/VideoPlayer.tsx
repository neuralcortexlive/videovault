import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  onClose: () => void;
}

export default function VideoPlayer({ videoId, onClose }: VideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Add fade-in animation effect
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    // Add event listener to close on escape key
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  };
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 transform ${
          isVisible ? 'scale-100' : 'scale-90'
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside player
      >
        <button 
          className="absolute top-3 right-3 z-10 bg-black bg-opacity-70 rounded-full p-1 text-white hover:bg-opacity-100 transition-all"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </button>
        
        <iframe 
          width="800" 
          height="450" 
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
          title="YouTube video player" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
          className="rounded-lg shadow-xl"
        ></iframe>
      </div>
    </div>
  );
}