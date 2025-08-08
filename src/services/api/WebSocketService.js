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
          
          // Extract meaningful error message from event object
          let errorMessage = 'WebSocket connection failed';
          
          // Try to extract useful information from the error event
          if (event && typeof event === 'object') {
            // Check for common error message properties
            if (typeof event.message === 'string' && event.message.length > 0) {
              errorMessage = event.message;
            } else if (typeof event.error === 'string' && event.error.length > 0) {
              errorMessage = event.error;
            } else if (typeof event.reason === 'string' && event.reason.length > 0) {
              errorMessage = event.reason;
            } else if (event.target && event.target.readyState !== undefined) {
              // Use readyState for context-specific messages
              const readyState = event.target.readyState;
              switch (readyState) {
                case 0:
                  errorMessage = 'WebSocket connection interrupted';
                  break;
                case 2:
                  errorMessage = 'WebSocket connection closing';
                  break;
                case 3:
                  errorMessage = 'WebSocket connection lost';
                  break;
                default:
                  errorMessage = 'WebSocket connection error';
              }
            }
          }
          
          // Clean up message - remove any object references
          if (typeof errorMessage !== 'string' || errorMessage.includes('[object')) {
            errorMessage = 'WebSocket connection failed';
          }
          
          // Limit message length for UI display
          if (errorMessage.length > 80) {
            errorMessage = errorMessage.substring(0, 80) + '...';
          }
          
          const readyState = this.socket ? this.socket.readyState : 3;
          
          // Create clean, string-only error data
          const errorData = {
            status: 'error',
            error: errorMessage,
            code: 'WEBSOCKET_ERROR',
            readyState: readyState,
            timestamp: new Date().toISOString()
          };
// Enhanced error message extraction for Event objects
          let logMessage = errorMessage;
          let eventDetails = '';
          
          // Extract meaningful information from WebSocket Event objects
          if (event && typeof event === 'object') {
            if (event.type) {
              eventDetails += `type: ${event.type}`;
            }
            if (event.code) {
              eventDetails += eventDetails ? `, code: ${event.code}` : `code: ${event.code}`;
            }
            if (event.reason && typeof event.reason === 'string') {
              eventDetails += eventDetails ? `, reason: ${event.reason}` : `reason: ${event.reason}`;
            }
            if (event.wasClean !== undefined) {
              eventDetails += eventDetails ? `, clean: ${event.wasClean}` : `clean: ${event.wasClean}`;
            }
          }
          
          // Add connection state context for better debugging
          let stateDescription = '';
          switch (readyState) {
            case 0: stateDescription = 'CONNECTING'; break;
            case 1: stateDescription = 'OPEN'; break;
            case 2: stateDescription = 'CLOSING'; break;
            case 3: stateDescription = 'CLOSED'; break;
            default: stateDescription = 'UNKNOWN';
          }
          
          // Enhanced logging with extracted event details
          console.error('WebSocket error:', {
            message: logMessage,
            state: `${readyState} (${stateDescription})`,
            eventDetails: eventDetails || 'none',
            timestamp: new Date().toISOString()
          });
          // Emit guaranteed clean error data
          this.emit('connection', errorData);
          
          // Reject with simple Error instance
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
    if (!this.isOnline || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('WebSocket: Max reconnect attempts reached or offline');
      return;
    }
    
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts), 
      30000
    );
    
    this.reconnectAttempts++;
    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        this.connect().catch(error => {
          console.error('WebSocket: Reconnection failed', error.message);
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
    if (!this.messageQueue.length || !this.socket) return;
    
    const tempQueue = [...this.messageQueue];
    this.messageQueue = [];
    
    for (const message of tempQueue) {
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify(message));
        } catch (error) {
          console.warn('Failed to send queued message, discarding');
        }
      } else {
        // Requeue only if connection is expected to recover
        if (this.socket.readyState === WebSocket.CONNECTING) {
          this.messageQueue.push(message);
        }
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