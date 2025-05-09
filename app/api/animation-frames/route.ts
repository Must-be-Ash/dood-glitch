import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import sharp from 'sharp';

async function removeBackground(imageBuffer: Buffer, fileType: string): Promise<Buffer> {
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${fileType};base64,${base64Image}`;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  console.log('Removing background via Replicate...');
  const prediction = await replicate.predictions.create({
    version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
    input: { image: dataUrl },
  });

  let replicateResult = await replicate.predictions.get(prediction.id);
  while (replicateResult.status !== "succeeded" && replicateResult.status !== "failed") {
    console.log(`Replicate (BG Removal) status: ${replicateResult.status}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    replicateResult = await replicate.predictions.get(prediction.id);
  }

  if (replicateResult.status === "failed") throw new Error(`Replicate (BG Removal) failed: ${replicateResult.error}`);
  if (!replicateResult.output) throw new Error('No output from Replicate (BG Removal)');

  const response = await fetch(replicateResult.output as string);
  if (!response.ok) throw new Error('Failed to fetch background-removed image');
  console.log('Background removal successful.');
  return Buffer.from(await response.arrayBuffer());
}

async function createBlackSilhouetteWithEyes(baseTransparentBuffer: Buffer, metadata: sharp.Metadata): Promise<Buffer> {
  console.log('Creating black silhouette with eyes...');
  if (!metadata.width || !metadata.height) throw new Error('Silhouette: Could not get dimensions');

  // Ensure the input buffer for silhouette creation IS the transparent character image
  const blackSilhouette = await sharp(baseTransparentBuffer) // Use the direct output from background removal
    .ensureAlpha()
    .composite([{
      input: { create: { width: metadata.width, height: metadata.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } } },
      blend: 'in' // This blend mode uses the alpha of baseTransparentBuffer to mask the black color
    }])
    .png() // Ensure output is PNG to preserve transparency
    .toBuffer();

  const eyeSize = Math.round(metadata.width * 0.075);
  const glowSize = Math.round(eyeSize * 2.5);
  const eyeSvg = Buffer.from(
    `<svg width="${glowSize}" height="${glowSize}" viewBox="0 0 ${glowSize} ${glowSize}">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur1"/>
          <feComposite in="blur1" operator="over"/>
        </filter>
      </defs>
      <circle cx="${glowSize / 2}" cy="${glowSize / 2}" r="${eyeSize / 2}" fill="white" filter="url(#glow)"/>
    </svg>`
  );

  const glowingEyeBuffer = await sharp({ create: { width: glowSize, height: glowSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: eyeSvg, blend: 'screen' }])
    .modulate({ brightness: 3.5, saturation: 0 })
    .blur(1.2)
    .png()
    .toBuffer();

  const eyeYBase = Math.round(metadata.height * 0.405);
  const eyeXBase = Math.round(metadata.width * 0.62);
  const eyeSpacing = Math.round(metadata.width * 0.155);

  const leftEyeTop = eyeYBase + Math.round(metadata.height * 0.005);
  const leftEyeLeft = eyeXBase - eyeSpacing - Math.round(metadata.width * 0.008);

  const rightEyeTop = eyeYBase - Math.round(metadata.height * 0.010);
  const rightEyeLeft = eyeXBase + eyeSpacing - Math.round(metadata.width * 0.010);

  const finalSilhouette = await sharp(blackSilhouette)
    .composite([
      { input: glowingEyeBuffer, top: leftEyeTop - Math.round(glowSize / 2), left: leftEyeLeft - Math.round(glowSize / 2), blend: 'screen' },
      { input: glowingEyeBuffer, top: rightEyeTop - Math.round(glowSize / 2), left: rightEyeLeft - Math.round(glowSize / 2), blend: 'screen' },
    ])
    .png()
    .toBuffer();
  console.log('Black silhouette with eyes created.');
  return finalSilhouette;
}

async function addEyesToGrayscale(grayscaleBuffer: Buffer, metadata: sharp.Metadata): Promise<Buffer> {
  console.log('Adding eyes to gradient grayscale...');
  if (!metadata.width || !metadata.height) throw new Error('Grayscale: Could not get dimensions');

  const eyeSize = Math.round(metadata.width * 0.075);
  const glowSize = Math.round(eyeSize * 2.5);
  const eyeSvg = Buffer.from(
    `<svg width="${glowSize}" height="${glowSize}" viewBox="0 0 ${glowSize} ${glowSize}">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur1"/>
          <feComposite in="blur1" operator="over"/>
        </filter>
      </defs>
      <circle cx="${glowSize / 2}" cy="${glowSize / 2}" r="${eyeSize / 2}" fill="white" filter="url(#glow)"/>
    </svg>`
  );
  const glowingEyeBuffer = await sharp({ create: { width: glowSize, height: glowSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: eyeSvg, blend: 'screen' }])
    .modulate({ brightness: 3.5, saturation: 0 })
    .blur(1.2)
    .png()
    .toBuffer();

  const eyeYBase = Math.round(metadata.height * 0.405);
  const eyeXBase = Math.round(metadata.width * 0.62);
  const eyeSpacing = Math.round(metadata.width * 0.155);

  const leftEyeTop = eyeYBase + Math.round(metadata.height * 0.005);
  const leftEyeLeft = eyeXBase - eyeSpacing - Math.round(metadata.width * 0.008);

  const rightEyeTop = eyeYBase - Math.round(metadata.height * 0.010);
  const rightEyeLeft = eyeXBase + eyeSpacing - Math.round(metadata.width * 0.010);

  const finalGrayscaleWithEyes = await sharp(grayscaleBuffer)
    .ensureAlpha()
    .composite([
      { input: glowingEyeBuffer, top: leftEyeTop - Math.round(glowSize / 2), left: leftEyeLeft - Math.round(glowSize / 2), blend: 'screen' },
      { input: glowingEyeBuffer, top: rightEyeTop - Math.round(glowSize / 2), left: rightEyeLeft - Math.round(glowSize / 2), blend: 'screen' },
    ])
    .png()
    .toBuffer();
  console.log('Eyes added to gradient grayscale.');
  return finalGrayscaleWithEyes;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    const originalImageBuffer = Buffer.from(await file.arrayBuffer());
    
    // 1. Get character with transparent background
    console.log('--- Starting Frame Generation ---');
    const transparentCharacterBuffer = await removeBackground(originalImageBuffer, file.type);
    const metadata = await sharp(transparentCharacterBuffer).metadata(); // Get metadata from transparent image
    if (!metadata.width || !metadata.height) {
        throw new Error('Could not determine dimensions of transparent character image after BG removal');
    }

    // 2. Create a darker, gradient grayscale version of the transparent character
    console.log('Creating dark gradient grayscale version...');
    const gradientOverlay = await sharp({
        create: {
            width: metadata.width,
            height: metadata.height,
            channels: 4,
            // Dark gray at top (e.g., RGB 50,50,50), lighter gray at bottom (e.g., RGB 100,100,100)
            // This requires a gradient image. For simplicity, we'll use a two-tone approach
            // or a linear gradient if easily doable with Sharp. Let's try a simple darken and tint.
            // For a true gradient, we might need to generate an SVG or use a library that draws gradients.
            // Simplified: Darken significantly, then apply a subtle brightness modulation if needed.
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Start with transparent
        }
    })
    .composite([{
        input: Buffer.from(
            `<svg width="${metadata.width}" height="${metadata.height}">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:rgb(40,40,40);stop-opacity:1" />
                  <stop offset="100%" style="stop-color:rgb(90,90,90);stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grad)"/>
            </svg>`
        ),
        blend: 'over'
    }])
    .png()
    .toBuffer();

    const grayscaleCharacterBuffer = await sharp(transparentCharacterBuffer)
        .ensureAlpha()
        .grayscale() // Ensure it's truly monochrome
        .composite([{
            input: gradientOverlay,
            blend: 'multiply' // Darken the grayscale image with the gradient
        }])
        .modulate({ brightness: 0.8 }) // Further overall darkening
        .png()
        .toBuffer();

    // 3. Create black silhouette with eyes from the transparent character
    const silhouetteWithEyesBuffer = await createBlackSilhouetteWithEyes(transparentCharacterBuffer, metadata);

    // 4. Create grayscale version with eyes
    const grayscaleWithEyesBuffer = await addEyesToGrayscale(grayscaleCharacterBuffer, metadata);
    console.log('--- Frame Generation Complete ---');

    return NextResponse.json({
      original: `data:image/png;base64,${transparentCharacterBuffer.toString('base64')}`,
      grayscaleWithEyes: `data:image/png;base64,${grayscaleWithEyesBuffer.toString('base64')}`,
      silhouette: `data:image/png;base64,${silhouetteWithEyesBuffer.toString('base64')}`,
    });
  } catch (error) {
    console.error('Error in /api/animation-frames:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate animation frames' },
      { status: 500 }
    );
  }
} 