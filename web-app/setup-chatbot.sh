#!/bin/bash

# IDP Web App Chatbot Setup Script

echo "🤖 Setting up IDP Web App with Qwen Chatbot..."

# Check if .env file exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local and add your Qwen API key!"
    echo "   Get your API key from: https://dashscope.console.aliyun.com/"
else
    echo "✅ .env.local file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if development server is already running
echo "🚀 Starting development server..."
echo "   The floating chatbot will be available on all pages except login/signup"
echo "   Open http://localhost:3000 to see your application"

npm run dev
