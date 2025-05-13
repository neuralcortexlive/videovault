import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert ISO 8601 duration format to human-readable format
export function parseDuration(duration: string): string {
  if (!duration) return "";
  
  // Remove 'PT' prefix from the duration
  duration = duration.replace('PT', '');
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  // Extract hours
  const hoursMatch = duration.match(/(\d+)H/);
  if (hoursMatch) {
    hours = parseInt(hoursMatch[1]);
    duration = duration.replace(hoursMatch[0], '');
  }
  
  // Extract minutes
  const minutesMatch = duration.match(/(\d+)M/);
  if (minutesMatch) {
    minutes = parseInt(minutesMatch[1]);
    duration = duration.replace(minutesMatch[0], '');
  }
  
  // Extract seconds
  const secondsMatch = duration.match(/(\d+)S/);
  if (secondsMatch) {
    seconds = parseInt(secondsMatch[1]);
  }
  
  // Format the duration as MM:SS or HH:MM:SS
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Format a number of bytes into a human-readable string
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format view count with K, M, B suffixes
export function formatViewCount(viewCount: number): string {
  if (viewCount >= 1000000000) {
    return (viewCount / 1000000000).toFixed(1) + 'B views';
  } else if (viewCount >= 1000000) {
    return (viewCount / 1000000).toFixed(1) + 'M views';
  } else if (viewCount >= 1000) {
    return (viewCount / 1000).toFixed(1) + 'K views';
  } else {
    return viewCount.toString() + ' views';
  }
}

// Format duration for display
export function formatDuration(duration: string): string {
  return parseDuration(duration);
}
