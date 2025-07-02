import * as word2vec from 'word2vec';
import { logger } from '@/utils/logger';
import { EmbeddingResult } from '@/types';

export interface Word2VecConfig {
  modelPath?: string;
  vectorSize?: number;
  minCount?: number;
  workers?: number;
  sg?: number;
  hs?: number;
  negative?: number;
  sample?: number;
  iter?: number;
}

class Word2VecService {
  private model: any = null;
  private isModelLoaded: boolean = false;
  private config: Word2VecConfig;
  private readonly modelName = 'word2vec';
  private readonly defaultVectorSize = 300;

  constructor(config: Word2VecConfig = {}) {
    this.config = {
      vectorSize: 300,
      minCount: 1,
      workers: 4,
      sg: 0,
      hs: 0,
      negative: 5,
      sample: 0.001,
      iter: 5,
      ...config
    };
  }

  async loadPretrainedModel(modelPath: string): Promise<void> {
    try {
      logger.info(`Loading Word2Vec model from: ${modelPath}`);
      
      return new Promise((resolve, reject) => {
        word2vec.loadModel(modelPath, (error: any, model: any) => {
          if (error) {
            logger.error('Failed to load Word2Vec model:', error);
            reject(error);
            return;
          }
          
          this.model = model;
          this.isModelLoaded = true;
          logger.info('Word2Vec model loaded successfully');
          resolve();
        });
      });
    } catch (error) {
      logger.error('Error loading Word2Vec model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.isModelLoaded) {
      throw new Error('Word2Vec model not loaded. Call loadPretrainedModel() first.');
    }

    try {
      // Word2Vec works with single words, so we'll take the first word or use the text as-is
      const word = text.toLowerCase().trim().split(' ')[0];
      
      return new Promise((resolve, reject) => {
        this.model.getVector(word, (error: any, vector: number[]) => {
          if (error) {
            // If word not found, return zero vector
            logger.debug(`Word "${word}" not found in Word2Vec model, returning zero vector`);
            const zeroVector = new Array(this.defaultVectorSize).fill(0);
            resolve({
              model: this.modelName,
              embedding: zeroVector,
              dimension: this.defaultVectorSize
            });
            return;
          }

          resolve({
            model: this.modelName,
            embedding: vector,
            dimension: vector.length
          });
        });
      });
    } catch (error) {
      logger.error(`Error generating Word2Vec embedding for "${text}":`, error);
      throw error;
    }
  }

  async getMostSimilar(word: string, limit: number = 10): Promise<Array<{word: string, similarity: number}>> {
    if (!this.isModelLoaded) {
      throw new Error('Word2Vec model not loaded. Call loadPretrainedModel() first.');
    }

    try {
      const cleanWord = word.toLowerCase().trim();
      
      return new Promise((resolve, reject) => {
        this.model.mostSimilar(cleanWord, limit, (error: any, results: any[]) => {
          if (error) {
            logger.debug(`No similar words found for "${word}" in Word2Vec model`);
            resolve([]);
            return;
          }

          const similarWords = results.map(result => ({
            word: result.word,
            similarity: result.dist
          }));

          resolve(similarWords);
        });
      });
    } catch (error) {
      logger.error(`Error finding similar words for "${word}":`, error);
      return [];
    }
  }

  async getVocabularySize(): Promise<number> {
    if (!this.isModelLoaded) {
      return 0;
    }

    try {
      return new Promise((resolve) => {
        // Word2Vec doesn't have a direct method to get vocab size
        // This is an approximation
        resolve(0); // Would need to be implemented based on the specific word2vec library
      });
    } catch (error) {
      logger.error('Error getting vocabulary size:', error);
      return 0;
    }
  }

  isLoaded(): boolean {
    return this.isModelLoaded;
  }

  getModelName(): string {
    return this.modelName;
  }

  getVectorSize(): number {
    return this.config.vectorSize || this.defaultVectorSize;
  }

  async trainModel(sentences: string[], outputPath: string): Promise<void> {
    try {
      logger.info('Training Word2Vec model...');
      
      return new Promise((resolve, reject) => {
        word2vec.word2vec(sentences.join('\n'), outputPath, this.config, (error: any) => {
          if (error) {
            logger.error('Failed to train Word2Vec model:', error);
            reject(error);
            return;
          }
          
          logger.info(`Word2Vec model trained and saved to: ${outputPath}`);
          resolve();
        });
      });
    } catch (error) {
      logger.error('Error training Word2Vec model:', error);
      throw error;
    }
  }
}

export const word2vecService = new Word2VecService();