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
          // Initialize readyState in function scope to prevent reference errors
          let readyState = 3; // Default to CLOSED state
          
          // Comprehensive error information extraction from WebSocket Event objects
          try {
            if (error instanceof Event) {
              // Handle WebSocket Event objects with enhanced information extraction
              const target = error.target;
              readyState = target?.readyState ?? 3; // Use nullish coalescing for safety
              
              // Extract detailed error information from the WebSocket target
              if (target instanceof WebSocket) {
                errorDetails.url = target.url;
                errorDetails.protocol = target.protocol;
                errorDetails.extensions = target.extensions;
                errorDetails.readyState = readyState;
                
                // Map WebSocket readyState to meaningful messages with enhanced context
                switch (readyState) {
                  case WebSocket.CONNECTING:
                    errorMessage = 'Failed to establish WebSocket connection';
                    errorCode = 'CONNECTION_FAILED';
                    break;
                  case WebSocket.OPEN:
                    errorMessage = 'WebSocket connection encountered an error';
                    errorCode = 'CONNECTION_ERROR';
                    break;
                  case WebSocket.CLOSING:
                    errorMessage = 'WebSocket connection closing with error';
                    errorCode = 'CONNECTION_CLOSING_ERROR';
                    break;
                  case WebSocket.CLOSED:
                  default:
                    errorMessage = 'WebSocket connection closed due to error';
                    errorCode = 'CONNECTION_CLOSED';
                    break;
                }
              }
              
              // Extract additional event information safely
              if (error.type) {
                errorDetails.eventType = error.type;
              }
              
              if (error.timeStamp) {
                errorDetails.timestamp = error.timeStamp;
              }
              
              // Check for browser-specific error information
              if (error.reason) {
                errorMessage = error.reason;
                errorDetails.reason = error.reason;
              }
              
              if (error.code) {
                errorDetails.closeCode = error.code;
                errorCode = `CLOSE_${error.code}`;
              }
              
            } else if (error instanceof Error) {
              // Handle standard Error objects
              errorMessage = error.message || 'WebSocket error occurred';
              errorCode = error.name || 'WEBSOCKET_ERROR';
              errorDetails.stack = error.stack;
              
            } else if (typeof error === 'string') {
              // Handle string errors
              errorMessage = error;
              errorCode = 'STRING_ERROR';
              
            } else if (error && typeof error === 'object') {
              // Handle other object types safely
              if (error.message) {
                errorMessage = error.message;
              }
              if (error.code) {
                errorCode = error.code;
              }
              // Attempt to extract any other useful properties
              Object.keys(error).forEach(key => {
                try {
                  const value = error[key];
                  if (typeof value === 'string' || typeof value === 'number') {
                    errorDetails[key] = value;
                  }
                } catch (e) {
                  // Ignore properties that can't be accessed
                }
              });
            }
            
          } catch (parseError) {
            // Ultimate fallback if error processing fails
            console.warn('Error processing WebSocket error:', parseError);
            errorMessage = 'WebSocket connection error - unable to determine details';
            errorCode = 'ERROR_PARSE_FAILED';
            errorDetails.parseError = parseError.message;
          }
          
          // Ensure we never serialize Event objects or other problematic types
          const safeErrorData = {
            error: errorMessage,
            code: errorCode,
details: errorDetails,
            timestamp: Date.now(),
            readyState: readyState
          };
          // Emit the safe error data
          this.emit('connection', { 
            status: 'error', 
            error: errorMessage,
            code: errorCode,
            details: errorDetails,
            timestamp: new Date().toISOString()
          });
          
          reject(new Error(errorMessage));
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
if (!this.messageQueue.length) return;
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of messages) {
      try {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify(message));
        } else {
          this.messageQueue.push(message);
          break;
        }
      } catch (error) {
        console.error('WebSocket: Failed to send queued message', error);
      }
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