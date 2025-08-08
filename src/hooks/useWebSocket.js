import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import webSocketService from "@/services/api/WebSocketService";
import { Error } from "@/components/ui/Error";

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
      let userMessage = 'Connection failed - will retry automatically';
      let toastType = 'error';
      
      // Comprehensive error sanitization with multiple layers
      const sanitizeErrorMessage = (rawError) => {
        // Layer 1: Handle different error types
        if (rawError instanceof Error) {
          return rawError.message || 'WebSocket connection error';
        }
        
        // Layer 2: Handle Event objects (should not occur with fixed WebSocketService)
        if (rawError instanceof Event) {
          return 'WebSocket connection error - server unreachable';
        }
        
        // Layer 3: Handle any other objects
        if (rawError && typeof rawError === 'object') {
          // Try to extract meaningful properties
          if (rawError.message && typeof rawError.message === 'string') {
            return rawError.message;
          }
          if (rawError.error && typeof rawError.error === 'string') {
            return rawError.error;
          }
          if (rawError.description && typeof rawError.description === 'string') {
            return rawError.description;
          }
          // Default for unrecognized objects
          return 'WebSocket connection error - please check your network';
        }
        
        // Layer 4: Handle primitive values
        if (rawError !== null && rawError !== undefined) {
          const errorStr = String(rawError).trim();
          // Check for object serialization artifacts
          if (errorStr.includes('[object') || 
              errorStr === '[object Object]' || 
              errorStr === '[object Event]' ||
              errorStr.startsWith('[object ')) {
            return 'WebSocket connection error - network issue detected';
          }
          // Return sanitized string if it's meaningful
          if (errorStr.length > 0 && errorStr !== 'undefined' && errorStr !== 'null') {
            return errorStr;
          }
        }
        
        // Layer 5: Final fallback
        return 'WebSocket connection failed - please try again';
      };
      
      // Apply sanitization
      userMessage = sanitizeErrorMessage(error);
      
      // Additional validation to ensure no artifacts remain
      if (!userMessage || 
          userMessage.trim() === '' || 
          userMessage.includes('[object') ||
          userMessage === 'undefined' ||
          userMessage === 'null') {
        userMessage = 'WebSocket connection failed - will retry automatically';
      }

      // Log the original error for debugging while showing clean message to user
      console.error('WebSocket connection error (sanitized for user):', {
        originalError: error,
        sanitizedMessage: userMessage,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });

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
            let errorMessage = 'Connection error occurred';
            
            // Enhanced error message sanitization
            const sanitizeToastError = (errorData) => {
              // Check data.error first
              if (errorData?.error && typeof errorData.error === 'string') {
                const sanitized = errorData.error.trim();
                if (sanitized.length > 0 && 
                    !sanitized.includes('[object') && 
                    sanitized !== 'undefined' && 
                    sanitized !== 'null') {
                  return sanitized;
                }
              }
              
              // Check data.message as fallback
              if (errorData?.message && typeof errorData.message === 'string') {
                const sanitized = errorData.message.trim();
                if (sanitized.length > 0 && !sanitized.includes('[object')) {
                  return sanitized;
                }
              }
              
              // Check if entire data object might be stringified incorrectly
              if (errorData && typeof errorData === 'object') {
                const dataStr = String(errorData);
                if (dataStr.includes('[object')) {
                  return 'WebSocket connection error - please check your network';
                }
              }
              
              return 'Connection error occurred - please try again';
            };
            
            errorMessage = sanitizeToastError(data);
            
            // Final safety check
            if (errorMessage.includes('[object') || !errorMessage.trim()) {
              errorMessage = 'WebSocket connection error - please check your network';
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