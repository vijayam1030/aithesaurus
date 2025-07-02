# Manual Server Start Commands

## Current Issue
The frontend server seems to have connectivity issues. Here are the steps to manually start both servers:

## Step 1: Start Backend (Working ✅)
```bash
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run dev
```
**Status**: Backend is currently running and healthy on http://localhost:3001

## Step 2: Start Frontend (Manual Required)

### Option A: WSL Terminal
```bash
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus/frontend
npm run dev
```

### Option B: Windows Command Prompt
```cmd
cd C:\Users\wanth\hharry\models\python\thesaurus\frontend
npm run dev
```

### Option C: PowerShell
```powershell
cd C:\Users\wanth\hharry\models\python\thesaurus\frontend
npm run dev
```

## Quick Status Check

### Backend Status
- URL: http://localhost:3001
- Health: http://localhost:3001/health
- Should return: `{"status":"healthy",...}`

### Frontend Status  
- URL: http://localhost:3000
- Should show: AI Thesaurus interface

## Troubleshooting Commands

### Kill All Processes and Restart
```bash
# Kill existing processes
pkill -f "next"
pkill -f "tsx"

# Wait a moment
sleep 3

# Start backend
cd /mnt/c/Users/wanth/hharry/models/python/thesaurus
npm run dev &

# Start frontend
cd frontend
npm run dev
```

### Alternative Frontend Start
If npm run dev doesn't work, try:
```bash
npx next dev -p 3000
```

Or with host binding:
```bash
npx next dev -H 0.0.0.0 -p 3000
```

## What Should Work Now

1. **Backend**: ✅ Running on port 3001
2. **Frontend**: ⚠️ Needs manual start on port 3000

## Features Available Once Running

- **Word Analysis**: Complete analysis with synonyms/antonyms
- **Semantic Search**: With embedding provider selector
- **Provider Selection**: Switch between Ollama and Word2Vec
- **Real-time AI**: All processing happens locally

## Notes

- Backend is stable and responding to health checks
- Frontend may need to be started from Windows terminal instead of WSL
- Once both are running, the embedding provider selector will be in the "Semantic Search" tab