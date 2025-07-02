# AI Thesaurus - Technical Documentation

## 📋 **Overview**
A comprehensive AI-powered thesaurus application that provides contextual synonyms, antonyms, and word analysis using local AI models for privacy and speed.

---

## 🛠️ **Technology Stack**

### **Backend Technologies**
- **Runtime**: Node.js 22.x
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with pgvector extension (optional)
- **ORM**: Prisma (for database version)
- **AI Engine**: Ollama (local AI model serving)
- **Caching**: In-memory LRU cache with TTL
- **Process Manager**: tsx (TypeScript execution)

### **Frontend Technologies**
- **Framework**: Next.js 14.1.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

### **AI Models**
- **Language Model**: phi3:3.8b (2.2GB) - Fast inference
- **Embedding Model**: nomic-embed-text (274MB) - Vector embeddings
- **Alternative Models**: qwen2.5:14b, llama3.1:8b, gemma:2b, tinyllama:1.1b

### **Development Tools**
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Hot Reload**: Next.js dev server + tsx watch
- **Environment**: dotenv

---

## 🏗️ **Application Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   Word Analysis │  │ Semantic Search │  │ Context Analysis│
│  │      Tab        │  │      Tab        │  │      Tab       │
│  └─────────────────┘  └─────────────────┘  └───────────────│
│                           │                                │
│  ┌─────────────────────────────────────────────────────────│
│  │          React Query + Axios HTTP Client               │
│  └─────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
                              │ HTTP API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Express.js)                       │
│  ┌─────────────────────────────────────────────────────────│
│  │                 API Endpoints                           │
│  │  • POST /api/analyze     • GET /api/synonyms/:word     │
│  │  • GET /api/antonyms/:word • POST /api/context         │
│  │  • GET /api/definition/:word • GET /api/stats          │
│  └─────────────────────────────────────────────────────────│
│                              │                             │
│  ┌─────────────────────────────────────────────────────────│
│  │              Middleware Layer                           │
│  │  • CORS • Rate Limiting • Compression • Helmet        │
│  └─────────────────────────────────────────────────────────│
│                              │                             │
│  ┌─────────────────────────────────────────────────────────│
│  │               Service Layer                             │
│  │  ┌─────────────────┐  ┌─────────────────┐             │
│  │  │  Ollama Service │  │   Cache Service │             │
│  │  │  • AI Analysis  │  │  • LRU Cache    │             │
│  │  │  • Model Calls  │  │  • TTL Expiry   │             │
│  │  └─────────────────┘  └─────────────────┘             │
│  └─────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OLLAMA (AI Engine)                      │
│  ┌─────────────────────────────────────────────────────────│
│  │  Local AI Models (Running on localhost:11434)          │
│  │  • phi3:3.8b (Language Processing)                     │
│  │  • nomic-embed-text (Vector Embeddings)                │
│  └─────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Application Workflow**

### **1. User Interaction Flow**
```
User Input → Frontend Validation → API Request → Backend Processing → AI Analysis → Cache Storage → Response
```

### **2. Detailed Request Flow**

#### **Word Analysis Request**
1. **Frontend**: User enters word in search input
2. **Validation**: Frontend validates non-empty input
3. **State Management**: Clear previous results, set loading state
4. **HTTP Request**: POST to `/api/analyze` with word and optional context
5. **Backend Middleware**: CORS, rate limiting, request logging
6. **Service Layer**: Ollama service processes request
7. **AI Processing**: Multiple parallel calls to Ollama models
8. **Cache Strategy**: Results cached with TTL for performance
9. **Response**: Structured JSON with analysis results
10. **Frontend Update**: Display results with animations

#### **Cache Hit Flow**
1. **Cache Check**: Service checks in-memory cache first
2. **Key Lookup**: `analysis:{word}:{context}` format
3. **TTL Validation**: Ensure cache entry hasn't expired
4. **Instant Response**: Return cached data (< 1ms)

#### **Cache Miss Flow**
1. **AI Model Call**: Request sent to Ollama
2. **Parallel Processing**: Synonyms, antonyms, definition calls
3. **Result Aggregation**: Combine all AI responses
4. **Cache Storage**: Store with appropriate TTL
5. **Response**: Return complete analysis

---

## 💾 **Data Storage & Caching**

### **In-Memory Cache Structure**
```typescript
interface CacheEntry {
  key: string;           // Format: "analysis:{word}:{context}"
  data: any;            // Processed AI response
  timestamp: number;    // Creation timestamp
  ttl: number;         // Time to live in seconds
  hitCount: number;    // Access frequency
}
```

### **Cache Types & TTL**
- **Word Analysis**: 30 minutes (1800s)
- **Definitions**: 2 hours (7200s) 
- **Synonyms/Antonyms**: 30 minutes (1800s)
- **Health Check**: No cache
- **Stats**: No cache

### **Cache Keys Format**
- `analysis:{word}:{context}` - Complete word analysis
- `synonyms:{word}:{context}` - Synonym list
- `antonyms:{word}:{context}` - Antonym list  
- `definition:{word}:{partOfSpeech}` - Word definition

### **Cache Statistics Tracked**
```typescript
interface CacheStats {
  keys: number;         // Total cached entries
  hits: number;         // Cache hit count
  misses: number;       // Cache miss count
  hitRate: string;      // Hit percentage
  vsize: number;        // Memory usage estimate
}
```

---

## 🔍 **AI Processing Pipeline**

### **1. Word Analysis Process**
```
Input Word → Context Analysis → Model Selection → Parallel Processing → Result Aggregation
```

### **2. AI Model Calls**
```typescript
// Parallel AI processing
const [synonyms, antonyms, definition] = await Promise.all([
  generateSynonyms(word, context),
  generateAntonyms(word, context), 
  getDefinition(word, partOfSpeech)
]);
```

### **3. Model Optimization**
- **Model Size**: phi3:3.8b (2.2GB) for optimal speed/quality balance
- **Response Time**: 2-10 seconds for new words, <1ms for cached
- **Concurrent Requests**: Handled via connection pooling
- **Timeout Handling**: 3-minute timeout with polling fallback

### **4. Response Structure**
```typescript
interface WordAnalysisResult {
  word: string;
  definition: string;
  partOfSpeech: string;
  synonyms: RelatedWord[];
  antonyms: RelatedWord[];
  contexts: ContextualMeaning[];
  confidence: number;
}

interface RelatedWord {
  word: string;
  confidence: number;
  context?: string;
  sentiment?: number;
}
```

---

## 📊 **Performance Metrics**

### **Response Times**
- **Cache Hit**: < 1ms
- **New Word (phi3:3.8b)**: 2-10 seconds
- **New Word (qwen2.5:14b)**: 30-60 seconds
- **Health Check**: 2-5ms
- **Stats Endpoint**: 1-3ms

### **Memory Usage**
- **Base Application**: ~50MB
- **Cache (1000 entries)**: ~10-20MB
- **AI Model (phi3:3.8b)**: ~2.2GB VRAM
- **Total System**: ~2.3GB

### **Cache Performance**
- **Hit Rate**: 85-95% after warm-up
- **TTL Strategy**: Balances freshness vs performance
- **Memory Efficiency**: LRU eviction prevents overflow

---

## 🔒 **Security & Rate Limiting**

### **Security Measures**
- **CORS**: Configured for localhost development
- **Helmet**: Security headers protection
- **Input Validation**: Sanitize user inputs
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Request Size**: Limited to 10MB

### **Rate Limiting Configuration**
```typescript
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100,           // Requests allowed
  duration: 900,         // Per 15 minutes
});
```

---

## 🚀 **Deployment & Configuration**

### **Environment Variables**
```bash
# Database (Optional)
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_thesaurus"

# Ollama Configuration
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="phi3:3.8b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"

# Server
PORT=3001
NODE_ENV=development

# Performance
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL_SECONDS=3600
CONFIDENCE_THRESHOLD=0.7
```

### **Development Servers**
- **Backend**: `npm run dev:simple` (localhost:3001)
- **Frontend**: `npm run dev` (localhost:3000)
- **Ollama**: Auto-started service (localhost:11434)

### **Production Considerations**
- **Process Manager**: PM2 or Docker containers
- **Database**: PostgreSQL with pgvector for vector search
- **Caching**: Redis for distributed cache
- **Load Balancer**: Nginx for multiple instances
- **Monitoring**: Application performance monitoring
- **Backup**: Database and model checkpoint backups

---

## 📈 **Monitoring & Logging**

### **Logging Structure**
- **Request Logs**: Method, path, status, duration
- **Cache Logs**: Hit/miss, key operations, TTL events
- **Error Logs**: Detailed error tracking with stack traces
- **Performance Logs**: AI model response times

### **Health Monitoring**
- **Health Endpoint**: `/health` - System status check
- **Stats Endpoint**: `/api/stats` - Cache and system metrics
- **Ollama Status**: Model availability verification

### **Log Levels**
- **DEBUG**: Cache operations, detailed flow
- **INFO**: Request/response, startup events
- **WARN**: Fallback operations, parsing issues  
- **ERROR**: Failed requests, system errors

---

## 🔄 **API Endpoints**

### **Core Analysis**
- `POST /api/analyze` - Complete word analysis
- `GET /api/synonyms/:word` - Get synonyms only
- `GET /api/antonyms/:word` - Get antonyms only
- `POST /api/context` - Contextual meaning analysis
- `GET /api/definition/:word` - Word definition

### **System Monitoring**
- `GET /health` - Health check
- `GET /api/stats` - System statistics

### **Request/Response Examples**
```typescript
// Request
POST /api/analyze
{
  "word": "brilliant",
  "context": "academic performance",
  "includeEmbeddings": true
}

// Response  
{
  "success": true,
  "data": {
    "word": "brilliant",
    "definition": "exceptionally clever or talented",
    "partOfSpeech": "adjective",
    "synonyms": [
      { "word": "exceptional", "confidence": 0.95 },
      { "word": "outstanding", "confidence": 0.92 }
    ],
    "antonyms": [
      { "word": "mediocre", "confidence": 0.88 },
      { "word": "ordinary", "confidence": 0.85 }
    ],
    "confidence": 0.94
  }
}
```

---

## 🎯 **Future Enhancements**

### **Performance Optimizations**
- **Model Quantization**: Reduce model size further
- **Batch Processing**: Handle multiple words simultaneously
- **Streaming Responses**: Real-time result streaming
- **Edge Caching**: CDN integration for static responses

### **Feature Expansions**
- **Multi-language Support**: International dictionary support
- **Voice Integration**: Speech-to-text input
- **API Key Management**: User authentication system
- **Advanced Analytics**: Usage pattern analysis
- **Mobile App**: React Native implementation

### **Infrastructure Improvements**
- **Kubernetes**: Container orchestration
- **Microservices**: Service decomposition
- **Event Streaming**: Real-time updates
- **ML Pipeline**: Continuous model improvement

---

**Generated**: July 2, 2025  
**Version**: 1.0.0  
**Author**: AI Thesaurus Development Team