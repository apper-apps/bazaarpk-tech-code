import React from "react";
import { Error } from "@/components/ui/Error";
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
          
          // Enhanced error message generation with environment context
          let errorMessage = 'WebSocket connection failed';
          let errorCategory = 'network';
          let userMessage = 'Connection lost';
          let suggestion = 'Please check your internet connection and try again';
          
          // Determine if we're in development or production
          const isDev = import.meta.env.MODE === 'development';
          const wsUrl = this.url || import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
          
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
          } else if (event?.type === 'error') {
            // Check connection state for more context
            const readyState = this.socket?.readyState ?? 3;
            if (readyState === 2) { // CLOSING
              errorCategory = 'closing';
              userMessage = 'Connection is closing';
              suggestion = 'Reconnecting automatically...';
            } else if (readyState === 3) { // CLOSED
              errorCategory = 'network';
              userMessage = 'Unable to connect to server';
              suggestion = isDev 
                ? `Cannot connect to ${wsUrl}. Ensure WebSocket server is running.`
                : 'Unable to establish connection. Please check your internet connection.';
            }
          }
          
          const readyState = this.socket?.readyState ?? 3;
          
          // Enhanced error data object with actionable information
          const errorData = {
            status: 'error',
            category: errorCategory,
            message: userMessage,
            suggestion: suggestion,
            canRetry: errorCategory !== 'auth',
            error: errorMessage,
            code: 'WEBSOCKET_ERROR',
            readyState: readyState,
            timestamp: new Date().toISOString(),
            url: wsUrl,
            isDevelopment: isDev
          };
          
          // Enhanced logging with more context
          console.error('WebSocket connection failed:', {
            message: errorMessage,
            category: errorCategory,
            url: wsUrl,
            readyState: readyState,
            suggestion: suggestion
          });
          
          // Emit error event (not connection event for errors)
          this.emit('error', errorData);
          
          // Create consistent error object with both Error instance properties and structured data
          const connectionError = new Error(errorMessage);
          connectionError.category = errorData.category;
          connectionError.suggestion = errorData.suggestion;
          connectionError.timestamp = errorData.timestamp;
          connectionError.canRetry = errorData.canRetry;
          connectionError.retryable = errorData.canRetry; // Backward compatibility
          connectionError.url = wsUrl;
          
          // Schedule automatic reconnection if retryable
          if (errorData.canRetry && !this.isDestroyed) {
            this.scheduleReconnect();
          }
          
          reject(connectionError);
        };

      } catch (error) {
        this.isConnecting = false;
        
        // Ensure all errors have consistent structure
        if (!(error instanceof Error)) {
          const structuredError = new Error(typeof error === 'string' ? error : 'WebSocket connection failed');
          structuredError.category = 'connection';
          structuredError.suggestion = 'Check your internet connection';
          structuredError.retryable = true;
          structuredError.canRetry = true;
          reject(structuredError);
        } else {
          // Add missing properties to existing Error instances
          if (!error.category) error.category = 'connection';
          if (!error.suggestion) error.suggestion = 'Try refreshing the page';
          if (error.retryable === undefined) error.retryable = true;
          if (error.canRetry === undefined) error.canRetry = true;
          reject(error);
        }
      }
    });
  }

  disconnect() {
    this.isDestroyed = true; // Prevent reconnection attempts
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