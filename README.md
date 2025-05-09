# alpAI Chat Bot

A modern, AI-powered chatbot application with voice capabilities, built using Next.js for the frontend and Python for the backend.

## 🌟 Features

- 💬 Real-time chat interface
- 🗣️ Text-to-Speech capabilities with Web Speech API
- 🎙️ Voice input support using react-speech-recognition
- 🔄 Multiple language support
- ⚡ Fast response times with optimized API calls
- 🎨 Modern and responsive UI with TailwindCSS
- 🔒 Secure API integration using axios
- 🎯 Context-aware conversations

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
