class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.isConnecting = false;
    this.connectionId = null;
    this.heartbeatInterval = null;
    this.messageQueue = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.connect();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  connect(url = 'ws://localhost:8080') {
    if (!this.isOnline) {
      console.warn('WebSocket: Cannot connect - offline');
      return Promise.reject(new Error('Device is offline'));
    }

    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);
        this.connectionId = Date.now().toString();

        this.socket.onopen = (event) => {
          console.log('WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          
          // Notify all listeners about connection
          this.emit('connection', { 
            status: 'connected', 
            connectionId: this.connectionId,
            timestamp: new Date().toISOString()
          });
          
          resolve(event);
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('WebSocket: Invalid JSON received', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket connection closed', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          
          this.emit('connection', { 
            status: 'disconnected', 
            code: event.code,
            reason: event.reason,
            timestamp: new Date().toISOString()
          });

          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          
          // Enhanced WebSocket error handling to prevent "[object Event]" serialization
          let errorMessage = 'WebSocket connection error';
          let errorDetails = {};
          let errorCode = 'WEBSOCKET_ERROR';
          
          if (error instanceof Event) {
            // Handle WebSocket Event objects with enhanced information extraction
            const target = error.target;
            const readyState = target?.readyState;
            
            // Map WebSocket readyState to meaningful messages
            const readyStateMessages = {
              0: 'connecting', // CONNECTING
              1: 'connected',  // OPEN
              2: 'closing',    // CLOSING
              3: 'disconnected' // CLOSED
            };
            
            const readyStateText = readyStateMessages[readyState] || 'unknown';
            
            // Create detailed error message based on event type and readyState
            if (error.type === 'error') {
              errorMessage = `WebSocket connection failed (state: ${readyStateText})`;
              errorCode = readyState === 3 ? 'CONNECTION_CLOSED' : 'CONNECTION_ERROR';
            } else {
              errorMessage = `WebSocket ${error.type} event (state: ${readyStateText})`;
              errorCode = `WEBSOCKET_${error.type.toUpperCase()}`;
            }
            
            errorDetails = {
              type: error.type || 'error',
              readyState: readyState,
              readyStateText: readyStateText,
              timestamp: error.timeStamp || Date.now(),
              url: target?.url || this.url || 'unknown',
              protocol: target?.protocol || 'unknown',
              code: errorCode,
              // Prevent Event object serialization issues
              eventConstructor: error.constructor.name
            };
          } else if (error instanceof Error) {
            // Handle regular Error objects
            errorMessage = error.message || 'Connection error';
            errorCode = error.name || 'ERROR';
            errorDetails = {
              name: error.name,
              stack: error.stack,
              code: errorCode
            };
          } else if (typeof error === 'string') {
            errorMessage = error;
            errorCode = 'STRING_ERROR';
            errorDetails = { code: errorCode };
          } else {
            // Handle any other error types
            errorMessage = 'Unknown WebSocket error occurred';
            errorCode = 'UNKNOWN_ERROR';
            errorDetails = { 
              code: errorCode,
              errorType: typeof error,
              errorConstructor: error?.constructor?.name || 'unknown'
            };
          }
          
          // Enhanced connection status emission with better error context
          this.emit('connection', { 
            status: 'error', 
            error: errorMessage,
            code: errorCode,
            details: errorDetails,
            timestamp: new Date().toISOString(),
            // Add retry information
            retryable: !['PROTOCOL_ERROR', 'SECURITY_ERROR'].includes(errorCode),
            severity: readyState === 3 ? 'high' : 'medium'
          });
          
          // Create a proper, serializable Error object for rejection
          const rejectError = new Error(errorMessage);
          rejectError.code = errorCode;
          rejectError.details = errorDetails;
          rejectError.timestamp = new Date().toISOString();
          
          // Ensure the error is properly serializable
          Object.defineProperty(rejectError, 'toJSON', {
            value: function() {
              return {
                message: this.message,
                code: this.code,
                details: this.details,
                timestamp: this.timestamp,
                stack: this.stack
              };
            },
            enumerable: false
          });
          
          reject(rejectError);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.listeners.clear();
    this.messageQueue = [];
  }

  send(message) {
    const messageWithId = {
      ...message,
      messageId: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      connectionId: this.connectionId
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(messageWithId));
      return true;
    } else {
      // Queue message for later sending
      this.messageQueue.push(messageWithId);
      console.warn('WebSocket: Message queued - connection not ready');
      return false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket listener error for event ${event}:`, error);
        }
      });
    }
  }

  handleMessage(data) {
    const { type, ...payload } = data;
    
    // Emit specific event type
    if (type) {
      this.emit(type, payload);
    }
    
    // Emit generic message event
    this.emit('message', data);
  }

  scheduleReconnect() {
    if (!this.isOnline) return;
    
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.connect().catch(error => {
          console.error('WebSocket: Reconnection failed', error);
        });
      }
    }, delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      this.socket.send(JSON.stringify(message));
    }
  }

  getConnectionStatus() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;