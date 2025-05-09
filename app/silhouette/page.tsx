import React from 'react';
import ImageUpload from '@/components/ImageUpload';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl text-black font-bold text-center mb-8">
          Silhouette Doods
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Upload an image to generate its silhouette version
        </p>
        <ImageUpload />
      </div>
    </main>
  );
}
 