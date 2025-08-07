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
      
      // Simplified error handling - WebSocketService now provides clean error messages
      let userMessage = 'Connection failed - will retry automatically';
      let toastType = 'error';
      
      // Extract error message safely
      if (error instanceof Error) {
        const message = error.message || '';
        
        // Map common error patterns to user-friendly messages
        if (message.includes('Failed to establish')) {
          userMessage = 'Unable to connect - retrying';
          toastType = 'warning';
        } else if (message.includes('closed unexpectedly')) {
          userMessage = 'Connection lost - attempting to reconnect';
          toastType = 'warning';
        } else if (message.includes('security') || message.includes('blocked')) {
          userMessage = 'Connection blocked by security policy';
          toastType = 'error';
        } else if (message && message.trim() !== '') {
          userMessage = message;
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
            // Simplified error handling - WebSocketService provides clean error messages
            let errorMessage = 'Connection error occurred';
            let toastType = 'error';
            
            // Map error codes to user-friendly messages
            if (data?.code) {
              switch (data.code) {
                case 'CONNECTION_CLOSED':
                  errorMessage = 'Connection unexpectedly closed';
                  toastType = 'warning';
                  break;
                case 'CONNECTION_FAILED':
                  errorMessage = 'Failed to establish connection';
                  break;
                case 'CONNECTION_ERROR':
                  errorMessage = 'Connection encountered an error';
                  toastType = 'warning';
                  break;
                case 'CONNECTION_CLOSING_ERROR':
                  errorMessage = 'Connection closing with error';
                  toastType = 'warning';
                  break;
                default:
                  // Use the error message from WebSocketService (already sanitized)
                  if (data.error && typeof data.error === 'string') {
                    errorMessage = data.error;
                  }
              }
            } else if (data?.error && typeof data.error === 'string') {
              errorMessage = data.error;
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