#!/bin/bash

# Sundai Hackathon API Deployment Script
echo "🚀 Sundai Hackathon API Deployment Script"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your environment variables first."
    echo "You can copy from env.example and fill in your values."
    exit 1
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Setup database
echo "🗄️ Setting up database..."
npm run setup

# Build frontend
echo "🏗️ Building frontend..."
npm run frontend:build

echo "✅ Build completed successfully!"
echo ""
echo "🎉 Your Sundai Hackathon API is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Choose a deployment platform:"
echo "   - Render (recommended): https://render.com"
echo "   - Vercel + Railway: https://vercel.com + https://railway.app"
echo "   - Heroku: https://heroku.com"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🔗 Quick deploy with Render:"
echo "1. Go to https://render.com"
echo "2. Connect your GitHub repo"
echo "3. Create a new Web Service"
echo "4. Set environment variables from your .env file"
echo "5. Deploy!" 