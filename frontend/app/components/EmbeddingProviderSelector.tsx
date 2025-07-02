'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Cpu, Brain, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface EmbeddingProvider {
  id: 'ollama' | 'word2vec';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  available: boolean;
  models?: string[];
}

export interface EmbeddingSettings {
  provider: 'ollama' | 'word2vec';
  model?: string;
}

interface Props {
  settings: EmbeddingSettings;
  onSettingsChange: (settings: EmbeddingSettings) => void;
  className?: string;
}

export function EmbeddingProviderSelector({ 
  settings, 
  onSettingsChange, 
  className = '' 
}: Props) {
  const [providers, setProviders] = useState<Record<string, { available: boolean; models?: string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showModelUpload, setShowModelUpload] = useState(false);
  const [modelPath, setModelPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const providerDefinitions: EmbeddingProvider[] = [
    {
      id: 'ollama',
      name: 'Ollama',
      description: 'Advanced contextual embeddings with local AI models',
      icon: Brain,
      available: providers.ollama?.available || false,
      models: providers.ollama?.models || []
    },
    {
      id: 'word2vec',
      name: 'Word2Vec',
      description: 'Fast pre-trained word vectors for quick similarity search',
      icon: Cpu,
      available: providers.word2vec?.available || false,
      models: providers.word2vec?.models || []
    }
  ];

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/providers');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      toast.error('Failed to load embedding providers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (providerId: 'ollama' | 'word2vec') => {
    const provider = providerDefinitions.find(p => p.id === providerId);
    if (!provider?.available) {
      toast.error(`${provider?.name || providerId} is not available`);
      return;
    }

    const newSettings: EmbeddingSettings = {
      provider: providerId,
      model: provider.models?.[0] // Default to first available model
    };

    onSettingsChange(newSettings);
    toast.success(`Switched to ${provider.name}`);
  };

  const handleModelChange = (model: string) => {
    onSettingsChange({
      ...settings,
      model
    });
  };

  const handleLoadWord2VecModel = async () => {
    if (!modelPath.trim()) {
      toast.error('Please enter a model path');
      return;
    }

    try {
      setIsUploading(true);
      const response = await fetch('/api/providers/word2vec/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelPath: modelPath.trim() })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Word2Vec model loaded successfully');
        setShowModelUpload(false);
        setModelPath('');
        await fetchProviders(); // Refresh provider status
      } else {
        toast.error(data.message || 'Failed to load Word2Vec model');
      }
    } catch (error) {
      console.error('Error loading Word2Vec model:', error);
      toast.error('Failed to load Word2Vec model');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body">
          <div className="flex items-center justify-center py-4">
            <Loader className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading providers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-600" />
          <span>Embedding Provider</span>
        </h3>
        <p className="text-gray-600 text-sm">
          Choose how to generate word embeddings for semantic search
        </p>
      </div>
      
      <div className="card-body space-y-4">
        {/* Provider Selection */}
        <div className="space-y-3">
          {providerDefinitions.map((provider) => {
            const Icon = provider.icon;
            const isSelected = settings.provider === provider.id;
            const isAvailable = provider.available;

            return (
              <motion.div
                key={provider.id}
                whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-300 bg-primary-50'
                    : isAvailable
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }`}
                onClick={() => isAvailable && handleProviderChange(provider.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? 'bg-primary-100' 
                      : isAvailable 
                      ? 'bg-gray-100' 
                      : 'bg-gray-200'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isSelected 
                        ? 'text-primary-600' 
                        : isAvailable 
                        ? 'text-gray-600' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        isAvailable ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {provider.name}
                      </h4>
                      {isAvailable ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      isAvailable ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {provider.description}
                    </p>
                    
                    {!isAvailable && provider.id === 'word2vec' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowModelUpload(true);
                        }}
                        className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Load Word2Vec Model
                      </button>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Model Selection */}
        {settings.provider && providers[settings.provider]?.models && providers[settings.provider].models!.length > 1 && (
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={settings.model || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {providers[settings.provider].models!.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Provider Info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Current: <span className="font-medium">{settings.provider}</span></div>
            {settings.model && (
              <div>Model: <span className="font-medium">{settings.model}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Word2Vec Model Upload Modal */}
      {showModelUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Load Word2Vec Model</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model File Path
                  </label>
                  <input
                    type="text"
                    value={modelPath}
                    onChange={(e) => setModelPath(e.target.value)}
                    placeholder="/path/to/word2vec/model.bin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the path to your pre-trained Word2Vec model file
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleLoadWord2VecModel}
                    disabled={isUploading || !modelPath.trim()}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load Model'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowModelUpload(false);
                      setModelPath('');
                    }}
                    disabled={isUploading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}