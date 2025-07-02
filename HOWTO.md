# How to Run the AI Thesaurus Program

## Quick Start Guide

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with pgvector extension
- Ollama for local AI models

### Running the Program

#### 1. Start Ollama Service
```bash
ollama serve
```

#### 2. Start Backend Server
```bash
# From the project root directory
npm run dev
```
*The backend will run on http://localhost:3001*

#### 3. Start Frontend Application
```bash
# Open a new terminal and navigate to frontend directory
cd frontend
npm run dev
```
*The frontend will run on http://localhost:3000*

#### Alternative: Simple Backend
For a lightweight version, use:
```bash
npm run dev:simple
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server (full version)
- `npm run dev:simple` - Start simple development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run start:simple` - Start simple production server

**Frontend:**
```bash
cd frontend
npm run dev    # Start development server
npm run build  # Build for production
npm run start  # Start production server
```

---

## How to Change AI Models

### Current Model Configuration
The system currently uses:
- **Language Model**: `phi3:3.8b` (set in .env)
- **Embedding Model**: `nomic-embed-text`

### Changing Models

#### Method 1: Environment Variables (.env file)
Edit the `.env` file in the project root:

```bash
# Change the language model
OLLAMA_MODEL="qwen2.5:14b"          # Recommended for best performance
# OR
OLLAMA_MODEL="llama3.3:8b"          # Lighter alternative

# Change the embedding model (optional)
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
```

#### Method 2: Available Model Options

**Recommended Language Models:**
- `qwen2.5:14b` - Best balance of performance and accuracy (8.4GB)
- `llama3.3:8b` - Faster, smaller model (4.7GB)
- `qwen2.5:32b` - Highest quality but requires more resources (18GB)

**Embedding Models:**
- `nomic-embed-text` - Default, fast and accurate (274MB)
- `all-minilm:l6-v2` - Alternative embedding model

#### Method 3: Installing New Models

1. **Pull the desired model:**
```bash
# For language models
ollama pull qwen2.5:14b
ollama pull llama3.3:8b
ollama pull qwen2.5:32b

# For embedding models
ollama pull nomic-embed-text
ollama pull all-minilm:l6-v2
```

2. **Verify model installation:**
```bash
ollama list
```

3. **Update your .env file** with the new model name

4. **Restart the backend server:**
```bash
npm run dev
```

### Model Performance Comparison

| Model | Size | Speed | Quality | RAM Required |
|-------|------|-------|---------|--------------|
| phi3:3.8b | 2.2GB | Fast | Good | 8GB+ |
| llama3.3:8b | 4.7GB | Medium | Very Good | 12GB+ |
| qwen2.5:14b | 8.4GB | Medium | Excellent | 16GB+ |
| qwen2.5:32b | 18GB | Slow | Best | 32GB+ |

### Configuration Files

The model configuration is handled in:
- **Environment**: `.env` file (main configuration)
- **Code**: `src/services/ollama.ts` (lines 15-16)
- **Fallback**: Default values in code if env vars not set

### Troubleshooting Model Changes

**Model not found error:**
```bash
# Check available models
ollama list

# Pull missing model
ollama pull [model-name]
```

**Out of memory errors:**
- Use a smaller model (phi3:3.8b or llama3.3:8b)
- Increase system RAM
- Close other applications

**Slow performance:**
- Ensure you're using SSD storage
- Use a smaller model for faster responses
- Check system resources (CPU/RAM usage)

### Testing Model Changes

After changing models, test the system:
1. Visit http://localhost:3000
2. Enter a test word (e.g., "happy")
3. Check that synonyms and antonyms are generated
4. Monitor the backend logs for any errors

The new model will be automatically used for all AI operations including synonym generation, antonym finding, and contextual analysis.