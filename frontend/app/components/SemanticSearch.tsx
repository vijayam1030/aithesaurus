'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, ArrowRight, Zap } from 'lucide-react';
import { useThesaurus } from '../hooks/useThesaurus';
import { SemanticSearchResult } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { searchSemantic } = useThesaurus();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await searchSemantic(searchQuery, 15, 0.6);
      setResults(searchResults);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600 bg-green-100';
    if (similarity >= 0.8) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const exampleQueries = [
    'feeling of happiness and joy',
    'complex mathematical concepts',
    'fast-moving objects',
    'creative and innovative ideas',
    'difficult challenges'
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe a concept or meaning..."
            className="input w-full pl-10 pr-4 text-lg"
            disabled={isSearching}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="btn btn-secondary btn-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Search className="h-5 w-5" />
            <span>{isSearching ? 'Searching...' : 'Search Semantically'}</span>
          </button>
          
          <div className="text-sm text-gray-500">
            Find words by meaning, not just spelling
          </div>
        </div>
      </form>

      {/* Example Queries */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Try these examples:</h4>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example) => (
            <button
              key={example}
              onClick={() => {
                setQuery(example);
                handleSearch(example);
              }}
              className="btn btn-ghost btn-sm text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-700"
              disabled={isSearching}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="flex justify-center py-8">
          <LoadingSpinner 
            size="lg" 
            text="Analyzing semantic relationships..." 
          />
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>Semantic Results</span>
              </h3>
              <span className="badge badge-secondary">
                {results.length} matches
              </span>
            </div>

            <div className="grid gap-3">
              {results.map((result, index) => (
                <SemanticResultItem 
                  key={`${result.word}-${index}`} 
                  result={result} 
                  index={index}
                />
              ))}
            </div>

            {/* Explanation */}
            <div className="card bg-purple-50 border-purple-200">
              <div className="card-body">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-purple-800">
                    <h4 className="font-medium mb-1">How Semantic Search Works</h4>
                    <p>
                      These results are found using AI embeddings that understand meaning beyond exact word matches. 
                      Words with similar semantic meanings appear higher in the results, even if they don't share 
                      the same letters or roots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {!isSearching && query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No semantic matches found</h3>
          <p className="text-sm">
            Try rephrasing your query or using more descriptive terms.
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface SemanticResultItemProps {
  result: SemanticSearchResult;
  index: number;
}

function SemanticResultItem({ result, index }: SemanticResultItemProps) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-green-600 bg-green-100';
    if (similarity >= 0.8) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.9) return 'Excellent match';
    if (similarity >= 0.8) return 'Very good match';
    if (similarity >= 0.7) return 'Good match';
    return 'Partial match';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card hover:shadow-md transition-shadow group cursor-pointer"
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                {result.word}
              </span>
              {result.partOfSpeech && (
                <span className="badge badge-primary text-xs">
                  {result.partOfSpeech}
                </span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {getSimilarityLabel(result.similarity)}
            </span>
            <span className={`badge text-xs ${getSimilarityColor(result.similarity)}`}>
              {Math.round(result.similarity * 100)}%
            </span>
          </div>
        </div>
        
        {result.definition && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {result.definition}
          </p>
        )}
      </div>
    </motion.div>
  );
}