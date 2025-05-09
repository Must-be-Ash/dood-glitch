import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    console.log('Extracting dominant background color...');

    // Resize to 1x1 pixel to get the dominant color, focusing on a likely background area (e.g., top-left corner)
    // We use a small region and then resize to 1x1 to get an average of that region.
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine image dimensions');
    }

    // Define a small region (e.g., top-left 10x10 pixels) that likely represents background
    const regionSize = Math.min(10, metadata.width, metadata.height);
    const dominantColorBuffer = await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: regionSize, height: regionSize })
      .resize(1, 1, { 
        kernel: sharp.kernel.cubic, // Use a standard kernel for resizing to 1x1
        fit: sharp.fit.cover // Ensure the 1x1 pixel covers the extracted region
      })
      .raw()
      .toBuffer();
    
    // The buffer will contain [r, g, b, a?] values for the single pixel
    const r = dominantColorBuffer[0];
    const g = dominantColorBuffer[1];
    const b = dominantColorBuffer[2];
    // Alpha might or might not be present depending on input, but hex usually doesn't include it

    const hexColor = rgbToHex(r, g, b);
    console.log(`Dominant background color extracted: ${hexColor}`);

    return NextResponse.json({
      backgroundColorHex: hexColor,
    });

  } catch (error) {
    console.error('Error in /api/get-background-color:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract background color' },
      { status: 500 }
    );
  }
} 