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
      // Bulletproof error message extraction - prevents "[object Object]"
      let userMessage = 'Connection failed - will retry automatically';
      
      // Strict string conversion with fallback chain
      if (error instanceof Error) {
        userMessage = error.message || 'WebSocket connection error';
      } else if (typeof error === 'string') {
        userMessage = error;
      } else if (error && typeof error === 'object') {
        // Extract from common error properties, convert immediately to string
        const errorProps = [
          error.message,
          error.error,
          error.type,
          error.code,
          error.reason
        ].filter(Boolean).map(prop => String(prop));
        
        if (errorProps.length > 0) {
          userMessage = errorProps[0];
        }
      } else if (error) {
        // Handle any other error types
        userMessage = String(error);
      }
      
      // Final safety check - prevent object serialization artifacts
      if (userMessage.includes('[object') || userMessage === '[object Object]') {
        userMessage = 'WebSocket connection failed - please try again';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, 'error');
      }
      
      console.error('WebSocket connection failed:', {
        originalError: error,
        errorType: typeof error,
        processedMessage: userMessage
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
if (data.code !== 1000) { // Not a normal closure
              showToast('Connection lost - attempting to reconnect', 'warning');
            }
            onDisconnect?.(data);
            break;
case 'error':
            // Bulletproof error message extraction for WebSocket errors
            let errorMessage = 'Connection error occurred';
            
            if (data.error) {
              if (typeof data.error === 'string') {
                errorMessage = data.error;
              } else if (data.error instanceof Error) {
                errorMessage = data.error.message || 'WebSocket error';
              } else if (typeof data.error === 'object') {
                // Extract from multiple properties, ensure string conversion
                const errorProps = [
                  data.error.message,
                  data.error.error,
                  data.error.type,
                  data.error.code,
                  data.error.reason
                ].filter(Boolean).map(prop => String(prop));
                
                if (errorProps.length > 0) {
                  errorMessage = errorProps[0];
                }
              } else {
                // Handle any other error types
                errorMessage = String(data.error);
              }
            }
            
            // Prevent object serialization artifacts
            if (errorMessage.includes('[object') || errorMessage === '[object Object]') {
              errorMessage = 'WebSocket connection error - please try again';
            }
            
            setConnectionStatus('error');
            
            if (showConnectionToasts) {
              showToast(errorMessage, 'error');
            }
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