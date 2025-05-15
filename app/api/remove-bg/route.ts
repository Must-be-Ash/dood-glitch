import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

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

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Create prediction using the same model as in black/route.ts
    console.log('Starting background removal with 851-labs model...');
    const prediction = await replicate.predictions.create({
      version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      input: {
        image: dataUrl
      }
    });

    // Wait for the prediction to complete
    let result = await replicate.predictions.get(prediction.id);
    while (result.status !== "succeeded" && result.status !== "failed") {
      console.log(`Prediction status: ${result.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status === "failed") {
      throw new Error(`Model prediction failed: ${result.error}`);
    }

    if (!result.output) {
      throw new Error('No output received from model');
    }

    // Fetch the processed image
    console.log('Downloading processed image from Replicate...');
    const imageResponse = await fetch(result.output as string);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch processed image');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Background removal completed successfully');
    
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: { 
        'Content-Type': 'image/png'
      },
    });
  } catch (error) {
    console.error('Error in Replicate background removal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
} 