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
    this.errorEmitted = false;
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

    // Global error handler for WebSocket errors
    window.addEventListener('error', (globalError) => {
      if (globalError.message.includes('WebSocket')) {
        console.error('Global WebSocket error intercepted:', globalError.message);
        // Prevent default handling
        globalError.preventDefault();
      }
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
          this.errorEmitted = false;
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
          this.errorEmitted = false;
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

this.socket.onerror = (event) => {
          // Prevent duplicate error emissions
          if (this.errorEmitted) return;
          this.errorEmitted = true;
          
          this.isConnecting = false;
          
          // Advanced error object analysis with circular reference detection
          const analyzeErrorObject = (errorObj) => {
            const visited = new WeakSet();
            const messages = [];
            
            const extractFromObject = (obj, depth = 0) => {
              if (depth > 3 || !obj || visited.has(obj)) return;
              visited.add(obj);
              
              // Common error properties to check
              const errorProps = [
                'message', 'error', 'type', 'reason', 'code', 'description', 
                'detail', 'statusText', 'responseText', 'data', 'cause'
              ];
              
              for (const prop of errorProps) {
                try {
                  const value = obj[prop];
                  if (value && typeof value === 'string' && value.trim()) {
                    messages.push(value.trim());
                  } else if (value && typeof value === 'number') {
                    messages.push(`Error ${value}`);
                  } else if (value && typeof value === 'object' && depth < 2) {
                    extractFromObject(value, depth + 1);
                  }
                } catch (e) {
                  // Ignore property access errors
                }
              }
              
              // Try toString methods
              try {
                if (obj.toString && typeof obj.toString === 'function') {
                  const str = obj.toString();
                  if (str && !str.includes('[object') && str !== '[object Object]') {
                    messages.push(str);
                  }
                }
              } catch (e) {
                // Ignore toString errors
              }
              
              // Check constructor name for error types
              try {
                if (obj.constructor && obj.constructor.name && obj.constructor.name !== 'Object') {
                  messages.push(`${obj.constructor.name} occurred`);
                }
              } catch (e) {
                // Ignore constructor access errors
              }
            };
            
            if (errorObj && typeof errorObj === 'object') {
              extractFromObject(errorObj);
            }
            
            return messages.filter(msg => 
              msg && 
              typeof msg === 'string' && 
              msg.trim() && 
              !msg.includes('[object') &&
              msg !== '[object Object]'
            );
          };
          
          // Multi-layer error message extraction
          let errorMessage = 'WebSocket connection error';
          let debugInfo = { eventType: typeof event, eventConstructor: 'unknown' };
          
          try {
            // Capture debug info safely
            if (event) {
              debugInfo.eventType = typeof event;
              debugInfo.eventConstructor = event.constructor?.name || 'unknown';
              debugInfo.eventKeys = Object.keys(event || {}).slice(0, 10); // Limit keys for safety
            }
            
            // Analyze the error object comprehensively
            const extractedMessages = analyzeErrorObject(event);
            
            if (extractedMessages.length > 0) {
              errorMessage = extractedMessages[0];
            } else if (event && typeof event === 'string') {
              errorMessage = event.trim() || 'WebSocket connection error';
            } else if (event && typeof event === 'number') {
              errorMessage = `WebSocket error code: ${event}`;
            }
            
            // Additional fallback checks for common WebSocket error patterns
            if (event && typeof event === 'object') {
              // Check for standard WebSocket close codes
              if (event.code && typeof event.code === 'number') {
                const closeCodeMessages = {
                  1000: 'Normal closure',
                  1001: 'Going away',
                  1002: 'Protocol error',
                  1003: 'Unsupported data',
                  1006: 'Abnormal closure',
                  1007: 'Invalid frame payload data',
                  1008: 'Policy violation',
                  1009: 'Message too big',
                  1011: 'Unexpected condition',
                  1015: 'TLS handshake failure'
                };
                
                const codeMessage = closeCodeMessages[event.code];
                if (codeMessage) {
                  errorMessage = `Connection closed: ${codeMessage} (${event.code})`;
                }
              }
              
              // Check for network-related errors
              if (event.type) {
                const type = String(event.type).toLowerCase();
                if (type.includes('network') || type.includes('timeout')) {
                  errorMessage = 'Network connection error';
                } else if (type.includes('security') || type.includes('ssl')) {
                  errorMessage = 'Security/SSL connection error';
                }
              }
            }
            
          } catch (analysisError) {
            // If error analysis itself fails, use safe fallback
            console.warn('Error analysis failed:', analysisError);
            errorMessage = 'WebSocket connection error (analysis failed)';
          }
          
          // Final sanitization - absolutely prevent object serialization artifacts
          if (typeof errorMessage !== 'string' || 
              errorMessage.includes('[object') || 
              errorMessage === '[object Object]' ||
              errorMessage.includes('toString')) {
            errorMessage = 'WebSocket connection error';
          }
          
          // Ensure message is meaningful and not too long
          if (errorMessage.length > 200) {
            errorMessage = errorMessage.substring(0, 200) + '...';
          }
          
          const readyState = this.socket ? this.socket.readyState : 3;
          const stateName = this.getStateName(readyState);
          
          // Create user-friendly error message
          const finalErrorMessage = `WebSocket connection failed (${stateName})`;
          
          // Create completely sanitized error data
          const errorData = {
            status: 'error',
            error: finalErrorMessage,
            code: 'WEBSOCKET_ERROR',
            readyState: readyState,
            timestamp: new Date().toISOString(),
            originalMessage: errorMessage
          };
          
          // Enhanced debugging log
          console.error('WebSocket error occurred:', {
            message: errorMessage,
            finalMessage: finalErrorMessage,
            state: stateName,
            readyState: readyState,
            debugInfo: debugInfo,
            url: this.url
          });
          
          // Additional debug log for problematic error objects
          if (event && typeof event === 'object') {
            try {
              console.error('Raw error event details:', {
                type: event.type,
                target: event.target?.constructor?.name,
                currentTarget: event.currentTarget?.constructor?.name,
                timeStamp: event.timeStamp,
                bubbles: event.bubbles,
                cancelable: event.cancelable
              });
            } catch (e) {
              console.error('Could not log error event details safely');
            }
          }
          
          // Emit clean error data for listeners
          this.emit('connection', errorData);
          
          // Reject with clear Error instance
          reject(new Error(finalErrorMessage));
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
    
    // Guard against multiple heartbeats
    if (this.heartbeatInterval) return;
    
    this.heartbeatInterval = setInterval(() => {
      // Check connection status before sending
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.send({ type: 'ping', timestamp: Date.now() });
        } catch (e) {
          console.error('Heartbeat send error:', e.message);
        }
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
          // Requeue if not sent
          this.messageQueue.push(message);
        }
      } catch (error) {
        console.error('Message send error:', error.message);
        // Don't requeue - message will be lost to prevent buildup
      }
    }
  }
getStateName(state) {
    switch(state) {
      case 0: return 'CONNECTING';
      case 1: return 'OPEN';
      case 2: return 'CLOSING';
      case 3: return 'CLOSED';
      default: return 'UNKNOWN';
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