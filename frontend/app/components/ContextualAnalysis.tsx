'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, FileText, Send } from 'lucide-react';

interface ContextualAnalysisProps {
  onAnalyze: (word: string, context: string) => void;
  isLoading: boolean;
}

export function ContextualAnalysis({ onAnalyze, isLoading }: ContextualAnalysisProps) {
  const [word, setWord] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() && context.trim()) {
      onAnalyze(word.trim(), context.trim());
    }
  };

  const examples = [
    {
      word: 'bank',
      context: 'I need to go to the bank to deposit my paycheck.',
      explanation: 'Financial institution vs. riverbank'
    },
    {
      word: 'run',
      context: 'The software needs to run on multiple platforms.',
      explanation: 'Execute vs. physical movement'
    },
    {
      word: 'mouse',
      context: 'My computer mouse is not working properly.',
      explanation: 'Computer device vs. animal'
    }
  ];

  const loadExample = (example: typeof examples[0]) => {
    setWord(example.word);
    setContext(example.context);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Word Input */}
        <div>
          <label htmlFor="word" className="block text-sm font-medium text-gray-700 mb-2">
            Word to analyze
          </label>
          <input
            type="text"
            id="word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word..."
            className="input w-full"
            disabled={isLoading}
          />
        </div>

        {/* Context Input */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Context or sentence
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide a sentence or context where this word is used..."
            className="textarea w-full"
            rows={4}
            disabled={isLoading}
          />
          <div className="text-xs text-gray-500 mt-1">
            The more context you provide, the more accurate the analysis will be.
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!word.trim() || !context.trim() || isLoading}
          className="btn btn-primary btn-lg w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
          <span>{isLoading ? 'Analyzing...' : 'Analyze Context'}</span>
        </button>
      </form>

      {/* Examples */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span>Try these examples:</span>
        </h4>
        
        <div className="space-y-3">
          {examples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card bg-gray-50 hover:bg-yellow-50 transition-colors cursor-pointer"
              onClick={() => loadExample(example)}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-primary-600">
                        {example.word}
                      </span>
                      <span className="text-xs text-gray-500">
                        {example.explanation}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 italic">
                      "{example.context}"
                    </p>
                  </div>
                  <FileText className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <h4 className="font-medium mb-1">About Contextual Analysis</h4>
              <p>
                Words often have multiple meanings depending on their context. Our AI analyzes 
                the surrounding text to determine the specific meaning, domain, and sentiment 
                of the word in that particular usage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}