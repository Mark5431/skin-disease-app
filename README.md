# DermaCare: Skin Disease Analysis Platform

Beyond the Surface: A Multimodal AI System for Skin Disease Understanding and Diagnosis

## Project Structure

This repository contains all components of the DermaCare platform:

- `web-app/`: Next.js frontend application
- `api/`: Python Flask API for model inference
- `backend/`: Node.js Express API for user management and database operations
- `cnn-model/`: CNN model training notebooks and resources
- `llm-model/`: LLM integration for explanations and information

## Overview

DermaCare is a comprehensive platform that utilizes AI to assist in the identification and understanding of skin conditions. The system combines:

1. **CNN Model**: For accurate image-based skin disease classification
2. **LLM Integration**: To provide detailed explanations and medical context
3. **Modern Web Interface**: For easy access and intuitive user experience

## Getting Started

Each component has its own setup instructions in its respective directory.

### Quick Start

1. Set up the backend API:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. Set up the model inference API:
   ```bash
   cd api
   pip install -r requirements.txt
   python main.py
   ```

3. Set up the web application:
   ```bash
   cd web-app
   npm install
   npm run dev
   ```

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
