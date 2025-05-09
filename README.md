# alpAI Chat Bot

A conversational AI assistant with voice capabilities, developed by Alper Aktaş.

## Features

- Real-time chat with AI
- Voice input and output
- Adjustable voice settings
- Streaming responses
- Modern and responsive UI

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- CUDA-capable GPU (recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chat-bot
```

2. Set up the backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

### Model Setup

You have two options for setting up the model:

#### Option 1: Download from Hugging Face (Recommended)

1. Install the Hugging Face CLI:
```bash
pip install huggingface_hub
```

2. Login to Hugging Face:
```bash
huggingface-cli login
```

3. The model will be automatically downloaded when you first run the application.

#### Option 2: Manual Download

1. Download the model files from [Qwen2.5-Coder-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct)
2. Create a `model` directory in the project root:
```bash
mkdir model
```
3. Place all downloaded model files in the `model` directory

## Running the Application

1. Start the backend server:
```bash
cd backend
python api.py
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Model Information

This application uses the Qwen2.5-Coder-0.5B-Instruct model, which has the following specifications:

- Parameters: 494M
- Context Length: 32,768 tokens
- Language Support: Multilingual (primarily English)
- License: Apache 2.0

For more information about the model, visit [Qwen2.5-Coder-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct).

## Troubleshooting

### Common Issues

1. **Model Loading Error**:
   - Ensure you have logged in to Hugging Face CLI
   - Check if you have sufficient disk space
   - Verify your internet connection

2. **CUDA Error**:
   - Make sure you have a compatible NVIDIA GPU
   - Install the latest NVIDIA drivers
   - Install CUDA toolkit

3. **Memory Issues**:
   - The model requires approximately 2GB of VRAM
   - Close other GPU-intensive applications
   - Consider using CPU mode if GPU memory is insufficient

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🛠️ Tech Stack

### Frontend
- Next.js (v15.3.2)
- React (v19.0.0)
- TypeScript (v5)
- TailwindCSS (v4)
- React Icons (v5.5.0)
- React Speech Recognition (v4.0.1)
- Axios (v1.9.0)

### Backend
- Python
- FastAPI
- LangChain
- CUDA support for GPU acceleration
- Jinja2 for templating

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher)
- CUDA-compatible GPU (optional, for better performance)
- npm or yarn

## 🚀 Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
py -3.10 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```
## 🏃‍♂️ Running the Application

### Backend
```bash
cd backend
python api.py
```

### Frontend
```bash
# Development with HTTP
npm run dev
# or
yarn dev

# Development with HTTPS (required for voice features)
npm run dev:https
# or
yarn dev:https
```

The application will be available at:
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3000`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `MODEL_PATH`: Path to the AI model
- `CUDA_VISIBLE_DEVICES`: GPU configuration
- `API_KEY`: Your https://huggingface.co/ API key
- Other configuration variables...


## 📁 Project Structure

```
.
├── backend/
│   ├── api.py
│   ├── chatbot.py
│   ├── template.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── styles/
│   ├── package.json
│   ├── server.js        # HTTPS development server
│   └── next.config.js
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Alper Aktaş**

## 🙏 Acknowledgments

- OpenAI for the underlying AI technology
- The open-source community for various tools and libraries used in this project 
