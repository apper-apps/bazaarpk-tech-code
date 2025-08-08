/**
 * WebSocketService - Manages WebSocket connections with reconnection logic
 */
class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.connectionTimeout = null;
    this.isManualDisconnect = false;
    this.isOnline = navigator.onLine;
    this.errorEmitted = false;
    this.isDestroyed = false;
    
    // Connection states
    this.CONNECTING = 0;
    this.OPEN = 1;
    this.CLOSING = 2;
    this.CLOSED = 3;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        if (this.url) {
          this.connect(this.url);
        }
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handler for WebSocket errors
    window.addEventListener('error', (globalError) => {
      if (globalError.message && globalError.message.includes('WebSocket')) {
        console.warn('WebSocket error intercepted, switching to offline mode:', globalError.message);
        globalError.preventDefault();
      }
    });
  }

  // Environment-based WebSocket configuration
  getWebSocketUrl() {
    // Check environment variable first - allow empty string to disable WebSocket
    const envUrl = import.meta.env?.VITE_WS_URL;
    
    // If explicitly set (even as empty string), use that value
    if (typeof envUrl === 'string') {
      return envUrl.trim() || null; // Return null if empty/whitespace
    }
    
    // Development fallback - only if in development mode
    const isDevelopment = import.meta.env?.DEV || false;
    if (isDevelopment) {
      // Return null to disable WebSocket by default in development
      // User must explicitly set VITE_WS_URL if they want WebSocket
      return null;
    }
    
    // Production - WebSocket must be explicitly configured
    return null;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(url) {
    // Determine WebSocket URL with proper fallback strategy
    const wsUrl = url || import.meta.env.VITE_WS_URL || 'wss://echo.websocket.org/';
    
    if (!this.isOnline) {
      console.warn('WebSocket: Cannot connect - offline');
      return Promise.reject(new Error('Device is offline'));
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection in progress');
      return new Promise((resolve, reject) => {
        let timeoutCount = 0;
        const maxTimeout = 100; // 10 seconds maximum wait
        
        const checkConnection = () => {
          // Defensive check: ensure WebSocket still exists
          if (!this.ws) {
            const error = new Error('Connection lost during setup');
            error.category = 'connection';
            error.canRetry = true;
            error.code = 'CONNECTION_LOST';
            reject(error);
            return;
          }
          
          if (this.ws.readyState === WebSocket.OPEN) {
            resolve();
          } else if (this.ws.readyState === WebSocket.CLOSED) {
            const error = new Error('Connection failed - server not responding');
            error.category = 'connection';
            error.canRetry = true;
            error.code = 'CONNECTION_REFUSED';
            error.url = this.ws.url || 'unknown';
            reject(error);
          } else if (timeoutCount >= maxTimeout) {
            const error = new Error('Connection timeout - taking too long to establish');
            error.category = 'timeout';
            error.canRetry = true;
            error.code = 'CONNECTION_TIMEOUT';
            error.timeout = maxTimeout * 100; // ms
            reject(error);
          } else {
            timeoutCount++;
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

return new Promise((resolve, reject) => {
      try {
        // Validate URL before attempting connection
        if (!wsUrl || (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://'))) {
          throw new Error('Invalid WebSocket URL provided');
        }

        this.url = wsUrl;
        this.isManualDisconnect = false;
        this.errorEmitted = false;
        
        // Clear any existing connection
        this.cleanup();
        
        this.ws = new WebSocket(wsUrl);
        
        // Connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            const error = {
              message: 'Connection timeout',
              category: 'timeout',
              suggestion: 'Please check your internet connection and try again',
              canRetry: true,
              url: wsUrl
            };
            reject(error);
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(this.connectionTimeout);
          this.reconnectAttempts = 0;
          this.emit('connection', { 
            status: 'connected', 
            url: wsUrl,
            timestamp: new Date().toISOString()
          });
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(this.connectionTimeout);
          this.stopHeartbeat();
          
          const status = this.isManualDisconnect ? 'disconnected' : 'error';
          this.emit('connection', { 
            status, 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean,
            timestamp: new Date().toISOString()
          });

          // Auto-reconnect if not manual disconnect
          if (!this.isManualDisconnect && event.code !== 1000 && !this.isDestroyed) {
            this.scheduleReconnect();
          }

          if (this.ws?.readyState !== WebSocket.OPEN) {
            const error = {
              message: this.isManualDisconnect ? 'Disconnected' : 'Connection lost',
              category: this.isManualDisconnect ? 'closing' : 'connection',
              suggestion: this.isManualDisconnect ? null : 'Attempting to reconnect...',
              canRetry: !this.isManualDisconnect,
              code: event.code,
              reason: event.reason
            };
            reject(error);
          }
        };

this.ws.onerror = (event) => {
          // Prevent duplicate error emissions
          if (this.errorEmitted) return;
          this.errorEmitted = true;
          
          clearTimeout(this.connectionTimeout);
// Enhanced development detection and WebSocket disable support
          const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
          const isWebSocketDisabled = import.meta.env.VITE_DISABLE_WEBSOCKET === 'true';
          const isLocalhostFailure = wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1');
          const wsState = this.ws?.readyState ?? 3;
          
          // If WebSocket is intentionally disabled, provide appropriate messaging
          if (isWebSocketDisabled && isDev) {
            errorCategory = 'disabled';
            userMessage = 'WebSocket disabled via configuration - app working offline';
            suggestion = 'Set VITE_DISABLE_WEBSOCKET=false in .env to enable WebSocket connections';
          
          let errorCategory = 'network';
          let userMessage = 'Connection lost';
          let suggestion = 'Please check your internet connection and try again';
          let errorCode = event?.code || this.ws?.code || null;
          let errorReason = event?.reason || this.ws?.reason || null;
} else {
          // Handle development localhost failures gracefully
          if (isLocalhostFailure && isDev && wsState === 3) {
errorCategory = 'server_unavailable';
            userMessage = 'Working in offline mode - all features available';
            suggestion = 'WebSocket server not running. App works fully offline.';
            
            // Minimal development logging
            console.info(`WebSocket: ${wsUrl} unavailable - offline mode active`);
          } else {
            // Process other error scenarios
            if (errorReason && typeof errorReason === 'string' && errorReason.trim()) {
const reason = errorReason.toLowerCase();
              const wsUrl = this.url || this.getWebSocketUrl();
              const isLocalhostConnection = wsUrl && (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1'));
              
              if (reason.includes('server') || reason.includes('503') || reason.includes('502')) {
                errorCategory = 'server';
                userMessage = 'Server temporarily unavailable';
                suggestion = 'The server is currently unavailable. Please try again in a few moments.';
              } else if (reason.includes('unauthorized') || reason.includes('403') || reason.includes('401')) {
                errorCategory = 'auth';
                userMessage = 'Authentication required';
                suggestion = 'Please refresh the page and sign in again';
              } else if (reason.includes('timeout') || reason.includes('etimedout')) {
                errorCategory = 'timeout';
                userMessage = 'Connection timed out';
                suggestion = 'Connection timed out. Check your internet connection and try again';
              } else if (reason.includes('refused') || reason.includes('econnrefused')) {
                errorCategory = 'server';
                if (isDev && isLocalhostConnection) {
                  userMessage = 'Development mode - WebSocket server not running';
                  suggestion = 'WebSocket server not available. All features work offline.';
                } else {
                  userMessage = isDev ? 'Development server not running' : 'Server unavailable';
                  suggestion = isDev ? 'Please start the WebSocket server' : 'Server is temporarily unavailable';
                }
              }
} else {
                // State-based error handling
                if (wsState === 0) { // CONNECTING
                  errorCategory = 'connection';
                  if (isDev && isLocalhostFailure) {
                  userMessage = 'Development mode - working offline';
                  suggestion = 'WebSocket server not available. All features work without it.';
                } else {
                  userMessage = 'Failed to establish connection';
suggestion = 'Unable to connect to server. Check your internet connection.';
                }
              } else if (wsState === 2) { // CLOSING
                errorCategory = 'closing';
                userMessage = 'Connection is closing';
                suggestion = 'Reconnecting automatically...';
              }
            }
            
            // Concise error logging for non-development or non-localhost errors
            if (!isDev || !isLocalhostFailure) {
console.error(`WebSocket error: ${userMessage} (${wsUrl})`);
              }
            }
          }

          const error = {
            message: userMessage,
            category: errorCategory,
            suggestion: suggestion,
            canRetry: errorCategory !== 'auth' && errorCategory !== 'disabled',
            isDevelopment: isDev,
            isDisabled: isWebSocketDisabled,
            url: wsUrl,
            code: errorCode,
            reason: errorReason,
            readyState: wsState,
stateName: this.getStateName(wsState),
            timestamp: new Date().toISOString(),
            toString: () => userMessage,
            valueOf: () => userMessage
          };
          
this.emit('connection', { 
            status: 'error', 
            error: userMessage,
            code: 'WEBSOCKET_ERROR',
            category: errorCategory,
canRetry: error.canRetry,
            isDisabled: error.isDisabled,
            isDevelopment: isDev,
            suggestion: suggestion
          });
          
          // Schedule automatic reconnection if retryable
          if (error.canRetry && !this.isDestroyed) {
            this.scheduleReconnect();
          }
          
reject(error);
};

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        const isDev = import.meta.env?.DEV || import.meta.env.MODE === 'development' || false;
        const wsUrl = this.getWebSocketUrl();
        const isLocalhost = wsUrl && (wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1'));
        
        console.warn('WebSocket connection unavailable:', {
          url: this.url,
          error: error.message || 'Connection failed',
          timestamp: new Date().toISOString(),
          isDevelopment: isDev,
          isLocalhost: isLocalhost
        });
        
        if (!wsUrl) {
          // WebSocket disabled or not configured - graceful degradation
          console.info('WebSocket not configured, running in offline mode');
          this.emit('connection', { 
            status: 'offline', 
            message: 'Running in offline mode - all features available',
            code: 'WS_DISABLED',
            category: 'offline',
            canRetry: false
          });
          return;
        }

        // Enhanced server availability check with better error categorization
        this.checkServerAvailability(wsUrl)
          .then(isServerAvailable => {
            if (!isServerAvailable) {
              const message = isDev && isLocalhost 
                ? 'Development mode - WebSocket server not running, all features available offline'
                : 'Working offline - all features available';
              
              console.info('WebSocket server not available, switching to offline mode');
              
              this.emit('connection', { 
                status: 'offline', 
                message: message,
                code: 'SERVER_OFFLINE',
                category: isDev && isLocalhost ? 'development' : 'server_unavailable',
                canRetry: !isDev || !isLocalhost
              });
              return;
            }
            
            // Server available but connection failed - network issue
            console.warn('Network connection issue, will retry');
            this.emit('connection', { 
              status: 'error', 
              error: 'Connection interrupted - attempting reconnect',
              code: 'CONNECTION_FAILED', 
              category: 'connection',
              canRetry: true
            });
          })
          .catch(checkError => {
            // Cannot reach server - treat as offline with appropriate category
            const message = isDev && isLocalhost 
              ? 'Development mode - all features available offline' 
              : 'Working offline - all features available';
            
            console.info('Cannot reach WebSocket server, working offline');
            this.emit('connection', { 
              status: 'offline', 
              message: message,
              code: 'SERVER_UNREACHABLE',
              category: isDev && isLocalhost ? 'development' : 'server_unavailable', 
              canRetry: !isDev || !isLocalhost
            });
          });
      }
    });
  }

async checkServerAvailability(url) {
    try {
      // Extract host and port from WebSocket URL
      const wsUrl = new URL(url);
      const httpUrl = `http://${wsUrl.host}/health`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(httpUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Server is not available or not responding
      return false;
    }
  }

/**
   * Disconnect WebSocket
   */
  disconnect() {
    this.isManualDisconnect = true;
    this.isDestroyed = true;
    this.stopHeartbeat();
    clearTimeout(this.connectionTimeout);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Manual disconnect');
    }
    
    this.cleanup();
    this.listeners.clear();
    this.messageQueue = [];
  }

  /**
   * Send message through WebSocket
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      return false;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(payload);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit events to subscribers
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Handle incoming messages
   */
handleMessage(data) {
    try {
      // Comprehensive data validation before JSON parsing
      if (typeof data !== 'string' || data.length === 0) {
        console.warn('WebSocket received invalid data type:', typeof data);
        this.emit('message', { type: 'error', error: 'Invalid message format', data: null });
        return;
      }

      // Trim whitespace and check for basic JSON structure
      const trimmedData = data.trim();
      if (!trimmedData.startsWith('{') && !trimmedData.startsWith('[')) {
        // Handle plain text messages gracefully
        this.emit('message', { type: 'text', data: trimmedData });
        return;
      }

      // Attempt JSON parsing with enhanced error context
      const parsed = JSON.parse(trimmedData);
      
      // Validate parsed object structure
      if (parsed === null || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
        console.warn('WebSocket received invalid JSON structure');
        this.emit('message', { type: 'invalid', data: trimmedData });
        return;
      }

      this.emit('message', parsed);
      
      // Handle heartbeat responses
      if (parsed.type === 'pong') {
        clearTimeout(this.heartbeatTimeout);
      }
      
      // Emit specific event type for valid messages
      if (parsed.type && typeof parsed.type === 'string') {
        this.emit(parsed.type, parsed);
      }
    } catch (error) {
      // Enhanced error handling with context preservation
      const errorContext = {
        message: error.message || 'JSON parsing failed',
        dataPreview: typeof data === 'string' ? data.substring(0, 50) + (data.length > 50 ? '...' : '') : 'Non-string data',
        dataType: typeof data,
        timestamp: new Date().toISOString()
      };
      
      console.error('WebSocket message parsing error:', errorContext);
      
      // Emit safe error message without potentially problematic data
      this.emit('message', { 
        type: 'parse_error', 
        error: 'Message format not supported',
        context: errorContext
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isManualDisconnect || this.isDestroyed || !this.isOnline) {
      console.log('Max reconnection attempts reached, manual disconnect, destroyed, or offline');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManualDisconnect && !this.isDestroyed && this.url) {
        this.connect(this.url).catch(error => {
          console.log('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    // Guard against multiple heartbeats
    if (this.heartbeatInterval) return;
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
        
        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.log('Heartbeat timeout - closing connection');
          this.ws?.close();
        }, 5000);
      }
    }, 30000);
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    if (!this.messageQueue.length || !this.ws) return;
    
    const tempQueue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of tempQueue) {
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          const payload = typeof message === 'string' ? message : JSON.stringify(message);
          this.ws.send(payload);
        } catch (error) {
          console.warn('Failed to send queued message, discarding');
        }
      } else {
        // Requeue only if connection is expected to recover
        if (this.ws.readyState === WebSocket.CONNECTING) {
          this.messageQueue.push(message);
        }
      }
    }
  }

  /**
   * Get connection state name
   */
  getStateName(state) {
    const states = {
      [WebSocket.CONNECTING]: 'connecting',
      [WebSocket.OPEN]: 'connected',
      [WebSocket.CLOSING]: 'closing',
      [WebSocket.CLOSED]: 'disconnected'
    };
    return states[state] || 'unknown';
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    return this.getStateName(this.ws.readyState);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopHeartbeat();
    clearTimeout(this.connectionTimeout);
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws = null;
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;