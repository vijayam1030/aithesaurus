import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import {
  WordAnalysisResult,
  SemanticSearchResult,
  ContextualMeaning,
  ApiResponse,
  SystemStats,
  BatchAnalysisResult,
  HealthStatus
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes for Ollama model responses (increased)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request/Response interceptors
api.interceptors.request.use(
  (config) => {
    // Add any auth headers or request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show toast for certain endpoints or status codes
    if (!error.config?.url?.includes('/health') && error.response?.status !== 429) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export function useThesaurus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Word Analysis
  const analyzeWordMutation = useMutation<
    ApiResponse<WordAnalysisResult>,
    Error,
    { word: string; context?: string; includeEmbeddings?: boolean }
  >(
    async ({ word, context, includeEmbeddings = false }) => {
      console.log(`Starting analysis for "${word}" with timeout: ${api.defaults.timeout}ms`);
      const response = await api.post('/api/analyze', {
        word,
        context,
        includeEmbeddings,
      });
      console.log(`Analysis completed for "${word}"`);
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        // Cache the result with more specific key including context
        const cacheKey = ['word-analysis', variables.word, variables.context || 'default'];
        queryClient.setQueryData(cacheKey, data.data);
      },
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Failed to analyze word');
      },
    }
  );

  // Semantic Search
  const semanticSearchMutation = useMutation<
    ApiResponse<SemanticSearchResult[]>,
    Error,
    { query: string; limit?: number; threshold?: number; provider?: string; model?: string }
  >(
    async ({ query, limit = 10, threshold = 0.7, provider = 'ollama', model }) => {
      const response = await api.post('/api/search/semantic', {
        query,
        limit,
        threshold,
        provider,
        model,
      });
      return response.data;
    },
    {
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Semantic search failed');
      },
    }
  );

  // Context Analysis
  const contextAnalysisMutation = useMutation<
    ApiResponse<ContextualMeaning[]>,
    Error,
    { word: string; context: string }
  >(
    async ({ word, context }) => {
      const response = await api.post('/api/context', {
        word,
        context,
      });
      return response.data;
    },
    {
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Context analysis failed');
      },
    }
  );

  // Get Synonyms
  const getSynonyms = useCallback(
    async (word: string, context?: string, limit: number = 10) => {
      const response = await api.get(`/api/synonyms/${word}`, {
        params: { context, limit },
      });
      return response.data;
    },
    []
  );

  // Get Antonyms
  const getAntonyms = useCallback(
    async (word: string, context?: string, limit: number = 10) => {
      const response = await api.get(`/api/antonyms/${word}`, {
        params: { context, limit },
      });
      return response.data;
    },
    []
  );

  // Get Definition
  const getDefinition = useCallback(
    async (word: string, partOfSpeech?: string) => {
      const response = await api.get(`/api/definition/${word}`, {
        params: { partOfSpeech },
      });
      return response.data;
    },
    []
  );

  // Batch Analysis
  const batchAnalysisMutation = useMutation<
    ApiResponse<BatchAnalysisResult>,
    Error,
    { words: string[]; context?: string; includeEmbeddings?: boolean }
  >(
    async ({ words, context, includeEmbeddings = false }) => {
      const response = await api.post('/api/batch/analyze', {
        words,
        context,
        includeEmbeddings,
      });
      return response.data;
    },
    {
      onError: (error: any) => {
        setError(error.response?.data?.message || 'Batch analysis failed');
      },
    }
  );

  // System Stats Query
  const { data: systemStats, refetch: refetchStats } = useQuery<ApiResponse<SystemStats>>(
    'system-stats',
    async () => {
      const response = await api.get('/api/stats');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 20000, // Consider stale after 20 seconds
      retry: 2,
    }
  );

  // Health Check Query
  const { data: healthStatus } = useQuery<ApiResponse<HealthStatus>>(
    'health-status',
    async () => {
      const response = await api.get('/health');
      return response.data;
    },
    {
      refetchInterval: 10000, // Check every 10 seconds
      retry: 1,
      staleTime: 5000,
    }
  );

  // Cache Management
  const clearCache = useCallback(
    async (pattern?: string) => {
      const response = await api.post('/api/cache/clear', { pattern });
      queryClient.invalidateQueries(); // Invalidate all queries
      toast.success('Cache cleared successfully');
      return response.data;
    },
    [queryClient]
  );

  // Main API methods
  const analyzeWord = useCallback(
    async (word: string, context?: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await analyzeWordMutation.mutateAsync({
          word,
          context,
          includeEmbeddings: true,
        });
        return result.data;
      } catch (error: any) {
        // If timeout or network error, try polling for the result
        console.log('Request failed, checking for cached result...', error.code, error.message);
        
        // Poll for the result every 5 seconds for up to 1 minute
        for (let i = 0; i < 12; i++) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          try {
            // Create a quick request with 10 second timeout to check cache
            const quickApi = axios.create({
              baseURL: API_BASE_URL,
              timeout: 10000, // 10 second timeout for cache checks
            });
            
            const pollResponse = await quickApi.post('/api/analyze', {
              word,
              context,
              includeEmbeddings: true,
            });
            
            if (pollResponse.data?.success && pollResponse.data?.data) {
              return pollResponse.data.data;
            }
          } catch (pollError) {
            // Continue polling
            console.log(`Polling attempt ${i + 1}/12 failed, continuing...`);
          }
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [analyzeWordMutation]
  );

  const searchSemantic = useCallback(
    async (query: string, limit?: number, threshold?: number, provider?: string, model?: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await semanticSearchMutation.mutateAsync({
          query,
          limit,
          threshold,
          provider,
          model,
        });
        return result.data;
      } finally {
        setIsLoading(false);
      }
    },
    [semanticSearchMutation]
  );

  const analyzeContext = useCallback(
    async (word: string, context: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await contextAnalysisMutation.mutateAsync({
          word,
          context,
        });
        return result.data;
      } finally {
        setIsLoading(false);
      }
    },
    [contextAnalysisMutation]
  );

  const batchAnalyze = useCallback(
    async (words: string[], context?: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await batchAnalysisMutation.mutateAsync({
          words,
          context,
          includeEmbeddings: true,
        });
        return result.data;
      } finally {
        setIsLoading(false);
      }
    },
    [batchAnalysisMutation]
  );

  return {
    // Main methods
    analyzeWord,
    searchSemantic,
    analyzeContext,
    batchAnalyze,
    
    // Individual API methods
    getSynonyms,
    getAntonyms,
    getDefinition,
    
    // Utility methods
    clearCache,
    refetchStats,
    
    // State
    isLoading: isLoading || analyzeWordMutation.isLoading || semanticSearchMutation.isLoading || contextAnalysisMutation.isLoading,
    error,
    
    // Data
    systemStats: systemStats?.data,
    healthStatus: healthStatus?.data,
    
    // Mutation states
    isAnalyzing: analyzeWordMutation.isLoading,
    isSearching: semanticSearchMutation.isLoading,
    isAnalyzingContext: contextAnalysisMutation.isLoading,
    isBatchAnalyzing: batchAnalysisMutation.isLoading,
  };
}