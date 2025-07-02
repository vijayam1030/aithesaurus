'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Zap, Brain, Activity, Lightbulb } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { SearchInput } from './components/SearchInput';
import { WordAnalysis } from './components/WordAnalysis';
import { SemanticSearch } from './components/SemanticSearch';
import { ContextualAnalysis } from './components/ContextualAnalysis';
import { StatsPanel } from './components/StatsPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useThesaurus } from './hooks/useThesaurus';
import { WordAnalysisResult } from './types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'semantic' | 'context'>('analyze');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextText, setContextText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<WordAnalysisResult | null>(null);

  const {
    analyzeWord,
    searchSemantic,
    analyzeContext,
    isLoading,
    error
  } = useThesaurus();

  const handleAnalyze = useCallback(async (word: string, context?: string) => {
    if (!word.trim()) {
      toast.error('Please enter a word to analyze');
      return;
    }

    // Clear previous results immediately when starting new analysis
    setAnalysisResult(null);
    setSearchQuery(word.trim());

    try {
      const result = await analyzeWord(word.trim(), context);
      setAnalysisResult(result);
      
      toast.success(`Analysis complete for "${word}"`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        toast.error('Analysis timed out. The model may still be processing - try the same word again in a few moments.');
      } else {
        toast.error('Failed to analyze word. Check console for details and try again.');
      }
    }
  }, [analyzeWord]);

  const handleSemanticSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    try {
      const results = await searchSemantic(query.trim());
      // Handle semantic search results
      toast.success(`Found ${results.length} similar words`);
    } catch (err) {
      toast.error('Semantic search failed. Please try again.');
    }
  }, [searchSemantic]);

  const handleContextAnalysis = useCallback(async (word: string, context: string) => {
    if (!word.trim() || !context.trim()) {
      toast.error('Please provide both word and context');
      return;
    }

    try {
      const result = await analyzeContext(word.trim(), context.trim());
      // Handle context analysis results
      toast.success('Context analysis complete');
    } catch (err) {
      toast.error('Context analysis failed. Please try again.');
    }
  }, [analyzeContext]);

  const tabs = [
    {
      id: 'analyze' as const,
      name: 'Word Analysis',
      icon: BookOpen,
      description: 'Get synonyms, antonyms, and definitions'
    },
    {
      id: 'semantic' as const,
      name: 'Semantic Search',
      icon: Brain,
      description: 'Find semantically similar words'
    },
    {
      id: 'context' as const,
      name: 'Context Analysis',
      icon: Lightbulb,
      description: 'Analyze words in specific contexts'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AI Thesaurus</h1>
                <p className="text-xs text-gray-500">Powered by Local AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Activity className="h-4 w-4 text-green-500" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <h2 className="text-4xl font-bold gradient-text">
                Discover Contextual Word Relationships
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore synonyms, antonyms, and contextual meanings using advanced AI models 
                running locally for privacy and speed.
              </p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {activeTab === 'analyze' && (
                  <div className="space-y-6">
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <BookOpen className="h-5 w-5 text-primary-600" />
                          <span>Word Analysis</span>
                        </h3>
                        <p className="text-gray-600">
                          Enter a word to get comprehensive analysis including synonyms, antonyms, and definitions.
                        </p>
                      </div>
                      <div className="card-body">
                        <SearchInput
                          onSearch={(word, context) => handleAnalyze(word, context)}
                          placeholder="Enter a word to analyze..."
                          showContext={true}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>

                    {isLoading && (
                      <div className="card">
                        <div className="card-body">
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center space-x-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                              <span className="text-gray-600">Analyzing word...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {analysisResult && !isLoading && (
                      <WordAnalysis result={analysisResult} onWordClick={handleAnalyze} />
                    )}
                  </div>
                )}

                {activeTab === 'semantic' && (
                  <div className="space-y-6">
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          <span>Semantic Search</span>
                        </h3>
                        <p className="text-gray-600">
                          Find words with similar meanings using advanced semantic understanding.
                        </p>
                      </div>
                      <div className="card-body">
                        <SearchInput
                          onSearch={(query) => handleSemanticSearch(query)}
                          placeholder="Enter a concept or phrase..."
                          showContext={false}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>

                    <SemanticSearch />
                  </div>
                )}

                {activeTab === 'context' && (
                  <div className="space-y-6">
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <Lightbulb className="h-5 w-5 text-yellow-600" />
                          <span>Contextual Analysis</span>
                        </h3>
                        <p className="text-gray-600">
                          Understand how words change meaning in different contexts.
                        </p>
                      </div>
                      <div className="card-body">
                        <ContextualAnalysis
                          onAnalyze={handleContextAnalysis}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-8"
              >
                <LoadingSpinner size="lg" text="Processing with AI..." />
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card border-red-200 bg-red-50"
              >
                <div className="card-body">
                  <div className="flex items-center space-x-2 text-red-700">
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <StatsPanel />
              
              {/* Tips Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Tips</h3>
                </div>
                <div className="card-body">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Use context for more accurate results</li>
                    <li>• Try domain-specific terms (medical, legal)</li>
                    <li>• Semantic search works with phrases</li>
                    <li>• All processing happens locally</li>
                  </ul>
                </div>
              </div>

              {/* Recent Searches */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Recent</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    {['happy', 'analyze', 'complex'].map((word) => (
                      <button
                        key={word}
                        onClick={() => handleAnalyze(word)}
                        className="block w-full text-left text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}