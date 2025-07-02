import NodeCache from 'node-cache';
import { logger } from './logger';

class CacheService {
  private cache: NodeCache;
  private defaultTTL: number;

  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600');
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Don't clone objects for better performance
      deleteOnExpire: true,
      maxKeys: 10000 // Limit cache size
    });

    // Set up event listeners
    this.cache.on('set', (key, value) => {
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      logger.debug(`Cache DELETE: ${key}`);
    });

    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });

    this.cache.on('flush', () => {
      logger.info('Cache FLUSHED');
    });
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const result = this.cache.set(key, value, ttl || this.defaultTTL);
      if (result) {
        logger.debug(`Cached: ${key} (TTL: ${ttl || this.defaultTTL}s)`);
      }
      return result;
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      if (value !== undefined) {
        logger.debug(`Cache HIT: ${key}`);
      } else {
        logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return undefined;
    }
  }

  del(key: string): number {
    try {
      const result = this.cache.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      return 0;
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getTTL(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  keys(): string[] {
    return this.cache.keys();
  }

  getStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: string;
    vsize: number;
  } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.keys > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%',
      vsize: stats.vsize
    };
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  // Advanced caching methods
  mset<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): boolean {
    try {
      const operations = keyValuePairs.map(({ key, value, ttl }) => ({
        key,
        value,
        ttl: ttl || this.defaultTTL
      }));

      const result = this.cache.mset(operations);
      logger.debug(`Multi-set ${operations.length} cache entries`);
      return result;
    } catch (error) {
      logger.error('Error in multi-set cache operation:', error);
      return false;
    }
  }

  mget<T>(keys: string[]): Record<string, T> {
    try {
      const result = this.cache.mget<T>(keys);
      const hitCount = Object.keys(result).length;
      logger.debug(`Multi-get: ${hitCount}/${keys.length} cache hits`);
      return result;
    } catch (error) {
      logger.error('Error in multi-get cache operation:', error);
      return {};
    }
  }

  // Pattern-based operations
  deletePattern(pattern: string): number {
    try {
      const keys = this.cache.keys();
      const regex = new RegExp(pattern);
      const matchingKeys = keys.filter(key => regex.test(key));
      
      if (matchingKeys.length > 0) {
        const deletedCount = this.cache.del(matchingKeys);
        logger.debug(`Deleted ${deletedCount} cache entries matching pattern: ${pattern}`);
        return deletedCount;
      }
      
      return 0;
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Semantic caching for similar queries
  findSimilarKeys(key: string, threshold: number = 0.8): string[] {
    try {
      const keys = this.cache.keys();
      const similarKeys: string[] = [];

      // Simple string similarity (can be enhanced with more sophisticated algorithms)
      keys.forEach(cacheKey => {
        const similarity = this.calculateStringSimilarity(key, cacheKey);
        if (similarity >= threshold && cacheKey !== key) {
          similarKeys.push(cacheKey);
        }
      });

      return similarKeys;
    } catch (error) {
      logger.error(`Error finding similar keys for ${key}:`, error);
      return [];
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateLevenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Cache warming
  async warmup(keys: string[], dataLoader: (key: string) => Promise<any>): Promise<void> {
    logger.info(`Warming up cache with ${keys.length} keys`);
    
    const promises = keys.map(async (key) => {
      try {
        if (!this.has(key)) {
          const data = await dataLoader(key);
          this.set(key, data);
        }
      } catch (error) {
        logger.error(`Error warming up cache for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warmup completed');
  }
}

export const cache = new CacheService();