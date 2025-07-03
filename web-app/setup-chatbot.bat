@echo off
echo 🤖 Setting up IDP Web App with Qwen Chatbot...

REM Check if .env file exists
if not exist ".env.local" (
    echo 📝 Creating .env.local file...
    copy .env.example .env.local >nul
    echo ⚠️  Please edit .env.local and add your Qwen API key!
    echo    Get your API key from: https://dashscope.console.aliyun.com/
) else (
    echo ✅ .env.local file already exists
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Start development server
echo 🚀 Starting development server...
echo    The floating chatbot will be available on all pages except login/signup
echo    Open http://localhost:3000 to see your application

npm run dev
