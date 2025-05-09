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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const imageBuffer = Buffer.from(bytes);
    
    // Process the image with Sharp
    console.log('Converting to black silhouette...');
    
    // Get image metadata first
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    // Create black silhouette using the inverted alpha mask method
    const blackSilhouette = await sharp(imageBuffer)
      .ensureAlpha()
      .extractChannel('alpha')
      .negate()
      .composite([{
        input: {
          create: {
            width: metadata.width,
            height: metadata.height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 255 }
          }
        },
        blend: 'dest-in'
      }])
      .png()
      .toBuffer();

    // Return the result
    return NextResponse.json({
      results: [
        {
          name: 'Black Silhouette',
          dataUrl: `data:image/png;base64,${blackSilhouette.toString('base64')}`
        }
      ]
    });

  } catch (error) {
    console.error('Error in image processing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
}
