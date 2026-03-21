# Use Node.js 20 slim as base
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    curl \
    ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-download yt-dlp for Linux to avoid runtime failures
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Ensure session directory exists for persistence
RUN mkdir -p /app/session /app/downloads

# Expose the dashboard port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the bot using the optimized memory heap
CMD ["npm", "start"]
