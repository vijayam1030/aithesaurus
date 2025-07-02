import { PrismaClient } from '@prisma/client';
import { ollamaService } from './ollama';
import { SemanticSearchResult, EmbeddingResult } from '@/types';
import { logger } from '@/utils/logger';
import { cache } from '@/utils/cache';

class EmbeddingService {
  private prisma: PrismaClient;
  private readonly similarityThreshold: number;
  private readonly maxResults: number;

  constructor() {
    this.prisma = new PrismaClient();
    this.similarityThreshold = parseFloat(process.env.SEMANTIC_CACHE_THRESHOLD || '0.85');
    this.maxResults = 20;
  }

  async generateAndStoreEmbedding(wordId: number, text: string, model?: string): Promise<void> {
    try {
      const embeddingResult = await ollamaService.generateEmbedding(text);
      
      await this.prisma.wordEmbedding.upsert({
        where: {
          wordId_model: {
            wordId,
            model: embeddingResult.model
          }
        },
        update: {
          embedding: embeddingResult.embedding,
          dimension: embeddingResult.dimension
        },
        create: {
          wordId,
          model: embeddingResult.model,
          embedding: embeddingResult.embedding,
          dimension: embeddingResult.dimension
        }
      });

      logger.debug(`Stored embedding for word ID ${wordId} with model ${embeddingResult.model}`);
    } catch (error) {
      logger.error(`Failed to generate and store embedding for word ID ${wordId}:`, error);
      throw error;
    }
  }

  async findSimilarWords(
    queryText: string, 
    limit: number = 10, 
    threshold: number = 0.7
  ): Promise<SemanticSearchResult[]> {
    const cacheKey = `semantic_search:${queryText}:${limit}:${threshold}`;
    const cached = cache.get<SemanticSearchResult[]>(cacheKey);
    
    if (cached) {
      logger.debug(`Cache hit for semantic search: ${queryText}`);
      return cached;
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await ollamaService.generateEmbedding(queryText);
      
      // Find similar embeddings using cosine similarity
      const similarWords = await this.findSimilarEmbeddings(
        queryEmbedding.embedding,
        queryEmbedding.model,
        limit,
        threshold
      );

      cache.set(cacheKey, similarWords, 1800); // Cache for 30 minutes
      return similarWords;

    } catch (error) {
      logger.error(`Error finding similar words for "${queryText}":`, error);
      throw new Error(`Failed to find similar words: ${error}`);
    }
  }

  private async findSimilarEmbeddings(
    queryEmbedding: number[],
    model: string,
    limit: number,
    threshold: number
  ): Promise<SemanticSearchResult[]> {
    try {
      // Use PostgreSQL with pgvector for efficient similarity search
      const query = `
        SELECT 
          w.word,
          w.definition,
          w.part_of_speech as "partOfSpeech",
          (1 - (we.embedding <=> $1::vector)) as similarity
        FROM word_embeddings we
        JOIN words w ON we.word_id = w.id
        WHERE we.model = $2
          AND (1 - (we.embedding <=> $1::vector)) >= $3
        ORDER BY we.embedding <=> $1::vector
        LIMIT $4
      `;

      const results = await this.prisma.$queryRawUnsafe(
        query,
        `[${queryEmbedding.join(',')}]`,
        model,
        threshold,
        limit
      ) as any[];

      return results.map(row => ({
        word: row.word,
        similarity: parseFloat(row.similarity),
        definition: row.definition,
        partOfSpeech: row.partOfSpeech
      }));

    } catch (error) {
      logger.error('Error executing similarity search query:', error);
      
      // Fallback to manual cosine similarity calculation
      return this.fallbackSimilaritySearch(queryEmbedding, model, limit, threshold);
    }
  }

  private async fallbackSimilaritySearch(
    queryEmbedding: number[],
    model: string,
    limit: number,
    threshold: number
  ): Promise<SemanticSearchResult[]> {
    logger.info('Using fallback similarity search');

    const embeddings = await this.prisma.wordEmbedding.findMany({
      where: { model },
      include: {
        word: {
          select: {
            word: true,
            definition: true,
            partOfSpeech: true
          }
        }
      },
      take: 1000 // Limit to avoid memory issues
    });

    const similarities = embeddings
      .map(embedding => {
        const similarity = this.calculateCosineSimilarity(
          queryEmbedding,
          embedding.embedding
        );
        
        return {
          word: embedding.word.word,
          similarity,
          definition: embedding.word.definition,
          partOfSpeech: embedding.word.partOfSpeech
        };
      })
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  async getEmbeddingStats(model?: string): Promise<{
    totalEmbeddings: number;
    modelDistribution: Record<string, number>;
    averageDimension: number;
  }> {
    try {
      const whereClause = model ? { model } : {};
      
      const [totalEmbeddings, modelStats, avgDimension] = await Promise.all([
        this.prisma.wordEmbedding.count({ where: whereClause }),
        this.prisma.wordEmbedding.groupBy({
          by: ['model'],
          _count: { id: true },
          where: whereClause
        }),
        this.prisma.wordEmbedding.aggregate({
          _avg: { dimension: true },
          where: whereClause
        })
      ]);

      const modelDistribution = modelStats.reduce((acc, stat) => {
        acc[stat.model] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEmbeddings,
        modelDistribution,
        averageDimension: avgDimension._avg.dimension || 0
      };

    } catch (error) {
      logger.error('Error getting embedding stats:', error);
      throw new Error(`Failed to get embedding stats: ${error}`);
    }
  }

  async batchGenerateEmbeddings(
    words: Array<{ id: number; word: string; definition?: string }>,
    model?: string
  ): Promise<void> {
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < words.length; i += batchSize) {
      batches.push(words.slice(i, i + batchSize));
    }

    logger.info(`Processing ${words.length} words in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.debug(`Processing batch ${i + 1}/${batches.length}`);

      const embeddings = await Promise.allSettled(
        batch.map(async (word) => {
          const text = word.definition ? `${word.word}: ${word.definition}` : word.word;
          return this.generateAndStoreEmbedding(word.id, text, model);
        })
      );

      const failed = embeddings.filter(result => result.status === 'rejected').length;
      if (failed > 0) {
        logger.warn(`${failed} embeddings failed in batch ${i + 1}`);
      }

      // Add a small delay between batches to avoid overwhelming the API
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Batch embedding generation completed');
  }

  async findSemanticallySimilarCachedQueries(
    query: string,
    threshold: number = 0.9
  ): Promise<string[]> {
    try {
      const queryEmbedding = await ollamaService.generateEmbedding(query);
      
      // This would require storing embeddings for cached queries
      // For now, return empty array - can be implemented if needed
      return [];
      
    } catch (error) {
      logger.error('Error finding semantically similar cached queries:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const embeddingService = new EmbeddingService();