export interface WordAnalysis {
  word: string;
  definition: string;
  partOfSpeech: string;
  synonyms: RelatedWord[];
  antonyms: RelatedWord[];
  contexts: ContextualMeaning[];
  confidence: number;
}

export interface RelatedWord {
  word: string;
  confidence: number;
  context?: string;
  similarity?: number;
}

export interface ContextualMeaning {
  context: string;
  meaning: string;
  domain?: string;
  sentiment?: number;
  examples?: string[];
}

export interface EmbeddingResult {
  embedding: number[];
  dimension: number;
  model: string;
}

export interface SemanticSearchResult {
  word: string;
  similarity: number;
  definition?: string;
  partOfSpeech?: string;
}

export interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface SearchQuery {
  word: string;
  context?: string;
  domain?: string;
  includeDefinitions?: boolean;
  maxResults?: number;
  minConfidence?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export enum WordRelationType {
  SYNONYM = 'SYNONYM',
  ANTONYM = 'ANTONYM',
  RELATED = 'RELATED',
  HYPERNYM = 'HYPERNYM',
  HYPONYM = 'HYPONYM'
}

export interface AIModelConfig {
  name: string;
  type: 'language' | 'embedding';
  contextLength: number;
  dimensions?: number;
  capabilities: string[];
}