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
      // Enhanced error processing with comprehensive fallback handling
      let userMessage = 'Connection issue occurred';
      let toastType = 'error';
      let shouldShowToast = showConnectionToasts;
      
      try {
        // Handle various error object formats
        if (error && typeof error === 'object') {
          // Handle structured error objects (from WebSocketService)
          if (error.message) {
            userMessage = error.message;
            
            // Add suggestion if available and space permits
            if (error.suggestion && error.message.length < 50) {
              userMessage += ` - ${error.suggestion}`;
            }
            
            // Adjust toast behavior based on error category
            if (error.category === 'closing' || error.category === 'timeout') {
              toastType = 'warning';
            } else if (error.category === 'auth') {
              toastType = 'error';
              shouldShowToast = true; // Always show auth errors
            } else if (error.category === 'server') {
              // Don't spam server error toasts
              shouldShowToast = showConnectionToasts && Math.random() > 0.7;
            } else if (error.category === 'connection') {
              toastType = 'warning';
            }
          }
          // Handle malformed error objects that might contain nested error data
          else if (error.error && error.error.message) {
            userMessage = error.error.message;
          }
          // Handle error objects with stack property but no message
          else if (error.stack && Array.isArray(error.stack) && error.stack.length === 0) {
            userMessage = 'Connection unavailable';
            toastType = 'warning';
          }
          // Handle serialized error objects
          else if (typeof error === 'object' && Object.keys(error).length > 0) {
            userMessage = JSON.stringify(error).includes('Connection unavailable') 
              ? 'Connection unavailable' 
              : 'Connection error occurred';
          }
        } 
        // Handle Error instances
        else if (error instanceof Error && error.message) {
          userMessage = error.message.substring(0, 80);
        } 
        // Handle string errors
        else if (typeof error === 'string') {
          userMessage = error.substring(0, 80);
        }
        // Handle null/undefined errors
        else if (!error) {
          userMessage = 'Unknown connection error';
        }
      } catch (processingError) {
        // Fallback if error processing itself fails
        userMessage = 'Connection processing error';
        console.warn('Error processing WebSocket error:', processingError);
      }
      
      // Clean up technical jargon for user-friendly messages
      userMessage = userMessage
        .replace(/WebSocket/gi, 'Connection')
        .replace(/ECONNREFUSED/gi, 'Server unavailable')
        .replace(/ETIMEDOUT/gi, 'Connection timeout')
        .replace(/Connection unavailable/gi, 'Connection unavailable')
        .replace(/readyState/gi, 'connection status')
        .replace(/\[object Object\]/gi, 'Connection error');
      
      // Ensure message length is reasonable
      if (userMessage.length > 100) {
        userMessage = userMessage.substring(0, 97) + '...';
      }
      
      if (shouldShowToast) {
        showToast(userMessage, toastType);
      }
      
      console.error('WebSocket connection failed:', {
        originalError: error,
        processedMessage: userMessage,
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
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
            // Simple error message extraction - never serialize objects
            let errorMessage = 'Connection error';
            
            // Only extract simple string properties
            if (data?.error && typeof data.error === 'string') {
              errorMessage = data.error.substring(0, 50);
            } else if (data?.code === 'WEBSOCKET_ERROR') {
              errorMessage = 'Service unavailable';
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