import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

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

    console.log('File received:', file.name, file.type, file.size);
    
    // Connect to the Gradio client
    const client = await Client.connect('skytnt/anime-remove-background');
    console.log('Connected to Gradio');
    
    // Convert File to Blob
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    console.log('Blob created:', blob.type, blob.size);

    // Call the /png endpoint which returns a PNG file
    console.log('Sending request to /png endpoint...');
    const result = await client.predict('/png', { 
      f: blob
    });
    console.log('Got result:', result);

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      console.error('Invalid data format:', result);
      throw new Error('Invalid response from background removal API');
    }

    const fileData = result.data[0];
    if (!fileData.url) {
      console.error('No URL in response:', fileData);
      throw new Error('No URL in API response');
    }

    // Get the processed image from the URL
    const response = await fetch(fileData.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch processed image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error in background removal:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    );
  }
} 