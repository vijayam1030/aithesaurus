import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import { logger } from '@/utils/logger';
import { cache } from '@/utils/cache';
import { ollamaService } from '@/services/ollama';
import { embeddingService } from '@/services/embedding';
import { WordAnalysis, SearchQuery, SemanticSearchResult } from '@/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // Convert to seconds
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const key = req.ip || 'unknown';
    await rateLimiter.consume(key);
    next();
  } catch (rateLimiterRes) {
    const remainingPoints = rateLimiterRes.remainingPoints || 0;
    const msBeforeNext = rateLimiterRes.msBeforeNext || 0;
    
    res.set({
      'Retry-After': Math.round(msBeforeNext / 1000) || 1,
      'X-RateLimit-Limit': process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      'X-RateLimit-Remaining': remainingPoints,
      'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(msBeforeNext / 1000)
    });
  }
};

app.use('/api', rateLimitMiddleware);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [dbStatus, ollamaStatus, cacheStats] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as connected`.then(() => true).catch(() => false),
      ollamaService.checkModelAvailability(),
      Promise.resolve(cache.getStats())
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        ollama: ollamaStatus ? 'available' : 'unavailable',
        cache: cacheStats
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// API Routes

// Comprehensive word analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { word, context, includeEmbeddings = false } = req.body;
    
    if (!word || typeof word !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Word is required and must be a string'
      });
    }

    const analysis = await ollamaService.performComprehensiveAnalysis(word, context);
    
    // Store or update word in database
    const wordRecord = await prisma.word.upsert({
      where: { word: word.toLowerCase() },
      update: {
        definition: analysis.definition,
        partOfSpeech: analysis.partOfSpeech,
        frequency: { increment: 1 }
      },
      create: {
        word: word.toLowerCase(),
        definition: analysis.definition,
        partOfSpeech: analysis.partOfSpeech,
        frequency: 1
      }
    });

    // Generate and store embedding if requested
    if (includeEmbeddings) {
      await embeddingService.generateAndStoreEmbedding(
        wordRecord.id,
        `${word}: ${analysis.definition}`
      );
    }

    res.json({
      success: true,
      data: analysis,
      metadata: {
        wordId: wordRecord.id,
        cached: false,
        processingTime: Date.now() - Date.now()
      }
    });

  } catch (error) {
    logger.error('Error in word analysis:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: 'Failed to analyze word. Please try again.'
    });
  }
});

// Semantic search
app.post('/api/search/semantic', async (req, res) => {
  try {
    const { query, limit = 10, threshold = 0.7 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Query is required and must be a string'
      });
    }

    const results = await embeddingService.findSimilarWords(query, limit, threshold);
    
    res.json({
      success: true,
      data: results,
      metadata: {
        query,
        resultsCount: results.length,
        threshold,
        cached: false
      }
    });

  } catch (error) {
    logger.error('Error in semantic search:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Failed to perform semantic search. Please try again.'
    });
  }
});

// Get synonyms
app.get('/api/synonyms/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const { context, limit = 10 } = req.query;
    
    const synonyms = await ollamaService.findSynonyms(
      word,
      context as string
    );
    
    res.json({
      success: true,
      data: synonyms.slice(0, parseInt(limit as string)),
      metadata: {
        word,
        context: context || null,
        totalFound: synonyms.length
      }
    });

  } catch (error) {
    logger.error('Error getting synonyms:', error);
    res.status(500).json({
      error: 'Synonyms retrieval failed',
      message: 'Failed to get synonyms. Please try again.'
    });
  }
});

// Get antonyms
app.get('/api/antonyms/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const { context, limit = 10 } = req.query;
    
    const antonyms = await ollamaService.findAntonyms(
      word,
      context as string
    );
    
    res.json({
      success: true,
      data: antonyms.slice(0, parseInt(limit as string)),
      metadata: {
        word,
        context: context || null,
        totalFound: antonyms.length
      }
    });

  } catch (error) {
    logger.error('Error getting antonyms:', error);
    res.status(500).json({
      error: 'Antonyms retrieval failed',
      message: 'Failed to get antonyms. Please try again.'
    });
  }
});

// Get contextual meaning
app.post('/api/context', async (req, res) => {
  try {
    const { word, context } = req.body;
    
    if (!word || !context) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Both word and context are required'
      });
    }

    const contextualMeanings = await ollamaService.analyzeContextualMeaning(word, context);
    
    res.json({
      success: true,
      data: contextualMeanings,
      metadata: {
        word,
        contextLength: context.length
      }
    });

  } catch (error) {
    logger.error('Error analyzing context:', error);
    res.status(500).json({
      error: 'Context analysis failed',
      message: 'Failed to analyze contextual meaning. Please try again.'
    });
  }
});

// Get word definition
app.get('/api/definition/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const { partOfSpeech } = req.query;
    
    const definition = await ollamaService.getDefinition(word, partOfSpeech as string);
    
    res.json({
      success: true,
      data: {
        word,
        definition,
        partOfSpeech: partOfSpeech || 'any'
      }
    });

  } catch (error) {
    logger.error('Error getting definition:', error);
    res.status(500).json({
      error: 'Definition retrieval failed',
      message: 'Failed to get definition. Please try again.'
    });
  }
});

// Batch operations
app.post('/api/batch/analyze', async (req, res) => {
  try {
    const { words, context, includeEmbeddings = false } = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Words array is required and must not be empty'
      });
    }

    if (words.length > 50) {
      return res.status(400).json({
        error: 'Too many words',
        message: 'Maximum 50 words allowed per batch'
      });
    }

    const results = await Promise.allSettled(
      words.map(word => ollamaService.performComprehensiveAnalysis(word, context))
    );
    
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<WordAnalysis>).value);
    
    const failed = results.filter(result => result.status === 'rejected').length;
    
    res.json({
      success: true,
      data: successful,
      metadata: {
        totalRequested: words.length,
        successful: successful.length,
        failed,
        context: context || null
      }
    });

  } catch (error) {
    logger.error('Error in batch analysis:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: 'Failed to perform batch analysis. Please try again.'
    });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [wordCount, embeddingStats, cacheStats] = await Promise.all([
      prisma.word.count(),
      embeddingService.getEmbeddingStats(),
      Promise.resolve(cache.getStats())
    ]);

    res.json({
      success: true,
      data: {
        words: {
          total: wordCount
        },
        embeddings: embeddingStats,
        cache: cacheStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Stats retrieval failed',
      message: 'Failed to get system statistics.'
    });
  }
});

// Cache management
app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      const deletedCount = cache.deletePattern(pattern);
      res.json({
        success: true,
        message: `Cleared ${deletedCount} cache entries matching pattern: ${pattern}`
      });
    } else {
      cache.flush();
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Cache clear failed',
      message: 'Failed to clear cache.'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    await prisma.$disconnect();
    await embeddingService.cleanup();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`AI Thesaurus API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Ollama host: ${process.env.OLLAMA_HOST}`);
  logger.info(`Language model: ${process.env.OLLAMA_MODEL}`);
  logger.info(`Embedding model: ${process.env.OLLAMA_EMBEDDING_MODEL}`);
});

export default app;