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
    
    // Get image metadata first
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine image dimensions');
    }

    // Create black silhouette using our proven method
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

    // Create glowing eyes
    const eyeSize = Math.round(metadata.width * 0.075); // Increased base eye size (was 0.06)
    const glowSize = Math.round(eyeSize * 2.5); // Maintained glow area proportion
    
    // Create a complete circle for the eye with proper SVG structure
    const eye = Buffer.from(`<svg width="${glowSize}" height="${glowSize}" viewBox="0 0 ${glowSize} ${glowSize}">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur1"/>
          <feComposite in="blur1" operator="over"/>
        </filter>
      </defs>
      <circle 
        cx="${glowSize/2}" 
        cy="${glowSize/2}" 
        r="${eyeSize/2}"
        fill="white"
        filter="url(#glow)"
      />
    </svg>`);

    // Create the glowing eye effect
    const glowingEye = await sharp({
      create: {
        width: glowSize,
        height: glowSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: eye,
      blend: 'screen'
    }])
    .modulate({
      brightness: 3.5, // Increased brightness for stronger glow
      saturation: 0 // Ensure pure white
    })
    .blur(1.2) // Slightly increased blur for softer edges
    .png()
    .toBuffer();

    // Refined positions to match the reference image exactly
    const eyeY = Math.round(metadata.height * 0.41); // Maintained vertical position
    const eyeSpacing = Math.round(metadata.width * 0.16); // Maintained spacing
    const centerX = Math.round(metadata.width * 0.62); // Just a bit more right (was 0.58)
    
    // Composite the silhouette with glowing eyes
    const finalImage = await sharp(blackSilhouette)
      .composite([
        {
          input: glowingEye,
          top: eyeY - Math.round(glowSize/2),
          left: centerX - eyeSpacing - Math.round(glowSize/2),
          blend: 'screen' // Changed to screen blend mode for better glow
        },
        {
          input: glowingEye,
          top: eyeY - Math.round(glowSize/2),
          left: centerX + eyeSpacing - Math.round(glowSize/2),
          blend: 'screen' // Changed to screen blend mode for better glow
        }
      ])
      .png()
      .toBuffer();

    // Return the result
    return NextResponse.json({
      results: [
        {
          name: 'Silhouette with Glowing Eyes',
          dataUrl: `data:image/png;base64,${finalImage.toString('base64')}`
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