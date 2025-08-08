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
          console.error('WebSocket error event:', event);
          
          // Prevent duplicate error emissions
          if (this.errorEmitted) return;
          this.errorEmitted = true;
          
          this.isConnecting = false;
          
          // Create a meaningful error message from WebSocket error event
          let errorMessage = 'WebSocket connection failed';
          
          // WebSocket error events don't have a message property
          // Extract meaningful info from the event and socket state
          if (this.socket) {
            const readyState = this.socket.readyState;
            switch (readyState) {
              case WebSocket.CONNECTING:
                errorMessage = 'Connection attempt failed - server unreachable';
                break;
              case WebSocket.CLOSING:
                errorMessage = 'Connection was interrupted while closing';
                break;
              case WebSocket.CLOSED:
                errorMessage = 'Connection closed unexpectedly';
                break;
              default:
                errorMessage = 'WebSocket connection error occurred';
            }
          }
          
          // Add event type if available and meaningful
          if (event && event.type && event.type !== 'error') {
            errorMessage += ` (${event.type})`;
          }
          
          // Create sanitized error data
          const safeErrorData = {
            status: 'error',
            error: errorMessage,
            code: 'WEBSOCKET_ERROR',
            readyState: this.socket ? this.socket.readyState : 3,
            timestamp: new Date().toISOString()
          };

          console.error('Processed WebSocket error:', safeErrorData);
          this.emit('connection', safeErrorData);
          
          // Reject with proper error
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