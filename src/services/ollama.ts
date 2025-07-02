import { Ollama } from 'ollama';
import { EmbeddingResult, OllamaResponse, WordAnalysis, RelatedWord, ContextualMeaning } from '@/types';
import { logger } from '@/utils/logger';
import { cache } from '@/utils/cache';

class OllamaService {
  private ollama: Ollama;
  private languageModel: string;
  private embeddingModel: string;

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
    this.languageModel = process.env.OLLAMA_MODEL || 'qwen2.5:14b';
    this.embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const cacheKey = `embedding:${this.embeddingModel}:${text}`;
    const cached = cache.get<EmbeddingResult>(cacheKey);
    
    if (cached) {
      logger.debug(`Cache hit for embedding: ${text.substring(0, 50)}...`);
      return cached;
    }

    try {
      const response = await this.ollama.embeddings({
        model: this.embeddingModel,
        prompt: text
      });

      const result: EmbeddingResult = {
        embedding: response.embedding,
        dimension: response.embedding.length,
        model: this.embeddingModel
      };

      cache.set(cacheKey, result, 3600); // Cache for 1 hour
      return result;

    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  async findSynonyms(word: string, context?: string): Promise<RelatedWord[]> {
    const prompt = this.buildSynonymPrompt(word, context);
    const cacheKey = `synonyms:${word}:${context || 'default'}`;
    
    const cached = cache.get<RelatedWord[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.ollama.generate({
        model: this.languageModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 500
        }
      });

      const synonyms = this.parseSynonyms(response.response);
      cache.set(cacheKey, synonyms, 1800); // Cache for 30 minutes
      
      return synonyms;

    } catch (error) {
      logger.error(`Error finding synonyms for "${word}":`, error);
      throw new Error(`Failed to find synonyms: ${error}`);
    }
  }

  async findAntonyms(word: string, context?: string): Promise<RelatedWord[]> {
    const prompt = this.buildAntonymPrompt(word, context);
    const cacheKey = `antonyms:${word}:${context || 'default'}`;
    
    const cached = cache.get<RelatedWord[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.ollama.generate({
        model: this.languageModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 500
        }
      });

      const antonyms = this.parseAntonyms(response.response);
      cache.set(cacheKey, antonyms, 1800);
      
      return antonyms;

    } catch (error) {
      logger.error(`Error finding antonyms for "${word}":`, error);
      throw new Error(`Failed to find antonyms: ${error}`);
    }
  }

  async analyzeContextualMeaning(word: string, context: string): Promise<ContextualMeaning[]> {
    const prompt = this.buildContextAnalysisPrompt(word, context);
    const cacheKey = `context:${word}:${this.hashString(context)}`;
    
    const cached = cache.get<ContextualMeaning[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.ollama.generate({
        model: this.languageModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
          top_p: 0.8
        }
      });

      const contextualMeanings = this.parseContextualMeaning(response.response);
      cache.set(cacheKey, contextualMeanings, 2400); // Cache for 40 minutes
      
      return contextualMeanings;

    } catch (error) {
      logger.error(`Error analyzing contextual meaning for "${word}":`, error);
      throw new Error(`Failed to analyze contextual meaning: ${error}`);
    }
  }

  async getDefinition(word: string, partOfSpeech?: string): Promise<string> {
    const prompt = this.buildDefinitionPrompt(word, partOfSpeech);
    const cacheKey = `definition:${word}:${partOfSpeech || 'any'}`;
    
    const cached = cache.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.ollama.generate({
        model: this.languageModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.7
        }
      });

      const definition = this.parseDefinition(response.response);
      cache.set(cacheKey, definition, 7200); // Cache for 2 hours
      
      return definition;

    } catch (error) {
      logger.error(`Error getting definition for "${word}":`, error);
      throw new Error(`Failed to get definition: ${error}`);
    }
  }

  async performComprehensiveAnalysis(word: string, context?: string): Promise<WordAnalysis> {
    const cacheKey = `analysis:${word}:${context || 'default'}`;
    const cached = cache.get<WordAnalysis>(cacheKey);
    
    if (cached) return cached;

    try {
      // Parallel execution for better performance
      const [synonyms, antonyms, definition, contextualMeanings] = await Promise.all([
        this.findSynonyms(word, context),
        this.findAntonyms(word, context),
        this.getDefinition(word),
        context ? this.analyzeContextualMeaning(word, context) : Promise.resolve([])
      ]);

      const analysis: WordAnalysis = {
        word,
        definition,
        partOfSpeech: this.extractPartOfSpeech(definition),
        synonyms,
        antonyms,
        contexts: contextualMeanings,
        confidence: this.calculateOverallConfidence(synonyms, antonyms)
      };

      cache.set(cacheKey, analysis, 1800);
      return analysis;

    } catch (error) {
      logger.error(`Error performing comprehensive analysis for "${word}":`, error);
      throw new Error(`Failed to perform comprehensive analysis: ${error}`);
    }
  }

  private buildSynonymPrompt(word: string, context?: string): string {
    const contextPart = context ? `\nContext: "${context}"` : '';
    
    return `You are a linguistic expert. Find synonyms for the word "${word}".${contextPart}

Instructions:
- Provide 8-12 high-quality synonyms
- Include confidence score (0.0-1.0) for each synonym
- Consider the context if provided
- Format as JSON array with word and confidence
- Only include words that are true synonyms

Example format:
[
  {"word": "happy", "confidence": 0.9},
  {"word": "joyful", "confidence": 0.85}
]

Word: "${word}"
Synonyms:`;
  }

  private buildAntonymPrompt(word: string, context?: string): string {
    const contextPart = context ? `\nContext: "${context}"` : '';
    
    return `You are a linguistic expert. Find antonyms for the word "${word}".${contextPart}

Instructions:
- Provide 6-10 high-quality antonyms
- Include confidence score (0.0-1.0) for each antonym
- Consider the context if provided
- Format as JSON array with word and confidence
- Only include words that are true antonyms

Example format:
[
  {"word": "sad", "confidence": 0.9},
  {"word": "unhappy", "confidence": 0.8}
]

Word: "${word}"
Antonyms:`;
  }

  private buildContextAnalysisPrompt(word: string, context: string): string {
    return `Analyze the contextual meaning of "${word}" in this context: "${context}"

Instructions:
- Determine the specific meaning in this context
- Identify the domain (if applicable): medical, legal, technical, casual, etc.
- Assess sentiment (-1.0 to 1.0): negative to positive
- Provide 2-3 similar usage examples
- Format as JSON

Example format:
[
  {
    "context": "original context",
    "meaning": "specific meaning in this context",
    "domain": "domain category",
    "sentiment": 0.5,
    "examples": ["example 1", "example 2"]
  }
]

Analyze:`;
  }

  private buildDefinitionPrompt(word: string, partOfSpeech?: string): string {
    const posConstraint = partOfSpeech ? ` (${partOfSpeech})` : '';
    
    return `Provide a clear, concise definition for "${word}"${posConstraint}.

Instructions:
- Give the most common/primary definition
- Keep it under 50 words
- Be precise and clear
- Do not include examples in the definition

Word: "${word}"
Definition:`;
  }

  private parseSynonyms(response: string): RelatedWord[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          word: item.word,
          confidence: item.confidence || 0.5
        }));
      }
      
      // Fallback parsing for non-JSON responses
      return this.fallbackParseWords(response);
      
    } catch (error) {
      logger.warn('Failed to parse JSON response, using fallback parser');
      return this.fallbackParseWords(response);
    }
  }

  private parseAntonyms(response: string): RelatedWord[] {
    return this.parseSynonyms(response); // Same parsing logic
  }

  private parseContextualMeaning(response: string): ContextualMeaning[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      logger.warn('Failed to parse contextual meaning response');
      return [];
    }
  }

  private parseDefinition(response: string): string {
    return response.trim().replace(/^Definition:\s*/i, '').split('\n')[0];
  }

  private fallbackParseWords(response: string): RelatedWord[] {
    const words = response
      .split(/[,\n]/)
      .map(w => w.trim())
      .filter(w => w && /^[a-zA-Z\s-]+$/.test(w))
      .slice(0, 10);
      
    return words.map(word => ({
      word: word.toLowerCase(),
      confidence: 0.6
    }));
  }

  private extractPartOfSpeech(definition: string): string {
    const posPatterns = [
      /\b(noun|verb|adjective|adverb|preposition|conjunction|interjection)\b/i
    ];
    
    for (const pattern of posPatterns) {
      const match = definition.match(pattern);
      if (match) return match[1].toLowerCase();
    }
    
    return 'unknown';
  }

  private calculateOverallConfidence(synonyms: RelatedWord[], antonyms: RelatedWord[]): number {
    const allWords = [...synonyms, ...antonyms];
    if (allWords.length === 0) return 0;
    
    const avgConfidence = allWords.reduce((sum, word) => sum + word.confidence, 0) / allWords.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async checkModelAvailability(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      logger.error('Ollama is not available:', error);
      return false;
    }
  }
}

export const ollamaService = new OllamaService();