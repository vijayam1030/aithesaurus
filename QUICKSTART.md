# 🚀 Quick Start Guide

Get your AI Thesaurus up and running in 5 minutes!

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ with pgvector extension
- [ ] 16GB+ RAM (recommended for best performance)
- [ ] 10GB+ free disk space for AI models

## Option 1: Automated Setup (Recommended)

### 1. Run Setup Script
```bash
./setup.sh
```

This script will:
- ✅ Install Ollama (if needed)
- ✅ Download AI models (Qwen2.5:14b + nomic-embed-text)
- ✅ Install dependencies
- ✅ Setup database schema

### 2. Configure Database
Edit `.env` file:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/ai_thesaurus"
```

### 3. Apply Database Schema
```bash
npm run db:push
```

### 4. Start Services
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev
```

🎉 **Done!** Visit http://localhost:3000

---

## Option 2: Manual Setup

### 1. Install Ollama & Models
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Download models (in new terminal)
ollama pull qwen2.5:14b      # 8.4GB
ollama pull nomic-embed-text # 274MB
```

### 2. Setup Database
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your database URL

# Setup database
npm run db:generate
npm run db:push
```

### 3. Start Development
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🎯 Quick Test

### Test Backend API
```bash
curl http://localhost:3001/health
```

### Test Word Analysis
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"word": "happy", "context": "I feel happy today"}'
```

### Access Frontend
Open http://localhost:3000 and try analyzing words like:
- "brilliant" with context "The scientist made a brilliant discovery"
- "bank" with context "I went to the bank to deposit money"

---

## 🛠 Alternative Model Configurations

### Lightweight Setup (Lower RAM)
```bash
ollama pull llama3.3:8b      # 4.7GB instead of 8.4GB
```
Update `.env`:
```bash
OLLAMA_MODEL="llama3.3:8b"
```

### High-Performance Setup (More RAM)
```bash
ollama pull qwen2.5:32b      # 18GB for maximum accuracy
```

---

## 🚨 Common Issues & Solutions

### Issue: Ollama models not downloading
**Solution:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Restart if needed
pkill ollama && ollama serve
```

### Issue: Database connection failed
**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Install pgvector if missing
sudo apt install postgresql-14-pgvector
```

### Issue: Frontend won't start
**Solution:**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue: Out of memory errors
**Solution:**
- Use `llama3.3:8b` instead of `qwen2.5:14b`
- Close other applications
- Increase system swap space

---

## 📊 Performance Tips

### Optimal System Specs
- **CPU**: 8+ cores recommended
- **RAM**: 16GB+ (32GB for qwen2.5:32b)
- **Storage**: SSD recommended for model loading
- **GPU**: Optional (Ollama supports GPU acceleration)

### Speed Optimizations
```bash
# Enable GPU acceleration (if available)
ollama pull qwen2.5:14b-q4_0  # Quantized version for speed

# Adjust cache settings in .env
CACHE_TTL_SECONDS=7200
SEMANTIC_CACHE_THRESHOLD=0.9
```

---

## 🎉 You're Ready!

Your AI Thesaurus is now running with:
- ✅ **Backend API** at http://localhost:3001
- ✅ **Frontend UI** at http://localhost:3000  
- ✅ **Local AI models** for privacy and speed
- ✅ **Vector embeddings** for semantic search
- ✅ **Contextual analysis** for accurate meanings

### What to try next:
1. **Word Analysis**: Enter "brilliant" with context
2. **Semantic Search**: Search for "feeling of happiness"
3. **Context Analysis**: Compare "bank" in different sentences
4. **Batch Processing**: Analyze multiple words at once

### Need help?
- Check the full [README.md](README.md) for detailed documentation
- View API documentation at http://localhost:3001/api/stats
- Monitor system health at http://localhost:3001/health

Happy exploring! 🚀