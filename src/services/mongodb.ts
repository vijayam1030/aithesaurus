import { MongoClient, Db, Collection } from 'mongodb';
import { logger } from '@/utils/logger';

export interface WordDocument {
  _id?: string;
  word: string;
  definition?: string;
  partOfSpeech?: string;
  frequency: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordRelationDocument {
  _id?: string;
  word: string;
  relatedWord: string;
  type: 'SYNONYM' | 'ANTONYM' | 'RELATED';
  confidence: number;
  context?: string;
  createdAt: Date;
}

export interface WordEmbeddingDocument {
  _id?: string;
  word: string;
  model: string;
  embedding: number[];
  dimension: number;
  createdAt: Date;
}

export interface WordContextDocument {
  _id?: string;
  word: string;
  context: string;
  meaning: string;
  domain?: string;
  sentiment?: number;
  confidence: number;
  createdAt: Date;
}

class MongoDBService {
  private client: MongoClient;
  private db: Db;
  private words: Collection<WordDocument>;
  private relations: Collection<WordRelationDocument>;
  private embeddings: Collection<WordEmbeddingDocument>;
  private contexts: Collection<WordContextDocument>;

  constructor() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_thesaurus';
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      
      // Initialize collections
      this.words = this.db.collection<WordDocument>('words');
      this.relations = this.db.collection<WordRelationDocument>('word_relations');
      this.embeddings = this.db.collection<WordEmbeddingDocument>('word_embeddings');
      this.contexts = this.db.collection<WordContextDocument>('word_contexts');

      // Create indexes for better performance
      await this.createIndexes();
      
      logger.info('Connected to MongoDB successfully');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      // Word indexes
      await this.words.createIndex({ word: 1 }, { unique: true });
      await this.words.createIndex({ partOfSpeech: 1 });
      await this.words.createIndex({ frequency: -1 });

      // Relation indexes
      await this.relations.createIndex({ word: 1, type: 1 });
      await this.relations.createIndex({ relatedWord: 1 });
      await this.relations.createIndex({ confidence: -1 });

      // Embedding indexes
      await this.embeddings.createIndex({ word: 1, model: 1 }, { unique: true });
      await this.embeddings.createIndex({ model: 1 });

      // Context indexes
      await this.contexts.createIndex({ word: 1 });
      await this.contexts.createIndex({ domain: 1 });

      logger.info('MongoDB indexes created successfully');
    } catch (error) {
      logger.error('Failed to create indexes:', error);
    }
  }

  // Word operations
  async upsertWord(wordData: Partial<WordDocument>): Promise<WordDocument> {
    const now = new Date();
    const result = await this.words.findOneAndUpdate(
      { word: wordData.word },
      {
        $set: {
          ...wordData,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now,
          frequency: 1
        },
        $inc: {
          frequency: 1
        }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result.value!;
  }

  async findWord(word: string): Promise<WordDocument | null> {
    return await this.words.findOne({ word: word.toLowerCase() });
  }

  // Relation operations
  async saveSynonyms(word: string, synonyms: Array<{word: string, confidence: number, context?: string}>): Promise<void> {
    const operations = synonyms.map(synonym => ({
      updateOne: {
        filter: { word: word.toLowerCase(), relatedWord: synonym.word.toLowerCase(), type: 'SYNONYM' },
        update: {
          $set: {
            confidence: synonym.confidence,
            context: synonym.context,
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await this.relations.bulkWrite(operations);
    }
  }

  async saveAntonyms(word: string, antonyms: Array<{word: string, confidence: number, context?: string}>): Promise<void> {
    const operations = antonyms.map(antonym => ({
      updateOne: {
        filter: { word: word.toLowerCase(), relatedWord: antonym.word.toLowerCase(), type: 'ANTONYM' },
        update: {
          $set: {
            confidence: antonym.confidence,
            context: antonym.context,
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await this.relations.bulkWrite(operations);
    }
  }

  async getSynonyms(word: string, limit: number = 10): Promise<WordRelationDocument[]> {
    return await this.relations
      .find({ word: word.toLowerCase(), type: 'SYNONYM' })
      .sort({ confidence: -1 })
      .limit(limit)
      .toArray();
  }

  async getAntonyms(word: string, limit: number = 10): Promise<WordRelationDocument[]> {
    return await this.relations
      .find({ word: word.toLowerCase(), type: 'ANTONYM' })
      .sort({ confidence: -1 })
      .limit(limit)
      .toArray();
  }

  // Embedding operations
  async saveEmbedding(word: string, model: string, embedding: number[]): Promise<void> {
    await this.embeddings.findOneAndUpdate(
      { word: word.toLowerCase(), model },
      {
        $set: {
          embedding,
          dimension: embedding.length,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  async getEmbedding(word: string, model: string): Promise<WordEmbeddingDocument | null> {
    return await this.embeddings.findOne({ word: word.toLowerCase(), model });
  }

  // Semantic search using MongoDB vector similarity
  async findSimilarWords(queryEmbedding: number[], model: string, limit: number = 10, threshold: number = 0.7): Promise<Array<{word: string, similarity: number}>> {
    // MongoDB doesn't have native vector similarity, so we'll implement a simple approach
    // For production, consider using MongoDB Atlas Vector Search or a specialized vector DB
    
    const embeddings = await this.embeddings
      .find({ model })
      .limit(1000) // Limit for performance
      .toArray();

    const similarities = embeddings
      .map(doc => ({
        word: doc.word,
        similarity: this.calculateCosineSimilarity(queryEmbedding, doc.embedding)
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities;
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

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

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  // Context operations
  async saveContextualMeaning(word: string, contexts: Array<{
    context: string;
    meaning: string;
    domain?: string;
    sentiment?: number;
    confidence: number;
  }>): Promise<void> {
    const documents = contexts.map(ctx => ({
      word: word.toLowerCase(),
      ...ctx,
      createdAt: new Date()
    }));

    if (documents.length > 0) {
      await this.contexts.insertMany(documents);
    }
  }

  async getContextualMeanings(word: string, limit: number = 5): Promise<WordContextDocument[]> {
    return await this.contexts
      .find({ word: word.toLowerCase() })
      .sort({ confidence: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Statistics
  async getStats(): Promise<{
    totalWords: number;
    totalRelations: number;
    totalEmbeddings: number;
    totalContexts: number;
    modelDistribution: Record<string, number>;
  }> {
    const [
      totalWords,
      totalRelations,
      totalEmbeddings,
      totalContexts,
      modelStats
    ] = await Promise.all([
      this.words.countDocuments(),
      this.relations.countDocuments(),
      this.embeddings.countDocuments(),
      this.contexts.countDocuments(),
      this.embeddings.aggregate([
        { $group: { _id: '$model', count: { $sum: 1 } } }
      ]).toArray()
    ]);

    const modelDistribution = modelStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalWords,
      totalRelations,
      totalEmbeddings,
      totalContexts,
      modelDistribution
    };
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    logger.info('Disconnected from MongoDB');
  }
}

export const mongoService = new MongoDBService();