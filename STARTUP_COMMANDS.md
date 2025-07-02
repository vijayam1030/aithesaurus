# AI Thesaurus Startup Commands

This document contains all the commands needed to start and run the AI Thesaurus application with embedding provider selection.

## Prerequisites

- Node.js and npm installed
- Ollama running on localhost:11434
- PostgreSQL database configured (if using Prisma)

## Backend Server Commands

### Start Backend Development Server
```bash
# Navigate to the root directory
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus

# Install dependencies (if needed)
npm install

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:3001` with the following features:
- AI-powered word analysis
- Semantic search with multiple embedding providers
- Word2Vec model loading capability
- Ollama integration

### Backend API Endpoints
- `POST /api/analyze` - Comprehensive word analysis
- `POST /api/search/semantic` - Semantic search with provider selection
- `GET /api/providers` - Get available embedding providers
- `POST /api/providers/word2vec/load` - Load Word2Vec model
- `GET /health` - Health check

## Frontend Server Commands

### Start Frontend Development Server
```bash
# Navigate to the frontend directory
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus/frontend

# Install dependencies (if needed)
npm install

# Start the frontend server
npm run dev

# OR with specific port and host binding
npx next dev -H 0.0.0.0 -p 3000
```

The frontend will start on `http://localhost:3000` with:
- Interactive embedding provider selector
- Word analysis interface
- Semantic search with provider options
- Real-time provider status

## Full Startup Sequence

### Option 1: Two Terminal Windows

**Terminal 1 (Backend):**
```bash
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus/frontend
npx next dev -H 0.0.0.0 -p 3000
```

### Option 2: Background Processes

```bash
# Start backend in background
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run dev &

# Start frontend in background
cd frontend
npx next dev -H 0.0.0.0 -p 3000 &
```

## Troubleshooting Commands

### Check Running Processes
```bash
# Check what's running on ports
ss -tlnp | grep :300

# Check Next.js processes
ps aux | grep next

# Check node processes
ps aux | grep node
```

### Kill Processes if Needed
```bash
# Kill specific processes by PID
kill -9 <PID>

# Kill all Next.js processes
pkill -f "next"

# Kill all node processes (be careful!)
pkill -f "node"
```

### Check Port Availability
```bash
# Check if ports are in use
ss -tlnp | grep :3000
ss -tlnp | grep :3001

# Test if servers are responding
curl -I http://localhost:3001/health
curl -I http://localhost:3000
```

## Development Commands

### Type Checking
```bash
# Backend
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

### Building
```bash
# Backend
npm run build

# Frontend
cd frontend
npm run build
```

### Linting
```bash
# Backend
npm run lint

# Frontend
cd frontend
npm run lint
```

## Embedding Provider Configuration

### Using Ollama (Default)
- Ensure Ollama is running on `http://localhost:11434`
- Default models: `phi3:3.8b` (language), `nomic-embed-text` (embeddings)

### Using Word2Vec
1. Load a Word2Vec model through the frontend interface
2. Or use the API directly:
```bash
curl -X POST http://localhost:3001/api/providers/word2vec/load \
  -H "Content-Type: application/json" \
  -d '{"modelPath": "/path/to/your/word2vec/model.bin"}'
```

### Check Provider Status
```bash
curl http://localhost:3001/api/providers
```

## Application URLs

Once both servers are running:

- **Frontend Interface**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **Provider Status**: `http://localhost:3001/api/providers`

## Features Available

1. **Word Analysis Tab**: Complete word analysis with synonyms, antonyms, definitions
2. **Semantic Search Tab**: 
   - Embedding provider selector (Ollama vs Word2Vec)
   - Semantic similarity search
   - Provider configuration
3. **Context Analysis Tab**: Contextual word meaning analysis

## Notes

- The frontend includes proxy configuration to route `/api/*` requests to the backend
- CORS is configured to allow requests from `http://localhost:3000`
- All AI processing happens locally for privacy
- Word2Vec models need to be loaded manually via the interface or API
- Embedding provider selection is available in the Semantic Search tab

## Environment Variables

Optional environment variables you can set:

```bash
# Backend
export PORT=3001
export OLLAMA_HOST=http://localhost:11434
export DATABASE_URL="your_postgres_connection_string"

# Frontend
export NEXT_PUBLIC_API_URL=http://localhost:3001
export PORT=3000
```