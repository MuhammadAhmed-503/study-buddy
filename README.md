# 🧠 AI Study Buddy

An intelligent study companion that transforms your learning experience using AI-powered features. Upload documents, get instant summaries, generate flashcards, and chat with your study material.

## ✨ Features

### 📄 **Smart Document Processing**
- Upload PDF, DOC, DOCX, and TXT files
- Automatic text extraction from documents
- Secure file storage with Supabase

### 🤖 **AI-Powered Learning Tools**
- **Intelligent Summaries**: Get concise overviews of your study material
- **Dynamic Flashcards**: Auto-generated Q&A pairs for active learning
- **Study Chat**: Ask questions and get explanations based on your content
- **Context-Aware Responses**: AI understands your uploaded material

### 📊 **Learning Dashboard**
- Track all your uploaded notes and materials
- View AI-generated summaries and flashcards
- Organize your study sessions
- Monitor learning progress

### 🔐 **Secure & Personal**
- User authentication with Supabase Auth
- Row-level security for all user data
- Private file storage and processing
- Persistent chat history

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** + **shadcn/ui** for modern UI
- **React Router** for navigation
- **TanStack Query** for state management

### Backend & AI
- **Supabase** for database, auth, and storage
- **Hugging Face API** for AI model integration
- **PDF.js** for PDF text extraction
- **Mammoth.js** for Word document processing

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code quality
- **PostCSS** for CSS processing
- **Bun** package manager

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ or Bun runtime
- Supabase account
- Hugging Face API key (optional, fallback included)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-study-buddy-18
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using bun
bun install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_GROK_API_KEY=your_grok_api_key
```

### 4. Database Setup
The Supabase database is pre-configured with:
- User authentication
- Notes storage with RLS
- Chat message history
- File storage buckets
- AI-generated content tables

### 5. Start Development Server
```bash
npm run dev
# or
bun dev
```

Visit `http://localhost:8080` to see your application.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthDialog.tsx  # Authentication forms
│   ├── ErrorBoundary.tsx # Error handling
│   └── Navigation.tsx  # Main navigation
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Database client & types
├── lib/               # Utility functions
├── pages/             # Route components
│   ├── Home.tsx       # Landing & file upload
│   ├── Dashboard.tsx  # Notes management
│   ├── Chat.tsx       # AI chat interface
│   └── NotFound.tsx   # 404 error page
└── services/          # Business logic & API calls
    ├── AIService.ts          # AI model integration
    ├── FileUploadService.ts  # File handling
    ├── TextExtractionService.ts # Document processing
    ├── NotesService.ts       # Notes CRUD operations
    ├── ChatService.ts        # Chat functionality
    ├── FlashcardsService.ts  # Flashcard management
    └── SummariesService.ts   # Summary management
```

## 🎯 Key Features Explained

### Document Upload & Processing
1. **Drag & Drop Interface**: Intuitive file upload with progress tracking
2. **Text Extraction**: Automatic content extraction from various file formats
3. **AI Processing**: Immediate summary and flashcard generation
4. **Storage**: Secure file storage in Supabase with user isolation

### AI Integration
- **Grok AI**: Powered by xAI's Grok model for high-quality responses
- **Context Awareness**: AI responses based on user's uploaded content
- **Multiple Features**: Summary generation, chat responses, flashcards, and quizzes
- **Smart Fallback**: Local generation when API is unavailable

### User Experience
- **Progressive Loading**: Smooth loading states throughout the app
- **Error Boundaries**: Graceful error handling and recovery
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live chat and dynamic content updates

## 🔧 Development Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Supabase Deployment
The database is already configured and deployed on Supabase with all necessary tables and RLS policies.

### Frontend Deployment
Build and deploy to your preferred platform:
```bash
npm run build
# Deploy the 'dist' folder to Vercel, Netlify, or any static host
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Hugging Face** for AI model access
- **shadcn/ui** for the component library
- **Lovable** for the initial project setup

---

**Start learning smarter with AI Study Buddy! 🎓✨**
