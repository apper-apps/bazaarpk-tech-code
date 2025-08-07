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
      
      // Enhanced error handling with better user messaging
      let userMessage = 'Connection failed - will retry automatically';
      let toastType = 'error';
      
      if (error?.code) {
        switch (error.code) {
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
            userMessage = 'Connection blocked by security policy';
            toastType = 'error';
            break;
          default:
            // Use the enhanced error message if available
            userMessage = error.message || userMessage;
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
            // Enhanced error message based on error details
            let errorMessage = 'Connection error occurred';
            let toastType = 'error';
            
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
                default:
                  errorMessage = data.error || errorMessage;
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