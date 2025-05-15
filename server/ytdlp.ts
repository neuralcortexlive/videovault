import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

// Base download directory
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');

// Make sure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

interface DownloadOptions {
  format?: string;
  output?: string;
  subtitles?: boolean;
  audioOnly?: boolean;
  videoOnly?: boolean;
  quality?: string;
  metadata?: boolean;
}

interface DownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  eta: string;
}

export class YtDlpDownloader extends EventEmitter {
  private process: any;
  private videoId: string;
  private options: DownloadOptions;
  private aborted: boolean = false;

  constructor(videoId: string, options: DownloadOptions = {}) {
    super();
    this.videoId = videoId;
    this.options = options;
  }

  async download(): Promise<string> {
    return new Promise((resolve, reject) => {
      const videoUrl = `https://www.youtube.com/watch?v=${this.videoId}`;
      const outputPath = this.options.output || path.join(DOWNLOAD_DIR, `${this.videoId}.mp4`);
      
      console.log(`[yt-dlp] Starting download for video ${this.videoId}`);
      console.log(`[yt-dlp] Output path: ${outputPath}`);
      
      // Make sure the directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        console.log(`[yt-dlp] Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }

      // Base arguments
      const args = [
        '-f', this.options.format || 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '--progress',
        '--newline',
        '--restrict-filenames',
        '--no-warnings',  // Reduzir ruído nos logs
        '--verbose',      // Adicionar mais informações de debug
        '-o', outputPath
      ];

      if (this.options.subtitles) {
        args.push('--write-subs', '--sub-langs', 'en');
      }

      if (this.options.metadata) {
        args.push('--write-info-json');
      }

      if (this.options.audioOnly) {
        args[1] = 'bestaudio[ext=m4a]/bestaudio';
        args.push('--extract-audio');
      }

      console.log("[yt-dlp] Command:", [...args, videoUrl].join(' '));
      
      // Use full path to yt-dlp if available
      const ytdlpPath = '/opt/anaconda3/bin/yt-dlp';
      console.log("[yt-dlp] Using path:", ytdlpPath);
      
      // Verificar se o yt-dlp está instalado e acessível
      try {
        fs.accessSync(ytdlpPath, fs.constants.X_OK);
      } catch (error) {
        console.error("[yt-dlp] Error: yt-dlp not found or not executable at", ytdlpPath);
        return reject(new Error('yt-dlp not found or not executable'));
      }
      
      this.process = spawn(ytdlpPath, [...args, videoUrl]);

      let stderr = '';
      let downloadProgress: DownloadProgress = {
        percent: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: '0 KiB/s',
        eta: 'N/A'
      };

      this.process.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`[yt-dlp] Output: ${output.trim()}`);
        
        // Parse progress information from yt-dlp output
        const progressMatch = output.match(/\[download\]\s+(\d+\.\d+)%\s+of\s+~?(\d+\.\d+)([KMGTP]iB)\s+at\s+(\d+\.\d+)([KMGTP]iB\/s)\s+ETA\s+(\d+:\d+)/);
        
        if (progressMatch) {
          const [, percent, size, sizeUnit, speed, speedUnit, eta] = progressMatch;
          
          // Convert size to bytes
          const sizeInBytes = parseFloat(size) * getUnitMultiplier(sizeUnit);
          const downloadedBytes = (parseFloat(percent) / 100) * sizeInBytes;
          
          downloadProgress = {
            percent: parseFloat(percent),
            downloadedBytes,
            totalBytes: sizeInBytes,
            speed: `${speed} ${speedUnit}`,
            eta
          };
          
          console.log(`[yt-dlp] Progress: ${percent}% (${downloadedBytes} bytes / ${sizeInBytes} bytes)`);
          this.emit('progress', downloadProgress);
        }
      });

      this.process.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        console.error(`[yt-dlp] Error output: ${output.trim()}`);
      });

      this.process.on('close', (code: number) => {
        console.log(`[yt-dlp] Process exited with code ${code}`);
        
        if (this.aborted) {
          console.log('[yt-dlp] Download was aborted');
          return reject(new Error('Download aborted'));
        }
        
        // Verificar erros comuns
        if (stderr.includes('HTTP Error 403: Forbidden')) {
          console.error('[yt-dlp] Error: YouTube returned a 403 Forbidden error');
          return reject(new Error('Download failed: YouTube has restricted access to this video. Try another video or try again later.'));
        }
        
        if (stderr.includes('Video unavailable')) {
          console.error('[yt-dlp] Error: Video is unavailable');
          return reject(new Error('Download failed: Video is unavailable or has been removed.'));
        }
        
        if (code !== 0) {
          const errorMessage = `yt-dlp exited with code ${code}: ${stderr}`;
          console.error('[yt-dlp] Error:', errorMessage);
          return reject(new Error(errorMessage));
        }
        
        // Verificar se o arquivo foi realmente criado
        if (!fs.existsSync(outputPath)) {
          console.error('[yt-dlp] Error: Output file was not created');
          return reject(new Error('Download failed: Output file was not created'));
        }
        
        // Verificar se o arquivo tem tamanho maior que zero
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          console.error('[yt-dlp] Error: Output file is empty');
          return reject(new Error('Download failed: Output file is empty'));
        }
        
        console.log(`[yt-dlp] Download completed successfully: ${outputPath}`);
        console.log(`[yt-dlp] File size: ${stats.size} bytes`);
        
        // Set progress to 100% when download completes
        downloadProgress.percent = 100;
        this.emit('progress', downloadProgress);
        this.emit('complete', outputPath);
        
        resolve(outputPath);
      });
    });
  }

  abort(): void {
    if (this.process) {
      console.log('[yt-dlp] Aborting download...');
      this.aborted = true;
      this.process.kill();
      this.emit('aborted');
    }
  }
}

export class FfmpegProcessor extends EventEmitter {
  private process: any;
  private aborted: boolean = false;

  async processVideo(inputPath: string, outputPath: string, options: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      // Make sure the output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Base arguments (overwrite output if exists)
      const args = ['-i', inputPath, '-y', ...options, outputPath];

      const ffmpegPath = '/usr/local/bin/ffmpeg';
      console.log("[ffmpeg] Using path:", ffmpegPath);
      
      // Verificar se o ffmpeg está instalado e acessível
      try {
        fs.accessSync(ffmpegPath, fs.constants.X_OK);
      } catch (error) {
        console.error("[ffmpeg] Error: ffmpeg not found or not executable at", ffmpegPath);
        return reject(new Error('ffmpeg not found or not executable'));
      }
      
      this.process = spawn(ffmpegPath, args);

      let stderr = '';

      this.process.stdout.on('data', (data: Buffer) => {
        this.emit('output', data.toString());
      });

      this.process.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        
        // ffmpeg outputs progress to stderr
        const durationMatch = output.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        const timeMatch = output.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        
        if (durationMatch && timeMatch) {
          const totalSeconds = 
            parseInt(durationMatch[1]) * 3600 + 
            parseInt(durationMatch[2]) * 60 + 
            parseFloat(durationMatch[3]);
          
          const currentSeconds = 
            parseInt(timeMatch[1]) * 3600 + 
            parseInt(timeMatch[2]) * 60 + 
            parseFloat(timeMatch[3]);
          
          const percent = (currentSeconds / totalSeconds) * 100;
          
          this.emit('progress', {
            percent: Math.min(100, Math.round(percent * 10) / 10),
            currentTime: currentSeconds,
            totalTime: totalSeconds
          });
        }
      });

      this.process.on('close', (code: number) => {
        if (this.aborted) {
          return reject(new Error('Processing aborted'));
        }

        if (code !== 0) {
          return reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
        }

        if (!fs.existsSync(outputPath)) {
          return reject(new Error('Output file was not created'));
        }

        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
          return reject(new Error('Output file is empty'));
        }

        resolve(outputPath);
      });
    });
  }

  abort(): void {
    if (this.process) {
      this.aborted = true;
      this.process.kill();
      this.emit('aborted');
    }
  }
}

function getUnitMultiplier(unit: string): number {
  switch (unit) {
    case 'KiB': return 1024;
    case 'MiB': return 1024 * 1024;
    case 'GiB': return 1024 * 1024 * 1024;
    case 'TiB': return 1024 * 1024 * 1024 * 1024;
    case 'PiB': return 1024 * 1024 * 1024 * 1024 * 1024;
    default: return 1;
  }
}
