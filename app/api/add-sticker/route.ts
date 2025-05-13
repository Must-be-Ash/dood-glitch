import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert uploaded file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get dimensions of input image
    const imageMetadata = await sharp(buffer).metadata();
    const { width = 800, height = 800 } = imageMetadata;

    // Load the sticker image
    const stickerPath = join(process.cwd(), 'public', 'sticke.png');
    
    // Get sticker metadata to calculate proper dimensions
    const stickerMetadata = await sharp(stickerPath).metadata();
    const stickerAspectRatio = stickerMetadata.width! / stickerMetadata.height!;
    
    // Calculate new width based on image size (40% of image width)
    const stickerWidth = Math.round(width * 0.4);
    // Calculate height maintaining original aspect ratio
    const stickerHeight = Math.round(stickerWidth / stickerAspectRatio);
    
    const resizedSticker = await sharp(stickerPath)
      .resize(stickerWidth, stickerHeight, {
        fit: 'contain', // Use contain to maintain aspect ratio
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Calculate position for placement with adjusted padding
    const offsetX = Math.round(width * 0.19); // 17% from right edge (tiny move left from 15%)
    const offsetY = Math.round(height * 0.3); // 30% from top

    // Overlay sticker on image with custom position
    const processedImage = await sharp(buffer)
      .resize(width, height) // Ensure consistent dimensions
      .composite([
        {
          input: resizedSticker,
          top: offsetY,
          left: width - stickerWidth - offsetX
        }
      ])
      .png()
      .toBuffer();

    return new NextResponse(processedImage, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 