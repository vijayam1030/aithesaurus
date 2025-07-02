# AI Thesaurus - Local AI-Powered Synonyms & Antonyms

A comprehensive thesaurus application powered by local AI models using Ollama, featuring contextual word analysis, semantic search, and real-time synonym/antonym generation.

## 🚀 Features

### Core Capabilities
- **Contextual Word Analysis**: Get synonyms, antonyms, and definitions with context awareness
- **Semantic Search**: Find semantically similar words using vector embeddings
- **Contextual Meaning Analysis**: Understand how words change meaning in different contexts
- **Local AI Processing**: All processing happens locally using Ollama models
- **Vector Embeddings**: PostgreSQL with pgvector for efficient similarity search
- **Real-time Caching**: Intelligent caching for faster responses

### AI Models Integration
- **Language Model**: Qwen2.5:14b (recommended) or Llama 3.3:8b
- **Embedding Model**: nomic-embed-text for vector generation
- **Contextual Analysis**: Advanced prompting for domain-specific meanings
- **Confidence Scoring**: AI-generated confidence levels for all results

### Technical Features
- **TypeScript Backend**: Node.js + Express + Prisma
- **Modern Frontend**: Next.js 14 + Tailwind CSS + Framer Motion
- **Database**: PostgreSQL with pgvector extension
- **Caching**: Multi-level caching with semantic similarity
- **Rate Limiting**: API protection and resource management
- **Real-time Stats**: System monitoring and performance metrics

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 14+ with pgvector extension
- **Ollama** for local AI models
- **Git** for version control

### Recommended Models
- **Qwen2.5:14b** - Primary language model (8.4GB)
- **nomic-embed-text** - Embedding model (274MB)
- **Alternative**: Llama 3.3:8b (4.7GB) for lighter setup

## 🛠 Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-thesaurus
```

### 2. Install Ollama & Models
```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull qwen2.5:14b
ollama pull nomic-embed-text

# Verify installation
ollama list
```

### 3. Setup PostgreSQL with pgvector
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib

# Install pgvector extension
sudo apt install postgresql-14-pgvector

# Create database
sudo -u postgres createdb ai_thesaurus

# Enable pgvector extension
sudo -u postgres psql ai_thesaurus -c "CREATE EXTENSION vector;"
```

### 4. Backend Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/ai_thesaurus"

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### 5. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_thesaurus"

# Ollama Configuration
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:14b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TTL_SECONDS=3600
SEMANTIC_CACHE_THRESHOLD=0.85

# AI Configuration
MAX_CONTEXT_LENGTH=8192
EMBEDDING_DIMENSION=768
CONFIDENCE_THRESHOLD=0.7
```

### Recommended Ollama Models

#### Primary Setup (Recommended)
```bash
# Language Model - Best balance of performance and size
ollama pull qwen2.5:14b     # 8.4GB - Excellent language understanding

# Embedding Model - Optimized for semantic search
ollama pull nomic-embed-text # 274MB - Fast and accurate embeddings
```

#### Lightweight Setup
```bash
# Smaller language model for resource-constrained systems
ollama pull llama3.3:8b     # 4.7GB - Good performance, smaller size
ollama pull nomic-embed-text # 274MB
```

#### High-Performance Setup
```bash
# For maximum accuracy (requires more resources)
ollama pull qwen2.5:32b     # 18GB - Highest quality
ollama pull all-minilm:l6-v2 # Alternative embedding model
```

## 🚀 Usage

### 1. Start All Services
```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Backend
npm run dev

# Terminal 3: Start Frontend
cd frontend && npm run dev
```

### 2. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 3. API Endpoints

#### Word Analysis
```bash
POST /api/analyze
{
  "word": "happy",
  "context": "I feel happy about the results",
  "includeEmbeddings": true
}
```

#### Semantic Search
```bash
POST /api/search/semantic
{
  "query": "feeling of joy and contentment",
  "limit": 10,
  "threshold": 0.7
}
```

#### Get Synonyms
```bash
GET /api/synonyms/happy?context=emotion&limit=10
```

#### Get Antonyms
```bash
GET /api/antonyms/happy?context=emotion&limit=10
```

#### Contextual Analysis
```bash
POST /api/context
{
  "word": "bank",
  "context": "I went to the bank to deposit money"
}
```

## 🎯 Advanced Features

### Contextual Understanding
The AI analyzes context to provide accurate meanings:
- **Domain Detection**: Medical, legal, technical, casual
- **Sentiment Analysis**: Positive, negative, neutral scoring
- **Usage Examples**: Real-world usage patterns

### Semantic Search
Find words by meaning, not just spelling:
- **Vector Embeddings**: 768-dimensional semantic representations
- **Similarity Scoring**: Cosine similarity with confidence levels
- **Cross-domain Search**: Find related concepts across domains

### Performance Optimization
- **Multi-level Caching**: Memory, semantic, and database caching
- **Batch Processing**: Analyze multiple words simultaneously
- **Rate Limiting**: Protect against API abuse
- **Connection Pooling**: Efficient database connections

## 📊 Monitoring

### System Stats Endpoint
```bash
GET /api/stats
```

Returns:
- Word count and database statistics
- Embedding model distribution
- Cache hit rates and performance
- System memory and uptime
- AI model availability

### Health Check
```bash
GET /health
```

Returns:
- Database connectivity
- Ollama availability
- Cache statistics
- Overall system health

## 🔍 Example Queries

### Basic Word Analysis
```javascript
// Analyze a word with context
const analysis = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    word: 'brilliant',
    context: 'The scientist made a brilliant discovery',
    includeEmbeddings: true
  })
});
```

### Semantic Search
```javascript
// Find semantically similar words
const results = await fetch('/api/search/semantic', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'complex problem solving',
    limit: 15,
    threshold: 0.6
  })
});
```

## 🛠 Development

### Available Scripts
```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Next.js linter
npm run typecheck    # Run TypeScript checks
```

### Database Management
```bash
# Reset database
npm run db:push --force-reset

# View database in browser
npm run db:studio

# Generate migration
npx prisma migrate dev --name init
```

### Adding New Models
```bash
# Pull new model
ollama pull model-name

# Update environment variables
OLLAMA_MODEL="new-model-name"

# Restart services
npm run dev
```

## 🚀 Deployment

### Production Environment
```bash
# Build applications
npm run build
cd frontend && npm run build

# Set production environment
NODE_ENV=production

# Use PM2 for process management
npm install -g pm2
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale api=3
```

## 📈 Performance Tips

### Optimize Model Usage
- Use **qwen2.5:14b** for best balance of speed and accuracy
- Consider **llama3.3:8b** for faster responses on limited hardware
- Keep embedding model (**nomic-embed-text**) for consistent performance

### Database Optimization
- Enable pgvector indexes for faster similarity search
- Use connection pooling for high-traffic scenarios
- Regular VACUUM and ANALYZE for optimal performance

### Caching Strategy
- Semantic caching reduces redundant AI calls
- Memory caching for frequently accessed data
- Database query result caching

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** - Local AI model serving
- **Qwen Team** - Advanced language models
- **PostgreSQL & pgvector** - Vector database capabilities
- **Next.js & Tailwind** - Modern web development
- **Prisma** - Type-safe database access

## 🆘 Troubleshooting

### Common Issues

#### Ollama Not Starting
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
ollama serve
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql "postgresql://username:password@localhost:5432/ai_thesaurus"
```

#### Model Not Found
```bash
# List available models
ollama list

# Pull missing model
ollama pull qwen2.5:14b
```

#### Performance Issues
- Ensure sufficient RAM (16GB+ recommended for qwen2.5:14b)
- Use SSD storage for better model loading
- Monitor CPU usage during AI processing

For more issues, check the [Issues](../../issues) page or create a new one.