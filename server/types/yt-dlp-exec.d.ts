declare module 'yt-dlp-exec' {
  interface YtFlags {
    output?: string;
    format?: string;
    mergeOutputFormat?: string;
    dumpSingleJson?: boolean;
    noWarnings?: boolean;
    noCallHome?: boolean;
    preferFreeFormats?: boolean;
    youtubeSkipDashManifest?: boolean;
    progress?: boolean;
    newline?: boolean;
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
    upload_date: string;
    duration: string;
    view_count: number;
  }

  function ytDlp(url: string, options?: YtFlags): Promise<VideoInfo | void>;

  export default ytDlp;
} 