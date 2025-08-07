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
      
      // Enhanced error handling with better user messaging and serialization safety
      let userMessage = 'Connection failed - will retry automatically';
      let toastType = 'error';
      
      // Safely extract error information with multiple fallbacks
      const safeError = {
        code: null,
        message: null,
        details: null
      };
      
      try {
        // Handle different error types safely
        if (error && typeof error === 'object') {
          safeError.code = error.code || error.name || 'UNKNOWN_ERROR';
          safeError.message = error.message || error.toString() || 'Unknown error occurred';
          safeError.details = error.details || {};
          
          // If error has toJSON method, use it
          if (typeof error.toJSON === 'function') {
            const jsonError = error.toJSON();
            safeError.code = jsonError.code || safeError.code;
            safeError.message = jsonError.message || safeError.message;
            safeError.details = jsonError.details || safeError.details;
          }
        } else if (typeof error === 'string') {
          safeError.message = error;
          safeError.code = 'STRING_ERROR';
        } else {
          safeError.message = 'Connection error occurred';
          safeError.code = 'UNKNOWN_ERROR_TYPE';
        }
      } catch (parseError) {
        // Ultimate fallback if error parsing fails
        safeError.code = 'ERROR_PARSE_FAILED';
        safeError.message = 'Connection error - unable to determine details';
        console.warn('Error parsing failed:', parseError);
      }
      
      // Use safe error information for user messaging
      if (safeError.code) {
        switch (safeError.code) {
          case 'CONNECTION_CLOSED':
            userMessage = 'Connection lost - attempting to reconnect';
            toastType = 'warning';
            break;
          case 'CONNECTION_ERROR':
            userMessage = 'Unable to establish connection - retrying';
            toastType = 'error';
            break;
          case 'WEBSOCKET_ERROR':
            userMessage = 'Network error - checking connection';
            toastType = 'warning';
            break;
          case 'SECURITY_ERROR':
          case 'PROTOCOL_ERROR':
            userMessage = 'Connection blocked by security policy';
            toastType = 'error';
            break;
          case 'ERROR_PARSE_FAILED':
            userMessage = 'Connection error - please try again';
            toastType = 'error';
            break;
default:
            // Use the enhanced error message if available and safe
            if (safeError.message && 
                typeof safeError.message === 'string' &&
                safeError.message !== '[object Object]' && 
                safeError.message !== '[object Event]' &&
                safeError.message.trim() !== '') {
              userMessage = safeError.message;
            }
        }
      }
      
      // Final safety check before showing toast
      if (typeof userMessage !== 'string' || 
          userMessage === '[object Event]' || 
          userMessage === '[object Object]' ||
          userMessage.trim() === '') {
        userMessage = 'Connection error - please try again';
        toastType = 'warning';
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
            // Enhanced error message processing with multiple validation layers
            let errorMessage = 'Connection error occurred';
            let toastType = 'error';
            
            // First attempt: Extract safe error message based on error code
            if (data?.code && typeof data.code === 'string') {
              const safeCode = String(data.code).replace(/\[object \w+\]/g, '').trim();
              switch (safeCode) {
                case 'CONNECTION_CLOSED':
                case 'CONNECTION_CLOSED_ERROR':
                  errorMessage = 'Connection unexpectedly closed';
                  toastType = 'warning';
                  break;
                case 'CONNECTION_FAILED':
                case 'CONNECTION_ERROR':
                  errorMessage = 'Failed to establish connection';
                  break;
                case 'CONNECTION_CLOSING_ERROR':
                  errorMessage = 'Connection closing with error';
                  toastType = 'warning';
                  break;
                case 'ERROR_PARSE_FAILED':
                case 'SANITIZED_ERROR':
                  errorMessage = 'Connection problem - please try again';
                  toastType = 'warning';
                  break;
                case 'OBJECT_ERROR':
                case 'TOSTRING_ERROR':
                  errorMessage = 'Connection encountered an issue';
                  toastType = 'warning';
                  break;
                default:
                  // Try to use the error message if it's safe
                  if (data.error && typeof data.error === 'string') {
                    const safeError = String(data.error).replace(/\[object \w+\]/g, '').trim();
                    if (safeError && safeError.length > 0 && !safeError.includes('[object')) {
                      errorMessage = safeError;
                    }
                  }
              }
            } 
            // Second attempt: Direct error message extraction with sanitization
            else if (data?.error && typeof data.error === 'string') {
              const sanitizedError = String(data.error)
                .replace(/\[object \w+\]/g, '')
                .replace(/WebSocket error:\s*\[object \w+\]/gi, 'WebSocket connection failed')
                .trim();
              
              if (sanitizedError && sanitizedError.length > 2 && !sanitizedError.includes('[object')) {
                errorMessage = sanitizedError;
              }
            }
            // Third attempt: Check for nested error properties
            else if (data?.error && typeof data.error === 'object' && data.error !== null) {
              try {
                if (data.error.message && typeof data.error.message === 'string') {
                  const safeMessage = String(data.error.message).replace(/\[object \w+\]/g, '').trim();
                  if (safeMessage && !safeMessage.includes('[object')) {
                    errorMessage = safeMessage;
                  }
                } else if (data.error.code && typeof data.error.code === 'string') {
                  errorMessage = `Connection error (${data.error.code})`;
                }
              } catch (nestedError) {
                console.warn('Error extracting nested error properties:', nestedError);
              }
            }
            
            // Multiple safety validation layers
            if (!errorMessage || 
                typeof errorMessage !== 'string' || 
                errorMessage.includes('[object') ||
                errorMessage.trim() === '' ||
                errorMessage.length < 3) {
              errorMessage = 'Connection error - please check your network';
              toastType = 'warning';
            }
            
            // Final sanitization pass to catch any remaining issues
            errorMessage = String(errorMessage)
              .replace(/\[object \w+\]/g, 'connection issue')
              .replace(/WebSocket error:\s*connection issue/gi, 'Connection failed')
              .trim();
            
            // Ultimate fallback validation
            if (!errorMessage || errorMessage.includes('[object') || errorMessage.length < 3) {
              errorMessage = 'Unable to connect - please try again';
              toastType = 'warning';
            }
            
            // Ensure we have a clean, user-friendly message
            showToast(errorMessage, toastType);
            
            // Create safe data object for callback
            const safeCallbackData = {
...data,
error: errorMessage,
              // Preserve original data for debugging in development
              ...(import.meta.env.MODE === 'development' && {
                originalData: data
              })
            };
            onError?.(safeCallbackData);
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