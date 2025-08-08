import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import webSocketService from "@/services/api/WebSocketService";
import { Error } from "@/components/ui/Error";

// Enhanced error logging for WebSocket hook
const logWebSocketError = (error, context = '') => {
  const errorInfo = {
    message: error?.message || 'Unknown WebSocket error',
    category: error?.category || 'unknown',
    url: error?.url || 'unknown',
    code: error?.code || null,
    reason: error?.reason || null,
    readyState: error?.readyState || null,
    timestamp: error?.timestamp || new Date().toISOString(),
    context
  };
  
  console.error('WebSocket Hook Error:', errorInfo);
  return errorInfo;
};
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
      // Defensive check: ensure webSocketService is available
      if (!webSocketService || typeof webSocketService.connect !== 'function') {
        throw new Error('WebSocket service is not available');
      }
      
      await webSocketService.connect(url);
    } catch (error) {
      // Simplified error handling to prevent object serialization issues
      let userMessage = 'Connection unavailable';
      let toastType = 'warning';
      
      // Extract meaningful error information without complex nesting
      if (error?.message && typeof error.message === 'string') {
        userMessage = error.message;
        
        // Adjust toast type based on error category
        if (error.category === 'timeout') {
          toastType = 'warning';
          userMessage = 'Connection timeout - please try again';
        } else if (error.category === 'connection') {
          toastType = 'warning';
          userMessage = 'Unable to connect - working in offline mode';
        }
      } else if (typeof error === 'string') {
        userMessage = error;
      } else if (error instanceof Error) {
        userMessage = error.message || 'Connection error';
      }
      
      // Clean technical jargon and ensure reasonable length
      userMessage = userMessage
        .replace(/WebSocket/gi, 'Connection')
        .replace(/ECONNREFUSED/gi, 'Server unavailable')
        .replace(/ETIMEDOUT/gi, 'Connection timeout')
        .substring(0, 80);
      
      if (showConnectionToasts) {
        showToast(userMessage, toastType);
      }
// Safe error logging with object serialization protection
      const safeErrorLog = {
        category: error?.category,
        canRetry: error?.canRetry,
        timestamp: new Date().toISOString()
      };
      
      // Extract error message safely without "[object Object]"
      if (error?.message && typeof error.message === 'string') {
        safeErrorLog.error = error.message;
      } else if (typeof error === 'string') {
        safeErrorLog.error = error;
      } else if (error instanceof Error) {
        safeErrorLog.error = error.message || error.name || 'Connection Error';
      } else if (error && typeof error === 'object') {
        safeErrorLog.error = error.reason || error.statusText || error.type || 'Connection failed';
      } else {
        safeErrorLog.error = 'Unknown connection error';
      }
      
      console.error('WebSocket connection failed:', safeErrorLog);
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
    // Defensive check for webSocketService availability
    if (!webSocketService || typeof webSocketService.on !== 'function') {
      console.warn('WebSocket service not available, connection status will remain disconnected');
      setConnectionStatus('error');
      return () => {}; // Return empty cleanup function
    }
    
    const unsubscribe = webSocketService.on('connection', (data) => {
      setConnectionStatus(data?.status || 'disconnected');
      
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
case 'parse_error':
case 'invalid':
            // Enhanced error message handling with object serialization safety
            let errorMessage = 'Connection error';
            let shouldShowToast = true;
            
            // Safe error object inspection to prevent [object Object] messages
// Simplified error message extraction with no "[object Object]" risk
            const extractErrorMessage = (errorData) => {
              if (!errorData) return 'Unknown error';
              
              // Direct string handling
              if (typeof errorData === 'string') {
                return errorData.substring(0, 80);
              }
              
              // Safe object property extraction
              if (typeof errorData === 'object' && errorData !== null) {
                // Check common error message properties
                const message = errorData.message || errorData.error || errorData.reason || 
                               errorData.statusText || errorData.description;
                
                if (typeof message === 'string' && message.length > 0) {
                  return message.substring(0, 80);
                }
                
                // Fallback to code or type based messages
                if (errorData.code) {
                  return `Connection error (code: ${errorData.code})`;
                }
                
                if (errorData.type) {
                  return `${errorData.type} connection error`;
                }
                
                // Safe fallback - never return "[object Object]"
                return 'Connection error occurred';
              }
              
              // Final fallback for primitives
              return 'Connection issue detected';
            };
            
            // Safe error message extraction with multiple fallbacks
            try {
              if (data?.status === 'parse_error') {
                errorMessage = 'Message format error - connection may be unstable';
              } else if (data?.type === 'invalid') {
                errorMessage = 'Received invalid data format';
                shouldShowToast = false; // Don't spam user with parsing errors
              } else if (data?.code === 'WEBSOCKET_ERROR') {
                errorMessage = 'Service unavailable';
              } else {
                // Use safe error extraction
                errorMessage = extractErrorMessage(data?.error || data);
              }
              
              // Clean up technical jargon for user-friendly messages
              errorMessage = errorMessage
                .replace(/JSON\.parse|SyntaxError|parse_error/gi, 'format error')
                .replace(/WebSocket/gi, 'Connection')
                .replace(/\[object Object\]/gi, 'connection issue')
                .trim();
                
            } catch (msgError) {
              console.warn('Error processing WebSocket error message:', msgError);
              errorMessage = 'Connection issue detected';
            }
            
            // Enhanced error logging without object serialization issues
// Simplified and reliable error serialization
            const safeStringify = (obj, fallback = 'Connection error') => {
              if (typeof obj === 'string') return obj;
              if (obj === null || obj === undefined) return fallback;
              
              try {
                // Try to get a meaningful string representation
                if (obj.message && typeof obj.message === 'string') return obj.message;
                if (obj.error && typeof obj.error === 'string') return obj.error;
                if (obj.reason && typeof obj.reason === 'string') return obj.reason;
                
                // Safe JSON stringify with replacer to handle circular refs
                return JSON.stringify(obj, (key, value) => {
                  if (typeof value === 'object' && value !== null) {
                    // Prevent circular references and complex objects
                    return '[Object]';
                  }
                  return value;
                });
              } catch (e) {
                return fallback;
              }
            };

            const logError = () => {
              try {
                const safeLogData = {
                  status: data?.status || 'unknown',
                  type: data?.type || 'unknown',
                  code: data?.code,
                  hasError: !!data?.error,
                  errorType: typeof data?.error,
                  timestamp: new Date().toISOString()
                };
                
                // Process error data safely
                if (data?.error) {
                  safeLogData.errorMessage = safeStringify(data.error, 'Unknown error occurred');
                }
                
                console.error('WebSocket Hook Error:', safeLogData);
              } catch (logErr) {
                console.error('Failed to log WebSocket error safely:', logErr.message || logErr);
                // Fallback logging
                console.error('Original error data (fallback):', safeStringify(data, 'Error data unavailable'));
              }
            };
            logError();
            if (shouldShowToast) {
              showToast(errorMessage, 'error');
            }
            
            // Safe error callback invocation with sanitized data
            try {
              const callbackData = {
                status: data?.status,
                type: data?.type,
                code: data?.code,
                message: errorMessage,
                timestamp: new Date().toISOString()
              };
              onError?.(callbackData);
            } catch (callbackError) {
              console.error('Error in WebSocket error callback:', callbackError);
            }
            break;
        }
      }
    });
    
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [showConnectionToasts, showToast, onConnect, onDisconnect, onError]);

  // Setup message listener
useEffect(() => {
    // Defensive check for webSocketService availability
    if (!webSocketService || typeof webSocketService.on !== 'function') {
      console.warn('WebSocket service not available for message handling');
      return () => {}; // Return empty cleanup function
    }
    
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