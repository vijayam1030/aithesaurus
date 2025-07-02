'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Brain, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  showIcon?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  showIcon = true,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {showIcon && (
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <Loader2 className={`${sizeClasses[size]} text-primary-600`} />
          </motion.div>
          
          {/* Animated brain icon for AI processing */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Brain className={`${sizeClasses[size === 'lg' ? 'md' : 'sm']} text-purple-500`} />
          </motion.div>
        </div>
      )}
      
      {text && (
        <div className="flex flex-col items-start">
          <motion.span
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${textSizeClasses[size]} text-gray-700 font-medium`}
          >
            {text}
          </motion.span>
          
          {/* Loading dots */}
          <div className="flex space-x-1 mt-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-1 h-1 bg-primary-400 rounded-full"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </motion.div>
          
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Zap className="h-6 w-6 text-primary-600" />
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <motion.h3
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-semibold text-gray-900"
          >
            {text}
          </motion.h3>
          
          <p className="text-sm text-gray-500">
            Processing with local AI models...
          </p>
        </div>
      </div>
    </div>
  );
}

export function InlineLoader({ 
  text = 'Loading...', 
  className = '' 
}: { 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center space-x-3 p-4 ${className}`}>
      <div className="loading-dots">
        <div></div>
        <div></div>
        <div></div>
      </div>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}

export function SkeletonLoader({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="shimmer h-4 bg-gray-200 rounded w-full" />
          <div className="shimmer h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}