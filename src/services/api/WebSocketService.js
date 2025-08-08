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
        console.error('Global WebSocket error intercepted:', globalError.message);
        globalError.preventDefault();
      }
    });
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
        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          } else if (this.ws?.readyState === WebSocket.CLOSED) {
            reject(new Error('Connection failed'));
          } else {
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
          console.error('WebSocket error:', event);
          
          // Enhanced error message generation with environment context
          let errorMessage = 'WebSocket connection failed';
          let errorCategory = 'network';
          let userMessage = 'Connection lost';
          let suggestion = 'Please check your internet connection and try again';
          
          // Determine if we're in development or production
          const isDev = import.meta.env.MODE === 'development';
          
          // Check if this is a localhost connection failure
          const isLocalhostFailure = wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1');
          
          if (event?.reason && typeof event.reason === 'string' && event.reason.trim()) {
            const reason = event.reason.toLowerCase();
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
              userMessage = isDev ? 'Development server not running' : 'Server unavailable';
              suggestion = isDev ? 'Please start the WebSocket server' : 'Server is temporarily unavailable';
            } else {
              userMessage = reason.substring(0, 100);
            }
            errorMessage = `WebSocket error: ${reason}`;
          } else {
            // Check connection state for more context
            const readyState = this.ws?.readyState ?? 3;
            if (readyState === 2) { // CLOSING
              errorCategory = 'closing';
              userMessage = 'Connection is closing';
              suggestion = 'Reconnecting automatically...';
            } else if (readyState === 3) { // CLOSED
              if (isLocalhostFailure && isDev) {
                errorCategory = 'server';
                userMessage = 'Development WebSocket server not running';
                suggestion = `Cannot connect to ${wsUrl}. Start your WebSocket server or check the VITE_WS_URL configuration.`;
              } else {
                errorCategory = 'network';
                userMessage = 'Unable to connect to server';
                suggestion = isDev 
                  ? `Cannot connect to ${wsUrl}. Check WebSocket server status.`
                  : 'Unable to establish connection. Please check your internet connection.';
              }
            }
          }

          const error = {
            message: userMessage,
            category: errorCategory,
            suggestion: suggestion,
            canRetry: errorCategory !== 'auth',
            isDevelopment: isDev,
            url: wsUrl,
            timestamp: new Date().toISOString()
          };
          
          this.emit('connection', { status: 'error', error: error.message, code: 'WEBSOCKET_ERROR' });
          
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
        console.error('WebSocket connection error:', error);
        const connectionError = {
          message: 'Unable to establish connection',
          category: 'connection',
          suggestion: 'Please check your internet connection',
          canRetry: true,
          originalError: error.message
        };
        reject(connectionError);
      }
    });
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
      const parsed = JSON.parse(data);
      this.emit('message', parsed);
      
      // Handle heartbeat responses
      if (parsed.type === 'pong') {
        clearTimeout(this.heartbeatTimeout);
      }
      
      // Emit specific event type
      if (parsed.type) {
        this.emit(parsed.type, parsed);
      }
    } catch (error) {
      // Handle plain text messages
      this.emit('message', { type: 'text', data });
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