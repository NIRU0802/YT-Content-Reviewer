export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export enum LogType {
  CACHE_HIT = 'CACHE_HIT',
  CACHE_MISS = 'CACHE_MISS',
  GEMINI_USED = 'GEMINI_USED',
  GEMINI_SKIPPED = 'GEMINI_SKIPPED',
  RATE_LIMIT = 'RATE_LIMIT',
  REQUEST = 'REQUEST',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  type: LogType;
  message: string;
  details?: Record<string, unknown>;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

export function log(
  type: LogType,
  message: string,
  level: LogLevel = LogLevel.INFO,
  details?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    type,
    message,
    details,
  };

  logs.push(entry);
  
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  const prefix = `[${entry.timestamp}] [${level}] [${type}]`;
  if (level === LogLevel.ERROR) {
    console.error(prefix, message, details || '');
  } else if (level === LogLevel.WARN) {
    console.warn(prefix, message, details || '');
  } else {
    console.log(prefix, message, details || '');
  }
}

export function getLogs(): LogEntry[] {
  return [...logs];
}

export function getLogsByType(type: LogType): LogEntry[] {
  return logs.filter(l => l.type === type);
}

export function getCacheHitRate(): number {
  const cacheHits = logs.filter(l => l.type === LogType.CACHE_HIT).length;
  const totalCacheRequests = logs.filter(l => 
    l.type === LogType.CACHE_HIT || l.type === LogType.CACHE_MISS
  ).length;
  
  if (totalCacheRequests === 0) return 0;
  return cacheHits / totalCacheRequests;
}

export function getGeminiUsageCount(): number {
  return logs.filter(l => l.type === LogType.GEMINI_USED).length;
}

export function clearLogs(): void {
  logs.length = 0;
}
