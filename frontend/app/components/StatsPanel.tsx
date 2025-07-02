'use client';

import React from 'react';
import { motion } from 'framer-motion';
// Fixed runtime error with proper null checks
import { Activity, Database, Zap, Clock, MemoryStick, TrendingUp } from 'lucide-react';
import { useThesaurus } from '../hooks/useThesaurus';

export function StatsPanel() {
  const { systemStats, healthStatus, isLoading } = useThesaurus();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'unhealthy':
      case 'disconnected':
      case 'unavailable':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading && !systemStats) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <span>System Status</span>
          </h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-primary-600" />
            <span>System Health</span>
          </h3>
        </div>
        <div className="card-body space-y-3">
          {healthStatus ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Status</span>
                <span className={`badge text-xs ${getStatusColor(healthStatus.status)}`}>
                  {healthStatus.status}
                </span>
              </div>
              
              {healthStatus.services.database && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className={`badge text-xs ${getStatusColor(healthStatus.services.database)}`}>
                    {healthStatus.services.database}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ollama AI</span>
                <span className={`badge text-xs ${getStatusColor(healthStatus.services.ollama)}`}>
                  {healthStatus.services.ollama}
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Status unavailable</div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {systemStats && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Statistics</span>
            </h3>
          </div>
          <div className="card-body space-y-4">
            {/* Words - Show only if available */}
            {systemStats.words && systemStats.words.total && (
              <div className="flex items-center space-x-3">
                <Database className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Words</span>
                    <span className="font-medium text-gray-900">
                      {systemStats.words.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Embeddings - Show only if available */}
            {systemStats.embeddings && systemStats.embeddings.totalEmbeddings && (
              <div className="flex items-center space-x-3">
                <Zap className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Embeddings</span>
                    <span className="font-medium text-gray-900">
                      {systemStats.embeddings.totalEmbeddings.toLocaleString()}
                    </span>
                  </div>
                  {systemStats.embeddings.averageDimension && (
                    <div className="text-xs text-gray-500 mt-1">
                      Avg dimension: {Math.round(systemStats.embeddings.averageDimension)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cache */}
            {systemStats.cache && (
              <div className="flex items-center space-x-3">
                <MemoryStick className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache Hit Rate</span>
                    <span className="font-medium text-gray-900">
                      {systemStats.cache.hitRate}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemStats.cache.keys} keys, {formatBytes(systemStats.cache.vsize)}
                  </div>
                </div>
              </div>
            )}

            {/* Uptime */}
            {systemStats.system && (
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-medium text-gray-900">
                      {formatUptime(systemStats.system.uptime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Usage */}
      {systemStats?.system.memory && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <MemoryStick className="h-5 w-5 text-orange-600" />
              <span>Memory Usage</span>
            </h3>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Heap Used</span>
              <span className="text-sm font-medium">
                {formatBytes(systemStats.system.memory.heapUsed)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Heap Total</span>
              <span className="text-sm font-medium">
                {formatBytes(systemStats.system.memory.heapTotal)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RSS</span>
              <span className="text-sm font-medium">
                {formatBytes(systemStats.system.memory.rss)}
              </span>
            </div>

            {/* Memory Usage Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Heap Usage</span>
                <span>
                  {Math.round((systemStats.system.memory.heapUsed / systemStats.system.memory.heapTotal) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${(systemStats.system.memory.heapUsed / systemStats.system.memory.heapTotal) * 100}%` 
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Distribution */}
      {systemStats?.embeddings?.modelDistribution && Object.keys(systemStats.embeddings.modelDistribution || {}).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span>AI Models</span>
            </h3>
          </div>
          <div className="card-body space-y-2">
            {Object.entries(systemStats.embeddings?.modelDistribution || {}).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate" title={model}>
                  {model.length > 20 ? `${model.substring(0, 17)}...` : model}
                </span>
                <span className="text-sm font-medium">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}