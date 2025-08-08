import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import webSocketService from "@/services/api/WebSocketService";
export const useWebSocket = (url = 'ws://localhost:8080', options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { showToast } = useToast();
  const unsubscribeRefs = useRef([]);
  
  const {
    autoConnect = true,
    showConnectionToasts = true,
    onConnect,
    onDisconnect,
    onError,
    onMessage
  } = options;

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Connection management
const connect = useCallback(async () => {
    if (!isOnline) {
      showToast('Cannot connect - device is offline', 'warning');
      return;
    }

    try {
      await webSocketService.connect(url);
} catch (error) {
      // Comprehensive error message extraction
let userMessage = 'WebSocket connection failed';
      
      // Handle all possible error object types
      if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
        userMessage = error.message;
      } else if (typeof error === 'string' && error.length > 0) {
        userMessage = error;
      } else if (error && typeof error === 'object') {
        // Try common error object properties
        if (typeof error.error === 'string' && error.error.length > 0) {
          userMessage = error.error;
        } else if (typeof error.message === 'string' && error.message.length > 0) {
          userMessage = error.message;
        } else if (typeof error.reason === 'string' && error.reason.length > 0) {
          userMessage = error.reason;
        } else if (error.code === 'WEBSOCKET_ERROR') {
          userMessage = 'Unable to establish WebSocket connection';
        } else if (error.type) {
          userMessage = `WebSocket ${error.type} error`;
        } else {
          // Enhanced fallback for complex error objects
          try {
            const errorStr = JSON.stringify(error);
            if (errorStr && errorStr !== '{}' && !errorStr.includes('[object Object]')) {
              // Try to extract meaningful information
              if (error.name) userMessage = `Connection error: ${error.name}`;
              else if (error.statusText) userMessage = `Connection error: ${error.statusText}`;
              else userMessage = 'Connection error occurred';
            }
          } catch (e) {
            userMessage = 'Connection error occurred';
          }
        }
      }
      
      // Comprehensive cleanup for all object serialization issues
      if (!userMessage || 
          typeof userMessage !== 'string' || 
          userMessage.includes('[object') || 
          userMessage.includes('undefined') ||
          userMessage.includes('null') ||
          userMessage.includes('[Event]') ||
          userMessage.includes('[Object]') ||
          userMessage.length < 3) {
        userMessage = 'WebSocket connection failed - please try again';
      }
      
      // Clean up common technical jargon for better UX
      userMessage = userMessage
        .replace(/WebSocket/gi, 'Connection')
        .replace(/ECONNREFUSED/gi, 'Connection refused')
        .replace(/ETIMEDOUT/gi, 'Connection timeout');
      
      // Limit length for UI
      if (userMessage.length > 80) {
        userMessage = userMessage.substring(0, 80) + '...';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, 'error');
      }
      
      // Enhanced error logging with original error object
      console.error('WebSocket connection failed:', userMessage, { originalError: error });
    }
  }, [isOnline, showConnectionToasts, showToast, url]);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  const sendMessage = useCallback((message) => {
    return webSocketService.send(message);
  }, []);

  // Subscribe to specific message types
  const subscribe = useCallback((eventType, callback) => {
    const unsubscribe = webSocketService.on(eventType, callback);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Setup connection status listener
useEffect(() => {
    const unsubscribe = webSocketService.on('connection', (data) => {
      setConnectionStatus(data.status);
      
      if (showConnectionToasts) {
        switch (data.status) {
          case 'connected':
            showToast('Connected to real-time updates', 'success');
            onConnect?.(data);
            break;
          case 'disconnected':
            if (data.code !== 1000) {
              showToast('Connection lost - attempting to reconnect', 'warning');
            }
            onDisconnect?.(data);
            break;
case 'error':
            // Comprehensive error message extraction from data object
            let errorMessage = 'Connection error occurred';
            
            // Extract error message from various possible data structures
if (data && typeof data === 'object') {
              if (typeof data.error === 'string' && data.error.length > 0) {
                errorMessage = data.error;
              } else if (typeof data.message === 'string' && data.message.length > 0) {
                errorMessage = data.message;
              } else if (typeof data.reason === 'string' && data.reason.length > 0) {
                errorMessage = data.reason;
              } else if (data.code === 'WEBSOCKET_ERROR') {
                errorMessage = 'Connection service unavailable';
              }
              
              // Handle nested error objects
              if (data.error && typeof data.error === 'object') {
                if (typeof data.error.message === 'string' && data.error.message.length > 0) {
                  errorMessage = data.error.message;
                } else if (typeof data.error.error === 'string' && data.error.error.length > 0) {
                  errorMessage = data.error.error;
                } else {
                  // Handle deeply nested error objects
                  try {
                    const errorStr = JSON.stringify(data.error);
                    if (errorStr && errorStr !== '{}' && !errorStr.includes('[object Object]')) {
                      if (data.error.name) errorMessage = `Connection error: ${data.error.name}`;
                      else if (data.error.type) errorMessage = `Connection ${data.error.type} error`;
                      else errorMessage = 'Connection service error';
                    }
                  } catch (e) {
                    errorMessage = 'Connection service error';
                  }
                }
              }
              
              // Final fallback for unhandled object cases
              if (!errorMessage || errorMessage.includes('[object')) {
                try {
                  const dataStr = JSON.stringify(data);
                  if (dataStr && dataStr !== '{}' && !dataStr.includes('[object Object]')) {
                    errorMessage = 'Connection data error occurred';
                  } else {
                    errorMessage = 'Connection error - please check your internet';
                  }
                } catch (e) {
                  errorMessage = 'Connection error - please check your internet';
                }
              }
            }
            
            // Enhanced cleanup for all object serialization issues
            if (!errorMessage || 
                typeof errorMessage !== 'string' ||
                errorMessage.includes('[object') ||
                errorMessage.includes('undefined') ||
                errorMessage.includes('null') ||
                errorMessage.includes('[Event]') ||
                errorMessage.includes('[Object]') ||
                errorMessage.includes('state: 3') ||
                errorMessage.length < 3) {
              errorMessage = 'Connection error - please check your internet';
            }
            
            // Make technical messages more user-friendly
            errorMessage = errorMessage
              .replace(/WebSocket/gi, 'Connection')
              .replace(/ECONNREFUSED/gi, 'Server unavailable')
              .replace(/ETIMEDOUT/gi, 'Connection timeout')
              .replace(/Failed to connect/gi, 'Unable to connect');
            
            // Limit length for better UI display
            if (errorMessage.length > 60) {
              errorMessage = errorMessage.substring(0, 60) + '...';
            }
            showToast(errorMessage, 'error');
            onError?.(data);
            break;
        }
      }
    });
    
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [showConnectionToasts, showToast, onConnect, onDisconnect, onError]);

  // Setup message listener
useEffect(() => {
    const unsubscribe = webSocketService.on('message', (data) => {
      setLastMessage(data);
      onMessage?.(data);
    });
    
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [onMessage]);

  // Periodic connection check for resilience
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      if (connectionStatus === 'disconnected' && isOnline) {
        console.log('Periodic connection check - attempting reconnect');
        connect();
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(connectionCheckInterval);
  }, [connectionStatus, isOnline, connect]);

  // Auto-connect on mount
useEffect(() => {
    if (autoConnect && isOnline) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      // Clear all listeners
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      
      // Graceful disconnect
      webSocketService.disconnect();
    };
  }, [autoConnect, isOnline, connect]);

  return {
    connectionStatus,
    lastMessage,
    isOnline,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting'
  };
};

export default useWebSocket;