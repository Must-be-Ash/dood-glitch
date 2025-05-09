'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Result {
  name: string;
  dataUrl: string;
}

export default function TestPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGlowingEyes, setUseGlowingEyes] = useState(true);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const endpoint = useGlowingEyes ? '/api/silhouette-with-eyes' : '/api/test';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Silhouette Conversion Test</h1>
        
        {/* Upload Section */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={useGlowingEyes}
                onChange={(e) => setUseGlowingEyes(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Add glowing eyes</span>
            </label>
          </div>
          
          <label className="block mb-4">
            <span className="text-gray-700">Upload an image to test:</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-2 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
          
          {isLoading && (
            <div className="text-blue-600">Processing image...</div>
          )}
          
          {error && (
            <div className="text-red-600 mt-2">{error}</div>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3 text-center">
                  {result.name}
                </h2>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={result.dataUrl}
                      alt={`Result using ${result.name}`}
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 