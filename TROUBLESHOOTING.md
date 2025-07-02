# AI Thesaurus Troubleshooting Guide

## Current Issues and Solutions

### 🔴 Issue 1: Database Connection Failed
**Error**: `Can't reach database server at localhost:5432`

**Root Cause**: The main server requires PostgreSQL database but none is running.

**Solutions**:

#### Option A: Use Simplified Server (Recommended for Testing)
```bash
# Stop current servers
./start-servers.sh stop

# Start simplified backend (no database required)
npm run dev:simple

# Start frontend
cd frontend && npm run dev
```

#### Option B: Setup PostgreSQL Database
```bash
# Install PostgreSQL (Ubuntu/WSL)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create database and user
sudo -u postgres createdb ai_thesaurus
sudo -u postgres createuser username
sudo -u postgres psql -c "ALTER USER username PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_thesaurus TO username;"

# Run database migrations
npm run db:push
```

#### Option C: Use SQLite Instead (Fastest Setup)
1. Update `.env` file:
```env
DATABASE_URL="file:./dev.db"
```
2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
3. Run migrations:
```bash
npm run db:push
```

### 🔴 Issue 2: Ollama Model Too Slow
**Error**: Word analysis taking 30+ seconds or timing out

**Root Cause**: `phi3:3.8b` model is resource-intensive

**Solutions**:

#### Option A: Use Faster Model
```bash
# Switch to smaller, faster model
ollama pull tinyllama:1.1b

# Update .env file:
OLLAMA_MODEL="tinyllama:1.1b"
```

#### Option B: Increase Timeout
Update `frontend/app/hooks/useThesaurus.ts`:
```typescript
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes instead of 3
});
```

#### Option C: Test Ollama Directly
```bash
# Test if model is working
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "tinyllama:1.1b", "prompt": "What are synonyms for happy?", "stream": false}'
```

### 🔴 Issue 3: Frontend Not Loading
**Error**: `curl: (7) Failed to connect to localhost port 3000`

**Solutions**:

#### Check if Process is Running
```bash
ss -tlnp | grep :3000
ps aux | grep next
```

#### Restart Frontend
```bash
cd frontend
npm run dev -- --port 3000 --hostname 0.0.0.0
```

#### Alternative Frontend Start
```bash
# Try different port
npm run dev -- --port 3002

# Or use npx directly
npx next dev -p 3000 -H 0.0.0.0
```

## Current Working Configuration

### 1. Simplified Backend (No Database)
```bash
# Root directory
npm run dev:simple
```
**Features**: Basic word analysis, Ollama integration, no persistence

### 2. Frontend
```bash
# Frontend directory
npm run dev
```
**Access**: http://localhost:3000

### 3. Quick Test Commands
```bash
# Test backend health
curl http://localhost:3001/health

# Test Ollama connection
curl http://localhost:11434/api/tags

# Test word analysis (may be slow)
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"word":"test"}' \
  --max-time 60
```

## Recommended Setup for Immediate Use

1. **Use the simplified server** (no database required)
2. **Switch to a faster Ollama model** for testing
3. **Access the frontend** to test embedding provider selection

### Quick Start Commands
```bash
# Terminal 1: Simplified Backend
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run dev:simple

# Terminal 2: Frontend
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus/frontend  
npm run dev

# Terminal 3: Switch to faster model (optional)
ollama pull tinyllama:1.1b
```

## Feature Status

| Feature | Simplified Server | Full Server |
|---------|------------------|-------------|
| Word Analysis | ✅ (slow with phi3) | ✅ (with DB) |
| Semantic Search | ✅ | ✅ |
| Provider Selection | ✅ | ✅ |
| Data Persistence | ❌ | ✅ |
| Statistics | ❌ | ✅ |
| Caching | ✅ | ✅ |

## Next Steps

1. **Immediate**: Use simplified server for testing features
2. **Short-term**: Setup SQLite database for persistence
3. **Long-term**: Configure PostgreSQL for production use