import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import webSocketService from "@/services/api/WebSocketService";
import { Error } from "@/components/ui/Error";

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
      if (showConnectionToasts) {
        showToast('Cannot connect - device is offline', 'warning');
      }
      return;
    }

    try {
      // Defensive check: ensure webSocketService is available
      if (!webSocketService || typeof webSocketService.connect !== 'function') {
        throw new Error('WebSocket service is not available');
      }
      await webSocketService.connect(url);
    } catch (error) {
      // Streamlined error handling for development
      const isDevelopment = import.meta.env?.DEV || false;
      const isServerDown = error?.category === 'server_unavailable';
      
      // Only show meaningful toasts, reduce spam
      if (showConnectionToasts && connectionStatus === 'connecting') {
        const message = isServerDown ? 'Running offline - all features available' : 'App running offline';
        showToast(message, 'info');
      }

      // Minimal development logging
      if (isDevelopment && isServerDown) {
        console.info(`WebSocket offline: ${url} unavailable`);
      }
      
      // Set appropriate connection status
      setConnectionStatus(isServerDown ? 'server_unavailable' : 'disconnected');
    }
  }, [isOnline, showConnectionToasts, showToast, url, connectionStatus]);

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
          case 'server_unavailable':
            // Minimal error handling to reduce user disruption
            const isDevelopment = import.meta.env?.DEV || false;
            let shouldShowToast = false;
            let errorMessage = 'App running offline';
            
            // Only show toast for meaningful state transitions
            if (data?.status === 'error' && connectionStatus === 'connected') {
              errorMessage = 'Connection lost - now offline';
              shouldShowToast = true;
            }
            
            if (shouldShowToast) {
              showToast(errorMessage, 'info');
            }
            
            // Simplified error callback
            onError?.({
              status: data?.status || 'offline',
              message: errorMessage,
              canRetry: false,
              timestamp: new Date().toISOString()
            });
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

// Periodic connection check with server availability awareness
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      // Only attempt reconnection if we're not in server_unavailable state
      if (connectionStatus === 'disconnected' && isOnline && connectionStatus !== 'server_unavailable') {
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