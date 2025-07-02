export interface WordAnalysisResult {
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

export interface SemanticSearchResult {
  word: string;
  similarity: number;
  definition?: string;
  partOfSpeech?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    [key: string]: any;
  };
  error?: string;
  message?: string;
}

export interface SystemStats {
  words: {
    total: number;
  };
  embeddings: {
    totalEmbeddings: number;
    modelDistribution: Record<string, number>;
    averageDimension: number;
  };
  cache: {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
    vsize: number;
  };
  system: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    timestamp: string;
  };
}

export interface SearchQuery {
  word: string;
  context?: string;
  domain?: string;
  includeDefinitions?: boolean;
  maxResults?: number;
  minConfidence?: number;
}

export interface BatchAnalysisRequest {
  words: string[];
  context?: string;
  includeEmbeddings?: boolean;
}

export interface BatchAnalysisResult {
  successful: WordAnalysisResult[];
  failed: number;
  totalRequested: number;
  context?: string;
}

export enum WordRelationType {
  SYNONYM = 'SYNONYM',
  ANTONYM = 'ANTONYM',
  RELATED = 'RELATED',
  HYPERNYM = 'HYPERNYM',
  HYPONYM = 'HYPONYM'
}

export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  error?: string;
  errorCode?: string;
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: string;
  vsize: number;
}

export interface ModelInfo {
  name: string;
  type: 'language' | 'embedding';
  contextLength: number;
  dimensions?: number;
  capabilities: string[];
  isAvailable: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    ollama: 'available' | 'unavailable';
    cache: CacheStats;
  };
}