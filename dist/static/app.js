// Task Manager Frontend Application
// ===================================

// ===================================
// Error Handling & Recovery System
// ===================================

/**
 * Error codes with user-friendly messages and recovery suggestions
 */
const ErrorCodes = {
  // Network errors
  NETWORK_OFFLINE: {
    code: 'NETWORK_OFFLINE',
    message: 'You appear to be offline',
    suggestion: 'Check your internet connection and try again.',
    recoverable: true,
    retryable: true
  },
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Request timed out',
    suggestion: 'The server took too long to respond. Please try again.',
    recoverable: true,
    retryable: true
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network error occurred',
    suggestion: 'Please check your connection and try again.',
    recoverable: true,
    retryable: true
  },
  
  // Server errors
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Server error occurred',
    suggestion: 'Our servers are having issues. Please try again later.',
    recoverable: true,
    retryable: true
  },
  SERVER_UNAVAILABLE: {
    code: 'SERVER_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    suggestion: 'Please try again in a few moments.',
    recoverable: true,
    retryable: true
  },
  SERVER_RATE_LIMITED: {
    code: 'SERVER_RATE_LIMITED',
    message: 'Too many requests',
    suggestion: 'Please slow down and try again in a moment.',
    recoverable: true,
    retryable: true
  },
  
  // Client errors
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    message: 'Invalid request',
    suggestion: 'Please check your input and try again.',
    recoverable: true,
    retryable: false
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    suggestion: 'The item you\'re looking for may have been deleted.',
    recoverable: true,
    retryable: false
  },
  CONFLICT: {
    code: 'CONFLICT',
    message: 'Data conflict detected',
    suggestion: 'Someone else may have modified this. Please refresh and try again.',
    recoverable: true,
    retryable: false
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    suggestion: 'Please check your input and correct any errors.',
    recoverable: true,
    retryable: false
  },
  
  // Auth errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    suggestion: 'Please sign in to continue.',
    recoverable: true,
    retryable: false
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    message: 'Access denied',
    suggestion: 'You don\'t have permission to perform this action.',
    recoverable: false,
    retryable: false
  },
  
  // Application errors
  SYNC_CONFLICT: {
    code: 'SYNC_CONFLICT',
    message: 'Sync conflict detected',
    suggestion: 'Your offline changes conflict with server data. Choose how to resolve.',
    recoverable: true,
    retryable: false
  },
  DATA_CORRUPTION: {
    code: 'DATA_CORRUPTION',
    message: 'Data integrity error',
    suggestion: 'There was an issue with the data. Try refreshing the page.',
    recoverable: true,
    retryable: false
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    suggestion: 'Please try again. If the problem persists, refresh the page.',
    recoverable: true,
    retryable: true
  }
};

/**
 * ErrorHandler - Centralized error handling with retry logic and recovery
 */
const ErrorHandler = {
  // Error log for debugging
  errorLog: [],
  maxLogSize: 50,
  
  // Retry configuration
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,      // 1 second
    maxDelay: 30000,      // 30 seconds
    backoffMultiplier: 2,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrorTypes: ['NETWORK_OFFLINE', 'NETWORK_TIMEOUT', 'NETWORK_ERROR', 'SERVER_ERROR', 'SERVER_UNAVAILABLE', 'SERVER_RATE_LIMITED']
  },
  
  // Active retry operations
  activeRetries: new Map(),
  
  // Error boundary state
  hasCriticalError: false,
  criticalError: null,
  
  /**
   * Classify an error and return the appropriate error code info
   * @param {Error|Response|object} error - The error to classify
   * @returns {object} - Error code information
   */
  classify: function(error) {
    // Check offline status first
    if (!navigator.onLine) {
      return ErrorCodes.NETWORK_OFFLINE;
    }
    
    // Handle fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return ErrorCodes.NETWORK_ERROR;
    }
    
    // Handle Response objects
    if (error instanceof Response || error.status) {
      const status = error.status;
      
      if (status === 400) return ErrorCodes.BAD_REQUEST;
      if (status === 401) return ErrorCodes.UNAUTHORIZED;
      if (status === 403) return ErrorCodes.FORBIDDEN;
      if (status === 404) return ErrorCodes.NOT_FOUND;
      if (status === 408) return ErrorCodes.NETWORK_TIMEOUT;
      if (status === 409) return ErrorCodes.CONFLICT;
      if (status === 422) return ErrorCodes.VALIDATION_ERROR;
      if (status === 429) return ErrorCodes.SERVER_RATE_LIMITED;
      if (status >= 500 && status < 600) {
        if (status === 503) return ErrorCodes.SERVER_UNAVAILABLE;
        return ErrorCodes.SERVER_ERROR;
      }
    }
    
    // Handle Error objects with custom codes
    if (error.code) {
      const errorCode = ErrorCodes[error.code];
      if (errorCode) return errorCode;
    }
    
    // Handle timeout errors
    if (error.name === 'AbortError' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      return ErrorCodes.NETWORK_TIMEOUT;
    }
    
    // Handle sync conflicts
    if (error.message && error.message.toLowerCase().includes('conflict')) {
      return ErrorCodes.SYNC_CONFLICT;
    }
    
    return ErrorCodes.UNKNOWN_ERROR;
  },
  
  /**
   * Create a user-friendly error message
   * @param {Error} error - The original error
   * @param {string} context - What the user was trying to do
   * @returns {object} - { title, message, suggestion, actions }
   */
  createUserMessage: function(error, context) {
    const errorInfo = this.classify(error);
    const contextMessages = {
      'load_board': 'loading the board',
      'save_task': 'saving the task',
      'delete_task': 'deleting the task',
      'move_task': 'moving the task',
      'create_task': 'creating the task',
      'update_task': 'updating the task',
      'create_project': 'creating the project',
      'delete_project': 'deleting the project',
      'sync': 'syncing your changes',
      'search': 'searching',
      'archive': 'archiving',
      'restore': 'restoring'
    };
    
    const contextText = contextMessages[context] || context || 'completing your request';
    
    return {
      title: errorInfo.message,
      message: `We encountered an issue while ${contextText}.`,
      suggestion: errorInfo.suggestion,
      recoverable: errorInfo.recoverable,
      retryable: errorInfo.retryable,
      errorCode: errorInfo.code
    };
  },
  
  /**
   * Log an error for debugging
   * @param {Error} error - The error
   * @param {string} context - Error context
   * @param {object} metadata - Additional metadata
   */
  log: function(error, context, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: context,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      metadata: metadata,
      userAgent: navigator.userAgent,
      online: navigator.onLine
    };
    
    this.errorLog.unshift(logEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Console log for debugging
    console.error('[ErrorHandler]', context, error, metadata);
  },
  
  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (0-based)
   * @param {number} baseDelay - Base delay in ms
   * @returns {number} - Delay in ms
   */
  calculateBackoff: function(attempt, baseDelay = this.retryConfig.baseDelay) {
    const delay = baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    // Add jitter (±20%) to prevent thundering herd
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  },
  
  /**
   * Check if an error is retryable
   * @param {Error} error - The error
   * @returns {boolean}
   */
  isRetryable: function(error) {
    const errorInfo = this.classify(error);
    return errorInfo.retryable && this.retryConfig.retryableErrorTypes.includes(errorInfo.code);
  },
  
  /**
   * Execute a function with automatic retry
   * @param {Function} fn - Async function to execute
   * @param {object} options - { context, maxRetries, onRetry }
   * @returns {Promise} - Result of the function
   */
  withRetry: async function(fn, options = {}) {
    const {
      context = 'operation',
      maxRetries = this.retryConfig.maxRetries,
      onRetry = null,
      retryId = null
    } = options;
    
    let lastError = null;
    let attempt = 0;
    
    // Track this retry operation
    const operationId = retryId || `${context}_${Date.now()}`;
    this.activeRetries.set(operationId, { attempt: 0, cancelled: false });
    
    try {
      while (attempt <= maxRetries) {
        const retryState = this.activeRetries.get(operationId);
        if (retryState?.cancelled) {
          throw new Error('Operation cancelled');
        }
        
        try {
          const result = await fn();
          // Success - clean up and return
          this.activeRetries.delete(operationId);
          return result;
        } catch (error) {
          lastError = error;
          this.log(error, context, { attempt, maxRetries });
          
          // Check if we should retry
          if (attempt < maxRetries && this.isRetryable(error)) {
            const delay = this.calculateBackoff(attempt);
            
            // Update retry state
            this.activeRetries.set(operationId, { attempt: attempt + 1, cancelled: false });
            
            // Notify about retry
            if (onRetry) {
              onRetry(attempt + 1, maxRetries, delay);
            } else {
              // Default retry notification
              showToast(
                `Retrying... (${attempt + 1}/${maxRetries})`,
                'warning'
              );
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
          } else {
            // Not retryable or max retries reached
            break;
          }
        }
      }
      
      // All retries exhausted
      this.activeRetries.delete(operationId);
      throw lastError;
    } catch (error) {
      this.activeRetries.delete(operationId);
      throw error;
    }
  },
  
  /**
   * Cancel a retry operation
   * @param {string} operationId - Operation ID to cancel
   */
  cancelRetry: function(operationId) {
    const retryState = this.activeRetries.get(operationId);
    if (retryState) {
      retryState.cancelled = true;
      this.activeRetries.set(operationId, retryState);
    }
  },
  
  /**
   * Cancel all active retries
   */
  cancelAllRetries: function() {
    for (const [id, state] of this.activeRetries) {
      state.cancelled = true;
      this.activeRetries.set(id, state);
    }
  },
  
  /**
   * Handle error with user notification and optional recovery actions
   * @param {Error} error - The error
   * @param {string} context - What was being done
   * @param {object} options - { silent, showRecovery, onDismiss }
   */
  handle: function(error, context, options = {}) {
    const {
      silent = false,
      showRecovery = true,
      onDismiss = null
    } = options;
    
    const userMessage = this.createUserMessage(error, context);
    this.log(error, context);
    
    if (silent) return userMessage;
    
    if (userMessage.recoverable && showRecovery) {
      // Show recovery UI for recoverable errors
      this.showRecoveryToast(userMessage, context, onDismiss);
    } else {
      // Simple toast for non-recoverable errors
      showToast(userMessage.title, 'error');
    }
    
    return userMessage;
  },
  
  /**
   * Show a toast with recovery options
   */
  showRecoveryToast: function(userMessage, context, onDismiss) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-[400px]';
    
    const toastId = 'toast_' + Date.now();
    toast.id = toastId;
    
    let actionsHtml = '';
    
    if (userMessage.retryable) {
      actionsHtml += `
        <button onclick="ErrorHandler.retryLastAction('${context}', '${toastId}')" class="toast-action-btn px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors">
          <i class="fas fa-redo mr-1"></i>Retry
        </button>
      `;
    }
    
    if (context === 'load_board' || context === 'sync') {
      actionsHtml += `
        <button onclick="location.reload()" class="toast-action-btn px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors">
          <i class="fas fa-sync mr-1"></i>Refresh
        </button>
      `;
    }
    
    toast.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex items-start gap-2">
          <i class="fas fa-exclamation-circle mt-0.5"></i>
          <div class="flex-1">
            <div class="font-medium">${escapeHtml(userMessage.title)}</div>
            <div class="text-xs opacity-90 mt-1">${escapeHtml(userMessage.suggestion)}</div>
          </div>
          <button onclick="this.closest('.toast').remove()" class="opacity-70 hover:opacity-100">
            <i class="fas fa-times"></i>
          </button>
        </div>
        ${actionsHtml ? `<div class="flex gap-2 ml-6">${actionsHtml}</div>` : ''}
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-dismiss after 8 seconds for recoverable errors
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
          toast.remove();
          if (onDismiss) onDismiss();
        }, 300);
      }
    }, 8000);
  },
  
  /**
   * Store the last action for retry
   */
  lastAction: null,
  
  /**
   * Register an action that can be retried
   * @param {string} context - Action context
   * @param {Function} fn - Function to retry
   */
  registerRetryableAction: function(context, fn) {
    this.lastAction = { context, fn, timestamp: Date.now() };
  },
  
  /**
   * Retry the last registered action
   */
  retryLastAction: async function(context, toastId) {
    const toast = document.getElementById(toastId);
    if (toast) toast.remove();
    
    if (this.lastAction && this.lastAction.context === context) {
      const timeSinceAction = Date.now() - this.lastAction.timestamp;
      // Only retry if action was registered within last 5 minutes
      if (timeSinceAction < 300000) {
        showToast('Retrying...', 'info');
        try {
          await this.lastAction.fn();
          showToast('Success!', 'success');
        } catch (error) {
          this.handle(error, context);
        }
      } else {
        showToast('Please try the action again', 'info');
      }
    } else {
      // Reload the board as a fallback
      try {
        await loadBoard();
        showToast('Refreshed successfully', 'success');
      } catch (error) {
        this.handle(error, 'load_board');
      }
    }
  },
  
  /**
   * Set critical error state and show error boundary
   * @param {Error} error - The critical error
   */
  setCriticalError: function(error) {
    this.hasCriticalError = true;
    this.criticalError = error;
    this.log(error, 'critical');
    this.showErrorBoundary(error);
  },
  
  /**
   * Clear critical error state
   */
  clearCriticalError: function() {
    this.hasCriticalError = false;
    this.criticalError = null;
    this.hideErrorBoundary();
  },
  
  /**
   * Show the error boundary UI
   */
  showErrorBoundary: function(error) {
    let boundary = document.getElementById('error-boundary');
    
    if (!boundary) {
      boundary = document.createElement('div');
      boundary.id = 'error-boundary';
      document.body.appendChild(boundary);
    }
    
    const userMessage = this.createUserMessage(error, 'application');
    const errorId = `ERR_${Date.now().toString(36).toUpperCase()}`;
    
    boundary.innerHTML = `
      <div class="error-boundary-overlay">
        <div class="error-boundary-content">
          <div class="error-boundary-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2 class="error-boundary-title">Something went wrong</h2>
          <p class="error-boundary-message">${escapeHtml(userMessage.message)}</p>
          <p class="error-boundary-suggestion">${escapeHtml(userMessage.suggestion)}</p>
          <div class="error-boundary-actions">
            <button onclick="ErrorHandler.attemptRecovery()" class="error-boundary-btn primary">
              <i class="fas fa-redo mr-2"></i>Try Again
            </button>
            <button onclick="location.reload()" class="error-boundary-btn secondary">
              <i class="fas fa-sync mr-2"></i>Refresh Page
            </button>
          </div>
          <details class="error-boundary-details">
            <summary>Technical Details</summary>
            <div class="error-boundary-tech">
              <p><strong>Error ID:</strong> ${errorId}</p>
              <p><strong>Code:</strong> ${userMessage.errorCode}</p>
              <p><strong>Message:</strong> ${escapeHtml(error.message || 'Unknown error')}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Online:</strong> ${navigator.onLine ? 'Yes' : 'No'}</p>
            </div>
          </details>
        </div>
      </div>
    `;
    
    boundary.style.display = 'block';
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * Hide the error boundary UI
   */
  hideErrorBoundary: function() {
    const boundary = document.getElementById('error-boundary');
    if (boundary) {
      boundary.style.display = 'none';
    }
    document.body.style.overflow = '';
  },
  
  /**
   * Attempt to recover from critical error
   */
  attemptRecovery: async function() {
    this.hideErrorBoundary();
    showLoading(true);
    
    try {
      // Clear caches
      await CacheManager.invalidate();
      
      // Reload the board
      await loadBoard();
      
      this.clearCriticalError();
      showToast('Recovered successfully!', 'success');
    } catch (error) {
      showLoading(false);
      this.setCriticalError(error);
    }
  },
  
  /**
   * Get error log for debugging
   */
  getErrorLog: function() {
    return this.errorLog;
  },
  
  /**
   * Export error log for support
   */
  exportErrorLog: function() {
    const data = {
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errors: this.errorLog
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-error-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

/**
 * SyncConflictResolver - Handles sync conflicts between offline changes and server state
 */
const SyncConflictResolver = {
  // Pending conflicts awaiting resolution
  pendingConflicts: [],
  
  /**
   * Detect if there's a conflict between local and server data
   * @param {object} localData - Local/offline version
   * @param {object} serverData - Server version
   * @returns {boolean}
   */
  hasConflict: function(localData, serverData) {
    if (!localData || !serverData) return false;
    
    // Compare timestamps
    const localTime = new Date(localData.updated_at || 0).getTime();
    const serverTime = new Date(serverData.updated_at || 0).getTime();
    
    // Conflict if server is newer and data differs
    if (serverTime > localTime) {
      return this.dataHasChanges(localData, serverData);
    }
    
    return false;
  },
  
  /**
   * Check if two data objects have meaningful differences
   */
  dataHasChanges: function(a, b) {
    const keysToCompare = ['title', 'description', 'priority', 'due_date', 'column_id', 'position', 'tags'];
    
    for (const key of keysToCompare) {
      if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        return true;
      }
    }
    
    return false;
  },
  
  /**
   * Add a conflict to the queue
   * @param {object} conflict - { type, localData, serverData, operation }
   */
  addConflict: function(conflict) {
    conflict.id = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    conflict.createdAt = new Date().toISOString();
    this.pendingConflicts.push(conflict);
    
    // Show conflict notification
    this.showConflictNotification(conflict);
  },
  
  /**
   * Show a notification about the conflict
   */
  showConflictNotification: function(conflict) {
    showToast(
      `Sync conflict detected. Your changes may differ from the server.`,
      'warning'
    );
    
    // Update badge if exists
    this.updateConflictBadge();
  },
  
  /**
   * Update UI badge showing conflict count
   */
  updateConflictBadge: function() {
    const count = this.pendingConflicts.length;
    // Could add a badge to the header if needed
  },
  
  /**
   * Show conflict resolution modal
   * @param {object} conflict - The conflict to resolve
   */
  showResolutionModal: function(conflict) {
    const modal = document.createElement('div');
    modal.className = 'conflict-resolution-modal';
    modal.id = 'conflict-resolution-modal';
    
    const localDate = new Date(conflict.localData?.updated_at).toLocaleString();
    const serverDate = new Date(conflict.serverData?.updated_at).toLocaleString();
    
    modal.innerHTML = `
      <div class="conflict-modal-backdrop" onclick="SyncConflictResolver.closeResolutionModal()"></div>
      <div class="conflict-modal-content">
        <h3 class="conflict-modal-title">
          <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
          Sync Conflict Detected
        </h3>
        <p class="conflict-modal-desc">
          Your offline changes conflict with updates made on another device or session.
          Choose which version to keep:
        </p>
        
        <div class="conflict-versions">
          <div class="conflict-version local" onclick="SyncConflictResolver.resolveConflict('${conflict.id}', 'local')">
            <div class="conflict-version-header">
              <i class="fas fa-laptop"></i>
              <span>Your Version</span>
            </div>
            <div class="conflict-version-time">Modified: ${localDate}</div>
            <div class="conflict-version-preview">
              ${this.renderDataPreview(conflict.localData)}
            </div>
            <button class="conflict-version-btn">Keep My Changes</button>
          </div>
          
          <div class="conflict-version-divider">
            <span>OR</span>
          </div>
          
          <div class="conflict-version server" onclick="SyncConflictResolver.resolveConflict('${conflict.id}', 'server')">
            <div class="conflict-version-header">
              <i class="fas fa-cloud"></i>
              <span>Server Version</span>
            </div>
            <div class="conflict-version-time">Modified: ${serverDate}</div>
            <div class="conflict-version-preview">
              ${this.renderDataPreview(conflict.serverData)}
            </div>
            <button class="conflict-version-btn">Use Server Version</button>
          </div>
        </div>
        
        <div class="conflict-modal-actions">
          <button onclick="SyncConflictResolver.resolveConflict('${conflict.id}', 'merge')" class="conflict-merge-btn">
            <i class="fas fa-code-merge mr-1"></i> Merge Both (Advanced)
          </button>
          <button onclick="SyncConflictResolver.closeResolutionModal()" class="conflict-cancel-btn">
            Decide Later
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  /**
   * Render a preview of the data for conflict comparison
   */
  renderDataPreview: function(data) {
    if (!data) return '<em>No data</em>';
    
    let preview = '';
    if (data.title) preview += `<div class="preview-field"><strong>Title:</strong> ${escapeHtml(data.title)}</div>`;
    if (data.priority) preview += `<div class="preview-field"><strong>Priority:</strong> ${data.priority}</div>`;
    if (data.due_date) preview += `<div class="preview-field"><strong>Due:</strong> ${new Date(data.due_date).toLocaleDateString()}</div>`;
    
    return preview || '<em>No changes</em>';
  },
  
  /**
   * Resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - 'local', 'server', or 'merge'
   */
  resolveConflict: async function(conflictId, resolution) {
    const conflict = this.pendingConflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    this.closeResolutionModal();
    showLoading(true);
    
    try {
      let resolvedData;
      
      switch (resolution) {
        case 'local':
          // Push local changes to server
          resolvedData = conflict.localData;
          await api(conflict.operation.url, {
            method: conflict.operation.method,
            body: JSON.stringify(resolvedData)
          });
          break;
          
        case 'server':
          // Accept server version (just refresh)
          resolvedData = conflict.serverData;
          break;
          
        case 'merge':
          // Merge local and server (server base + local changes)
          resolvedData = this.mergeData(conflict.serverData, conflict.localData);
          await api(conflict.operation.url, {
            method: conflict.operation.method,
            body: JSON.stringify(resolvedData)
          });
          break;
      }
      
      // Remove from pending
      this.pendingConflicts = this.pendingConflicts.filter(c => c.id !== conflictId);
      this.updateConflictBadge();
      
      // Reload to get fresh state
      await loadBoard();
      
      showToast('Conflict resolved successfully', 'success');
    } catch (error) {
      showLoading(false);
      ErrorHandler.handle(error, 'sync');
    }
  },
  
  /**
   * Merge local and server data (local takes priority for changed fields)
   */
  mergeData: function(serverData, localData) {
    const merged = { ...serverData };
    
    // Overwrite with local values for fields that were changed locally
    const localChanges = ['title', 'description', 'priority', 'due_date', 'tags', 'position'];
    for (const key of localChanges) {
      if (localData[key] !== undefined) {
        merged[key] = localData[key];
      }
    }
    
    return merged;
  },
  
  /**
   * Close the resolution modal
   */
  closeResolutionModal: function() {
    const modal = document.getElementById('conflict-resolution-modal');
    if (modal) {
      modal.remove();
    }
  },
  
  /**
   * Get count of pending conflicts
   */
  getConflictCount: function() {
    return this.pendingConflicts.length;
  },
  
  /**
   * Show all pending conflicts
   */
  showAllConflicts: function() {
    if (this.pendingConflicts.length === 0) {
      showToast('No sync conflicts', 'info');
      return;
    }
    
    // Show the first conflict
    this.showResolutionModal(this.pendingConflicts[0]);
  }
};

// State
const state = {
  currentView: 'board',
  currentBoardId: null,
  board: null,
  boards: [], // All projects/boards
  columns: [],
  tasks: [],
  trash: { boards: [], columns: [], tasks: [] },
  theme: 'system',
  isOnline: navigator.onLine,
  pendingOperations: [],
  draggedElement: null,
  dragType: null,
  dragSourceId: null,
  selectedTaskId: null,
  projectSwitcherOpen: false,
  bulkSelectionMode: false,
  selectedTaskIds: new Set(),
  lastSelectedTaskId: null,
  focusedTaskId: null, // For keyboard navigation
  modalFocusTrap: null, // Focus trap keydown handler for modals
  modalFocusTrapClick: null, // Focus trap click handler for modals
  previousActiveElement: null, // Element that had focus before modal opened
  // Calendar state
  calendarView: 'month', // 'month' or 'week'
  calendarDate: new Date(), // Current date being viewed
  calendarDraggedTaskId: null, // Task being dragged in calendar
  // Performance optimization state
  taskDetailsCache: new Map(), // Cache for lazy-loaded task details
  virtualScrollState: new Map() // Virtual scroll state per column
};

// ===================================
// Performance Optimization System
// ===================================

/**
 * RequestBatcher - Batches multiple API requests into single calls
 * Reduces network overhead and improves perceived performance
 */
const RequestBatcher = {
  queue: [],
  timeout: null,
  batchDelay: 50, // ms to wait before executing batch
  maxBatchSize: 10,
  
  /**
   * Add a request to the batch queue
   * @param {string} url - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise} - Resolves with response data
   */
  add: function(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      
      // If batch is full, execute immediately
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
        return;
      }
      
      // Otherwise, schedule batch execution
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  },
  
  /**
   * Execute all queued requests
   * Groups GET requests where possible, executes others individually
   */
  flush: async function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.maxBatchSize);
    
    // Group GET requests that can be batched (same base endpoint)
    const getRequests = batch.filter(r => !r.options.method || r.options.method === 'GET');
    const otherRequests = batch.filter(r => r.options.method && r.options.method !== 'GET');
    
    // Execute non-GET requests in parallel
    const otherPromises = otherRequests.map(req => 
      this.executeRequest(req.url, req.options)
        .then(data => req.resolve(data))
        .catch(err => req.reject(err))
    );
    
    // Execute GET requests in parallel
    const getPromises = getRequests.map(req => 
      this.executeRequest(req.url, req.options)
        .then(data => req.resolve(data))
        .catch(err => req.reject(err))
    );
    
    await Promise.allSettled([...otherPromises, ...getPromises]);
    
    // Process remaining items in queue
    if (this.queue.length > 0) {
      this.flush();
    }
  },
  
  /**
   * Execute a single request
   */
  executeRequest: async function(url, options) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'API Error');
    }
    
    return data.data;
  },
  
  /**
   * Cancel all pending requests
   */
  clear: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue.forEach(req => req.reject(new Error('Request cancelled')));
    this.queue = [];
  }
};

/**
 * CacheManager - Enhanced IndexedDB caching with TTL and invalidation
 */
const CacheManager = {
  DB_NAME: 'taskflow-cache-v2',
  DB_VERSION: 2,
  db: null,
  
  // Cache TTL values in milliseconds
  TTL: {
    boards: 5 * 60 * 1000, // 5 minutes
    tasks: 2 * 60 * 1000,  // 2 minutes
    taskDetails: 5 * 60 * 1000, // 5 minutes
    search: 30 * 1000 // 30 seconds
  },
  
  /**
   * Initialize the cache database
   */
  init: async function() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => {
        console.warn('CacheManager: Failed to open database', request.error);
        resolve(); // Don't fail the app if cache fails
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.cleanExpired(); // Clean up expired entries on init
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expires', 'expires');
          store.createIndex('type', 'type');
        }
        
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }
      };
    });
  },
  
  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} - Cached data or null if not found/expired
   */
  get: async function(key) {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const request = store.get(key);
        
        request.onerror = () => resolve(null);
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          // Check if expired
          if (result.expires && Date.now() > result.expires) {
            this.delete(key); // Clean up expired entry
            resolve(null);
            return;
          }
          
          resolve(result.data);
        };
      } catch (e) {
        console.warn('CacheManager.get error:', e);
        resolve(null);
      }
    });
  },
  
  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} type - Cache type (boards, tasks, etc.)
   * @param {number} ttl - Optional custom TTL
   */
  set: async function(key, data, type = 'general', ttl = null) {
    if (!this.db) return;
    
    const expires = Date.now() + (ttl || this.TTL[type] || 60000);
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.put({
          key,
          data,
          type,
          expires,
          timestamp: Date.now()
        });
        
        request.onerror = () => resolve(false);
        request.onsuccess = () => resolve(true);
      } catch (e) {
        console.warn('CacheManager.set error:', e);
        resolve(false);
      }
    });
  },
  
  /**
   * Delete item from cache
   */
  delete: async function(key) {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        store.delete(key);
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  },
  
  /**
   * Invalidate cache by type or pattern
   * @param {string} type - Cache type to invalidate
   * @param {string} pattern - Optional key pattern to match
   */
  invalidate: async function(type = null, pattern = null) {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        if (type) {
          const index = store.index('type');
          const request = index.openCursor(IDBKeyRange.only(type));
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              if (!pattern || cursor.value.key.includes(pattern)) {
                cursor.delete();
              }
              cursor.continue();
            } else {
              resolve(true);
            }
          };
        } else if (pattern) {
          const request = store.openCursor();
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              if (cursor.value.key.includes(pattern)) {
                cursor.delete();
              }
              cursor.continue();
            } else {
              resolve(true);
            }
          };
        } else {
          store.clear();
          resolve(true);
        }
      } catch (e) {
        console.warn('CacheManager.invalidate error:', e);
        resolve(false);
      }
    });
  },
  
  /**
   * Clean up expired entries
   */
  cleanExpired: async function() {
    if (!this.db) return;
    
    const now = Date.now();
    
    try {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expires');
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (e) {
      console.warn('CacheManager.cleanExpired error:', e);
    }
  },
  
  /**
   * Add operation to pending sync queue (for offline support)
   */
  addPendingSync: async function(operation) {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        store.add({
          ...operation,
          timestamp: Date.now()
        });
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  },
  
  /**
   * Get all pending sync operations
   */
  getPendingSync: async function() {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['pendingSync'], 'readonly');
        const store = transaction.objectStore('pendingSync');
        const request = store.getAll();
        
        request.onerror = () => resolve([]);
        request.onsuccess = () => resolve(request.result || []);
      } catch (e) {
        resolve([]);
      }
    });
  },
  
  /**
   * Clear pending sync operations
   */
  clearPendingSync: async function(ids = null) {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction(['pendingSync'], 'readwrite');
        const store = transaction.objectStore('pendingSync');
        
        if (ids && ids.length) {
          ids.forEach(id => store.delete(id));
        } else {
          store.clear();
        }
        resolve(true);
      } catch (e) {
        resolve(false);
      }
    });
  }
};

/**
 * VirtualScroller - Renders only visible items for performance
 */
const VirtualScroller = {
  // Configuration
  config: {
    itemHeight: 80, // Estimated height of each task card
    overscan: 3, // Number of items to render above/below viewport
    threshold: 50 // Number of tasks before enabling virtual scrolling
  },
  
  // State per container
  instances: new Map(),
  
  /**
   * Initialize virtual scrolling for a container
   * @param {string} columnId - Column ID
   * @param {HTMLElement} container - Scroll container element
   * @param {Array} items - Array of items to render
   * @param {Function} renderItem - Function to render each item
   */
  init: function(columnId, container, items, renderItem) {
    // Only use virtual scrolling for large lists
    if (items.length < this.config.threshold) {
      return false;
    }
    
    const instance = {
      columnId,
      container,
      items,
      renderItem,
      scrollTop: 0,
      containerHeight: container.clientHeight || 400,
      renderedRange: { start: 0, end: 0 }
    };
    
    this.instances.set(columnId, instance);
    
    // Set up scroll listener with throttling
    let scrollTimeout = null;
    container.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        this.handleScroll(columnId);
      }, 16); // ~60fps
    }, { passive: true });
    
    // Initial render
    this.render(columnId);
    
    return true;
  },
  
  /**
   * Handle scroll event
   */
  handleScroll: function(columnId) {
    const instance = this.instances.get(columnId);
    if (!instance) return;
    
    instance.scrollTop = instance.container.scrollTop;
    this.render(columnId);
  },
  
  /**
   * Calculate visible range
   */
  getVisibleRange: function(instance) {
    const { scrollTop, containerHeight, items } = instance;
    const { itemHeight, overscan } = this.config;
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + (overscan * 2);
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    
    return { start: startIndex, end: endIndex };
  },
  
  /**
   * Render visible items
   */
  render: function(columnId) {
    const instance = this.instances.get(columnId);
    if (!instance) return;
    
    const { start, end } = this.getVisibleRange(instance);
    const { items, renderItem, container } = instance;
    const { itemHeight } = this.config;
    
    // Check if we need to re-render
    if (start === instance.renderedRange.start && end === instance.renderedRange.end) {
      return;
    }
    
    instance.renderedRange = { start, end };
    
    // Create wrapper with total height for proper scrollbar
    const totalHeight = items.length * itemHeight;
    
    let html = `<div class="virtual-scroll-spacer" style="height: ${start * itemHeight}px;"></div>`;
    
    // Render visible items
    for (let i = start; i < end; i++) {
      html += renderItem(items[i], i);
    }
    
    // Add bottom spacer
    const bottomSpacerHeight = Math.max(0, (items.length - end) * itemHeight);
    html += `<div class="virtual-scroll-spacer" style="height: ${bottomSpacerHeight}px;"></div>`;
    
    container.innerHTML = html;
    
    // Re-attach event listeners for rendered items
    this.attachItemListeners(columnId);
  },
  
  /**
   * Attach event listeners to rendered items
   */
  attachItemListeners: function(columnId) {
    const instance = this.instances.get(columnId);
    if (!instance) return;
    
    const { container } = instance;
    
    // Task cards
    container.querySelectorAll('.task-card').forEach(card => {
      const taskId = card.getAttribute('data-task-id');
      if (!taskId) return;
      
      card.addEventListener('dragstart', handleTaskDragStart);
      card.addEventListener('dragend', handleTaskDragEnd);
      card.addEventListener('click', (e) => {
        if (!e.defaultPrevented && !e.target.closest('.bulk-select-checkbox')) {
          focusTask(taskId);
          openTaskModal(taskId);
        }
      });
      card.addEventListener('focus', () => focusTask(taskId));
    });
  },
  
  /**
   * Update items for a column
   */
  updateItems: function(columnId, items) {
    const instance = this.instances.get(columnId);
    if (!instance) return false;
    
    instance.items = items;
    instance.renderedRange = { start: 0, end: 0 }; // Force re-render
    this.render(columnId);
    return true;
  },
  
  /**
   * Destroy virtual scroller for a column
   */
  destroy: function(columnId) {
    this.instances.delete(columnId);
  },
  
  /**
   * Check if column is using virtual scrolling
   */
  isActive: function(columnId) {
    return this.instances.has(columnId);
  },
  
  /**
   * Scroll to specific item
   */
  scrollToItem: function(columnId, itemIndex) {
    const instance = this.instances.get(columnId);
    if (!instance) return;
    
    const scrollTop = itemIndex * this.config.itemHeight;
    instance.container.scrollTop = scrollTop;
    this.handleScroll(columnId);
  }
};

/**
 * OptimisticUI - Manages optimistic updates with rollback
 */
const OptimisticUI = {
  // Store original state for rollback
  snapshots: new Map(),
  
  /**
   * Create a snapshot before making changes
   * @param {string} key - Unique key for this operation
   * @returns {object} - Snapshot of current state
   */
  snapshot: function(key) {
    const snap = {
      tasks: JSON.parse(JSON.stringify(state.tasks)),
      columns: JSON.parse(JSON.stringify(state.columns)),
      timestamp: Date.now()
    };
    this.snapshots.set(key, snap);
    return snap;
  },
  
  /**
   * Commit changes (discard snapshot)
   */
  commit: function(key) {
    this.snapshots.delete(key);
    
    // Clean old snapshots (older than 5 minutes)
    const cutoff = Date.now() - 5 * 60 * 1000;
    for (const [k, v] of this.snapshots) {
      if (v.timestamp < cutoff) {
        this.snapshots.delete(k);
      }
    }
  },
  
  /**
   * Rollback to snapshot state
   */
  rollback: function(key) {
    const snap = this.snapshots.get(key);
    if (!snap) {
      console.warn('OptimisticUI: No snapshot found for key:', key);
      return false;
    }
    
    state.tasks = snap.tasks;
    state.columns = snap.columns;
    this.snapshots.delete(key);
    
    // Re-render views
    renderBoard();
    renderList();
    if (state.currentView === 'calendar') {
      renderCalendar();
    }
    
    return true;
  },
  
  /**
   * Apply optimistic task update
   */
  updateTask: function(taskId, updates) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;
    
    const oldTask = { ...state.tasks[taskIndex] };
    state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates };
    
    return oldTask;
  },
  
  /**
   * Apply optimistic task creation
   */
  createTask: function(tempId, taskData) {
    const newTask = {
      id: tempId,
      ...taskData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: [],
      _isOptimistic: true
    };
    state.tasks.push(newTask);
    return newTask;
  },
  
  /**
   * Replace temporary task with real task
   */
  replaceTask: function(tempId, realTask) {
    const index = state.tasks.findIndex(t => t.id === tempId);
    if (index !== -1) {
      state.tasks[index] = { ...realTask, _isOptimistic: false };
    }
  },
  
  /**
   * Remove optimistic task (on error)
   */
  removeOptimisticTask: function(tempId) {
    const index = state.tasks.findIndex(t => t.id === tempId);
    if (index !== -1) {
      state.tasks.splice(index, 1);
    }
  }
};

/**
 * LazyLoader - Handles lazy loading of task details
 */
const LazyLoader = {
  // In-flight requests to prevent duplicates
  inFlight: new Map(),
  
  /**
   * Load full task details
   * @param {string} taskId - Task ID
   * @param {boolean} forceRefresh - Skip cache
   * @returns {Promise<object>} - Full task details
   */
  loadTaskDetails: async function(taskId, forceRefresh = false) {
    // Check in-memory state first
    const existingTask = state.tasks.find(t => t.id === taskId);
    
    // If we have full details already (including subtasks loaded), return
    if (existingTask && existingTask._detailsLoaded && !forceRefresh) {
      return existingTask;
    }
    
    // Check cache
    if (!forceRefresh) {
      const cached = await CacheManager.get(`task_details_${taskId}`);
      if (cached) {
        this.mergeTaskDetails(taskId, cached);
        return cached;
      }
    }
    
    // Check if request is already in flight
    if (this.inFlight.has(taskId)) {
      return this.inFlight.get(taskId);
    }
    
    // Make API request
    const promise = api(`/api/tasks/${taskId}`)
      .then(async (data) => {
        this.inFlight.delete(taskId);
        
        // Cache the result
        await CacheManager.set(`task_details_${taskId}`, data, 'taskDetails');
        
        // Merge into state
        this.mergeTaskDetails(taskId, data);
        
        return data;
      })
      .catch((err) => {
        this.inFlight.delete(taskId);
        throw err;
      });
    
    this.inFlight.set(taskId, promise);
    return promise;
  },
  
  /**
   * Merge loaded details into state
   */
  mergeTaskDetails: function(taskId, details) {
    const index = state.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      state.tasks[index] = {
        ...state.tasks[index],
        ...details,
        _detailsLoaded: true
      };
    }
    
    // Also update the details cache in state
    state.taskDetailsCache.set(taskId, details);
  },
  
  /**
   * Preload task details for visible tasks (background)
   */
  preloadVisible: function(taskIds) {
    // Limit preloading to avoid overwhelming
    const toPreload = taskIds.slice(0, 10);
    
    toPreload.forEach(taskId => {
      // Use requestIdleCallback for background loading
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.loadTaskDetails(taskId).catch(() => {});
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          this.loadTaskDetails(taskId).catch(() => {});
        }, 100);
      }
    });
  },
  
  /**
   * Invalidate cached details for a task
   */
  invalidate: async function(taskId) {
    state.taskDetailsCache.delete(taskId);
    await CacheManager.delete(`task_details_${taskId}`);
    
    // Mark task as needing reload
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task._detailsLoaded = false;
    }
  }
};

/**
 * Debounce utility for performance
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle utility for performance
 */
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate temporary ID for optimistic updates
 */
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===================================
// Undo/Redo System
// ===================================

const UndoManager = {
  undoStack: [],
  redoStack: [],
  maxStackSize: 20,
  isUndoRedoAction: false, // Flag to prevent tracking undo/redo actions
  
  // Initialize from localStorage
  init: function() {
    try {
      const saved = localStorage.getItem('taskflow_undo_stack');
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if from same board and recent (within 1 hour)
        if (data.boardId === state.currentBoardId && 
            Date.now() - data.timestamp < 3600000) {
          this.undoStack = data.undoStack || [];
          this.redoStack = data.redoStack || [];
        }
      }
    } catch (e) {
      console.warn('Failed to restore undo stack:', e);
    }
    this.updateUI();
  },
  
  // Save to localStorage
  save: function() {
    try {
      localStorage.setItem('taskflow_undo_stack', JSON.stringify({
        boardId: state.currentBoardId,
        timestamp: Date.now(),
        undoStack: this.undoStack.slice(-this.maxStackSize),
        redoStack: this.redoStack.slice(-this.maxStackSize)
      }));
    } catch (e) {
      console.warn('Failed to save undo stack:', e);
    }
  },
  
  // Push an undoable action
  push: function(action) {
    if (this.isUndoRedoAction) return;
    
    this.undoStack.push({
      ...action,
      timestamp: Date.now()
    });
    
    // Trim stack if too large
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
    
    this.save();
    this.updateUI();
  },
  
  // Undo the last action
  undo: async function() {
    if (this.undoStack.length === 0) {
      showToast('Nothing to undo', 'info');
      return;
    }
    
    const action = this.undoStack.pop();
    this.isUndoRedoAction = true;
    
    try {
      await this.executeUndo(action);
      this.redoStack.push(action);
      this.save();
      this.updateUI();
      showToast('Undone: ' + action.description, 'success');
    } catch (error) {
      console.error('Undo failed:', error);
      // Put action back on stack
      this.undoStack.push(action);
      showToast('Failed to undo', 'error');
    } finally {
      this.isUndoRedoAction = false;
    }
  },
  
  // Redo the last undone action
  redo: async function() {
    if (this.redoStack.length === 0) {
      showToast('Nothing to redo', 'info');
      return;
    }
    
    const action = this.redoStack.pop();
    this.isUndoRedoAction = true;
    
    try {
      await this.executeRedo(action);
      this.undoStack.push(action);
      this.save();
      this.updateUI();
      showToast('Redone: ' + action.description, 'success');
    } catch (error) {
      console.error('Redo failed:', error);
      // Put action back on stack
      this.redoStack.push(action);
      showToast('Failed to redo', 'error');
    } finally {
      this.isUndoRedoAction = false;
    }
  },
  
  // Execute undo based on action type
  executeUndo: async function(action) {
    switch (action.type) {
      case 'task_create':
        // Delete the created task (soft delete)
        await api('/api/tasks/' + action.taskId, { method: 'DELETE' });
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'task_update':
        // Restore previous state
        await api('/api/tasks/' + action.taskId, {
          method: 'PATCH',
          body: JSON.stringify(action.previousState)
        });
        await loadBoard();
        break;
        
      case 'task_delete':
        // Restore from trash
        await api('/api/trash/task/' + action.taskId + '/restore', { method: 'POST' });
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'task_archive':
        // Unarchive task
        await api('/api/tasks/' + action.taskId + '/unarchive', { method: 'POST' });
        await loadBoard();
        updateArchiveCount();
        break;
        
      case 'task_move':
        // Move back to original column and position
        await api('/api/tasks/' + action.taskId, {
          method: 'PATCH',
          body: JSON.stringify({
            column_id: action.previousColumnId,
            position: action.previousPosition
          })
        });
        await loadBoard();
        break;
        
      case 'column_create':
        // Delete the created column
        await api('/api/columns/' + action.columnId, { method: 'DELETE' });
        await loadBoard();
        break;
        
      case 'column_update':
        // Restore previous state
        await api('/api/columns/' + action.columnId, {
          method: 'PATCH',
          body: JSON.stringify(action.previousState)
        });
        await loadBoard();
        break;
        
      case 'column_delete':
        // Restore from trash
        await api('/api/trash/column/' + action.columnId + '/restore', { method: 'POST' });
        await loadBoard();
        break;
        
      case 'column_move':
        // Move back to original position
        await api('/api/columns/' + action.columnId, {
          method: 'PATCH',
          body: JSON.stringify({ position: action.previousPosition })
        });
        await loadBoard();
        break;
        
      case 'subtask_create':
        // Delete the created subtask
        await api('/api/subtasks/' + action.subtaskId, { method: 'DELETE' });
        await loadBoard();
        break;
        
      case 'subtask_delete':
        // Recreate the subtask
        await api('/api/tasks/' + action.taskId + '/subtasks', {
          method: 'POST',
          body: JSON.stringify({ 
            title: action.previousState.title,
            is_completed: action.previousState.is_completed 
          })
        });
        await loadBoard();
        break;
        
      case 'subtask_toggle':
        // Toggle back
        await api('/api/subtasks/' + action.subtaskId, {
          method: 'PATCH',
          body: JSON.stringify({ is_completed: !action.newState })
        });
        await loadBoard();
        break;
        
      case 'bulk_move':
        // Move all tasks back
        for (const item of action.tasks) {
          await api('/api/tasks/' + item.taskId, {
            method: 'PATCH',
            body: JSON.stringify({
              column_id: item.previousColumnId,
              position: item.previousPosition
            })
          });
        }
        await loadBoard();
        break;
        
      case 'bulk_delete':
        // Restore all from trash
        for (const taskId of action.taskIds) {
          await api('/api/trash/tasks/' + taskId + '/restore', { method: 'POST' });
        }
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'bulk_archive':
        // Unarchive all
        for (const taskId of action.taskIds) {
          await api('/api/tasks/' + taskId + '/unarchive', { method: 'POST' });
        }
        await loadBoard();
        updateArchiveCount();
        break;
        
      case 'bulk_update':
        // Restore previous states
        for (const item of action.tasks) {
          await api('/api/tasks/' + item.taskId, {
            method: 'PATCH',
            body: JSON.stringify(item.previousState)
          });
        }
        await loadBoard();
        break;
        
      default:
        throw new Error('Unknown action type: ' + action.type);
    }
  },
  
  // Execute redo based on action type
  executeRedo: async function(action) {
    switch (action.type) {
      case 'task_create':
        // Restore from trash (the task we "undid")
        await api('/api/trash/task/' + action.taskId + '/restore', { method: 'POST' });
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'task_update':
        // Apply the new state again
        await api('/api/tasks/' + action.taskId, {
          method: 'PATCH',
          body: JSON.stringify(action.newState)
        });
        await loadBoard();
        break;
        
      case 'task_delete':
        // Delete again
        await api('/api/tasks/' + action.taskId, { method: 'DELETE' });
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'task_archive':
        // Archive again
        await api('/api/tasks/' + action.taskId + '/archive', { method: 'POST' });
        await loadBoard();
        updateArchiveCount();
        break;
        
      case 'task_move':
        // Move to new column again
        await api('/api/tasks/' + action.taskId, {
          method: 'PATCH',
          body: JSON.stringify({
            column_id: action.newColumnId,
            position: action.newPosition
          })
        });
        await loadBoard();
        break;
        
      case 'column_create':
        // Restore from trash
        await api('/api/trash/column/' + action.columnId + '/restore', { method: 'POST' });
        await loadBoard();
        break;
        
      case 'column_update':
        // Apply the new state again
        await api('/api/columns/' + action.columnId, {
          method: 'PATCH',
          body: JSON.stringify(action.newState)
        });
        await loadBoard();
        break;
        
      case 'column_delete':
        // Delete again
        await api('/api/columns/' + action.columnId, { method: 'DELETE' });
        await loadBoard();
        break;
        
      case 'column_move':
        // Move to new position again
        await api('/api/columns/' + action.columnId, {
          method: 'PATCH',
          body: JSON.stringify({ position: action.newPosition })
        });
        await loadBoard();
        break;
        
      case 'subtask_create':
        // Recreate the subtask
        await api('/api/tasks/' + action.taskId + '/subtasks', {
          method: 'POST',
          body: JSON.stringify({ 
            title: action.newState.title 
          })
        });
        await loadBoard();
        break;
        
      case 'subtask_delete':
        // Delete again
        await api('/api/subtasks/' + action.subtaskId, { method: 'DELETE' });
        await loadBoard();
        break;
        
      case 'subtask_toggle':
        // Toggle again
        await api('/api/subtasks/' + action.subtaskId, {
          method: 'PATCH',
          body: JSON.stringify({ is_completed: action.newState })
        });
        await loadBoard();
        break;
        
      case 'bulk_move':
        // Move all tasks to new positions
        for (const item of action.tasks) {
          await api('/api/tasks/' + item.taskId, {
            method: 'PATCH',
            body: JSON.stringify({
              column_id: item.newColumnId,
              position: item.newPosition
            })
          });
        }
        await loadBoard();
        break;
        
      case 'bulk_delete':
        // Delete all again
        for (const taskId of action.taskIds) {
          await api('/api/tasks/' + taskId, { method: 'DELETE' });
        }
        await loadBoard();
        updateTrashCount();
        break;
        
      case 'bulk_archive':
        // Archive all again
        for (const taskId of action.taskIds) {
          await api('/api/tasks/' + taskId + '/archive', { method: 'POST' });
        }
        await loadBoard();
        updateArchiveCount();
        break;
        
      case 'bulk_update':
        // Apply new states
        for (const item of action.tasks) {
          await api('/api/tasks/' + item.taskId, {
            method: 'PATCH',
            body: JSON.stringify(item.newState)
          });
        }
        await loadBoard();
        break;
        
      default:
        throw new Error('Unknown action type: ' + action.type);
    }
  },
  
  // Check if we can undo
  canUndo: function() {
    return this.undoStack.length > 0;
  },
  
  // Check if we can redo
  canRedo: function() {
    return this.redoStack.length > 0;
  },
  
  // Clear history for current board
  clear: function() {
    this.undoStack = [];
    this.redoStack = [];
    this.save();
    this.updateUI();
  },
  
  // Update UI indicators
  updateUI: function() {
    // Update undo button state if it exists
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
      undoBtn.classList.toggle('opacity-50', !this.canUndo());
      undoBtn.title = this.canUndo() 
        ? 'Undo: ' + (this.undoStack[this.undoStack.length - 1]?.description || 'last action') + ' (Ctrl+Z)'
        : 'Nothing to undo (Ctrl+Z)';
    }
    
    if (redoBtn) {
      redoBtn.disabled = !this.canRedo();
      redoBtn.classList.toggle('opacity-50', !this.canRedo());
      redoBtn.title = this.canRedo()
        ? 'Redo: ' + (this.redoStack[this.redoStack.length - 1]?.description || 'last action') + ' (Ctrl+Shift+Z)'
        : 'Nothing to redo (Ctrl+Shift+Z)';
    }
  }
};

// IndexedDB for offline support (legacy, kept for backward compatibility)
const DB_NAME = 'task-manager-db';
const DB_VERSION = 1;
let indexedDB = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  const initStartTime = performance.now();
  
  try {
    // Initialize performance systems
    await CacheManager.init().catch(e => {
      console.warn('CacheManager init failed, continuing without cache:', e);
    });
    
    await initIndexedDB().catch(e => {
      console.warn('IndexedDB init failed, continuing without offline support:', e);
    });
    
    // Initialize core systems (these should not fail)
    initTheme();
    initOnlineStatus();
    initBoardScrollbar();
    
    // Initialize keyboard shortcuts
    initKeyboardShortcuts();
    
    // Load the board (main data fetch)
    await loadBoard();
    
    // Initialize custom selects for filter dropdowns
    setTimeout(initAllCustomSelects, 100);
    
    // Global dragend cleanup (safety net)
    document.addEventListener('dragend', globalDragEnd);
    
    // Clear task focus when clicking on empty space
    document.getElementById('main-content').addEventListener('click', (e) => {
      // Don't clear focus if clicking on a task card, modal, or interactive element
      if (e.target.closest('.task-card') || 
          e.target.closest('.task-modal') || 
          e.target.closest('tr[data-task-id]') ||
          e.target.closest('button') ||
          e.target.closest('input') ||
          e.target.closest('select') ||
          e.target.closest('.modal-content')) {
        return;
      }
      // Clear the focused task
      if (state.focusedTaskId) {
        state.focusedTaskId = null;
        updateTaskFocus();
      }
    });
    
    // Preload visible task details in background
    setTimeout(() => {
      const visibleTaskIds = state.tasks.slice(0, 20).map(t => t.id);
      LazyLoader.preloadVisible(visibleTaskIds);
    }, 1000);
    
    // Set up periodic cache cleanup
    setInterval(() => CacheManager.cleanExpired(), 5 * 60 * 1000);
    
    // Sync pending operations when coming back online
    window.addEventListener('online', syncPendingOperations);
    
    // Log successful init
    const initTime = performance.now() - initStartTime;
    console.log(`TaskFlow initialized in ${initTime.toFixed(2)}ms`);
    
  } catch (error) {
    // Critical init failure - show error boundary
    console.error('Failed to initialize app:', error);
    ErrorHandler.log(error, 'app_init');
    
    // Hide loading and show error
    showLoading(false);
    
    // Try to show error boundary
    try {
      ErrorHandler.setCriticalError(error);
    } catch (e) {
      // If even error boundary fails, show basic alert
      alert('Failed to load TaskFlow. Please refresh the page or try again later.');
    }
  }
});

/**
 * Initialize keyboard shortcuts for performance features
 */
function initKeyboardShortcuts() {
  // Existing keyboard handlers are already set up elsewhere
  // This just ensures they're initialized
}

/**
 * Sync pending operations when coming back online
 */
/**
 * Sync pending offline operations with conflict detection
 */
async function syncPendingOperations() {
  const pending = await CacheManager.getPendingSync();
  if (pending.length === 0) return;
  
  showToast(`Syncing ${pending.length} pending changes...`, 'info');
  
  const completedIds = [];
  const failedOps = [];
  const conflicts = [];
  
  for (const op of pending) {
    try {
      // For task updates, check for conflicts first
      if (op.method === 'PATCH' && op.url.includes('/tasks/')) {
        const taskId = op.url.split('/tasks/')[1].split('/')[0];
        
        try {
          // Get current server state
          const serverData = await api(`/api/tasks/${taskId}`, { batch: false, retry: false });
          
          // Check for conflicts
          if (serverData && op.body && SyncConflictResolver.hasConflict(op.body, serverData)) {
            conflicts.push({
              type: 'task_update',
              localData: op.body,
              serverData: serverData,
              operation: op
            });
            continue; // Skip this operation, let user resolve conflict
          }
        } catch (e) {
          // If we can't fetch server state, proceed with update
          if (e.status !== 404) {
            console.warn('Could not check for conflicts:', e);
          }
        }
      }
      
      // Execute the sync operation
      await api(op.url, {
        method: op.method,
        body: op.body ? JSON.stringify(op.body) : undefined,
        batch: false,
        retry: false, // Don't retry during sync, we'll handle failures
        context: 'sync'
      });
      completedIds.push(op.id);
    } catch (error) {
      ErrorHandler.log(error, 'sync_operation', { operation: op });
      
      // Check if it's a conflict error (409)
      if (error.status === 409) {
        conflicts.push({
          type: 'sync_conflict',
          localData: op.body,
          serverData: error.details?.serverData,
          operation: op
        });
      } else if (error.status === 404) {
        // Resource no longer exists, just clear from queue
        completedIds.push(op.id);
        console.log('Resource no longer exists, clearing from sync queue:', op);
      } else {
        failedOps.push({ operation: op, error });
      }
    }
  }
  
  // Clear completed operations
  if (completedIds.length > 0) {
    await CacheManager.clearPendingSync(completedIds);
  }
  
  // Add conflicts to resolver
  for (const conflict of conflicts) {
    SyncConflictResolver.addConflict(conflict);
  }
  
  // Show summary toast
  if (completedIds.length > 0 && failedOps.length === 0 && conflicts.length === 0) {
    showToast(`Synced ${completedIds.length} changes successfully`, 'success');
  } else if (completedIds.length > 0) {
    showToast(`Synced ${completedIds.length} changes. ${failedOps.length} failed, ${conflicts.length} conflicts.`, 'warning');
  } else if (failedOps.length > 0) {
    showToast(`Failed to sync ${failedOps.length} changes. Will retry later.`, 'error');
  }
  
  // Show conflict resolution if any
  if (conflicts.length > 0) {
    setTimeout(() => {
      SyncConflictResolver.showAllConflicts();
    }, 500);
  }
  
  // Reload to get latest state if we synced anything
  if (completedIds.length > 0) {
    await loadBoard();
  }
}

function globalDragEnd() {
  // Safety cleanup for any stuck drag states
  setTimeout(() => {
    cleanupAllDragStates();
    state.draggedElement = null;
    state.dragType = null;
    state.dragSourceId = null;
  }, 0);
}

// ===================================
// IndexedDB Operations
// ===================================

async function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      indexedDB = request.result;
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingOperations')) {
        const store = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function saveToIndexedDB(storeName, data) {
  if (!indexedDB) return;
  return new Promise((resolve, reject) => {
    const transaction = indexedDB.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getFromIndexedDB(storeName, key) {
  if (!indexedDB) return null;
  return new Promise((resolve, reject) => {
    const transaction = indexedDB.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// ===================================
// Theme Management
// ===================================

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  state.theme = savedTheme;
  applyTheme();
}

function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('theme', theme);
  applyTheme();
  updateThemeButtons();
}

function toggleTheme() {
  const themes = ['light', 'dark', 'system'];
  const currentIndex = themes.indexOf(state.theme);
  setTheme(themes[(currentIndex + 1) % themes.length]);
}

function applyTheme() {
  const isDark = state.theme === 'dark' || 
    (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeButtons();
  // Reapply board background for dark/light mode adjustment
  applyBoardBackground();
}

function updateThemeButtons() {
  const lightBtn = document.getElementById('theme-light');
  const darkBtn = document.getElementById('theme-dark');
  const systemBtn = document.getElementById('theme-system');
  
  const activeClass = 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100';
  const inactiveClass = 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';
  
  if (lightBtn) {
    lightBtn.className = 'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ' + 
      (state.theme === 'light' ? activeClass : inactiveClass);
  }
  if (darkBtn) {
    darkBtn.className = 'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ' + 
      (state.theme === 'dark' ? activeClass : inactiveClass);
  }
  if (systemBtn) {
    systemBtn.className = 'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ' + 
      (state.theme === 'system' ? activeClass : inactiveClass);
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.theme === 'system') applyTheme();
});

// ===================================
// Online Status
// ===================================

function initOnlineStatus() {
  window.addEventListener('online', handleOnlineTransition);
  window.addEventListener('offline', handleOfflineTransition);
  updateOnlineUI();
  
  // Initialize menu status indicator
  showNetworkStatus(state.isOnline ? 'online' : 'offline');
  
  // Set up global error handlers for unhandled errors
  initGlobalErrorHandlers();
}

/**
 * Handle transition to online state
 */
function handleOnlineTransition() {
  state.isOnline = true;
  updateOnlineUI();
  showNetworkStatus('online');
  
  // Attempt to sync pending operations
  setTimeout(async () => {
    try {
      await syncPendingOperations();
    } catch (error) {
      ErrorHandler.log(error, 'sync_on_reconnect');
    }
  }, 1000); // Small delay to ensure connection is stable
}

/**
 * Handle transition to offline state
 */
function handleOfflineTransition() {
  state.isOnline = false;
  updateOnlineUI();
  showNetworkStatus('offline');
  
  // Cancel any active retry operations
  ErrorHandler.cancelAllRetries();
}

/**
 * Update network status indicator in user menu
 */
function showNetworkStatus(status) {
  const menuStatus = document.getElementById('user-menu-network-status');
  if (!menuStatus) return;
  
  const icon = menuStatus.querySelector('i');
  const text = menuStatus.querySelector('span');
  
  if (!icon || !text) return;
  
  // Remove any existing status classes
  menuStatus.classList.remove('online', 'offline');
  menuStatus.classList.add(status);
  
  if (status === 'online') {
    icon.className = 'fas fa-wifi';
    text.textContent = 'Online';
    icon.classList.remove('text-red-500', 'text-yellow-500');
    icon.classList.add('text-gray-400', 'dark:text-gray-500');
    text.classList.remove('text-red-500', 'text-yellow-500');
    text.classList.add('text-gray-400', 'dark:text-gray-500');
  } else {
    icon.className = 'fas fa-wifi-slash';
    text.textContent = 'Offline';
    icon.classList.remove('text-gray-400', 'dark:text-gray-500');
    icon.classList.add('text-yellow-500');
    text.classList.remove('text-gray-400', 'dark:text-gray-500');
    text.classList.add('text-yellow-500');
  }
}

function updateOnlineUI() {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.classList.toggle('hidden', state.isOnline);
  
  // Add/remove offline mode class on body
  document.body.classList.toggle('offline-mode', !state.isOnline);
}

/**
 * Initialize global error handlers for uncaught errors
 */
function initGlobalErrorHandlers() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    
    ErrorHandler.log(error, 'uncaught_error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    // Don't show error boundary for minor errors
    // Only show for critical errors that would break the app
    if (isCriticalError(error)) {
      ErrorHandler.setCriticalError(error);
    }
    
    // Prevent default browser error handling for known errors
    if (error.message && error.message.includes('Script error')) {
      return; // Ignore cross-origin script errors
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    ErrorHandler.log(error, 'unhandled_rejection');
    
    // Show toast for unhandled rejections (less critical than thrown errors)
    if (error.message && !error.message.includes('cancelled')) {
      showToast('An error occurred. Some features may not work properly.', 'warning');
    }
    
    // Prevent default console error
    event.preventDefault();
  });
}

/**
 * Determine if an error is critical enough to show error boundary
 */
function isCriticalError(error) {
  if (!error) return false;
  
  // Critical error patterns
  const criticalPatterns = [
    'cannot read prop',
    'undefined is not',
    'null is not',
    'is not a function',
    'maximum call stack',
    'out of memory',
    'network error'
  ];
  
  const message = (error.message || '').toLowerCase();
  return criticalPatterns.some(pattern => message.includes(pattern));
}

// ===================================
// Board Scrollbar (Trello-style)
// ===================================

let scrollbarState = {
  isDragging: false,
  startX: 0,
  startScrollLeft: 0,
  hideTimeout: null,
  isVisible: false
};

function initBoardScrollbar() {
  const boardView = document.getElementById('board-view');
  const scrollbar = document.getElementById('board-scrollbar');
  const thumb = document.getElementById('board-scrollbar-thumb');
  const leftIndicator = document.getElementById('scroll-indicator-left');
  const rightIndicator = document.getElementById('scroll-indicator-right');
  
  if (!boardView || !scrollbar || !thumb) return;
  
  // Update scroll indicators (gradient fade edges)
  function updateScrollIndicators() {
    if (!leftIndicator || !rightIndicator) return;
    
    const scrollWidth = boardView.scrollWidth;
    const clientWidth = boardView.clientWidth;
    const scrollLeft = boardView.scrollLeft;
    
    // No overflow - hide both indicators
    if (scrollWidth <= clientWidth) {
      leftIndicator.classList.remove('visible');
      rightIndicator.classList.remove('visible');
      return;
    }
    
    // Show/hide left indicator (content to the left)
    if (scrollLeft > 10) {
      leftIndicator.classList.add('visible');
    } else {
      leftIndicator.classList.remove('visible');
    }
    
    // Show/hide right indicator (content to the right)
    const maxScrollLeft = scrollWidth - clientWidth;
    if (scrollLeft < maxScrollLeft - 10) {
      rightIndicator.classList.add('visible');
    } else {
      rightIndicator.classList.remove('visible');
    }
  }
  
  // Update scrollbar thumb position and size
  function updateScrollbar() {
    const scrollWidth = boardView.scrollWidth;
    const clientWidth = boardView.clientWidth;
    const scrollLeft = boardView.scrollLeft;
    
    // Also update scroll indicators
    updateScrollIndicators();
    
    // Only show if there's overflow
    if (scrollWidth <= clientWidth) {
      scrollbar.classList.remove('visible');
      return;
    }
    
    // Calculate thumb size and position
    const trackWidth = scrollbar.querySelector('.board-scrollbar-track').clientWidth;
    const thumbWidth = Math.max(40, (clientWidth / scrollWidth) * trackWidth);
    const maxThumbLeft = trackWidth - thumbWidth;
    const thumbLeft = (scrollLeft / (scrollWidth - clientWidth)) * maxThumbLeft;
    
    thumb.style.width = thumbWidth + 'px';
    thumb.style.left = thumbLeft + 'px';
  }
  
  // Show scrollbar
  function showScrollbar() {
    if (scrollbarState.hideTimeout) {
      clearTimeout(scrollbarState.hideTimeout);
      scrollbarState.hideTimeout = null;
    }
    scrollbarState.isVisible = true;
    scrollbar.classList.add('visible');
    updateScrollbar();
  }
  
  // Hide scrollbar with delay
  function hideScrollbar(delay = 1500) {
    if (scrollbarState.isDragging) return;
    
    if (scrollbarState.hideTimeout) {
      clearTimeout(scrollbarState.hideTimeout);
    }
    scrollbarState.hideTimeout = setTimeout(() => {
      if (!scrollbarState.isDragging) {
        scrollbarState.isVisible = false;
        scrollbar.classList.remove('visible');
      }
    }, delay);
  }
  
  // Board scroll event
  boardView.addEventListener('scroll', () => {
    showScrollbar();
    hideScrollbar();
  });
  
  // Mouse wheel horizontal scroll (shift+wheel or trackpad)
  boardView.addEventListener('wheel', (e) => {
    // Show scrollbar on any wheel event over board
    if (boardView.scrollWidth > boardView.clientWidth) {
      showScrollbar();
      hideScrollbar();
    }
  }, { passive: true });
  
  // Mouse near bottom of screen
  document.addEventListener('mousemove', (e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    
    // Show when mouse is within 60px of bottom
    if (mouseY > windowHeight - 60 && state.currentView === 'board') {
      if (boardView.scrollWidth > boardView.clientWidth) {
        showScrollbar();
        hideScrollbar(2000);
      }
    }
  });
  
  // Thumb drag start
  thumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    scrollbarState.isDragging = true;
    scrollbarState.startX = e.clientX;
    scrollbarState.startScrollLeft = boardView.scrollLeft;
    thumb.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  });
  
  // Thumb drag move
  document.addEventListener('mousemove', (e) => {
    if (!scrollbarState.isDragging) return;
    
    const trackWidth = scrollbar.querySelector('.board-scrollbar-track').clientWidth;
    const thumbWidth = thumb.clientWidth;
    const maxThumbLeft = trackWidth - thumbWidth;
    const scrollWidth = boardView.scrollWidth;
    const clientWidth = boardView.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    
    const deltaX = e.clientX - scrollbarState.startX;
    const scrollRatio = maxScroll / maxThumbLeft;
    const newScrollLeft = scrollbarState.startScrollLeft + (deltaX * scrollRatio);
    
    boardView.scrollLeft = Math.max(0, Math.min(maxScroll, newScrollLeft));
  });
  
  // Thumb drag end
  document.addEventListener('mouseup', () => {
    if (scrollbarState.isDragging) {
      scrollbarState.isDragging = false;
      thumb.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      hideScrollbar();
    }
  });
  
  // Click on track to jump
  scrollbar.querySelector('.board-scrollbar-track').addEventListener('click', (e) => {
    if (e.target === thumb) return;
    
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const trackWidth = trackRect.width;
    const thumbWidth = thumb.clientWidth;
    
    const scrollWidth = boardView.scrollWidth;
    const clientWidth = boardView.clientWidth;
    const maxScroll = scrollWidth - clientWidth;
    
    // Calculate target scroll position (center thumb on click)
    const targetThumbLeft = clickX - (thumbWidth / 2);
    const maxThumbLeft = trackWidth - thumbWidth;
    const scrollRatio = targetThumbLeft / maxThumbLeft;
    
    boardView.scrollTo({
      left: Math.max(0, Math.min(maxScroll, scrollRatio * maxScroll)),
      behavior: 'smooth'
    });
  });
  
  // Touch support for mobile
  let touchStartX = 0;
  boardView.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  
  boardView.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].clientX;
    const deltaX = touchStartX - touchX;
    
    if (Math.abs(deltaX) > 10) {
      showScrollbar();
      hideScrollbar();
    }
  }, { passive: true });
  
  // Update on resize
  window.addEventListener('resize', updateScrollbar);
  
  // Initial update
  setTimeout(updateScrollbar, 100);
}

// ===================================
// API Helpers
// ===================================

/**
 * Create an API error with additional context
 * @param {Response} response - Fetch response
 * @param {object} result - Parsed response body
 * @returns {Error}
 */
function createApiError(response, result) {
  const error = new Error(result?.error?.message || `HTTP ${response.status}`);
  error.status = response.status;
  error.code = result?.error?.code || 'API_ERROR';
  error.details = result?.error?.details;
  error.response = response;
  return error;
}

/**
 * Execute a fetch request with timeout
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in ms (default 30s)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Enhanced API helper with caching, batching, and retry support
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {object} cacheConfig - Cache configuration { enable, type, ttl, key }
 */
async function api(url, options = {}, cacheConfig = null) {
  const method = options.method || 'GET';
  const isReadRequest = method === 'GET';
  const enableRetry = options.retry !== false;
  const context = options.context || (url.includes('/tasks') ? 'task_operation' : url.includes('/boards') ? 'board_operation' : 'api_call');
  
  // For GET requests, check cache first
  if (isReadRequest && cacheConfig?.enable !== false) {
    const cacheKey = cacheConfig?.key || url;
    const cached = await CacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Define the fetch operation
  const executeRequest = async () => {
    // Check online status
    if (!navigator.onLine) {
      const offlineError = new Error('You are offline');
      offlineError.code = 'NETWORK_OFFLINE';
      throw offlineError;
    }
    
    let data;
    if (isReadRequest && options.batch !== false) {
      data = await RequestBatcher.add(url, options);
    } else {
      // Direct request for mutations or when batching is disabled
      const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      }, options.timeout || 30000);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw createApiError(response, { error: { message: text || `HTTP ${response.status}` } });
      }
      
      if (!response.ok || !result.success) {
        throw createApiError(response, result);
      }
      
      data = result.data;
    }
    
    return data;
  };
  
  // Execute with retry if enabled
  let data;
  if (enableRetry && !isReadRequest) {
    // Register for potential manual retry
    ErrorHandler.registerRetryableAction(context, async () => {
      return api(url, options, cacheConfig);
    });
  }
  
  try {
    if (enableRetry) {
      data = await ErrorHandler.withRetry(executeRequest, {
        context,
        maxRetries: options.maxRetries || (isReadRequest ? 3 : 2),
        onRetry: (attempt, max, delay) => {
          // Silent retry for read requests, show toast for mutations
          if (!isReadRequest) {
            showToast(`Retrying... (${attempt}/${max})`, 'warning');
          }
        }
      });
    } else {
      data = await executeRequest();
    }
  } catch (error) {
    // Log the error
    ErrorHandler.log(error, context, { url, method });
    
    // For offline mutations, queue for later sync
    if (!navigator.onLine && !isReadRequest) {
      await CacheManager.addToPendingSync({
        id: `pending_${Date.now()}`,
        url,
        method,
        body: options.body ? JSON.parse(options.body) : null
      });
      showToast('Saved offline. Will sync when back online.', 'info');
      return null;
    }
    
    throw error;
  }
  
  // Cache GET responses
  if (isReadRequest && cacheConfig?.enable !== false && data) {
    const cacheKey = cacheConfig?.key || url;
    const cacheType = cacheConfig?.type || 'general';
    const cacheTTL = cacheConfig?.ttl || null;
    await CacheManager.set(cacheKey, data, cacheType, cacheTTL);
  }
  
  // Invalidate related caches on mutations
  if (!isReadRequest) {
    if (url.includes('/tasks')) {
      await CacheManager.invalidate('tasks');
      await CacheManager.invalidate('taskDetails');
    } else if (url.includes('/boards')) {
      await CacheManager.invalidate('boards');
    } else if (url.includes('/columns')) {
      await CacheManager.invalidate('boards');
    }
  }
  
  return data;
}

/**
 * Legacy API helper for backward compatibility
 */
function apiCall(url, method = 'GET', body) {
  return api(url, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

/**
 * API helper with optimistic updates and enhanced error handling
 * @param {object} config - { url, method, body, optimisticUpdate, rollbackKey, context }
 */
async function apiWithOptimistic(config) {
  const { url, method, body, optimisticUpdate, rollbackKey, context } = config;
  
  // Create snapshot for rollback
  if (rollbackKey) {
    OptimisticUI.snapshot(rollbackKey);
  }
  
  // Apply optimistic update
  if (optimisticUpdate) {
    optimisticUpdate();
    // Re-render immediately
    renderBoard();
    renderList();
  }
  
  try {
    const data = await api(url, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      context: context || 'optimistic_update',
      retry: true
    });
    
    // Commit the optimistic update
    if (rollbackKey) {
      OptimisticUI.commit(rollbackKey);
    }
    
    return data;
  } catch (error) {
    // Rollback on error
    if (rollbackKey) {
      OptimisticUI.rollback(rollbackKey);
    }
    
    // Show user-friendly error with recovery options
    const errorInfo = ErrorHandler.handle(error, context || 'save', {
      showRecovery: true
    });
    
    throw error;
  }
}

// ===================================
// Board/Project Operations
// ===================================

async function loadBoard(boardId) {
  showLoading(true);
  const loadStartTime = performance.now();
  
  try {
    // Load all boards/projects with caching
    const boards = await api('/api/boards', {}, {
      enable: true,
      type: 'boards',
      key: 'boards_list'
    });
    state.boards = boards;
    
    if (boards.length === 0) {
      // Create default project
      const newBoard = await api('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ 
          name: 'My Tasks', 
          description: 'Personal task board',
          icon: '📋',
          color: '#10B981'
        })
      });
      state.currentBoardId = newBoard.id;
      state.boards = [newBoard];
      
      // Invalidate boards cache
      await CacheManager.invalidate('boards');
    } else {
      // Use provided boardId, or keep current board, or fall back to first board
      if (boardId) {
        state.currentBoardId = boardId;
      } else if (!state.currentBoardId || !boards.find(b => b.id === state.currentBoardId)) {
        // Only switch to first board if current board doesn't exist
        state.currentBoardId = boards[0].id;
      }
      // Otherwise keep state.currentBoardId as-is
    }
    
    // Load the current board details with caching
    state.board = await api('/api/boards/' + state.currentBoardId, {}, {
      enable: true,
      type: 'boards',
      key: `board_${state.currentBoardId}`
    });
    state.columns = state.board.columns;
    state.tasks = state.board.columns.flatMap(col => col.tasks);
    
    // Save to legacy IndexedDB for offline support
    if (indexedDB) {
      await saveToIndexedDB('boards', state.board);
    }
    
    // Also save to new cache system
    await CacheManager.set(`board_full_${state.currentBoardId}`, state.board, 'boards');
    
    // Update UI using requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      updateProjectSwitcher();
      renderBoard();
      renderList();
      if (state.currentView === 'calendar') {
        renderCalendar();
      }
      updateTrashCount();
      updateOverdueBadge();
      updateArchiveCount();
      
      // Initialize undo manager
      UndoManager.init();
      
      // Log performance
      const loadTime = performance.now() - loadStartTime;
      console.log(`Board loaded in ${loadTime.toFixed(2)}ms`);
    });
    
    // Process auto-archive (non-blocking)
    setTimeout(() => processAutoArchive(), 100);
    
    // Preload task details for visible tasks
    setTimeout(() => {
      const visibleTaskIds = state.tasks.slice(0, 15).map(t => t.id);
      LazyLoader.preloadVisible(visibleTaskIds);
    }, 500);
    
  } catch (error) {
    // Log the error with context
    ErrorHandler.log(error, 'load_board', { boardId: state.currentBoardId });
    
    // Try new cache first, then fall back to legacy IndexedDB
    let cached = await CacheManager.get(`board_full_${state.currentBoardId}`);
    if (!cached) {
      cached = await getFromIndexedDB('boards', state.currentBoardId);
    }
    
    if (cached) {
      // We have cached data - use it and show warning
      state.board = cached;
      state.columns = cached.columns;
      state.tasks = cached.columns.flatMap(col => col.tasks);
      renderBoard();
      renderList();
      if (state.currentView === 'calendar') {
        renderCalendar();
      }
      updateOverdueBadge();
      
      // Register retry action
      ErrorHandler.registerRetryableAction('load_board', () => loadBoard(boardId));
      
      // Show friendly error with recovery option
      ErrorHandler.handle(error, 'load_board', {
        showRecovery: true
      });
      
      showToast('Loaded from cache. Some data may be outdated.', 'warning');
    } else {
      // No cache available - this is a critical error
      showLoading(false);
      
      // Check if this is a first-time load failure
      const errorInfo = ErrorHandler.classify(error);
      
      if (errorInfo.code === 'NETWORK_OFFLINE') {
        // Offline and no cache - show offline mode message
        showToast('You\'re offline with no cached data. Please connect to continue.', 'error');
        
        // Show a helpful empty state
        document.getElementById('columns-container').innerHTML = `
          <div class="flex flex-col items-center justify-center w-full h-64 text-gray-500 dark:text-gray-400">
            <i class="fas fa-wifi-slash text-4xl mb-4 opacity-50"></i>
            <p class="text-lg font-medium">You're offline</p>
            <p class="text-sm mt-2">Connect to the internet to load your tasks.</p>
            <button onclick="loadBoard()" class="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">
              <i class="fas fa-redo mr-2"></i>Try Again
            </button>
          </div>
        `;
      } else {
        // Other error - show error boundary for critical failures
        ErrorHandler.setCriticalError(error);
      }
      return;
    }
  }
  
  showLoading(false);
}

async function switchProject(boardId) {
  if (boardId === state.currentBoardId) {
    closeProjectSwitcher();
    return;
  }
  
  closeProjectSwitcher();
  await loadBoard(boardId);
  showToast('Switched to ' + state.board.name, 'success');
}

// ===================================
// Render Functions
// ===================================

function applyBoardBackground() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent || !state.board) return;
  
  const bgType = state.board.background_type || 'solid';
  const bgValue = state.board.background_value || 'gray';
  const isDark = document.documentElement.classList.contains('dark');
  
  // Reset any existing background
  mainContent.style.background = '';
  mainContent.classList.remove('board-gradient-bg');
  
  if (bgType === 'gradient') {
    // Find gradient preset or use value directly
    const gradient = GRADIENT_BACKGROUNDS.find(g => g.id === bgValue);
    mainContent.style.background = gradient ? gradient.value : bgValue;
    mainContent.classList.add('board-gradient-bg');
  } else {
    // Solid color - check if it's a preset ID or hex value
    const solid = SOLID_BACKGROUNDS.find(s => s.id === bgValue);
    if (solid) {
      mainContent.style.background = isDark ? solid.darkValue : solid.value;
    } else {
      // It's a hex value, use as-is (or adjust for dark mode)
      mainContent.style.background = bgValue;
    }
  }
}

function renderBoard() {
  const container = document.getElementById('columns-container');
  if (!container) return;
  
  // Apply board background
  applyBoardBackground();
  
  container.innerHTML = '';
  
  // Sort columns by position
  const sortedColumns = [...state.columns].sort((a, b) => a.position - b.position);
  
  sortedColumns.forEach((column, index) => {
    const columnEl = createColumnElement(column, index);
    container.appendChild(columnEl);
  });
  
  // Update bulk actions bar
  updateBulkActionsBar();
  
  // Add "Add Column" button (also serves as drop zone for column at end)
  const addColumnBtn = document.createElement('div');
  addColumnBtn.className = 'flex-shrink-0 w-72 add-column-zone';
  addColumnBtn.innerHTML = '<button onclick="addColumn()" class="w-full h-full min-h-[200px] p-4 border-2 border-dashed border-gray-300/60 dark:border-gray-600/60 rounded-xl text-gray-500 dark:text-gray-400 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200 flex items-center justify-center group"><i class="fas fa-plus mr-2 group-hover:scale-110 transition-transform"></i>Add Column</button>';
  
  // Allow dropping columns at the end
  addColumnBtn.addEventListener('dragover', (e) => {
    if (state.dragType !== 'column') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    addColumnBtn.classList.add('column-drop-end');
  });
  
  addColumnBtn.addEventListener('dragleave', (e) => {
    addColumnBtn.classList.remove('column-drop-end');
  });
  
  addColumnBtn.addEventListener('drop', async (e) => {
    if (state.dragType !== 'column') return;
    e.preventDefault();
    addColumnBtn.classList.remove('column-drop-end');
    
    const draggedColumnId = state.dragSourceId;
    const sortedColumns = [...state.columns].sort((a, b) => a.position - b.position);
    const lastCol = sortedColumns[sortedColumns.length - 1];
    const newPosition = lastCol ? lastCol.position + 1 : 0;
    
    // Capture previous state for undo
    const column = state.columns.find(c => c.id === draggedColumnId);
    const previousPosition = column ? column.position : 0;
    const columnName = column ? column.name : 'Column';
    
    // Optimistic update
    const colIndex = state.columns.findIndex(c => c.id === draggedColumnId);
    if (colIndex !== -1) {
      state.columns[colIndex].position = newPosition;
    }
    
    cleanupAllDragStates();
    state.draggedElement = null;
    state.dragType = null;
    state.dragSourceId = null;
    renderBoard();
    
    try {
      await api('/api/columns/' + draggedColumnId, {
        method: 'PATCH',
        body: JSON.stringify({ position: newPosition })
      });
      
      // Track for undo
      UndoManager.push({
        type: 'column_move',
        columnId: draggedColumnId,
        description: 'Move column "' + columnName + '"',
        previousPosition: previousPosition,
        newPosition: newPosition
      });
      
      showToastWithUndo('Column moved', 'success');
    } catch (error) {
      console.error('Failed to move column:', error);
      showToast('Failed to move column', 'error');
      await loadBoard();
    }
  });
  
  container.appendChild(addColumnBtn);
  
  // Update filter dropdown
  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
    filterStatus.innerHTML = '<option value="">All</option>' + 
      sortedColumns.map(col => '<option value="' + col.id + '">' + escapeHtml(col.name) + '</option>').join('');
    
    // Update custom select if it exists
    const wrapper = filterStatus.closest('.custom-select');
    if (wrapper) {
      const trigger = wrapper.querySelector('.custom-select-trigger .custom-select-value');
      const selectedOption = filterStatus.options[filterStatus.selectedIndex];
      if (trigger && selectedOption) {
        trigger.textContent = selectedOption.text;
      }
    }
  }
  
  // Update scrollbar after render
  setTimeout(updateBoardScrollbar, 50);
  
  // Update task focus after render
  updateTaskFocus();
}

function updateBoardScrollbar() {
  const boardView = document.getElementById('board-view');
  const scrollbar = document.getElementById('board-scrollbar');
  const thumb = document.getElementById('board-scrollbar-thumb');
  const leftIndicator = document.getElementById('scroll-indicator-left');
  const rightIndicator = document.getElementById('scroll-indicator-right');
  
  if (!boardView || !scrollbar || !thumb) return;
  
  const scrollWidth = boardView.scrollWidth;
  const clientWidth = boardView.clientWidth;
  const scrollLeft = boardView.scrollLeft;
  
  // Update scroll indicators
  if (leftIndicator && rightIndicator) {
    if (scrollWidth <= clientWidth) {
      // No overflow - hide both
      leftIndicator.classList.remove('visible');
      rightIndicator.classList.remove('visible');
    } else {
      // Show left indicator if scrolled right
      if (scrollLeft > 10) {
        leftIndicator.classList.add('visible');
      } else {
        leftIndicator.classList.remove('visible');
      }
      
      // Show right indicator if more content to the right
      const maxScrollLeft = scrollWidth - clientWidth;
      if (scrollLeft < maxScrollLeft - 10) {
        rightIndicator.classList.add('visible');
      } else {
        rightIndicator.classList.remove('visible');
      }
    }
  }
  
  // Hide scrollbar if no overflow
  if (scrollWidth <= clientWidth) {
    scrollbar.classList.remove('visible');
    return;
  }
  
  const track = scrollbar.querySelector('.board-scrollbar-track');
  if (!track) return;
  
  const trackWidth = track.clientWidth;
  const thumbWidth = Math.max(40, (clientWidth / scrollWidth) * trackWidth);
  const maxThumbLeft = trackWidth - thumbWidth;
  const thumbLeft = (scrollLeft / (scrollWidth - clientWidth)) * maxThumbLeft;
  
  thumb.style.width = thumbWidth + 'px';
  thumb.style.left = thumbLeft + 'px';
}

function createColumnElement(column, index) {
  const tasks = state.tasks.filter(t => t.column_id === column.id).sort((a, b) => a.position - b.position);
  
  // Check if this is a "done/completed" type column
  const isDoneColumn = /done|completed|finished/i.test(column.name);
  
  // Check if virtual scrolling should be enabled for this column
  const useVirtualScroll = tasks.length >= VirtualScroller.config.threshold;
  
  const div = document.createElement('div');
  div.className = 'column flex-shrink-0 w-72 bg-gray-200/70 dark:bg-gray-800/90 rounded-xl flex flex-col border border-gray-300/50 dark:border-gray-700/50 shadow-sm';
  div.id = 'column-' + column.id;
  div.setAttribute('data-column-id', column.id);
  div.setAttribute('data-column-index', index);
  if (useVirtualScroll) {
    div.setAttribute('data-virtual-scroll', 'true');
  }
  
  // Column drop events (for receiving dragged columns)
  div.addEventListener('dragover', handleColumnDragOver);
  div.addEventListener('dragleave', handleColumnDragLeave);
  div.addEventListener('drop', handleColumnDrop);
  
  // Archive All button for done columns
  const archiveAllBtn = isDoneColumn && tasks.length > 0 ? 
    '<button onclick="event.stopPropagation(); archiveAllInColumn(\'' + column.id + '\')" class="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded mr-1 transition-colors" title="Archive all tasks">' +
      '<i class="fas fa-archive text-gray-500 text-sm"></i>' +
    '</button>' : '';
  
  // Auto-archive indicator
  const autoArchiveIndicator = column.auto_archive ? 
    '<span class="text-xs text-accent ml-1" title="Auto-archive after ' + (column.auto_archive_days || 7) + ' days">' +
      '<i class="fas fa-clock"></i>' +
    '</span>' : '';
  
  // Virtual scroll indicator for large columns
  const virtualScrollIndicator = useVirtualScroll ? 
    '<span class="text-xs text-blue-500 ml-1" title="Virtual scrolling enabled for ' + tasks.length + ' tasks">' +
      '<i class="fas fa-bolt"></i>' +
    '</span>' : '';
  
  // Column header - this IS the draggable element for column reordering
  const header = document.createElement('div');
  header.className = 'column-header p-3 flex items-center justify-between rounded-t-xl';
  header.draggable = true;
  header.setAttribute('data-column-drag-handle', column.id);
  const allSelectedInColumn = tasks.length > 0 && tasks.every(t => state.selectedTaskIds.has(t.id));
  const selectAllBtn = tasks.length > 0 ?
    '<button onclick="event.stopPropagation(); toggleSelectAllInColumn(\'' + column.id + '\')" class="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded mr-1 transition-colors" title="' + (allSelectedInColumn ? 'Deselect all' : 'Select all') + '">' +
      '<i class="fas ' + (allSelectedInColumn ? 'fa-check-square' : 'fa-square') + ' text-gray-500 text-sm"></i>' +
    '</button>' : '';
  header.innerHTML = 
    '<div class="flex items-center gap-2">' +
      '<i class="fas fa-grip-vertical drag-handle text-gray-400"></i>' +
      '<h3 class="font-semibold text-gray-700 dark:text-gray-200">' + escapeHtml(column.name) + '</h3>' +
      '<span class="text-xs bg-gray-300/50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">' + tasks.length + '</span>' +
      autoArchiveIndicator +
      virtualScrollIndicator +
    '</div>' +
    '<div class="flex items-center">' +
      selectAllBtn +
      archiveAllBtn +
      '<button onclick="event.stopPropagation(); editColumn(\'' + column.id + '\')" class="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors">' +
        '<i class="fas fa-ellipsis-v text-gray-500"></i>' +
      '</button>' +
    '</div>';
  
  // Column header drag events
  header.addEventListener('dragstart', (e) => {
    e.stopPropagation();
    
    state.draggedElement = div; // The column div
    state.dragType = 'column';
    state.dragSourceId = column.id;
    
    console.log('Column drag started:', column.id);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'column:' + column.id);
    e.dataTransfer.setDragImage(div, div.offsetWidth / 2, 30);
    
    requestAnimationFrame(() => {
      div.classList.add('dragging-column');
    });
  });
  
  header.addEventListener('dragend', (e) => {
    console.log('Column drag ended');
    div.classList.remove('dragging-column');
    cleanupAllDragStates();
    state.draggedElement = null;
    state.dragType = null;
    state.dragSourceId = null;
  });
  
  // Scrollable wrapper for content
  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'column-content-wrapper flex-1';
  
  // Column content - drop zone for tasks
  const content = document.createElement('div');
  content.className = 'column-content p-2 min-h-[100px]';
  content.setAttribute('data-column-id', column.id);
  
  // Task drop events
  content.addEventListener('dragover', handleTaskDragOver);
  content.addEventListener('dragleave', handleTaskDragLeave);
  content.addEventListener('drop', handleTaskDrop);
  
  // Use virtual scrolling for large columns
  if (useVirtualScroll) {
    // Initialize virtual scroller after DOM is ready
    setTimeout(() => {
      VirtualScroller.init(
        column.id,
        content,
        tasks,
        (task, idx) => createTaskCardHTML(task)
      );
    }, 0);
    
    // Add empty placeholder initially (virtual scroller will populate)
    content.innerHTML = '<div class="text-center text-gray-400 py-4">Loading tasks...</div>';
  } else {
    // Standard rendering for smaller lists
    tasks.forEach(task => {
      const taskCard = createTaskCardElement(task);
      content.appendChild(taskCard);
    });
  }
  
  scrollWrapper.appendChild(content);
  
  // Column footer
  const footer = document.createElement('div');
  footer.className = 'p-2 rounded-b-xl';
  footer.innerHTML = '<button onclick="quickAddTask(\'' + column.id + '\')" class="w-full p-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-all flex items-center justify-center gap-2 group"><i class="fas fa-plus text-xs group-hover:scale-110 transition-transform"></i>Add task</button>';
  
  div.appendChild(header);
  div.appendChild(scrollWrapper);
  div.appendChild(footer);
  
  return div;
}

/**
 * Create task card HTML string for virtual scrolling
 */
function createTaskCardHTML(task) {
  const priorityClass = 'priority-' + task.priority;
  const dueDateStatus = getDueDateStatus(task.due_date);
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isRecurring = !!task.recurrence_rule;
  const isSelected = state.selectedTaskIds.has(task.id);
  
  // Due date class
  const dueDateClass = dueDateStatus && dueDateStatus.class ? ' ' + dueDateStatus.class : '';
  const recurringClass = isRecurring ? ' task-recurring' : '';
  const selectedClass = isSelected ? ' border-accent border-2' : '';
  const focusedClass = state.focusedTaskId === task.id ? ' task-focused' : '';
  
  let html = `<div class="task-card rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-3 transition-all duration-200 hover:shadow-md${dueDateClass}${recurringClass}${selectedClass}${focusedClass}" draggable="true" data-task-id="${task.id}" tabindex="0">`;
  
  const checkboxHtml = `<input type="checkbox" class="bulk-select-checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleTaskSelection('${task.id}', event.shiftKey);" />`;
  
  html += `<div class="flex items-start gap-2">
    <div class="mt-0.5 flex-shrink-0">${checkboxHtml}</div>
    <i class="fas fa-grip-vertical text-gray-400 mt-1 drag-handle"></i>
    <div class="flex-1 min-w-0">
    <div class="flex items-start justify-between gap-2">
    <p class="font-medium text-gray-800 dark:text-gray-100 truncate flex-1">${escapeHtml(task.title)}</p>
    <button onclick="event.preventDefault(); event.stopPropagation(); archiveTask('${task.id}');" class="archive-btn opacity-0 hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity" title="Archive task">
    <i class="fas fa-archive text-gray-400 text-xs"></i></button>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
    <span class="text-xs px-2 py-0.5 rounded-full ${priorityClass}">${task.priority}</span>`;
  
  // Due date badge
  if (dueDateStatus) {
    html += `<span class="due-date-badge ${dueDateStatus.badgeClass}"><i class="fas ${dueDateStatus.icon}"></i>${dueDateStatus.label}</span>`;
  }
  
  // Recurrence indicator
  if (isRecurring) {
    const recurrenceSummary = getRecurrenceSummary(task.recurrence_rule);
    html += `<span class="recurrence-badge" title="${escapeHtml(recurrenceSummary)}"><i class="fas fa-sync-alt"></i></span>`;
  }
  
  if (totalSubtasks > 0) {
    html += `<span class="text-xs text-gray-500 dark:text-gray-400"><i class="fas fa-check-square mr-1"></i>${completedSubtasks}/${totalSubtasks}</span>`;
  }
  
  // Comment count
  const commentCount = task.comment_count || 0;
  if (commentCount > 0) {
    html += `<span class="text-xs text-gray-500 dark:text-gray-400"><i class="fas fa-comment mr-1"></i>${commentCount}</span>`;
  }
  
  html += '</div>';
  
  // Tags
  if (task.tags && task.tags.length > 0) {
    html += '<div class="mt-2 flex flex-wrap gap-1">';
    task.tags.slice(0, 3).forEach(tag => {
      html += `<span class="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">${escapeHtml(tag)}</span>`;
    });
    if (task.tags.length > 3) {
      html += `<span class="text-xs text-gray-500">+${task.tags.length - 3}</span>`;
    }
    html += '</div>';
  }
  
  html += '</div></div></div>';
  
  return html;
}

function createTaskCardElement(task) {
  const priorityClass = 'priority-' + task.priority;
  const dueDateStatus = getDueDateStatus(task.due_date);
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const isRecurring = !!task.recurrence_rule;
  const isSelected = state.selectedTaskIds.has(task.id);
  
  const div = document.createElement('div');
  // Add due date status class if applicable
  const dueDateClass = dueDateStatus && dueDateStatus.class ? ' ' + dueDateStatus.class : '';
  const recurringClass = isRecurring ? ' task-recurring' : '';
  const selectedClass = isSelected ? ' border-accent border-2' : '';
  const focusedClass = state.focusedTaskId === task.id ? ' task-focused' : '';
  div.className = 'task-card rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-gray-700/50 mb-3 transition-all duration-200 hover:shadow-md' + dueDateClass + recurringClass + selectedClass + focusedClass;
  div.draggable = true;
  div.setAttribute('data-task-id', task.id);
  div.setAttribute('tabindex', '0'); // Make focusable for keyboard navigation
  div.addEventListener('focus', () => focusTask(task.id));
  
  // Task drag events
  div.addEventListener('dragstart', handleTaskDragStart);
  div.addEventListener('dragend', handleTaskDragEnd);
  
  // Click to open modal (but not if clicking checkbox)
  div.addEventListener('click', (e) => {
    if (!e.defaultPrevented && !e.target.closest('.bulk-select-checkbox')) {
      focusTask(task.id);
      openTaskModal(task.id);
    }
  });
  
  const checkboxHtml = '<input type="checkbox" class="bulk-select-checkbox" ' +
    (isSelected ? 'checked' : '') +
    ' onclick="event.stopPropagation(); toggleTaskSelection(\'' + task.id + '\', event.shiftKey);" />';
  
  let html = '<div class="flex items-start gap-2">' +
    '<div class="mt-0.5 flex-shrink-0">' + checkboxHtml + '</div>' +
    '<i class="fas fa-grip-vertical text-gray-400 mt-1 drag-handle"></i>' +
    '<div class="flex-1 min-w-0">' +
    '<div class="flex items-start justify-between gap-2">' +
    '<p class="font-medium text-gray-800 dark:text-gray-100 truncate flex-1">' + escapeHtml(task.title) + '</p>' +
    '<button onclick="event.preventDefault(); event.stopPropagation(); archiveTask(\'' + task.id + '\');" class="archive-btn opacity-0 hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity" title="Archive task">' +
    '<i class="fas fa-archive text-gray-400 text-xs"></i></button>' +
    '</div>' +
    '<div class="mt-2 flex flex-wrap items-center gap-2">' +
    '<span class="text-xs px-2 py-0.5 rounded-full ' + priorityClass + '">' + task.priority + '</span>';
  
  // Due date badge with status indicator
  if (dueDateStatus) {
    html += '<span class="due-date-badge ' + dueDateStatus.badgeClass + '">' +
      '<i class="fas ' + dueDateStatus.icon + '"></i>' + dueDateStatus.label + '</span>';
  }
  
  // Recurrence indicator
  if (isRecurring) {
    const recurrenceSummary = getRecurrenceSummary(task.recurrence_rule);
    html += '<span class="recurrence-badge" title="' + escapeHtml(recurrenceSummary) + '">' +
      '<i class="fas fa-sync-alt"></i></span>';
  }
  
  if (totalSubtasks > 0) {
    html += '<span class="text-xs text-gray-500 dark:text-gray-400">' +
      '<i class="fas fa-check-square mr-1"></i>' + completedSubtasks + '/' + totalSubtasks + '</span>';
  }
  
  // Comment count indicator
  const commentCount = task.comment_count || 0;
  if (commentCount > 0) {
    html += '<span class="text-xs text-gray-500 dark:text-gray-400">' +
      '<i class="fas fa-comment mr-1"></i>' + commentCount + '</span>';
  }
  
  html += '</div>';
  
  if (task.tags && task.tags.length > 0) {
    html += '<div class="mt-2 flex flex-wrap gap-1">';
    task.tags.slice(0, 3).forEach(tag => {
      html += '<span class="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">' + escapeHtml(tag) + '</span>';
    });
    if (task.tags.length > 3) {
      html += '<span class="text-xs text-gray-500">+' + (task.tags.length - 3) + '</span>';
    }
    html += '</div>';
  }
  
  html += '</div></div>';
  
  div.innerHTML = html;
  
  return div;
}

function renderList() {
  const tbody = document.getElementById('tasks-table-body');
  if (!tbody) return;
  
  const filteredTasks = getFilteredTasks();
  
  if (filteredTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center">' +
      '<div class="empty-state"><i class="fas fa-inbox empty-state-icon"></i>' +
      '<p class="empty-state-text">No tasks found</p>' +
      '<p class="empty-state-subtext">Try adjusting your filters</p></div></td></tr>';
    return;
  }
  
  let html = '';
  filteredTasks.forEach(task => {
    const priorityClass = 'priority-' + task.priority;
    const dueDateStatus = getDueDateStatus(task.due_date);
    
    // Generate due date cell content with status badge
    let dueDateHtml = '-';
    if (dueDateStatus) {
      dueDateHtml = '<span class="due-date-badge ' + dueDateStatus.badgeClass + '">' +
        '<i class="fas ' + dueDateStatus.icon + '"></i>' + dueDateStatus.label + '</span>';
    }
    
    // Add row class for overdue styling
    const rowClass = dueDateStatus && dueDateStatus.status === 'overdue' ? ' bg-red-50/50 dark:bg-red-900/10' : '';
    
    const isRecurring = !!task.recurrence_rule;
    const recurrenceIcon = isRecurring ? '<i class="fas fa-sync-alt text-accent ml-2" title="' + escapeHtml(getRecurrenceSummary(task.recurrence_rule)) + '"></i>' : '';
    const isSelected = state.selectedTaskIds.has(task.id);
    const selectedRowClass = isSelected ? ' bg-accent/10 border-l-2 border-accent' : '';
    const focusedRowClass = state.focusedTaskId === task.id ? ' task-row-focused' : '';
    
    // Build indicators string (subtasks + comments)
    let indicatorsHtml = '';
    const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const commentCount = task.comment_count || 0;
    
    if (totalSubtasks > 0 || commentCount > 0) {
      indicatorsHtml += '<span class="flex items-center gap-3 ml-3 text-xs text-gray-400 dark:text-gray-500">';
      if (totalSubtasks > 0) {
        indicatorsHtml += '<span><i class="fas fa-check-square mr-1"></i>' + completedSubtasks + '/' + totalSubtasks + '</span>';
      }
      if (commentCount > 0) {
        indicatorsHtml += '<span><i class="fas fa-comment mr-1"></i>' + commentCount + '</span>';
      }
      indicatorsHtml += '</span>';
    }
    
    html += '<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' + rowClass + selectedRowClass + focusedRowClass + '" data-task-id="' + task.id + '" tabindex="0" onclick="if(!event.target.closest(\'.bulk-select-checkbox\') && !event.target.closest(\'select\')) { focusTask(\'' + task.id + '\'); openTaskModal(\'' + task.id + '\'); }}" onfocus="focusTask(\'' + task.id + '\');">' +
      '<td class="px-4 py-3"><div class="flex items-center gap-2">' +
      '<input type="checkbox" class="bulk-select-checkbox" ' +
      (isSelected ? 'checked' : '') +
      ' onclick="event.stopPropagation(); toggleTaskSelection(\'' + task.id + '\', event.shiftKey);" />' +
      '<div class="font-medium text-gray-900 dark:text-gray-100 flex items-center flex-1">' + escapeHtml(task.title) + recurrenceIcon + indicatorsHtml + '</div></div>';
    
    if (task.description) {
      html += '<div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">' + escapeHtml(task.description) + '</div>';
    }
    
    html += '</td><td class="px-4 py-3">' +
      '<select onchange="updateTaskStatus(\'' + task.id + '\', this.value); event.stopPropagation();" ' +
      'onclick="event.stopPropagation();" ' +
      'class="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700">';
    
    state.columns.forEach(col => {
      html += '<option value="' + col.id + '"' + (col.id === task.column_id ? ' selected' : '') + '>' + escapeHtml(col.name) + '</option>';
    });
    
    html += '</select></td>' +
      '<td class="px-4 py-3"><span class="text-xs px-2 py-1 rounded-full ' + priorityClass + '">' + task.priority + '</span></td>' +
      '<td class="px-4 py-3">' + dueDateHtml + '</td>' +
      '<td class="px-4 py-3"><div class="flex flex-wrap gap-1">';
    
    (task.tags || []).forEach(tag => {
      html += '<span class="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">' + escapeHtml(tag) + '</span>';
    });
    
    html += '</div></td></tr>';
  });
  
  tbody.innerHTML = html;
  
  // Update bulk actions bar
  updateBulkActionsBar();
  
  // Update task focus after render
  updateTaskFocus();
}

function getFilteredTasks() {
  let tasks = [...state.tasks];
  
  const statusFilter = document.getElementById('filter-status')?.value;
  const priorityFilter = document.getElementById('filter-priority')?.value;
  const sortBy = document.getElementById('sort-by')?.value || 'position';
  
  if (statusFilter) {
    tasks = tasks.filter(t => t.column_id === statusFilter);
  }
  
  if (priorityFilter) {
    tasks = tasks.filter(t => t.priority === priorityFilter);
  }
  
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'updated_at':
        return new Date(b.updated_at) - new Date(a.updated_at);
      default:
        return a.position - b.position;
    }
  });
  
  return tasks;
}

function applyFilters() {
  renderList();
}

// ===================================
// View Management
// ===================================

function setView(view) {
  state.currentView = view;
  
  document.getElementById('board-view').classList.toggle('hidden', view !== 'board');
  document.getElementById('list-view').classList.toggle('hidden', view !== 'list');
  document.getElementById('calendar-view').classList.toggle('hidden', view !== 'calendar');
  
  // Hide scrollbar and scroll indicators when not in board view
  const scrollbar = document.getElementById('board-scrollbar');
  const leftIndicator = document.getElementById('scroll-indicator-left');
  const rightIndicator = document.getElementById('scroll-indicator-right');
  
  if (scrollbar) {
    scrollbar.classList.toggle('hidden', view !== 'board');
    if (view === 'board') {
      setTimeout(updateBoardScrollbar, 50);
    }
  }
  
  // Hide scroll indicators in list view
  if (leftIndicator) leftIndicator.classList.toggle('hidden', view !== 'board');
  if (rightIndicator) rightIndicator.classList.toggle('hidden', view !== 'board');
  
  const boardBtn = document.getElementById('btn-board-view');
  const listBtn = document.getElementById('btn-list-view');
  const calendarBtn = document.getElementById('btn-calendar-view');
  
  // Update button states
  const activeClass = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400';
  
  boardBtn.className = view === 'board' ? activeClass : inactiveClass;
  listBtn.className = view === 'list' ? activeClass : inactiveClass;
  if (calendarBtn) {
    calendarBtn.className = view === 'calendar' ? activeClass : inactiveClass;
  }
  
  // Render calendar when switching to calendar view
  if (view === 'calendar') {
    renderCalendar();
  }
}

// ===================================
// Calendar View
// ===================================

function setCalendarView(view) {
  state.calendarView = view;
  
  const monthBtn = document.getElementById('btn-month-view');
  const weekBtn = document.getElementById('btn-week-view');
  
  const activeClass = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-white dark:bg-gray-600 shadow-sm';
  const inactiveClass = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 dark:text-gray-400';
  
  if (monthBtn) monthBtn.className = view === 'month' ? activeClass : inactiveClass;
  if (weekBtn) weekBtn.className = view === 'week' ? activeClass : inactiveClass;
  
  renderCalendar();
}

function calendarPrevious() {
  if (state.calendarView === 'month') {
    state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1);
  } else {
    state.calendarDate = new Date(state.calendarDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  renderCalendar();
}

function calendarNext() {
  if (state.calendarView === 'month') {
    state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1);
  } else {
    state.calendarDate = new Date(state.calendarDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  renderCalendar();
}

function calendarToday() {
  state.calendarDate = new Date();
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('calendar-grid');
  const titleEl = document.getElementById('calendar-title');
  
  if (!container) return;
  
  if (state.calendarView === 'month') {
    renderMonthView(container, titleEl);
  } else {
    renderWeekView(container, titleEl);
  }
}

function renderMonthView(container, titleEl) {
  const date = state.calendarDate;
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Update title
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  if (titleEl) {
    titleEl.textContent = monthNames[month] + ' ' + year;
  }
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // Get days from previous month to fill in
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  // Get tasks with due dates
  const tasksWithDueDates = state.tasks.filter(t => t.due_date && !t.archived_at && !t.deleted_at);
  
  // Build calendar grid
  let html = '<div class="calendar-weekdays">' +
    '<div class="calendar-weekday">Sun</div>' +
    '<div class="calendar-weekday">Mon</div>' +
    '<div class="calendar-weekday">Tue</div>' +
    '<div class="calendar-weekday">Wed</div>' +
    '<div class="calendar-weekday">Thu</div>' +
    '<div class="calendar-weekday">Fri</div>' +
    '<div class="calendar-weekday">Sat</div>' +
  '</div>';
  
  html += '<div class="calendar-days">';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const colorMode = document.getElementById('calendar-color-mode')?.value || 'priority';
  
  // Calculate total cells needed (6 rows max)
  const totalCells = 42;
  
  for (let i = 0; i < totalCells; i++) {
    let dayNumber;
    let isOtherMonth = false;
    let cellDate;
    
    if (i < startDayOfWeek) {
      // Previous month
      dayNumber = daysInPrevMonth - startDayOfWeek + i + 1;
      cellDate = new Date(year, month - 1, dayNumber);
      isOtherMonth = true;
    } else if (i >= startDayOfWeek + daysInMonth) {
      // Next month
      dayNumber = i - startDayOfWeek - daysInMonth + 1;
      cellDate = new Date(year, month + 1, dayNumber);
      isOtherMonth = true;
    } else {
      // Current month
      dayNumber = i - startDayOfWeek + 1;
      cellDate = new Date(year, month, dayNumber);
    }
    
    const cellDateStr = formatDateForApi(cellDate);
    const isToday = cellDate.getTime() === today.getTime();
    
    // Get tasks for this day
    const dayTasks = tasksWithDueDates.filter(t => {
      const taskDate = t.due_date.split('T')[0];
      return taskDate === cellDateStr;
    });
    
    let dayClasses = 'calendar-day';
    if (isOtherMonth) dayClasses += ' other-month';
    if (isToday) dayClasses += ' today';
    
    html += '<div class="' + dayClasses + '" data-date="' + cellDateStr + '" ondragover="handleCalendarDragOver(event)" ondragleave="handleCalendarDragLeave(event)" ondrop="handleCalendarDrop(event)" onclick="handleCalendarDayClick(event, \'' + cellDateStr + '\')">';
    html += '<div class="calendar-day-number">' + dayNumber + '</div>';
    html += '<div class="calendar-day-tasks">';
    
    const maxVisible = 3;
    dayTasks.slice(0, maxVisible).forEach(task => {
      const colorClass = getCalendarTaskColorClass(task, colorMode);
      html += '<div class="calendar-task ' + colorClass + '" data-task-id="' + task.id + '" draggable="true" ondragstart="handleCalendarTaskDragStart(event, \'' + task.id + '\')" ondragend="handleCalendarTaskDragEnd(event)" onclick="handleCalendarTaskClick(event, \'' + task.id + '\')" title="' + escapeHtml(task.title) + '">' + escapeHtml(task.title) + '</div>';
    });
    
    if (dayTasks.length > maxVisible) {
      html += '<div class="calendar-more-tasks" onclick="showDayTasksModal(\'' + cellDateStr + '\', event)">+' + (dayTasks.length - maxVisible) + ' more</div>';
    }
    
    html += '</div>';
    html += '<div class="calendar-day-add-hint"><i class="fas fa-plus"></i></div>';
    html += '</div>';
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function renderWeekView(container, titleEl) {
  const date = state.calendarDate;
  
  // Get start of week (Sunday)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  // Update title
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (titleEl) {
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      titleEl.textContent = monthNames[startOfWeek.getMonth()] + ' ' + startOfWeek.getDate() + ' - ' + endOfWeek.getDate() + ', ' + startOfWeek.getFullYear();
    } else {
      titleEl.textContent = monthNames[startOfWeek.getMonth()] + ' ' + startOfWeek.getDate() + ' - ' + monthNames[endOfWeek.getMonth()] + ' ' + endOfWeek.getDate() + ', ' + endOfWeek.getFullYear();
    }
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const colorMode = document.getElementById('calendar-color-mode')?.value || 'priority';
  
  // Get tasks with due dates
  const tasksWithDueDates = state.tasks.filter(t => t.due_date && !t.archived_at && !t.deleted_at);
  
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Build week header
  let html = '<div class="calendar-week-header">';
  html += '<div class="calendar-week-header-cell"></div>'; // Empty corner cell
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const isToday = dayDate.getTime() === today.getTime();
    
    html += '<div class="calendar-week-header-cell' + (isToday ? ' today' : '') + '">';
    html += '<div class="calendar-week-day-name">' + dayNames[i] + '</div>';
    html += '<div class="calendar-week-day-number">' + dayDate.getDate() + '</div>';
    html += '</div>';
  }
  html += '</div>';
  
  // Build week body with all-day section
  html += '<div class="calendar-week-body">';
  
  // All-day label
  html += '<div class="calendar-week-all-day-label">All Day</div>';
  
  // All-day tasks for each day
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const dayDateStr = formatDateForApi(dayDate);
    
    const dayTasks = tasksWithDueDates.filter(t => {
      const taskDate = t.due_date.split('T')[0];
      return taskDate === dayDateStr;
    });
    
    html += '<div class="calendar-week-all-day" data-date="' + dayDateStr + '" ondragover="handleCalendarDragOver(event)" ondragleave="handleCalendarDragLeave(event)" ondrop="handleCalendarDrop(event)" onclick="handleCalendarDayClick(event, \'' + dayDateStr + '\')">';
    
    dayTasks.forEach(task => {
      const colorClass = getCalendarTaskColorClass(task, colorMode);
      html += '<div class="calendar-task ' + colorClass + '" data-task-id="' + task.id + '" draggable="true" ondragstart="handleCalendarTaskDragStart(event, \'' + task.id + '\')" ondragend="handleCalendarTaskDragEnd(event)" onclick="handleCalendarTaskClick(event, \'' + task.id + '\')" title="' + escapeHtml(task.title) + '">' + escapeHtml(task.title) + '</div>';
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  
  container.innerHTML = html;
}

function getCalendarTaskColorClass(task, colorMode) {
  if (colorMode === 'priority') {
    return 'priority-' + task.priority;
  } else {
    // Color by project - use board index to assign colors
    const boardIndex = state.boards.findIndex(b => b.id === task.board_id);
    const colorIndex = boardIndex >= 0 ? boardIndex % 8 : 0;
    return 'project-color-' + colorIndex;
  }
}

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// Calendar drag and drop handlers
function handleCalendarTaskDragStart(e, taskId) {
  e.stopPropagation();
  state.calendarDraggedTaskId = taskId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'calendar-task:' + taskId);
}

function handleCalendarTaskDragEnd(e) {
  e.target.classList.remove('dragging');
  state.calendarDraggedTaskId = null;
  
  // Remove all drag-over classes
  document.querySelectorAll('.calendar-day.drag-over, .calendar-week-all-day.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleCalendarDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!state.calendarDraggedTaskId) return;
  
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleCalendarDragLeave(e) {
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
}

async function handleCalendarDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const taskId = state.calendarDraggedTaskId;
  if (!taskId) return;
  
  const targetDate = e.currentTarget.getAttribute('data-date');
  if (!targetDate) return;
  
  e.currentTarget.classList.remove('drag-over');
  
  // Find the task
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const previousDueDate = task.due_date;
  
  // Optimistic update
  task.due_date = targetDate;
  renderCalendar();
  
  // Track for undo
  UndoManager.push({
    type: 'task_update',
    taskId: taskId,
    description: 'Reschedule task "' + task.title + '"',
    previousState: { due_date: previousDueDate },
    newState: { due_date: targetDate }
  });
  
  // API call
  try {
    await api('/api/tasks/' + taskId, {
      method: 'PATCH',
      body: JSON.stringify({ due_date: targetDate })
    });
    showToast('Task rescheduled', 'success');
  } catch (error) {
    // Revert on error
    task.due_date = previousDueDate;
    renderCalendar();
    showToast('Failed to reschedule task', 'error');
  }
  
  state.calendarDraggedTaskId = null;
}

function handleCalendarTaskClick(e, taskId) {
  e.stopPropagation();
  openTaskModal(taskId);
}

function handleCalendarDayClick(e, dateStr) {
  // Only handle click if it's on the day cell itself, not on a task
  if (e.target.closest('.calendar-task') || e.target.closest('.calendar-more-tasks')) {
    return;
  }
  
  // Open new task modal with pre-filled date
  openNewTaskModalWithDate(dateStr);
}

function openNewTaskModalWithDate(dateStr) {
  // Store the element that had focus before opening modal
  state.previousActiveElement = document.activeElement;
  
  state.selectedTaskId = null;
  const defaultColumnId = state.columns[0]?.id || '';
  
  renderTaskModal({
    id: null,
    title: '',
    description: '',
    priority: 'medium',
    due_date: dateStr,
    tags: [],
    column_id: defaultColumnId,
    subtasks: []
  }, true);
  
  const modal = document.getElementById('task-modal');
  modal.classList.remove('hidden');
  
  // Set up focus trap after modal is visible
  setTimeout(() => {
    setupFocusTrap(modal);
    // Focus the first focusable element (title input)
    focusFirstElement(modal);
  }, 50);
}

function showDayTasksModal(dateStr, e) {
  e.stopPropagation();
  
  // Get tasks for this day
  const tasksWithDueDates = state.tasks.filter(t => t.due_date && !t.archived_at && !t.deleted_at);
  const dayTasks = tasksWithDueDates.filter(t => {
    const taskDate = t.due_date.split('T')[0];
    return taskDate === dateStr;
  });
  
  // Format the date for display
  const date = new Date(dateStr + 'T12:00:00');
  const dateDisplay = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  const colorMode = document.getElementById('calendar-color-mode')?.value || 'priority';
  
  // Create modal
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'day-tasks-overlay';
  
  let tasksHtml = '';
  dayTasks.forEach(task => {
    const priorityBadge = '<span class="px-2 py-0.5 text-xs rounded-full priority-' + task.priority + '">' + 
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1) + '</span>';
    const column = state.columns.find(c => c.id === task.column_id);
    const columnName = column ? column.name : 'Unknown';
    
    tasksHtml += '<div class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors" onclick="openTaskModal(\'' + task.id + '\'); document.getElementById(\'day-tasks-overlay\').remove();">' +
      '<div class="flex-1">' +
        '<div class="font-medium">' + escapeHtml(task.title) + '</div>' +
        '<div class="text-sm text-gray-500 dark:text-gray-400">' + escapeHtml(columnName) + '</div>' +
      '</div>' +
      priorityBadge +
    '</div>';
  });
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 480px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="flex items-center justify-between">' +
        '<div class="custom-dialog-title">' + dateDisplay + '</div>' +
        '<button onclick="this.closest(\'.custom-dialog-overlay\').remove()" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">' +
          '<i class="fas fa-times text-gray-500"></i>' +
        '</button>' +
      '</div>' +
      '<div class="custom-dialog-message">' + dayTasks.length + ' task' + (dayTasks.length !== 1 ? 's' : '') + ' scheduled</div>' +
    '</div>' +
    '<div class="custom-dialog-body" style="max-height: 400px; overflow-y: auto;">' +
      (tasksHtml || '<div class="text-center text-gray-500 dark:text-gray-400 py-4">No tasks scheduled</div>') +
    '</div>' +
    '<div class="custom-dialog-footer">' +
      '<button class="custom-dialog-btn custom-dialog-btn-secondary" onclick="this.closest(\'.custom-dialog-overlay\').remove()">Close</button>' +
      '<button class="custom-dialog-btn custom-dialog-btn-primary" onclick="this.closest(\'.custom-dialog-overlay\').remove(); openNewTaskModalWithDate(\'' + dateStr + '\');">' +
        '<i class="fas fa-plus mr-1"></i>Add Task' +
      '</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  // Close on backdrop click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

// ===================================
// Task Drag and Drop
// ===================================

function handleTaskDragStart(e) {
  e.stopPropagation();
  
  const taskCard = e.target.closest('[data-task-id]');
  if (!taskCard) return;
  
  state.draggedElement = taskCard;
  state.dragType = 'task';
  state.dragSourceId = taskCard.getAttribute('data-task-id');
  
  // Add dragging class after a small delay to show the ghost image first
  requestAnimationFrame(() => {
    taskCard.classList.add('dragging');
  });
  
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', 'task:' + state.dragSourceId);
  
  // Set custom drag image
  const rect = taskCard.getBoundingClientRect();
  e.dataTransfer.setDragImage(taskCard, rect.width / 2, 20);
}

function handleTaskDragEnd(e) {
  const taskCard = e.target.closest('[data-task-id]');
  if (taskCard) {
    taskCard.classList.remove('dragging');
  }
  
  cleanupAllDragStates();
  state.draggedElement = null;
  state.dragType = null;
  state.dragSourceId = null;
}

function handleTaskDragOver(e) {
  if (state.dragType !== 'task') return;
  
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  
  const columnContent = e.currentTarget;
  columnContent.classList.add('drag-over');
  
  // Remove drag-over from other columns
  document.querySelectorAll('.column-content').forEach(col => {
    if (col !== columnContent) {
      col.classList.remove('drag-over');
      const ph = col.querySelector('.drop-placeholder');
      if (ph) ph.remove();
    }
  });
  
  // Show drop placeholder
  const afterElement = getDropPosition(columnContent, e.clientY);
  let placeholder = columnContent.querySelector('.drop-placeholder');
  
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.className = 'drop-placeholder';
  }
  
  if (afterElement && afterElement !== state.draggedElement) {
    columnContent.insertBefore(placeholder, afterElement);
  } else {
    // If no afterElement or it's the dragged element, append to end
    const cards = columnContent.querySelectorAll('.task-card:not(.dragging)');
    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      if (lastCard.nextSibling !== placeholder) {
        columnContent.appendChild(placeholder);
      }
    } else {
      columnContent.appendChild(placeholder);
    }
  }
}

function handleTaskDragLeave(e) {
  if (state.dragType !== 'task') return;
  
  e.stopPropagation();
  
  const columnContent = e.currentTarget;
  const relatedTarget = e.relatedTarget;
  
  // Only clean up if we're really leaving the column
  if (!relatedTarget || !columnContent.contains(relatedTarget)) {
    columnContent.classList.remove('drag-over');
    const placeholder = columnContent.querySelector('.drop-placeholder');
    if (placeholder) placeholder.remove();
  }
}

async function handleTaskDrop(e) {
  if (state.dragType !== 'task') return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const columnContent = e.currentTarget;
  const targetColumnId = columnContent.getAttribute('data-column-id');
  const taskId = state.dragSourceId;
  
  if (!taskId) return;
  
  // Capture previous state for undo
  const task = state.tasks.find(t => t.id === taskId);
  const previousColumnId = task ? task.column_id : null;
  const previousPosition = task ? task.position : 0;
  const taskTitle = task ? task.title : 'Task';
  
  // Calculate new position
  const tasksInColumn = state.tasks.filter(t => t.column_id === targetColumnId && t.id !== taskId)
    .sort((a, b) => a.position - b.position);
  
  const placeholder = columnContent.querySelector('.drop-placeholder');
  let newPosition;
  
  if (placeholder) {
    // Find position based on placeholder location
    const cards = [...columnContent.querySelectorAll('.task-card:not(.dragging)')];
    const placeholderIndex = [...columnContent.children].indexOf(placeholder);
    
    // Count cards before placeholder
    let cardsBeforePlaceholder = 0;
    for (let i = 0; i < placeholderIndex; i++) {
      if (columnContent.children[i].classList.contains('task-card') && 
          !columnContent.children[i].classList.contains('dragging')) {
        cardsBeforePlaceholder++;
      }
    }
    
    if (cardsBeforePlaceholder === 0) {
      // Inserting at the beginning
      newPosition = tasksInColumn.length > 0 ? tasksInColumn[0].position - 1 : 0;
    } else if (cardsBeforePlaceholder >= tasksInColumn.length) {
      // Inserting at the end
      newPosition = tasksInColumn.length > 0 
        ? tasksInColumn[tasksInColumn.length - 1].position + 1 
        : 0;
    } else {
      // Inserting in the middle
      const beforeTask = tasksInColumn[cardsBeforePlaceholder - 1];
      const afterTask = tasksInColumn[cardsBeforePlaceholder];
      newPosition = (beforeTask.position + afterTask.position) / 2;
    }
  } else {
    // Default: append to end
    newPosition = tasksInColumn.length > 0 
      ? Math.max(...tasksInColumn.map(t => t.position)) + 1 
      : 0;
  }
  
  // Optimistic update
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    state.tasks[taskIndex].column_id = targetColumnId;
    state.tasks[taskIndex].position = newPosition;
  }
  
  // Clean up and re-render
  cleanupAllDragStates();
  state.draggedElement = null;
  state.dragType = null;
  state.dragSourceId = null;
  renderBoard();
  renderList();
  renderCalendar();
  
  // API call
  try {
    await api('/api/tasks/' + taskId, {
      method: 'PATCH',
      body: JSON.stringify({
        column_id: targetColumnId,
        position: newPosition
      })
    });
    
    // Track for undo (only if position actually changed)
    if (previousColumnId !== targetColumnId || previousPosition !== newPosition) {
      UndoManager.push({
        type: 'task_move',
        taskId: taskId,
        description: 'Move task "' + taskTitle + '"',
        previousColumnId: previousColumnId,
        previousPosition: previousPosition,
        newColumnId: targetColumnId,
        newPosition: newPosition
      });
    }
    
    showToastWithUndo('Task moved', 'success');
  } catch (error) {
    console.error('Failed to move task:', error);
    showToast('Failed to move task', 'error');
    await loadBoard();
  }
}

function getDropPosition(container, y) {
  const cards = [...container.querySelectorAll('.task-card:not(.dragging)')];
  
  for (const card of cards) {
    const box = card.getBoundingClientRect();
    const midY = box.top + box.height / 2;
    
    if (y < midY) {
      return card;
    }
  }
  
  return null;
}

// ===================================
// Column Drag and Drop
// ===================================

function handleColumnDragOver(e) {
  // Handle both column and task drags over columns
  if (state.dragType === 'task') {
    // Let task drag over handle it
    return;
  }
  
  if (state.dragType !== 'column') return;
  
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'move';
  
  const column = e.currentTarget;
  const columnId = column.getAttribute('data-column-id');
  
  if (columnId === state.dragSourceId) return;
  
  // Remove indicators from all columns
  document.querySelectorAll('.column').forEach(col => {
    col.classList.remove('column-drag-left', 'column-drag-right');
  });
  
  // Add indicator based on cursor position
  const box = column.getBoundingClientRect();
  const midX = box.left + box.width / 2;
  
  if (e.clientX < midX) {
    column.classList.add('column-drag-left');
  } else {
    column.classList.add('column-drag-right');
  }
}

function handleColumnDragLeave(e) {
  if (state.dragType !== 'column') return;
  
  e.stopPropagation();
  
  const column = e.currentTarget;
  const relatedTarget = e.relatedTarget;
  
  // Only remove indicators if truly leaving the column
  if (!relatedTarget || !column.contains(relatedTarget)) {
    column.classList.remove('column-drag-left', 'column-drag-right');
  }
}

async function handleColumnDrop(e) {
  console.log('Column drop - dragType:', state.dragType);
  
  if (state.dragType !== 'column') return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const targetColumn = e.currentTarget;
  const targetColumnId = targetColumn.getAttribute('data-column-id');
  const draggedColumnId = state.dragSourceId;
  
  console.log('Dropping column', draggedColumnId, 'onto', targetColumnId);
  
  if (targetColumnId === draggedColumnId) return;
  
  // Determine position
  const box = targetColumn.getBoundingClientRect();
  const dropAfter = e.clientX > box.left + box.width / 2;
  
  const sortedColumns = [...state.columns].sort((a, b) => a.position - b.position);
  const draggedCol = sortedColumns.find(c => c.id === draggedColumnId);
  const targetCol = sortedColumns.find(c => c.id === targetColumnId);
  const targetIndex = sortedColumns.indexOf(targetCol);
  
  // Capture previous position for undo
  const previousPosition = draggedCol ? draggedCol.position : 0;
  const columnName = draggedCol ? draggedCol.name : 'Column';
  
  let newPosition;
  if (dropAfter) {
    const nextCol = sortedColumns[targetIndex + 1];
    if (nextCol && nextCol.id !== draggedColumnId) {
      newPosition = (targetCol.position + nextCol.position) / 2;
    } else {
      newPosition = targetCol.position + 1;
    }
  } else {
    const prevCol = sortedColumns[targetIndex - 1];
    if (prevCol && prevCol.id !== draggedColumnId) {
      newPosition = (prevCol.position + targetCol.position) / 2;
    } else {
      newPosition = targetCol.position - 1;
    }
  }
  
  // Optimistic update
  const colIndex = state.columns.findIndex(c => c.id === draggedColumnId);
  if (colIndex !== -1) {
    state.columns[colIndex].position = newPosition;
  }
  
  // Clean up and re-render
  cleanupAllDragStates();
  state.draggedElement = null;
  state.dragType = null;
  state.dragSourceId = null;
  renderBoard();
  
  // API call
  try {
    await api('/api/columns/' + draggedColumnId, {
      method: 'PATCH',
      body: JSON.stringify({ position: newPosition })
    });
    
    // Track for undo
    UndoManager.push({
      type: 'column_move',
      columnId: draggedColumnId,
      description: 'Move column "' + columnName + '"',
      previousPosition: previousPosition,
      newPosition: newPosition
    });
    
    showToastWithUndo('Column moved', 'success');
  } catch (error) {
    console.error('Failed to move column:', error);
    showToast('Failed to move column', 'error');
    await loadBoard();
  }
}

function cleanupAllDragStates() {
  document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.dragging-column').forEach(el => el.classList.remove('dragging-column'));
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
  document.querySelectorAll('.column-drag-left').forEach(el => el.classList.remove('column-drag-left'));
  document.querySelectorAll('.column-drag-right').forEach(el => el.classList.remove('column-drag-right'));
}

// ===================================
// Task Operations
// ===================================
// Focus Trap for Modals
// ===================================

function getFocusableElements(container) {
  // Select all focusable elements within the container
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');
  
  const elements = Array.from(container.querySelectorAll(focusableSelectors));
  
  // Filter out hidden elements
  return elements.filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           !el.hasAttribute('disabled') &&
           (el.offsetWidth > 0 || el.offsetHeight > 0);
  });
}

function focusFirstElement(container) {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
}

function setupFocusTrap(modal) {
  // Remove any existing focus trap
  removeFocusTrap();
  
  const handleKeyDown = (e) => {
    // Only handle Tab key
    if (e.key !== 'Tab') return;
    
    const focusableElements = getFocusableElements(modal);
    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;
    
    // Check if focus is within the modal
    const isFocusInModal = modal.contains(activeElement);
    if (!isFocusInModal) {
      // Focus escaped, bring it back to first element
      e.preventDefault();
      firstElement.focus();
      return;
    }
    
    // Handle Tab navigation
    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  // Store the handler so we can remove it later
  state.modalFocusTrap = handleKeyDown;
  
  // Add event listener
  modal.addEventListener('keydown', handleKeyDown);
  
  // Also handle clicks outside modal to prevent focus escape
  const handleClick = (e) => {
    // If clicking on backdrop, don't let focus escape
    if (e.target.classList.contains('modal-backdrop')) {
      const focusableElements = getFocusableElements(modal);
      if (focusableElements.length > 0 && !modal.contains(document.activeElement)) {
        focusableElements[0].focus();
      }
    }
  };
  
  modal.addEventListener('click', handleClick);
  
  // Store click handler too
  state.modalFocusTrapClick = handleClick;
}

function removeFocusTrap() {
  const modal = document.getElementById('task-modal');
  if (!modal) return;
  
  if (state.modalFocusTrap) {
    modal.removeEventListener('keydown', state.modalFocusTrap);
    state.modalFocusTrap = null;
  }
  
  if (state.modalFocusTrapClick) {
    modal.removeEventListener('click', state.modalFocusTrapClick);
    state.modalFocusTrapClick = null;
  }
}

function openNewTaskModal() {
  // Store the element that had focus before opening modal
  state.previousActiveElement = document.activeElement;
  
  state.selectedTaskId = null;
  const defaultColumnId = state.columns[0]?.id || '';
  
  renderTaskModal({
    id: null,
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    tags: [],
    column_id: defaultColumnId,
    subtasks: []
  }, true);
  
  const modal = document.getElementById('task-modal');
  modal.classList.remove('hidden');
  
  // Set up focus trap after modal is visible
  setTimeout(() => {
    setupFocusTrap(modal);
    // Focus the first focusable element (title input)
    focusFirstElement(modal);
  }, 50);
}

function openTaskModal(taskId) {
  let task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  // Store the element that had focus before opening modal
  state.previousActiveElement = document.activeElement;
  
  state.selectedTaskId = taskId;
  
  // Show modal immediately with basic data (optimistic)
  renderTaskModal(task, false);
  const modal = document.getElementById('task-modal');
  modal.classList.remove('hidden');
  
  // Set up focus trap after modal is visible
  setTimeout(() => {
    setupFocusTrap(modal);
    // Focus the first focusable element in the modal
    focusFirstElement(modal);
  }, 50);
  
  // Lazy load full task details if not already loaded
  if (!task._detailsLoaded) {
    // Show loading indicator for subtasks/comments
    const subtasksContainer = document.getElementById('subtasks-list');
    const commentsContainer = document.getElementById('comments-list');
    
    if (subtasksContainer && !task.subtasks?.length) {
      subtasksContainer.innerHTML = '<div class="text-center text-gray-400 py-2"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>';
    }
    if (commentsContainer) {
      commentsContainer.innerHTML = '<div class="text-center text-gray-400 py-2"><i class="fas fa-spinner fa-spin mr-2"></i>Loading comments...</div>';
    }
    
    // Load full details
    LazyLoader.loadTaskDetails(taskId)
      .then(fullTask => {
        // Re-render modal with full details if still open
        if (state.selectedTaskId === taskId) {
          const updatedTask = state.tasks.find(t => t.id === taskId);
          if (updatedTask) {
            renderTaskModal(updatedTask, false);
          }
        }
      })
      .catch(error => {
        console.error('Failed to load task details:', error);
        // Keep showing basic data, don't show error for non-critical failure
      });
  }
}

function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  const backdrop = modal.querySelector('.modal-backdrop');
  const content = modal.querySelector('.modal-content');
  
  // Remove focus trap
  removeFocusTrap();
  
  // Add closing animation
  backdrop.classList.add('closing');
  content.classList.add('closing');
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.classList.add('hidden');
    backdrop.classList.remove('closing');
    content.classList.remove('closing');
    state.selectedTaskId = null;
    
    // Restore focus to the element that had focus before modal opened
    if (state.previousActiveElement && typeof state.previousActiveElement.focus === 'function') {
      state.previousActiveElement.focus();
    }
    state.previousActiveElement = null;
  }, 150);
}

function renderTaskModal(task, isNew) {
  const modal = document.getElementById('task-modal-content');
  
  let columnsOptions = '';
  state.columns.forEach(col => {
    columnsOptions += '<option value="' + col.id + '"' + (col.id === task.column_id ? ' selected' : '') + '>' + escapeHtml(col.name) + '</option>';
  });
  
  let subtasksHtml = '';
  if (!isNew && task.subtasks) {
    task.subtasks.forEach(sub => {
      subtasksHtml += '<div class="subtask-item group">' +
        '<input type="checkbox"' + (sub.is_completed ? ' checked' : '') + ' onchange="toggleSubtask(\'' + sub.id + '\', this.checked)" class="w-4 h-4 text-accent rounded focus:ring-accent">' +
        '<span class="' + (sub.is_completed ? 'line-through text-gray-400' : '') + ' flex-1 text-sm">' + escapeHtml(sub.title) + '</span>' +
        '<button type="button" onclick="deleteSubtask(\'' + sub.id + '\')" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-1">' +
        '<i class="fas fa-trash-alt text-xs"></i></button></div>';
    });
  }
  
  // Modal header
  let html = '<form id="task-form" onsubmit="saveTask(event)">' +
    '<div class="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">' +
    '<div class="flex items-center gap-3">' +
    '<div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">' +
    '<i class="fas ' + (isNew ? 'fa-plus' : 'fa-edit') + ' text-accent"></i></div>' +
    '<div><h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">' + (isNew ? 'New Task' : 'Edit Task') + '</h2>' +
    '<p class="text-xs text-gray-500 dark:text-gray-400">' + (isNew ? 'Create a new task' : 'Update task details') + '</p></div></div>' +
    '<button type="button" onclick="closeTaskModal()" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">' +
    '<i class="fas fa-times"></i></button></div>' +
    
    // Modal body - scrollable
    '<div class="task-modal-body">' +
    '<input type="hidden" name="id" value="' + (task.id || '') + '">' +
    
    // Title field
    '<div class="mb-5">' +
    '<label class="task-field-label required">Title</label>' +
    '<input type="text" name="title" value="' + escapeHtml(task.title) + '" required class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent text-base" placeholder="What needs to be done?"></div>' +
    
    // Description field
    '<div class="mb-5">' +
    '<label class="task-field-label">Description</label>' +
    '<textarea name="description" rows="3" class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm" placeholder="Add more details...">' + escapeHtml(task.description || '') + '</textarea></div>' +
    
    // Details section (Status, Priority, Due Date)
    '<div class="task-form-section">' +
    '<div class="task-form-section-title"><i class="fas fa-sliders-h"></i>Details</div>' +
    '<div class="task-details-grid">' +
    '<div><label class="task-field-label">Status</label>' +
    '<select name="column_id" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent text-sm">' + columnsOptions + '</select></div>' +
    '<div><label class="task-field-label">Priority</label>' +
    '<select name="priority" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent text-sm">' +
    '<option value="low"' + (task.priority === 'low' ? ' selected' : '') + '>Low</option>' +
    '<option value="medium"' + (task.priority === 'medium' ? ' selected' : '') + '>Medium</option>' +
    '<option value="high"' + (task.priority === 'high' ? ' selected' : '') + '>High</option></select></div></div>' +
    
    // Due Date within details section
    '<div class="date-picker-container mt-4">' +
    '<label class="task-field-label">Due Date</label>' +
    '<input type="hidden" id="due-date-hidden" name="due_date" value="' + (task.due_date ? task.due_date.split('T')[0] : '') + '">' +
    '<div class="date-input-wrapper">' +
    '<input type="text" id="due-date-display" readonly class="date-picker-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer text-sm" placeholder="Select date..." value="' + (task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", {weekday: "short", month: "short", day: "numeric", year: "numeric"}) : '') + '">' +
    '<div class="calendar-icon-btn"><i class="fas fa-calendar-alt"></i></div>' +
    '</div></div></div>' +
    
    // Recurrence & Tags section
    '<div class="task-form-section">' +
    '<div class="task-form-section-title"><i class="fas fa-sync-alt"></i>Recurrence</div>' +
    buildRecurrenceUI(task) + '</div>' +
    
    // Tags field
    '<div class="task-form-section">' +
    '<div class="task-form-section-title"><i class="fas fa-tags"></i>Tags</div>' +
    '<div class="tags-input-container">' +
    '<i class="fas fa-hashtag tags-icon"></i>' +
    '<input type="text" name="tags" value="' + (task.tags || []).join(', ') + '" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent text-sm" placeholder="design, urgent, frontend...">' +
    '</div></div>';
  
  // Subtasks section (edit mode only)
  if (!isNew) {
    const subtaskCount = task.subtasks ? task.subtasks.length : 0;
    const completedCount = task.subtasks ? task.subtasks.filter(s => s.is_completed).length : 0;
    
    html += '<div class="subtasks-section">' +
      '<div class="task-form-section-title"><i class="fas fa-tasks"></i>Subtasks' +
      (subtaskCount > 0 ? '<span class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(' + completedCount + '/' + subtaskCount + ')</span>' : '') + '</div>' +
      '<div id="subtasks-list">' + (subtasksHtml || '<div class="empty-state-message"><i class="fas fa-check-circle"></i>No subtasks yet</div>') + '</div>' +
      '<div class="subtask-add-row">' +
      '<input type="text" id="new-subtask-input" placeholder="Add a subtask..." class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent focus:border-transparent" onkeypress="if(event.key===\'Enter\'){event.preventDefault();addSubtask();}">' +
      '<button type="button" onclick="addSubtask()" class="px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"><i class="fas fa-plus mr-1"></i>Add</button></div></div>';
    
    // Comments Section
    html += '<div class="comments-section">' +
      '<div class="task-form-section-title"><i class="fas fa-comments"></i>Comments' +
      '<span id="comment-count-badge" class="ml-2 text-xs font-normal bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"></span></div>' +
      '<div id="comments-list" class="space-y-2 mb-3 max-h-48 overflow-y-auto">' +
      '<div class="empty-state-message"><i class="fas fa-spinner fa-spin"></i>Loading comments...</div></div>' +
      '<div class="comment-input-wrapper">' +
      '<textarea id="new-comment-input" placeholder="Write a comment..." rows="2" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent focus:border-transparent resize-none"></textarea>' +
      '<button type="button" onclick="addComment()" class="comment-send-btn bg-accent text-white hover:bg-accent-hover transition-colors" title="Send comment"><i class="fas fa-paper-plane"></i></button></div></div>';
    
    // Activity Log Section
    html += '<div class="activity-section">' +
      '<div class="activity-header">' +
      '<div class="task-form-section-title" style="margin-bottom:0"><i class="fas fa-history"></i>Activity</div>' +
      '<select id="activity-filter" class="activity-filter-select" onchange="filterActivityLog(\'' + task.id + '\', this.value)">' +
      '<option value="">All</option>' +
      '<option value="created">Created</option>' +
      '<option value="moved">Moved</option>' +
      '<option value="edited">Edited</option>' +
      '<option value="priority_changed">Priority</option>' +
      '<option value="due_date_set">Due Date</option>' +
      '<option value="tag_added">Tags</option>' +
      '<option value="subtask_completed">Subtasks</option>' +
      '<option value="comment_added">Comments</option></select></div>' +
      '<div id="activity-log-list" class="activity-timeline max-h-48 overflow-y-auto">' +
      '<div class="empty-state-message"><i class="fas fa-spinner fa-spin"></i>Loading activity...</div></div></div>';
  }
  
  html += '</div>' +
    
    // Modal footer
    '<div class="task-modal-footer"><div class="action-buttons">';
  
  if (!isNew) {
    // Add skip button for recurring tasks
    if (task.recurrence_rule) {
      html += '<button type="button" onclick="skipRecurringOccurrence(\'' + task.id + '\')" class="px-3 py-2 text-accent hover:bg-accent/10 rounded-lg transition-colors text-sm" title="Skip to next occurrence"><i class="fas fa-forward mr-1"></i>Skip</button>';
    }
    html += '<button type="button" onclick="archiveTask(\'' + task.id + '\'); closeTaskModal();" class="px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm" title="Archive task"><i class="fas fa-archive"></i></button>';
    html += '<button type="button" onclick="deleteTask(\'' + task.id + '\')" class="px-3 py-2 btn-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"><i class="fas fa-trash"></i></button>';
  }
  
  html += '</div><div class="primary-buttons">' +
    '<button type="button" onclick="closeTaskModal()" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium">Cancel</button>' +
    '<button type="submit" class="px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"><i class="fas ' + (isNew ? 'fa-plus' : 'fa-check') + ' mr-1.5"></i>' + (isNew ? 'Create Task' : 'Save Changes') + '</button></div></div></form>';
  
  modal.innerHTML = html;
  
  // Initialize custom UI components
  setTimeout(function() {
    // Initialize custom selects for Status, Priority, and Recurrence
    const modalSelects = modal.querySelectorAll('select:not([data-customized])');
    modalSelects.forEach(initCustomSelect);
    
    // Initialize custom date picker (modal mode)
    initDatePicker('due-date-display', 'due-date-hidden', task.due_date || null, { useModal: true });
    
    // Initialize recurrence UI
    initRecurrenceUI();
    
    // Initialize custom select for activity filter
    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
      initCustomSelect(activityFilter);
    }
    
    // Load activity log and comments for existing tasks
    if (!isNew && task.id) {
      loadTaskActivityLog(task.id);
      loadTaskComments(task.id);
    }
  }, 0);
}

// Filter activity log by action type
async function filterActivityLog(taskId, action) {
  try {
    const url = action 
      ? `/api/tasks/${taskId}/activity?action=${encodeURIComponent(action)}&limit=50`
      : `/api/tasks/${taskId}/activity?limit=50`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.data) {
      renderActivityLog(result.data);
    }
  } catch (error) {
    console.error('Error filtering activity log:', error);
  }
}

async function saveTask(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const taskId = formData.get('id');
  const isNew = !taskId;
  
  const tagsValue = formData.get('tags');
  const recurrenceRule = buildRecurrenceRule();
  const recurrenceEndInfo = getRecurrenceEndInfo();
  
  const data = {
    title: formData.get('title'),
    description: formData.get('description') || null,
    column_id: formData.get('column_id'),
    priority: formData.get('priority'),
    due_date: formData.get('due_date') || null,
    tags: tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(Boolean) : [],
    recurrence_rule: recurrenceRule,
    recurrence_end_date: recurrenceEndInfo.endDate,
    recurrence_count: recurrenceEndInfo.count
  };
  
  // Capture previous state for undo (for updates)
  let previousState = null;
  if (!isNew) {
    const existingTask = state.tasks.find(t => t.id === taskId);
    if (existingTask) {
      previousState = {
        title: existingTask.title,
        description: existingTask.description,
        column_id: existingTask.column_id,
        priority: existingTask.priority,
        due_date: existingTask.due_date,
        tags: existingTask.tags,
        recurrence_rule: existingTask.recurrence_rule,
        recurrence_end_date: existingTask.recurrence_end_date,
        recurrence_count: existingTask.recurrence_count
      };
    }
  }
  
  try {
    if (isNew) {
      const result = await api('/api/boards/' + state.currentBoardId + '/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // Track for undo
      UndoManager.push({
        type: 'task_create',
        taskId: result.id,
        description: 'Create task "' + data.title + '"',
        newState: data
      });
      
      showToastWithUndo('Task created', 'success');
    } else {
      await api('/api/tasks/' + taskId, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      
      // Track for undo
      if (previousState) {
        UndoManager.push({
          type: 'task_update',
          taskId: taskId,
          description: 'Update task "' + data.title + '"',
          previousState: previousState,
          newState: data
        });
      }
      
      showToastWithUndo('Task updated', 'success');
    }
    
    closeTaskModal();
    await loadBoard();
    
  } catch (error) {
    console.error('Failed to save task:', error);
    showToast('Failed to save task', 'error');
  }
}

async function deleteTask(taskId) {
  const confirmed = await customConfirm(
    'Delete Task',
    'Are you sure you want to move this task to trash?',
    { confirmText: 'Delete', danger: true }
  );
  if (!confirmed) return;
  
  // Capture task state for undo
  const task = state.tasks.find(t => t.id === taskId);
  const taskTitle = task ? task.title : 'Task';
  
  try {
    await api('/api/tasks/' + taskId, { method: 'DELETE' });
    
    // Track for undo
    UndoManager.push({
      type: 'task_delete',
      taskId: taskId,
      description: 'Delete task "' + taskTitle + '"'
    });
    
    showToastWithUndo('Task moved to trash', 'success');
    closeTaskModal();
    await loadBoard();
    updateTrashCount();
  } catch (error) {
    console.error('Failed to delete task:', error);
    showToast('Failed to delete task', 'error');
  }
}

async function quickAddTask(columnId) {
  const title = await customPrompt(
    'Quick Add Task',
    'Enter a title for the new task',
    { placeholder: 'Task title...', confirmText: 'Create' }
  );
  if (!title) return;
  
  // Generate temporary ID for optimistic update
  const tempId = generateTempId();
  const rollbackKey = `quick_add_${tempId}`;
  
  // Calculate position for new task
  const columnTasks = state.tasks.filter(t => t.column_id === columnId);
  const maxPosition = columnTasks.length > 0 
    ? Math.max(...columnTasks.map(t => t.position)) + 1 
    : 0;
  
  // Optimistic update - add task immediately
  const optimisticTask = OptimisticUI.createTask(tempId, {
    board_id: state.currentBoardId,
    column_id: columnId,
    title: title,
    description: '',
    priority: 'medium',
    tags: [],
    position: maxPosition,
    due_date: null
  });
  
  // Create snapshot for rollback
  OptimisticUI.snapshot(rollbackKey);
  
  // Re-render immediately to show new task
  renderBoard();
  renderList();
  showToast('Creating task...', 'info');
  
  try {
    const result = await api('/api/boards/' + state.currentBoardId + '/tasks', {
      method: 'POST',
      body: JSON.stringify({ column_id: columnId, title: title })
    });
    
    // Replace temporary task with real task
    OptimisticUI.replaceTask(tempId, result);
    OptimisticUI.commit(rollbackKey);
    
    // Invalidate cache
    await CacheManager.invalidate('boards', state.currentBoardId);
    
    // Track for undo
    UndoManager.push({
      type: 'task_create',
      taskId: result.id,
      description: 'Create task "' + title + '"',
      newState: { column_id: columnId, title: title }
    });
    
    // Re-render with real data
    renderBoard();
    renderList();
    showToastWithUndo('Task created', 'success');
    
  } catch (error) {
    console.error('Failed to create task:', error);
    
    // Rollback optimistic update
    OptimisticUI.removeOptimisticTask(tempId);
    OptimisticUI.rollback(rollbackKey);
    
    // Queue for later sync if offline
    if (!navigator.onLine) {
      await CacheManager.addPendingSync({
        type: 'create_task',
        url: '/api/boards/' + state.currentBoardId + '/tasks',
        method: 'POST',
        body: { column_id: columnId, title: title }
      });
      showToast('Task saved offline, will sync when online', 'warning');
    } else {
      showToast('Failed to create task', 'error');
    }
  }
}

async function updateTaskStatus(taskId, columnId) {
  const rollbackKey = `status_${taskId}_${Date.now()}`;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return;
  
  const previousColumnId = state.tasks[taskIndex].column_id;
  
  // Skip if no change
  if (previousColumnId === columnId) return;
  
  // Optimistic update
  OptimisticUI.snapshot(rollbackKey);
  state.tasks[taskIndex].column_id = columnId;
  renderBoard();
  renderList();
  
  try {
    await api('/api/tasks/' + taskId, {
      method: 'PATCH',
      body: JSON.stringify({ column_id: columnId })
    });
    
    OptimisticUI.commit(rollbackKey);
    
    // Invalidate task cache
    await LazyLoader.invalidate(taskId);
    
    showToast('Status updated', 'success');
  } catch (error) {
    console.error('Failed to update status:', error);
    
    // Rollback on error
    OptimisticUI.rollback(rollbackKey);
    showToast('Failed to update status', 'error');
  }
}

// ===================================
// Subtask Operations
// ===================================

async function addSubtask() {
  const input = document.getElementById('new-subtask-input');
  const title = input.value.trim();
  if (!title || !state.selectedTaskId) return;
  
  try {
    await api('/api/tasks/' + state.selectedTaskId + '/subtasks', {
      method: 'POST',
      body: JSON.stringify({ title: title })
    });
    
    input.value = '';
    await loadBoard();
    
    const task = state.tasks.find(t => t.id === state.selectedTaskId);
    if (task) renderTaskModal(task, false);
    
    showToast('Subtask added', 'success');
  } catch (error) {
    console.error('Failed to add subtask:', error);
    showToast('Failed to add subtask', 'error');
  }
}

async function toggleSubtask(subtaskId, isCompleted) {
  try {
    await api('/api/subtasks/' + subtaskId, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted })
    });
    
    await loadBoard();
    
    const task = state.tasks.find(t => t.id === state.selectedTaskId);
    if (task) renderTaskModal(task, false);
  } catch (error) {
    console.error('Failed to toggle subtask:', error);
    showToast('Failed to update subtask', 'error');
  }
}

async function deleteSubtask(subtaskId) {
  try {
    await api('/api/subtasks/' + subtaskId, { method: 'DELETE' });
    
    await loadBoard();
    
    const task = state.tasks.find(t => t.id === state.selectedTaskId);
    if (task) renderTaskModal(task, false);
    
    showToast('Subtask deleted', 'success');
  } catch (error) {
    console.error('Failed to delete subtask:', error);
    showToast('Failed to delete subtask', 'error');
  }
}

// ===================================
// Comment Operations
// ===================================

async function loadTaskComments(taskId) {
  try {
    const response = await fetch('/api/tasks/' + taskId + '/comments');
    const result = await response.json();
    
    if (result.success && result.data) {
      renderCommentsList(result.data);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
      commentsList.innerHTML = '<div class="text-center py-4 text-red-500 text-sm">Failed to load comments</div>';
    }
  }
}

function renderCommentsList(comments) {
  const commentsList = document.getElementById('comments-list');
  const countBadge = document.getElementById('comment-count-badge');
  
  if (!commentsList) return;
  
  // Update count badge
  if (countBadge) {
    countBadge.textContent = comments.length > 0 ? comments.length : '';
    countBadge.style.display = comments.length > 0 ? 'inline' : 'none';
  }
  
  if (comments.length === 0) {
    commentsList.innerHTML = '<div class="empty-state-message">' +
      '<i class="fas fa-comment-dots"></i>' +
      'No comments yet. Add one below!</div>';
    return;
  }
  
  let html = '';
  comments.forEach(comment => {
    const date = new Date(comment.created_at);
    const isEdited = comment.updated_at !== comment.created_at;
    const timeAgo = formatTimeAgo(date);
    const initial = (comment.author_name || 'U').charAt(0).toUpperCase();
    
    html += '<div class="comment-item group" data-comment-id="' + comment.id + '">' +
      '<div class="comment-avatar">' + initial + '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<div class="flex items-center gap-2 mb-1">' +
      '<span class="text-xs text-gray-500 dark:text-gray-400">' + timeAgo + (isEdited ? ' (edited)' : '') + '</span>' +
      '<div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-auto">' +
      '<button type="button" onclick="editComment(\'' + comment.id + '\')" class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Edit comment">' +
      '<i class="fas fa-pencil-alt text-xs"></i></button>' +
      '<button type="button" onclick="deleteComment(\'' + comment.id + '\')" class="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-400 hover:text-red-500" title="Delete comment">' +
      '<i class="fas fa-trash-alt text-xs"></i></button></div></div>' +
      '<div class="comment-content text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">' + escapeHtml(comment.content) + '</div>' +
      '</div></div>';
  });
  
  commentsList.innerHTML = html;
  
  // Scroll to bottom to show latest comments
  commentsList.scrollTop = commentsList.scrollHeight;
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function addComment() {
  const input = document.getElementById('new-comment-input');
  const content = input.value.trim();
  if (!content || !state.selectedTaskId) return;
  
  try {
    await api('/api/tasks/' + state.selectedTaskId + '/comments', {
      method: 'POST',
      body: JSON.stringify({ content: content })
    });
    
    input.value = '';
    
    // Reload comments
    loadTaskComments(state.selectedTaskId);
    
    // Reload board to update comment count on cards
    await loadBoard();
    
    showToast('Comment added', 'success');
  } catch (error) {
    console.error('Failed to add comment:', error);
    showToast('Failed to add comment', 'error');
  }
}

async function editComment(commentId) {
  const commentItem = document.querySelector('[data-comment-id="' + commentId + '"]');
  if (!commentItem) return;
  
  const contentEl = commentItem.querySelector('.comment-content');
  if (!contentEl) return;
  
  const currentContent = contentEl.textContent;
  
  // Replace content with editable textarea
  const editContainer = document.createElement('div');
  editContainer.className = 'comment-edit-container';
  editContainer.innerHTML = '<textarea class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent focus:border-transparent resize-none" rows="2">' + escapeHtml(currentContent) + '</textarea>' +
    '<div class="flex justify-end gap-2 mt-2">' +
    '<button type="button" onclick="cancelEditComment(\'' + commentId + '\', `' + escapeHtml(currentContent).replace(/`/g, '\\`') + '`)" class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">Cancel</button>' +
    '<button type="button" onclick="saveEditComment(\'' + commentId + '\')" class="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover">Save</button></div>';
  
  contentEl.replaceWith(editContainer);
  
  // Focus the textarea
  const textarea = editContainer.querySelector('textarea');
  if (textarea) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

function cancelEditComment(commentId, originalContent) {
  const commentItem = document.querySelector('[data-comment-id="' + commentId + '"]');
  if (!commentItem) return;
  
  const editContainer = commentItem.querySelector('.comment-edit-container');
  if (!editContainer) return;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'comment-content text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words';
  contentEl.textContent = originalContent;
  
  editContainer.replaceWith(contentEl);
}

async function saveEditComment(commentId) {
  const commentItem = document.querySelector('[data-comment-id="' + commentId + '"]');
  if (!commentItem) return;
  
  const textarea = commentItem.querySelector('textarea');
  if (!textarea) return;
  
  const newContent = textarea.value.trim();
  if (!newContent) {
    showToast('Comment cannot be empty', 'error');
    return;
  }
  
  try {
    await api('/api/comments/' + commentId, {
      method: 'PATCH',
      body: JSON.stringify({ content: newContent })
    });
    
    // Reload comments
    loadTaskComments(state.selectedTaskId);
    
    showToast('Comment updated', 'success');
  } catch (error) {
    console.error('Failed to update comment:', error);
    showToast('Failed to update comment', 'error');
  }
}

async function deleteComment(commentId) {
  const confirmed = await customConfirm(
    'Delete Comment',
    'Are you sure you want to delete this comment?',
    { confirmText: 'Delete', danger: true }
  );
  if (!confirmed) return;
  
  try {
    await api('/api/comments/' + commentId, { method: 'DELETE' });
    
    // Reload comments
    loadTaskComments(state.selectedTaskId);
    
    // Reload board to update comment count on cards
    await loadBoard();
    
    showToast('Comment deleted', 'success');
  } catch (error) {
    console.error('Failed to delete comment:', error);
    showToast('Failed to delete comment', 'error');
  }
}

// ===================================
// Column Operations
// ===================================

async function addColumn() {
  const name = await customPrompt(
    'New Column',
    'Enter a name for the new column',
    { placeholder: 'Column name...', confirmText: 'Create' }
  );
  if (!name) return;
  
  try {
    const result = await api('/api/boards/' + state.currentBoardId + '/columns', {
      method: 'POST',
      body: JSON.stringify({ name: name })
    });
    
    // Track for undo
    UndoManager.push({
      type: 'column_create',
      columnId: result.id,
      description: 'Create column "' + name + '"',
      newState: { name: name }
    });
    
    showToastWithUndo('Column created', 'success');
    await loadBoard();
  } catch (error) {
    console.error('Failed to create column:', error);
    showToast('Failed to create column', 'error');
  }
}

async function editColumn(columnId) {
  const column = state.columns.find(c => c.id === columnId);
  if (!column) return;
  
  // Show column edit dialog
  showColumnEditDialog(column);
}

async function showColumnEditDialog(column) {
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'column-edit-overlay';
  
  // Get current auto-archive settings (default to false/7 if not set)
  const autoArchive = column.auto_archive || false;
  const autoArchiveDays = column.auto_archive_days || 7;
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 400px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="custom-dialog-title">Edit Column</div>' +
      '<div class="custom-dialog-message">Update column settings</div>' +
    '</div>' +
    '<div class="custom-dialog-body">' +
      '<div class="mb-4">' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column Name</label>' +
        '<input type="text" class="custom-dialog-input" id="column-name-input" value="' + escapeHtml(column.name) + '" autofocus>' +
      '</div>' +
      '<div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">' +
        '<div class="flex items-center justify-between mb-3">' +
          '<div>' +
            '<label class="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-archive tasks</label>' +
            '<p class="text-xs text-gray-500 dark:text-gray-400">Automatically archive tasks after a set time</p>' +
          '</div>' +
          '<label class="relative inline-flex items-center cursor-pointer">' +
            '<input type="checkbox" id="auto-archive-toggle" class="sr-only peer" ' + (autoArchive ? 'checked' : '') + '>' +
            '<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent/50 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-accent"></div>' +
          '</label>' +
        '</div>' +
        '<div id="auto-archive-days-container" class="' + (autoArchive ? '' : 'hidden') + '">' +
          '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Archive after</label>' +
          '<div class="flex items-center gap-2">' +
            '<input type="number" id="auto-archive-days-input" class="custom-dialog-input" style="width: 80px;" value="' + autoArchiveDays + '" min="1" max="365">' +
            '<span class="text-sm text-gray-600 dark:text-gray-400">days</span>' +
          '</div>' +
          '<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasks unchanged for this long will be auto-archived</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="custom-dialog-footer" style="justify-content: space-between;">' +
      '<button class="custom-dialog-btn custom-dialog-btn-danger" id="column-delete-btn">' +
        '<i class="fas fa-trash mr-1"></i>Delete' +
      '</button>' +
      '<div style="display: flex; gap: 12px;">' +
        '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="column-cancel-btn">Cancel</button>' +
        '<button class="custom-dialog-btn custom-dialog-btn-primary" id="column-save-btn">Save</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  const input = document.getElementById('column-name-input');
  const autoArchiveToggle = document.getElementById('auto-archive-toggle');
  const autoArchiveDaysContainer = document.getElementById('auto-archive-days-container');
  const autoArchiveDaysInput = document.getElementById('auto-archive-days-input');
  
  input.focus();
  input.select();
  
  // Toggle auto-archive days visibility
  autoArchiveToggle.addEventListener('change', function() {
    if (this.checked) {
      autoArchiveDaysContainer.classList.remove('hidden');
    } else {
      autoArchiveDaysContainer.classList.add('hidden');
    }
  });
  
  function closeDialog() {
    overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
    overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
    setTimeout(function() { overlay.remove(); }, 150);
  }
  
  // Cancel
  document.getElementById('column-cancel-btn').addEventListener('click', closeDialog);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeDialog();
  });
  
  // Save
  document.getElementById('column-save-btn').addEventListener('click', async function() {
    const newName = input.value.trim();
    const newAutoArchive = autoArchiveToggle.checked;
    const newAutoArchiveDays = parseInt(autoArchiveDaysInput.value, 10) || 7;
    
    if (!newName) {
      showToast('Column name is required', 'error');
      return;
    }
    
    // Check if anything changed
    const nameChanged = newName !== column.name;
    const autoArchiveChanged = newAutoArchive !== (column.auto_archive || false);
    const daysChanged = newAutoArchiveDays !== (column.auto_archive_days || 7);
    
    if (!nameChanged && !autoArchiveChanged && !daysChanged) {
      closeDialog();
      return;
    }
    
    // Capture previous state for undo
    const previousState = {
      name: column.name,
      auto_archive: column.auto_archive || false,
      auto_archive_days: column.auto_archive_days || 7
    };
    
    try {
      const updateData = {};
      if (nameChanged) updateData.name = newName;
      if (autoArchiveChanged || daysChanged) {
        updateData.auto_archive = newAutoArchive;
        updateData.auto_archive_days = newAutoArchiveDays;
      }
      
      await api('/api/columns/' + column.id, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      
      // Track for undo
      UndoManager.push({
        type: 'column_update',
        columnId: column.id,
        description: 'Update column "' + newName + '"',
        previousState: previousState,
        newState: {
          name: newName,
          auto_archive: newAutoArchive,
          auto_archive_days: newAutoArchiveDays
        }
      });
      
      let message = 'Column updated';
      if (newAutoArchive && !column.auto_archive) {
        message = 'Auto-archive enabled for ' + newName;
      } else if (!newAutoArchive && column.auto_archive) {
        message = 'Auto-archive disabled';
      }
      
      showToastWithUndo(message, 'success');
      closeDialog();
      await loadBoard();
    } catch (error) {
      console.error('Failed to update column:', error);
      showToast('Failed to update column', 'error');
    }
  });
  
  // Enter key to save (only from name input)
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('column-save-btn').click();
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  });
  
  // Delete
  document.getElementById('column-delete-btn').addEventListener('click', async function() {
    closeDialog();
    
    const confirmed = await customConfirm(
      'Delete Column',
      'Are you sure you want to delete "' + column.name + '" and all its tasks?',
      { confirmText: 'Delete', danger: true }
    );
    
    if (!confirmed) return;
    
    try {
      await api('/api/columns/' + column.id, { method: 'DELETE' });
      
      // Track for undo
      UndoManager.push({
        type: 'column_delete',
        columnId: column.id,
        description: 'Delete column "' + column.name + '"'
      });
      
      showToastWithUndo('Column deleted', 'success');
      await loadBoard();
    } catch (error) {
      console.error('Failed to delete column:', error);
      showToast('Failed to delete column', 'error');
    }
  });
}

// ===================================
// Project Switcher
// ===================================

const PROJECT_ICONS = ['📋', '🚀', '💼', '🏠', '💡', '🎯', '📱', '🌟', '🔥', '💪', '🎨', '📊', '🛠️', '🎮', '📚', '🌈'];
const PROJECT_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];

// Board templates
const BOARD_TEMPLATES = [
  { 
    id: 'blank', 
    name: 'Blank', 
    description: 'Start from scratch',
    columns: [],
    icon: '📄'
  },
  { 
    id: 'simple', 
    name: 'Simple', 
    description: 'Basic task tracking',
    columns: ['Not Started', 'Completed'],
    icon: '✅'
  },
  { 
    id: 'basic', 
    name: 'Basic Kanban', 
    description: 'Standard workflow',
    columns: ['To Do', 'In Progress', 'Done'],
    icon: '📋'
  },
  { 
    id: 'extended', 
    name: 'Extended Kanban', 
    description: 'Full project management',
    columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'],
    icon: '🚀'
  }
];

// Background presets for board view
const SOLID_BACKGROUNDS = [
  { id: 'gray', value: '#f3f4f6', darkValue: '#111827', label: 'Default' },
  { id: 'slate', value: '#e2e8f0', darkValue: '#1e293b', label: 'Slate' },
  { id: 'green', value: '#dcfce7', darkValue: '#052e16', label: 'Green' },
  { id: 'blue', value: '#dbeafe', darkValue: '#172554', label: 'Blue' },
  { id: 'purple', value: '#f3e8ff', darkValue: '#2e1065', label: 'Purple' },
  { id: 'pink', value: '#fce7f3', darkValue: '#500724', label: 'Pink' },
  { id: 'amber', value: '#fef3c7', darkValue: '#451a03', label: 'Amber' },
  { id: 'cyan', value: '#cffafe', darkValue: '#083344', label: 'Cyan' }
];

const GRADIENT_BACKGROUNDS = [
  { id: 'ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: '🌊 Ocean' },
  { id: 'sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: '🌅 Sunset' },
  { id: 'forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', label: '🌲 Forest' },
  { id: 'grape', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', label: '🍇 Grape' },
  { id: 'blossom', value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)', label: '🌸 Blossom' },
  { id: 'night', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', label: '🌙 Night' },
  { id: 'sunrise', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', label: '☀️ Sunrise' },
  { id: 'fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', label: '🔥 Fire' }
];

function toggleProjectSwitcher() {
  state.projectSwitcherOpen = !state.projectSwitcherOpen;
  const dropdown = document.getElementById('project-switcher-dropdown');
  const btn = document.getElementById('project-switcher-btn');
  
  if (state.projectSwitcherOpen) {
    dropdown.classList.remove('hidden');
    btn.classList.add('open');
    renderProjectList();
    
    // Focus search input
    setTimeout(() => {
      const searchInput = document.getElementById('project-search-input');
      if (searchInput) searchInput.focus();
    }, 50);
    
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeProjectSwitcherOnOutsideClick);
    }, 0);
  } else {
    closeProjectSwitcher();
  }
}

function closeProjectSwitcher() {
  state.projectSwitcherOpen = false;
  const dropdown = document.getElementById('project-switcher-dropdown');
  const btn = document.getElementById('project-switcher-btn');
  
  if (dropdown) dropdown.classList.add('hidden');
  if (btn) btn.classList.remove('open');
  document.removeEventListener('click', closeProjectSwitcherOnOutsideClick);
}

function closeProjectSwitcherOnOutsideClick(e) {
  const switcher = document.getElementById('project-switcher');
  if (switcher && !switcher.contains(e.target)) {
    closeProjectSwitcher();
  }
}

function updateProjectSwitcher() {
  const nameEl = document.getElementById('current-project-name');
  
  if (state.board && nameEl) {
    nameEl.textContent = state.board.name;
  }
}

function renderProjectList(filter) {
  const container = document.getElementById('project-list');
  if (!container) return;
  
  let projects = state.boards || [];
  
  // Filter if search term provided
  if (filter) {
    const term = filter.toLowerCase();
    projects = projects.filter(p => p.name.toLowerCase().includes(term));
  }
  
  if (projects.length === 0) {
    container.innerHTML = '<div class="empty-state py-4"><p class="empty-state-text text-sm">No projects found</p></div>';
    return;
  }
  
  let html = '';
  projects.forEach(project => {
    const isActive = project.id === state.currentBoardId;
    html += '<div class="project-item' + (isActive ? ' active' : '') + '" onclick="switchProject(\'' + project.id + '\')">' +
      '<span class="project-item-name">' + escapeHtml(project.name) + '</span>' +
      (isActive ? '<i class="fas fa-check project-item-check"></i>' : '') +
    '</div>';
  });
  
  container.innerHTML = html;
}

function filterProjects(value) {
  renderProjectList(value);
}

function generateBackgroundPickerHtml(selectedType, selectedValue) {
  const type = selectedType || 'solid';
  const value = selectedValue || 'gray';
  const isDark = document.documentElement.classList.contains('dark');
  
  // Use theme-appropriate colors for solid backgrounds
  let solidHtml = SOLID_BACKGROUNDS.map(bg => {
    const displayColor = isDark ? bg.darkValue : bg.value;
    return '<div class="bg-picker-item solid' + (type === 'solid' && value === bg.id ? ' selected' : '') + '" data-type="solid" data-value="' + bg.id + '" style="background: ' + displayColor + '" title="' + bg.label + '"></div>';
  }).join('');
  
  let gradientHtml = GRADIENT_BACKGROUNDS.map(bg => 
    '<div class="bg-picker-item gradient' + (type === 'gradient' && value === bg.id ? ' selected' : '') + '" data-type="gradient" data-value="' + bg.id + '" style="background: ' + bg.value + '" title="' + bg.label + '"></div>'
  ).join('');
  
  return '<div class="bg-picker-section">' +
    '<div class="bg-picker-label">Solid Colors</div>' +
    '<div class="bg-picker-grid" id="solid-bg-picker">' + solidHtml + '</div>' +
  '</div>' +
  '<div class="bg-picker-section">' +
    '<div class="bg-picker-label">Gradients</div>' +
    '<div class="bg-picker-grid" id="gradient-bg-picker">' + gradientHtml + '</div>' +
  '</div>';
}

function setupBackgroundPicker(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.addEventListener('click', function(e) {
    const item = e.target.closest('.bg-picker-item');
    if (item) {
      // Remove selected from all items
      container.querySelectorAll('.bg-picker-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      
      const type = item.dataset.type;
      const value = item.dataset.value;
      if (onSelect) onSelect(type, value);
    }
  });
}

function generateTemplatePickerHtml(selectedTemplate) {
  const selected = selectedTemplate || 'basic';
  
  return BOARD_TEMPLATES.map(template => {
    const columnsPreview = template.columns.length > 0 
      ? template.columns.map(c => '<span class="template-column-pill">' + c + '</span>').join('')
      : '<span class="template-column-pill empty">No columns</span>';
    
    return '<div class="template-card' + (selected === template.id ? ' selected' : '') + '" data-template="' + template.id + '">' +
      '<div class="template-card-header">' +
        '<span class="template-card-icon">' + template.icon + '</span>' +
        '<span class="template-card-name">' + template.name + '</span>' +
      '</div>' +
      '<div class="template-card-desc">' + template.description + '</div>' +
      '<div class="template-card-columns">' + columnsPreview + '</div>' +
    '</div>';
  }).join('');
}

function openNewProjectModal() {
  closeProjectSwitcher();
  
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'new-project-overlay';
  
  let backgroundHtml = generateBackgroundPickerHtml('solid', 'gray');
  let templateHtml = generateTemplatePickerHtml('basic');
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 520px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="custom-dialog-title">New Project</div>' +
      '<div class="custom-dialog-message">Create a new project to organize your tasks</div>' +
    '</div>' +
    '<div class="custom-dialog-body" style="max-height: 70vh; overflow-y: auto;">' +
      '<div class="mb-4">' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>' +
        '<input type="text" class="custom-dialog-input" id="new-project-name" placeholder="e.g., Product Launch" autofocus>' +
      '</div>' +
      '<div class="mb-4">' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template</label>' +
        '<div class="template-picker-grid" id="template-picker">' + templateHtml + '</div>' +
      '</div>' +
      '<div>' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Board Background</label>' +
        '<div id="background-picker">' + backgroundHtml + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="custom-dialog-footer">' +
      '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="new-project-cancel">Cancel</button>' +
      '<button class="custom-dialog-btn custom-dialog-btn-primary" id="new-project-create">Create Project</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  // Focus input
  document.getElementById('new-project-name').focus();
  
  // Selected values
  let selectedBgType = 'solid';
  let selectedBgValue = 'gray';
  let selectedTemplate = 'basic';
  
  // Template picker
  document.getElementById('template-picker').addEventListener('click', function(e) {
    const card = e.target.closest('.template-card');
    if (card) {
      document.querySelectorAll('#template-picker .template-card').forEach(el => el.classList.remove('selected'));
      card.classList.add('selected');
      selectedTemplate = card.dataset.template;
    }
  });
  
  // Background picker
  setupBackgroundPicker('background-picker', function(type, value) {
    selectedBgType = type;
    selectedBgValue = value;
  });
  
  function closeModal() {
    overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
    overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  
  // Cancel
  document.getElementById('new-project-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });
  
  // Create
  document.getElementById('new-project-create').addEventListener('click', async function() {
    const name = document.getElementById('new-project-name').value.trim();
    if (!name) {
      showToast('Please enter a project name', 'error');
      return;
    }
    
    try {
      const newProject = await api('/api/boards', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          background_type: selectedBgType,
          background_value: selectedBgValue,
          template: selectedTemplate
        })
      });
      
      showToast('Project created', 'success');
      closeModal();
      await loadBoard(newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
      showToast('Failed to create project', 'error');
    }
  });
  
  // Enter key to create
  document.getElementById('new-project-name').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('new-project-create').click();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function openManageProjectsModal() {
  closeProjectSwitcher();
  
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'manage-projects-overlay';
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 480px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="custom-dialog-title">Manage Projects</div>' +
      '<div class="custom-dialog-message">Edit or delete your projects</div>' +
    '</div>' +
    '<div class="custom-dialog-body" style="max-height: 400px; overflow-y: auto;">' +
      '<div id="manage-projects-list"></div>' +
    '</div>' +
    '<div class="custom-dialog-footer">' +
      '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="manage-projects-close">Close</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  renderManageProjectsList();
  
  function closeModal() {
    overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
    overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  
  document.getElementById('manage-projects-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });
}

function renderManageProjectsList() {
  const container = document.getElementById('manage-projects-list');
  if (!container) return;
  
  let html = '';
  state.boards.forEach(project => {
    const isActive = project.id === state.currentBoardId;
    html += '<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">' +
      '<div class="flex-1 min-w-0">' +
        '<div class="font-medium truncate">' + escapeHtml(project.name) + '</div>' +
        '<div class="text-xs text-gray-500 dark:text-gray-400">' + 
          (isActive ? 'Current project' : 'Created ' + formatDate(project.created_at)) +
        '</div>' +
      '</div>' +
      '<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">' +
        '<button onclick="editProject(\'' + project.id + '\')" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500">' +
          '<i class="fas fa-edit text-sm"></i>' +
        '</button>' +
        (state.boards.length > 1 ? 
          '<button onclick="deleteProject(\'' + project.id + '\')" class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">' +
            '<i class="fas fa-trash text-sm"></i>' +
          '</button>' : '') +
      '</div>' +
    '</div>';
  });
  
  container.innerHTML = html;
}

async function editProject(projectId) {
  const project = state.boards.find(b => b.id === projectId);
  if (!project) return;
  
  // Close manage modal first
  const manageOverlay = document.getElementById('manage-projects-overlay');
  if (manageOverlay) manageOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'edit-project-overlay';
  
  let backgroundHtml = generateBackgroundPickerHtml(project.background_type || 'solid', project.background_value || 'gray');
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 480px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="custom-dialog-title">Edit Project</div>' +
      '<div class="custom-dialog-message">Update project details</div>' +
    '</div>' +
    '<div class="custom-dialog-body" style="max-height: 70vh; overflow-y: auto;">' +
      '<div class="mb-4">' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>' +
        '<input type="text" class="custom-dialog-input" id="edit-project-name" value="' + escapeHtml(project.name) + '">' +
      '</div>' +
      '<div>' +
        '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Board Background</label>' +
        '<div id="edit-background-picker">' + backgroundHtml + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="custom-dialog-footer">' +
      '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="edit-project-cancel">Cancel</button>' +
      '<button class="custom-dialog-btn custom-dialog-btn-primary" id="edit-project-save">Save Changes</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  // Focus input and select text
  const nameInput = document.getElementById('edit-project-name');
  nameInput.focus();
  nameInput.select();
  
  // Selected values
  let selectedBgType = project.background_type || 'solid';
  let selectedBgValue = project.background_value || 'gray';
  
  // Background picker
  setupBackgroundPicker('edit-background-picker', function(type, value) {
    selectedBgType = type;
    selectedBgValue = value;
  });
  
  function closeModal() {
    overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
    overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  
  // Cancel
  document.getElementById('edit-project-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });
  
  // Save
  document.getElementById('edit-project-save').addEventListener('click', async function() {
    const name = document.getElementById('edit-project-name').value.trim();
    if (!name) {
      showToast('Please enter a project name', 'error');
      return;
    }
    
    try {
      await api('/api/boards/' + projectId, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name,
          background_type: selectedBgType,
          background_value: selectedBgValue
        })
      });
      
      showToast('Project updated', 'success');
      closeModal();
      await loadBoard(state.currentBoardId);
    } catch (error) {
      console.error('Failed to update project:', error);
      showToast('Failed to update project', 'error');
    }
  });
  
  // Enter key to save
  nameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('edit-project-save').click();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}

async function deleteProject(projectId) {
  const project = state.boards.find(b => b.id === projectId);
  if (!project) return;
  
  // Can't delete if it's the only project
  if (state.boards.length <= 1) {
    showToast('Cannot delete the only project', 'error');
    return;
  }
  
  const confirmed = await customConfirm(
    'Delete Project',
    'Are you sure you want to delete "' + project.name + '"? All tasks and columns in this project will be moved to trash.',
    { confirmText: 'Delete', danger: true }
  );
  
  if (!confirmed) return;
  
  try {
    await api('/api/boards/' + projectId, { method: 'DELETE' });
    showToast('Project deleted', 'success');
    
    // If we deleted the current project, switch to another one
    if (projectId === state.currentBoardId) {
      const otherProject = state.boards.find(b => b.id !== projectId);
      await loadBoard(otherProject ? otherProject.id : null);
    } else {
      await loadBoard(state.currentBoardId);
    }
    
    // Refresh manage modal if open
    renderManageProjectsList();
  } catch (error) {
    console.error('Failed to delete project:', error);
    showToast('Failed to delete project', 'error');
  }
}

// ===================================
// Quick Background Picker
// ===================================

function openBackgroundPicker() {
  if (!state.board) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'custom-dialog-overlay';
  overlay.id = 'background-picker-overlay';
  
  let backgroundHtml = generateBackgroundPickerHtml(
    state.board.background_type || 'solid', 
    state.board.background_value || 'gray'
  );
  
  overlay.innerHTML = '<div class="custom-dialog" style="max-width: 400px;">' +
    '<div class="custom-dialog-header">' +
      '<div class="custom-dialog-title">Change Background</div>' +
      '<div class="custom-dialog-message">Choose a background for your board</div>' +
    '</div>' +
    '<div class="custom-dialog-body">' +
      '<div id="quick-background-picker">' + backgroundHtml + '</div>' +
    '</div>' +
    '<div class="custom-dialog-footer">' +
      '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="bg-picker-cancel">Cancel</button>' +
      '<button class="custom-dialog-btn custom-dialog-btn-primary" id="bg-picker-save">Save</button>' +
    '</div>' +
  '</div>';
  
  document.body.appendChild(overlay);
  
  let selectedBgType = state.board.background_type || 'solid';
  let selectedBgValue = state.board.background_value || 'gray';
  
  // Background picker with live preview
  setupBackgroundPicker('quick-background-picker', function(type, value) {
    selectedBgType = type;
    selectedBgValue = value;
    
    // Live preview
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      if (type === 'gradient') {
        const gradient = GRADIENT_BACKGROUNDS.find(g => g.id === value);
        mainContent.style.background = gradient ? gradient.value : value;
        mainContent.classList.add('board-gradient-bg');
      } else {
        const isDark = document.documentElement.classList.contains('dark');
        const solid = SOLID_BACKGROUNDS.find(s => s.id === value);
        if (solid) {
          mainContent.style.background = isDark ? solid.darkValue : solid.value;
        }
        mainContent.classList.remove('board-gradient-bg');
      }
    }
  });
  
  function closeModal(revert) {
    if (revert) {
      // Revert to original background
      applyBoardBackground();
    }
    overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
    overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
    setTimeout(() => overlay.remove(), 150);
  }
  
  document.getElementById('bg-picker-cancel').addEventListener('click', () => closeModal(true));
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal(true);
  });
  
  document.getElementById('bg-picker-save').addEventListener('click', async function() {
    try {
      await api('/api/boards/' + state.currentBoardId, {
        method: 'PATCH',
        body: JSON.stringify({
          background_type: selectedBgType,
          background_value: selectedBgValue
        })
      });
      
      // Update local state
      state.board.background_type = selectedBgType;
      state.board.background_value = selectedBgValue;
      
      showToast('Background updated', 'success');
      closeModal(false);
    } catch (error) {
      console.error('Failed to update background:', error);
      showToast('Failed to update background', 'error');
      closeModal(true);
    }
  });
}

function editCurrentProject() {
  if (state.currentBoardId) {
    editProject(state.currentBoardId);
  }
}

// Legacy function for backwards compatibility
function showSettings() {
  editCurrentProject();
}

// ===================================
// Trash Operations
// ===================================

async function openTrash() {
  try {
    state.trash = await api('/api/trash');
    renderTrashModal();
    document.getElementById('trash-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Failed to load trash:', error);
    showToast('Failed to load trash', 'error');
  }
}

function closeTrashModal() {
  const modal = document.getElementById('trash-modal');
  const backdrop = modal.querySelector('.modal-backdrop');
  const content = modal.querySelector('.modal-content');
  
  // Add closing animation
  backdrop.classList.add('closing');
  content.classList.add('closing');
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.classList.add('hidden');
    backdrop.classList.remove('closing');
    content.classList.remove('closing');
  }, 150);
}

function renderTrashModal() {
  const content = document.getElementById('trash-content');
  const allItems = [
    ...state.trash.tasks.map(t => ({ ...t, type: 'task', displayName: t.title })),
    ...state.trash.columns.map(c => ({ ...c, type: 'column', displayName: c.name })),
    ...state.trash.boards.map(b => ({ ...b, type: 'board', displayName: b.name }))
  ];

  if (allItems.length === 0) {
    content.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-trash-alt empty-state-icon"></i>
        <p class="empty-state-text">Trash is empty</p>
        <p class="empty-state-subtext">Deleted items will appear here</p>
      </div>`;
    return;
  }

  let html = '<div class="trash-items-list">';
  allItems.forEach(item => {
    const iconMap = { task: 'fa-check-circle', column: 'fa-columns', board: 'fa-clipboard' };
    html += `
      <div class="trash-item">
        <div class="trash-item-icon">
          <i class="fas ${iconMap[item.type] || 'fa-file'}"></i>
        </div>
        <div class="trash-item-content">
          <span class="trash-item-type">${item.type}</span>
          <p class="trash-item-name">${escapeHtml(item.displayName)}</p>
          <p class="trash-item-date">Deleted ${formatDate(item.deleted_at)}</p>
        </div>
        <button onclick="restoreFromTrash('${item.type}', '${item.id}')" class="trash-item-restore-btn" title="Restore">
          <i class="fas fa-undo"></i>
          <span>Restore</span>
        </button>
      </div>`;
  });
  html += '</div>';

  content.innerHTML = html;
}

async function restoreFromTrash(type, id) {
  try {
    await api('/api/trash/' + type + '/' + id + '/restore', { method: 'POST' });
    showToast('Item restored', 'success');
    await loadBoard();
    await openTrash();
    updateTrashCount();
  } catch (error) {
    console.error('Failed to restore item:', error);
    showToast('Failed to restore item', 'error');
  }
}

async function updateTrashCount() {
  try {
    const trash = await api('/api/trash');
    const count = trash.tasks.length + trash.columns.length + trash.boards.length;
    
    // Update menu badge
    const menuBadge = document.getElementById('trash-count-menu');
    if (menuBadge) {
      if (count > 0) {
        menuBadge.textContent = count > 99 ? '99+' : count;
        menuBadge.classList.remove('hidden');
      } else {
        menuBadge.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to update trash count:', error);
  }
}

// ===================================
// Archive Operations
// ===================================

let archivedTasks = [];

// Archive a single task
async function archiveTask(taskId) {
  try {
    // Check if task is recurring
    const task = state.tasks.find(t => t.id === taskId);
    const taskTitle = task ? task.title : 'Task';
    
    if (task && task.recurrence_rule) {
      // Use the complete-recurring endpoint to archive and create next occurrence
      await completeRecurringTask(taskId, 'archive', null);
    } else {
      await api('/api/tasks/' + taskId + '/archive', { method: 'POST' });
      
      // Track for undo
      UndoManager.push({
        type: 'task_archive',
        taskId: taskId,
        description: 'Archive task "' + taskTitle + '"'
      });
      
      showToastWithUndo('Task archived', 'success');
      await loadBoard(state.currentBoardId);
    }
    updateArchiveCount();
  } catch (error) {
    console.error('Error archiving task:', error);
    showToast('Failed to archive task', 'error');
  }
}

// Archive all tasks in a column
async function archiveAllInColumn(columnId) {
  const column = state.columns.find(c => c.id === columnId);
  const tasksInColumn = state.tasks.filter(t => t.column_id === columnId);
  
  if (tasksInColumn.length === 0) {
    showToast('No tasks to archive', 'info');
    return;
  }
  
  showConfirmDialog(
    'Archive All Tasks',
    'Archive all ' + tasksInColumn.length + ' task' + (tasksInColumn.length !== 1 ? 's' : '') + ' in "' + column.name + '"?<br><small class="text-gray-500">You can restore them from the Archive later.</small>',
    'Archive All',
    async () => {
      try {
        const result = await api('/api/boards/' + state.currentBoardId + '/archive-all', {
          method: 'POST',
          body: JSON.stringify({ column_id: columnId })
        });
        showToast(result.data.archived_count + ' task' + (result.data.archived_count !== 1 ? 's' : '') + ' archived', 'success');
        await loadBoard(state.currentBoardId);
        updateArchiveCount();
      } catch (error) {
        console.error('Error archiving tasks:', error);
        showToast('Failed to archive tasks', 'error');
      }
    }
  );
}

// Process auto-archive for columns with auto_archive enabled
async function processAutoArchive() {
  try {
    const result = await api('/api/boards/' + state.currentBoardId + '/auto-archive', {
      method: 'POST'
    });
    
    if (result.archived_count > 0) {
      showToast(result.archived_count + ' task' + (result.archived_count !== 1 ? 's' : '') + ' auto-archived', 'info');
      await loadBoard(state.currentBoardId);
      updateArchiveCount();
    }
  } catch (error) {
    // Silent fail - auto-archive is a background feature
    console.error('Error processing auto-archive:', error);
  }
}

// Restore a task from archive
async function restoreFromArchive(taskId) {
  try {
    await api('/api/tasks/' + taskId + '/unarchive', { method: 'POST' });
    showToast('Task restored', 'success');
    await loadBoard(state.currentBoardId);
    await loadArchivedTasks();
    updateArchiveCount();
  } catch (error) {
    console.error('Error restoring task:', error);
    showToast('Failed to restore task', 'error');
  }
}

// Load archived tasks for current board
async function loadArchivedTasks() {
  try {
    const result = await api('/api/boards/' + state.currentBoardId + '/archive');
    // api() already unwraps data.data, so result IS the array
    archivedTasks = result || [];
    return archivedTasks;
  } catch (error) {
    console.error('Error loading archived tasks:', error);
    return [];
  }
}

// Update archive count badge
async function updateArchiveCount() {
  try {
    const tasks = await loadArchivedTasks();
    const count = tasks.length;
    
    const menuBadge = document.getElementById('archive-count-menu');
    if (menuBadge) {
      if (count > 0) {
        menuBadge.textContent = count > 99 ? '99+' : count;
        menuBadge.classList.remove('hidden');
      } else {
        menuBadge.classList.add('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to update archive count:', error);
  }
}

// Open archive modal
async function openArchive() {
  await loadArchivedTasks();
  renderArchiveModal();
}

// Render archive modal
function renderArchiveModal() {
  // Remove existing modal if any
  const existingOverlay = document.getElementById('archive-modal-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'archive-modal-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6';
  overlay.style.animation = 'fadeIn 0.2s ease';

  let tasksHtml = '';
  if (archivedTasks.length === 0) {
    tasksHtml = `
      <div class="empty-state">
        <i class="fas fa-archive empty-state-icon"></i>
        <p class="empty-state-text">No archived tasks</p>
        <p class="empty-state-subtext">Tasks you archive will appear here</p>
      </div>`;
  } else {
    tasksHtml = '<div class="archive-items-list">' + archivedTasks.map(task => {
      const archivedDate = new Date(task.archived_at).toLocaleDateString();
      return `
        <div class="archive-item">
          <div class="archive-item-content">
            <p class="archive-item-title">${escapeHtml(task.title)}</p>
            <div class="archive-item-meta">
              <span><i class="fas fa-folder"></i>${escapeHtml(task.column_name || 'Unknown')}</span>
              <span class="archive-item-meta-dot">•</span>
              <span><i class="fas fa-calendar"></i>Archived ${archivedDate}</span>
            </div>
          </div>
          <div class="archive-item-actions">
            <button onclick="restoreFromArchive('${task.id}')" class="archive-action-btn restore" title="Restore task">
              <i class="fas fa-undo"></i>
            </button>
            <button onclick="deleteArchivedTask('${task.id}')" class="archive-action-btn delete" title="Delete permanently">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('') + '</div>';
  }

  overlay.innerHTML = `
    <div class="utility-modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[80vh] flex flex-col" style="max-width: 400px; animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div class="utility-modal-header px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <i class="fas fa-archive text-accent text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Archived Tasks</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">${archivedTasks.length} task${archivedTasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onclick="closeModal('archive-modal-overlay')" class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      <div class="utility-modal-body px-5 py-4 flex-1 overflow-y-auto" id="archive-tasks-list">
        ${tasksHtml}
      </div>
      <div class="utility-modal-footer px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button onclick="closeModal('archive-modal-overlay')" class="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal('archive-modal-overlay');
    }
  });

  document.body.appendChild(overlay);
}

// Delete archived task permanently
async function deleteArchivedTask(taskId) {
  showConfirmDialog(
    'Delete Permanently',
    'Are you sure you want to permanently delete this task?<br><small class="text-red-500">This action cannot be undone.</small>',
    'Delete',
    async () => {
      try {
        await api('/api/tasks/' + taskId, { method: 'DELETE' });
        showToast('Task deleted permanently', 'success');
        await loadArchivedTasks();
        renderArchiveModal();
        updateArchiveCount();
      } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
      }
    },
    true // isDanger
  );
}

// ===================
// Activity Feed
// ===================

let boardActivities = [];

// Open activity feed modal
async function openActivityFeed() {
  if (!state.currentBoardId) return;
  
  try {
    await loadBoardActivities();
    renderActivityFeedModal();
  } catch (error) {
    console.error('Error opening activity feed:', error);
    showToast('Failed to load activity feed', 'error');
  }
}

// Load board-level activities
async function loadBoardActivities(action) {
  try {
    const url = action 
      ? `/api/boards/${state.currentBoardId}/activity?action=${encodeURIComponent(action)}&limit=100`
      : `/api/boards/${state.currentBoardId}/activity?limit=100`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.data) {
      boardActivities = result.data;
      return boardActivities;
    }
    return [];
  } catch (error) {
    console.error('Error loading board activities:', error);
    return [];
  }
}

// Render activity feed modal
async function renderActivityFeedModal() {
  // Remove existing modal if any
  const existingOverlay = document.getElementById('activity-feed-modal-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'activity-feed-modal-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6';
  overlay.style.animation = 'fadeIn 0.2s ease';
  
  let activitiesHtml = '';
  if (boardActivities.length === 0) {
    activitiesHtml = `
      <div class="empty-state">
        <i class="fas fa-history empty-state-icon"></i>
        <p class="empty-state-text">No activity yet</p>
        <p class="empty-state-subtext">Activity will appear here as you work</p>
      </div>`;
  } else {
    activitiesHtml = '<div class="activity-feed-items">' + boardActivities.map(activity => {
      const icon = getActivityIcon(activity.action);
      const message = formatActivityMessage(activity);
      const timeAgo = formatRelativeTime(activity.created_at);
      const entityType = activity.entity_type;
      
      // Get task title if it's a task activity
      let taskTitle = '';
      if (entityType === 'task') {
        const task = state.tasks.find(t => t.id === activity.entity_id);
        taskTitle = task ? task.title : '';
      }
      
      return `
        <div class="activity-feed-item">
          <div class="activity-feed-item-icon">
            <i class="fas ${icon}"></i>
          </div>
          <div class="activity-feed-item-content">
            ${taskTitle ? `<p class="activity-feed-item-title">${escapeHtml(taskTitle)}</p>` : ''}
            <p class="activity-feed-item-message">${message}</p>
            <p class="activity-feed-item-time">${timeAgo}</p>
          </div>
        </div>
      `;
    }).join('') + '</div>';
  }
  
  overlay.innerHTML = `
    <div class="utility-modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[80vh] flex flex-col" style="max-width: 400px; animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div class="utility-modal-header px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <i class="fas fa-history text-accent text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity Feed</h3>
          </div>
        </div>
        <button onclick="closeModal('activity-feed-modal-overlay')" class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      <div class="activity-feed-filter-section">
        <select id="activity-feed-filter" class="activity-feed-filter-select" onchange="filterActivityFeed(this.value)">
          <option value="">All Activities</option>
          <option value="created">Created</option>
          <option value="moved">Moved</option>
          <option value="edited">Edited</option>
          <option value="priority_changed">Priority Changed</option>
          <option value="due_date_set">Due Date Set</option>
          <option value="tag_added">Tag Added</option>
          <option value="archived">Archived</option>
          <option value="deleted">Deleted</option>
          <option value="subtask_completed">Subtask Completed</option>
        </select>
      </div>
      <div class="utility-modal-body px-5 py-4 flex-1 overflow-y-auto" id="activity-feed-list">
        ${activitiesHtml}
      </div>
      <div class="utility-modal-footer px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button onclick="closeModal('activity-feed-modal-overlay')" class="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal('activity-feed-modal-overlay');
    }
  });
  
  document.body.appendChild(overlay);
  
  // Initialize custom select for activity feed filter
  setTimeout(() => {
    const activityFeedFilter = document.getElementById('activity-feed-filter');
    if (activityFeedFilter) {
      initCustomSelect(activityFeedFilter);
    }
  }, 0);
}

// Filter activity feed by action type
async function filterActivityFeed(action) {
  if (!state.currentBoardId) return;
  
  try {
    await loadBoardActivities(action || undefined);
    const container = document.getElementById('activity-feed-list');
    if (!container) return;
    
    if (boardActivities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history empty-state-icon"></i>
          <p class="empty-state-text">No activity found</p>
        </div>`;
      return;
    }
    
    let activitiesHtml = '<div class="activity-feed-items">' + boardActivities.map(activity => {
      const icon = getActivityIcon(activity.action);
      const message = formatActivityMessage(activity);
      const timeAgo = formatRelativeTime(activity.created_at);
      const entityType = activity.entity_type;
      
      let taskTitle = '';
      if (entityType === 'task') {
        const task = state.tasks.find(t => t.id === activity.entity_id);
        taskTitle = task ? task.title : '';
      }
      
      return `
        <div class="activity-feed-item">
          <div class="activity-feed-item-icon">
            <i class="fas ${icon}"></i>
          </div>
          <div class="activity-feed-item-content">
            ${taskTitle ? `<p class="activity-feed-item-title">${escapeHtml(taskTitle)}</p>` : ''}
            <p class="activity-feed-item-message">${message}</p>
            <p class="activity-feed-item-time">${timeAgo}</p>
          </div>
        </div>
      `;
    }).join('') + '</div>';
    
    container.innerHTML = activitiesHtml;
  } catch (error) {
    console.error('Error filtering activity feed:', error);
  }
}

// ===================================
// Command Palette (Cmd+K)
// ===================================

let commandPaletteOpen = false;
let commandPaletteSelectedIndex = 0;
let commandPaletteResults = [];

// Initialize command palette keyboard shortcut
document.addEventListener('keydown', function(e) {
  // Cmd/Ctrl + K to open command palette
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    toggleCommandPalette();
  }
  // Escape to close (if open)
  if (e.key === 'Escape' && commandPaletteOpen) {
    closeCommandPalette();
  }
});

function toggleCommandPalette() {
  if (commandPaletteOpen) {
    closeCommandPalette();
  } else {
    openCommandPalette();
  }
}

function openCommandPalette() {
  if (commandPaletteOpen) return;
  
  // Close other menus
  closeUserMenu();
  closeProjectSwitcher();
  
  commandPaletteOpen = true;
  commandPaletteSelectedIndex = 0;
  
  const overlay = document.createElement('div');
  overlay.id = 'command-palette-overlay';
  overlay.className = 'command-palette-overlay';
  
  overlay.innerHTML = `
    <div class="command-palette">
      <div class="command-palette-input-container">
        <i class="fas fa-search"></i>
        <input type="text" class="command-palette-input" id="command-palette-input" placeholder="Type a command or search..." autofocus>
        <span class="command-palette-shortcut">ESC</span>
      </div>
      <div class="command-palette-results" id="command-palette-results">
        <!-- Results will be rendered here -->
      </div>
      <div class="command-palette-footer">
        <span><kbd>↑↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Select</span>
        <span><kbd>esc</kbd> Close</span>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeCommandPalette();
    }
  });
  
  document.body.appendChild(overlay);
  
  const input = document.getElementById('command-palette-input');
  input.focus();
  
  // Render initial results (quick actions)
  renderCommandPaletteResults('');
  
  // Input handler
  input.addEventListener('input', function(e) {
    commandPaletteSelectedIndex = 0;
    renderCommandPaletteResults(e.target.value);
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      commandPaletteSelectedIndex = Math.min(commandPaletteSelectedIndex + 1, commandPaletteResults.length - 1);
      updateCommandPaletteSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commandPaletteSelectedIndex = Math.max(commandPaletteSelectedIndex - 1, 0);
      updateCommandPaletteSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommandPaletteItem(commandPaletteSelectedIndex);
    }
  });
}

function closeCommandPalette() {
  if (!commandPaletteOpen) return;
  
  commandPaletteOpen = false;
  const overlay = document.getElementById('command-palette-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.15s ease forwards';
    const palette = overlay.querySelector('.command-palette');
    if (palette) {
      palette.style.animation = 'dialogOut 0.15s ease forwards';
    }
    setTimeout(() => overlay.remove(), 150);
  }
}

function getCommandPaletteItems(query) {
  const items = [];
  const q = query.toLowerCase().trim();
  
  // Quick actions (always available)
  const quickActions = [
    { type: 'action', icon: 'fa-plus', title: 'New Task', subtitle: 'Create a new task', action: () => { closeCommandPalette(); openNewTaskModal(); } },
    { type: 'action', icon: 'fa-folder-plus', title: 'New Project', subtitle: 'Create a new project', action: () => { closeCommandPalette(); openNewProjectModal(); } },
    { type: 'action', icon: 'fa-archive', title: 'Open Archive', subtitle: 'View archived tasks', action: () => { closeCommandPalette(); openArchive(); } },
    { type: 'action', icon: 'fa-trash', title: 'Open Trash', subtitle: 'View deleted items', action: () => { closeCommandPalette(); openTrash(); } },
    { type: 'nav', icon: 'fa-columns', title: 'Board View', subtitle: 'Switch to kanban board', action: () => { closeCommandPalette(); setView('board'); } },
    { type: 'nav', icon: 'fa-list', title: 'List View', subtitle: 'Switch to list view', action: () => { closeCommandPalette(); setView('list'); } },
    { type: 'nav', icon: 'fa-calendar-alt', title: 'Calendar View', subtitle: 'View tasks by due date', action: () => { closeCommandPalette(); setView('calendar'); } },
    { type: 'nav', icon: 'fa-sun', title: 'Light Mode', subtitle: 'Switch to light theme', action: () => { closeCommandPalette(); setTheme('light'); } },
    { type: 'nav', icon: 'fa-moon', title: 'Dark Mode', subtitle: 'Switch to dark theme', action: () => { closeCommandPalette(); setTheme('dark'); } },
    { type: 'nav', icon: 'fa-desktop', title: 'System Theme', subtitle: 'Use system preference', action: () => { closeCommandPalette(); setTheme('system'); } },
  ];
  
  // Projects
  const projects = (state.boards || []).map(board => ({
    type: 'project',
    icon: 'fa-folder',
    isEmoji: false,
    title: board.name,
    subtitle: board.id === state.currentBoardId ? 'Current project' : 'Switch to project',
    action: () => { closeCommandPalette(); switchProject(board.id); }
  }));
  
  // Tasks in current project
  const tasks = (state.tasks || []).map(task => {
    const column = state.columns.find(c => c.id === task.column_id);
    return {
      type: 'task',
      icon: 'fa-check-circle',
      title: task.title,
      subtitle: column ? column.name : 'Unknown column',
      action: () => { closeCommandPalette(); openTaskModal(task.id); }
    };
  });
  
  // Filter based on query
  if (!q) {
    // Show quick actions + recent projects
    items.push({ section: 'Quick Actions', items: quickActions.slice(0, 4) });
    if (projects.length > 0) {
      items.push({ section: 'Projects', items: projects.slice(0, 5) });
    }
  } else {
    // Parse special commands
    if (q.startsWith('add ') || q.startsWith('new ') || q.startsWith('create ')) {
      const taskTitle = q.replace(/^(add|new|create)\s+/i, '').trim();
      if (taskTitle) {
        items.push({
          section: 'Create Task',
          items: [{
            type: 'action',
            icon: 'fa-plus',
            title: `Create "${taskTitle}"`,
            subtitle: 'Add to first column',
            action: () => { closeCommandPalette(); quickCreateTask(taskTitle); }
          }]
        });
      }
    }
    
    if (q.startsWith('go ') || q.startsWith('switch ') || q.startsWith('open ')) {
      const projectQuery = q.replace(/^(go|switch|open)\s+/i, '').toLowerCase();
      const matchingProjects = projects.filter(p => 
        p.title.toLowerCase().includes(projectQuery)
      );
      if (matchingProjects.length > 0) {
        items.push({ section: 'Switch Project', items: matchingProjects });
      }
    }
    
    if (q.startsWith('theme ')) {
      const themeQuery = q.replace(/^theme\s+/i, '').toLowerCase();
      const themeActions = quickActions.filter(a => 
        a.title.toLowerCase().includes(themeQuery) || 
        a.title.toLowerCase().includes('mode')
      );
      if (themeActions.length > 0) {
        items.push({ section: 'Theme', items: themeActions });
      }
    }
    
    // General fuzzy search
    if (items.length === 0 || !q.startsWith('add ')) {
      const matchingActions = quickActions.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.subtitle.toLowerCase().includes(q)
      );
      const matchingProjects = projects.filter(p => 
        p.title.toLowerCase().includes(q)
      );
      const matchingTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(q)
      );
      
      if (matchingActions.length > 0) {
        items.push({ section: 'Actions', items: matchingActions });
      }
      if (matchingProjects.length > 0) {
        items.push({ section: 'Projects', items: matchingProjects.slice(0, 5) });
      }
      if (matchingTasks.length > 0) {
        items.push({ section: 'Tasks', items: matchingTasks.slice(0, 8) });
      }
    }
  }
  
  return items;
}

function renderCommandPaletteResults(query) {
  const container = document.getElementById('command-palette-results');
  if (!container) return;
  
  const sections = getCommandPaletteItems(query);
  commandPaletteResults = [];
  
  if (sections.length === 0) {
    container.innerHTML = `
      <div class="command-palette-empty">
        <i class="fas fa-search empty-state-icon"></i>
        <p class="empty-state-text">No results found</p>
        <p class="empty-state-subtext">Try "add [task name]" to create a task</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  let globalIndex = 0;
  
  sections.forEach(section => {
    html += `<div class="command-palette-section">`;
    html += `<div class="command-palette-section-title">${section.section}</div>`;
    
    section.items.forEach(item => {
      commandPaletteResults.push(item);
      const selectedClass = globalIndex === commandPaletteSelectedIndex ? ' selected' : '';
      
      let iconHtml;
      if (item.isEmoji) {
        iconHtml = `<div class="command-palette-item-icon ${item.type}">${item.icon}</div>`;
      } else {
        iconHtml = `<div class="command-palette-item-icon ${item.type}"><i class="fas ${item.icon}"></i></div>`;
      }
      
      html += `
        <div class="command-palette-item${selectedClass}" data-index="${globalIndex}" onclick="executeCommandPaletteItem(${globalIndex})">
          ${iconHtml}
          <div class="command-palette-item-content">
            <div class="command-palette-item-title">${escapeHtml(item.title)}</div>
            <div class="command-palette-item-subtitle">${escapeHtml(item.subtitle)}</div>
          </div>
        </div>
      `;
      globalIndex++;
    });
    
    html += `</div>`;
  });
  
  container.innerHTML = html;
}

function updateCommandPaletteSelection() {
  const container = document.getElementById('command-palette-results');
  if (!container) return;
  
  const items = container.querySelectorAll('.command-palette-item');
  items.forEach((item, index) => {
    if (index === commandPaletteSelectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function executeCommandPaletteItem(index) {
  if (index >= 0 && index < commandPaletteResults.length) {
    const item = commandPaletteResults[index];
    if (item.action) {
      item.action();
    }
  }
}

// Quick create task from command palette
async function quickCreateTask(title) {
  if (!title.trim()) return;
  
  // Get the first column
  const firstColumn = state.columns.sort((a, b) => a.position - b.position)[0];
  if (!firstColumn) {
    showToast('No columns available', 'error');
    return;
  }
  
  try {
    await api('/api/boards/' + state.currentBoardId + '/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        column_id: firstColumn.id,
        priority: 'medium'
      })
    });
    showToast('Task created', 'success');
    await loadBoard();
  } catch (error) {
    console.error('Error creating task:', error);
    showToast('Failed to create task', 'error');
  }
}

// Close project switcher helper
function closeProjectSwitcher() {
  const dropdown = document.getElementById('project-switcher-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
  }
}

// ===================================
// User Menu
// ===================================

let userMenuOpen = false;

function toggleUserMenu() {
  const dropdown = document.getElementById('user-menu-dropdown');
  if (!dropdown) return;
  
  if (userMenuOpen) {
    closeUserMenu();
  } else {
    dropdown.classList.remove('hidden', 'closing');
    userMenuOpen = true;
    
    // Update theme buttons to reflect current state
    updateThemeButtons();
    
    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutsideUserMenu);
    }, 0);
  }
}

function closeUserMenu() {
  const dropdown = document.getElementById('user-menu-dropdown');
  if (!dropdown || !userMenuOpen) return;
  
  dropdown.classList.add('closing');
  userMenuOpen = false;
  document.removeEventListener('click', handleClickOutsideUserMenu);
  
  setTimeout(() => {
    dropdown.classList.add('hidden');
    dropdown.classList.remove('closing');
  }, 100);
}

function handleClickOutsideUserMenu(e) {
  const container = document.getElementById('user-menu-container');
  if (container && !container.contains(e.target)) {
    closeUserMenu();
  }
}

// Placeholder functions for future auth
function signIn() {
  showToast('Sign in coming soon!', 'info');
}

function signOut() {
  showToast('Sign out coming soon!', 'info');
}

function showSettings() {
  showToast('Settings coming soon!', 'info');
}

function showKeyboardShortcuts() {
  const modal = document.createElement('div');
  modal.id = 'shortcuts-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-6';
  modal.innerHTML = `
    <div class="modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="closeShortcutsModal()"></div>
    <div class="modal-content utility-modal relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-h-[80vh] flex flex-col overflow-hidden" style="max-width: 380px; animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <!-- Header -->
      <div class="utility-modal-header flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <i class="fas fa-keyboard text-accent text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
          </div>
        </div>
        <button onclick="closeShortcutsModal()" class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      
      <!-- Body -->
      <div class="utility-modal-body flex-1 overflow-y-auto px-5 py-4">
        <!-- Navigation -->
        <div class="shortcut-group">
          <h3 class="shortcut-group-title">Navigation</h3>
          <div class="shortcut-list">
            <div class="shortcut-row"><span>Navigate tasks</span><div class="shortcut-keys"><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></div></div>
            <div class="shortcut-row"><span>Jump to column</span><div class="shortcut-keys"><kbd>1</kbd><span class="shortcut-separator">-</span><kbd>9</kbd></div></div>
            <div class="shortcut-row"><span>Open task</span><kbd>Enter</kbd></div>
            <div class="shortcut-row"><span>Cycle view</span><kbd>V</kbd></div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="shortcut-group">
          <h3 class="shortcut-group-title">Actions</h3>
          <div class="shortcut-list">
            <div class="shortcut-row"><span>New task</span><kbd>N</kbd></div>
            <div class="shortcut-row"><span>Edit task</span><kbd>E</kbd></div>
            <div class="shortcut-row"><span>Delete task</span><kbd>D</kbd></div>
            <div class="shortcut-row"><span>Undo / Redo</span><div class="shortcut-keys"><kbd>⌘Z</kbd><kbd>⌘⇧Z</kbd></div></div>
          </div>
        </div>
        
        <!-- General -->
        <div class="shortcut-group">
          <h3 class="shortcut-group-title">General</h3>
          <div class="shortcut-list">
            <div class="shortcut-row"><span>Command palette</span><kbd>⌘K</kbd></div>
            <div class="shortcut-row"><span>Search</span><div class="shortcut-keys"><kbd>/</kbd><span class="shortcut-separator">or</span><kbd>⌘F</kbd></div></div>
            <div class="shortcut-row"><span>Toggle theme</span><kbd>T</kbd></div>
            <div class="shortcut-row"><span>Close modal</span><kbd>Esc</kbd></div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="utility-modal-footer px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button onclick="closeShortcutsModal()" class="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (!modal) return;
  
  const backdrop = modal.querySelector('.modal-backdrop');
  const content = modal.querySelector('.modal-content');
  
  // Add closing animation
  if (backdrop) backdrop.classList.add('closing');
  if (content) content.classList.add('closing');
  
  // Wait for animation to complete before removing
  setTimeout(() => {
    modal.remove();
  }, 150);
}

// ===================================
// Keyboard Navigation Functions
// ===================================

function getOrderedTasks() {
  // Get all visible tasks ordered by column position, then task position
  const visibleTasks = state.tasks.filter(t => !t.archived_at && !t.deleted_at);
  
  if (state.currentView === 'board') {
    // Board view: order by column position, then task position within column
    return visibleTasks.sort((a, b) => {
      const colA = state.columns.find(c => c.id === a.column_id);
      const colB = state.columns.find(c => c.id === b.column_id);
      
      // Handle missing columns - put them at the end
      if (!colA && !colB) return 0;
      if (!colA) return 1;
      if (!colB) return -1;
      
      if (colA.position !== colB.position) {
        return colA.position - colB.position;
      }
      return a.position - b.position;
    });
  } else {
    // List view: use filtered tasks
    return getFilteredTasks();
  }
}

function focusTask(taskId) {
  state.focusedTaskId = taskId;
  updateTaskFocus();
  scrollToFocusedTask();
}

function updateTaskFocus() {
  // Remove focus classes from all tasks (both board view cards and list view rows)
  document.querySelectorAll('.task-card, tr[data-task-id]').forEach(el => {
    el.classList.remove('task-focused', 'task-row-focused');
  });
  
  // Add focus class to focused task
  if (state.focusedTaskId) {
    const taskCard = document.querySelector(`[data-task-id="${state.focusedTaskId}"]`);
    if (taskCard) {
      taskCard.classList.add('task-focused');
      // Also add to list view row if applicable
      const listRow = document.querySelector(`tr[data-task-id="${state.focusedTaskId}"]`);
      if (listRow) {
        listRow.classList.add('task-row-focused');
      }
    }
  }
}

function scrollToFocusedTask() {
  if (!state.focusedTaskId) return;
  
  const taskElement = document.querySelector(`[data-task-id="${state.focusedTaskId}"]`);
  if (taskElement) {
    taskElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function navigateTasks(direction) {
  const tasks = getOrderedTasks();
  if (tasks.length === 0) return;
  
  let currentIndex = -1;
  if (state.focusedTaskId) {
    currentIndex = tasks.findIndex(t => t.id === state.focusedTaskId);
  }
  
  let nextIndex = -1;
  
  if (state.currentView === 'board') {
    // Board view navigation
    if (direction === 'ArrowRight' || direction === 'ArrowDown') {
      nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
    } else if (direction === 'ArrowLeft' || direction === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
    }
  } else {
    // List view navigation (only up/down)
    if (direction === 'ArrowDown') {
      nextIndex = currentIndex < tasks.length - 1 ? currentIndex + 1 : 0;
    } else if (direction === 'ArrowUp') {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tasks.length - 1;
    }
  }
  
  if (nextIndex >= 0 && nextIndex < tasks.length) {
    focusTask(tasks[nextIndex].id);
  } else if (currentIndex === -1 && tasks.length > 0) {
    // If no task is focused, focus the first one
    focusTask(tasks[0].id);
  }
}

function jumpToColumn(columnIndex) {
  // Column index is 1-based (1-9)
  const column = state.columns
    .filter(c => !c.deleted_at)
    .sort((a, b) => a.position - b.position)[columnIndex - 1];
  
  if (column) {
    // Find first task in that column
    const tasks = state.tasks
      .filter(t => t.column_id === column.id && !t.archived_at && !t.deleted_at)
      .sort((a, b) => a.position - b.position);
    
    if (tasks.length > 0) {
      focusTask(tasks[0].id);
    } else {
      // No tasks in column, just scroll to column
      const columnElement = document.querySelector(`[data-column-id="${column.id}"]`);
      if (columnElement) {
        columnElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
}

function editFocusedTask() {
  if (!state.focusedTaskId) return;
  
  const task = state.tasks.find(t => t.id === state.focusedTaskId);
  if (task) {
    openTaskModal(state.focusedTaskId);
    // Focus the title input in the modal after a short delay
    setTimeout(() => {
      const titleInput = document.querySelector('#task-modal input[name="title"]');
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 100);
  }
}

function deleteFocusedTask() {
  if (!state.focusedTaskId) return;
  
  const task = state.tasks.find(t => t.id === state.focusedTaskId);
  if (task) {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(state.focusedTaskId);
      state.focusedTaskId = null;
    }
  }
}

// Initialize keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't trigger if typing in an input, textarea, or select (unless it's Escape, Tab, or Undo/Redo)
  const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
  const isContentEditable = e.target.isContentEditable;
  
  // Undo/Redo - works globally when not in text input (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  const isUndoKey = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
  const isRedoKey = (e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y');
  
  if (!isInput && !isContentEditable) {
    if (isUndoKey) {
      e.preventDefault();
      UndoManager.undo();
      return;
    }
    
    if (isRedoKey) {
      e.preventDefault();
      UndoManager.redo();
      return;
    }
  }
  
  // Allow Escape and Tab to work even in inputs
  if (isInput || isContentEditable) {
    if (e.key !== 'Escape' && e.key !== 'Tab') {
      return;
    }
  }
  
  // Check if a modal is open - some shortcuts should still work
  const isModalOpen = document.getElementById('task-modal')?.classList.contains('hidden') === false ||
                     document.getElementById('trash-modal')?.classList.contains('hidden') === false ||
                     document.getElementById('shortcuts-modal') !== null ||
                     document.querySelector('.command-palette-overlay') !== null ||
                     document.querySelector('.global-search-overlay') !== null;
  
  // Escape - close modals
  if (e.key === 'Escape') {
    if (isModalOpen) {
      closeTaskModal();
      closeTrashModal();
      closeShortcutsModal();
      closeUserMenu();
      closeCommandPalette();
      closeGlobalSearch();
    } else {
      // Clear focus when not in modal
      state.focusedTaskId = null;
      updateTaskFocus();
    }
    return;
  }
  
  // Don't process other shortcuts if a modal is open (except Escape)
  if (isModalOpen) {
    return;
  }
  
  // ? - show keyboard shortcuts
  if (e.key === '?') {
    e.preventDefault();
    showKeyboardShortcuts();
    return;
  }
  
  // N - new task
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    openNewTaskModal();
    return;
  }
  
  // V - toggle view (cycle: board -> list -> calendar -> board)
  if (e.key === 'v' || e.key === 'V') {
    e.preventDefault();
    const viewCycle = { 'board': 'list', 'list': 'calendar', 'calendar': 'board' };
    setView(viewCycle[state.currentView] || 'board');
    // Clear focus when switching views
    state.focusedTaskId = null;
    updateTaskFocus();
    return;
  }
  
  // C - go to calendar view
  if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    setView('calendar');
    return;
  }
  
  // T - toggle theme
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    toggleTheme();
    return;
  }
  
  // Delete - open trash
  if (e.key === 'Delete') {
    e.preventDefault();
    openTrash();
    return;
  }
  
  // Arrow keys - navigate tasks
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    navigateTasks(e.key);
    return;
  }
  
  // Enter - open task detail
  if (e.key === 'Enter') {
    if (state.focusedTaskId) {
      e.preventDefault();
      openTaskModal(state.focusedTaskId);
    }
    return;
  }
  
  // E - edit focused task
  if (e.key === 'e' || e.key === 'E') {
    if (state.focusedTaskId) {
      e.preventDefault();
      editFocusedTask();
    }
    return;
  }
  
  // D - delete focused task
  if (e.key === 'd' || e.key === 'D') {
    if (state.focusedTaskId) {
      e.preventDefault();
      deleteFocusedTask();
    }
    return;
  }
  
  // 1-9 - jump to column by position
  const columnNumber = parseInt(e.key);
  if (!isNaN(columnNumber) && columnNumber >= 1 && columnNumber <= 9) {
    e.preventDefault();
    jumpToColumn(columnNumber);
    return;
  }
});

// ===================================
// Utility Functions
// ===================================

function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.toggle('hidden', !show);
}

function showToast(message, type, options) {
  type = type || 'info';
  options = options || {};
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const colors = {
    success: 'border-green-500/50 text-green-700 dark:text-green-400',
    error: 'border-red-500/50 text-red-700 dark:text-red-400',
    warning: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400',
    info: 'border-blue-500/50 text-blue-700 dark:text-blue-400'
  };
  
  const icons = {
    success: 'fa-check-circle text-green-500',
    error: 'fa-exclamation-circle text-red-500',
    warning: 'fa-exclamation-triangle text-yellow-500',
    info: 'fa-info-circle text-blue-500'
  };
  
  const toast = document.createElement('div');
  // ShadCN-inspired toast: white/dark background, subtle border, colored icon
  toast.className = 'toast bg-white dark:bg-gray-800 border-l-4 ' + colors[type] + ' px-4 py-3.5 rounded-r-lg shadow-xl flex items-center gap-3 min-w-[300px] border border-gray-200 dark:border-gray-700';
  
  // Build toast content
  let toastContent = '<i class="fas ' + icons[type] + ' text-lg"></i>' +
                     '<div class="flex-1">' +
                       '<p class="text-sm font-medium text-gray-900 dark:text-gray-100">' + escapeHtml(message) + '</p>' +
                     '</div>';
  
  // Add undo button if showUndo option is true
  if (options.showUndo && UndoManager.canUndo()) {
    toastContent += '<button class="toast-undo-btn ml-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-gray-600" onclick="UndoManager.undo(); this.closest(\'.toast\').remove();">Undo</button>';
  }
  
  // Close button
  toastContent += '<button onclick="this.closest(\'.toast\').remove()" class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">' +
                    '<i class="fas fa-times text-xs"></i>' +
                  '</button>';
  
  toast.innerHTML = toastContent;
  container.appendChild(toast);
  
  // Longer duration if there's an undo button
  const duration = options.showUndo ? 5000 : 3000;
  
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, duration);
}

// Show toast with undo option
function showToastWithUndo(message, type) {
  showToast(message, type, { showUndo: true });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================================
// Bulk Actions Functions
// ===================================

function toggleTaskSelection(taskId, isShiftClick) {
  if (isShiftClick && state.lastSelectedTaskId) {
    // Range selection
    const allTasks = state.currentView === 'board' 
      ? state.tasks.filter(t => !t.archived_at && !t.deleted_at)
      : getFilteredTasks();
    const currentIndex = allTasks.findIndex(t => t.id === taskId);
    const lastIndex = allTasks.findIndex(t => t.id === state.lastSelectedTaskId);
    
    if (currentIndex !== -1 && lastIndex !== -1) {
      const start = Math.min(currentIndex, lastIndex);
      const end = Math.max(currentIndex, lastIndex);
      const shouldSelect = !state.selectedTaskIds.has(taskId);
      
      for (let i = start; i <= end; i++) {
        if (shouldSelect) {
          state.selectedTaskIds.add(allTasks[i].id);
        } else {
          state.selectedTaskIds.delete(allTasks[i].id);
        }
      }
    }
  } else {
    // Toggle single selection
    if (state.selectedTaskIds.has(taskId)) {
      state.selectedTaskIds.delete(taskId);
    } else {
      state.selectedTaskIds.add(taskId);
    }
  }
  
  state.lastSelectedTaskId = taskId;
  updateBulkActionsBar();
  renderBoard();
  renderList();
  renderCalendar();
}

function toggleSelectAllInColumn(columnId) {
  const tasks = state.tasks.filter(t => t.column_id === columnId && !t.archived_at && !t.deleted_at);
  const allSelected = tasks.length > 0 && tasks.every(t => state.selectedTaskIds.has(t.id));
  
  if (allSelected) {
    tasks.forEach(t => state.selectedTaskIds.delete(t.id));
  } else {
    tasks.forEach(t => state.selectedTaskIds.add(t.id));
  }
  
  updateBulkActionsBar();
  renderBoard();
}

function clearBulkSelection() {
  state.selectedTaskIds.clear();
  state.lastSelectedTaskId = null;
  updateBulkActionsBar();
  renderBoard();
  renderList();
  renderCalendar();
}

function updateBulkActionsBar() {
  const bar = document.getElementById('bulk-actions-bar');
  const count = state.selectedTaskIds.size;
  
  if (count === 0) {
    if (bar) bar.classList.add('hidden');
    return;
  }
  
  if (!bar) {
    createBulkActionsBar();
  } else {
    bar.classList.remove('hidden');
    const countEl = bar.querySelector('.bulk-actions-count');
    if (countEl) countEl.textContent = count;
  }
}

function createBulkActionsBar() {
  let bar = document.getElementById('bulk-actions-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'bulk-actions-bar';
    bar.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3 z-50 flex items-center gap-3';
    document.body.appendChild(bar);
  }
  
  const count = state.selectedTaskIds.size;
  bar.innerHTML = 
    '<span class="text-sm font-medium text-gray-700 dark:text-gray-300 bulk-actions-count">' + count + ' selected</span>' +
    '<div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>' +
    '<button onclick="bulkMoveToColumn()" class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-2" title="Move to column">' +
      '<i class="fas fa-arrows-alt-v text-xs"></i>' +
      '<span>Move</span>' +
    '</button>' +
    '<button onclick="bulkChangePriority()" class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-2" title="Change priority">' +
      '<i class="fas fa-flag text-xs"></i>' +
      '<span>Priority</span>' +
    '</button>' +
    '<button onclick="bulkManageTags()" class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-2" title="Manage tags">' +
      '<i class="fas fa-tags text-xs"></i>' +
      '<span>Tags</span>' +
    '</button>' +
    '<button onclick="bulkSetDueDate()" class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center gap-2" title="Set due date">' +
      '<i class="fas fa-calendar text-xs"></i>' +
      '<span>Due Date</span>' +
    '</button>' +
    '<div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>' +
    '<button onclick="bulkArchive()" class="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center gap-2" title="Archive">' +
      '<i class="fas fa-archive text-xs"></i>' +
      '<span>Archive</span>' +
    '</button>' +
    '<button onclick="bulkDelete()" class="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center gap-2" title="Delete">' +
      '<i class="fas fa-trash text-xs"></i>' +
      '<span>Delete</span>' +
    '</button>' +
    '<button onclick="clearBulkSelection()" class="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors" title="Clear selection">' +
      '<i class="fas fa-times"></i>' +
    '</button>';
  
  bar.classList.remove('hidden');
}

async function bulkMoveToColumn() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  const columns = state.columns.filter(c => !c.deleted_at);
  if (columns.length === 0) {
    showToast('No columns available', 'error');
    return;
  }
  
  // Create a custom select dialog
  const result = await new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    let optionsHtml = '';
    columns.forEach(col => {
      optionsHtml += '<option value="' + col.id + '">' + escapeHtml(col.name) + '</option>';
    });
    
    overlay.innerHTML = '<div class="custom-dialog">' +
      '<div class="custom-dialog-header">' +
        '<div class="custom-dialog-title">Move Tasks to Column</div>' +
        '<div class="custom-dialog-message">Select the column to move ' + selectedIds.length + ' task(s) to:</div>' +
      '</div>' +
      '<div class="custom-dialog-body">' +
        '<select id="bulk-column-select" class="custom-dialog-input">' + optionsHtml + '</select>' +
      '</div>' +
      '<div class="custom-dialog-footer">' +
        '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="bulk-cancel">Cancel</button>' +
        '<button class="custom-dialog-btn custom-dialog-btn-primary" id="bulk-confirm">Move</button>' +
      '</div>' +
    '</div>';
    
    document.body.appendChild(overlay);
    
    function close(result) {
      overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
      overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 150);
    }
    
    document.getElementById('bulk-cancel').addEventListener('click', () => close(null));
    document.getElementById('bulk-confirm').addEventListener('click', () => {
      const select = document.getElementById('bulk-column-select');
      close({ value: select.value });
    });
    
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') close(null);
    });
  });
  
  if (!result || !result.value) return;
  
  try {
    const promises = selectedIds.map(id => 
      apiCall('/api/tasks/' + id, 'PATCH', { column_id: result.value })
    );
    await Promise.all(promises);
    
    showToast('Moved ' + selectedIds.length + ' task(s) to column', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error moving tasks:', error);
    showToast('Failed to move tasks', 'error');
  }
}

async function bulkChangePriority() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  const priorities = ['high', 'medium', 'low'];
  let optionsHtml = '';
  priorities.forEach(p => {
    optionsHtml += '<option value="' + p + '">' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>';
  });
  
  const result = await new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    
    overlay.innerHTML = '<div class="custom-dialog">' +
      '<div class="custom-dialog-header">' +
        '<div class="custom-dialog-title">Change Priority</div>' +
        '<div class="custom-dialog-message">Select priority for ' + selectedIds.length + ' task(s):</div>' +
      '</div>' +
      '<div class="custom-dialog-body">' +
        '<select id="bulk-priority-select" class="custom-dialog-input">' + optionsHtml + '</select>' +
      '</div>' +
      '<div class="custom-dialog-footer">' +
        '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="bulk-cancel">Cancel</button>' +
        '<button class="custom-dialog-btn custom-dialog-btn-primary" id="bulk-confirm">Update</button>' +
      '</div>' +
    '</div>';
    
    document.body.appendChild(overlay);
    
    function close(result) {
      overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
      overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 150);
    }
    
    document.getElementById('bulk-cancel').addEventListener('click', () => close(null));
    document.getElementById('bulk-confirm').addEventListener('click', () => {
      const select = document.getElementById('bulk-priority-select');
      close({ value: select.value });
    });
    
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') close(null);
    });
  });
  
  if (!result || !result.value) return;
  
  try {
    const promises = selectedIds.map(id => 
      apiCall('/api/tasks/' + id, 'PATCH', { priority: result.value })
    );
    await Promise.all(promises);
    
    showToast('Updated priority for ' + selectedIds.length + ' task(s)', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error updating priority:', error);
    showToast('Failed to update priority', 'error');
  }
}

async function bulkManageTags() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  // Get all unique tags from selected tasks
  const allTags = new Set();
  selectedIds.forEach(id => {
    const task = state.tasks.find(t => t.id === id);
    if (task && task.tags) {
      task.tags.forEach(tag => allTags.add(tag));
    }
  });
  
  const result = await customPrompt(
    'Manage Tags',
    'Enter tags (comma-separated) to add or remove for ' + selectedIds.length + ' task(s):',
    { placeholder: 'e.g., urgent, review, bug' }
  );
  
  if (!result) return;
  
  const newTags = result.split(',').map(t => t.trim()).filter(t => t.length > 0);
  
  try {
    const promises = selectedIds.map(async id => {
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;
      
      let updatedTags = [...(task.tags || [])];
      
      // Add new tags that don't exist
      newTags.forEach(tag => {
        if (!updatedTags.includes(tag)) {
          updatedTags.push(tag);
        } else {
          // Remove if it already exists (toggle behavior)
          updatedTags = updatedTags.filter(t => t !== tag);
        }
      });
      
      return apiCall('/api/tasks/' + id, 'PATCH', { tags: updatedTags });
    });
    
    await Promise.all(promises);
    
    showToast('Updated tags for ' + selectedIds.length + ' task(s)', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error updating tags:', error);
    showToast('Failed to update tags', 'error');
  }
}

async function bulkSetDueDate() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  const result = await customPrompt(
    'Set Due Date',
    'Enter due date for ' + selectedIds.length + ' task(s) (YYYY-MM-DD or leave empty to clear):',
    { placeholder: 'YYYY-MM-DD' }
  );
  
  if (result === null) return;
  
  const dueDate = result ? result.trim() : null;
  
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    showToast('Invalid date format. Use YYYY-MM-DD', 'error');
    return;
  }
  
  try {
    const promises = selectedIds.map(id => 
      apiCall('/api/tasks/' + id, 'PATCH', { due_date: dueDate })
    );
    await Promise.all(promises);
    
    showToast('Updated due date for ' + selectedIds.length + ' task(s)', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error updating due date:', error);
    showToast('Failed to update due date', 'error');
  }
}

async function bulkArchive() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  const confirmed = await customConfirm(
    'Archive Tasks',
    'Are you sure you want to archive ' + selectedIds.length + ' task(s)?',
    { confirmText: 'Archive', cancelText: 'Cancel' }
  );
  
  if (!confirmed) return;
  
  try {
    const promises = selectedIds.map(id => 
      apiCall('/api/tasks/' + id + '/archive', 'POST')
    );
    await Promise.all(promises);
    
    showToast('Archived ' + selectedIds.length + ' task(s)', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error archiving tasks:', error);
    showToast('Failed to archive tasks', 'error');
  }
}

async function bulkDelete() {
  const selectedIds = Array.from(state.selectedTaskIds);
  if (selectedIds.length === 0) return;
  
  const confirmed = await customConfirm(
    'Delete Tasks',
    'Are you sure you want to delete ' + selectedIds.length + ' task(s)? This action cannot be undone.',
    { confirmText: 'Delete', cancelText: 'Cancel', danger: true }
  );
  
  if (!confirmed) return;
  
  try {
    const promises = selectedIds.map(id => 
      apiCall('/api/tasks/' + id, 'DELETE')
    );
    await Promise.all(promises);
    
    showToast('Deleted ' + selectedIds.length + ' task(s)', 'success');
    clearBulkSelection();
    await loadBoard();
  } catch (error) {
    console.error('Error deleting tasks:', error);
    showToast('Failed to delete tasks', 'error');
  }
}

// ===================================
// Recurrence Helper Functions
// ===================================

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getRecurrenceSummary(rule) {
  if (!rule) return null;
  
  switch (rule.type) {
    case 'daily':
      return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
      
    case 'weekly':
      if (rule.weekdays && rule.weekdays.length > 0) {
        if (rule.weekdays.length === 7) return 'Every day';
        if (rule.weekdays.length === 5 && 
            rule.weekdays.includes(1) && rule.weekdays.includes(2) && 
            rule.weekdays.includes(3) && rule.weekdays.includes(4) && 
            rule.weekdays.includes(5)) {
          return 'Weekdays';
        }
        const days = rule.weekdays.map(d => WEEKDAY_SHORT[d]).join(', ');
        return rule.interval === 1 ? `Weekly on ${days}` : `Every ${rule.interval} weeks on ${days}`;
      }
      return rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`;
      
    case 'monthly':
      if (rule.monthDay) {
        const suffix = getOrdinalSuffix(rule.monthDay);
        return rule.interval === 1 
          ? `Monthly on the ${rule.monthDay}${suffix}` 
          : `Every ${rule.interval} months on the ${rule.monthDay}${suffix}`;
      }
      if (rule.monthWeek !== undefined && rule.monthWeekday !== undefined) {
        const weekNum = rule.monthWeek === -1 ? 'last' : `${rule.monthWeek}${getOrdinalSuffix(rule.monthWeek)}`;
        const day = WEEKDAY_NAMES[rule.monthWeekday];
        return rule.interval === 1 
          ? `Monthly on the ${weekNum} ${day}` 
          : `Every ${rule.interval} months on the ${weekNum} ${day}`;
      }
      return rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`;
      
    case 'custom':
      return `Every ${rule.interval} days`;
      
    default:
      return 'Recurring';
  }
}

function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function buildRecurrenceRule() {
  const typeSelect = document.getElementById('recurrence-type');
  if (!typeSelect || typeSelect.value === 'none') return null;
  
  const type = typeSelect.value;
  const interval = parseInt(document.getElementById('recurrence-interval')?.value || '1') || 1;
  
  const rule = { type, interval };
  
  if (type === 'weekly') {
    const weekdayCheckboxes = document.querySelectorAll('.weekday-checkbox:checked');
    if (weekdayCheckboxes.length > 0) {
      rule.weekdays = Array.from(weekdayCheckboxes).map(cb => parseInt(cb.value));
    }
  }
  
  if (type === 'monthly') {
    const monthlyType = document.querySelector('input[name="monthly-type"]:checked')?.value || 'day';
    if (monthlyType === 'day') {
      rule.monthDay = parseInt(document.getElementById('month-day')?.value || '1') || 1;
    } else {
      rule.monthWeek = parseInt(document.getElementById('month-week')?.value || '1') || 1;
      rule.monthWeekday = parseInt(document.getElementById('month-weekday')?.value || '0') || 0;
    }
  }
  
  return rule;
}

function getRecurrenceEndInfo() {
  const endType = document.querySelector('input[name="recurrence-end"]:checked')?.value || 'never';
  
  if (endType === 'date') {
    const endDate = document.getElementById('recurrence-end-date-hidden')?.value;
    return { endDate: endDate || null, count: null };
  }
  
  if (endType === 'count') {
    const count = parseInt(document.getElementById('recurrence-count')?.value || '10') || 10;
    return { endDate: null, count };
  }
  
  return { endDate: null, count: null };
}

function updateRecurrencePreview() {
  const preview = document.getElementById('recurrence-preview');
  if (!preview) return;
  
  const rule = buildRecurrenceRule();
  if (!rule) {
    preview.innerHTML = '';
    preview.classList.add('hidden');
    return;
  }
  
  const summary = getRecurrenceSummary(rule);
  const endInfo = getRecurrenceEndInfo();
  
  let endText = '';
  if (endInfo.endDate) {
    endText = ` until ${new Date(endInfo.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (endInfo.count) {
    endText = `, ${endInfo.count} times`;
  }
  
  preview.innerHTML = `<i class="fas fa-sync-alt mr-1"></i>${summary}${endText}`;
  preview.classList.remove('hidden');
}

async function completeRecurringTask(taskId, action, doneColumnId) {
  try {
    const result = await api('/api/tasks/' + taskId + '/complete-recurring', {
      method: 'POST',
      body: JSON.stringify({ action, done_column_id: doneColumnId })
    });
    
    if (result.has_more_recurrences) {
      showToast('Next occurrence created', 'success');
    } else {
      showToast('Recurrence completed', 'success');
    }
    
    await loadBoard();
    return result;
  } catch (error) {
    console.error('Failed to complete recurring task:', error);
    showToast('Failed to complete recurring task', 'error');
    return null;
  }
}

async function skipRecurringOccurrence(taskId) {
  try {
    const result = await api('/api/tasks/' + taskId + '/skip-occurrence', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (result.skipped) {
      showToast('Skipped to next occurrence', 'success');
    } else {
      showToast(result.message || 'Recurrence updated', 'info');
    }
    
    closeTaskModal();
    await loadBoard();
    return result;
  } catch (error) {
    console.error('Failed to skip occurrence:', error);
    showToast('Failed to skip occurrence', 'error');
    return null;
  }
}

function buildRecurrenceUI(task) {
  const rule = task.recurrence_rule;
  const hasRecurrence = !!rule;
  const currentType = rule?.type || 'none';
  const interval = rule?.interval || 1;
  const weekdays = rule?.weekdays || [];
  const monthDay = rule?.monthDay || 1;
  const monthWeek = rule?.monthWeek || 1;
  const monthWeekday = rule?.monthWeekday || 0;
  const endDate = task.recurrence_end_date || '';
  const endCount = task.recurrence_count || 10;
  const completedCount = task.recurrence_completed_count || 0;
  
  // Determine which radio to check for monthly type
  const monthlyType = rule?.monthDay ? 'day' : (rule?.monthWeek !== undefined ? 'relative' : 'day');
  
  // Determine end type
  let endType = 'never';
  if (task.recurrence_end_date) endType = 'date';
  else if (task.recurrence_count) endType = 'count';
  
  // Instance indicator
  let instanceBadge = '';
  if (task.is_recurrence_instance) {
    instanceBadge = '<div class="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">' +
      '<i class="fas fa-sync-alt text-blue-500"></i>' +
      '<span class="text-sm text-blue-700 dark:text-blue-300">This is a recurring occurrence' + (completedCount > 0 ? ` (#${completedCount + 1})` : '') + '</span>' +
      '</div>';
  }
  
  let html = '<div class="recurrence-section">' +
    '<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">' +
    '<i class="fas fa-sync-alt mr-1"></i>Recurrence</label>' +
    instanceBadge +
    '<div class="space-y-3">' +
    // Recurrence type select
    '<div class="flex items-center gap-2">' +
    '<select id="recurrence-type" name="recurrence_type" onchange="toggleRecurrenceOptions()" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-accent focus:border-transparent text-sm">' +
    '<option value="none"' + (currentType === 'none' ? ' selected' : '') + '>Does not repeat</option>' +
    '<option value="daily"' + (currentType === 'daily' ? ' selected' : '') + '>Daily</option>' +
    '<option value="weekly"' + (currentType === 'weekly' ? ' selected' : '') + '>Weekly</option>' +
    '<option value="monthly"' + (currentType === 'monthly' ? ' selected' : '') + '>Monthly</option>' +
    '<option value="custom"' + (currentType === 'custom' ? ' selected' : '') + '>Custom</option>' +
    '</select>' +
    '</div>' +
    
    // Recurrence options container
    '<div id="recurrence-options" class="' + (hasRecurrence ? '' : 'hidden') + ' space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">' +
    
    // Interval (shown for daily, weekly, monthly, custom)
    '<div id="interval-row" class="flex items-center gap-2">' +
    '<span class="text-sm text-gray-600 dark:text-gray-400">Every</span>' +
    '<input type="number" id="recurrence-interval" name="recurrence_interval" min="1" max="99" value="' + interval + '" ' +
    'class="w-16 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-center focus:ring-2 focus:ring-accent focus:border-transparent" ' +
    'onchange="updateRecurrencePreview()">' +
    '<span id="interval-label" class="text-sm text-gray-600 dark:text-gray-400">' + getIntervalLabel(currentType, interval) + '</span>' +
    '</div>' +
    
    // Weekday selector (for weekly)
    '<div id="weekday-selector" class="' + (currentType === 'weekly' ? '' : 'hidden') + '">' +
    '<span class="text-sm text-gray-600 dark:text-gray-400 block mb-2">Repeat on:</span>' +
    '<div class="flex flex-wrap gap-1">' +
    WEEKDAY_SHORT.map((day, i) => {
      const checked = weekdays.includes(i) ? ' checked' : '';
      return '<label class="weekday-toggle">' +
        '<input type="checkbox" class="weekday-checkbox sr-only" value="' + i + '"' + checked + ' onchange="updateRecurrencePreview()">' +
        '<span class="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-medium cursor-pointer transition-colors ' +
        'border border-gray-300 dark:border-gray-600 ' +
        (weekdays.includes(i) ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600') + '">' +
        day.substring(0, 2) + '</span></label>';
    }).join('') +
    '</div></div>' +
    
    // Monthly options
    '<div id="monthly-options" class="' + (currentType === 'monthly' ? '' : 'hidden') + ' space-y-2">' +
    '<label class="flex items-center gap-2 cursor-pointer">' +
    '<input type="radio" name="monthly-type" value="day"' + (monthlyType === 'day' ? ' checked' : '') + ' class="text-accent focus:ring-accent" onchange="toggleMonthlyType(); updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">On day</span>' +
    '<input type="number" id="month-day" min="1" max="31" value="' + monthDay + '" class="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-center focus:ring-2 focus:ring-accent focus:border-transparent" onchange="updateRecurrencePreview()">' +
    '</label>' +
    '<label class="flex items-center gap-2 cursor-pointer">' +
    '<input type="radio" name="monthly-type" value="relative"' + (monthlyType === 'relative' ? ' checked' : '') + ' class="text-accent focus:ring-accent" onchange="toggleMonthlyType(); updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">On the</span>' +
    '<select id="month-week" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent focus:border-transparent" onchange="updateRecurrencePreview()">' +
    '<option value="1"' + (monthWeek === 1 ? ' selected' : '') + '>1st</option>' +
    '<option value="2"' + (monthWeek === 2 ? ' selected' : '') + '>2nd</option>' +
    '<option value="3"' + (monthWeek === 3 ? ' selected' : '') + '>3rd</option>' +
    '<option value="4"' + (monthWeek === 4 ? ' selected' : '') + '>4th</option>' +
    '<option value="-1"' + (monthWeek === -1 ? ' selected' : '') + '>Last</option>' +
    '</select>' +
    '<select id="month-weekday" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent focus:border-transparent" onchange="updateRecurrencePreview()">' +
    WEEKDAY_NAMES.map((day, i) => '<option value="' + i + '"' + (monthWeekday === i ? ' selected' : '') + '>' + day + '</option>').join('') +
    '</select>' +
    '</label></div>' +
    
    // End options
    '<div class="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">' +
    '<span class="text-sm text-gray-600 dark:text-gray-400 block mb-2">Ends:</span>' +
    '<div class="space-y-2">' +
    '<label class="flex items-center gap-2 cursor-pointer">' +
    '<input type="radio" name="recurrence-end" value="never"' + (endType === 'never' ? ' checked' : '') + ' class="text-accent focus:ring-accent" onchange="toggleEndOptions(); updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">Never</span>' +
    '</label>' +
    '<label class="flex items-center gap-2 cursor-pointer">' +
    '<input type="radio" name="recurrence-end" value="date"' + (endType === 'date' ? ' checked' : '') + ' class="text-accent focus:ring-accent" onchange="toggleEndOptions(); updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">On</span>' +
    '<div id="recurrence-end-date-container" class="flex-1 date-picker-container">' +
    '<input type="hidden" id="recurrence-end-date-hidden" name="recurrence_end_date" value="' + endDate + '">' +
    '<input type="text" id="recurrence-end-date-display" readonly class="date-picker-input w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm cursor-pointer focus:ring-2 focus:ring-accent focus:border-transparent" placeholder="Select date..." value="' + (endDate ? new Date(endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '') + '">' +
    '</div></label>' +
    '<label class="flex items-center gap-2 cursor-pointer">' +
    '<input type="radio" name="recurrence-end" value="count"' + (endType === 'count' ? ' checked' : '') + ' class="text-accent focus:ring-accent" onchange="toggleEndOptions(); updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">After</span>' +
    '<input type="number" id="recurrence-count" min="1" max="999" value="' + endCount + '" class="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-center focus:ring-2 focus:ring-accent focus:border-transparent" onchange="updateRecurrencePreview()">' +
    '<span class="text-sm text-gray-700 dark:text-gray-300">occurrences</span>' +
    '</label></div></div>' +
    
    // Preview
    '<div id="recurrence-preview" class="' + (hasRecurrence ? '' : 'hidden') + ' text-sm text-accent font-medium px-3 py-2 bg-accent/10 rounded-lg">' +
    (hasRecurrence ? '<i class="fas fa-sync-alt mr-1"></i>' + getRecurrenceSummary(rule) : '') +
    '</div>' +
    
    '</div></div></div>';
  
  return html;
}

function getIntervalLabel(type, interval) {
  const plural = interval !== 1;
  switch (type) {
    case 'daily':
    case 'custom':
      return plural ? 'days' : 'day';
    case 'weekly':
      return plural ? 'weeks' : 'week';
    case 'monthly':
      return plural ? 'months' : 'month';
    default:
      return 'days';
  }
}

function toggleRecurrenceOptions() {
  const typeSelect = document.getElementById('recurrence-type');
  const optionsDiv = document.getElementById('recurrence-options');
  const weekdaySelector = document.getElementById('weekday-selector');
  const monthlyOptions = document.getElementById('monthly-options');
  const intervalLabel = document.getElementById('interval-label');
  const intervalInput = document.getElementById('recurrence-interval');
  
  if (!typeSelect || !optionsDiv) return;
  
  const type = typeSelect.value;
  
  if (type === 'none') {
    optionsDiv.classList.add('hidden');
  } else {
    optionsDiv.classList.remove('hidden');
    
    // Update interval label
    if (intervalLabel && intervalInput) {
      intervalLabel.textContent = getIntervalLabel(type, parseInt(intervalInput.value) || 1);
    }
    
    // Show/hide weekday selector
    if (weekdaySelector) {
      weekdaySelector.classList.toggle('hidden', type !== 'weekly');
    }
    
    // Show/hide monthly options
    if (monthlyOptions) {
      monthlyOptions.classList.toggle('hidden', type !== 'monthly');
    }
  }
  
  updateRecurrencePreview();
}

function toggleMonthlyType() {
  // No specific action needed, just update preview
  updateRecurrencePreview();
}

function toggleEndOptions() {
  // No specific action needed, just update preview
  updateRecurrencePreview();
}

function initRecurrenceUI() {
  // Initialize weekday toggle styling
  const checkboxes = document.querySelectorAll('.weekday-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', function() {
      const span = this.nextElementSibling;
      if (this.checked) {
        span.classList.add('bg-accent', 'text-white', 'border-accent');
        span.classList.remove('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
      } else {
        span.classList.remove('bg-accent', 'text-white', 'border-accent');
        span.classList.add('bg-white', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
      }
    });
  });
  
  // Initialize recurrence end date picker
  const endDateDisplay = document.getElementById('recurrence-end-date-display');
  const endDateHidden = document.getElementById('recurrence-end-date-hidden');
  if (endDateDisplay && endDateHidden) {
    initDatePicker('recurrence-end-date-display', 'recurrence-end-date-hidden', endDateHidden.value || null, { useModal: true });
  }
  
  // Update preview
  updateRecurrencePreview();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return diffMinutes === 1 ? '1 minute ago' : diffMinutes + ' minutes ago';
  if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : diffHours + ' hours ago';
  if (diffDays < 7) return diffDays === 1 ? '1 day ago' : diffDays + ' days ago';
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : weeks + ' weeks ago';
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : months + ' months ago';
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : years + ' years ago';
}

// Format activity message based on action type
function formatActivityMessage(activity) {
  const details = activity.details || {};
  const action = activity.action;
  
  switch (action) {
    case 'created':
      return 'Task created' + (details.column_name ? ' in ' + escapeHtml(details.column_name) : '');
    case 'moved':
      return 'Moved from "' + escapeHtml(details.from_column || 'Unknown') + '" to "' + escapeHtml(details.to_column || 'Unknown') + '"';
    case 'edited':
      if (details.field === 'title') {
        return 'Title changed from "' + escapeHtml(details.old_value || '') + '" to "' + escapeHtml(details.new_value || '') + '"';
      }
      return 'Description updated';
    case 'priority_changed':
      return 'Priority changed from ' + escapeHtml(details.old_priority || '') + ' to ' + escapeHtml(details.new_priority || '');
    case 'due_date_set':
      const dueDate = details.due_date ? new Date(details.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      return 'Due date set to ' + dueDate;
    case 'due_date_removed':
      return 'Due date removed';
    case 'tag_added':
      const addedTags = Array.isArray(details.tags) ? details.tags : [details.tags];
      return 'Tag' + (addedTags.length > 1 ? 's' : '') + ' added: ' + addedTags.map(t => '#' + escapeHtml(t)).join(', ');
    case 'tag_removed':
      const removedTags = Array.isArray(details.tags) ? details.tags : [details.tags];
      return 'Tag' + (removedTags.length > 1 ? 's' : '') + ' removed: ' + removedTags.map(t => '#' + escapeHtml(t)).join(', ');
    case 'archived':
      return 'Task archived';
    case 'restored':
      return 'Task restored from archive';
    case 'deleted':
      return 'Task deleted';
    case 'subtask_completed':
      return 'Subtask "' + escapeHtml(details.title || '') + '" ' + (details.completed ? 'completed' : 'uncompleted');
    case 'subtask_created':
      return 'Subtask "' + escapeHtml(details.title || '') + '" added';
    case 'subtask_deleted':
      return 'Subtask "' + escapeHtml(details.title || '') + '" deleted';
    default:
      return 'Activity: ' + escapeHtml(action);
  }
}

// Get activity icon based on action
function getActivityIcon(action) {
  switch (action) {
    case 'created': return 'fa-plus-circle';
    case 'moved': return 'fa-arrows-alt';
    case 'edited': return 'fa-edit';
    case 'priority_changed': return 'fa-flag';
    case 'due_date_set': return 'fa-calendar-check';
    case 'due_date_removed': return 'fa-calendar-times';
    case 'tag_added': return 'fa-tag';
    case 'tag_removed': return 'fa-tag';
    case 'archived': return 'fa-archive';
    case 'restored': return 'fa-undo';
    case 'deleted': return 'fa-trash';
    case 'subtask_completed': return 'fa-check-circle';
    case 'subtask_created': return 'fa-plus';
    case 'subtask_deleted': return 'fa-trash-alt';
    default: return 'fa-circle';
  }
}

// Fetch and render activity log for a task
async function loadTaskActivityLog(taskId) {
  try {
    const response = await fetch(`/api/tasks/${taskId}/activity?limit=50`);
    const result = await response.json();
    
    if (result.success && result.data) {
      renderActivityLog(result.data);
    }
  } catch (error) {
    console.error('Error loading activity log:', error);
  }
}

// Render activity log entries
function renderActivityLog(activities) {
  const container = document.getElementById('activity-log-list');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = '<div class="empty-state-message"><i class="fas fa-history empty-state-icon"></i><span class="empty-state-text">No activity yet</span></div>';
    return;
  }

  let html = '';
  activities.forEach(activity => {
    const message = formatActivityMessage(activity);
    const timeAgo = formatRelativeTime(activity.created_at);

    html += '<div class="activity-item">' +
      '<div class="activity-item-content">' + message + '</div>' +
      '<div class="activity-item-time">' + timeAgo + '</div></div>';
  });

  container.innerHTML = html;
}

// Calculate due date status for visual indicators
function getDueDateStatus(dateString) {
  if (!dateString) return null;
  
  const dueDate = new Date(dateString);
  const now = new Date();
  
  // Reset time parts for accurate day comparison
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dueDateOnly - todayOnly;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { 
      status: 'overdue', 
      label: Math.abs(diffDays) === 1 ? '1 day overdue' : `${Math.abs(diffDays)} days overdue`,
      class: 'task-overdue',
      badgeClass: 'overdue',
      icon: 'fa-exclamation-circle'
    };
  } else if (diffDays === 0) {
    return { 
      status: 'due-today', 
      label: 'Due today',
      class: 'task-due-today',
      badgeClass: 'due-today',
      icon: 'fa-clock'
    };
  } else if (diffDays === 1) {
    return { 
      status: 'due-tomorrow', 
      label: 'Due tomorrow',
      class: 'task-due-tomorrow',
      badgeClass: 'due-tomorrow',
      icon: 'fa-clock'
    };
  } else if (diffDays <= 7) {
    return { 
      status: 'due-soon', 
      label: `Due in ${diffDays} days`,
      class: 'task-due-soon',
      badgeClass: 'due-soon',
      icon: 'fa-calendar'
    };
  } else {
    return { 
      status: 'no-urgency', 
      label: formatDate(dateString),
      class: '',
      badgeClass: 'no-urgency',
      icon: 'fa-calendar'
    };
  }
}

// Count overdue tasks
function getOverdueCount() {
  if (!state.tasks) return 0;
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return state.tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    return dueDateOnly < todayOnly;
  }).length;
}

// Update overdue badge in header
function updateOverdueBadge() {
  const badge = document.getElementById('overdue-count-badge');
  const count = getOverdueCount();
  
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Global function to close any modal overlay by ID
function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  
  // Animate out
  overlay.style.animation = 'fadeOut 0.2s ease forwards';
  const content = overlay.querySelector('.bg-white, .dark\\:bg-gray-800');
  if (content) {
    content.style.animation = 'dialogOut 0.15s ease forwards';
  }
  
  setTimeout(() => overlay.remove(), 200);
}

// Show overdue tasks in a modal
function showOverdueTasks() {
  const overdueTasks = state.tasks.filter(task => {
    const status = getDueDateStatus(task.due_date);
    return status && status.status === 'overdue';
  });
  
  // Close user menu if open
  const userMenu = document.getElementById('user-menu-dropdown');
  if (userMenu && !userMenu.classList.contains('hidden')) {
    userMenu.classList.add('hidden');
  }
  
  if (overdueTasks.length === 0) {
    showToast('No overdue tasks! 🎉', 'success');
    return;
  }
  
  // Create modal
  const existingOverlay = document.getElementById('overdue-tasks-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'overdue-tasks-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  overlay.style.animation = 'fadeIn 0.2s ease';
  
  let tasksHtml = overdueTasks.map(task => {
    const status = getDueDateStatus(task.due_date);
    const column = state.columns.find(c => c.id === task.column_id);
    const columnName = column ? column.name : 'Unknown';
    
    return `
      <div class="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" onclick="openTaskModal('${task.id}'); closeModal('overdue-tasks-overlay');">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <i class="fas fa-exclamation-circle text-red-500"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-gray-100 truncate">${escapeHtml(task.title)}</p>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-red-600 dark:text-red-400">${status.label}</span>
            <span class="text-gray-400">•</span>
            <span class="text-gray-500 dark:text-gray-400">${columnName}</span>
          </div>
        </div>
        <i class="fas fa-chevron-right text-gray-400"></i>
      </div>
    `;
  }).join('');
  
  overlay.innerHTML = `
    <div class="utility-modal bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col" style="animation: dialogIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div class="utility-modal-header p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <i class="fas fa-bell text-red-500"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Overdue Tasks</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''} need${overdueTasks.length === 1 ? 's' : ''} attention</p>
          </div>
        </div>
        <button onclick="closeModal('overdue-tasks-overlay')" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="utility-modal-body p-4 flex-1 overflow-y-auto">
        <div class="space-y-2">
          ${tasksHtml}
        </div>
      </div>
      <div class="utility-modal-footer p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button onclick="closeModal('overdue-tasks-overlay')" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal('overdue-tasks-overlay');
    }
  });
  
  document.body.appendChild(overlay);
}

// ===================================
// Global Search
// ===================================

const globalSearch = {
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  filters: {
    priority: null,
    due: null,
    boardId: null
  },
  debounceTimer: null
};

function openGlobalSearch() {
  if (globalSearch.isOpen) return;
  globalSearch.isOpen = true;
  globalSearch.query = '';
  globalSearch.results = [];
  globalSearch.selectedIndex = 0;
  globalSearch.filters = { priority: null, due: null, boardId: null };
  
  const existingOverlay = document.getElementById('global-search-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'global-search-overlay';
  overlay.className = 'global-search-overlay';
  
  overlay.innerHTML = `
    <div class="global-search" onclick="event.stopPropagation()">
      <div class="global-search-header">
        <i class="fas fa-search"></i>
        <input type="text" id="global-search-input" placeholder="Search tasks across all projects..." autocomplete="off" />
        <button onclick="closeGlobalSearch()" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <kbd>esc</kbd>
        </button>
      </div>
      
      <div class="global-search-filters" id="global-search-filters">
        <button class="search-filter-chip" data-filter="priority" data-value="high" onclick="toggleSearchFilter('priority', 'high')">
          <span class="search-result-priority high"></span> High
        </button>
        <button class="search-filter-chip" data-filter="priority" data-value="medium" onclick="toggleSearchFilter('priority', 'medium')">
          <span class="search-result-priority medium"></span> Medium
        </button>
        <button class="search-filter-chip" data-filter="priority" data-value="low" onclick="toggleSearchFilter('priority', 'low')">
          <span class="search-result-priority low"></span> Low
        </button>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <button class="search-filter-chip" data-filter="due" data-value="overdue" onclick="toggleSearchFilter('due', 'overdue')">
          <i class="fas fa-exclamation-circle text-red-500"></i> Overdue
        </button>
        <button class="search-filter-chip" data-filter="due" data-value="today" onclick="toggleSearchFilter('due', 'today')">
          <i class="fas fa-clock text-orange-500"></i> Due Today
        </button>
        <button class="search-filter-chip" data-filter="due" data-value="week" onclick="toggleSearchFilter('due', 'week')">
          <i class="fas fa-calendar text-blue-500"></i> This Week
        </button>
        <button class="search-filter-chip" data-filter="due" data-value="no_date" onclick="toggleSearchFilter('due', 'no_date')">
          <i class="fas fa-calendar-times text-gray-400"></i> No Date
        </button>
      </div>
      
      <div class="global-search-results" id="global-search-results">
        <div class="global-search-empty">
          <i class="fas fa-search"></i>
          <p>Start typing to search tasks</p>
          <p class="text-sm mt-2">Search in titles, descriptions, and tags</p>
        </div>
      </div>
      
      <div class="global-search-footer">
        <div class="flex items-center gap-4">
          <span><kbd>↑↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
        <div id="search-result-count"></div>
      </div>
    </div>
  `;
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeGlobalSearch();
    }
  });
  
  document.body.appendChild(overlay);
  
  // Focus input
  const input = document.getElementById('global-search-input');
  input.focus();
  
  // Input handler with debounce
  input.addEventListener('input', (e) => {
    globalSearch.query = e.target.value;
    clearTimeout(globalSearch.debounceTimer);
    globalSearch.debounceTimer = setTimeout(() => {
      performGlobalSearch();
    }, 200);
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      globalSearch.selectedIndex = Math.min(globalSearch.selectedIndex + 1, globalSearch.results.length - 1);
      updateSearchResultsSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      globalSearch.selectedIndex = Math.max(globalSearch.selectedIndex - 1, 0);
      updateSearchResultsSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedTask = globalSearch.results[globalSearch.selectedIndex];
      if (selectedTask) {
        selectSearchResult(selectedTask);
      }
    } else if (e.key === 'Escape') {
      closeGlobalSearch();
    }
  });
}

function closeGlobalSearch() {
  globalSearch.isOpen = false;
  const overlay = document.getElementById('global-search-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.15s ease forwards';
    const modal = overlay.querySelector('.global-search');
    if (modal) {
      modal.style.animation = 'dialogOut 0.15s ease forwards';
    }
    setTimeout(() => overlay.remove(), 150);
  }
}

function toggleSearchFilter(filterType, value) {
  // Toggle filter
  if (globalSearch.filters[filterType] === value) {
    globalSearch.filters[filterType] = null;
  } else {
    globalSearch.filters[filterType] = value;
  }
  
  // Update UI
  const filterBtns = document.querySelectorAll('.search-filter-chip[data-filter="' + filterType + '"]');
  filterBtns.forEach(btn => {
    if (btn.dataset.value === globalSearch.filters[filterType]) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Re-run search
  performGlobalSearch();
}

async function performGlobalSearch() {
  const resultsContainer = document.getElementById('global-search-results');
  const countEl = document.getElementById('search-result-count');
  
  // Build query params
  const params = new URLSearchParams();
  if (globalSearch.query) params.set('q', globalSearch.query);
  if (globalSearch.filters.priority) params.set('priority', globalSearch.filters.priority);
  if (globalSearch.filters.due) params.set('due', globalSearch.filters.due);
  if (globalSearch.filters.boardId) params.set('board_id', globalSearch.filters.boardId);
  
  // Show loading if we have search criteria
  if (globalSearch.query || globalSearch.filters.priority || globalSearch.filters.due) {
    resultsContainer.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';
  }
  
  try {
    const results = await api('/api/search?' + params.toString());
    globalSearch.results = results || [];
    globalSearch.selectedIndex = 0;
    
    renderSearchResults();
    
    if (countEl) {
      countEl.textContent = globalSearch.results.length + ' result' + (globalSearch.results.length !== 1 ? 's' : '');
    }
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = '<div class="global-search-empty"><i class="fas fa-exclamation-triangle"></i><p>Search failed</p></div>';
  }
}

function renderSearchResults() {
  const resultsContainer = document.getElementById('global-search-results');
  
  if (globalSearch.results.length === 0) {
    if (globalSearch.query || globalSearch.filters.priority || globalSearch.filters.due) {
      resultsContainer.innerHTML = '<div class="global-search-empty"><i class="fas fa-search empty-state-icon"></i><p class="empty-state-text">No tasks found</p><p class="empty-state-subtext">Try different search terms or filters</p></div>';
    } else {
      resultsContainer.innerHTML = '<div class="global-search-empty"><i class="fas fa-search empty-state-icon"></i><p class="empty-state-text">Start typing to search tasks</p><p class="empty-state-subtext">Search in titles, descriptions, and tags</p></div>';
    }
    return;
  }
  
  let html = '';
  globalSearch.results.forEach((task, index) => {
    const title = highlightSearchTerm(escapeHtml(task.title), globalSearch.query);
    const dueBadge = task.due_date ? formatDueBadge(task.due_date) : '';
    
    html += `
      <div class="search-result-item${index === globalSearch.selectedIndex ? ' selected' : ''}" 
           data-index="${index}" 
           onclick="selectSearchResult(globalSearch.results[${index}])">
        <div class="search-result-content">
          <div class="search-result-title">${title}</div>
          <div class="search-result-meta">
            <span class="search-result-priority ${task.priority}"></span>
            <span class="project-badge">${escapeHtml(task.board_name || 'Unknown')}</span>
            <span>→</span>
            <span>${escapeHtml(task.column_name || 'Unknown')}</span>
            ${dueBadge}
          </div>
        </div>
        <i class="fas fa-chevron-right text-gray-300"></i>
      </div>
    `;
  });
  
  resultsContainer.innerHTML = html;
}

function highlightSearchTerm(text, query) {
  if (!query) return text;
  const regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatDueBadge(dateStr) {
  const status = getDueDateStatus(dateStr);
  if (!status) return '';
  
  let colorClass = 'text-gray-500';
  if (status.status === 'overdue') colorClass = 'text-red-500';
  else if (status.status === 'due-today') colorClass = 'text-orange-500';
  else if (status.status === 'due-tomorrow') colorClass = 'text-yellow-600';
  else if (status.status === 'due-soon') colorClass = 'text-blue-500';
  
  return '<span class="' + colorClass + '"><i class="fas ' + status.icon + ' text-xs mr-1"></i>' + status.label + '</span>';
}

function updateSearchResultsSelection() {
  const items = document.querySelectorAll('.search-result-item');
  items.forEach((item, index) => {
    if (index === globalSearch.selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

async function selectSearchResult(task) {
  closeGlobalSearch();
  
  // If task is from a different board, switch to it first
  if (task.board_id !== state.currentBoardId) {
    await loadBoard(task.board_id);
    // Wait for board to load before opening task
    setTimeout(() => {
      openTaskModal(task.id);
    }, 300);
  } else {
    // Same board, open task immediately
    openTaskModal(task.id);
  }
}

// Add keyboard shortcuts for search
document.addEventListener('keydown', function(e) {
  // "/" key opens search (when not in input)
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    openGlobalSearch();
  }
  
  // Cmd/Ctrl + F opens search
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
    e.preventDefault();
    openGlobalSearch();
  }
});

// ===================================
// Custom Date Picker
// ===================================

const datePicker = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  inputElement: null,
  hiddenInput: null,
  overlayElement: null,
  isOpen: false,
  onSelect: null,
  useModal: true // Use centered modal by default
};

function initDatePicker(inputId, hiddenInputId, initialValue, options = {}) {
  const input = document.getElementById(inputId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!input) return;
  
  datePicker.inputElement = input;
  datePicker.hiddenInput = hiddenInput;
  datePicker.useModal = options.useModal !== false; // Default to modal mode
  
  // Reset selected date
  datePicker.selectedDate = null;
  
  // Set initial value if provided
  if (initialValue) {
    datePicker.selectedDate = new Date(initialValue);
    datePicker.currentMonth = datePicker.selectedDate.getMonth();
    datePicker.currentYear = datePicker.selectedDate.getFullYear();
    input.value = formatDateForDisplay(datePicker.selectedDate);
  } else {
    // Reset to current month/year when no initial value
    datePicker.currentMonth = new Date().getMonth();
    datePicker.currentYear = new Date().getFullYear();
    input.value = '';
  }
  
  // Remove old listener if exists
  input.onclick = null;
  
  // Click handler
  input.addEventListener('click', function(e) {
    e.stopPropagation();
    if (datePicker.isOpen) {
      closeDatePicker();
    } else {
      openDatePicker();
    }
  });
}

function openDatePicker() {
  if (datePicker.overlayElement) {
    datePicker.overlayElement.remove();
  }
  
  if (datePicker.useModal) {
    // Modal mode - centered overlay
    const overlay = document.createElement('div');
    overlay.className = 'date-picker-modal-overlay';
    overlay.id = 'date-picker-overlay';
    
    overlay.innerHTML = '<div class="date-picker-modal" onclick="event.stopPropagation()">' +
      '<div class="date-picker-modal-title">Select Due Date</div>' +
      renderDatePickerContent() +
      '</div>';
    
    // Close on backdrop click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeDatePicker();
      }
    });
    
    document.body.appendChild(overlay);
    datePicker.overlayElement = overlay;
    
    attachDatePickerListeners(overlay.querySelector('.date-picker-modal'));
  } else {
    // Dropdown mode - positioned below input
    const dropdown = document.createElement('div');
    dropdown.className = 'date-picker-dropdown';
    dropdown.innerHTML = renderDatePickerContent();
    
    const container = datePicker.inputElement.parentElement;
    container.style.position = 'relative';
    container.appendChild(dropdown);
    
    datePicker.overlayElement = dropdown;
    
    attachDatePickerListeners(dropdown);
  }
  
  datePicker.isOpen = true;
}

function attachDatePickerListeners(container) {
  container.querySelector('.dp-prev-month').addEventListener('click', function() {
    navigateMonth(-1);
  });
  container.querySelector('.dp-next-month').addEventListener('click', function() {
    navigateMonth(1);
  });
  container.querySelector('.dp-clear').addEventListener('click', function() {
    clearDatePicker();
  });
  container.querySelector('.dp-today').addEventListener('click', function() {
    selectToday();
  });
  
  // Day click handlers
  container.querySelectorAll('.date-picker-day:not(.disabled)').forEach(function(day) {
    day.addEventListener('click', function() {
      const date = this.getAttribute('data-date');
      if (date) selectDate(new Date(date));
    });
  });
}

function closeDatePicker() {
  if (datePicker.overlayElement) {
    if (datePicker.useModal) {
      // Animate out for modal
      datePicker.overlayElement.style.animation = 'fadeOut 0.15s ease forwards';
      const modal = datePicker.overlayElement.querySelector('.date-picker-modal');
      if (modal) {
        modal.style.animation = 'dialogOut 0.15s ease forwards';
      }
      setTimeout(function() {
        if (datePicker.overlayElement) {
          datePicker.overlayElement.remove();
          datePicker.overlayElement = null;
        }
      }, 150);
    } else {
      datePicker.overlayElement.remove();
      datePicker.overlayElement = null;
    }
  }
  datePicker.isOpen = false;
}

function renderDatePickerContent() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  let html = '<div class="date-picker-header">' +
    '<span class="date-picker-month-year">' + monthNames[datePicker.currentMonth] + ' ' + datePicker.currentYear + '</span>' +
    '<div class="date-picker-nav">' +
      '<button type="button" class="dp-prev-month"><i class="fas fa-chevron-left text-xs"></i></button>' +
      '<button type="button" class="dp-next-month"><i class="fas fa-chevron-right text-xs"></i></button>' +
    '</div>' +
  '</div>';
  
  // Weekday headers
  html += '<div class="date-picker-weekdays">';
  dayNames.forEach(function(day) {
    html += '<div class="date-picker-weekday">' + day + '</div>';
  });
  html += '</div>';
  
  // Days grid
  html += '<div class="date-picker-days">';
  
  const firstDay = new Date(datePicker.currentYear, datePicker.currentMonth, 1);
  const lastDay = new Date(datePicker.currentYear, datePicker.currentMonth + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // Previous month days
  const prevMonthLastDay = new Date(datePicker.currentYear, datePicker.currentMonth, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = new Date(datePicker.currentYear, datePicker.currentMonth - 1, day);
    html += '<div class="date-picker-day other-month" data-date="' + date.toISOString() + '">' + day + '</div>';
  }
  
  // Current month days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(datePicker.currentYear, datePicker.currentMonth, day);
    let classes = 'date-picker-day';
    
    // Check if today
    if (date.getTime() === today.getTime()) {
      classes += ' today';
    }
    
    // Check if selected
    if (datePicker.selectedDate) {
      const selected = new Date(datePicker.selectedDate);
      selected.setHours(0, 0, 0, 0);
      if (date.getTime() === selected.getTime()) {
        classes += ' selected';
      }
    }
    
    html += '<div class="' + classes + '" data-date="' + date.toISOString() + '">' + day + '</div>';
  }
  
  // Next month days
  const totalCells = startDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(datePicker.currentYear, datePicker.currentMonth + 1, day);
    html += '<div class="date-picker-day other-month" data-date="' + date.toISOString() + '">' + day + '</div>';
  }
  
  html += '</div>';
  
  // Footer
  html += '<div class="date-picker-footer">' +
    '<button type="button" class="date-picker-clear dp-clear">Clear</button>' +
    '<button type="button" class="date-picker-today dp-today">Today</button>' +
  '</div>';
  
  return html;
}

function navigateMonth(delta) {
  datePicker.currentMonth += delta;
  if (datePicker.currentMonth > 11) {
    datePicker.currentMonth = 0;
    datePicker.currentYear++;
  } else if (datePicker.currentMonth < 0) {
    datePicker.currentMonth = 11;
    datePicker.currentYear--;
  }
  
  // Re-render based on mode
  if (datePicker.overlayElement) {
    let container;
    if (datePicker.useModal) {
      container = datePicker.overlayElement.querySelector('.date-picker-modal');
      if (container) {
        // Keep the title, update the calendar content
        const title = container.querySelector('.date-picker-modal-title');
        container.innerHTML = '';
        if (title) container.appendChild(title.cloneNode(true));
        container.innerHTML = '<div class="date-picker-modal-title">Select Due Date</div>' + renderDatePickerContent();
      }
    } else {
      container = datePicker.overlayElement;
      container.innerHTML = renderDatePickerContent();
    }
    
    // Re-attach event listeners
    if (container) {
      attachDatePickerListeners(container);
    }
  }
}

function selectDate(date) {
  datePicker.selectedDate = date;
  datePicker.inputElement.value = formatDateForDisplay(date);
  
  // Update hidden input with ISO format
  if (datePicker.hiddenInput) {
    datePicker.hiddenInput.value = date.toISOString().split('T')[0];
  }
  
  closeDatePicker();
  
  if (datePicker.onSelect) {
    datePicker.onSelect(date);
  }
}

function selectToday() {
  const today = new Date();
  datePicker.currentMonth = today.getMonth();
  datePicker.currentYear = today.getFullYear();
  selectDate(today);
}

function clearDatePicker() {
  datePicker.selectedDate = null;
  datePicker.inputElement.value = '';
  
  if (datePicker.hiddenInput) {
    datePicker.hiddenInput.value = '';
  }
  
  closeDatePicker();
}

function formatDateForDisplay(date) {
  if (!date) return '';
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// ===================================
// Custom Dialog System
// ===================================

function showCustomDialog(options) {
  return new Promise(function(resolve) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.id = 'custom-dialog-overlay';
    
    const type = options.type || 'alert'; // alert, confirm, prompt
    const title = options.title || '';
    const message = options.message || '';
    const placeholder = options.placeholder || '';
    const defaultValue = options.defaultValue || '';
    const confirmText = options.confirmText || 'OK';
    const cancelText = options.cancelText || 'Cancel';
    const isDanger = options.danger || false;
    
    let bodyHtml = '';
    if (type === 'prompt') {
      bodyHtml = '<div class="custom-dialog-body">' +
        '<input type="text" class="custom-dialog-input" id="custom-dialog-input" ' +
        'placeholder="' + escapeHtml(placeholder) + '" value="' + escapeHtml(defaultValue) + '" autofocus>' +
        '</div>';
    }
    
    let footerHtml = '<div class="custom-dialog-footer">';
    if (type !== 'alert') {
      footerHtml += '<button class="custom-dialog-btn custom-dialog-btn-secondary" id="custom-dialog-cancel">' + 
        escapeHtml(cancelText) + '</button>';
    }
    footerHtml += '<button class="custom-dialog-btn ' + 
      (isDanger ? 'custom-dialog-btn-danger' : 'custom-dialog-btn-primary') + 
      '" id="custom-dialog-confirm">' + escapeHtml(confirmText) + '</button>';
    footerHtml += '</div>';
    
    overlay.innerHTML = '<div class="custom-dialog">' +
      '<div class="custom-dialog-header">' +
        '<div class="custom-dialog-title">' + escapeHtml(title) + '</div>' +
        (message ? '<div class="custom-dialog-message">' + escapeHtml(message) + '</div>' : '') +
      '</div>' +
      bodyHtml +
      footerHtml +
    '</div>';
    
    document.body.appendChild(overlay);
    
    // Focus input if prompt
    if (type === 'prompt') {
      const input = document.getElementById('custom-dialog-input');
      input.focus();
      input.select();
    }
    
    function closeDialog(result) {
      overlay.style.animation = 'modalBackdropOut 0.15s ease-in forwards';
      overlay.querySelector('.custom-dialog').style.animation = 'dialogOut 0.15s ease-in forwards';
      setTimeout(function() {
        overlay.remove();
        resolve(result);
      }, 150);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('custom-dialog-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        closeDialog(type === 'prompt' ? null : false);
      });
    }
    
    // Confirm button
    document.getElementById('custom-dialog-confirm').addEventListener('click', function() {
      if (type === 'prompt') {
        const input = document.getElementById('custom-dialog-input');
        closeDialog(input.value);
      } else if (type === 'confirm') {
        closeDialog(true);
      } else {
        closeDialog(true);
      }
    });
    
    // Enter key for prompt
    if (type === 'prompt') {
      document.getElementById('custom-dialog-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('custom-dialog-confirm').click();
        }
      });
    }
    
    // Escape key to cancel
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDialog(type === 'prompt' ? null : false);
      }
    });
    
    // Click outside to cancel (only for confirm/prompt)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay && type !== 'alert') {
        closeDialog(type === 'prompt' ? null : false);
      }
    });
  });
}

// Wrapper functions for easier usage
async function customConfirm(title, message, options) {
  options = options || {};
  return showCustomDialog({
    type: 'confirm',
    title: title,
    message: message,
    confirmText: options.confirmText || 'Confirm',
    cancelText: options.cancelText || 'Cancel',
    danger: options.danger || false
  });
}

async function customPrompt(title, message, options) {
  options = options || {};
  return showCustomDialog({
    type: 'prompt',
    title: title,
    message: message,
    placeholder: options.placeholder || '',
    defaultValue: options.defaultValue || '',
    confirmText: options.confirmText || 'OK',
    cancelText: options.cancelText || 'Cancel'
  });
}

async function customAlert(title, message) {
  return showCustomDialog({
    type: 'alert',
    title: title,
    message: message,
    confirmText: 'OK'
  });
}

// ===================================
// Custom Select Dropdown
// ===================================

// Global registry of all custom selects for coordinated closing
const customSelectRegistry = [];

function closeAllCustomSelects(exceptWrapper) {
  customSelectRegistry.forEach(function(item) {
    if (item.wrapper !== exceptWrapper && item.isOpen()) {
      item.close();
    }
  });
}

// Global click handler for closing selects
document.addEventListener('click', function(e) {
  // Check if click is outside all custom selects
  const clickedWrapper = e.target.closest('.custom-select');
  customSelectRegistry.forEach(function(item) {
    if (item.wrapper !== clickedWrapper && item.isOpen()) {
      item.close();
    }
  });
});

function initCustomSelect(selectElement) {
  if (!selectElement || selectElement.dataset.customized) return;
  selectElement.dataset.customized = 'true';
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select';
  selectElement.parentNode.insertBefore(wrapper, selectElement);
  
  // Create trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  
  // Get current selected option
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  trigger.innerHTML = '<span class="custom-select-value">' + escapeHtml(selectedOption ? selectedOption.text : '') + '</span>' +
    '<i class="fas fa-chevron-down text-xs text-gray-400"></i>';
  
  wrapper.appendChild(trigger);
  
  // Hide native select but keep it for form submission
  selectElement.style.display = 'none';
  wrapper.appendChild(selectElement);
  
  let dropdown = null;
  let highlightedIndex = selectElement.selectedIndex;
  
  function updateHighlight(index) {
    if (!dropdown) return;
    const options = dropdown.querySelectorAll('.custom-select-option');
    options.forEach((opt, i) => {
      opt.classList.toggle('selected', i === index);
      if (i === index) {
        opt.scrollIntoView({ block: 'nearest' });
      }
    });
    highlightedIndex = index;
  }
  
  function selectIndex(index) {
    if (index < 0 || index >= selectElement.options.length) return;
    selectElement.selectedIndex = index;
    const option = selectElement.options[index];
    trigger.querySelector('.custom-select-value').textContent = option.text;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    updateHighlight(index);
    closeDropdown();
    trigger.focus();
  }
  
  function openDropdown() {
    // Close all other dropdowns first
    closeAllCustomSelects(wrapper);
    
    if (dropdown) {
      closeDropdown();
      return;
    }
    
    dropdown = document.createElement('div');
    dropdown.className = 'custom-select-dropdown';
    
    Array.from(selectElement.options).forEach(function(option, index) {
      const optionEl = document.createElement('div');
      optionEl.className = 'custom-select-option' + (index === selectElement.selectedIndex ? ' selected' : '');
      optionEl.textContent = option.text;
      optionEl.dataset.value = option.value;
      optionEl.dataset.index = index;
      
      optionEl.addEventListener('click', function(e) {
        e.stopPropagation();
        selectIndex(index);
      });
      
      dropdown.appendChild(optionEl);
    });
    
    wrapper.appendChild(dropdown);
    highlightedIndex = selectElement.selectedIndex;
    updateHighlight(highlightedIndex);
    
    // Keyboard support while dropdown is open
    const dropdownKeyHandler = (e) => {
      if (!isOpen()) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(selectElement.options.length - 1, highlightedIndex + 1);
        updateHighlight(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(0, highlightedIndex - 1);
        updateHighlight(prev);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectIndex(highlightedIndex);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        trigger.focus();
      }
    };
    
    dropdown.addEventListener('keydown', dropdownKeyHandler);
  }
  
  function closeDropdown() {
    if (dropdown) {
      dropdown.remove();
      dropdown = null;
    }
  }
  
  function isOpen() {
    return dropdown !== null;
  }
  
  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    openDropdown();
  });
  trigger.addEventListener('keydown', function(e) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      if (!isOpen()) {
        openDropdown();
      }
      if (!dropdown) return;
      if (e.key === 'ArrowDown') {
        const next = Math.min(selectElement.options.length - 1, highlightedIndex + 1);
        updateHighlight(next);
      } else if (e.key === 'ArrowUp') {
        const prev = Math.max(0, highlightedIndex - 1);
        updateHighlight(prev);
      } else {
        selectIndex(highlightedIndex);
      }
    } else if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closeDropdown();
    }
  });
  
  // Update trigger when select value changes programmatically
  const observer = new MutationObserver(function() {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (selectedOption) {
      trigger.querySelector('.custom-select-value').textContent = selectedOption.text;
    }
  });
  observer.observe(selectElement, { attributes: true, childList: true, subtree: true });
  
  // Register this select for global management
  customSelectRegistry.push({
    wrapper: wrapper,
    isOpen: isOpen,
    close: closeDropdown
  });
}

function initAllCustomSelects() {
  document.querySelectorAll('select:not([data-customized])').forEach(initCustomSelect);
}

// ===================================
// Dashboard / Analytics
// ===================================

let dashboardData = null;
let dashboardScope = 'all'; // 'all' or specific board_id

async function openDashboard() {
  try {
    dashboardScope = 'all';
    await loadDashboardData();
    renderDashboard();
  } catch (error) {
    console.error('Failed to open dashboard:', error);
    showToast('Failed to load dashboard', 'error');
  }
}

async function loadDashboardData(boardId = null) {
  const url = boardId ? `/api/analytics?board_id=${boardId}` : '/api/analytics';
  dashboardData = await api(url);
  dashboardScope = boardId || 'all';
}

function closeDashboard() {
  const overlay = document.getElementById('dashboard-modal-overlay');
  if (overlay) {
    overlay.style.animation = 'fadeOut 0.15s ease forwards';
    const modal = overlay.querySelector('.dashboard-modal');
    if (modal) modal.style.animation = 'dialogOut 0.15s ease forwards';
    setTimeout(() => overlay.remove(), 150);
  }
}

function renderDashboard() {
  // Remove existing modal if any
  const existingOverlay = document.getElementById('dashboard-modal-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  const data = dashboardData;
  if (!data) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'dashboard-modal-overlay';
  overlay.className = 'dashboard-modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeDashboard(); };
  
  // Calculate averages for context
  const avgVelocity = data.velocity.length > 0 
    ? Math.round(data.velocity.reduce((sum, v) => sum + v.completed, 0) / data.velocity.length)
    : 0;
  
  // Build project tabs for filtering
  let tabsHtml = `<button class="dashboard-tab ${dashboardScope === 'all' ? 'active' : ''}" onclick="switchDashboardScope('all')">All Projects</button>`;
  if (data.project_breakdown && data.project_breakdown.length > 0) {
    data.project_breakdown.slice(0, 5).forEach(project => {
      const isActive = dashboardScope === project.board_id ? 'active' : '';
      tabsHtml += `<button class="dashboard-tab ${isActive}" onclick="switchDashboardScope('${project.board_id}')">${project.board_icon} ${escapeHtml(project.board_name)}</button>`;
    });
  }
  
  overlay.innerHTML = `
    <div class="dashboard-modal">
      <div class="dashboard-header">
        <h2 class="dashboard-title">
          <i class="fas fa-chart-pie"></i>
          Dashboard Analytics
        </h2>
        <button onclick="closeDashboard()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <i class="fas fa-times text-gray-500"></i>
        </button>
      </div>
      
      <div class="dashboard-content">
        <!-- Scope Tabs -->
        <div class="dashboard-tabs">
          ${tabsHtml}
        </div>
        
        <!-- Summary Stats -->
        <div class="dashboard-grid">
          <div class="dashboard-stat-card">
            <div class="dashboard-stat-label">Active Tasks</div>
            <div class="dashboard-stat-value">${data.total_tasks}</div>
            <div class="dashboard-stat-change ${data.due_this_week > 0 ? 'negative' : ''}">
              <i class="fas fa-calendar-week"></i>
              ${data.due_this_week} due this week
            </div>
          </div>
          
          <div class="dashboard-stat-card info">
            <div class="dashboard-stat-label">Completed</div>
            <div class="dashboard-stat-value">${data.completed_tasks}</div>
            <div class="dashboard-stat-change positive">
              <i class="fas fa-check-circle"></i>
              ${data.completed_this_week} this week
            </div>
          </div>
          
          <div class="dashboard-stat-card ${data.overdue_tasks > 0 ? 'danger' : ''}">
            <div class="dashboard-stat-label">Overdue</div>
            <div class="dashboard-stat-value">${data.overdue_tasks}</div>
            <div class="dashboard-stat-change ${data.overdue_tasks > 0 ? 'negative' : 'positive'}">
              ${data.overdue_tasks > 0 
                ? '<i class="fas fa-exclamation-triangle"></i> Needs attention' 
                : '<i class="fas fa-thumbs-up"></i> All caught up!'}
            </div>
          </div>
          
          <div class="dashboard-stat-card warning">
            <div class="dashboard-stat-label">Due Today</div>
            <div class="dashboard-stat-value">${data.due_today}</div>
            <div class="dashboard-stat-change">
              <i class="fas fa-fire"></i>
              Focus on these first
            </div>
          </div>
        </div>
        
        <!-- Charts Row -->
        <div class="dashboard-charts">
          <!-- Tasks by Status (Donut) -->
          <div class="dashboard-chart-card">
            <div class="dashboard-chart-title">Tasks by Status</div>
            <div class="dashboard-chart-canvas">
              ${renderDonutChart(data.tasks_by_status, data.total_tasks)}
            </div>
          </div>
          
          <!-- Tasks by Priority -->
          <div class="dashboard-chart-card">
            <div class="dashboard-chart-title">Tasks by Priority</div>
            <div class="dashboard-chart-canvas">
              ${renderPriorityBars(data.tasks_by_priority)}
            </div>
          </div>
        </div>
        
        <!-- Velocity Chart -->
        <div class="dashboard-chart-card" style="margin-bottom: 24px;">
          <div class="dashboard-chart-title">
            Weekly Velocity 
            <span style="font-weight: 400; color: #9ca3af; margin-left: 8px;">
              (Avg: ${avgVelocity} tasks/week)
            </span>
          </div>
          <div class="dashboard-chart-canvas" style="height: 200px;">
            ${renderVelocityChart(data.velocity)}
          </div>
          <div class="velocity-legend">
            <div class="velocity-legend-item">
              <span class="velocity-legend-color completed"></span>
              Completed
            </div>
            <div class="velocity-legend-item">
              <span class="velocity-legend-color created"></span>
              Created
            </div>
          </div>
        </div>
        
        <!-- Project Breakdown (only for "All Projects" scope) -->
        ${dashboardScope === 'all' && data.project_breakdown && data.project_breakdown.length > 0 ? `
          <div class="dashboard-projects">
            <div class="dashboard-projects-title">Project Breakdown</div>
            ${data.project_breakdown.map(project => `
              <div class="project-breakdown-item">
                <div class="project-breakdown-icon">${project.board_icon}</div>
                <div class="project-breakdown-info">
                  <div class="project-breakdown-name">${escapeHtml(project.board_name)}</div>
                  <div class="project-breakdown-stats">
                    <span><i class="fas fa-tasks"></i> ${project.total_tasks} active</span>
                    <span><i class="fas fa-check"></i> ${project.completed_tasks} done</span>
                    ${project.overdue_tasks > 0 
                      ? `<span style="color: #EF4444;"><i class="fas fa-exclamation-circle"></i> ${project.overdue_tasks} overdue</span>` 
                      : ''}
                  </div>
                </div>
                <div class="project-breakdown-progress">
                  <div class="project-breakdown-percent">${project.completion_rate}%</div>
                  <div class="project-breakdown-bar">
                    <div class="project-breakdown-bar-fill" style="width: ${project.completion_rate}%"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <!-- Completion Trend (mini sparkline description) -->
        <div class="dashboard-chart-card" style="margin-top: 24px;">
          <div class="dashboard-chart-title">30-Day Completion Trend</div>
          <div class="dashboard-chart-canvas" style="height: 120px;">
            ${renderTrendChart(data.completion_trend)}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

async function switchDashboardScope(scope) {
  try {
    if (scope === 'all') {
      await loadDashboardData();
    } else {
      await loadDashboardData(scope);
    }
    renderDashboard();
  } catch (error) {
    console.error('Failed to switch dashboard scope:', error);
    showToast('Failed to load data', 'error');
  }
}

// Render donut chart using SVG
function renderDonutChart(statusData, total) {
  if (!statusData || statusData.length === 0 || total === 0) {
    return `
      <div class="donut-chart">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="15"/>
        </svg>
        <div class="donut-chart-center">
          <div class="donut-chart-center-value">0</div>
          <div class="donut-chart-center-label">tasks</div>
        </div>
      </div>
      <div class="chart-legend">
        <div class="chart-legend-item" style="color: #9ca3af;">No tasks yet</div>
      </div>
    `;
  }
  
  // Colors for different statuses
  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  
  let cumulativePercent = 0;
  const segments = [];
  
  statusData.forEach((status, index) => {
    if (status.count === 0) return;
    
    const percent = (status.count / total) * 100;
    const startAngle = cumulativePercent * 3.6; // 360 / 100 = 3.6
    const endAngle = (cumulativePercent + percent) * 3.6;
    
    // SVG arc calculation
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = percent > 50 ? 1 : 0;
    
    segments.push({
      color: colors[index % colors.length],
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      name: status.column_name,
      count: status.count,
      percent: Math.round(percent)
    });
    
    cumulativePercent += percent;
  });
  
  // Generate legend items
  const legendItems = segments.map(seg => `
    <div class="chart-legend-item">
      <span class="chart-legend-color" style="background: ${seg.color}"></span>
      ${escapeHtml(seg.name)} (${seg.count})
    </div>
  `).join('');
  
  return `
    <div class="donut-chart">
      <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
        ${segments.map(seg => `<path d="${seg.path}" fill="${seg.color}" opacity="0.9"/>`).join('')}
        <circle cx="50" cy="50" r="25" fill="white" class="dark:fill-gray-700"/>
      </svg>
      <div class="donut-chart-center">
        <div class="donut-chart-center-value">${total}</div>
        <div class="donut-chart-center-label">tasks</div>
      </div>
    </div>
    <div class="chart-legend">
      ${legendItems}
    </div>
  `;
}

// Render priority bars
function renderPriorityBars(priorityData) {
  if (!priorityData || priorityData.length === 0) {
    return '<div style="text-align: center; color: #9ca3af; padding: 40px;">No tasks</div>';
  }
  
  const maxCount = Math.max(...priorityData.map(p => p.count), 1);
  
  const priorityInfo = {
    high: { label: 'High', color: '#EF4444', gradient: 'linear-gradient(to top, #DC2626, #EF4444)' },
    medium: { label: 'Medium', color: '#F59E0B', gradient: 'linear-gradient(to top, #D97706, #F59E0B)' },
    low: { label: 'Low', color: '#3B82F6', gradient: 'linear-gradient(to top, #2563EB, #3B82F6)' }
  };
  
  const barsHtml = priorityData.map(p => {
    const info = priorityInfo[p.priority];
    const heightPercent = maxCount > 0 ? (p.count / maxCount) * 100 : 0;
    const minHeight = p.count > 0 ? Math.max(heightPercent, 5) : 0;
    
    return `
      <div class="bar-chart-item">
        <div class="bar-chart-bar" style="height: ${minHeight}%; background: ${info.gradient}; min-height: ${p.count > 0 ? '4px' : '0'};">
          ${p.count > 0 ? `<span class="bar-chart-value">${p.count}</span>` : ''}
        </div>
        <div class="bar-chart-label">
          <span class="priority-dot ${p.priority}"></span>
          ${info.label}
        </div>
      </div>
    `;
  }).join('');
  
  const total = priorityData.reduce((sum, p) => sum + p.count, 0);
  
  return `
    <div class="bar-chart" style="height: 140px; margin-bottom: 20px;">
      ${barsHtml}
    </div>
    <div style="text-align: center; font-size: 12px; color: #6b7280;">
      Total: ${total} tasks
    </div>
  `;
}

// Render velocity chart
function renderVelocityChart(velocityData) {
  if (!velocityData || velocityData.length === 0) {
    return '<div style="text-align: center; color: #9ca3af; padding: 40px;">No data available</div>';
  }
  
  const maxValue = Math.max(...velocityData.flatMap(v => [v.completed, v.created]), 1);
  
  const barsHtml = velocityData.map((week, index) => {
    const completedHeight = (week.completed / maxValue) * 100;
    const createdHeight = (week.created / maxValue) * 100;
    
    // Format week label (e.g., "Dec 30")
    const startDate = new Date(week.week_start);
    const weekLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isCurrentWeek = index === velocityData.length - 1;
    
    return `
      <div class="bar-chart-item" style="flex: 1; max-width: 80px;">
        <div style="display: flex; gap: 4px; align-items: flex-end; height: 100%; width: 100%;">
          <div class="bar-chart-bar completed" style="height: ${Math.max(completedHeight, week.completed > 0 ? 5 : 0)}%; flex: 1; max-width: 20px;">
            ${week.completed > 0 ? `<span class="bar-chart-value" style="color: #10B981;">${week.completed}</span>` : ''}
          </div>
          <div class="bar-chart-bar created" style="height: ${Math.max(createdHeight, week.created > 0 ? 5 : 0)}%; flex: 1; max-width: 20px;">
            ${week.created > 0 ? `<span class="bar-chart-value" style="color: #3B82F6;">${week.created}</span>` : ''}
          </div>
        </div>
        <div class="bar-chart-label" style="${isCurrentWeek ? 'font-weight: 600; color: #10B981;' : ''}">
          ${weekLabel}${isCurrentWeek ? ' ★' : ''}
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="bar-chart" style="height: 160px;">
      ${barsHtml}
    </div>
  `;
}

// Render trend chart (simplified area/line chart)
function renderTrendChart(trendData) {
  if (!trendData || trendData.length === 0) {
    return '<div style="text-align: center; color: #9ca3af; padding: 20px;">No trend data available</div>';
  }
  
  // Get last 14 days for a cleaner view
  const recentData = trendData.slice(-14);
  const maxCompleted = Math.max(...recentData.map(d => d.completed), 1);
  
  // Calculate cumulative completed for a running total feel
  let cumulativeCompleted = 0;
  const points = recentData.map((day, index) => {
    cumulativeCompleted += day.completed;
    const x = (index / (recentData.length - 1)) * 100 || 0;
    const y = 100 - (day.completed / maxCompleted) * 80;
    return { x, y, completed: day.completed, date: day.date };
  });
  
  // Build SVG path
  let pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y}` : '';
  points.slice(1).forEach(p => {
    pathD += ` L ${p.x} ${p.y}`;
  });
  
  // Area path (close to bottom)
  let areaD = pathD;
  if (points.length > 0) {
    areaD += ` L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;
  }
  
  // Calculate totals
  const totalCompleted = recentData.reduce((sum, d) => sum + d.completed, 0);
  const totalCreated = recentData.reduce((sum, d) => sum + d.created, 0);
  
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 80px;">
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:#10B981;stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#trendGradient)"/>
      <path d="${pathD}" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${points.filter((p, i) => p.completed > 0 || i === points.length - 1).map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3" fill="#10B981"/>
      `).join('')}
    </svg>
    <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; color: #6b7280;">
      <div>
        <i class="fas fa-check-circle" style="color: #10B981;"></i>
        <strong>${totalCompleted}</strong> completed
      </div>
      <div>
        <i class="fas fa-plus-circle" style="color: #3B82F6;"></i>
        <strong>${totalCreated}</strong> created
      </div>
      <div style="color: ${totalCompleted >= totalCreated ? '#10B981' : '#F59E0B'};">
        <i class="fas fa-${totalCompleted >= totalCreated ? 'arrow-up' : 'arrow-down'}"></i>
        ${totalCompleted >= totalCreated ? 'Productive!' : 'Keep going!'}
      </div>
    </div>
  `;
}
