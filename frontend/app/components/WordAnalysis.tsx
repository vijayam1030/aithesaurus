'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ThumbsUp, ThumbsDown, Brain, Tag, Target } from 'lucide-react';
import { WordAnalysisResult, RelatedWord, ContextualMeaning } from '../types';

interface WordAnalysisProps {
  result: WordAnalysisResult;
  onWordClick?: (word: string) => void;
}

export function WordAnalysis({ result, onWordClick }: WordAnalysisProps) {
  const { word, definition, partOfSpeech, synonyms, antonyms, contexts, confidence } = result;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return 'text-gray-600 bg-gray-100';
    if (sentiment > 0.2) return 'text-green-600 bg-green-100';
    if (sentiment < -0.2) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Main Word Info */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{word}</h2>
              {partOfSpeech && (
                <span className="badge badge-primary">
                  {partOfSpeech}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Confidence:</span>
              <span className={`badge ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-start space-x-3">
            <BookOpen className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Definition</h3>
              <p className="text-gray-700 leading-relaxed">{definition}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synonyms */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              <span>Synonyms</span>
              <span className="badge badge-secondary text-xs">
                {synonyms.length}
              </span>
            </h3>
          </div>
          <div className="card-body">
            {synonyms.length > 0 ? (
              <div className="space-y-2">
                {synonyms.map((synonym, index) => (
                  <RelatedWordItem key={index} word={synonym} type="synonym" onWordClick={onWordClick} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No synonyms found</p>
            )}
          </div>
        </div>

        {/* Antonyms */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              <span>Antonyms</span>
              <span className="badge badge-secondary text-xs">
                {antonyms.length}
              </span>
            </h3>
          </div>
          <div className="card-body">
            {antonyms.length > 0 ? (
              <div className="space-y-2">
                {antonyms.map((antonym, index) => (
                  <RelatedWordItem key={index} word={antonym} type="antonym" onWordClick={onWordClick} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No antonyms found</p>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Meanings */}
      {contexts && contexts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Contextual Meanings</span>
              <span className="badge badge-secondary text-xs">
                {contexts.length}
              </span>
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {contexts.map((context, index) => (
                <ContextualMeaningItem key={index} context={context} />
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface RelatedWordItemProps {
  word: RelatedWord;
  type: 'synonym' | 'antonym';
  onWordClick?: (word: string) => void;
}

function RelatedWordItem({ word, type, onWordClick }: RelatedWordItemProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onWordClick?.(word.word)}
          className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded"
          title={`Analyze "${word.word}"`}
        >
          {word.word}
        </button>
        {word.context && (
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
            {word.context}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {word.similarity && (
          <span className="text-xs text-gray-500">
            {Math.round(word.similarity * 100)}% similar
          </span>
        )}
        <span className={`badge text-xs ${getConfidenceColor(word.confidence)}`}>
          {Math.round(word.confidence * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

interface ContextualMeaningItemProps {
  context: ContextualMeaning;
}

function ContextualMeaningItem({ context }: ContextualMeaningItemProps) {
  const getSentimentColor = (sentiment?: number) => {
    if (!sentiment) return 'text-gray-600 bg-gray-100';
    if (sentiment > 0.2) return 'text-green-600 bg-green-100';
    if (sentiment < -0.2) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSentimentLabel = (sentiment?: number) => {
    if (!sentiment) return 'Neutral';
    if (sentiment > 0.5) return 'Very Positive';
    if (sentiment > 0.2) return 'Positive';
    if (sentiment < -0.5) return 'Very Negative';
    if (sentiment < -0.2) return 'Negative';
    return 'Neutral';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">Context</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
            "{context.context}"
          </p>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {context.domain && (
            <span className="badge badge-primary text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {context.domain}
            </span>
          )}
          {context.sentiment !== undefined && (
            <span className={`badge text-xs ${getSentimentColor(context.sentiment)}`}>
              <Target className="h-3 w-3 mr-1" />
              {getSentimentLabel(context.sentiment)}
            </span>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-1">Meaning</h4>
        <p className="text-gray-700">{context.meaning}</p>
      </div>

      {context.examples && context.examples.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {context.examples.map((example, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}