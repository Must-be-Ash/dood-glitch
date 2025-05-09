import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

/**
 * Records a specific element for a given duration
 * @param element - The DOM element to record
 * @param durationMs - Duration in milliseconds
 * @returns Promise<Blob> - The recorded video blob
 */
export async function recordElement(
  element: HTMLCanvasElement | HTMLVideoElement, // More specific type that supports captureStream
  durationMs: number = 3000
): Promise<Blob> {
  // @ts-ignore - captureStream exists but TypeScript doesn't know about it
  const stream = element.captureStream(60); // 60fps for smooth animation

  // Create media recorder
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 8000000 // 8Mbps for good quality
  });

  // Store the chunks of video data
  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve, reject) => {
    // When recording is complete
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    // Handle errors
    mediaRecorder.onerror = (err) => reject(err);

    // Start recording
    mediaRecorder.start();

    // Stop after duration
    setTimeout(() => {
      mediaRecorder.stop();
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }, durationMs);
  });
}

/**
 * Converts a video blob to a GIF using FFmpeg.wasm
 * @param videoBlob - The video blob to convert
 * @param onProgress - Optional callback for conversion progress (0-1)
 * @returns Promise<Blob> - The resulting GIF blob
 */
export async function convertVideoToGif(
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Create FFmpeg instance
  const ffmpeg = new FFmpeg();
  
  try {
    // Load FFmpeg with proper paths
    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    });

    // Write video file to memory
    await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));

    // Set up progress handling
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.min(1, progress));
      });
    }

    // Convert to GIF with good quality settings
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-vf', 'fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
      'output.gif'
    ]);

    // Read the output file
    const data = await ffmpeg.readFile('output.gif');
    
    // Convert Uint8Array to Blob
    return new Blob([data], { type: 'image/gif' });
  } finally {
    // Clean up
    await ffmpeg.terminate();
  }
} 