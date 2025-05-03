/**
 * Export a canvas animation to a GIF using gif.js
 * @param renderFrame - Function to render a specific frame to the canvas (receives frameIndex, canvas, image1, image2)
 * @param frameCount - Number of frames to capture
 * @param delay - Delay per frame in ms
 * @param image1 - Loaded HTMLImageElement for first image
 * @param image2 - Loaded HTMLImageElement for second image
 * @param onProgress - Optional callback for progress (0-1)
 * @param offscreenCanvas - Optional canvas to use for rendering (will create one if not provided)
 * @returns Promise<Blob> - Resolves with the GIF blob
 */
export async function exportCanvasAnimationToGif(
  renderFrame: (frameIndex: number, canvas: HTMLCanvasElement, image1: HTMLImageElement, image2: HTMLImageElement) => Promise<void> | void,
  frameCount: number,
  delay: number,
  image1: HTMLImageElement,
  image2: HTMLImageElement,
  onProgress?: (progress: number) => void,
  offscreenCanvas?: HTMLCanvasElement
): Promise<Blob> {
  // Dynamically import gif.js to avoid SSR issues
  const GIF = (await import('gif.js')).default || (await import('gif.js'));

  // Use provided offscreen canvas or create a new one
  const canvas = offscreenCanvas || document.createElement('canvas');
  canvas.width = image1.width;
  canvas.height = image1.height;

  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: '/gif.worker.js',
      transparent: null,
    });

    // TypeScript workaround: gif.js event typings are not strict, so we cast to any
    (gif as any).on('progress', (p: number) => {
      if (onProgress) onProgress(p);
    });
    (gif as any).on('finished', (blob: Blob) => {
      resolve(blob);
    });
    (gif as any).on('abort', () => reject(new Error('GIF export aborted')));
    (gif as any).on('error', (err: any) => reject(err));

    // Helper to add frames sequentially
    const addFrame = async (i: number) => {
      await renderFrame(i, canvas, image1, image2);
      gif.addFrame(canvas, { copy: true, delay });
    };

    (async () => {
      for (let i = 0; i < frameCount; i++) {
        await addFrame(i);
      }
      gif.render();
    })();
  });
} 