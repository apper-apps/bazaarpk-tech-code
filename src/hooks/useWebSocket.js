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
      // Simplified and robust error message extraction
      let userMessage = 'WebSocket connection failed';
      
      try {
        // Handle standard Error instances
        if (error instanceof Error && error.message) {
          userMessage = error.message;
        } 
        // Handle string errors
        else if (typeof error === 'string' && error.trim()) {
          userMessage = error.trim();
        }
        // Handle WebSocket service error objects
        else if (error && typeof error === 'object') {
          if (error.code === 'WEBSOCKET_ERROR') {
            userMessage = 'Unable to establish WebSocket connection';
          } else if (error.name === 'NetworkError') {
            userMessage = 'Network error - check your connection';
          } else if (error.name === 'SecurityError') {
            userMessage = 'Connection blocked by security policy';
          } else if (typeof error.message === 'string') {
            userMessage = error.message;
          }
        }
        
        // Final validation and cleanup
        if (!userMessage || 
            typeof userMessage !== 'string' || 
            userMessage.includes('[object') || 
            userMessage === '[object Object]' ||
            !userMessage.trim()) {
          userMessage = 'WebSocket connection failed - please try again';
        }
        
        // Limit message length for UI display
        if (userMessage.length > 100) {
          userMessage = userMessage.substring(0, 100) + '...';
        }
        
      } catch (sanitizationError) {
        console.warn('Error message extraction failed:', sanitizationError);
        userMessage = 'Connection error occurred - will retry automatically';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, 'error');
      }
      
      // Safe error logging without complex serialization
      console.error('WebSocket connection failed:', {
        message: userMessage,
        errorType: typeof error,
        isError: error instanceof Error,
        url: url
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
            // Robust error message extraction and cleaning
            let errorMessage = 'Connection error occurred';
            
            if (data.error && typeof data.error === 'string') {
              // Clean malformed object references and limit length
              errorMessage = data.error
                .replace(/\[object\s+\w+\]/gi, 'connection error')
                .replace(/WebSocket error error/gi, 'WebSocket connection error')
                .replace(/error error/gi, 'connection error')
                .trim()
                .substring(0, 80);
              
              // Ensure message is meaningful
              if (!errorMessage || errorMessage === 'error' || errorMessage.length < 5) {
                errorMessage = 'WebSocket connection error';
              }
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