import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService } from '@/services/api/WebSocketService';
import { useToast } from '@/hooks/useToast';

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
            if (safeError.message && safeError.message !== '[object Object]' && safeError.message !== '[object Event]') {
              userMessage = safeError.message;
            }
        }
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
            // Enhanced error message based on error details with serialization safety
            let errorMessage = 'Connection error occurred';
            let toastType = 'error';
            
            // Safely extract error information with comprehensive fallbacks
            try {
              if (data?.code) {
                switch (data.code) {
                  case 'CONNECTION_CLOSED':
                    errorMessage = 'Connection unexpectedly closed';
                    toastType = 'warning';
                    break;
                  case 'CONNECTION_ERROR':
                    errorMessage = 'Failed to establish connection';
                    break;
                  case 'WEBSOCKET_ERROR':
                    errorMessage = 'Network communication error';
                    toastType = 'warning';
                    break;
                  case 'UNKNOWN_ERROR':
                  case 'ERROR_PARSE_FAILED':
                    errorMessage = 'Connection problem - please try again';
                    toastType = 'warning';
                    break;
                  default:
                    // Safely use provided error message
                    if (data.error && 
                        typeof data.error === 'string' && 
                        data.error !== '[object Object]' && 
                        data.error !== '[object Event]') {
                      errorMessage = data.error;
                    }
                }
              } else if (data?.error) {
                // Handle various error formats safely
                if (typeof data.error === 'string' && 
                    data.error !== '[object Object]' && 
                    data.error !== '[object Event]') {
                  errorMessage = data.error;
                } else if (data.error?.message && typeof data.error.message === 'string') {
                  errorMessage = data.error.message;
                } else {
                  errorMessage = 'Network connection error';
                }
              }
            } catch (parseError) {
              // Ultimate fallback if error processing fails
              errorMessage = 'Connection error - please check your network';
              toastType = 'warning';
              console.warn('Error message parsing failed:', parseError);
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