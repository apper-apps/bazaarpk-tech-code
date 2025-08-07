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
      console.error('WebSocket connection failed:', error);
      
      // Enhanced error handling with better message extraction
      let userMessage = 'Connection failed - will retry automatically';
      let toastType = 'error';
      
      // Extract error message safely with additional checks
      if (error instanceof Error) {
        let message = '';
        
        // Safely extract message with fallbacks
        if (error.message && typeof error.message === 'string') {
          message = error.message.trim();
        }
        
        // Prevent Event object string representations
        if (message.includes('[object Event]') || message.includes('[object Object]')) {
          message = 'WebSocket connection error';
        }
        
        // Map common error patterns to user-friendly messages
        if (message.includes('Failed to establish') || message.includes('server may be unavailable')) {
          userMessage = 'Unable to connect to server - retrying';
          toastType = 'warning';
        } else if (message.includes('closed unexpectedly') || message.includes('was closed unexpectedly')) {
          userMessage = 'Connection lost - attempting to reconnect';
          toastType = 'warning';
        } else if (message.includes('closing due to error')) {
          userMessage = 'Connection interrupted - reconnecting';
          toastType = 'warning';
        } else if (message.includes('security') || message.includes('blocked')) {
          userMessage = 'Connection blocked by security policy';
          toastType = 'error';
        } else if (message.includes('invalid connection') || message.includes('unknown error')) {
          userMessage = 'Connection error - please try again';
          toastType = 'error';
        } else if (message && message.length > 0 && !message.includes('[object')) {
          // Use the sanitized message if it's valid
          userMessage = message;
        }
      } else if (error && typeof error === 'string' && error.trim()) {
        // Handle string errors with sanitization
        const sanitizedError = error.trim();
        if (!sanitizedError.includes('[object')) {
          userMessage = sanitizedError;
        }
      }
      
      // Final check - ensure message is meaningful
      if (userMessage.includes('[object') || userMessage === 'null' || userMessage === 'undefined') {
        userMessage = 'Connection failed - will retry automatically';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, toastType);
      }
    }
  }, [url, isOnline, showConnectionToasts, showToast]);

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
            if (data.code !== 1000) { // Not a normal closure
              showToast('Connection lost - attempting to reconnect', 'warning');
            }
            onDisconnect?.(data);
            break;
case 'error':
            // Enhanced error handling with better message sanitization
            let errorMessage = 'Connection error occurred';
            let toastType = 'error';
            
            // Extract and sanitize error message with multiple fallbacks
            if (data?.code) {
              switch (data.code) {
                case 'CONNECTION_CLOSED':
                  errorMessage = 'Connection unexpectedly closed';
                  toastType = 'warning';
                  break;
                case 'CONNECTION_FAILED':
                  errorMessage = 'Failed to establish connection - server may be unavailable';
                  toastType = 'error';
                  break;
                case 'CONNECTION_ERROR':
                  errorMessage = 'Connection encountered an unexpected error';
                  toastType = 'warning';
                  break;
                case 'CONNECTION_CLOSING_ERROR':
                  errorMessage = 'Connection closing due to error';
                  toastType = 'warning';
                  break;
                case 'INVALID_CONNECTION':
                  errorMessage = 'Invalid connection state detected';
                  toastType = 'error';
                  break;
                case 'UNKNOWN_ERROR':
                  errorMessage = 'Connection failed due to unknown error';
                  toastType = 'error';
                  break;
                default:
                  // Use the error message from WebSocketService with validation
                  if (data.error && typeof data.error === 'string' && data.error.trim()) {
                    const sanitizedError = data.error.trim();
                    // Ensure it's not an object representation
                    if (!sanitizedError.includes('[object') && sanitizedError !== 'null' && sanitizedError !== 'undefined') {
                      errorMessage = sanitizedError;
                    }
                  }
              }
            } else if (data?.error && typeof data.error === 'string' && data.error.trim()) {
              // Direct error message with sanitization
              const sanitizedError = data.error.trim();
              if (!sanitizedError.includes('[object') && sanitizedError !== 'null' && sanitizedError !== 'undefined') {
                errorMessage = sanitizedError;
              }
            }
            
            // Final validation - ensure we never show Event object representations
            if (errorMessage.includes('[object Event]') || errorMessage.includes('[object Object]')) {
              errorMessage = 'WebSocket connection error occurred';
            }
            
            showToast(errorMessage, toastType);
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

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && isOnline) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
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