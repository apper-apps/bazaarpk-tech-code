import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import webSocketService from '@/services/api/WebSocketService'

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
      
      console.error('WebSocket connection failed:', {
        error: error?.message || String(error),
        category: error?.category,
        canRetry: error?.canRetry
      });
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
            // Enhanced error message handling with validation
            let errorMessage = 'Connection error';
            let shouldShowToast = true;
            
            // Safe error message extraction with multiple fallbacks
            try {
              if (data?.status === 'parse_error') {
                errorMessage = 'Message format error - connection may be unstable';
              } else if (data?.type === 'invalid') {
                errorMessage = 'Received invalid data format';
                shouldShowToast = false; // Don't spam user with parsing errors
              } else if (typeof data?.error === 'string' && data.error.length > 0) {
                errorMessage = data.error.substring(0, 50);
              } else if (data?.code === 'WEBSOCKET_ERROR') {
                errorMessage = 'Service unavailable';
              } else if (data?.message && typeof data.message === 'string') {
                errorMessage = data.message.substring(0, 50);
              }
              
              // Clean up technical jargon for user-friendly messages
              errorMessage = errorMessage
                .replace(/JSON.parse|SyntaxError|parse_error/gi, 'format error')
                .replace(/WebSocket/gi, 'Connection')
                .trim();
                
            } catch (msgError) {
              console.warn('Error processing WebSocket error message:', msgError);
              errorMessage = 'Connection issue detected';
            }
            
            if (shouldShowToast) {
              showToast(errorMessage, 'error');
            }
            
            // Safe error callback invocation
            try {
              onError?.(data);
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