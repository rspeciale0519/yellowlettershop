      // Start health checks on new instance
      await this.startHealthMonitoring(newInstance)
      
      return {
        success: true,
        newVersion: newInstance.version,
        instanceId: newInstance.id,
        deploymentTime: new Date()
      }
    } catch (error) {
      throw new Error(`Production deployment failed: ${error.message}`)
    }
  }

  async executeRollback(rollbackPlan) {
    // Execute immediate rollback to previous stable version
    const rollbackId = this.generateRollbackId()
    
    try {
      console.log(`Starting rollback ${rollbackId}: ${rollbackPlan.reason}`)
      
      // Get previous stable version
      const previousVersion = await this.getPreviousStableVersion()
      if (!previousVersion) {
        throw new Error('No previous stable version found for rollback')
      }

      // Update DNS to point to previous version
      await this.updateDNSRouting(previousVersion.id, { immediate: true })
      
      // Rollback database migrations if needed
      if (rollbackPlan.rollbackDatabase) {
        await this.rollbackDatabaseMigrations(previousVersion.databaseVersion)
      }
      
      // Scale down failed deployment
      if (rollbackPlan.deploymentId) {
        await this.scaleDownFailedDeployment(rollbackPlan.deploymentId)
      }
      
      // Verify rollback success
      await this.validateRollbackSuccess(previousVersion)
      
      // Send rollback notifications
      await this.sendRollbackNotifications(rollbackId, rollbackPlan.reason)
      
      console.log(`Rollback ${rollbackId} completed successfully`)
      return { success: true, rollbackId: rollbackId, version: previousVersion.id }

    } catch (error) {
      console.error(`Rollback ${rollbackId} failed:`, error)
      
      // Critical rollback failure - requires immediate manual intervention
      await this.sendCriticalAlert('ROLLBACK_FAILED', {
        rollbackId: rollbackId,
        error: error.message,
        originalReason: rollbackPlan.reason
      })
      
      throw error
    }
  }

  async handleScaling(scalingEvent) {
    // Handle automatic and manual scaling operations
    try {
      const currentMetrics = await this.getCurrentSystemMetrics()
      const scalingDecision = this.calculateScalingNeeds(currentMetrics, scalingEvent)
      
      if (scalingDecision.action === 'scale_up') {
        await this.scaleUp(scalingDecision.targetInstances)
      } else if (scalingDecision.action === 'scale_down') {
        await this.scaleDown(scalingDecision.targetInstances)
      }
      
      // Monitor scaling effectiveness
      await this.monitorScalingResults(scalingDecision)
      
      return { success: true, action: scalingDecision.action }
    } catch (error) {
      console.error('Scaling operation failed:', error)
      throw error
    }
  }

  async handleMonitoring() {
    // Comprehensive system monitoring and alerting
    try {
      const monitoringChecks = [
        this.checkApplicationHealth(),
        this.checkDatabaseHealth(),
        this.checkExternalServiceHealth(),
        this.checkPerformanceMetrics(),
        this.checkSecurityStatus(),
        this.checkBackupStatus()
      ]

      const results = await Promise.all(monitoringChecks)
      const issues = results.filter(result => !result.healthy)
      
      // Handle any detected issues
      for (const issue of issues) {
        await this.handleMonitoringIssue(issue)
      }
      
      // Update system health dashboard
      await this.updateHealthDashboard(results)
      
      return { healthy: issues.length === 0, issues: issues }
    } catch (error) {
      console.error('Monitoring check failed:', error)
      return { healthy: false, error: error.message }
    }
  }

  async checkApplicationHealth() {
    // Check core application health metrics
    try {
      const healthMetrics = await this.getApplicationMetrics()
      
      const issues = []
      
      if (healthMetrics.errorRate > this.deploymentConfig.monitoring.alertThresholds.errorRate) {
        issues.push(`High error rate: ${healthMetrics.errorRate * 100}%`)
      }
      
      if (healthMetrics.avgResponseTime > this.deploymentConfig.monitoring.alertThresholds.responseTime) {
        issues.push(`High response time: ${healthMetrics.avgResponseTime}ms`)
      }
      
      if (healthMetrics.availability < this.deploymentConfig.monitoring.alertThresholds.availability) {
        issues.push(`Low availability: ${healthMetrics.availability}%`)
      }
      
      return {
        healthy: issues.length === 0,
        category: 'application',
        metrics: healthMetrics,
        issues: issues
      }
    } catch (error) {
      return {
        healthy: false,
        category: 'application',
        error: error.message
      }
    }
  }

  async checkDatabaseHealth() {
    // Monitor database performance and connectivity
    try {
      const dbMetrics = await this.getDatabaseMetrics()
      
      const issues = []
      
      if (dbMetrics.connectionCount > dbMetrics.maxConnections * 0.8) {
        issues.push('High database connection usage')
      }
      
      if (dbMetrics.slowQueryCount > 10) {
        issues.push(`${dbMetrics.slowQueryCount} slow queries detected`)
      }
      
      if (dbMetrics.diskUsage > 85) {
        issues.push(`High disk usage: ${dbMetrics.diskUsage}%`)
      }
      
      return {
        healthy: issues.length === 0,
        category: 'database',
        metrics: dbMetrics,
        issues: issues
      }
    } catch (error) {
      return {
        healthy: false,
        category: 'database',
        error: error.message
      }
    }
  }

  async checkExternalServiceHealth() {
    // Monitor external service integrations
    try {
      const serviceHealthChecks = [
        { name: 'melissa', check: this.checkMelissaConnectivity() },
        { name: 'accuzip', check: this.checkAccuzipConnectivity() },
        { name: 'redstone', check: this.checkRedstoneConnectivity() },
        { name: 'stripe', check: this.checkStripeConnectivity() }
      ]

      const results = await Promise.all(serviceHealthChecks.map(async service => ({
        name: service.name,
        result: await service.check
      })))

      const unhealthyServices = results.filter(service => !service.result.healthy)
      
      return {
        healthy: unhealthyServices.length === 0,
        category: 'external_services',
        services: results,
        issues: unhealthyServices.map(service => `${service.name}: ${service.result.error}`)
      }
    } catch (error) {
      return {
        healthy: false,
        category: 'external_services',
        error: error.message
      }
    }
  }

  async handleMonitoringIssue(issue) {
    // Handle detected monitoring issues with appropriate responses
    try {
      const severity = this.assessIssueSeverity(issue)
      
      // Log the issue
      await this.logMonitoringIssue(issue, severity)
      
      // Take automated corrective actions
      const actionTaken = await this.takeCorrectiveAction(issue, severity)
      
      // Send alerts based on severity
      if (severity === 'critical') {
        await this.sendCriticalAlert('SYSTEM_ISSUE', issue)
      } else if (severity === 'high') {
        await this.sendHighPriorityAlert(issue)
      }
      
      return { handled: true, action: actionTaken, severity: severity }
    } catch (error) {
      console.error('Failed to handle monitoring issue:', error)
      return { handled: false, error: error.message }
    }
  }

  async takeCorrectiveAction(issue, severity) {
    // Automated corrective actions based on issue type and severity
    switch (issue.category) {
      case 'application':
        if (issue.issues.includes('High response time')) {
          // Scale up application instances
          await this.scaleUp(this.getCurrentInstanceCount() + 1)
          return 'scaled_up_instances'
        }
        if (issue.issues.includes('High error rate')) {
          // Restart unhealthy instances
          await this.restartUnhealthyInstances()
          return 'restarted_instances'
        }
        break
        
      case 'database':
        if (issue.issues.includes('High database connection usage')) {
          // Kill long-running queries
          await this.killLongRunningQueries()
          return 'killed_long_queries'
        }
        if (issue.issues.includes('High disk usage')) {
          // Archive old data
          await this.archiveOldData()
          return 'archived_old_data'
        }
        break
        
      case 'external_services':
        if (severity === 'critical') {
          // Enable fallback modes for critical services
          await this.enableFallbackModes(issue.services)
          return 'enabled_fallbacks'
        }
        break
    }
    
    return 'no_action_available'
  }

  async sendCriticalAlert(alertType, details) {
    // Send immediate alerts for critical issues
    const alertData = {
      type: alertType,
      severity: 'critical',
      details: details,
      timestamp: new Date(),
      environment: 'production'
    }

    // Multiple alert channels for critical issues
    await Promise.all([
      this.sendSlackAlert(alertData),
      this.sendEmailAlert(alertData),
      this.sendSMSAlert(alertData), // For critical issues only
      this.logAlert(alertData)
    ])
  }

  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  generateRollbackId() {
    return `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  async getSystemStatus() {
    // Get comprehensive system status for dashboards
    try {
      const [appHealth, dbHealth, serviceHealth, metrics] = await Promise.all([
        this.checkApplicationHealth(),
        this.checkDatabaseHealth(), 
        this.checkExternalServiceHealth(),
        this.getCurrentSystemMetrics()
      ])

      return {
        overall: appHealth.healthy && dbHealth.healthy && serviceHealth.healthy ? 'healthy' : 'degraded',
        application: appHealth,
        database: dbHealth,
        externalServices: serviceHealth,
        metrics: metrics,
        lastUpdated: new Date()
      }
    } catch (error) {
      return {
        overall: 'error',
        error: error.message,
        lastUpdated: new Date()
      }
    }
  }
}

export const deploymentManager = new ProductionDeploymentManager()

// Initialize monitoring if in production environment
if (process.env.NODE_ENV === 'production') {
  // Start continuous monitoring
  setInterval(async () => {
    try {
      await deploymentManager.handleMonitoring()
    } catch (error) {
      console.error('Monitoring cycle failed:', error)
    }
  }, 30000) // Every 30 seconds

  // Weekly system optimization
  setInterval(async () => {
    try {
      await deploymentManager.optimizeSystem()
    } catch (error) {
      console.error('System optimization failed:', error)
    }
  }, 7 * 24 * 60 * 60 * 1000) // Weekly
}
```

## **Contact and Support Information**

This comprehensive documentation provides the technical foundation for developing, maintaining, and scaling the Yellow Letter Shop platform. The documentation covers both internal platform architecture and external service integration patterns, enabling developers to build features that leverage the full capabilities of the platform ecosystem.

**For Technical Support and Questions:**

All technical inquiries, development questions, platform issues, and implementation guidance should be directed to our unified support channel:

**Email:** support@yellowlettershop.com

This contact point ensures efficient routing of technical requests to the appropriate development team members while maintaining consistent documentation and knowledge sharing across all platform components.

**Related Documentation References:**

- `api-integrations.md` - Complete external API integration patterns and implementation guidelines
- `api-melissa.md` - Melissa Global Intelligence API specifications and usage patterns  
- `api-accuzip.md` - AccuZIP data processing API documentation and workflow guidance
- `api-redstone.md` - Redstone print fulfillment API integration and order management

This documentation serves as the definitive reference for Yellow Letter Shop platform development, providing both immediate implementation guidance and long-term architectural direction for platform evolution and scaling.  async getDatabaseCacheItem(key) {
    // Retrieve cache item from database
    try {
      const { data, error } = await supabase
        .from('cache_items')
        .select('data, created_at, cache_type')
        .eq('cache_key', key)
        .single()

      if (error || !data) {
        return null
      }

      return {
        data: data.data,
        timestamp: new Date(data.created_at).getTime(),
        type: data.cache_type
      }
    } catch (error) {
      console.error('Database cache retrieval error:', error)
      return null
    }
  }

  async setDatabaseCacheItem(key, item) {
    // Store cache item in database
    try {
      await supabase
        .from('cache_items')
        .upsert({
          cache_key: key,
          data: item.data,
          cache_type: item.type,
          created_at: new Date(),
          expires_at: new Date(item.timestamp + this.cacheConfigs[item.type].ttl)
        }, { onConflict: 'cache_key' })
    } catch (error) {
      console.error('Database cache storage error:', error)
    }
  }

  async removeDatabaseCacheItem(key) {
    // Remove cache item from database
    try {
      await supabase
        .from('cache_items')
        .delete()
        .eq('cache_key', key)
    } catch (error) {
      console.error('Database cache removal error:', error)
    }
  }

  // Smart caching for external API responses
  async cacheExternalAPIResponse(service, endpoint, params, response) {
    // Cache external API responses with service-specific strategies
    const cacheKey = this.generateAPIResponseCacheKey(service, endpoint, params)
    
    // Determine cache duration based on service and endpoint
    const cacheDuration = this.getAPICacheDuration(service, endpoint)
    
    if (cacheDuration > 0) {
      await this.set(cacheKey, {
        response: response,
        service: service,
        endpoint: endpoint,
        params: params,
        cachedAt: Date.now()
      }, 'external_api_responses')
    }
  }

  async getCachedAPIResponse(service, endpoint, params) {
    // Retrieve cached external API response
    const cacheKey = this.generateAPIResponseCacheKey(service, endpoint, params)
    return await this.get(cacheKey, 'external_api_responses')
  }

  generateAPIResponseCacheKey(service, endpoint, params) {
    // Generate consistent cache key for API responses
    const keyData = {
      service: service,
      endpoint: endpoint,
      params: this.normalizeParams(params)
    }
    
    const crypto = require('crypto')
    return `api_${service}_${crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex')}`
  }

  getAPICacheDuration(service, endpoint) {
    // Determine appropriate cache duration for different API endpoints
    const cacheDurations = {
      'melissa': {
        'count': 15 * 60 * 1000, // 15 minutes for count estimates
        'purchase': 0, // Don't cache purchase operations
        'download': 5 * 60 * 1000 // 5 minutes for download URLs
      },
      'accuzip': {
        'quote': 30 * 60 * 1000, // 30 minutes for quotes
        'status': 1 * 60 * 1000, // 1 minute for status checks
        'upload': 0 // Don't cache upload operations
      },
      'redstone': {
        'quote': 60 * 60 * 1000, // 1 hour for quotes
        'status': 2 * 60 * 1000, // 2 minutes for status checks
        'submit': 0 // Don't cache submit operations
      }
    }

    return cacheDurations[service]?.[endpoint] || 0
  }

  normalizeParams(params) {
    // Normalize parameters for consistent cache keys
    if (!params || typeof params !== 'object') {
      return params
    }

    const normalized = {}
    Object.keys(params)
      .sort()
      .forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          normalized[key] = params[key]
        }
      })

    return normalized
  }

  async updateCacheStats(cacheType, operation, size = 0) {
    // Track cache usage statistics
    try {
      await supabase
        .from('cache_statistics')
        .upsert({
          cache_type: cacheType,
          operation: operation,
          operation_count: 1,
          data_size: size,
          recorded_at: new Date()
        }, { 
          onConflict: 'cache_type,operation,recorded_at',
          ignoreDuplicates: false 
        })
    } catch (error) {
      console.error('Cache statistics update error:', error)
    }
  }

  async getCacheStatistics() {
    // Retrieve cache performance statistics
    try {
      const { data: stats } = await supabase
        .from('cache_statistics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .order('recorded_at', { ascending: false })

      return this.aggregateCacheStats(stats)
    } catch (error) {
      console.error('Cache statistics retrieval error:', error)
      return null
    }
  }

  aggregateCacheStats(rawStats) {
    // Aggregate cache statistics for analysis
    const aggregated = {
      totalOperations: 0,
      hitRate: 0,
      avgResponseTime: 0,
      dataVolume: 0,
      byType: {}
    }

    const typeStats = {}
    
    rawStats.forEach(stat => {
      if (!typeStats[stat.cache_type]) {
        typeStats[stat.cache_type] = {
          hits: 0,
          misses: 0,
          sets: 0,
          invalidations: 0,
          totalSize: 0
        }
      }

      typeStats[stat.cache_type][stat.operation] += stat.operation_count
      typeStats[stat.cache_type].totalSize += stat.data_size || 0
      aggregated.totalOperations += stat.operation_count
      aggregated.dataVolume += stat.data_size || 0
    })

    // Calculate hit rates for each cache type
    Object.keys(typeStats).forEach(type => {
      const stats = typeStats[type]
      const totalQueries = stats.hits + stats.misses
      stats.hitRate = totalQueries > 0 ? (stats.hits / totalQueries) * 100 : 0
    })

    aggregated.byType = typeStats
    return aggregated
  }

  async cleanupExpiredCache() {
    // Remove expired cache items
    try {
      // Clean memory cache
      for (const [layerName, layer] of Object.entries(this.cacheLayers)) {
        if (layer instanceof Map) {
          for (const [key, item] of layer.entries()) {
            const config = this.cacheConfigs[item.type]
            if (config && !this.isValidCacheItem(item, config.ttl)) {
              layer.delete(key)
            }
          }
        }
      }

      // Clean database cache
      await supabase
        .from('cache_items')
        .delete()
        .lt('expires_at', new Date())

      console.log('Cache cleanup completed')
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }

  async warmCache() {
    // Pre-populate cache with frequently accessed data
    try {
      console.log('Starting cache warm-up...')

      // Warm up user profiles cache for active users
      const { data: activeUsers } = await supabase
        .from('user_profiles')
        .select('user_id')
        .gte('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days

      for (const user of activeUsers.slice(0, 100)) { // Limit to 100 most active users
        await this.warmUserCache(user.user_id)
      }

      // Warm up popular design templates
      await this.warmPopularTemplates()

      console.log('Cache warm-up completed')
    } catch (error) {
      console.error('Cache warm-up error:', error)
    }
  }

  async warmUserCache(userId) {
    // Pre-populate cache for specific user
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profile) {
        await this.set(`user_profile_${userId}`, profile, 'user_profiles')
      }

      // Load user's recent mailing lists
      const { data: mailingLists } = await supabase
        .from('mailing_lists')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10)

      for (const list of mailingLists) {
        await this.set(`mailing_list_${list.id}`, list, 'mailing_lists')
      }

    } catch (error) {
      console.error(`User cache warm-up failed for ${userId}:`, error)
    }
  }

  async warmPopularTemplates() {
    // Pre-populate cache with popular design templates
    try {
      const { data: popularTemplates } = await supabase
        .from('design_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })
        .limit(50)

      for (const template of popularTemplates) {
        await this.set(`template_${template.id}`, template, 'design_templates')
      }
    } catch (error) {
      console.error('Popular templates cache warm-up failed:', error)
    }
  }
}

export const cacheManager = new CacheManager()

// Initialize cache cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanupExpiredCache()
  }, 10 * 60 * 1000) // Every 10 minutes
}
```

## **9. Integration with External APIs**

### **9.1 External Service Coordination**

The external service coordination system orchestrates complex workflows that span multiple external services while maintaining data consistency and providing unified user experiences. This system demonstrates how internal platform architecture can seamlessly integrate with external services documented in `api-integrations.md`.

```javascript
// External service coordination and workflow orchestration
// Location: /lib/external-services/service-coordinator.js
export class ExternalServiceCoordinator {
  constructor() {
    this.serviceClients = {
      melissa: require('@/lib/melissa/client'),
      accuzip: require('@/lib/accuzip/client'), 
      redstone: require('@/lib/redstone/client')
    }

    this.workflowTemplates = {
      'complete_direct_mail_campaign': [
        { service: 'melissa', operation: 'purchase_list', required: true },
        { service: 'accuzip', operation: 'process_data', required: false },
        { service: 'redstone', operation: 'print_and_mail', required: true }
      ],
      'data_enhancement_only': [
        { service: 'accuzip', operation: 'enhance_data', required: true }
      ],
      'print_only_campaign': [
        { service: 'redstone', operation: 'print_only', required: true }
      ]
    }

    this.activeWorkflows = new Map()
  }

  async executeWorkflow(workflowType, workflowData, options = {}) {
    // Execute complete workflow across multiple external services
    const workflowId = this.generateWorkflowId()
    
    try {
      // Initialize workflow tracking
      const workflow = await this.initializeWorkflow(workflowId, workflowType, workflowData, options)
      this.activeWorkflows.set(workflowId, workflow)

      // Execute workflow steps sequentially with error handling
      const result = await this.executeWorkflowSteps(workflow)

      // Mark workflow as completed
      await this.completeWorkflow(workflowId, result)

      return {
        success: true,
        workflowId: workflowId,
        result: result,
        executionTime: Date.now() - workflow.startTime
      }

    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error)
      
      // Handle workflow failure
      await this.handleWorkflowFailure(workflowId, error)
      
      throw new Error(`Workflow execution failed: ${error.message}`)
    } finally {
      this.activeWorkflows.delete(workflowId)
    }
  }

  async initializeWorkflow(workflowId, workflowType, workflowData, options) {
    // Set up workflow execution context
    const template = this.workflowTemplates[workflowType]
    if (!template) {
      throw new Error(`Unknown workflow type: ${workflowType}`)
    }

    const workflow = {
      id: workflowId,
      type: workflowType,
      data: workflowData,
      options: options,
      template: template,
      currentStep: 0,
      completedSteps: [],
      results: {},
      startTime: Date.now(),
      status: 'initializing'
    }

    // Store workflow in database for persistence and monitoring
    await supabase
      .from('external_service_workflows')
      .insert({
        id: workflowId,
        workflow_type: workflowType,
        user_id: workflowData.userId,
        status: 'initializing',
        workflow_data: workflowData,
        template: template,
        created_at: new Date()
      })

    return workflow
  }

  async executeWorkflowSteps(workflow) {
    // Execute each step in the workflow template
    const results = {}

    for (let stepIndex = 0; stepIndex < workflow.template.length; stepIndex++) {
      const step = workflow.template[stepIndex]
      workflow.currentStep = stepIndex

      try {
        // Update workflow status
        await this.updateWorkflowStatus(workflow.id, 'processing', {
          currentStep: stepIndex,
          stepName: `${step.service}_${step.operation}`
        })

        // Execute the step
        console.log(`Executing workflow step: ${step.service}.${step.operation}`)
        const stepResult = await this.executeWorkflowStep(step, workflow.data, results)

        // Store step result
        results[`${step.service}_${step.operation}`] = stepResult
        workflow.completedSteps.push({
          step: step,
          result: stepResult,
          completedAt: new Date()
        })

        // Update workflow with step completion
        await this.updateWorkflowStatus(workflow.id, 'processing', {
          completedSteps: workflow.completedSteps.length,
          totalSteps: workflow.template.length,
          latestResult: stepResult
        })

      } catch (stepError) {
        console.error(`Workflow step failed: ${step.service}.${step.operation}`, stepError)

        if (step.required) {
          // Required step failed - abort workflow
          throw new Error(`Required step ${step.service}.${step.operation} failed: ${stepError.message}`)
        } else {
          // Optional step failed - log and continue
          console.warn(`Optional step ${step.service}.${step.operation} failed, continuing workflow`)
          results[`${step.service}_${step.operation}`] = {
            success: false,
            error: stepError.message,
            skipped: true
          }
        }
      }
    }

    return results
  }

  async executeWorkflowStep(step, workflowData, previousResults) {
    // Execute individual workflow step with appropriate service
    const serviceClient = this.serviceClients[step.service]
    if (!serviceClient) {
      throw new Error(`Service client not found: ${step.service}`)
    }

    // Prepare step-specific data based on previous results and workflow data
    const stepData = this.prepareStepData(step, workflowData, previousResults)

    // Execute the operation
    switch (`${step.service}_${step.operation}`) {
      case 'melissa_purchase_list':
        return await this.executeMelissaListPurchase(serviceClient, stepData)
      
      case 'accuzip_process_data':
        return await this.executeAccuzipProcessing(serviceClient, stepData)
      
      case 'accuzip_enhance_data':
        return await this.executeAccuzipEnhancement(serviceClient, stepData)
      
      case 'redstone_print_and_mail':
        return await this.executeRedstoneFullfillment(serviceClient, stepData)
      
      case 'redstone_print_only':
        return await this.executeRedstonePrintOnly(serviceClient, stepData)
      
      default:
        throw new Error(`Unknown workflow operation: ${step.service}_${step.operation}`)
    }
  }

  prepareStepData(step, workflowData, previousResults) {
    // Prepare data for specific workflow step based on context
    const baseData = { ...workflowData }

    // Add data from previous steps as needed
    if (step.service === 'accuzip' && previousResults.melissa_purchase_list) {
      baseData.mailingListData = previousResults.melissa_purchase_list.listData
      baseData.dataFileUrl = previousResults.melissa_purchase_list.fileLocation
    }

    if (step.service === 'redstone') {
      if (previousResults.melissa_purchase_list) {
        baseData.mailingListData = previousResults.melissa_purchase_list.listData
      }
      if (previousResults.accuzip_process_data) {
        baseData.processedData = previousResults.accuzip_process_data.finalData
        baseData.dataFileUrl = previousResults.accuzip_process_data.fileLocation
      }
    }

    return baseData
  }

  async executeMelissaListPurchase(melissa, stepData) {
    // Execute Melissa list purchase workflow step
    try {
      // Use search criteria to purchase list
      const purchaseResult = await melissa.purchaseList({
        searchCriteriaId: stepData.searchCriteriaId,
        paymentMethodId: stepData.paymentMethodId
      })

      // Wait for list to be ready and download
      const downloadResult = await melissa.waitForListAndDownload(purchaseResult.transactionId)

      return {
        success: true,
        transactionId: purchaseResult.transactionId,
        recordCount: downloadResult.recordCount,
        listData: downloadResult.data,
        fileLocation: downloadResult.fileLocation,
        cost: purchaseResult.cost
      }

    } catch (error) {
      throw new Error(`Melissa list purchase failed: ${error.message}`)
    }
  }

  async executeAccuzipProcessing(accuzip, stepData) {
    // Execute AccuZIP data processing workflow step
    try {
      // Upload data file to AccuZIP
      const uploadResult = await accuzip.uploadFile({
        fileUrl: stepData.dataFileUrl,
        services: stepData.processingServices || ['cass', 'ncoa', 'dups', 'presort']
      })

      // Monitor processing progress
      const processingResult = await accuzip.waitForProcessingCompletion(uploadResult.guid)

      // Download processed results
      const finalData = await accuzip.downloadProcessedFile(processingResult.downloadUrl)

      return {
        success: true,
        jobId: uploadResult.guid,
        originalRecords: processingResult.originalCount,
        finalRecords: processingResult.finalCount,
        servicesApplied: processingResult.servicesApplied,
        finalData: finalData,
        fileLocation: processingResult.downloadUrl,
        processingCost: processingResult.totalCost
      }

    } catch (error) {
      throw new Error(`AccuZIP processing failed: ${error.message}`)
    }
  }

  async executeRedstoneFullfillment(redstone, stepData) {
    // Execute Redstone print and mail fulfillment workflow step
    try {
      // Prepare complete job configuration
      const jobConfig = {
        customerInfo: {
          customerId: stepData.userId,
          orderReference: stepData.orderId
        },
        mailingData: {
          dataFileUrl: stepData.dataFileUrl,
          recordCount: stepData.recordCount
        },
        designSpecs: stepData.designSpecifications,
        fulfillmentOptions: {
          printAndMail: true,
          mailClass: stepData.mailClass || 'first_class'
        }
      }

      // Submit job to Redstone
      const submissionResult = await redstone.submitJob(jobConfig)

      // Wait for proof if required
      let proofResult = null
      if (stepData.proofRequired !== false) {
        proofResult = await redstone.waitForProofAndAutoApprove(submissionResult.jobId)
      }

      // Monitor production progress
      const productionResult = await redstone.monitorProduction(submissionResult.jobId)

      return {
        success: true,
        jobId: submissionResult.jobId,
        proofApproved: proofResult?.approved || false,
        productionStatus: productionResult.status,
        estimatedDelivery: productionResult.estimatedDelivery,
        trackingInfo: productionResult.trackingInfo,
        fulfillmentCost: productionResult.totalCost
      }

    } catch (error) {
      throw new Error(`Redstone fulfillment failed: ${error.message}`)
    }
  }

  async updateWorkflowStatus(workflowId, status, additionalData = {}) {
    // Update workflow status in database
    try {
      await supabase
        .from('external_service_workflows')
        .update({
          status: status,
          workflow_progress: additionalData,
          updated_at: new Date()
        })
        .eq('id', workflowId)
    } catch (error) {
      console.error('Failed to update workflow status:', error)
    }
  }

  async completeWorkflow(workflowId, results) {
    // Mark workflow as completed with final results
    try {
      await supabase
        .from('external_service_workflows')
        .update({
          status: 'completed',
          final_results: results,
          completed_at: new Date()
        })
        .eq('id', workflowId)

      console.log(`Workflow ${workflowId} completed successfully`)
    } catch (error) {
      console.error('Failed to complete workflow:', error)
    }
  }

  async handleWorkflowFailure(workflowId, error) {
    // Handle workflow failure with cleanup and notifications
    try {
      await supabase
        .from('external_service_workflows')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date()
        })
        .eq('id', workflowId)

      // Attempt cleanup of partial operations
      await this.cleanupFailedWorkflow(workflowId)

      console.error(`Workflow ${workflowId} failed:`, error.message)
    } catch (cleanupError) {
      console.error('Workflow failure handling failed:', cleanupError)
    }
  }

  async cleanupFailedWorkflow(workflowId) {
    // Clean up any partial operations from failed workflow
    const workflow = this.activeWorkflows.get(workflowId)
    if (!workflow) return

    // Cancel any pending external service operations
    for (const completedStep of workflow.completedSteps) {
      try {
        await this.cancelStepIfPossible(completedStep.step, completedStep.result)
      } catch (error) {
        console.warn('Step cleanup failed:', error.message)
      }
    }
  }

  generateWorkflowId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async getWorkflowStatus(workflowId) {
    // Get current workflow status
    try {
      const { data: workflow } = await supabase
        .from('external_service_workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      return workflow
    } catch (error) {
      console.error('Failed to get workflow status:', error)
      return null
    }
  }
}

export const serviceCoordinator = new ExternalServiceCoordinator()
```

## **10. Deployment and Operations**

### **10.1 Production Deployment Architecture**

The production deployment architecture ensures high availability, scalability, and security while supporting the complex requirements of direct mail campaign management and external service integrations.

```javascript
// Production deployment configuration and operational procedures
// Location: /deployment/production-config.js
export class ProductionDeploymentManager {
  constructor() {
    this.deploymentConfig = {
      environment: 'production',
      regions: ['us-east-1', 'us-west-2'], // Primary and failover
      scaling: {
        minInstances: 2,
        maxInstances: 20,
        targetCPU: 70,
        targetMemory: 80
      },
      monitoring: {
        healthCheckInterval: 30, // seconds
        alertThresholds: {
          errorRate: 0.05, // 5%
          responseTime: 2000, // 2 seconds
          availability: 99.9 // 99.9%
        }
      }
    }

    this.operationalProcedures = {
      deployment: this.executeDeployment.bind(this),
      rollback: this.executeRollback.bind(this),
      scaling: this.handleScaling.bind(this),
      monitoring: this.handleMonitoring.bind(this)
    }
  }

  async executeDeployment(deploymentPlan) {
    // Execute blue-green deployment with comprehensive validation
    const deploymentId = this.generateDeploymentId()
    
    try {
      console.log(`Starting deployment ${deploymentId}`)
      
      // Pre-deployment validation
      await this.validateDeploymentReadiness(deploymentPlan)
      
      // Deploy to staging environment first
      const stagingResult = await this.deployToStaging(deploymentPlan)
      if (!stagingResult.success) {
        throw new Error(`Staging deployment failed: ${stagingResult.error}`)
      }

      // Run comprehensive tests on staging
      const testResults = await this.runProductionTests(stagingResult.stagingUrl)
      if (!testResults.allPassed) {
        throw new Error(`Production tests failed: ${testResults.failures.join(', ')}`)
      }

      // Deploy to production using blue-green strategy
      const productionResult = await this.deployToProduction(deploymentPlan)
      
      // Validate production deployment
      await this.validateProductionDeployment(productionResult)
      
      // Update DNS to point to new version
      await this.updateDNSRouting(productionResult.newVersion)
      
      // Monitor initial production traffic
      await this.monitorInitialTraffic(productionResult.newVersion)
      
      console.log(`Deployment ${deploymentId} completed successfully`)
      return {
        success: true,
        deploymentId: deploymentId,
        version: productionResult.newVersion,
        deploymentTime: Date.now() - deploymentPlan.startTime
      }

    } catch (error) {
      console.error(`Deployment ${deploymentId} failed:`, error)
      
      // Automatic rollback on deployment failure
      await this.executeRollback({ 
        deploymentId: deploymentId,
        reason: error.message 
      })
      
      throw error
    }
  }

  async validateDeploymentReadiness(deploymentPlan) {
    // Comprehensive pre-deployment validation
    const validations = [
      this.validateDatabaseMigrations(deploymentPlan),
      this.validateExternalServiceConnectivity(),
      this.validateEnvironmentVariables(deploymentPlan),
      this.validateResourceAvailability(),
      this.validateSecurityConfiguration(),
      this.validateBackupReadiness()
    ]

    const results = await Promise.all(validations)
    const failures = results.filter(result => !result.success)
    
    if (failures.length > 0) {
      throw new Error(`Deployment validation failed: ${failures.map(f => f.error).join(', ')}`)
    }
  }

  async validateDatabaseMigrations(deploymentPlan) {
    // Validate database migrations are ready and reversible
    try {
      // Check pending migrations
      const { data: pendingMigrations } = await supabase.rpc('get_pending_migrations')
      
      if (deploymentPlan.databaseChanges && pendingMigrations.length === 0) {
        return { success: false, error: 'Expected database migrations not found' }
      }

      // Validate rollback scripts exist
      for (const migration of pendingMigrations) {
        const rollbackExists = await this.checkRollbackScriptExists(migration.id)
        if (!rollbackExists) {
          return { 
            success: false, 
            error: `Rollback script missing for migration ${migration.id}` 
          }
        }
      }

      // Test migrations on staging database
      const migrationTest = await this.testDatabaseMigrations(pendingMigrations)
      if (!migrationTest.success) {
        return { 
          success: false, 
          error: `Migration test failed: ${migrationTest.error}` 
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async validateExternalServiceConnectivity() {
    // Validate all external service integrations are operational
    try {
      const serviceChecks = [
        this.checkMelissaConnectivity(),
        this.checkAccuzipConnectivity(),
        this.checkRedstoneConnectivity(),
        this.checkStripeConnectivity(),
        this.checkEmailServiceConnectivity()
      ]

      const results = await Promise.all(serviceChecks)
      const failures = results.filter(result => !result.healthy)
      
      if (failures.length > 0) {
        return { 
          success: false, 
          error: `External service issues: ${failures.map(f => f.service).join(', ')}` 
        }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async deployToProduction(deploymentPlan) {
    // Blue-green production deployment
    try {
      // Create new production instance
      const newInstance = await this.createProductionInstance(deploymentPlan)
      
      // Deploy application code
      await this.deployApplicationCode(newInstance, deploymentPlan)
      
      // Run database migrations
      if (deploymentPlan.databaseChanges) {
        await this.executeDatabaseMigrations(newInstance)
      }
      
      // Configure load balancer for gradual traffic shift
      await this.configureGradualTrafficShift(newInstance)
      
      //          'X-AccuZIP-Signature': 'mock_signature'
        },
        body: JSON.stringify(webhookPayload)
      })

      expect(response.status).toBe(200)

      // Verify job was updated
      const { data: updatedJob } = await testEnv.supabaseTest
        .from('accuzip_jobs')
        .select('*')
        .eq('id', testJob.id)
        .single()

      expect(updatedJob.job_status).toBe('cass_completed')
      expect(updatedJob.cass_response).toEqual(webhookPayload.results)
    })
  })

  describe('Redstone API Integration', () => {
    beforeEach(() => {
      // Mock Redstone API responses
      jest.spyOn(redstone, 'submitJob').mockImplementation(async (jobConfig) => ({
        jobId: `redstone_${Date.now()}`,
        status: 'submitted',
        estimatedProofTime: '2-4 hours',
        estimatedCompletion: '3-5 business days'
      }))

      jest.spyOn(redstone, 'approveProof').mockImplementation(async (approvalData) => ({
        status: 'approved',
        estimatedCompletion: '3-5 business days',
        productionStarted: true
      }))
    })

    test('should submit print order with complete configuration', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('enterprise')
      const testUser = await testEnv.getTestUser('enterprise')

      // Create test order
      const { data: testOrder } = await testEnv.supabaseTest
        .from('orders')
        .insert({
          user_id: testUser.id,
          mailing_list_id: testEnv.testData.mailingLists.get('Large Test List').id,
          status: 'payment_confirmed',
          fulfillment_type: 'print_and_mail',
          total_amount: 2500.00,
          created_at: new Date()
        })
        .select()
        .single()

      testEnv.registerCleanupTask(async () => {
        await testEnv.supabaseTest.from('orders').delete().eq('id', testOrder.id)
      })

      const response = await fetch('/api/redstone/submit-order', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({ orderId: testOrder.id })
      })

      expect(response.status).toBe(201)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.jobId).toMatch(/^redstone_/)
      expect(result.estimatedProofTime).toBe('2-4 hours')
      expect(redstone.submitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          customerInfo: expect.any(Object),
          productSpecification: expect.any(Object),
          fulfillmentOptions: expect.any(Object)
        })
      )
    })

    test('should handle proof approval workflow correctly', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('enterprise')
      const testUser = await testEnv.getTestUser('enterprise')

      // Create test order and Redstone order
      const { data: testOrder } = await testEnv.supabaseTest
        .from('orders')
        .insert({
          user_id: testUser.id,
          status: 'proof_ready',
          fulfillment_type: 'print_only',
          total_amount: 1200.00,
          created_at: new Date()
        })
        .select()
        .single()

      const { data: redstoneOrder } = await testEnv.supabaseTest
        .from('redstone_orders')
        .insert({
          order_id: testOrder.id,
          redstone_job_id: 'test_redstone_job',
          job_status: 'proof_ready',
          proof_urls: ['https://example.com/proof1.jpg'],
          created_at: new Date()
        })
        .select()
        .single()

      testEnv.registerCleanupTask(async () => {
        await testEnv.supabaseTest.from('redstone_orders').delete().eq('id', redstoneOrder.id)
        await testEnv.supabaseTest.from('orders').delete().eq('id', testOrder.id)
      })

      const response = await fetch('/api/redstone/proof-approval', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({
          orderId: testOrder.id,
          proofVersion: 1,
          approvalNotes: 'Looks great, proceed with printing'
        })
      })

      expect(response.status).toBe(200)

      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.estimatedCompletion).toBe('3-5 business days')
      expect(redstone.approveProof).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'test_redstone_job',
          proofVersion: 1,
          approvalNotes: 'Looks great, proceed with printing'
        })
      )
    })

    test('should handle order validation errors before submission', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('enterprise')
      const testUser = await testEnv.getTestUser('enterprise')

      // Create incomplete test order (missing required fields)
      const { data: incompleteOrder } = await testEnv.supabaseTest
        .from('orders')
        .insert({
          user_id: testUser.id,
          status: 'draft', // Not ready for submission
          fulfillment_type: 'print_and_mail',
          total_amount: 0, // Invalid amount
          created_at: new Date()
        })
        .select()
        .single()

      testEnv.registerCleanupTask(async () => {
        await testEnv.supabaseTest.from('orders').delete().eq('id', incompleteOrder.id)
      })

      const response = await fetch('/api/redstone/submit-order', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({ orderId: incompleteOrder.id })
      })

      expect(response.status).toBe(400)

      const result = await response.json()
      expect(result.error).toContain('Order not ready for printing')
      expect(result.issues).toBeDefined()
      expect(result.requiredActions).toBeDefined()
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should retry failed requests with exponential backoff', async () => {
      let callCount = 0
      
      // Mock function that fails twice then succeeds
      jest.spyOn(melissa, 'getRecordCount').mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          throw new Error('Network timeout')
        }
        return Promise.resolve({ recordCount: 1000, breakdown: {} })
      })

      const authRequest = await testEnv.createAuthenticatedRequest('individual')

      const response = await fetch('/api/melissa/live-count', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({ filters: {} })
      })

      expect(response.status).toBe(200)
      expect(callCount).toBe(3) // Should have retried twice before succeeding
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.recordCount).toBe(1000)
    })

    test('should provide meaningful error messages for service failures', async () => {
      // Mock persistent service failure
      jest.spyOn(accuzip, 'uploadFile').mockRejectedValue(
        new Error('Service temporarily unavailable')
      )

      const authRequest = await testEnv.createAuthenticatedRequest('business')
      const testList = testEnv.testData.mailingLists.get('Medium Test List')

      const csvContent = 'first_name,last_name,address,city,state,zip\nJohn,Doe,123 Main St,Anytown,CA,12345'
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const formData = new FormData()
      formData.append('mailingList', mockFile)
      formData.append('mailingListId', testList.id)

      const response = await fetch('/api/accuzip/upload', {
        method: 'POST',
        headers: { 'Authorization': authRequest.headers.Authorization },
        body: formData
      })

      expect(response.status).toBe(500)

      const result = await response.json()
      expect(result.error).toContain('Upload processing failed')
      expect(result.suggestions).toContain('check your file format')
      expect(result.retryable).toBe(true)
    })

    test('should handle concurrent API requests safely', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('individual')

      // Make multiple concurrent requests
      const concurrentRequests = Array.from({ length: 5 }, () =>
        fetch('/api/melissa/live-count', {
          method: 'POST',
          headers: authRequest.headers,
          body: JSON.stringify({
            filters: { geography: { states: ['CA'] } }
          })
        })
      )

      const responses = await Promise.all(concurrentRequests)

      // All requests should complete successfully or fail gracefully
      responses.forEach(response => {
        expect([200, 429, 500]).toContain(response.status)
      })

      // At least some should succeed
      const successfulResponses = responses.filter(r => r.status === 200)
      expect(successfulResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Load Testing', () => {
    test('should handle reasonable load without degradation', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('individual')
      const startTime = Date.now()

      // Simulate moderate load
      const loadTestRequests = Array.from({ length: 10 }, async (_, index) => {
        await new Promise(resolve => setTimeout(resolve, index * 100)) // Stagger requests
        
        return fetch('/api/melissa/search-criteria', {
          method: 'POST',
          headers: authRequest.headers,
          body: JSON.stringify({
            criteriaName: `Load Test ${index}`,
            filters: {
              geography: { states: ['TX'] },
              property: { valueMin: 200000, valueMax: 500000 }
            }
          })
        })
      })

      const responses = await Promise.all(loadTestRequests)
      const endTime = Date.now()

      // Verify all requests completed successfully
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Verify reasonable performance (should complete within 30 seconds)
      expect(endTime - startTime).toBeLessThan(30000)
    })

    test('should maintain data consistency under concurrent operations', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('business')
      const testList = testEnv.testData.mailingLists.get('Medium Test List')

      // Create concurrent updates to the same mailing list
      const concurrentUpdates = Array.from({ length: 3 }, (_, index) =>
        fetch(`/api/mailing-lists/${testList.id}`, {
          method: 'PUT',
          headers: authRequest.headers,
          body: JSON.stringify({
            name: `Concurrent Update ${index}`,
            description: `Updated concurrently at ${Date.now()}`
          })
        })
      )

      const responses = await Promise.all(concurrentUpdates)

      // All updates should either succeed or fail gracefully
      responses.forEach(response => {
        expect([200, 409, 500]).toContain(response.status)
      })

      // Verify final state is consistent
      const { data: finalList } = await testEnv.supabaseTest
        .from('mailing_lists')
        .select('*')
        .eq('id', testList.id)
        .single()

      expect(finalList.name).toMatch(/^(Medium Test List|Concurrent Update \d)$/)
      expect(finalList.updated_at).toBeDefined()
    })
  })
})
```

## **8. Performance Considerations**

### **8.1 Database Query Optimization**

The platform implements comprehensive database optimization strategies that balance query performance with data consistency while supporting the complex relationships required for direct mail campaign management.

```javascript
// Database performance optimization and query patterns
// Location: /lib/database/performance-optimization.js
export class DatabasePerformanceOptimizer {
  constructor() {
    this.queryCache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    
    this.slowQueryThreshold = 1000 // 1 second
    this.performanceMetrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0
    }
  }

  async executeOptimizedQuery(queryConfig) {
    // Comprehensive query optimization with caching and monitoring
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(queryConfig)
    
    try {
      // Check cache first for appropriate queries
      if (queryConfig.cacheable && this.queryCache.has(cacheKey)) {
        const cachedResult = this.queryCache.get(cacheKey)
        if (Date.now() - cachedResult.timestamp < this.cacheTimeout) {
          this.performanceMetrics.cacheHits++
          return cachedResult.data
        } else {
          this.queryCache.delete(cacheKey)
        }
      }

      // Execute optimized query
      const result = await this.executeQuery(queryConfig)
      const executionTime = Date.now() - startTime

      // Cache result if appropriate
      if (queryConfig.cacheable && executionTime < this.slowQueryThreshold) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }

      // Track performance metrics
      this.performanceMetrics.queryTimes.push(executionTime)
      if (queryConfig.cacheable) this.performanceMetrics.cacheMisses++
      // Alert on slow queries
      if (executionTime > this.slowQueryThreshold) {
        await this.handleSlowQuery(queryConfig, executionTime)
      }

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      await this.handleQueryError(queryConfig, error, executionTime)
      throw error
    }
  }

  async executeQuery(queryConfig) {
    // Execute different types of optimized queries
    switch (queryConfig.type) {
      case 'user_dashboard':
        return await this.executeUserDashboardQuery(queryConfig)
      case 'mailing_list_search':
        return await this.executeMailingListSearch(queryConfig)
      case 'order_analytics':
        return await this.executeOrderAnalytics(queryConfig)
      case 'campaign_performance':
        return await this.executeCampaignPerformance(queryConfig)
      default:
        return await this.executeGenericQuery(queryConfig)
    }
  }

  async executeUserDashboardQuery(queryConfig) {
    // Optimized query for user dashboard with minimal database round trips
    const { userId, timeframe } = queryConfig.params
    const timeframeDays = this.parseTimeframe(timeframe)
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)

    // Single complex query to get all dashboard data
    const { data, error } = await supabase.rpc('get_user_dashboard_data', {
      user_id: userId,
      start_date: startDate.toISOString(),
      include_comparisons: queryConfig.params.includeComparisons || false
    })

    if (error) {
      throw new Error(`Dashboard query failed: ${error.message}`)
    }

    return {
      metrics: data.metrics,
      trends: data.trends,
      comparisons: data.comparisons,
      generatedAt: new Date()
    }
  }

  async executeMailingListSearch(queryConfig) {
    // Optimized mailing list search with full-text search and pagination
    const { userId, searchTerm, filters, pagination } = queryConfig.params
    
    let query = supabase
      .from('mailing_lists')
      .select(`
        id,
        name,
        description,
        source,
        status,
        record_count,
        created_at,
        updated_at,
        tags
      `)
      .eq('user_id', userId)

    // Apply full-text search if search term provided
    if (searchTerm) {
      query = query.textSearch('search_vector', searchTerm, {
        type: 'websearch',
        config: 'english'
      })
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.source && filters.source.length > 0) {
      query = query.in('source', filters.source)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }

    // Apply sorting
    const sortColumn = pagination.sortBy || 'created_at'
    const sortOrder = pagination.sortOrder || 'desc'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.pageSize
    query = query.range(offset, offset + pagination.pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Mailing list search failed: ${error.message}`)
    }

    return {
      lists: data,
      totalCount: count,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(count / pagination.pageSize)
    }
  }

  async executeOrderAnalytics(queryConfig) {
    // Complex analytics query with aggregations and time series data
    const { userId, timeframe, groupBy } = queryConfig.params
    
    // Use database function for complex aggregations
    const { data, error } = await supabase.rpc('calculate_order_analytics', {
      user_id: userId,
      time_frame: timeframe,
      group_by: groupBy,
      include_trends: true
    })

    if (error) {
      throw new Error(`Order analytics query failed: ${error.message}`)
    }

    return {
      summary: data.summary,
      breakdown: data.breakdown,
      trends: data.trends,
      comparisons: data.comparisons
    }
  }

  generateCacheKey(queryConfig) {
    // Generate consistent cache key for query configuration
    const keyData = {
      type: queryConfig.type,
      params: queryConfig.params,
      userId: queryConfig.userId
    }
    
    const crypto = require('crypto')
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData, Object.keys(keyData).sort()))
      .digest('hex')
      .substring(0, 16)
  }

  async handleSlowQuery(queryConfig, executionTime) {
    // Log and alert on slow queries for optimization
    const slowQueryData = {
      type: queryConfig.type,
      executionTime: executionTime,
      params: this.sanitizeParamsForLogging(queryConfig.params),
      timestamp: new Date(),
      threshold: this.slowQueryThreshold
    }

    // Log to database for analysis
    await supabase
      .from('slow_query_logs')
      .insert({
        query_type: queryConfig.type,
        execution_time_ms: executionTime,
        query_params: slowQueryData.params,
        user_id: queryConfig.userId,
        created_at: new Date()
      })

    // Alert if query is extremely slow
    if (executionTime > this.slowQueryThreshold * 3) {
      await this.sendSlowQueryAlert(slowQueryData)
    }

    console.warn('Slow query detected:', slowQueryData)
  }

  sanitizeParamsForLogging(params) {
    // Remove sensitive information from query params for logging
    const sanitized = { ...params }
    
    // Remove or mask sensitive fields
    if (sanitized.email) sanitized.email = '[EMAIL_REDACTED]'
    if (sanitized.phone) sanitized.phone = '[PHONE_REDACTED]'
    if (sanitized.address) sanitized.address = '[ADDRESS_REDACTED]'
    
    return sanitized
  }

  getPerformanceMetrics() {
    // Calculate and return current performance metrics
    const queryTimes = this.performanceMetrics.queryTimes
    const totalQueries = queryTimes.length
    
    if (totalQueries === 0) {
      return {
        averageQueryTime: 0,
        medianQueryTime: 0,
        maxQueryTime: 0,
        cacheHitRate: 0,
        totalQueries: 0
      }
    }

    const sortedTimes = [...queryTimes].sort((a, b) => a - b)
    const averageQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / totalQueries
    const medianQueryTime = sortedTimes[Math.floor(sortedTimes.length / 2)]
    const maxQueryTime = Math.max(...queryTimes)
    
    const totalCacheRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.performanceMetrics.cacheHits / totalCacheRequests) * 100 
      : 0

    return {
      averageQueryTime: Math.round(averageQueryTime),
      medianQueryTime: medianQueryTime,
      maxQueryTime: maxQueryTime,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalQueries: totalQueries,
      slowQueries: queryTimes.filter(time => time > this.slowQueryThreshold).length
    }
  }

  async optimizeDatabase() {
    // Periodic database optimization tasks
    try {
      // Update table statistics
      await supabase.rpc('update_table_statistics')
      
      // Rebuild indexes if needed
      await this.checkAndRebuildIndexes()
      
      // Clean up old performance data
      await this.cleanupPerformanceData()
      
      console.log('Database optimization completed')
      
    } catch (error) {
      console.error('Database optimization failed:', error)
    }
  }

  async checkAndRebuildIndexes() {
    // Check index health and rebuild if necessary
    const { data: indexHealth } = await supabase.rpc('check_index_health')
    
    for (const index of indexHealth) {
      if (index.bloat_ratio > 0.3) { // 30% bloat threshold
        console.log(`Rebuilding bloated index: ${index.index_name}`)
        await supabase.rpc('rebuild_index', { index_name: index.index_name })
      }
    }
  }

  clearCache() {
    // Clear query cache and reset metrics
    this.queryCache.clear()
    this.performanceMetrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0
    }
  }
}

export const dbOptimizer = new DatabasePerformanceOptimizer()
```

### **8.2 Caching Strategy and Implementation**

The caching strategy implements multiple layers of caching to optimize performance while ensuring data consistency and managing cache invalidation effectively across all platform components.

```javascript
// Multi-layer caching system for optimal performance
// Location: /lib/caching/cache-manager.js
export class CacheManager {
export class CacheManager {
  constructor() {
    this.cacheLayers = {
      'memory': new Map(), // In-memory cache for frequently accessed data
      'redis': null,       // Redis for distributed caching (if available)
      'database': null     // Database-level caching handled via helpers
    }
    
    this.cacheConfigs = {
      'default':               { ttl: 5 * 60 * 1000, layer: 'memory' },
      'user_profiles':         { ttl: 30 * 60 * 1000, layer: 'memory' }, // 30 minutes
      'mailing_lists':         { ttl: 15 * 60 * 1000, layer: 'memory' }, // 15 minutes
      'design_templates':      { ttl: 60 * 60 * 1000, layer: 'memory' }, // 1 hour
      'melissa_counts':        { ttl: 15 * 60 * 1000, layer: 'memory' }, // 15 minutes
      'analytics_data':        { ttl: 5 * 60 * 1000, layer: 'database' }, // 5 minutes
      'external_api_responses':{ ttl: 10 * 60 * 1000, layer: 'redis' }  // 10 minutes
    }

    this.invalidationPatterns = {
      'user_profiles':   ['user_settings', 'user_roles'],
      'mailing_lists':   ['mailing_list_records', 'analytics_data'],
      'orders':          ['analytics_data', 'campaign_performance'],
      'design_templates':['template_usage']
    }
  }
}
  async get(key, cacheType = 'default') {
    // Retrieve data from appropriate cache layer
    try {
      const config = this.cacheConfigs[cacheType] || this.cacheConfigs['default']
      const cacheLayer = this.cacheLayers[config.layer]
      
      if (!cacheLayer) {
        return null
      }

      const cachedItem = await this.getCacheItem(cacheLayer, key, config)
      
      if (cachedItem && this.isValidCacheItem(cachedItem, config.ttl)) {
        return cachedItem.data
      }

      // Remove expired item
      if (cachedItem) {
        await this.removeCacheItem(cacheLayer, key)
      }

      return null

    } catch (error) {
      console.error('Cache retrieval error:', error)
      return null
    }
  }

  async set(key, data, cacheType = 'default') {
    // Store data in appropriate cache layer
    try {
      const config = this.cacheConfigs[cacheType] || this.cacheConfigs['default']
      const cacheLayer = this.cacheLayers[config.layer]
      
      if (!cacheLayer) {
        return false
      }

      const cacheItem = {
        data: data,
        timestamp: Date.now(),
        type: cacheType,
        size: this.calculateDataSize(data)
      }

      await this.setCacheItem(cacheLayer, key, cacheItem)
      
      // Update cache statistics
      await this.updateCacheStats(cacheType, 'set', cacheItem.size)
      
      return true

    } catch (error) {
      console.error('Cache storage error:', error)
      return false
    }
  }

  async invalidate(key, cacheType) {
    // Invalidate cache item and related items
    try {
      const config = this.cacheConfigs[cacheType]
      if (!config) return

      const cacheLayer = this.cacheLayers[config.layer]
      await this.removeCacheItem(cacheLayer, key)

      // Invalidate related cache items
      const relatedTypes = this.invalidationPatterns[cacheType] || []
      for (const relatedType of relatedTypes) {
        await this.invalidateByPattern(relatedType)
      }

      // Update cache statistics
      await this.updateCacheStats(cacheType, 'invalidate')

    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }
  async invalidateByPattern(pattern) {
    // Invalidate cache items matching a pattern
    for (const [layerName, layer] of Object.entries(this.cacheLayers)) {
      if (!layer) continue

      try {
        if (layerName === 'memory') {
          // Memory cache: iterate and check keys
          for (const [key, item] of layer.entries()) {
            if (item.type === pattern || key.includes(pattern)) {
              layer.delete(key)
            }
          }
        } else if (layerName === 'redis' && layer) {
          // Redis cache: use SCAN instead of KEYS to avoid blocking
          let cursor = '0'
          const toDelete = []
          do {
            const [next, keys] = await layer.scan(
              cursor,
              'MATCH',
              `*${pattern}*`,
              'COUNT',
              '500'
            )
            cursor = next
            if (keys.length) {
              toDelete.push(...keys)
            }
          } while (cursor !== '0')

          if (toDelete.length) {
            // Batch-delete all matched keys
            await layer.del(...toDelete)
          }
        }
      } catch (error) {
        console.error(`Pattern invalidation failed for ${layerName}:`, error)
      }
    }
  }
  }

  async getCacheItem(cacheLayer, key, config) {
    // Get item from specific cache layer
    if (cacheLayer instanceof Map) {
      return cacheLayer.get(key)
    } else if (config.layer === 'redis' && cacheLayer) {
      const item = await cacheLayer.get(key)
      return item ? JSON.parse(item) : null
    } else if (config.layer === 'database') {
      return await this.getDatabaseCacheItem(key)
    }
    
    return null
  }

  async setCacheItem(cacheLayer, key, item) {
    // Set item in specific cache layer
    if (cacheLayer instanceof Map) {
      cacheLayer.set(key, item)
      
      // Implement LRU eviction for memory cache
      if (cacheLayer.size > 1000) { // Max 1000 items in memory
        const firstKey = cacheLayer.keys().next().value
        cacheLayer.delete(firstKey)
      }
    } else if (cacheLayer && cacheLayer.setex) {
      // Redis cache with TTL
      const ttl = Math.floor((item.timestamp + this.cacheConfigs[item.type].ttl - Date.now()) / 1000)
      if (ttl > 0) {
        await cacheLayer.setex(key, ttl, JSON.stringify(item))
      }
    } else {
      // Database cache
      await this.setDatabaseCacheItem(key, item)
    }
  }

  async removeCacheItem(cacheLayer, key) {
    // Remove item from specific cache layer
    if (cacheLayer instanceof Map) {
      cacheLayer.delete(key)
    } else if (cacheLayer && cacheLayer.del) {
      await cacheLayer.del(key)
  // [Removed corrupted snippet in documentation example]
  async getD    while (this.isProcessing) {
      try {
        // Get next job from this priority queue
        const job = await this.getNextJob(queueName)
        
        if (!job) {
          // No jobs available, wait before checking again
          await this.sleep(5000) // 5 seconds
          continue
        }

        // Process the job
        await this.processJob(job)
        
      } catch (error) {
        console.error(`Queue processing error in ${queueName}:`, error)
        await this.sleep(10000) // 10 seconds before retrying
      }
    }
  }

  async getNextJob(priority) {
    // Get the next available job for this priority level
    try {
      const { data: job, error } = await supabase
        .from('background_jobs')
        .select('*')
        .eq('priority', priority)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (!job) {
        return null
      }

      // Mark job as processing to prevent duplicate processing
      const { error: updateError } = await supabase
        .from('background_jobs')
        .update({
          status: 'processing',
          started_at: new Date()
        })
        .eq('id', job.id)
        .eq('status', 'pending') // Only update if still pending

      if (updateError) {
        console.error('Failed to mark job as processing:', updateError)
        return null
      }

      return job

    } catch (error) {
      console.error('Failed to get next job:', error)
      return null
    }
  }

  async processJob(job) {
    // Execute job with comprehensive error handling and progress tracking
    const startTime = Date.now()
    this.activeJobs.set(job.id, { job, startTime })

    try {
      // Get the appropriate handler for this job type
      const handler = this.jobHandlers.get(job.job_type)
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.job_type}`)
      }

      // Update job status and increment attempt counter
      await this.updateJobProgress(job.id, {
        status: 'processing',
        attempts: job.attempts + 1,
        processing_started_at: new Date()
      })

      // Execute the job handler
      console.log(`Processing job ${job.id} (${job.job_type})`)
      const result = await handler(job.job_data, {
        jobId: job.id,
        userId: job.user_id,
        metadata: job.metadata,
        updateProgress: (progress) => this.updateJobProgress(job.id, { progress })
      })

      // Mark job as completed
      await this.updateJobProgress(job.id, {
        status: 'completed',
        completed_at: new Date(),
        result: result,
        processing_time_ms: Date.now() - startTime
      })

      console.log(`Job ${job.id} completed successfully`)

      // Send completion notification if requested
      if (job.metadata?.notifyOnCompletion && job.user_id) {
        await this.sendJobCompletionNotification(job.user_id, job, result)
      }

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error)
      
      // Determine if job should be retried
      const shouldRetry = job.attempts < job.max_attempts && this.isRetryableError(error)
      
      if (shouldRetry) {
        // Calculate next retry time with exponential backoff
        const retryDelay = Math.min(300000, Math.pow(2, job.attempts) * 1000) // Max 5 minutes
        const nextRetry = new Date(Date.now() + retryDelay)
        
        await this.updateJobProgress(job.id, {
          status: 'pending',
          error_message: error.message,
          next_retry_at: nextRetry,
          retry_count: job.attempts
        })
        
        console.log(`Job ${job.id} will retry in ${retryDelay}ms (attempt ${job.attempts}/${job.max_attempts})`)
        
      } else {
        // Mark job as permanently failed
        await this.updateJobProgress(job.id, {
          status: 'failed',
          error_message: error.message,
          failed_at: new Date(),
          processing_time_ms: Date.now() - startTime
        })

        // Send failure notification
        if (job.user_id) {
          await this.sendJobFailureNotification(job.user_id, job, error)
        }

        // Alert administrators for critical job failures
        if (this.isCriticalJob(job.job_type)) {
          await this.sendCriticalJobAlert(job, error)
        }
      }
    } finally {
      this.activeJobs.delete(job.id)
    }
  }

  async processMelissaListDownload(jobData, context) {
    // Handle Melissa list download background processing
    const { purchaseId, searchCriteria, recordCount } = jobData
    
    try {
      // Update progress
      await context.updateProgress({ step: 'downloading', progress: 10 })

      // Download list from Melissa
      const melissa = require('@/lib/melissa/client')
      const listData = await melissa.downloadPurchasedList(purchaseId)
      
      await context.updateProgress({ step: 'processing', progress: 50 })

      // Process and validate the data
      const processedData = await this.validateAndProcessMelissaData(listData)
      
      await context.updateProgress({ step: 'storing', progress: 80 })

      // Store in our system
      const storageResult = await this.storeMelissaListData(purchaseId, processedData)
      
      await context.updateProgress({ step: 'completed', progress: 100 })

      return {
        success: true,
        recordsProcessed: processedData.length,
        storageLocation: storageResult.location,
        processingNotes: processedData.processingNotes
      }

    } catch (error) {
      console.error('Melissa list download failed:', error)
      throw new Error(`List download failed: ${error.message}`)
    }
  }

  async processAccuzipFile(jobData, context) {
    // Handle AccuZIP file processing coordination
    const { mailingListId, accuzipGuid, services } = jobData
    
    try {
      await context.updateProgress({ step: 'monitoring', progress: 10 })

      // Monitor AccuZIP processing status
      const accuzip = require('@/lib/accuzip/client')
      const finalResult = await this.monitorAccuzipProcessing(accuzipGuid, context)
      
      await context.updateProgress({ step: 'downloading', progress: 70 })

      // Download processed file
      const processedFile = await accuzip.downloadProcessedFile(finalResult.downloadUrl)
      
      await context.updateProgress({ step: 'importing', progress: 90 })

      // Import processed data back to our system
      const importResult = await this.importAccuzipResults(mailingListId, processedFile, finalResult)
      
      await context.updateProgress({ step: 'completed', progress: 100 })

      return {
        success: true,
        originalRecords: finalResult.originalCount,
        processedRecords: finalResult.finalCount,
        servicesApplied: services,
        importResult: importResult
      }

    } catch (error) {
      console.error('AccuZIP processing failed:', error)
      throw new Error(`AccuZIP processing failed: ${error.message}`)
    }
  }

  async processDataExport(jobData, context) {
    // Handle large data export operations
    const { userId, exportType, filters, format } = jobData
    
    try {
      await context.updateProgress({ step: 'querying', progress: 10 })

      // Query data based on export type and filters
      const exportData = await this.queryExportData(userId, exportType, filters)
      
      await context.updateProgress({ step: 'formatting', progress: 50 })

      // Format data according to requested format
      const formattedData = await this.formatExportData(exportData, format)
      
      await context.updateProgress({ step: 'uploading', progress: 80 })

      // Upload to secure storage
      const uploadResult = await this.uploadExportFile(userId, formattedData, format)
      
      await context.updateProgress({ step: 'completed', progress: 100 })

      return {
        success: true,
        recordCount: exportData.length,
        fileSize: formattedData.length,
        downloadUrl: uploadResult.url,
        expiresAt: uploadResult.expiresAt
      }

    } catch (error) {
      console.error('Data export failed:', error)
      throw new Error(`Data export failed: ${error.message}`)
    }
  }

  async updateJobProgress(jobId, updates) {
    // Update job status and progress in database
    try {
      await supabase
        .from('background_jobs')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', jobId)
        
    } catch (error) {
      console.error('Failed to update job progress:', error)
    }
  }

  isRetryableError(error) {
    // Determine if error is retryable
    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /unavailable/i,
      /rate limit/i,
      /temporary/i
    ]

    return retryablePatterns.some(pattern => pattern.test(error.message))
  }

  isCriticalJob(jobType) {
    // Identify critical jobs that require immediate attention when they fail
    const criticalJobs = [
      'payment_processing',
      'order_submission',
      'security_alert',
      'data_backup'
    ]

    return criticalJobs.includes(jobType)
  }

  async sendJobCompletionNotification(userId, job, result) {
    // Send user notification about job completion
    const notificationData = {
      type: 'job_completed',
      title: this.getJobCompletionTitle(job.job_type),
      message: this.getJobCompletionMessage(job.job_type, result),
      data: {
        jobId: job.id,
        jobType: job.job_type,
        result: result
      }
    }

    await this.sendUserNotification(userId, notificationData)
  }

  getJobCompletionTitle(jobType) {
    const titles = {
      'melissa_list_download': 'Mailing List Ready',
      'accuzip_file_processing': 'Data Processing Complete',
      'redstone_order_submission': 'Order Submitted',
      'data_export': 'Data Export Ready'
    }

    return titles[jobType] || 'Background Task Complete'
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const jobProcessor = new BackgroundJobProcessor()
```

## **7. Testing Framework**

### **7.1 Comprehensive Testing Strategy**

The testing framework provides comprehensive coverage across all platform components while maintaining fast execution times for development workflows. This strategy balances thorough testing with practical development velocity through strategic test organization and execution.

```javascript
// Comprehensive testing framework for YLS platform
// Location: /tests/framework/test-setup.js
import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test environment configuration
export class TestEnvironment {
  constructor() {
    this.supabaseTest = createClient(
      process.env.TEST_SUPABASE_URL,
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY
    )
    
    this.testData = {
      users: new Map(),
      mailingLists: new Map(),
      orders: new Map(),
      templates: new Map()
    }
    
    this.cleanupTasks = []
  }

  async setupTestDatabase() {
    // Initialize test database with clean state
    await this.cleanupTestData()
    await this.seedTestData()
  }

  async cleanupTestData() {
    // Remove all test data in correct order to respect foreign keys
    const cleanupQueries = [
      'DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE user_id LIKE \'test_%\')',
      'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id LIKE \'test_%\')',
      'DELETE FROM orders WHERE user_id LIKE \'test_%\'',
      'DELETE FROM mailing_list_records WHERE mailing_list_id IN (SELECT id FROM mailing_lists WHERE user_id LIKE \'test_%\')',
      'DELETE FROM mailing_lists WHERE user_id LIKE \'test_%\'',
      'DELETE FROM design_templates WHERE user_id LIKE \'test_%\'',
      'DELETE FROM user_settings WHERE user_id LIKE \'test_%\'',
      'DELETE FROM user_profiles WHERE user_id LIKE \'test_%\'',
      'DELETE FROM auth.users WHERE id LIKE \'test_%\''
    ]

    for (const query of cleanupQueries) {
      try {
        await this.supabaseTest.rpc('execute_sql', { sql: query })
      } catch (error) {
        console.warn('Cleanup query failed:', query, error.message)
      }
    }
  }

  async seedTestData() {
    // Create standardized test data for consistent testing
    
    // Create test users with different roles and configurations
    const testUsers = [
      {
        id: 'test_user_individual',
        email: 'individual@test.com',
        role: 'user',
        companyName: 'Individual Test User',
        industry: 'real_estate'
      },
      {
        id: 'test_user_business',
        email: 'business@test.com',
        role: 'admin',
        companyName: 'Business Test Corp',
        industry: 'marketing'
      },
      {
        id: 'test_user_enterprise',
        email: 'enterprise@test.com',
        role: 'account_owner',
        companyName: 'Enterprise Test LLC',
        industry: 'finance'
      }
    ]

    for (const userData of testUsers) {
      const user = await this.createTestUser(userData)
      this.testData.users.set(userData.id, user)
    }

    // Create test mailing lists
    await this.createTestMailingLists()
    
    // Create test design templates
    await this.createTestTemplates()
    
    // Create test orders in various states
    await this.createTestOrders()
  }

  async createTestUser(userData) {
    // Create user in auth.users table
    const { data: authUser, error: authError } = await this.supabaseTest.auth.admin.createUser({
      id: userData.id,
      email: userData.email,
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        test_user: true
      }
    })

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`)
    }

    // Create user profile
    const { data: profile, error: profileError } = await this.supabaseTest
      .from('user_profiles')
      .insert({
        user_id: userData.id,
        email: userData.email,
        company_name: userData.companyName,
        industry: userData.industry,
        onboarding_completed: true,
        email_verified: true,
        created_at: new Date()
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`)
    }

    // Create user settings
    await this.supabaseTest
      .from('user_settings')
      .insert({
        user_id: userData.id,
        email_notifications: true,
        sms_notifications: false,
        timezone: 'America/New_York'
      })

    // Create user role if not default
    if (userData.role !== 'user') {
      await this.supabaseTest
        .from('user_roles')
        .insert({
          user_id: userData.id,
          role_name: userData.role,
          active: true,
          granted_by: userData.id,
          granted_at: new Date()
        })
    }

    return { ...authUser.user, profile }
  }

  async createTestMailingLists() {
    // Create mailing lists with different characteristics
    const listConfigs = [
      {
        name: 'Small Test List',
        userId: 'test_user_individual',
        recordCount: 50,
        source: 'manual'
      },
      {
        name: 'Medium Test List',
        userId: 'test_user_business',
        recordCount: 500,
        source: 'csv_upload'
      },
      {
        name: 'Large Test List',
        userId: 'test_user_enterprise',
        recordCount: 5000,
        source: 'melissa_purchase'
      }
    ]

    for (const config of listConfigs) {
      const mailingList = await this.createTestMailingList(config)
      this.testData.mailingLists.set(config.name, mailingList)
    }
  }

  async createTestMailingList(config) {
    // Create mailing list
    const { data: mailingList, error: listError } = await this.supabaseTest
      .from('mailing_lists')
      .insert({
        user_id: config.userId,
        name: config.name,
        description: `Test mailing list: ${config.name}`,
        source: config.source,
        status: 'active',
        record_count: config.recordCount,
        created_at: new Date()
      })
      .select()
      .single()

    if (listError) {
      throw new Error(`Failed to create test mailing list: ${listError.message}`)
    }

    // Create sample records
    const records = this.generateTestRecords(mailingList.id, config.recordCount)
    
    const { error: recordsError } = await this.supabaseTest
      .from('mailing_list_records')
      .insert(records)

    if (recordsError) {
      throw new Error(`Failed to create test records: ${recordsError.message}`)
    }

    return mailingList
  }

  generateTestRecords(mailingListId, count) {
    // Generate realistic test contact data
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Maria']
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Maple Way', 'Cedar Ln']
    const cities = ['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Arlington', 'Riverside']
    const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI']

    const records = []
    for (let i = 0; i < Math.min(count, 100); i++) { // Limit to 100 for performance
      records.push({
        mailing_list_id: mailingListId,
        first_name: firstNames[Math.floor(Math.random() * firstNames.length)],
        last_name: lastNames[Math.floor(Math.random() * lastNames.length)],
        address_line_1: `${Math.floor(Math.random() * 9999) + 1} ${streets[Math.floor(Math.random() * streets.length)]}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: states[Math.floor(Math.random() * states.length)],
        zip_code: String(Math.floor(Math.random() * 90000) + 10000),
        email: Math.random() > 0.3 ? `test${i}@example.com` : null,
        phone: Math.random() > 0.5 ? `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}` : null,
        created_at: new Date()
      })
    }

    return records
  }

  // Utility methods for test execution
  async getTestUser(userType = 'individual') {
    const userId = `test_user_${userType}`
    return this.testData.users.get(userId)
  }

  async createAuthenticatedRequest(userType = 'individual') {
    // Create authenticated request context for API testing
    const user = await this.getTestUser(userType)
    const { data: session } = await this.supabaseTest.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    })

    return {
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      },
      user: user
    }
  }

  async cleanup() {
    // Execute all registered cleanup tasks
    for (const task of this.cleanupTasks.reverse()) {
      try {
        await task()
      } catch (error) {
        console.warn('Cleanup task failed:', error)
      }
    }
    
    this.cleanupTasks = []
    await this.cleanupTestData()
  }

  registerCleanupTask(task) {
    this.cleanupTasks.push(task)
  }
}

// Global test environment instance
export const testEnv = new TestEnvironment()

// Jest setup and teardown
beforeAll(async () => {
  await testEnv.setupTestDatabase()
}, 30000) // 30 second timeout for database setup

afterAll(async () => {
  await testEnv.cleanup()
}, 10000)

beforeEach(() => {
  // Reset any test-specific state
  jest.clearAllMocks()
})

afterEach(async () => {
  // Clean up test-specific data
  // Individual tests can register cleanup tasks if needed
})
```

### **7.2 Integration Testing for External APIs**

Integration testing ensures that external API interactions work correctly under various scenarios while providing fast feedback during development through strategic mocking and test data management.

```javascript
// Integration testing for external API components
// Location: /tests/integration/external-apis.test.js
import { testEnv } from '../framework/test-setup'
import { melissa } from '@/lib/melissa/client'
import { accuzip } from '@/lib/accuzip/client'
import { redstone } from '@/lib/redstone/client'

describe('External API Integrations', () => {
  describe('Melissa API Integration', () => {
    beforeEach(() => {
      // Mock Melissa API responses for consistent testing
      jest.spyOn(melissa, 'getRecordCount').mockImplementation(async (filters) => {
        // Return realistic mock data based on filters
        const baseCount = 10000
        const stateMultiplier = filters.geography?.states?.length || 1
        const priceMultiplier = filters.property?.value ? 0.7 : 1
        
        return {
          recordCount: Math.floor(baseCount * stateMultiplier * priceMultiplier),
          breakdown: {
            geography: Math.floor(baseCount * stateMultiplier),
            property: Math.floor(baseCount * stateMultiplier * priceMultiplier),
            demographics: Math.floor(baseCount * stateMultiplier * priceMultiplier * 0.8)
          },
          responseTime: 1200
        }
      })
    })

    test('should create search criteria and calculate accurate estimates', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('individual')
      
      const response = await fetch('/api/melissa/search-criteria', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({
          criteriaName: 'Integration Test Criteria',
          filters: {
            geography: { states: ['CA', 'TX'] },
            property: { valueMin: 300000, valueMax: 800000 }
          }
        })
      })

      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.estimatedCount).toBeGreaterThan(0)
      expect(result.estimatedCost).toBeGreaterThan(0)
      expect(melissa.getRecordCount).toHaveBeenCalledWith(
        expect.objectContaining({
          geography: { states: ['CA', 'TX'] },
          property: { value: { min: 300000, max: 800000 } }
        })
      )
    })

    test('should handle API rate limiting correctly', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('individual')
      
      // Mock rate limiting by making multiple rapid requests
      const requests = Array.from({ length: 6 }, () =>
        fetch('/api/melissa/live-count', {
          method: 'POST',
          headers: authRequest.headers,
          body: JSON.stringify({ filters: {} })
        })
      )

      const responses = await Promise.all(requests)
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
      
      const rateLimitedResult = await rateLimitedResponses[0].json()
      expect(rateLimitedResult.error).toContain('Rate limit exceeded')
      expect(rateLimitedResult.resetTime).toBeDefined()
    })

    test('should handle Melissa API errors with graceful degradation', async () => {
      // Mock API failure
      melissa.getRecordCount.mockRejectedValueOnce(new Error('Melissa API timeout'))
      
      const authRequest = await testEnv.createAuthenticatedRequest('individual')
      
      const response = await fetch('/api/melissa/live-count', {
        method: 'POST',
        headers: authRequest.headers,
        body: JSON.stringify({ filters: {} })
      })

      expect(response.status).toBe(500)
      
      const result = await response.json()
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to get record count')
      expect(result.suggestions).toContain('Please try again in a moment')
    })
  })

  describe('AccuZIP API Integration', () => {
    beforeEach(() => {
      // Mock AccuZIP API responses
      jest.spyOn(accuzip, 'uploadFile').mockImplementation(async (options) => ({
        guid: `mock_guid_${Date.now()}`,
        status: 'uploaded',
        recordCount: options.file.size > 1000 ? 1000 : 100,
        estimatedProcessingTime: '10-15 minutes'
      }))
    })

    test('should upload file and create processing job successfully', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('business')
      const testUser = await testEnv.getTestUser('business')
      const testList = testEnv.testData.mailingLists.get('Medium Test List')

      // Create mock CSV file
      const csvContent = 'first_name,last_name,address,city,state,zip\nJohn,Doe,123 Main St,Anytown,CA,12345'
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const formData = new FormData()
      formData.append('mailingList', mockFile)
      formData.append('mailingListId', testList.id)

      const response = await fetch('/api/accuzip/upload', {
        method: 'POST',
        headers: { 'Authorization': authRequest.headers.Authorization },
        body: formData
      })

      expect(response.status).toBe(201)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.accuzipGuid).toMatch(/^mock_guid_/)
      expect(result.processingSteps).toEqual(['cass', 'ncoa', 'dups', 'presort'])
      expect(accuzip.uploadFile).toHaveBeenCalled()
    })

    test('should reject invalid file uploads with clear error messages', async () => {
      const authRequest = await testEnv.createAuthenticatedRequest('business')
      const testList = testEnv.testData.mailingLists.get('Medium Test List')

      // Create invalid file (wrong format)
      const invalidContent = 'This is not a CSV file'
      const mockFile = new File([invalidContent], 'test.txt', { type: 'text/plain' })

      const formData = new FormData()
      formData.append('mailingList', mockFile)
      formData.append('mailingListId', testList.id)

      const response = await fetch('/api/accuzip/upload', {
        method: 'POST',
        headers: { 'Authorization': authRequest.headers.Authorization },
        body: formData
      })

      expect(response.status).toBe(400)
      
      const result = await response.json()
      expect(result.error).toContain('Invalid CSV structure')
      expect(result.suggestions).toBeDefined()
    })

    test('should process webhooks and update job status correctly', async () => {
      // Create test AccuZIP job
      const testList = testEnv.testData.mailingLists.get('Medium Test List')
      const { data: testJob } = await testEnv.supabaseTest
        .from('accuzip_jobs')
        .insert({
          mailing_list_id: testList.id,
          accuzip_guid: 'test_webhook_guid',
          job_status: 'uploaded',
          total_records: 500,
          callback_url: 'http://localhost:3000/api/accuzip/webhook'
        })
        .select()
        .single()

      testEnv.registerCleanupTask(async () => {
        await testEnv.supabaseTest
          .from('accuzip_jobs')
          .delete()
          .eq('id', testJob.id)
      })

      // Simulate webhook from AccuZIP
      const webhookPayload = {
        guid: 'test_webhook_guid',
        step: 'cass',
        status: 'completed',
        results: {
          processedRecords: 485,
          standardizedAddresses: 465,
          undeliverableAddresses: 20
        }
      }
      const response = await fetch('/api/accuzip/webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-AccuZIP-Signature': 'mock_signature'
        }
      });
      switch (classification) {
        case 'pii':
          return await this.encryptWithStandardSecurity(data, this.encryptionKeys.pii)
        case 'internal':
          return await this.encryptWithBasicSecurity(data, this.encryptionKeys.general)
        case 'public':
          return data // No encryption needed for public data
        default:
          throw new Error(`Unknown data classification: ${classification}`)
      }
    }
  }

  async encryptWithAdvancedSecurity(data, key) {
    // AES-256-GCM with additional authentication and key rotation
  async encryptWithAdvancedSecurity(data, key) {
    const crypto    = require('crypto')
    const algorithm = 'aes-256-gcm'
    const iv        = crypto.randomBytes(12)                          // 96-bit IV for GCM
    const timestamp = Date.now().toString()
    const aad       = Buffer.from(`YLS-HSEC-${timestamp}`)
    const encKey    = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64')
    const cipher    = crypto.createCipheriv(algorithm, encKey, iv, { authTagLength: 16 })

    cipher.setAAD(aad)
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8')
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const authTag   = cipher.getAuthTag()

    return {
      encrypted: encrypted.toString('hex'),
      iv:        iv.toString('hex'),
      authTag:   authTag.toString('hex'),
      timestamp,
      algorithm,
      keyVersion: this.getCurrentKeyVersion('financial')
    }
  }
  async encryptWithStandardSecurity(data, key) {
    // AES-256-CBC with HMAC authentication
    const crypto = require('crypto')
    const algorithm = 'aes-256-cbc'
    
  async encryptWithStandardSecurity(data, key) {
    const crypto = require('crypto')
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)
    const encKey = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64')
    const cipher = crypto.createCipheriv(algorithm, encKey, iv)
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8')
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
    // derive mac key via HKDF
    const macKey = crypto.hkdfSync('sha256', encKey, iv, Buffer.from('yls-mac'), 32)
    const hmac = crypto.createHmac('sha256', macKey)
      .update(Buffer.concat([encrypted, iv]))
      .digest('hex')
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      signature: hmac,
      algorithm,
      keyVersion: this.getCurrentKeyVersion('pii')
    }
  }
    
    if (encryptedData.algorithm === 'aes-256-gcm') {
      return await this.decryptAdvancedSecurity(encryptedData, key)
    } else if (encryptedData.algorithm === 'aes-256-cbc') {
      return await this.decryptStandardSecurity(encryptedData, key)
    } else {
      throw new Error(`Unsupported encryption algorithm: ${encryptedData.algorithm}`)
    }
  }

  classifyData(dataType) {
    // Determine data classification based on type
    for (const [classification, types] of Object.entries(this.dataClassification)) {
      if (types.includes(dataType)) {
        return classification
      }
    }
    return 'internal' // Default classification
  }

  // Data masking for logging and debugging
  maskSensitiveData(data, purpose = 'logging') {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const masked = {}
    const maskingRules = this.getMaskingRules(purpose)

    for (const [key, value] of Object.entries(data)) {
      const fieldClassification = this.classifyData(key)
      
      if (maskingRules[fieldClassification]) {
        masked[key] = this.applyMaskingRule(value, maskingRules[fieldClassification])
      } else {
        masked[key] = value
      }
    }

    return masked
  }

  getMaskingRules(purpose) {
    const rules = {
      'logging': {
        'highly_sensitive': 'redact_completely',
        'sensitive': 'partial_mask',
        'internal': 'no_mask',
        'public': 'no_mask'
      },
      'debugging': {
        'highly_sensitive': 'redact_completely',
        'sensitive': 'format_preserve',
        'internal': 'partial_mask',
        'public': 'no_mask'
      },
      'analytics': {
        'highly_sensitive': 'redact_completely',
        'sensitive': 'hash_value',
        'internal': 'no_mask',
        'public': 'no_mask'
      }
    }

    return rules[purpose] || rules['logging']
  }

  applyMaskingRule(value, rule) {
    if (!value) return value

    const str = value.toString()

    switch (rule) {
      case 'redact_completely':
        return '[REDACTED]'
      
      case 'partial_mask':
        if (str.length <= 2) return '*'.repeat(str.length)
        return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1)
      
      case 'format_preserve':
        if (str.includes('@')) {
          // Email format
          const [local, domain] = str.split('@')
          return `${local.charAt(0)}***@${domain}`
        } else if (str.match(/^\d{10}$/)) {
          // Phone format
          return `***-***-${str.slice(-4)}`
        } else {
          return this.applyMaskingRule(value, 'partial_mask')
        }
      
      case 'hash_value':
        const crypto = require('crypto')
        return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8)
      
      case 'no_mask':
      default:
        return value
    }
  }
}

export const dataProtection = new DataProtectionManager()
```

### **5.2 API Security and Rate Limiting**

API security implementation provides comprehensive protection against abuse while maintaining performance for legitimate users. The rate limiting system adapts to user behavior and operation types while providing clear feedback about limits and reset times.

```javascript
// Advanced API security and adaptive rate limiting
// Location: /lib/security/api-security.js
export class APISecurityManager {
  constructor() {
    this.rateLimits = {
      // Global limits per user per hour
      'global': { requests: 1000, window: '1h' },
      
      // Endpoint-specific limits
      'auth': { requests: 10, window: '15m' }, // Login attempts
      'melissa_count': { requests: 20, window: '1h' }, // Expensive API calls
      'file_upload': { requests: 50, window: '1h' }, // File processing
      'order_creation': { requests: 100, window: '1h' }, // Order submissions
      
      // External API integration limits
      'external_api': { requests: 200, window: '1h' },
      
      // Data export limits
      'data_export': { requests: 5, window: '24h' }
    }

    this.suspiciousPatterns = {
      'rapid_fire': { threshold: 100, window: '5m' },
      'failed_auth': { threshold: 5, window: '15m' },
      'large_requests': { sizeThreshold: 10485760, countThreshold: 20 } // 10MB
    }
  }

  async validateAPIRequest(req, res, limitType = 'global') {
    try {
      const clientId = this.getClientIdentifier(req)
      const endpoint = this.getEndpointIdentifier(req)
      
      // Check multiple rate limiting layers
      const rateLimitResults = await Promise.all([
        this.checkRateLimit(clientId, limitType),
        this.checkGlobalRateLimit(clientId),
        this.checkSuspiciousActivity(clientId, req),
        this.checkGeographicRestrictions(req),
        this.validateRequestSecurity(req)
      ])

      // Analyze all security check results
      const failedChecks = rateLimitResults.filter(result => !result.allowed)
      
      if (failedChecks.length > 0) {
        const primaryFailure = failedChecks[0]
        
        // Log security violation
        await this.logSecurityViolation(clientId, endpoint, {
          violationType: primaryFailure.reason,
          failedChecks: failedChecks,
          requestDetails: this.sanitizeRequestForLogging(req)
        })

        // Apply progressive penalties for repeat violations
        await this.applySecurityPenalty(clientId, primaryFailure.reason)

        return {
          allowed: false,
          reason: primaryFailure.reason,
          retryAfter: primaryFailure.retryAfter,
          securityCode: primaryFailure.code
        }
      }

      // Log successful API access
      await this.logAPIAccess(clientId, endpoint, 'success')

      return { allowed: true }

    } catch (error) {
      console.error('API security validation error:', error)
      return {
        allowed: false,
        reason: 'Security validation failed',
        securityCode: 'VALIDATION_ERROR'
      }
    }
  }

  async checkRateLimit(clientId, limitType) {
    const limit = this.rateLimits[limitType] || this.rateLimits['global']
    const windowMs = this.parseTimeWindow(limit.window)
    const windowStart = Date.now() - windowMs
    
    // Get request count in current window
    const { data: requestCount } = await supabase
      .from('api_rate_limits')
      .select('request_count, time_window_start')
      .eq('client_id', clientId)
      .eq('limit_type', limitType)
      .gte('time_window_start', new Date(windowStart))
      .single()

    const currentCount = requestCount?.request_count || 0
    
    if (currentCount >= limit.requests) {
      const resetTime = new Date(requestCount.time_window_start.getTime() + windowMs)
      
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000)
      }
    }

    // Increment request count
    await this.incrementRateLimit(clientId, limitType, windowStart)
    
    return { allowed: true, remaining: limit.requests - currentCount - 1 }
  }

  async checkSuspiciousActivity(clientId, req) {
    // Analyze request patterns for suspicious behavior
    const suspiciousIndicators = []
    
    // Check for rapid-fire requests
    const rapidFireCheck = await this.checkRapidFirePattern(clientId)
    if (rapidFireCheck.suspicious) {
      suspiciousIndicators.push('rapid_fire_requests')
    }

    // Check for unusual request sizes
    const requestSize = this.getRequestSize(req)
    if (requestSize > this.suspiciousPatterns.large_requests.sizeThreshold) {
      const largeRequestCount = await this.countLargeRequests(clientId, '1h')
      if (largeRequestCount > this.suspiciousPatterns.large_requests.countThreshold) {
        suspiciousIndicators.push('excessive_large_requests')
      }
    }

    // Check for failed authentication patterns
    const failedAuthCheck = await this.checkFailedAuthPattern(clientId)
    if (failedAuthCheck.suspicious) {
      suspiciousIndicators.push('repeated_auth_failures')
    }

    if (suspiciousIndicators.length > 0) {
      return {
        allowed: false,
        reason: 'Suspicious activity detected',
        code: 'SUSPICIOUS_ACTIVITY',
        indicators: suspiciousIndicators,
        retryAfter: 3600 // 1 hour penalty for suspicious activity
      }
    }

    return { allowed: true }
  }

  async validateRequestSecurity(req) {
    // Comprehensive request security validation
    const securityChecks = []

    // Validate headers for security
    const headerValidation = this.validateSecurityHeaders(req.headers)
    if (!headerValidation.valid) {
      securityChecks.push({
        check: 'headers',
        issue: headerValidation.issue,
        severity: 'medium'
      })
    }

    // Check for injection attempts in parameters
    const injectionCheck = this.checkForInjectionAttempts(req)
    if (injectionCheck.detected) {
      securityChecks.push({
        check: 'injection',
        issue: 'Potential injection attempt detected',
        severity: 'high'
      })
    }

    // Validate content type and size
    const contentValidation = this.validateRequestContent(req)
    if (!contentValidation.valid) {
      securityChecks.push({
        check: 'content',
        issue: contentValidation.issue,
        severity: 'medium'
      })
    }

    // Check for high-severity security issues
    const highSeverityIssues = securityChecks.filter(check => check.severity === 'high')
    if (highSeverityIssues.length > 0) {
      return {
        allowed: false,
        reason: 'Security policy violation',
        code: 'SECURITY_VIOLATION',
        details: highSeverityIssues
      }
    }

    return { allowed: true, warnings: securityChecks }
  }

  checkForInjectionAttempts(req) {
    // Check for common injection patterns
    const injectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i, // SQL injection
      /<script[^>]*>.*?<\/script>/i, // XSS
      /javascript:/i, // JavaScript protocol
      /(\$\{|\#\{)/i, // Template injection
      /(\.\.\/|\.\.\\)/i, // Path traversal
      /(\beval\b|\bexec\b)/i // Code execution
    ]

    const testStrings = [
      JSON.stringify(req.query || {}),
      JSON.stringify(req.body || {}),
      req.url || ''
    ].join(' ')

    const detectedPatterns = injectionPatterns.filter(pattern => pattern.test(testStrings))
    
    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns.map(p => p.source)
    }
  }

  getClientIdentifier(req) {
    // Generate stable client identifier for rate limiting
    const forwardedFor = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const userAgent = req.headers['user-agent'] || 'unknown'
    const authHeader = req.headers['authorization']
    
    // Use authenticated user ID if available, otherwise use IP + User-Agent hash
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const decoded = jwt.decode(token)
        return `user:${decoded.sub}`
      } catch (error) {
        // Fall back to IP-based identification
      }
    }

    const crypto = require('crypto')
    const clientHash = crypto
      .createHash('sha256')
      .update(`${forwardedFor}:${userAgent}`)
      .digest('hex')
      .substring(0, 16)
    
    return `anon:${clientHash}`
  }

  async applySecurityPenalty(clientId, violationType) {
    // Progressive penalties for security violations
    const { data: violationHistory } = await supabase
      .from('security_violations')
      .select('violation_type, created_at')
      .eq('client_id', clientId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .order('created_at', { ascending: false })

    const recentViolations = violationHistory?.length || 0
    
    // Calculate penalty duration based on violation history
    let penaltyDuration = 5 * 60 * 1000 // Base: 5 minutes
    
    if (recentViolations > 5) {
      penaltyDuration = 60 * 60 * 1000 // 1 hour for repeat offenders
    } else if (recentViolations > 2) {
      penaltyDuration = 15 * 60 * 1000 // 15 minutes for multiple violations
    }

    // Apply temporary restriction
    await supabase
      .from('client_restrictions')
      .upsert({
        client_id: clientId,
        restriction_type: 'security_penalty',
        expires_at: new Date(Date.now() + penaltyDuration),
        reason: violationType,
        created_at: new Date()
      }, { onConflict: 'client_id' })
  }
}

export const apiSecurity = new APISecurityManager()
```

## **6. Development Patterns**

### **6.1 Error Handling and Recovery Patterns**

The platform implements comprehensive error handling patterns that provide graceful degradation while maintaining data integrity and user experience. These patterns standardize error responses across all platform components while enabling effective debugging and monitoring.

```javascript
// Standardized error handling and recovery system
// Location: /lib/error-handling/platform-errors.js
export class PlatformErrorHandler {
  constructor() {
    this.errorCategories = {
      'validation': {
        httpStatus: 400,
        userMessage: 'Please check your input and try again',
        logLevel: 'info',
        retryable: false
      },
      'authentication': {
        httpStatus: 401,
        userMessage: 'Please sign in to continue',
        logLevel: 'warning',
        retryable: true
      },
      'authorization': {
        httpStatus: 403,
        userMessage: 'You do not have permission for this action',
        logLevel: 'warning',
        retryable: false
      },
      'not_found': {
        httpStatus: 404,
        userMessage: 'The requested resource was not found',
        logLevel: 'info',
        retryable: false
      },
      'external_service': {
        httpStatus: 502,
        userMessage: 'External service temporarily unavailable',
        logLevel: 'error',
        retryable: true
      },
      'database': {
        httpStatus: 500,
        userMessage: 'Database operation failed',
        logLevel: 'error',
        retryable: true
      },
      'internal': {
        httpStatus: 500,
        userMessage: 'An unexpected error occurred',
        logLevel: 'error',
        retryable: true
      }
    }
  }

  async handleError(error, context = {}) {
    try {
      // Classify the error
      const errorInfo = this.classifyError(error)
      
      // Enrich error with context
      const enrichedError = {
        ...errorInfo,
        context: context,
        timestamp: new Date().toISOString(),
        requestId: context.requestId || this.generateRequestId(),
        userId: context.userId,
        operation: context.operation
      }

      // Log error with appropriate level
      await this.logError(enrichedError)

      // Send alerts for critical errors
      if (this.shouldAlert(enrichedError)) {
        await this.sendErrorAlert(enrichedError)
      }

      // Attempt recovery if possible
      const recoveryResult = await this.attemptRecovery(enrichedError, context)
      
      // Return standardized error response
      return this.formatErrorResponse(enrichedError, recoveryResult)

    } catch (handlingError) {
      console.error('Error handler failed:', handlingError)
      return this.formatFallbackErrorResponse()
    }
  }

  classifyError(error) {
    // Classify errors based on type, message, and properties
    let category = 'internal' // Default category
    let specificType = 'unknown'
    let originalMessage = error.message || 'Unknown error'

    // Check for specific error types
    if (error.name === 'ValidationError' || originalMessage.includes('validation')) {
      category = 'validation'
      specificType = 'validation_failed'
    } else if (error.message?.includes('authentication') || error.status === 401) {
      category = 'authentication'
      specificType = 'auth_required'
    } else if (error.message?.includes('permission') || error.status === 403) {
      category = 'authorization'
      specificType = 'access_denied'
    } else if (error.message?.includes('not found') || error.status === 404) {
      category = 'not_found'
      specificType = 'resource_not_found'
    } else if (error.message?.includes('rate limit')) {
      category = 'validation'
      specificType = 'rate_limit_exceeded'
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      category = 'external_service'
      specificType = 'service_timeout'
    } else if (error.message?.includes('database') || error.code?.startsWith('P')) {
      category = 'database'
      specificType = 'database_error'
    } else if (error.message?.includes('external') || error.message?.includes('API')) {
      category = 'external_service'
      specificType = 'external_api_error'
    }

    const categoryConfig = this.errorCategories[category]
    
    return {
      category: category,
      specificType: specificType,
      originalMessage: originalMessage,
      httpStatus: error.status || categoryConfig.httpStatus,
      userMessage: this.generateUserMessage(specificType, originalMessage),
      logLevel: categoryConfig.logLevel,
      retryable: categoryConfig.retryable,
      stack: error.stack
    }
  }

  generateUserMessage(specificType, originalMessage) {
    // Generate user-friendly error messages
    const userMessages = {
      'validation_failed': 'Please check your input and correct any errors',
      'auth_required': 'Please sign in to continue',
      'access_denied': 'You do not have permission to perform this action',
      'resource_not_found': 'The requested item could not be found',
      'rate_limit_exceeded': 'Please wait a moment before trying again',
      'service_timeout': 'The service is taking longer than expected. Please try again',
      'database_error': 'We are experiencing technical difficulties. Please try again',
      'external_api_error': 'External service temporarily unavailable'
    }

    return userMessages[specificType] || 'An unexpected error occurred. Please try again or contact support'
  }

  async attemptRecovery(errorInfo, context) {
    // Attempt automatic recovery based on error type
    if (!errorInfo.retryable) {
      return { attempted: false, reason: 'Error not retryable' }
    }

    try {
      switch (errorInfo.specificType) {
        case 'service_timeout':
          return await this.retryWithBackoff(context.operation, context.operationArgs)
          
        case 'external_api_error':
          return await this.tryAlternativeService(context.service, context.operation, context.operationArgs)
          
        case 'database_error':
          return await this.retryDatabaseOperation(context.operation, context.operationArgs)
          
        default:
          return { attempted: false, reason: 'No recovery strategy available' }
      }
    } catch (recoveryError) {
      return { 
        attempted: true, 
        success: false, 
        error: recoveryError.message 
      }
    }
  }

  async retryWithBackoff(operation, args, maxRetries = 3) {
    // Exponential backoff retry strategy
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
        await this.sleep(delay)
        
        const result = await operation(...args)
        return { 
          attempted: true, 
          success: true, 
          attempt: attempt,
          result: result 
        }
      } catch (retryError) {
        if (attempt === maxRetries) {
          return { 
            attempted: true, 
            success: false, 
            attempts: maxRetries,
            finalError: retryError.message 
          }
        }
      }
    }
  }

  formatErrorResponse(errorInfo, recoveryResult) {
    // Standardized error response format
    const response = {
      success: false,
      error: {
        type: errorInfo.specificType,
        message: errorInfo.userMessage,
        code: errorInfo.category.toUpperCase(),
        timestamp: errorInfo.timestamp,
        requestId: errorInfo.requestId
      }
    }

    // Add retry information if applicable
    if (errorInfo.retryable) {
      response.error.retryable = true
      if (errorInfo.specificType === 'rate_limit_exceeded') {
        response.error.retryAfter = 60 // seconds
      }
    }

    // Add recovery information if attempted
    if (recoveryResult?.attempted) {
      response.recovery = {
        attempted: true,
        success: recoveryResult.success
      }
      
      if (recoveryResult.success) {
        response.success = true
        response.data = recoveryResult.result
        delete response.error // Remove error if recovery succeeded
      }
    }

    // Add suggestions for resolution
    response.suggestions = this.generateResolutionSuggestions(errorInfo)

    return response
  }

  generateResolutionSuggestions(errorInfo) {
    // Provide actionable suggestions based on error type
    const suggestions = {
      'validation_failed': [
        'Check that all required fields are filled out',
        'Verify that email addresses and phone numbers are in the correct format',
        'Ensure file uploads meet size and format requirements'
      ],
      'auth_required': [
        'Sign in to your account',
        'Check if your session has expired',
        'Clear your browser cache and try again'
      ],
      'access_denied': [
        'Contact your account administrator for permission',
        'Verify you are signed in to the correct account',
        'Check if your account subscription includes this feature'
      ],
      'service_timeout': [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the problem persists'
      ],
      'external_api_error': [
        'Try again in a few minutes',
        'Check the service status page for known issues',
        'Contact support if you continue to experience problems'
      ]
    }

    return suggestions[errorInfo.specificType] || [
      'Try refreshing the page',
      'Clear your browser cache and cookies',
      'Contact support if the problem continues'
    ]
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const errorHandler = new PlatformErrorHandler()
```

### **6.2 Background Job Processing and Queue Management**

The background job system handles long-running operations and external service integrations while providing progress tracking and failure recovery. This system ensures that user-facing operations remain responsive while complex workflows execute reliably in the background.

```javascript
// Comprehensive background job processing system
// Location: /lib/background-jobs/job-processor.js
export class BackgroundJobProcessor {
  constructor() {
    this.queues = {
      'high_priority': { concurrency: 3, retryAttempts: 5 },
      'normal_priority': { concurrency: 5, retryAttempts: 3 },
      'low_priority': { concurrency: 2, retryAttempts: 2 },
      'external_api': { concurrency: 2, retryAttempts: 4 }, // Limited to respect API limits
      'data_processing': { concurrency: 1, retryAttempts: 3 } // CPU intensive operations
    }

    this.jobHandlers = new Map()
    this.activeJobs = new Map()
    this.isProcessing = false
  }

  async initializeProcessor() {
    // Register all job handlers
    this.registerJobHandlers()
    
    // Start processing queues
    this.startQueueProcessing()
    
    // Set up job monitoring and cleanup
    this.startJobMonitoring()
    
    console.log('Background job processor initialized')
  }

  registerJobHandlers() {
    // Register handlers for different job types
    this.jobHandlers.set('melissa_list_download', this.processMelissaListDownload.bind(this))
    this.jobHandlers.set('accuzip_file_processing', this.processAccuzipFile.bind(this))
    this.jobHandlers.set('redstone_order_submission', this.processRedstoneOrder.bind(this))
    this.jobHandlers.set('email_notification', this.processEmailNotification.bind(this))
    this.jobHandlers.set('data_export', this.processDataExport.bind(this))
    this.jobHandlers.set('analytics_calculation', this.processAnalyticsCalculation.bind(this))
    this.jobHandlers.set('file_cleanup', this.processFileCleanup.bind(this))
  }

  async addJob(jobType, jobData, options = {}) {
    // Add job to appropriate queue with tracking
    try {
      const jobId = this.generateJobId()
      const priority = options.priority || 'normal_priority'
      const delay = options.delay || 0
      const scheduledFor = new Date(Date.now() + delay)

      const job = {
        id: jobId,
        type: jobType,
        data: jobData,
        priority: priority,
        status: 'pending',
        attempts: 0,
        maxAttempts: this.queues[priority].retryAttempts,
        createdAt: new Date(),
        scheduledFor: scheduledFor,
        userId: options.userId,
        metadata: options.metadata || {}
      }

      // Store job in database for persistence
      await supabase
        .from('background_jobs')
        .insert({
          id: jobId,
          job_type: jobType,
          job_data: jobData,
          priority: priority,
          status: 'pending',
          user_id: options.userId,
          scheduled_for: scheduledFor,
          metadata: job.metadata,
          created_at: new Date()
        })

      console.log(`Job ${jobId} (${jobType}) added to ${priority} queue`)
      return { jobId: jobId, status: 'queued' }

    } catch (error) {
      console.error('Failed to add background job:', error)
      throw new Error('Job queue operation failed')
    }
  }

  async startQueueProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    
    // Process each queue according to its concurrency limits
    for (const [queueName, config] of Object.entries(this.queues)) {
      for (let i = 0; i < config.concurrency; i++) {
        this.processQueue(queueName).catch(error => {
          console.error(`Queue ${queueName} processor ${i} failed:`, error)
        })
      }
    }
  }

  async processQueue(queueName) {
    while (this.isProcessing) {  design_overrides JSONB DEFAULT '{}', -- Item-specific design modifications
  production_notes TEXT, -- Special production requirements
  async processQueue(queueName) {
    while (this.isProcessing) {
      try {
        const job = await this.getNextJob(queueName)
        if (!job) {
          await this.sleep(5000)
          continue
        }
        await this.processJob(job)
      } catch (error) {
        console.error(`Queue processing error in ${queueName}:`, error)
        await this.sleep(10000)
      }
    }
  }
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fulfillment_type VARCHAR(50) NOT NULL,
  current_step VARCHAR(100) NOT NULL,
  total_steps INTEGER NOT NULL,
  steps_completed INTEGER DEFAULT 0,
  workflow_data JSONB NOT NULL, -- Step definitions and progress tracking
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order status history for comprehensive audit trail
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES auth.users(id), -- NULL for system changes
  change_reason TEXT,
  system_notes JSONB, -- Additional context for system-initiated changes
  changed_at TIMESTAMP DEFAULT NOW()
);

-- Shipping addresses with validation status
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  address_type VARCHAR(50) DEFAULT 'shipping', -- 'shipping', 'billing', 'return'
  recipient_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(50) DEFAULT 'US',
  phone VARCHAR(20),
  delivery_instructions TEXT,
  address_validated BOOLEAN DEFAULT FALSE,
  validation_result JSONB, -- USPS or other validation service results
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **4.2 External API Integration Schema**

The external API integration schema maintains clear separation between platform data and external service data while providing comprehensive tracking of all external interactions. This design enables debugging, performance monitoring, and compliance auditing across all integrated services.

```sql
-- Melissa Global Intelligence integration tables
-- Track search criteria configurations and usage patterns
CREATE TABLE melissa_search_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criteria_name VARCHAR(255) NOT NULL,
  
  -- Filter categories stored as structured JSON for flexibility
  geography_filters JSONB NOT NULL DEFAULT '{}', -- States, counties, ZIP codes, radius
  mortgage_filters JSONB NOT NULL DEFAULT '{}', -- Loan amounts, equity, foreclosure status
  property_filters JSONB NOT NULL DEFAULT '{}', -- Property values, types, age
  demographic_filters JSONB NOT NULL DEFAULT '{}', -- Age, income, lifestyle factors
  foreclosure_filters JSONB NOT NULL DEFAULT '{}', -- Foreclosure timing and stages
  predictive_filters JSONB NOT NULL DEFAULT '{}', -- Mail responsiveness, move probability
  options_filters JSONB NOT NULL DEFAULT '{}', -- Output format, additional data fields
  
  -- Count and cost tracking
  estimated_count INTEGER,
  estimated_cost DECIMAL(10,2),
  last_count_check TIMESTAMP,
  count_check_frequency INTERVAL DEFAULT '1 hour', -- Prevent excessive API calls
  
  -- Usage and sharing
  usage_count INTEGER DEFAULT 0, -- How many times used for purchases
  is_favorite BOOLEAN DEFAULT FALSE,
  shared_with_users UUID[] DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track actual list purchases and their lifecycle
CREATE TABLE melissa_list_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_criteria_id UUID NOT NULL REFERENCES melissa_search_criteria(id) ON DELETE RESTRICT,
  mailing_list_id UUID REFERENCES mailing_lists(id) ON DELETE SET NULL, -- Created after processing
  
  -- Purchase details
  purchase_price DECIMAL(10,2) NOT NULL,
  record_count INTEGER NOT NULL,
  melissa_transaction_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Processing status and file management
  download_status VARCHAR(50) DEFAULT 'pending', -- pending, downloading, processing, completed, failed
  file_location TEXT, -- S3 location of downloaded data
  processed_file_location TEXT, -- S3 location after internal processing
  processing_errors JSONB, -- Detailed error information for debugging
  
  -- Melissa API response data
  melissa_response JSONB, -- Complete API response for debugging
  download_url TEXT, -- Temporary download URL from Melissa
  download_expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  download_started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- AccuZIP integration for data processing and validation
CREATE TABLE accuzip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,
  accuzip_guid VARCHAR(255) UNIQUE NOT NULL,
  
  -- Job configuration and status
  job_status VARCHAR(50) DEFAULT 'uploading', -- uploading, uploaded, processing, completed, failed
  services_requested TEXT[] NOT NULL, -- ['cass', 'ncoa', 'dups', 'presort']
  total_records INTEGER,
  processed_records INTEGER,
  
  -- API interaction tracking
  callback_url TEXT NOT NULL,
  upload_response JSONB, -- Response from initial file upload
  quote_response JSONB, -- Pricing quote from AccuZIP
  
  -- Processing step results
  cass_response JSONB, -- Address standardization results
  ncoa_response JSONB, -- National Change of Address results
  dups_response JSONB, -- Duplicate removal results
  presort_response JSONB, -- Postal presorting results
  
  -- File management
  original_file_url TEXT, -- Uploaded file location
  final_file_url TEXT, -- Processed file download URL
  local_processed_file TEXT, -- Our S3 storage of final results
  
  -- Cost tracking
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  invoice_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- AccuZIP webhook logging for debugging and audit
CREATE TABLE accuzip_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accuzip_guid VARCHAR(255) NOT NULL,
  webhook_type VARCHAR(100) NOT NULL, -- upload_complete, quote_ready, cass_complete, etc.
  webhook_payload JSONB NOT NULL,
  
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processing_result JSONB,
  processing_error TEXT,
  
  -- Security verification
  signature_provided VARCHAR(500),
  signature_valid BOOLEAN,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Redstone print fulfillment integration
CREATE TABLE redstone_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  redstone_job_id VARCHAR(255) UNIQUE, -- Assigned by Redstone after submission
  
  -- Job status and workflow
  job_status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, proof_ready, approved, printing, shipping, delivered, failed
  submission_payload JSONB NOT NULL, -- Complete job configuration sent to Redstone
  redstone_response JSONB, -- Response from Redstone API
  
  -- Proof and approval workflow
  proof_urls TEXT[], -- Array of proof image URLs
  proof_version INTEGER DEFAULT 1,
  proof_approved_by UUID REFERENCES auth.users(id),
  proof_approved_at TIMESTAMP,
  revision_requests JSONB DEFAULT '[]', -- History of revision requests
  
  -- Production and fulfillment tracking
  production_started_at TIMESTAMP,
  estimated_ship_date DATE,
  actual_ship_date DATE,
  tracking_info JSONB, -- Shipping tracking details
  delivery_confirmation JSONB, -- Delivery receipt information
  
  -- Quality and customer satisfaction
  quality_check_results JSONB,
  customer_feedback JSONB,
  issue_reports JSONB DEFAULT '[]',
  
  -- Financial tracking
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  invoice_data JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Redstone webhook processing for real-time status updates
CREATE TABLE redstone_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redstone_job_id VARCHAR(255) NOT NULL,
  webhook_type VARCHAR(100) NOT NULL, -- proof_ready, production_started, shipped, delivered, etc.
  webhook_payload JSONB NOT NULL,
  
  -- Processing tracking
  processed BOOLEAN DEFAULT FALSE,
  processing_result JSONB,
  processing_error TEXT,
  
  -- Security and validation
  signature_provided VARCHAR(500),
  signature_valid BOOLEAN,
  ip_address INET,
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

### **4.3 Analytics and Audit Schema**

The analytics and audit schema supports comprehensive business intelligence while maintaining compliance with data protection regulations. This schema enables both real-time dashboards and historical trend analysis across all platform operations.

```sql
-- Comprehensive audit logging for all platform operations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- NULL for system actions
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', 'purchase', etc.
  resource_type VARCHAR(100) NOT NULL, -- 'order', 'mailing_list', 'template', 'user', etc.
  resource_id UUID, -- ID of the affected resource
  
  -- Change tracking
  old_values JSONB, -- Previous state for updates
  new_values JSONB, -- New state for creates/updates
  changes_summary TEXT, -- Human-readable summary of changes
  
  -- Context and metadata
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  request_id VARCHAR(255), -- For tracing across microservices
  
  -- Additional context
  metadata JSONB DEFAULT '{}', -- Flexible additional data
  severity VARCHAR(20) DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- User activity tracking for analytics and engagement metrics
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session information
  session_id VARCHAR(255) NOT NULL,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  session_duration INTEGER, -- Calculated duration in seconds
  
  -- Page views and navigation
  page_views INTEGER DEFAULT 0,
  pages_visited TEXT[] DEFAULT '{}',
  feature_usage JSONB DEFAULT '{}', -- Track which features are used
  
  -- Engagement metrics
  actions_taken INTEGER DEFAULT 0,
  orders_created INTEGER DEFAULT 0,
  templates_created INTEGER DEFAULT 0,
  lists_created INTEGER DEFAULT 0,
  
  -- Technical metadata
  browser VARCHAR(100),
  operating_system VARCHAR(100),
  device_type VARCHAR(50), -- 'desktop', 'tablet', 'mobile'
  referrer TEXT,
  utm_data JSONB, -- Marketing campaign attribution
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign performance tracking for business intelligence
CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Campaign basic metrics
  pieces_sent INTEGER,
  delivery_rate DECIMAL(5,2), -- Percentage successfully delivered
  cost_per_piece DECIMAL(10,4),
  total_campaign_cost DECIMAL(10,2),
  
  -- Response tracking
  tracking_enabled BOOLEAN DEFAULT FALSE,
  unique_urls_generated INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  conversion_events INTEGER DEFAULT 0,
  
  -- Geographic distribution
  delivery_by_state JSONB DEFAULT '{}',
  response_by_state JSONB DEFAULT '{}',
  
  -- Temporal analysis
  delivery_timeline JSONB DEFAULT '{}', -- Daily delivery counts
  response_timeline JSONB DEFAULT '{}', -- Daily response counts
  peak_response_day DATE,
  
  -- ROI and effectiveness
  estimated_roi DECIMAL(10,2),
  cost_per_response DECIMAL(10,2),
  response_rate DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- External API performance monitoring
CREATE TABLE external_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL, -- 'melissa', 'accuzip', 'redstone'
  endpoint VARCHAR(255) NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  
  -- Request details (with PII redaction)
  request_headers JSONB, -- Excluding authorization headers
  request_body JSONB, -- With PII fields redacted
  request_size INTEGER, -- In bytes
  
  -- Response details
  response_status INTEGER,
  response_headers JSONB,
  response_body JSONB, -- With PII fields redacted
  response_size INTEGER,
  response_time_ms INTEGER,
  
  -- Context and tracking
  user_id UUID REFERENCES auth.users(id),
  correlation_id VARCHAR(255), -- For tracing related requests
  retry_attempt INTEGER DEFAULT 1,
  
  -- Error details
  error_message TEXT,
  error_type VARCHAR(100), -- 'timeout', 'rate_limit', 'authentication', etc.
  error_code VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service health monitoring and alerting
CREATE TABLE external_service_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  
  -- Health metrics
  status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  error_rate DECIMAL(5,2), -- Percentage of failed requests
  requests_per_minute INTEGER,
  
  -- Historical tracking
  last_successful_request TIMESTAMP,
  last_failed_request TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2), -- Over last 24 hours
  
  -- Alerting
  alert_threshold_exceeded BOOLEAN DEFAULT FALSE,
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP,
  
  -- Additional context
  notes TEXT,
  monitoring_data JSONB, -- Additional metrics and context
  
  checked_at TIMESTAMP DEFAULT NOW()
);

-- User feedback and satisfaction tracking
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feedback context
  feedback_type VARCHAR(50) NOT NULL, -- 'nps', 'feature_request', 'bug_report', 'general'
  page_context VARCHAR(255), -- Where feedback was submitted
  order_id UUID REFERENCES orders(id), -- Related order if applicable
  
  -- Feedback content
  rating INTEGER, -- 1-10 for NPS, 1-5 for other ratings
  title VARCHAR(255),
  description TEXT,
  suggestions TEXT,
  
  -- Classification and routing
  category VARCHAR(100), -- 'usability', 'performance', 'feature', 'pricing', etc.
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  
  -- Staff response
  assigned_to UUID REFERENCES auth.users(id),
  internal_notes TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  
  -- Metadata
  browser_info JSONB,
  submitted_via VARCHAR(50), -- 'web', 'email', 'phone', 'chat'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **4.4 Performance Optimization and Indexing Strategy**

The database performance strategy employs strategic indexing, query optimization, and data archival policies to maintain responsive performance as the platform scales. This approach balances query performance with storage efficiency and maintenance overhead.

```sql
-- Strategic indexing for optimal query performance
-- User and authentication indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_name);
CREATE INDEX idx_user_roles_user_active ON user_roles(user_id, active) WHERE active = TRUE;

-- Mailing list performance indexes
CREATE INDEX idx_mailing_lists_user_status ON mailing_lists(user_id, status);
CREATE INDEX idx_mailing_lists_created ON mailing_lists(created_at DESC);
CREATE INDEX idx_mailing_lists_tags ON mailing_lists USING GIN(tags);
CREATE INDEX idx_mailing_lists_search ON mailing_lists USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Mailing list records indexes for efficient querying and deduplication
CREATE INDEX idx_mailing_list_records_list ON mailing_list_records(mailing_list_id);
CREATE INDEX idx_mailing_list_records_name_addr ON mailing_list_records(mailing_list_id, first_name, last_name, address_line_1);
CREATE INDEX idx_mailing_list_records_zip ON mailing_list_records(zip_code);
CREATE INDEX idx_mailing_list_records_email ON mailing_list_records(email) WHERE email IS NOT NULL;

-- Order management indexes for dashboard and reporting
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_status_updated ON orders(status, status_updated_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status) WHERE payment_status != 'paid';
CREATE INDEX idx_orders_total_amount ON orders(total_amount DESC) WHERE total_amount > 0;

-- Design template indexes for search and categorization
CREATE INDEX idx_design_templates_user_type ON design_templates(user_id, template_type);
CREATE INDEX idx_design_templates_public ON design_templates(is_public, template_type) WHERE is_public = TRUE;
CREATE INDEX idx_design_templates_tags ON design_templates USING GIN(tags);
CREATE INDEX idx_design_templates_search ON design_templates USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- External API integration indexes for monitoring and debugging
CREATE INDEX idx_melissa_criteria_user_updated ON melissa_search_criteria(user_id, updated_at DESC);
CREATE INDEX idx_melissa_purchases_user_status ON melissa_list_purchases(user_id, download_status);
CREATE INDEX idx_accuzip_jobs_list_status ON accuzip_jobs(mailing_list_id, job_status);
CREATE INDEX idx_accuzip_jobs_guid ON accuzip_jobs(accuzip_guid);
CREATE INDEX idx_redstone_orders_order_status ON redstone_orders(order_id, job_status);

-- Analytics and audit indexes for reporting performance
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource_action ON audit_logs(resource_type, action, created_at DESC);
CREATE INDEX idx_audit_logs_created_severity ON audit_logs(created_at DESC, severity);
CREATE INDEX idx_user_analytics_user_session ON user_analytics(user_id, session_start DESC);
CREATE INDEX idx_campaign_analytics_user_created ON campaign_analytics(user_id, created_at DESC);

-- External API performance indexes
CREATE INDEX idx_external_api_logs_service_created ON external_api_logs(service_name, created_at DESC);
CREATE INDEX idx_external_api_logs_user_service ON external_api_logs(user_id, service_name, created_at DESC);
CREATE INDEX idx_external_api_logs_status_created ON external_api_logs(response_status, created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_orders_user_status_created ON orders(user_id, status, created_at DESC);
CREATE INDEX idx_mailing_lists_user_source_status ON mailing_lists(user_id, source, status);
CREATE INDEX idx_external_api_logs_service_status_created ON external_api_logs(service_name, response_status, created_at DESC);

-- Partial indexes for efficiency on commonly filtered data
CREATE INDEX idx_orders_active_only ON orders(user_id, created_at DESC) 
  WHERE status NOT IN ('cancelled', 'delivered', 'failed');
CREATE INDEX idx_mailing_lists_active_only ON mailing_lists(user_id, updated_at DESC) 
  WHERE status IN ('active', 'processing');
CREATE INDEX idx_design_templates_user_active ON design_templates(user_id, updated_at DESC) 
  WHERE template_type IS NOT NULL;

-- Database maintenance and optimization functions
-- Automated data archival for compliance and performance
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $
DECLARE
  archived_count INTEGER;
  archive_cutoff DATE;
BEGIN
  -- Archive audit logs older than 2 years to separate archive table
  archive_cutoff := CURRENT_DATE - INTERVAL '2 years';
  
  WITH archived_logs AS (
    DELETE FROM audit_logs 
    WHERE created_at < archive_cutoff
    AND severity IN ('debug', 'info')
    RETURNING *
  )
  INSERT INTO audit_logs_archive 
  SELECT * FROM archived_logs;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- Automated cleanup of temporary external API data
CREATE OR REPLACE FUNCTION cleanup_external_api_data()
RETURNS INTEGER AS $
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Remove detailed API logs older than 90 days, keeping summary data
  WITH cleaned_logs AS (
    DELETE FROM external_api_logs
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
    AND response_status BETWEEN 200 AND 299 -- Keep error logs longer
    RETURNING service_name, DATE(created_at) as log_date
  )
  INSERT INTO external_api_summary (service_name, log_date, request_count)
  SELECT service_name, log_date, COUNT(*)
  FROM cleaned_logs
  GROUP BY service_name, log_date
  ON CONFLICT (service_name, log_date) 
  DO UPDATE SET request_count = external_api_summary.request_count + EXCLUDED.request_count;
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$ LANGUAGE plpgsql;

-- Schedule automated maintenance tasks
-- These would typically be set up as cron jobs or scheduled tasks
-- SELECT cron.schedule('archive-audit-logs', '0 2 * * 0', 'SELECT archive_old_audit_logs();');
-- SELECT cron.schedule('cleanup-api-data', '0 3 * * 0', 'SELECT cleanup_external_api_data();');
```

## **5. Security Implementation**

### **5.1 Multi-Layer Security Architecture**

The security implementation employs defense-in-depth principles with multiple independent security layers that protect against various threat vectors while maintaining usability and performance. Each layer serves specific security functions while working together to create a comprehensive security posture.

**Authentication Layer Security:**

The authentication layer leverages Supabase's security infrastructure while adding platform-specific security controls. JWT tokens include custom claims that support role-based access control and session management, while token refresh policies balance security with user experience.

Multi-factor authentication integration provides additional protection for sensitive operations like large order submissions or account settings changes. The system supports both SMS and TOTP-based authentication with secure backup codes for account recovery scenarios.

```javascript
// Enhanced authentication security with MFA and session management
// Location: /lib/auth/enhanced-security.js
export class EnhancedAuthSecurity {
  constructor() {
    this.sessionTimeouts = {
      'low_risk': 24 * 60 * 60 * 1000, // 24 hours for normal operations
      'medium_risk': 8 * 60 * 60 * 1000, // 8 hours for order creation
      'high_risk': 2 * 60 * 60 * 1000 // 2 hours for billing/account changes
    }
    
    this.mfaRequiredOperations = [
      'large_order_submission', // Orders over threshold amount
      'account_settings_change',
      'payment_method_change',
      'team_member_invitation',
      'data_export_request'
    ]
  }

  async validateSecureOperation(userId, operation, context = {}) {
    try {
      // Determine risk level based on operation and context
      const riskLevel = this.assessOperationRisk(operation, context)
      
      // Check if current session meets security requirements
      const sessionValidation = await this.validateSessionSecurity(userId, riskLevel)
      if (!sessionValidation.valid) {
        return {
          authorized: false,
          reason: sessionValidation.reason,
          requiredAction: sessionValidation.requiredAction
        }
      }

      // Check if MFA is required and completed
      if (this.mfaRequiredOperations.includes(operation)) {
        const mfaValidation = await this.validateMFAForOperation(userId, operation)
        if (!mfaValidation.valid) {
          return {
            authorized: false,
            reason: 'MFA required for this operation',
            requiredAction: 'complete_mfa',
            mfaChallenge: mfaValidation.challenge
          }
        }
      }

      // Additional context-based security checks
      const contextValidation = await this.validateOperationContext(userId, operation, context)
      if (!contextValidation.valid) {
        return {
          authorized: false,
          reason: contextValidation.reason,
          requiredAction: contextValidation.requiredAction
        }
      }

      return { authorized: true, riskLevel: riskLevel }

    } catch (error) {
      console.error('Security validation error:', error)
      return {
        authorized: false,
        reason: 'Security validation failed',
        requiredAction: 'retry_or_contact_support'
      }
    }
  }

  assessOperationRisk(operation, context) {
    // Dynamic risk assessment based on operation type and context
    let riskScore = 0
    
    // Base risk by operation type
    const operationRisks = {
      'order_creation': 2,
      'large_order_submission': 4,
      'payment_method_change': 5,
      'account_settings_change': 4,
      'data_export': 3,
      'team_management': 4,
      'template_sharing': 1
    }
    
    riskScore += operationRisks[operation] || 1
    
    // Context-based risk factors
    if (context.orderValue > 5000) riskScore += 2
    if (context.newDevice) riskScore += 1
    if (context.unusualLocation) riskScore += 2
    if (context.rapidSuccession) riskScore += 1
    if (context.offHours) riskScore += 1
    
    // Map score to risk level
    if (riskScore <= 2) return 'low_risk'
    if (riskScore <= 4) return 'medium_risk'
    return 'high_risk'
  }

  async validateSessionSecurity(userId, riskLevel) {
  async validateSessionSecurity(userId, riskLevel) {
    // Check session age and validity for risk level
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        valid: false,
        reason: 'No active session',
        requiredAction: 'login_required'
      }
    }

    const sessionAge = Date.now() - new Date(session.created_at).getTime()
    const maxAge = this.sessionTimeouts[riskLevel]
    
    if (sessionAge > maxAge) {
      return {
        valid: false,
        reason: `Session expired for ${riskLevel} operation`,
        requiredAction: 'reauthentication_required'
      }
    }

    // Check for suspicious session characteristics
    const suspiciousActivity = await this.detectSuspiciousActivity(userId, session)
    if (suspiciousActivity.detected) {
      return {
        valid: false,
        reason: 'Suspicious activity detected',
        requiredAction: 'security_verification_required',
        details: suspiciousActivity.details
      }
    }

    return { valid: true }
  }
  async detectSuspiciousActivity(userId, session) {
    // Analyze recent user activity for suspicious patterns
    const recentActivity = await this.getUserRecentActivity(userId, '1 hour')
    
    const suspiciousIndicators = []
    
    // Check for rapid-fire operations
    if (recentActivity.operationCount > 50) {
      suspiciousIndicators.push('High operation frequency')
    }
    
    // Check for geographic inconsistencies
    if (recentActivity.distinctLocations > 3) {
      suspiciousIndicators.push('Multiple geographic locations')
    }
    
    // Check for unusual access patterns
    if (recentActivity.unusualHours > 5) {
      suspiciousIndicators.push('Unusual access hours')
    }
    
    return {
      detected: suspiciousIndicators.length > 0,
      details: suspiciousIndicators
    }
  }
}
```

**Data Protection and Encryption:**

The platform implements comprehensive data protection covering data at rest, in transit, and in use. Encryption strategies vary based on data sensitivity while maintaining query performance for operational data.

```javascript
// Comprehensive data protection and encryption system
// Location: /lib/security/data-protection.js
export class DataProtectionManager {
  constructor() {
    this.encryptionKeys = {
      pii: process.env.PII_ENCRYPTION_KEY,
      financial: process.env.FINANCIAL_ENCRYPTION_KEY,
      general: process.env.GENERAL_ENCRYPTION_KEY
    }
    
    this.dataClassification = {
      'highly_sensitive': ['ssn', 'credit_card', 'bank_account'],
      'sensitive': ['email', 'phone', 'address', 'name'],
      'internal': ['user_preferences', 'settings', 'metadata'],
      'public': ['template_names', 'public_templates']
    }
  }

  async encryptSensitiveData(data, dataType) {
    // Apply appropriate encryption based on data sensitivity
    const classification = this.classifyData(dataType)
    
  async encryptSensitiveData(data, dataType) {
    // Apply appropriate encryption based on data sensitivity
    const classification = this.classifyData(dataType)
    
    switch (classification) {
      case 'highly_sensitive':
        return await this.encryptWithAdvancedSecurity(data, this.encryptionKeys.financial)
      case 'sensitive':
        return await this.encryptWithStandardSecurity(data, this.encryptionKeys.pii)
      // ...
      default:
        throw new Error(`Unknown data classification: ${classification}`)
    }

    // Update order status with comprehensive tracking
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update order status' })
    }

    // Create status change audit record
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        previous_status: currentOrder.status,
        new_status: newStatus,
        changed_by: systemUpdate ? 'system' : userId,
        change_reason: notes,
        changed_at: new Date()
      })

    // Update workflow progress if applicable
    await updateWorkflowProgress(orderId, newStatus)

    // Trigger status-specific business logic
    await processStatusChangeActions(orderId, newStatus, currentOrder.status)

    // Send user notifications for significant status changes
    if (shouldNotifyUser(currentOrder.status, newStatus)) {
      await sendOrderStatusNotification(userId, orderId, newStatus, updatedOrder)
    }

    res.json({
      success: true,
      order: updatedOrder,
      statusChanged: true,
      previousStatus: currentOrder.status,
      newStatus: newStatus
    })

  } catch (error) {
    console.error('Order status update error:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
}

async function processStatusChangeActions(orderId, newStatus, previousStatus) {
  // Execute business logic based on status transitions
  switch (newStatus) {
    case 'payment_confirmed':
      // Start production process with external service
      await initiateProductionWorkflow(orderId)
      break
      
    case 'proof_ready':
      // Notify customer that proof is available for review
      await generateProofNotification(orderId)
      break
      
    case 'in_production':
      // Submit to Redstone for printing
      await submitToRedstoneForPrinting(orderId)
      break
      
    case 'shipped':
      // Generate tracking information and notify customer
      await processShippingNotification(orderId)
      break
      
    case 'delivered':
      // Mark campaign as complete and trigger follow-up
      await processDeliveryCompletion(orderId)
      break
      
    case 'cancelled':
      // Process cancellation and potential refunds
      await processCancellation(orderId, previousStatus)
      break
  }
}

async function validateStatusTransition(currentStatus, newStatus, fulfillmentType) {
  // Define valid status transitions based on fulfillment type and current state
  const statusTransitions = {
    'print_only': {
      'draft': ['payment_pending', 'cancelled'],
      'payment_pending': ['payment_confirmed', 'payment_failed', 'cancelled'],
      'payment_confirmed': ['design_preparation', 'cancelled'],
      'design_preparation': ['proof_ready', 'design_failed'],
      'proof_ready': ['proof_approved', 'proof_revision_requested'],
      'proof_revision_requested': ['proof_ready', 'cancelled'],
      'proof_approved': ['in_production'],
      'in_production': ['quality_check', 'production_failed'],
      'quality_check': ['packaging', 'quality_failed'],
      'packaging': ['shipped'],
      'shipped': ['delivered', 'delivery_failed'],
      'delivered': [], // Terminal status
      'cancelled': [], // Terminal status
      'payment_failed': ['payment_pending', 'cancelled'],
      'design_failed': ['design_preparation', 'cancelled'],
      'production_failed': ['in_production', 'cancelled'],
      'quality_failed': ['in_production', 'cancelled'],
      'delivery_failed': ['shipped', 'cancelled']
    },
    'print_and_mail': {
      'draft': ['payment_pending', 'cancelled'],
      'payment_pending': ['payment_confirmed', 'payment_failed', 'cancelled'],
      'payment_confirmed': ['design_preparation', 'cancelled'],
      'design_preparation': ['proof_ready', 'design_failed'],
      'proof_ready': ['proof_approved', 'proof_revision_requested'],
      'proof_revision_requested': ['proof_ready', 'cancelled'],
      'proof_approved': ['in_production'],
      'in_production': ['mailing_preparation', 'production_failed'],
      'mailing_preparation': ['in_transit', 'mailing_failed'],
      'in_transit': ['delivered', 'delivery_issues'],
      'delivered': [], // Terminal status
      'cancelled': [], // Terminal status
      'payment_failed': ['payment_pending', 'cancelled'],
      'design_failed': ['design_preparation', 'cancelled'],
      'production_failed': ['in_production', 'cancelled'],
      'mailing_failed': ['mailing_preparation', 'cancelled'],
      'delivery_issues': ['in_transit', 'cancelled']
    }
  }

  const allowedTransitions = statusTransitions[fulfillmentType]?.[currentStatus] || []
  
  return {
    isValid: allowedTransitions.includes(newStatus),
    allowedTransitions: allowedTransitions,
    reason: allowedTransitions.includes(newStatus) 
      ? 'Valid transition' 
      : `Cannot transition from ${currentStatus} to ${newStatus}`
  }
}
```

### **3.4 Design Template and Asset Management APIs**

The design template system enables users to create, customize, and reuse design assets across multiple campaigns. This system balances creative flexibility with production requirements, ensuring that all designs meet print specifications while providing an intuitive creation experience.

```javascript
// Design template management with asset handling
// Location: /pages/api/design-templates/index.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  switch (req.method) {
    case 'GET':
      return await getUserDesignTemplates(req, res, session.user.id)
    case 'POST':
      return await createDesignTemplate(req, res, session.user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function createDesignTemplate(req, res, userId) {
  try {
    const { 
      name, 
      description, 
      templateType, 
      designData, 
      isPublic,
      tags 
    } = req.body

    // Validate design template creation
    const validation = validateDesignTemplate({
      name,
      templateType,
      designData
    })

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid design template',
        details: validation.errors
      })
    }

    // Process and validate design assets
    const assetProcessing = await processDesignAssets(designData.assets, userId)
    if (!assetProcessing.success) {
      return res.status(400).json({
        error: 'Asset processing failed',
        details: assetProcessing.errors
      })
    }

    // Create the design template record
    const { data: template, error: templateError } = await supabase
      .from('design_templates')
      .insert({
        user_id: userId,
        name: name,
        description: description,
        template_type: templateType,
        design_data: {
          ...designData,
          assets: assetProcessing.processedAssets
        },
        is_public: isPublic || false,
        tags: tags || [],
        created_at: new Date()
      })
      .select()
      .single()

    if (templateError) {
      return res.status(500).json({ error: 'Failed to create design template' })
    }

    // Generate template preview images
    const previewGeneration = await generateTemplatePreview(template.id, designData)
    
    if (previewGeneration.success) {
      await supabase
        .from('design_templates')
        .update({ 
          preview_url: previewGeneration.previewUrl,
          thumbnail_url: previewGeneration.thumbnailUrl
        })
        .eq('id', template.id)
    }

    // Log template creation
    await logUserEvent('design_template_created', userId, {
      templateId: template.id,
      templateType: templateType,
      isPublic: isPublic
    })

    res.status(201).json({
      success: true,
      template: {
        ...template,
        previewUrl: previewGeneration.previewUrl,
        thumbnailUrl: previewGeneration.thumbnailUrl
      },
      assetProcessing: assetProcessing
    })

  } catch (error) {
    console.error('Design template creation error:', error)
    res.status(500).json({ error: 'Failed to create design template' })
  }
}

async function processDesignAssets(assets, userId) {
  // Process uploaded design assets with validation and optimization
  try {
    const processedAssets = []
    const processingErrors = []

    for (const asset of assets) {
      try {
        // Validate asset format and specifications
        const assetValidation = validateDesignAsset(asset)
        if (!assetValidation.isValid) {
          processingErrors.push({
            assetId: asset.id,
            errors: assetValidation.errors
          })
          continue
        }

        // Upload asset to secure storage
        const uploadResult = await uploadDesignAsset(asset, userId)
        
        // Optimize asset for different use cases (web preview, print production)
        const optimizationResult = await optimizeDesignAsset(uploadResult.fileUrl, asset.type)

        processedAssets.push({
          id: asset.id,
          originalUrl: uploadResult.fileUrl,
          webPreviewUrl: optimizationResult.webPreviewUrl,
          printReadyUrl: optimizationResult.printReadyUrl,
          metadata: {
            originalFilename: asset.filename,
            fileSize: uploadResult.fileSize,
            dimensions: optimizationResult.dimensions,
            colorProfile: optimizationResult.colorProfile
          }
        })

      } catch (assetError) {
        processingErrors.push({
          assetId: asset.id,
          errors: [assetError.message]
        })
      }
    }

    return {
      success: processingErrors.length === 0,
      processedAssets: processedAssets,
      errors: processingErrors
    }

  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    }
  }
}

function validateDesignAsset(asset) {
  // Comprehensive asset validation for print production requirements
  const errors = []
  
  // Check file format
  const allowedFormats = ['jpg', 'jpeg', 'png', 'pdf', 'ai', 'eps']
  const fileExtension = asset.filename.split('.').pop().toLowerCase()
  if (!allowedFormats.includes(fileExtension)) {
    errors.push(`Unsupported file format: ${fileExtension}. Allowed formats: ${allowedFormats.join(', ')}`)
  }

  // Check file size limits
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  if (asset.fileSize > maxFileSize) {
    errors.push(`File size too large: ${(asset.fileSize / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 50MB`)
  }

  // Check dimensions for specific asset types
  if (asset.type === 'background_image') {
    if (asset.dimensions.width < 1800 || asset.dimensions.height < 2400) {
      errors.push('Background images must be at least 1800x2400 pixels for print quality')
    }
  }

  // Check color profile for print assets
  if (asset.colorProfile && !['CMYK', 'RGB'].includes(asset.colorProfile)) {
    errors.push(`Invalid color profile: ${asset.colorProfile}. Use CMYK for print or RGB for digital`)
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  }
}
```

### **3.5 Analytics and Reporting APIs**

The analytics system provides comprehensive insights into campaign performance, user behavior, and platform usage. These APIs support both real-time dashboard displays and scheduled report generation while maintaining data privacy and access controls.

```javascript
// Analytics and reporting system with dashboard support
// Location: /pages/api/analytics/dashboard.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { timeframe, includeComparisons } = req.query
    
    // Generate comprehensive dashboard data
    const dashboardData = await generateUserDashboard(session.user.id, {
      timeframe: timeframe || '30d',
      includeComparisons: includeComparisons === 'true'
    })

    res.json({
      success: true,
      data: dashboardData,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Dashboard generation error:', error)
    res.status(500).json({ error: 'Failed to generate dashboard data' })
  }
}

async function generateUserDashboard(userId, options) {
  const { timeframe, includeComparisons } = options
  const timeframeDays = parseTimeframe(timeframe)
  const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)
  
  // Parallel data collection for performance
  const [
    orderMetrics,
    campaignMetrics,
    financialMetrics,
    engagementMetrics,
    performanceMetrics
  ] = await Promise.all([
    getOrderMetrics(userId, startDate),
    getCampaignMetrics(userId, startDate),
    getFinancialMetrics(userId, startDate),
    getEngagementMetrics(userId, startDate),
    getPerformanceMetrics(userId, startDate)
  ])

  let comparisonData = null
  if (includeComparisons) {
    const previousPeriodStart = new Date(startDate.getTime() - timeframeDays * 24 * 60 * 60 * 1000)
    comparisonData = await generateComparisonData(userId, previousPeriodStart, startDate)
  }

  return {
    timeframe: {
      startDate: startDate,
      endDate: new Date(),
      days: timeframeDays
    },
    metrics: {
      orders: orderMetrics,
      campaigns: campaignMetrics,
      financial: financialMetrics,
      engagement: engagementMetrics,
      performance: performanceMetrics
    },
    comparisons: comparisonData,
    insights: generateDataInsights(orderMetrics, campaignMetrics, financialMetrics)
  }
}

async function getOrderMetrics(userId, startDate) {
  // Comprehensive order analytics with status breakdown
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, created_at, total_amount, fulfillment_type')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  const metrics = {
    totalOrders: orders?.length || 0,
    totalValue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    fulfillmentTypeBreakdown: {},
    dailyTrends: generateDailyTrends(orders, startDate)
  }

  if (metrics.totalOrders > 0) {
    metrics.averageOrderValue = metrics.totalValue / metrics.totalOrders
    
    // Calculate status distribution
    orders.forEach(order => {
      metrics.statusBreakdown[order.status] = (metrics.statusBreakdown[order.status] || 0) + 1
      metrics.fulfillmentTypeBreakdown[order.fulfillment_type] = 
        (metrics.fulfillmentTypeBreakdown[order.fulfillment_type] || 0) + 1
    })
  }

  return metrics
}

async function getCampaignMetrics(userId, startDate) {
  // Campaign performance and effectiveness metrics
  const { data: campaigns } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      mailing_lists(record_count),
      order_items(quantity),
      engagement_tracking(
        emails_sent,
        emails_delivered,
        emails_opened,
        links_clicked,
        responses_received
      )
    `)
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .not('mailing_lists', 'is', null)

  const metrics = {
    totalCampaigns: campaigns?.length || 0,
    totalRecipients: 0,
    totalPiecesSent: 0,
    engagementRates: {
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      responseRate: 0
    }
  }

  if (campaigns && campaigns.length > 0) {
    let totalEmailsSent = 0
    let totalEmailsDelivered = 0
    let totalEmailsOpened = 0
    let totalLinksClicked = 0
    let totalResponses = 0

    campaigns.forEach(campaign => {
      metrics.totalRecipients += campaign.mailing_lists?.record_count || 0
      metrics.totalPiecesSent += campaign.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      
      if (campaign.engagement_tracking) {
        totalEmailsSent += campaign.engagement_tracking.emails_sent || 0
        totalEmailsDelivered += campaign.engagement_tracking.emails_delivered || 0
        totalEmailsOpened += campaign.engagement_tracking.emails_opened || 0
        totalLinksClicked += campaign.engagement_tracking.links_clicked || 0
        totalResponses += campaign.engagement_tracking.responses_received || 0
      }
    })

    // Calculate engagement rates
    if (totalEmailsSent > 0) {
      metrics.engagementRates.deliveryRate = (totalEmailsDelivered / totalEmailsSent) * 100
      metrics.engagementRates.openRate = (totalEmailsOpened / totalEmailsDelivered) * 100
      metrics.engagementRates.clickRate = (totalLinksClicked / totalEmailsDelivered) * 100
      metrics.engagementRates.responseRate = (totalResponses / totalEmailsDelivered) * 100
    }
  }

  return metrics
}

async function getFinancialMetrics(userId, startDate) {
  // Financial performance and cost analysis
  const { data: financialData } = await supabase
    .from('orders')
    .select(`
      total_amount,
      created_at,
      order_items(
        quantity,
        unit_price,
        total_price,
        product_type
      )
    `)
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')

  const metrics = {
    totalRevenue: 0,
    totalOrders: financialData?.length || 0,
    revenueByProduct: {},
    costPerPiece: 0,
    monthlyRecurring: 0,
    revenueGrowth: 0
  }

  if (financialData && financialData.length > 0) {
    metrics.totalRevenue = financialData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    
    let totalPieces = 0
    financialData.forEach(order => {
      order.order_items?.forEach(item => {
        const productType = item.product_type
        metrics.revenueByProduct[productType] = 
          (metrics.revenueByProduct[productType] || 0) + (item.total_price || 0)
        totalPieces += item.quantity || 0
      })
    })

    if (totalPieces > 0) {
      metrics.costPerPiece = metrics.totalRevenue / totalPieces
    }
  }

  return metrics
}

function generateDataInsights(orderMetrics, campaignMetrics, financialMetrics) {
  // AI-powered insights and recommendations
  const insights = []

  // Order volume insights
  if (orderMetrics.totalOrders > 0) {
    if (orderMetrics.averageOrderValue > 500) {
      insights.push({
        type: 'positive',
        category: 'revenue',
        title: 'Above Average Order Value',
        description: `Your average order value of ${orderMetrics.averageOrderValue.toFixed(2)} is above the platform average`,
        recommendation: 'Consider upselling additional services to maintain this performance'
      })
    }
  }

  // Campaign effectiveness insights
  if (campaignMetrics.engagementRates.responseRate > 2) {
    insights.push({
      type: 'positive',
      category: 'engagement',
      title: 'High Response Rate',
      description: `Your ${campaignMetrics.engagementRates.responseRate.toFixed(1)}% response rate exceeds industry benchmarks`,
      recommendation: 'Document your successful campaign elements for future use'
    })
  }

  // Cost optimization insights
  if (financialMetrics.costPerPiece > 0) {
    if (financialMetrics.costPerPiece < 1.50) {
      insights.push({
        type: 'positive',
        category: 'cost',
        title: 'Efficient Cost Management',
        description: `Your cost per piece of ${financialMetrics.costPerPiece.toFixed(2)} indicates efficient campaign management`,
        recommendation: 'Continue optimizing for volume discounts and efficient targeting'
      })
    }
  }

  return insights
}
```

## **4. Database Architecture**

### **4.1 Core Schema Design and Relationships**

The Yellow Letter Shop database architecture employs a carefully designed schema that balances normalization with query performance while supporting the complex relationships inherent in direct mail campaign management. The schema design anticipates future feature expansion while maintaining data integrity and supporting efficient queries across all platform operations.

**Entity Relationship Design Philosophy:**

The database schema reflects the real-world business processes of direct mail campaigns, where users create mailing lists, design templates, and orders that combine these elements into campaigns. The schema supports both simple individual user workflows and complex enterprise scenarios involving team collaboration and shared resources.

Each major entity maintains its own audit trail and versioning capability, ensuring that historical data remains accessible for analytics and compliance purposes. Foreign key relationships enforce data integrity while CASCADE and RESTRICT options are carefully chosen based on business rules about data retention and deletion policies.

```sql
-- Core user and authentication schema
-- Supports both individual and team-based account structures
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50), -- 'solo', 'small', 'medium', 'large', 'enterprise'
  phone VARCHAR(20),
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  monthly_volume_estimate INTEGER,
  referral_source VARCHAR(100),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User settings and preferences with JSON flexibility
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  dashboard_layout VARCHAR(50) DEFAULT 'default',
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{}',
  ui_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Flexible role-based access control for future team features
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL, -- 'account_owner', 'admin', 'manager', 'user', 'viewer'
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP, -- For temporary role assignments
  permissions JSONB DEFAULT '[]', -- Additional specific permissions
  UNIQUE(user_id, role_name)
);

-- Mailing lists with comprehensive metadata and processing state
CREATE TABLE mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(50) NOT NULL, -- 'manual', 'csv_upload', 'melissa_purchase', 'api_import'
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'processing', 'active', 'failed', 'archived'
  record_count INTEGER DEFAULT 0,
  original_file_name VARCHAR(255), -- For uploaded files
  original_file_url TEXT, -- S3 location of original upload
  processed_file_url TEXT, -- S3 location of processed/cleaned file
  processing_notes JSONB, -- Details about any processing applied
  tags TEXT[] DEFAULT '{}', -- User-defined tags for organization
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP -- When processing completed
);

-- Individual records within mailing lists with comprehensive contact data
CREATE TABLE mailing_list_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES mailing_lists(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  zip_plus_four VARCHAR(10), -- Enhanced ZIP codes from processing
  email VARCHAR(255),
  phone VARCHAR(20),
  custom_fields JSONB DEFAULT '{}', -- Flexible additional data storage
  data_quality_score DECIMAL(3,2), -- 0.00 to 1.00 based on validation
  processing_flags JSONB DEFAULT '{}', -- CASS, NCOA, validation results
  suppression_flags JSONB DEFAULT '{}', -- DNC, suppression list matches
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Composite index for efficient querying and duplicate detection
  UNIQUE(mailing_list_id, first_name, last_name, address_line_1, zip_code)
);

-- Design templates with version control and asset management
CREATE TABLE design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'letter', 'postcard', 'envelope', 'brochure'
  category VARCHAR(100), -- User-defined categorization
  design_data JSONB NOT NULL, -- Complete design configuration and layout
  preview_url TEXT, -- Generated preview image
  thumbnail_url TEXT, -- Small thumbnail for lists
  is_public BOOLEAN DEFAULT FALSE, -- Available to other users
  is_template BOOLEAN DEFAULT TRUE, -- Template vs specific design instance
  version INTEGER DEFAULT 1,
  parent_template_id UUID REFERENCES design_templates(id), -- For version tracking
  tags TEXT[] DEFAULT '{}',
  print_specifications JSONB, -- Print-specific requirements and settings
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Design assets with metadata and optimization tracking
CREATE TABLE design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES design_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL, -- 'background', 'logo', 'image', 'font'
  original_filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL, -- S3 location
  file_size INTEGER, -- In bytes
  mime_type VARCHAR(100),
  dimensions JSONB, -- Width, height, DPI information
  color_profile VARCHAR(50), -- RGB, CMYK, etc.
  optimization_data JSONB, -- Web/print optimized versions
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders with comprehensive workflow tracking
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mailing_list_id UUID REFERENCES mailing_lists(id) ON DELETE RESTRICT,
  design_template_id UUID REFERENCES design_templates(id) ON DELETE RESTRICT,
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order identifier
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  fulfillment_type VARCHAR(50) NOT NULL, -- 'print_only', 'print_and_mail'
  rush_order BOOLEAN DEFAULT FALSE,
  proof_required BOOLEAN DEFAULT TRUE,
  special_instructions TEXT,
  internal_notes TEXT, -- Staff notes, not visible to customer
  
  -- Pricing breakdown
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Payment and billing
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  invoice_number VARCHAR(50),
  
  -- Timeline tracking
  estimated_completion DATE,
  actual_completion DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status_updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items with detailed product specifications
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_type VARCHAR(100) NOT NULL, -- 'yellow_letter', 'postcard', 'envelope'
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Product specifications stored as flexible JSON
  specifications JSONB NOT NULL DEFAULT '{}', -- Size, paper, colors, etc.
  design      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    // Update user settings if provided
    if (emailNotifications !== undefined || smsNotifications !== undefined || marketingEmails !== undefined) {
      await supabase
        .from('user_settings')
        .update({
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          marketing_emails: marketingEmails,
          timezone: timezone,
          updated_at: new Date()
        })
        .eq('user_id', userId)
    }

    // Log profile update for audit trail
    await logUserEvent('profile_updated', userId, {
      changes: req.body,
      timestamp: new Date()
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

async function calculateUserUsageStats(userId) {
  // Calculate comprehensive usage statistics for dashboard display
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  // Get order statistics
  const { data: orderStats } = await supabase
    .from('orders')
    .select('status, created_at, total_amount')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get mailing list statistics
  const { data: listStats } = await supabase
    .from('mailing_lists')
    .select('record_count, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Calculate aggregated metrics
  return {
    ordersThisMonth: orderStats?.length || 0,
    totalSpentThisMonth: orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
    mailingListsCreated: listStats?.length || 0,
    totalRecordsProcessed: listStats?.reduce((sum, list) => sum + (list.record_count || 0), 0) || 0,
    averageOrderValue: orderStats?.length > 0 
      ? (orderStats.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orderStats.length)
      : 0
  }
}

function determineAccountStatus(profile) {
  // Determine account status based on various factors
  if (!profile.email_verified) {
    return { status: 'pending_verification', message: 'Please verify your email address' }
  }
  
  if (!profile.onboarding_completed) {
    return { status: 'onboarding_incomplete', message: 'Complete your account setup' }
  }
  
  if (profile.subscription_info?.status === 'past_due') {
    return { status: 'payment_required', message: 'Please update your payment information' }
  }
  
  return { status: 'active', message: 'Account in good standing' }
}
```

### **3.2 Mailing List Management APIs**

The mailing list management system serves as the foundation for all direct mail campaigns within the platform. These APIs handle the complete lifecycle of mailing lists, from initial creation through integration with external data processing services, while maintaining data quality and user access controls throughout the process.

Understanding the mailing list workflow helps developers implement consistent patterns across related features. When users create mailing lists, they typically start with either manually entered data or imported CSV files. The system validates data quality, processes it through external services when needed, and maintains detailed audit trails of all transformations applied to the data.

```javascript
// Comprehensive mailing list management with external service integration
// Location: /pages/api/mailing-lists/index.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  switch (req.method) {
    case 'GET':
      return await getUserMailingLists(req, res, session.user.id)
    case 'POST':
      return await createMailingList(req, res, session.user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function createMailingList(req, res, userId) {
  try {
    const { name, description, source, data } = req.body
    
    // Validate mailing list creation request
    const validation = validateMailingListCreation({ name, description, source, data })
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid mailing list data',
        details: validation.errors
      })
    }

    // Create the base mailing list record
    const { data: mailingList, error: listError } = await supabase
      .from('mailing_lists')
      .insert({
        user_id: userId,
        name: name,
        description: description,
        source: source, // 'manual', 'csv_upload', 'melissa_purchase', 'api_import'
        status: 'processing',
        record_count: 0,
        created_at: new Date()
      })
      .select()
      .single()

    if (listError) {
      return res.status(500).json({ error: 'Failed to create mailing list' })
    }

    // Process the data based on source type
    let processingResult
    switch (source) {
      case 'manual':
        processingResult = await processManualData(mailingList.id, data)
        break
      case 'csv_upload':
        processingResult = await processCsvUpload(mailingList.id, data.fileContent, data.mapping)
        break
      case 'melissa_purchase':
        processingResult = await processMelissaPurchase(mailingList.id, data.purchaseId)
        break
      default:
        throw new Error(`Unsupported data source: ${source}`)
    }

    // Update the mailing list with processing results
    await supabase
      .from('mailing_lists')
      .update({
        status: processingResult.success ? 'active' : 'failed',
        record_count: processingResult.recordCount || 0,
        processing_notes: processingResult.notes,
        processed_at: new Date()
      })
      .eq('id', mailingList.id)

    if (!processingResult.success) {
      return res.status(400).json({
        error: 'Data processing failed',
        details: processingResult.errors
      })
    }

    // Log successful creation
    await logUserEvent('mailing_list_created', userId, {
      listId: mailingList.id,
      source: source,
      recordCount: processingResult.recordCount
    })

    res.status(201).json({
      success: true,
      mailingList: {
        ...mailingList,
        status: 'active',
        recordCount: processingResult.recordCount
      },
      processingResult: processingResult
    })

  } catch (error) {
    console.error('Mailing list creation error:', error)
    res.status(500).json({ error: 'Failed to create mailing list' })
  }
}

async function processManualData(listId, records) {
  // Process manually entered contact records with validation and deduplication
  try {
    const validatedRecords = []
    const errors = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const validation = validateContactRecord(record)
      
      if (validation.isValid) {
        // Standardize the record format
        validatedRecords.push({
          mailing_list_id: listId,
          first_name: standardizeName(record.firstName),
          last_name: standardizeName(record.lastName),
          address_line_1: standardizeAddress(record.address),
          address_line_2: record.address2 || null,
          city: standardizeCity(record.city),
          state: standardizeState(record.state),
          zip_code: standardizeZipCode(record.zipCode),
          email: record.email ? standardizeEmail(record.email) : null,
          phone: record.phone ? standardizePhone(record.phone) : null,
          created_at: new Date()
        })
      } else {
        errors.push({
          recordIndex: i,
          errors: validation.errors
        })
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors: errors,
        notes: `${errors.length} records failed validation`
      }
    }

    // Remove duplicates based on name and address
    const deduplicatedRecords = removeDuplicateRecords(validatedRecords)
    
    // Insert validated records into database
    const { data: insertedRecords, error: insertError } = await supabase
      .from('mailing_list_records')
      .insert(deduplicatedRecords)
      .select()

    if (insertError) {
      throw new Error('Failed to insert records: ' + insertError.message)
    }

    return {
      success: true,
      recordCount: insertedRecords.length,
      duplicatesRemoved: validatedRecords.length - insertedRecords.length,
      notes: `Successfully processed ${insertedRecords.length} records`
    }

  } catch (error) {
    console.error('Manual data processing error:', error)
    return {
      success: false,
      errors: [error.message],
      notes: 'Failed to process manual data'
    }
  }
}

async function processCsvUpload(listId, fileContent, columnMapping) {
  // Process CSV file uploads with flexible column mapping and data validation
  try {
    // Parse CSV content using robust parsing library
    const Papa = require('papaparse')
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    })

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        errors: parseResult.errors,
        notes: 'CSV parsing failed'
      }
    }

    const rawRecords = parseResult.data
    const processedRecords = []
    const processingErrors = []

    // Map CSV columns to our standard format using provided mapping
    for (let i = 0; i < rawRecords.length; i++) {
      try {
        const rawRecord = rawRecords[i]
        const mappedRecord = {
          mailing_list_id: listId,
          first_name: rawRecord[columnMapping.firstName] || '',
          last_name: rawRecord[columnMapping.lastName] || '',
          address_line_1: rawRecord[columnMapping.address] || '',
          address_line_2: rawRecord[columnMapping.address2] || null,
          city: rawRecord[columnMapping.city] || '',
          state: rawRecord[columnMapping.state] || '',
          zip_code: rawRecord[columnMapping.zipCode] || '',
          email: rawRecord[columnMapping.email] || null,
          phone: rawRecord[columnMapping.phone] || null,
          created_at: new Date()
        }

        // Validate and standardize the mapped record
        const validation = validateContactRecord(mappedRecord)
        if (validation.isValid) {
          processedRecords.push(standardizeContactRecord(mappedRecord))
        } else {
          processingErrors.push({
            row: i + 1,
            errors: validation.errors,
            data: rawRecord
          })
        }

      } catch (error) {
        processingErrors.push({
          row: i + 1,
          errors: ['Processing error: ' + error.message],
          data: rawRecords[i]
        })
      }
    }

    // Check if we have enough valid records to proceed
    if (processedRecords.length === 0) {
      return {
        success: false,
        errors: processingErrors,
        notes: 'No valid records found in CSV file'
      }
    }

    // Remove duplicates and insert valid records
    const deduplicatedRecords = removeDuplicateRecords(processedRecords)
    
    const { data: insertedRecords, error: insertError } = await supabase
      .from('mailing_list_records')
      .insert(deduplicatedRecords)
      .select()

    if (insertError) {
      throw new Error('Database insertion failed: ' + insertError.message)
    }

    return {
      success: true,
      recordCount: insertedRecords.length,
      totalProcessed: rawRecords.length,
      validRecords: processedRecords.length,
      duplicatesRemoved: processedRecords.length - insertedRecords.length,
      errors: processingErrors,
      notes: `Successfully imported ${insertedRecords.length} records from ${rawRecords.length} total`
    }

  } catch (error) {
    console.error('CSV processing error:', error)
    return {
      success: false,
      errors: [error.message],
      notes: 'Failed to process CSV upload'
    }
  }
}

function standardizeContactRecord(record) {
  // Apply consistent formatting standards to contact data
  return {
    ...record,
    first_name: standardizeName(record.first_name),
    last_name: standardizeName(record.last_name),
    address_line_1: standardizeAddress(record.address_line_1),
    city: standardizeCity(record.city),
    state: standardizeState(record.state),
    zip_code: standardizeZipCode(record.zip_code),
    email: record.email ? standardizeEmail(record.email) : null,
    phone: record.phone ? standardizePhone(record.phone) : null
  }
}

function removeDuplicateRecords(records) {
  // Remove duplicates based on name and address combination
  const seen = new Set()
  return records.filter(record => {
    const key = `${record.first_name.toLowerCase()}_${record.last_name.toLowerCase()}_${record.address_line_1.toLowerCase()}_${record.zip_code}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
```

**Mailing List Processing and External Service Integration:**

The platform integrates mailing list processing with external services like AccuZIP for data cleaning and Melissa for list purchasing. This integration demonstrates how internal APIs can orchestrate complex workflows involving multiple external services while maintaining data consistency and user experience.

```javascript
// Mailing list processing with AccuZIP integration
// Location: /pages/api/mailing-lists/[id]/process.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const { id: mailingListId } = req.query
    const { services } = req.body // Array of services: ['cass', 'ncoa', 'dups', 'presort']

    // Verify user owns the mailing list
    const { data: mailingList, error: listError } = await supabase
      .from('mailing_lists')
      .select('*')
      .eq('id', mailingListId)
      .eq('user_id', session.user.id)
      .single()

    if (listError || !mailingList) {
      return res.status(404).json({ error: 'Mailing list not found' })
    }

    // Check if list is in a processable state
    if (mailingList.status !== 'active') {
      return res.status(400).json({ 
        error: 'Mailing list not ready for processing',
        currentStatus: mailingList.status
      })
    }

    // Generate CSV file from mailing list records for AccuZIP processing
    const csvData = await generateCsvFromMailingList(mailingListId)
    
    // Submit to AccuZIP for processing with requested services
    const accuzipResult = await submitToAccuZip({
      mailingListId: mailingListId,
      csvData: csvData,
      services: services,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/accuzip/webhook`
    })

    // Update mailing list status to indicate processing has started
    await supabase
      .from('mailing_lists')
      .update({
        status: 'processing_external',
        processing_started_at: new Date(),
        external_job_id: accuzipResult.jobId
      })
      .eq('id', mailingListId)

    // Log the processing initiation
    await logUserEvent('mailing_list_processing_started', session.user.id, {
      mailingListId: mailingListId,
      services: services,
      accuzipJobId: accuzipResult.jobId
    })

    res.json({
      success: true,
      message: 'Processing started successfully',
      jobId: accuzipResult.jobId,
      estimatedCompletionTime: accuzipResult.estimatedCompletion,
      services: services
    })

  } catch (error) {
    console.error('Mailing list processing error:', error)
    res.status(500).json({ error: 'Failed to start processing' })
  }
}

async function generateCsvFromMailingList(mailingListId) {
  // Generate CSV data from mailing list records for external processing
  const { data: records } = await supabase
    .from('mailing_list_records')
    .select('first_name, last_name, address_line_1, address_line_2, city, state, zip_code, email, phone')
    .eq('mailing_list_id', mailingListId)
    .order('created_at')

  if (!records || records.length === 0) {
    throw new Error('No records found in mailing list')
  }

  // Convert records to CSV format with proper headers
  const Papa = require('papaparse')
  const csvContent = Papa.unparse(records, {
    header: true,
    columns: ['first_name', 'last_name', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code', 'email', 'phone']
  })

  return csvContent
}
```

### **3.3 Order Management and Workflow APIs**

The order management system orchestrates the complete direct mail campaign lifecycle, from initial order creation through production and delivery. These APIs coordinate with external services for printing and fulfillment while maintaining comprehensive audit trails and user notifications throughout the process.

Understanding the order workflow architecture helps developers implement consistent patterns across different order types and processing stages. Orders progress through defined states that trigger specific business logic, external service integrations, and user notifications. This state-driven approach ensures that complex workflows remain predictable and debuggable.

```javascript
// Comprehensive order management with workflow orchestration
// Location: /pages/api/orders/index.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  switch (req.method) {
    case 'GET':
      return await getUserOrders(req, res, session.user.id)
    case 'POST':
      return await createOrder(req, res, session.user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function createOrder(req, res, userId) {
  try {
    const { 
      mailingListId, 
      designTemplateId, 
      orderItems, 
      shippingAddress,
      fulfillmentType,
      rushOrder,
      specialInstructions 
    } = req.body

    // Validate order creation request with comprehensive business rule checking
    const validation = await validateOrderCreation({
      userId,
      mailingListId,
      designTemplateId,
      orderItems,
      shippingAddress,
      fulfillmentType
    })

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid order configuration',
        details: validation.errors,
        suggestions: validation.suggestions
      })
    }

    // Calculate order pricing based on items, quantity, and service options
    const pricingCalculation = await calculateOrderPricing({
      orderItems,
      fulfillmentType,
      rushOrder,
      userId // For user-specific pricing tiers
    })

    // Start database transaction for atomic order creation
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        mailing_list_id: mailingListId,
        design_template_id: designTemplateId,
        status: 'draft',
        fulfillment_type: fulfillmentType,
        rush_order: rushOrder || false,
        special_instructions: specialInstructions,
        subtotal: pricingCalculation.subtotal,
        tax_amount: pricingCalculation.taxAmount,
        total_amount: pricingCalculation.total,
        created_at: new Date()
      })
      .select()
      .single()

    if (orderError) {
      return res.status(500).json({ error: 'Failed to create order' })
    }

    // Create order items with detailed specifications
    const orderItemsWithOrderId = orderItems.map(item => ({
      order_id: order.id,
      product_type: item.productType,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      specifications: item.specifications, // JSON field for product-specific options
      created_at: new Date()
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId)
      .select()

    if (itemsError) {
      // Clean up the order if item creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      return res.status(500).json({ error: 'Failed to create order items' })
    }

    // Create shipping address if provided
    if (shippingAddress) {
      const { error: addressError } = await supabase
        .from('shipping_addresses')
        .insert({
          order_id: order.id,
          recipient_name: shippingAddress.recipientName,
          company_name: shippingAddress.companyName,
          address_line_1: shippingAddress.addressLine1,
          address_line_2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip_code: shippingAddress.zipCode,
          country: shippingAddress.country || 'US',
          created_at: new Date()
        })

      if (addressError) {
        console.error('Shipping address creation failed:', addressError)
        // Continue with order creation - address can be added later
      }
    }

    // Initialize order workflow state tracking
    await initializeOrderWorkflow(order.id, fulfillmentType)

    // Log order creation for analytics and audit
    await logUserEvent('order_created', userId, {
      orderId: order.id,
      fulfillmentType: fulfillmentType,
      totalAmount: pricingCalculation.total,
      itemCount: orderItems.length
    })

    res.status(201).json({
      success: true,
      order: {
        ...order,
        items: createdItems,
        pricingBreakdown: pricingCalculation,
        workflowStatus: 'initialized'
      },
      nextSteps: determineNextOrderSteps(order, fulfillmentType)
    })

  } catch (error) {
    console.error('Order creation error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
}

async function calculateOrderPricing(orderData) {
  // Comprehensive pricing calculation including all fees and discounts
  try {
    let subtotal = 0
    const itemBreakdown = []

    // Calculate base pricing for each order item
    for (const item of orderData.orderItems) {
      const basePrice = await getProductBasePrice(item.productType, item.specifications)
      const quantityMultiplier = calculateQuantityDiscount(item.quantity)
      const rushSurcharge = orderData.rushOrder ? basePrice * 0.5 : 0

      const itemTotal = (basePrice * quantityMultiplier * item.quantity) + rushSurcharge
      subtotal += itemTotal

      itemBreakdown.push({
        productType: item.productType,
        quantity: item.quantity,
        basePrice: basePrice,
        quantityDiscount: 1 - quantityMultiplier,
        rushSurcharge: rushSurcharge,
        itemTotal: itemTotal
      })
    }

    // Apply user-specific discounts
    const userDiscount = await getUserDiscountRate(orderData.userId)
    const discountAmount = subtotal * userDiscount

    // Calculate fulfillment fees
    const fulfillmentFee = calculateFulfillmentFee(orderData.fulfillmentType, subtotal)

    // Calculate tax based on user location
    const taxRate = await getTaxRate(orderData.userId)
    const taxableAmount = subtotal - discountAmount + fulfillmentFee
    const taxAmount = taxableAmount * taxRate

    const total = subtotal - discountAmount + fulfillmentFee + taxAmount

    return {
      subtotal: subtotal,
      userDiscount: discountAmount,
      fulfillmentFee: fulfillmentFee,
      taxAmount: taxAmount,
      total: total,
      itemBreakdown: itemBreakdown,
      calculations: {
        userDiscountRate: userDiscount,
        taxRate: taxRate,
        fulfillmentType: orderData.fulfillmentType
      }
    }

  } catch (error) {
    console.error('Pricing calculation error:', error)
    throw new Error('Unable to calculate order pricing')
  }
}

async function initializeOrderWorkflow(orderId, fulfillmentType) {
  // Initialize workflow tracking based on fulfillment type
  const workflowSteps = determineWorkflowSteps(fulfillmentType)
  
  const workflowData = {
    order_id: orderId,
    fulfillment_type: fulfillmentType,
    current_step: workflowSteps[0].name,
    total_steps: workflowSteps.length,
    steps_completed: 0,
    workflow_data: {
      steps: workflowSteps,
      estimatedCompletion: calculateEstimatedCompletion(workflowSteps)
    },
    created_at: new Date()
  }

  await supabase
    .from('order_workflows')
    .insert(workflowData)
}

function determineWorkflowSteps(fulfillmentType) {
  // Define workflow steps based on fulfillment type
  const baseSteps = [
    { name: 'payment_processing', estimatedDuration: '5 minutes' },
    { name: 'design_preparation', estimatedDuration: '2-4 hours' },
    { name: 'proof_approval', estimatedDuration: '24-48 hours' }
  ]

  if (fulfillmentType === 'print_only') {
    return [
      ...baseSteps,
      { name: 'print_production', estimatedDuration: '3-5 business days' },
      { name: 'quality_check', estimatedDuration: '1 business day' },
      { name: 'packaging', estimatedDuration: '1 business day' },
      { name: 'shipping', estimatedDuration: '2-5 business days' }
    ]
  } else if (fulfillmentType === 'print_and_mail') {
    return [
      ...baseSteps,
      { name: 'print_production', estimatedDuration: '3-5 business days' },
      { name: 'mailing_preparation', estimatedDuration: '1-2 business days' },
      { name: 'postal_delivery', estimatedDuration: '3-7 business days' }
    ]
  }

  return baseSteps
}

function determineNextOrderSteps(order, fulfillmentType) {
  // Provide clear guidance on what the user needs to do next
  const nextSteps = [
    {
      action: 'review_order',
      title: 'Review Order Details',
      description: 'Verify all order information is correct before proceeding to payment',
      required: true
    },
    {
      action: 'add_payment_method',
      title: 'Add Payment Method',
      description: 'Securely add a payment method to process your order',
      required: true
    }
  ]

  if (fulfillmentType === 'print_and_mail') {
    nextSteps.push({
      action: 'verify_mailing_list',
      title: 'Verify Mailing List',
      description: 'Ensure your mailing list is processed and ready for printing',
      required: true
    })
  }

  return nextSteps
}
```

**Order Status Management and Workflow Progression:**

The order status system provides real-time visibility into order progress while triggering appropriate business logic at each stage. This system integrates with external services and maintains comprehensive audit trails for debugging and customer service purposes.

```javascript
// Order status management with workflow progression
// Location: /pages/api/orders/[id]/status.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const { id: orderId } = req.query

  switch (req.method) {
    case 'GET':
      return await getOrderStatus(req, res, orderId, session.user.id)
    case 'PUT':
      return await updateOrderStatus(req, res, orderId, session.user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function updateOrderStatus(req, res, orderId, userId) {
  try {
    const { newStatus, notes, systemUpdate } = req.body

    // Verify user can update this order status
    const authResult = await verifyOrderUpdatePermission(orderId, userId, newStatus, systemUpdate)
    if (!authResult.authorized) {
      return res.status(403).json({ error: authResult.reason })
    }

    // Validate status transition is allowed
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status, fulfillment_type')
      .eq('id', orderId)
      .single()

    const transitionValidation = validateStatusTransition(currentOrder.status, newStatus, currentOrder.fulfillment_type)
    if (!transitionValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid status transition',
        details: transitionValidation.reason,
        allowedTransitions: transitionValidation.allowedTransitions
      })
This comprehensive documentation provides the architectural foundation and implementation details for the Yellow Letter Shop platform's internal infrastructure. Unlike external API integration patterns covered in `api-integrations.md`, this document focuses on the core platform components that power the YLS application: internal REST API endpoints, database architecture, authentication systems, and development patterns that enable seamless integration with external services.

The platform architecture demonstrates how modern SaaS applications can achieve scalability, security, and maintainability while supporting complex business workflows like direct mail automation. This documentation serves both as a reference for current developers and as a foundation for future platform expansion and optimization.

## **Table of Contents**

1. [Platform Architecture Overview](#1-platform-architecture-overview)
2. [Authentication and Authorization](#2-authentication-and-authorization)
3. [Internal REST API Reference](#3-internal-rest-api-reference)
4. [Database Architecture](#4-database-architecture)
5. [Security Implementation](#5-security-implementation)
6. [Development Patterns](#6-development-patterns)
7. [Testing Framework](#7-testing-framework)
8. [Performance Considerations](#8-performance-considerations)
9. [Integration with External APIs](#9-integration-with-external-apis)
10. [Deployment and Operations](#10-deployment-and-operations)

## **1. Platform Architecture Overview**

### **1.1 Technology Stack Foundation**

The Yellow Letter Shop platform employs a carefully chosen technology stack that balances developer productivity with production scalability. Each technology decision supports both the immediate needs of direct mail automation and the long-term vision of platform extensibility.

**Frontend Architecture Decision Rationale:**

The frontend leverages Next.js 14 with the App Router paradigm, providing server-side rendering capabilities that improve both user experience and search engine optimization. This architectural choice enables the platform to deliver fast initial page loads while maintaining the interactivity expected in modern SaaS applications. TypeScript integration across the entire frontend codebase ensures type safety and reduces runtime errors, particularly important when handling complex order configurations and mailing list management.

React Hook Form with Zod validation creates a robust form handling system that validates data both on the client and server sides. This dual validation approach prevents invalid data from reaching external APIs while providing immediate user feedback. Tailwind CSS enables rapid UI development with consistent design systems while maintaining the flexibility to create custom components when business requirements demand unique user experiences.

**Backend Architecture Decision Rationale:**

Supabase serves as the backend-as-a-service foundation, providing PostgreSQL database hosting with built-in Row-Level Security (RLS) that naturally supports multi-tenant architectures. This choice eliminates the complexity of managing separate database instances per customer while ensuring complete data isolation. The platform leverages Supabase's real-time subscriptions for features like live order status updates and collaborative proof approval workflows.

Next.js API Routes handle custom business logic that extends beyond Supabase's capabilities, particularly the orchestration of external service integrations documented in `api-integrations.md`. This hybrid approach allows the platform to benefit from Supabase's managed services while maintaining full control over complex workflows.

Prisma ORM provides type-safe database operations that prevent SQL injection vulnerabilities while enabling complex queries needed for analytics and reporting features. The ORM's migration system ensures database schema changes can be deployed consistently across development, staging, and production environments.

**Key Architectural Principles in Practice:**

The API-first design philosophy ensures that every platform feature exposes consistent REST endpoints that could support future mobile applications or third-party integrations. This approach has already proven valuable in building the integration layer for external services, where consistent internal APIs simplify the orchestration of complex multi-service workflows.

Multi-tenant architecture with strict data isolation means that each user's data remains completely separate, both for security and compliance reasons. Row-Level Security policies automatically enforce these boundaries at the database level, preventing accidental data leakage even if application code contains bugs.

Event-driven patterns enable complex workflows like order processing to remain responsive and fault-tolerant. When a user submits an order, the system immediately acknowledges the request while queuing background jobs for external API calls. This approach ensures that temporary external service outages do not impact user experience.

Comprehensive audit logging supports both debugging and compliance requirements. Every significant action within the platform generates detailed logs that can be used for troubleshooting integration issues or demonstrating compliance with data protection regulations.

### **1.2 Request and Response Flow Architecture**

Understanding the complete request flow through the YLS platform helps developers implement consistent patterns and debug issues effectively. The architecture ensures that every request follows the same security and validation pipeline regardless of whether it ultimately calls external services.

**Detailed Request Processing Pipeline:**

Client requests first encounter Next.js middleware that performs initial routing and request preprocessing. This layer handles concerns like CORS headers for API requests and redirects for unauthenticated users accessing protected resources. The middleware also implements rate limiting at the request level to prevent abuse of both internal APIs and external service integrations.

Authentication verification occurs through Supabase's JWT token validation, which confirms both the authenticity of the user and the validity of their session. This step populates request context with user information that subsequent processing stages can rely upon without additional database queries.

Row-Level Security enforcement happens automatically at the database level when Supabase processes queries. This security layer ensures that users can only access their own data, even if application code accidentally constructs overly broad queries. The RLS policies reference the authenticated user ID from the JWT token, creating an automatic and tamper-proof authorization system.

Business logic processing varies depending on whether the request requires external service integration. Simple operations like retrieving user data or updating account settings complete entirely within the platform's infrastructure. Complex operations like purchasing mailing lists or submitting print orders trigger the external API integration workflows documented in `api-integrations.md`.

Database transactions ensure data consistency across all operations, particularly important when updating multiple related tables or when external API calls must be coordinated with internal state changes. The platform uses explicit transaction boundaries to ensure that partial failures can be rolled back cleanly.

Response formatting standardizes how success and error conditions are communicated to client applications. This consistency simplifies error handling in frontend code and provides predictable integration patterns for any future API consumers.

**Integration Points with External Services:**

When business logic requires external service calls, the platform follows the integration patterns detailed in `api-integrations.md`. These integrations maintain the same request/response structure as purely internal operations, abstracting the complexity of external service communication from client applications.

For example, when a user requests a mailing list count estimate, the internal API endpoint immediately returns cached data if available, or initiates a Melissa API call with appropriate rate limiting and error handling. The client application receives a consistent response format regardless of whether the data came from cache or external service.

This architectural approach allows the platform to evolve external service integrations without requiring changes to client applications, demonstrating the value of proper abstraction layers in SaaS platform design.

## **2. Authentication and Authorization**

### **2.1 Supabase Authentication Integration**

The authentication system provides the security foundation for all platform operations while maintaining the user experience standards expected in modern SaaS applications. Supabase's authentication service handles the complexity of secure credential management while exposing simple APIs for common authentication workflows.

**User Registration and Onboarding Process:**

User registration begins with email verification to ensure account security from the initial signup. The platform captures essential business information during registration, including company details and intended use cases, which inform both the user experience customization and business intelligence systems.

```javascript
// User registration with business context capture
// Location: /pages/api/auth/register.js
import { createClient } from '@supabase/supabase-js'
import { validateBusinessRegistration } from '@/lib/validation/business'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, businessInfo } = req.body
    
    // Validate business information completeness and format
    const businessValidation = validateBusinessRegistration(businessInfo)
    if (!businessValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid business information',
        details: businessValidation.errors
      })
    }

    // Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false, // Require email verification
      user_metadata: {
        businessName: businessInfo.companyName,
        industry: businessInfo.industry,
        registrationSource: 'web_signup'
      }
    })

    if (authError) {
      // Handle specific authentication errors with user-friendly messages
      if (authError.message.includes('already registered')) {
        return res.status(409).json({ 
          error: 'Email already registered',
          suggestion: 'Try signing in or use password reset if you forgot your password'
        })
      }
      
      return res.status(400).json({ 
        error: 'Registration failed',
        details: authError.message 
      })
    }

    // Create comprehensive user profile with business context
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: email,
        company_name: businessInfo.companyName,
        industry: businessInfo.industry,
        company_size: businessInfo.companySize,
        monthly_volume_estimate: businessInfo.estimatedVolume,
        referral_source: businessInfo.referralSource,
        created_at: new Date(),
        onboarding_completed: false
      })
      .select()
      .single()

    if (profileError) {
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Failed to create user profile' })
    }

    // Initialize default user settings and preferences
    await supabase
      .from('user_settings')
      .insert({
        user_id: authData.user.id,
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: true,
        dashboard_layout: 'default',
        timezone: businessInfo.timezone || 'America/New_York'
      })

    // Send welcome email with onboarding guidance
    await sendWelcomeEmail(email, businessInfo.companyName, authData.user.id)

    // Log successful registration for analytics
    await logUserEvent('user_registered', authData.user.id, {
      registrationMethod: 'email',
      businessInfo: businessInfo,
      timestamp: new Date()
    })

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      userId: authData.user.id,
      nextStep: 'email_verification'
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      error: 'Internal server error during registration',
      message: 'Please try again or contact support if the problem persists'
    })
  }
}

async function sendWelcomeEmail(email, companyName, userId) {
  // Welcome email includes onboarding checklist and key platform features
  const emailContent = {
    to: email,
    subject: `Welcome to Yellow Letter Shop, ${companyName}!`,
    template: 'welcome_onboarding',
    variables: {
      companyName: companyName,
      verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${userId}`,
      onboardingSteps: [
        'Verify your email address',
        'Complete business profile setup',
        'Create your first mailing list',
        'Design your first letter campaign',
        'Review pricing and billing options'
      ]
    }
  }
  
  // Implementation depends on chosen email service (SendGrid, Postmark, etc.)
  await sendEmail(emailContent)
}
```

**Session Management and Security:**

Session management balances security with user convenience through configurable session lifetimes and automatic renewal policies. The platform implements session refresh tokens that allow users to maintain active sessions across browser restarts while ensuring that compromised tokens have limited validity periods.

Multi-factor authentication integration provides additional security for users handling sensitive customer data or large volume campaigns. The system supports both SMS and authenticator app-based MFA, with fallback codes for account recovery scenarios.

**Role-Based Access Control Implementation:**

The platform implements a flexible role-based access control system that can accommodate both individual users and team-based organizations. This system prepares the platform for future enterprise features while maintaining simplicity for current single-user accounts.

```javascript
// Role-based access control with hierarchical permissions
// Location: /lib/auth/rbac.js
export class RoleBasedAccessControl {
  constructor() {
    // Define role hierarchy and default permissions
    this.roles = {
      'account_owner': {
        level: 100,
        inherits: ['admin'],
        permissions: ['billing_manage', 'team_manage', 'account_delete']
      },
      'admin': {
        level: 80,
        inherits: ['manager'],
        permissions: ['user_manage', 'settings_manage', 'integrations_manage']
      },
      'manager': {
        level: 60,
        inherits: ['user'],
        permissions: ['orders_manage', 'lists_manage', 'reports_view']
      },
      'user': {
        level: 40,
        inherits: [],
        permissions: ['orders_create', 'orders_view', 'lists_create', 'lists_view']
      },
      'viewer': {
        level: 20,
        inherits: [],
        permissions: ['orders_view', 'lists_view', 'reports_view']
      }
    }
  }

  // Check if user has permission for specific action
  async checkPermission(userId, permission, resourceId = null) {
    try {
      // Get user's role assignment
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role_name, granted_by, granted_at')
        .eq('user_id', userId)
        .eq('active', true)
        .single()

      if (!userRole) {
        return { authorized: false, reason: 'No role assigned' }
      }

      // Calculate effective permissions including inherited permissions
      const effectivePermissions = this.calculateEffectivePermissions(userRole.role_name)
      
      if (!effectivePermissions.includes(permission)) {
        return { authorized: false, reason: 'Permission not granted to role' }
      }

      // For resource-specific permissions, check ownership or sharing
      if (resourceId) {
        const resourceAccess = await this.checkResourceAccess(userId, resourceId, permission)
        if (!resourceAccess.authorized) {
          return resourceAccess
        }
      }

      return { authorized: true, role: userRole.role_name }

    } catch (error) {
      console.error('Permission check failed:', error)
      return { authorized: false, reason: 'Permission check error' }
    }
  }

  calculateEffectivePermissions(roleName) {
    const role = this.roles[roleName]
    if (!role) {
      return []
    }

    let permissions = [...role.permissions]
    
    // Add permissions from inherited roles
    if (role.inherits && role.inherits.length > 0) {
      for (const inheritedRole of role.inherits) {
        const inheritedPermissions = this.calculateEffectivePermissions(inheritedRole)
        permissions = [...permissions, ...inheritedPermissions]
      }
    }

    // Remove duplicates and return
    return [...new Set(permissions)]
  }

  async checkResourceAccess(userId, resourceId, permission) {
    // Check if user owns the resource
    const { data: resource } = await supabase
      .from('resource_ownership')
      .select('user_id, resource_type')
      .eq('resource_id', resourceId)
      .single()

    if (resource && resource.user_id === userId) {
      return { authorized: true, reason: 'Resource owner' }
    }

    // Check if resource is shared with user
    const { data: sharedAccess } = await supabase
      .from('resource_sharing')
      .select('permissions')
      .eq('resource_id', resourceId)
      .eq('shared_with_user_id', userId)
      .eq('active', true)
      .single()

    if (sharedAccess && sharedAccess.permissions.includes(permission)) {
      return { authorized: true, reason: 'Shared access' }
    }

    return { authorized: false, reason: 'No access to resource' }
  }

  // Middleware function for API route protection
  static createAuthMiddleware(requiredPermission) {
    return async (req, res, next) => {
      try {
        const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
        
        if (!session) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        const rbac = new RoleBasedAccessControl()
        const resourceId = req.params.id || req.body.resourceId
        const permissionCheck = await rbac.checkPermission(session.user.id, requiredPermission, resourceId)

        if (!permissionCheck.authorized) {
          return res.status(403).json({ 
            error: 'Access denied', 
            reason: permissionCheck.reason 
          })
        }

        // Add user and permission context to request
        req.user = session.user
        req.userRole = permissionCheck.role
        next()

      } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({ error: 'Authorization check failed' })
      }
    }
  }
}
```

### **2.2 Row-Level Security Implementation**

Row-Level Security policies provide automatic data isolation that protects user data even when application code contains bugs or when database access occurs outside the application layer. These policies serve as the foundation for multi-tenant data security.

**Core RLS Policy Patterns:**

The platform implements consistent RLS patterns across all user-data tables, ensuring that users can only access records they own or have been explicitly granted access to. These policies reference the authenticated user ID from JWT tokens, creating tamper-proof authorization.

```sql
-- Comprehensive Row-Level Security policies for multi-tenant data isolation
-- Applied to all user-data tables in the YLS platform

-- User profiles: Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Mailing lists: Complete ownership control with sharing support
CREATE POLICY "Users can view own mailing lists" ON mailing_lists
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM mailing_list_shares
      WHERE mailing_list_id = mailing_lists.id
      AND shared_with_user_id = auth.uid()
      AND active = true
    )
  );

CREATE POLICY "Users can create mailing lists" ON mailing_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mailing lists" ON mailing_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mailing lists" ON mailing_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Orders: Full lifecycle access control with team collaboration support
CREATE POLICY "Users can view accessible orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = (
        SELECT team_id FROM user_profiles WHERE user_id = orders.user_id
      )
      AND user_id = auth.uid()
      AND permissions ? 'orders_view'
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (
    auth.uid() = user_id AND
    status NOT IN ('completed', 'cancelled') -- Prevent modification of finalized orders
  );

-- Order items: Inherit access control from parent order
CREATE POLICY "Users can access order items through orders" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_id = (
            SELECT team_id FROM user_profiles WHERE user_id = orders.user_id
          )
          AND user_id = auth.uid()
          AND permissions ? 'orders_view'
        )
      )
    )
  );

-- Design templates: Support for both private and shared templates
CREATE POLICY "Users can view accessible templates" ON design_templates
  FOR SELECT USING (
    user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM template_shares
      WHERE template_id = design_templates.id
      AND shared_with_user_id = auth.uid()
      AND active = true
    )
  );

CREATE POLICY "Users can create templates" ON design_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON design_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Analytics and audit logs: Read-only access to own data
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- External API integration data: Strict ownership with admin override
CREATE POLICY "Users can access own Melissa data" ON melissa_search_criteria
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role_name = 'admin'
      AND active = true
    )
  );

CREATE POLICY "Users can access own AccuZIP jobs" ON accuzip_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mailing_lists
      WHERE mailing_lists.id = accuzip_jobs.mailing_list_id
      AND mailing_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access own Redstone orders" ON redstone_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = redstone_orders.order_id
      AND orders.user_id = auth.uid()
    )
  );
```

**Policy Testing and Validation:**

RLS policies require thorough testing to ensure they provide the intended security boundaries without blocking legitimate access. The platform includes automated tests that verify policy behavior under various scenarios.

```javascript
// Automated RLS policy testing framework
// Location: /tests/security/rls-policies.test.js
describe('Row-Level Security Policies', () => {
  let testUser1, testUser2, adminUser
  
  beforeEach(async () => {
    // Create test users with different roles
    testUser1 = await createTestUser('user1@test.com', 'user')
    testUser2 = await createTestUser('user2@test.com', 'user')
    adminUser = await createTestUser('admin@test.com', 'admin')
  })

  describe('Mailing Lists Access Control', () => {
    test('users can only access their own mailing lists', async () => {
      // User 1 creates a mailing list
      const list1 = await createMailingList(testUser1.id, 'User 1 List')
      
      // User 2 creates a mailing list
      const list2 = await createMailingList(testUser2.id, 'User 2 List')
      
      // User 1 should only see their own list
      const user1Lists = await getMailingLists(testUser1.id)
      expect(user1Lists).toHaveLength(1)
      expect(user1Lists[0].id).toBe(list1.id)
      
      // User 2 should only see their own list
      const user2Lists = await getMailingLists(testUser2.id)
      expect(user2Lists).toHaveLength(1)
      expect(user2Lists[0].id).toBe(list2.id)
    })

    test('shared mailing lists are accessible to shared users', async () => {
      const list = await createMailingList(testUser1.id, 'Shared List')
      
      // Share list with user 2
      await shareMailingList(list.id, testUser2.id, ['view', 'edit'])
      
      // User 2 should now see the shared list
      const user2Lists = await getMailingLists(testUser2.id)
      expect(user2Lists).toHaveLength(1)
      expect(user2Lists[0].id).toBe(list.id)
    })

    test('users cannot access lists after sharing is revoked', async () => {
      const list = await createMailingList(testUser1.id, 'Temporarily Shared List')
      
      // Share and then revoke access
      await shareMailingList(list.id, testUser2.id, ['view'])
      await revokeMailingListAccess(list.id, testUser2.id)
      
      // User 2 should no longer see the list
      const user2Lists = await getMailingLists(testUser2.id)
      expect(user2Lists).toHaveLength(0)
    })
  })

  describe('Order Access Control', () => {
    test('users can only modify their own orders in valid states', async () => {
      const order = await createOrder(testUser1.id, { status: 'draft' })
      
      // User 1 should be able to update draft order
      const updateResult = await updateOrder(testUser1.id, order.id, { 
        notes: 'Updated notes' 
      })
      expect(updateResult.success).toBe(true)
      
      // Complete the order
      await updateOrderStatus(order.id, 'completed')
      
      // User 1 should not be able to update completed order
      const blockedUpdate = await updateOrder(testUser1.id, order.id, { 
        notes: 'Should not work' 
      })
      expect(blockedUpdate.success).toBe(false)
    })

    test('users cannot access orders belonging to other users', async () => {
      const order = await createOrder(testUser1.id, { status: 'draft' })
      
      // User 2 should not be able to see or modify the order
      const accessAttempt = await getOrder(testUser2.id, order.id)
      expect(accessAttempt).toBeNull()
      
      const updateAttempt = await updateOrder(testUser2.id, order.id, { 
        notes: 'Unauthorized access' 
      })
      expect(updateAttempt.success).toBe(false)
    })
  })

  describe('Admin Override Capabilities', () => {
    test('admin users can access all data when necessary', async () => {
      const list = await createMailingList(testUser1.id, 'User List')
      const order = await createOrder(testUser1.id, { status: 'processing' })
      
      // Admin should be able to access all user data
      const adminListAccess = await getMailingList(adminUser.id, list.id)
      expect(adminListAccess).not.toBeNull()
      
      const adminOrderAccess = await getOrder(adminUser.id, order.id)
      expect(adminOrderAccess).not.toBeNull()
    })
  })
})

// Helper functions for RLS testing
async function createTestUser(email, role) {
  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: 'testpassword123',
    email_confirm: true
  })
  
  await supabaseAdmin
    .from('user_profiles')
    .insert({
      user_id: user.id,
      email: email,
      company_name: 'Test Company'
    })
  
  if (role !== 'user') {
    await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: user.id,
        role_name: role,
        active: true,
        granted_by: user.id
      })
  }
  
  return user
}
```

## **3. Internal REST API Reference**

### **3.1 User Management and Profile APIs**

The user management system provides comprehensive account lifecycle management while maintaining the flexibility to support future team and enterprise features. These APIs handle everything from initial registration through account deletion, with appropriate security controls at each step.

**User Profile Management:**

The profile management APIs support both individual user accounts and business account configurations, preparing the platform for future B2B features while maintaining simplicity for current users.

```javascript
// Comprehensive user profile management API
// Location: /pages/api/users/profile.js
export default async function handler(req, res) {
  const { data: { session } } = await supabase.auth.getSession(req.headers.authorization)
  
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  switch (req.method) {
    case 'GET':
      return await getUserProfile(req, res, session.user.id)
    case 'PUT':
      return await updateUserProfile(req, res, session.user.id)
    case 'DELETE':
      return await deleteUserAccount(req, res, session.user.id)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function getUserProfile(req, res, userId) {
  try {
    // Retrieve comprehensive user profile with related settings
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_settings(*),
        user_roles(role_name, granted_at),
        team_memberships(
          team_id,
          teams(name, role)
        ),
        subscription_info(
          plan_name,
          status,
          current_period_end,
          usage_limits
        )
      `)
      .eq('user_id', userId)
      .single()

    if (profileError) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Calculate usage statistics for dashboard display
    const usageStats = await calculateUserUsageStats(userId)
    
    // Get recent activity for user dashboard
    const recentActivity = await getUserRecentActivity(userId, 10)

    res.json({
      success: true,
      profile: {
        ...profile,
        usageStats: usageStats,
        recentActivity: recentActivity,
        accountStatus: determineAccountStatus(profile)
      }
    })

  } catch (error) {
    console.error('Profile retrieval error:', error)
    res.status(500).json({ error: 'Failed to retrieve profile' })
  }
}

async function updateUserProfile(req, res, userId) {
  try {
    const { 
      companyName, 
      industry, 
      companySize, 
      timezone, 
      emailNotifications,
      smsNotifications,
      marketingEmails 
    } = req.body

    // Validate update data against business rules
    const validationResult = validateProfileUpdate({
      companyName,
      industry,
      companySize,
      timezone
    })

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid profile data',
        details: validationResult.errors
      })
    }

    // Start transaction for atomic updates across multiple tables
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        company_name: companyName,
        industry: industry,
        company_size: companySize,
        updated_at: new Date()
      })