import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Simple, high-quality processing
    const processedImageBuffer = await sharp(buffer)
      // Preserve size with high-quality resize
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: 'lanczos3'
      })
      .grayscale()
      // Very minimal contrast adjustment
      .linear(1.2, -0.1)
      // Light smoothing
      .blur(0.3)
      // Clean threshold
      .threshold(142)
      // High-quality output
      .png({
        quality: 100,
        compressionLevel: 9,
        force: true
      })
      .toBuffer();

    return new NextResponse(processedImageBuffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 