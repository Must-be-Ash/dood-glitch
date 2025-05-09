#!/bin/bash

# Create the ffmpeg directory if it doesn't exist
mkdir -p public/ffmpeg
 
# Download FFmpeg core files
curl -o public/ffmpeg/ffmpeg-core.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js
curl -o public/ffmpeg/ffmpeg-core.wasm https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm 