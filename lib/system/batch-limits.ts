/**
 * Batch Processing Limits and System Protection
 * Implements safeguards to prevent system overload and ensure stable performance
 */

export interface BatchLimits {
  maxRecordsPerBatch: number
  maxConcurrentBatches: number
  maxRecordsPerImport: number
  maxImportsPerUser: number
  maxImportsPerHour: number
  batchDelayMs: number
  memoryThresholdMB: number
  cpuThresholdPercent: number
}

export interface SystemMetrics {
  memoryUsageMB: number
  cpuUsagePercent: number
  activeBatches: number
  queuedJobs: number
  activeConnections: number
}

export interface BatchProcessingConfig {
  userId: string
  recordCount: number
  priority: 'low' | 'normal' | 'high'
  estimatedMemoryMB: number
}

export interface BatchProcessingResult {
  allowed: boolean
  reason?: string
  suggestedBatchSize?: number
  estimatedDelay?: number
  alternativeOptions?: string[]
}

// Default limits based on system tier
const DEFAULT_LIMITS: Record<string, BatchLimits> = {
  free: {
    maxRecordsPerBatch: 100,
    maxConcurrentBatches: 1,
    maxRecordsPerImport: 1000,
    maxImportsPerUser: 5,
    maxImportsPerHour: 10,
    batchDelayMs: 2000,
    memoryThresholdMB: 512,
    cpuThresholdPercent: 70
  },
  basic: {
    maxRecordsPerBatch: 500,
    maxConcurrentBatches: 2,
    maxRecordsPerImport: 10000,
    maxImportsPerUser: 20,
    maxImportsPerHour: 50,
    batchDelayMs: 1000,
    memoryThresholdMB: 1024,
    cpuThresholdPercent: 80
  },
  pro: {
    maxRecordsPerBatch: 1000,
    maxConcurrentBatches: 5,
    maxRecordsPerImport: 100000,
    maxImportsPerUser: 100,
    maxImportsPerHour: 200,
    batchDelayMs: 500,
    memoryThresholdMB: 2048,
    cpuThresholdPercent: 85
  },
  enterprise: {
    maxRecordsPerBatch: 2000,
    maxConcurrentBatches: 10,
    maxRecordsPerImport: 1000000,
    maxImportsPerUser: 1000,
    maxImportsPerHour: 1000,
    batchDelayMs: 100,
    memoryThresholdMB: 4096,
    cpuThresholdPercent: 90
  }
}

// In-memory tracking for rate limiting
const userImportCounts = new Map<string, { count: number, lastReset: number }>()
const hourlyImportCounts = new Map<string, { count: number, lastReset: number }>()
const activeBatchCounts = new Map<string, number>()

/**
 * Get batch limits for user based on subscription tier
 */
export function getBatchLimits(subscriptionTier: string = 'free'): BatchLimits {
  return DEFAULT_LIMITS[subscriptionTier] || DEFAULT_LIMITS.free
}

/**
 * Check if batch processing is allowed for user
 */
export async function checkBatchProcessingAllowed(
  config: BatchProcessingConfig,
  subscriptionTier: string = 'free'
): Promise<BatchProcessingResult> {
  const limits = getBatchLimits(subscriptionTier)
  const { userId, recordCount, priority, estimatedMemoryMB } = config

  // Check record count limits
  if (recordCount > limits.maxRecordsPerImport) {
    return {
      allowed: false,
      reason: `Import size (${recordCount.toLocaleString()}) exceeds maximum allowed (${limits.maxRecordsPerImport.toLocaleString()})`,
      alternativeOptions: [
        'Split your data into smaller files',
        'Upgrade your subscription for higher limits',
        'Contact support for enterprise options'
      ]
    }
  }

  // Check user import limits
  const userImports = getUserImportCount(userId)
  if (userImports >= limits.maxImportsPerUser) {
    return {
      allowed: false,
      reason: `Maximum concurrent imports reached (${limits.maxImportsPerUser})`,
      alternativeOptions: [
        'Wait for current imports to complete',
        'Cancel existing imports',
        'Upgrade subscription for higher limits'
      ]
    }
  }

  // Check hourly rate limits
  const hourlyImports = getHourlyImportCount(userId)
  if (hourlyImports >= limits.maxImportsPerHour) {
    return {
      allowed: false,
      reason: `Hourly import limit reached (${limits.maxImportsPerHour})`,
      estimatedDelay: getTimeUntilNextHour(),
      alternativeOptions: [
        'Wait until next hour',
        'Upgrade subscription for higher limits'
      ]
    }
  }

  // Check concurrent batch limits
  const activeBatches = getActiveBatchCount(userId)
  if (activeBatches >= limits.maxConcurrentBatches) {
    return {
      allowed: false,
      reason: `Maximum concurrent batches reached (${limits.maxConcurrentBatches})`,
      alternativeOptions: [
        'Wait for current batches to complete',
        'Process in smaller batches'
      ]
    }
  }

  // Check system resources
  const systemMetrics = await getSystemMetrics()
  const resourceCheck = checkSystemResources(systemMetrics, limits, estimatedMemoryMB)
  if (!resourceCheck.allowed) {
    return resourceCheck
  }

  // Calculate optimal batch size
  const suggestedBatchSize = calculateOptimalBatchSize(recordCount, limits, priority)

  return {
    allowed: true,
    suggestedBatchSize,
    estimatedDelay: calculateEstimatedDelay(recordCount, suggestedBatchSize, limits)
  }
}

/**
 * Reserve batch processing slot for user
 */
export function reserveBatchSlot(userId: string): boolean {
  const currentCount = activeBatchCounts.get(userId) || 0
  activeBatchCounts.set(userId, currentCount + 1)
  
  // Increment user import count
  const userImports = userImportCounts.get(userId) || { count: 0, lastReset: Date.now() }
  userImports.count++
  userImportCounts.set(userId, userImports)
  
  // Increment hourly import count
  const hourlyKey = `${userId}-${getCurrentHour()}`
  const hourlyImports = hourlyImportCounts.get(hourlyKey) || { count: 0, lastReset: Date.now() }
  hourlyImports.count++
  hourlyImportCounts.set(hourlyKey, hourlyImports)
  
  return true
}

/**
 * Release batch processing slot for user
 */
export function releaseBatchSlot(userId: string): void {
  const currentCount = activeBatchCounts.get(userId) || 0
  if (currentCount > 0) {
    activeBatchCounts.set(userId, currentCount - 1)
  }
  
  // Decrement user import count
  const userImports = userImportCounts.get(userId)
  if (userImports && userImports.count > 0) {
    userImports.count--
    userImportCounts.set(userId, userImports)
  }
}

/**
 * Get current system metrics
 */
async function getSystemMetrics(): Promise<SystemMetrics> {
  // In a real implementation, this would query actual system metrics
  // For now, we'll simulate reasonable values
  const memoryUsage = process.memoryUsage()
  
  return {
    memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    cpuUsagePercent: Math.random() * 30 + 20, // Simulate 20-50% CPU usage
    activeBatches: Array.from(activeBatchCounts.values()).reduce((sum, count) => sum + count, 0),
    queuedJobs: 0, // Would be queried from job queue
    activeConnections: 10 // Would be queried from connection pool
  }
}

/**
 * Check if system resources allow processing
 */
function checkSystemResources(
  metrics: SystemMetrics,
  limits: BatchLimits,
  estimatedMemoryMB: number
): BatchProcessingResult {
  // Check memory usage
  const projectedMemoryMB = metrics.memoryUsageMB + estimatedMemoryMB
  if (projectedMemoryMB > limits.memoryThresholdMB) {
    return {
      allowed: false,
      reason: `Insufficient memory. Current: ${metrics.memoryUsageMB}MB, Required: ${estimatedMemoryMB}MB, Limit: ${limits.memoryThresholdMB}MB`,
      alternativeOptions: [
        'Process in smaller batches',
        'Wait for system resources to free up',
        'Try during off-peak hours'
      ]
    }
  }

  // Check CPU usage
  if (metrics.cpuUsagePercent > limits.cpuThresholdPercent) {
    return {
      allowed: false,
      reason: `System CPU usage too high (${Math.round(metrics.cpuUsagePercent)}%)`,
      estimatedDelay: 300, // 5 minutes
      alternativeOptions: [
        'Wait for system load to decrease',
        'Process during off-peak hours',
        'Use smaller batch sizes'
      ]
    }
  }

  return { allowed: true }
}

/**
 * Calculate optimal batch size based on limits and priority
 */
function calculateOptimalBatchSize(
  recordCount: number,
  limits: BatchLimits,
  priority: 'low' | 'normal' | 'high'
): number {
  let baseBatchSize = limits.maxRecordsPerBatch

  // Adjust based on priority
  switch (priority) {
    case 'low':
      baseBatchSize = Math.floor(baseBatchSize * 0.5)
      break
    case 'high':
      baseBatchSize = Math.floor(baseBatchSize * 1.2)
      break
    default:
      // normal priority uses base size
      break
  }

  // Ensure we don't exceed limits
  baseBatchSize = Math.min(baseBatchSize, limits.maxRecordsPerBatch)
  
  // For small imports, use the full record count
  if (recordCount <= baseBatchSize) {
    return recordCount
  }

  return baseBatchSize
}

/**
 * Calculate estimated processing delay
 */
function calculateEstimatedDelay(
  recordCount: number,
  batchSize: number,
  limits: BatchLimits
): number {
  const batchCount = Math.ceil(recordCount / batchSize)
  const processingTimePerBatch = 5 // seconds
  const totalProcessingTime = batchCount * processingTimePerBatch
  const totalDelayTime = (batchCount - 1) * (limits.batchDelayMs / 1000)
  
  return totalProcessingTime + totalDelayTime
}

/**
 * Get user import count with cleanup of old entries
 */
function getUserImportCount(userId: string): number {
  const userImports = userImportCounts.get(userId)
  if (!userImports) {
    return 0
  }

  // Clean up old entries (older than 24 hours)
  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000
  if (now - userImports.lastReset > dayInMs) {
    userImportCounts.delete(userId)
    return 0
  }

  return userImports.count
}

/**
 * Get hourly import count with cleanup
 */
function getHourlyImportCount(userId: string): number {
  const hourlyKey = `${userId}-${getCurrentHour()}`
  const hourlyImports = hourlyImportCounts.get(hourlyKey)
  
  // Clean up old hourly entries
  cleanupOldHourlyEntries()
  
  return hourlyImports?.count || 0
}

/**
 * Get active batch count for user
 */
function getActiveBatchCount(userId: string): number {
  return activeBatchCounts.get(userId) || 0
}

/**
 * Get current hour key for rate limiting
 */
function getCurrentHour(): string {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`
}

/**
 * Get time until next hour in seconds
 */
function getTimeUntilNextHour(): number {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1, 0, 0, 0)
  return Math.ceil((nextHour.getTime() - now.getTime()) / 1000)
}

/**
 * Clean up old hourly entries
 */
function cleanupOldHourlyEntries(): void {
  const currentHour = getCurrentHour()
  const keysToDelete: string[] = []
  
  for (const [key] of hourlyImportCounts) {
    if (!key.endsWith(currentHour)) {
      keysToDelete.push(key)
    }
  }
  
  keysToDelete.forEach(key => hourlyImportCounts.delete(key))
}

/**
 * Get batch processing statistics for monitoring
 */
export function getBatchProcessingStats(): {
  activeUsers: number
  totalActiveBatches: number
  totalUserImports: number
  totalHourlyImports: number
} {
  return {
    activeUsers: activeBatchCounts.size,
    totalActiveBatches: Array.from(activeBatchCounts.values()).reduce((sum, count) => sum + count, 0),
    totalUserImports: Array.from(userImportCounts.values()).reduce((sum, entry) => sum + entry.count, 0),
    totalHourlyImports: Array.from(hourlyImportCounts.values()).reduce((sum, entry) => sum + entry.count, 0)
  }
}

/**
 * Reset user limits (admin function)
 */
export function resetUserLimits(userId: string): void {
  userImportCounts.delete(userId)
  activeBatchCounts.delete(userId)
  
  // Clean up hourly entries for this user
  const keysToDelete: string[] = []
  for (const [key] of hourlyImportCounts) {
    if (key.startsWith(userId + '-')) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => hourlyImportCounts.delete(key))
}

/**
 * Estimate memory usage for import
 */
export function estimateMemoryUsage(recordCount: number, avgFieldCount: number = 8): number {
  // Rough estimation: each record ~1KB in memory during processing
  // Plus overhead for validation, deduplication, etc.
  const baseMemoryPerRecord = 1024 // bytes
  const validationOverhead = 0.5 // 50% overhead for validation
  const totalMemoryBytes = recordCount * baseMemoryPerRecord * (1 + validationOverhead)
  
  return Math.ceil(totalMemoryBytes / 1024 / 1024) // Convert to MB
}
