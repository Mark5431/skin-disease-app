# DermaScope: Intelligent Skin Disease Detection and Monitoring System

**Beyond the Surface: A Multimodal AI System for Skin Disease Understanding and Diagnosis**

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/node.js-14+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🏥 Overview

DermaScope is a comprehensive AI-powered platform designed to assist healthcare professionals and individuals in the early detection and monitoring of skin diseases. The system combines cutting-edge deep learning technology with intuitive user interfaces to democratize access to dermatological knowledge and promote preventive healthcare.

### 🎯 Key Features

- **🔍 AI-Powered Detection**: Advanced CNN model trained on dermatological datasets
- **📱 Cross-Platform Access**: Responsive web application accessible on all devices
- **🧠 Educational Content**: Comprehensive skin health education and prevention tips
- **👥 User Management**: Secure user authentication and profile management
- **📊 Progress Tracking**: Monitor skin health changes over time
- **🔒 Privacy-First**: Minimal data storage with privacy-by-design principles

### 🩺 Supported Skin Conditions

The AI model can detect and classify 7 different types of skin lesions:

| Condition | Full Name | Description |
|-----------|-----------|-------------|
| **nv** | Melanocytic Nevi | Common moles (benign) |
| **mel** | Melanoma | Malignant skin cancer |
| **bkl** | Benign Keratosis-like Lesions | Non-cancerous skin growths |
| **bcc** | Basal Cell Carcinoma | Most common skin cancer |
| **akiec** | Actinic Keratoses | Pre-cancerous skin lesions |
| **vasc** | Vascular Lesions | Blood vessel-related skin conditions |
| **df** | Dermatofibroma | Benign fibrous skin nodules |

### 🏗️ System Architecture

DermaScope follows a modern microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Node.js API   │    │   Python API    │
│     (React)     │◄──►│   (Express)     │◄──►│   (FastAPI)     │
│                 │    │                 │    │                 │
│  • User Auth    │    │  • User Mgmt    │    │  • AI Model     │
│  • Image Upload │    │  • Data Storage │    │  • Inference    │
│  • Results UI   │    │  • Session Mgmt │    │  • Preprocessing│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    Database     │
                       │   (MongoDB)     │
                       └─────────────────┘
```

## 📁 Project Structure

```
skin-disease-app/
├── 📁 web-app/                 # Frontend React application
│   ├── src/                    # Source code
│   ├── public/                 # Static assets
│   └── package.json           # Dependencies
├── 📁 api/                     # Python ML inference API
│   ├── main.py                # FastAPI application
│   ├── model_infer.py         # Model inference logic
│   ├── requirements.txt       # Python dependencies
│   └── skin_cancer_model.pth  # Trained model weights
├── 📁 backend/                 # Node.js backend services
│   ├── healthcare-chat-api.js # Express API server
│   ├── package.json           # Node.js dependencies
│   └── database/              # Database schemas
├── 📁 cnn-model/              # Machine learning training
│   ├── model_train.ipynb      # Training notebook
│   ├── IDP_Data_Pipeline.ipynb # Data processing
│   └── experiments/           # Model experiments
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 14+** with npm
- **MongoDB** (local or cloud instance)
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/Mark5431/skin-disease-app.git
cd derma-scope/skin-disease-app
```

### 2. Set Up Backend Services

```bash
# Start MongoDB service (if local)
mongod

# Set up Node.js backend
cd backend
npm install
npm start
```

### 3. Set Up AI Model API

```bash
# Set up Python environment
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the model API
python main.py
```

### 4. Set Up Frontend

```bash
# Set up React application
cd web-app
npm install
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Model API**: http://localhost:8000

## 📊 Model Performance

Our AI model achieves excellent performance on dermatological image classification:

| Metric | Score |
|--------|-------|
| **Overall Accuracy** | 89% |
| **Weighted F1-Score** | 0.90 |
| **Macro F1-Score** | 0.71 |
| **Precision (Weighted)** | 0.91 |
| **Recall (Weighted)** | 0.89 |

**Best Performance Classes:**
- Melanocytic Nevi (nv): 96% F1-score
- Basal Cell Carcinoma (bcc): 83% F1-score
- Vascular Lesions (vasc): 82% F1-score

## 🌍 Sustainability & Impact

DermaScope aligns with UN Sustainable Development Goals:

- **SDG 3**: Good Health and Well-being - Early disease detection
- **SDG 4**: Quality Education - Dermatological knowledge democratization
- **SDG 9**: Industry Innovation - AI in healthcare
- **SDG 10**: Reduced Inequalities - Accessible healthcare technology

### Environment Variables

Create `.env` files in respective directories:

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/derma-scope
JWT_SECRET=your-secret-key
PORT=5000
```

**API (.env):**
```
MODEL_PATH=./skin_cancer_model.pth
PORT=8000
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⚠️ Medical Disclaimer**: This application is for educational and research purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.
