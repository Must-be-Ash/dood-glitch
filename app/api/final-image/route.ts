import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
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

    const originalImageBuffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;

    // Convert original image to base64 for Replicate API
    const base64Image = originalImageBuffer.toString('base64');
    const dataUrl = `data:${fileType};base64,${base64Image}`;

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Step 1: Background Removal
    console.log('Step 1: Starting background removal with 851-labs model...');
    const prediction = await replicate.predictions.create({
      version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc", // 851-labs/background-remover
      input: {
        image: dataUrl
      }
    });

    let replicateResult = await replicate.predictions.get(prediction.id);
    while (replicateResult.status !== "succeeded" && replicateResult.status !== "failed") {
      console.log(`Replicate prediction status: ${replicateResult.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      replicateResult = await replicate.predictions.get(prediction.id);
    }

    if (replicateResult.status === "failed") {
      throw new Error(`Replicate model prediction failed: ${replicateResult.error}`);
    }

    if (!replicateResult.output) {
      throw new Error('No output received from Replicate model');
    }

    console.log('Downloading background-removed image from Replicate...');
    const transparentCharacterResponse = await fetch(replicateResult.output as string);
    if (!transparentCharacterResponse.ok) {
      throw new Error('Failed to fetch background-removed image');
    }
    const transparentCharacterBuffer = Buffer.from(await transparentCharacterResponse.arrayBuffer());
    console.log('Step 1: Background removal complete.');

    // Step 2: Create Black Silhouette with Transparent Background
    console.log('Step 2: Creating black silhouette...');
    const metadata = await sharp(transparentCharacterBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not determine dimensions of transparent character image');
    }

    const blackCharacterTransparentBg = await sharp(transparentCharacterBuffer)
        .ensureAlpha() // Ensure alpha channel exists
        .composite([{
            input: {
                create: {
                    width: metadata.width,
                    height: metadata.height,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 255 } // solid black
                }
            },
            blend: 'in' // Apply black color only to opaque parts, preserving original alpha
        }])
        .png()
        .toBuffer();
    console.log('Step 2: Black silhouette created.');

    // Step 3: Add Glowing Eyes to the Black Silhouette
    console.log('Step 3: Adding glowing eyes...');
    const eyeSize = Math.round(metadata.width * 0.075);
    const glowSize = Math.round(eyeSize * 2.5); 
    
    const eyeSvg = Buffer.from(`<svg width="${glowSize}" height="${glowSize}" viewBox="0 0 ${glowSize} ${glowSize}">
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

    const glowingEyeBuffer = await sharp({
      create: {
        width: glowSize,
        height: glowSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: eyeSvg,
      blend: 'screen'
    }])
    .modulate({
      brightness: 3.5,
      saturation: 0
    })
    .blur(1.2)
    .png()
    .toBuffer();

    const eyeY = Math.round(metadata.height * 0.41);
    const eyeSpacing = Math.round(metadata.width * 0.16);
    const centerX = Math.round(metadata.width * 0.625);

    const blackSilhouetteWithEyesBuffer = await sharp(blackCharacterTransparentBg)
      .composite([
        {
          input: glowingEyeBuffer,
          top: eyeY - Math.round(glowSize/2),
          left: centerX - eyeSpacing - Math.round(glowSize/2),
          blend: 'screen'
        },
        {
          input: glowingEyeBuffer,
          top: eyeY - Math.round(glowSize/2),
          left: centerX + eyeSpacing - Math.round(glowSize/2),
          blend: 'screen'
        }
      ])
      .png()
      .toBuffer();
    console.log('Step 3: Glowing eyes added.');

    // Step 4: Composite onto Original Background
    console.log('Step 4: Compositing onto original background...');
    const finalImageBuffer = await sharp(originalImageBuffer)
      .composite([{
        input: blackSilhouetteWithEyesBuffer,
        blend: 'over' // Overlay the silhouette with eyes onto the original image
      }])
      .png()
      .toBuffer();
    console.log('Step 4: Final image composited.');

    return new NextResponse(finalImageBuffer, {
      headers: { 
        'Content-Type': 'image/png'
      },
    });

  } catch (error) {
    console.error('Error in final image processing:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
} 