declare module 'yt-dlp-wrap' {
  interface YTDlpOptions {
    output?: string;
    format?: string;
    mergeOutputFormat?: string;
    onProgress?: (progress: {
      percent?: number;
      speed?: number;
      eta?: number;
      totalBytes?: number;
      downloadedBytes?: number;
    }) => void;
  }

  interface VideoInfo {
    title: string;
    description: string;
    channel: string;
    thumbnail: string;
    uploadDate: string;
    duration: string;
    viewCount: string;
  }

  class YTDlpWrap {
    constructor(binaryPath?: string);
    getVideoInfo(url: string): Promise<VideoInfo>;
    exec(args: string[], options?: YTDlpOptions): Promise<void>;
  }

  export default YTDlpWrap;
} 