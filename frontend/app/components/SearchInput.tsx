'use client';

import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchInputProps {
  onSearch: (query: string, context?: string) => void;
  placeholder?: string;
  showContext?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  onSearch,
  placeholder = 'Enter your search...',
  showContext = false,
  isLoading = false,
  className = ''
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [context, setContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), context.trim() || undefined);
    }
  }, [query, context, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setContext('');
    setShowContextInput(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="input w-full pl-10 pr-10 text-lg"
            disabled={isLoading}
            autoFocus
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Context Input Toggle */}
        {showContext && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowContextInput(!showContextInput)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showContextInput ? 'Hide Context' : 'Add Context'}
            </button>
            
            {context && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Context: {context.length} characters
              </span>
            )}
          </div>
        )}

        {/* Context Input */}
        {showContext && showContextInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add context to improve analysis accuracy..."
              className="textarea w-full resize-none"
              rows={3}
              disabled={isLoading}
            />
            <div className="text-xs text-gray-500 mt-1">
              Providing context helps the AI understand the specific meaning you're looking for.
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="btn btn-primary btn-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-5 w-5" />
            <span>{isLoading ? 'Processing...' : 'Analyze'}</span>
          </button>
          
          {query && (
            <div className="text-sm text-gray-500">
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> to search
            </div>
          )}
        </div>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {['happy', 'complex', 'analyze', 'brilliant', 'challenge'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion, context.trim() || undefined);
            }}
            className="btn btn-ghost btn-sm text-xs"
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}