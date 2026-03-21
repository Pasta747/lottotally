#!/bin/bash

# Vantage Deployment Script for Vercel
# This script prepares and deploys the Vantage application to Vercel

echo "Preparing Vantage for deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
  echo "Error: Must be run from the project root directory"
  exit 1
fi

# Ensure all dependencies are installed
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "Error: Build failed"
  exit 1
fi

echo "Build successful!"

# For Vercel deployment, we need to ensure environment variables are set
echo "Checking environment variables..."
if [ ! -f ".env.local" ]; then
  echo "Warning: .env.local not found. Using example values."
  echo "NEXTAUTH_URL=https://your-vantage-app.vercel.app" > .env.local
  echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
fi

echo "Deployment preparation complete!"
echo ""
echo "To deploy to Vercel:"
echo "1. Install Vercel CLI: npm install -g vercel"
echo "2. Login: vercel login"
echo "3. Deploy: vercel --prod"
echo ""
echo "Note: Ensure Vercel protection is disabled or bypass token is set for beta signup functionality."
