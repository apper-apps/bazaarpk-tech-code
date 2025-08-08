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
      // Enhanced error handling with cleaner user feedback
      let userMessage = 'Working in offline mode';
      let toastType = 'info';
      let shouldRetry = true;
      let isServerDown = false;
      
      // Categorize errors for appropriate user feedback
      if (error?.category === 'server_unavailable' || error?.code === 'SERVER_DOWN') {
        userMessage = 'Server unavailable - all features work offline';
        toastType = 'info';
        shouldRetry = false;
        isServerDown = true;
      } else if (error?.category === 'connection' || error?.code === 'CONNECTION_FAILED') {
        userMessage = 'Working in offline mode';
        toastType = 'info';
        shouldRetry = true;
      } else if (error?.category === 'timeout') {
        userMessage = 'Connection timeout - offline mode active';
        toastType = 'info';
        shouldRetry = true;
      } else {
        // Generic handling with cleaner user messaging
        userMessage = 'Working in offline mode';
        toastType = 'info';
        shouldRetry = true;
        
        // Check for specific network errors
        if (error?.message) {
          const errorMsg = error.message.toLowerCase();
          if (errorMsg.includes('econnrefused') || errorMsg.includes('connection refused')) {
            isServerDown = true;
            shouldRetry = false;
            userMessage = 'Server unavailable - offline mode active';
          } else if (errorMsg.includes('timeout') || errorMsg.includes('etimedout')) {
            userMessage = 'Connection slow - working offline';
            toastType = 'warning';
          }
        }
      }
      
if (showConnectionToasts) {
        showToast(userMessage, toastType);
      }

      // Simplified error logging to reduce console noise
      const isDevelopment = import.meta.env?.DEV || false;
      const logLevel = isDevelopment ? 'warn' : 'info';
      console[logLevel]('WebSocket connection unavailable:', {
        status: isServerDown ? 'server_down' : 'connection_failed',
        url: url,
        canRetry: shouldRetry,
        timestamp: new Date().toISOString()
      });
      
      // Set appropriate connection status
      if (isServerDown) {
        setConnectionStatus('server_unavailable');
      } else {
        setConnectionStatus('disconnected');
      }
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
          case 'server_unavailable':
            // Simplified error handling with consistent user messaging
            let errorMessage = 'Working in offline mode';
            let toastType = 'info';
            let shouldShowToast = false; // Reduce toast frequency for connection errors
            
            // Only show toast for significant status changes
            if (data?.status === 'server_unavailable' && connectionStatus !== 'server_unavailable') {
              errorMessage = 'Server unavailable - offline mode active';
              toastType = 'info';
              shouldShowToast = true;
            } else if (data?.status === 'error' && connectionStatus === 'connected') {
              errorMessage = 'Connection lost - working offline';
              toastType = 'warning';
              shouldShowToast = true;
            }
// Simplified logging for development debugging only
            const isDevelopment = import.meta.env?.DEV || false;
            if (isDevelopment) {
              console.info('WebSocket status change:', {
                from: connectionStatus,
                to: data?.status || 'unknown',
                url: url,
                timestamp: new Date().toISOString()
              });
            }
            
            if (shouldShowToast) {
              showToast(errorMessage, toastType);
            }
            
            // Clean error callback with minimal data
            try {
              onError?.({
                status: data?.status || 'error',
                message: errorMessage,
                canRetry: data?.status !== 'server_unavailable',
                timestamp: new Date().toISOString()
              });
} catch (callbackError) {
              const isDevelopment = import.meta.env?.DEV || false;
              if (isDevelopment) {
                console.warn('Error callback failed:', callbackError.message);
              }
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

// Periodic connection check with server availability awareness
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      // Only attempt reconnection if we're not in server_unavailable state
      if (connectionStatus === 'disconnected' && isOnline && connectionStatus !== 'server_unavailable') {
        console.log('Periodic connection check - attempting reconnect');
        connect();
      } else if (connectionStatus === 'server_unavailable') {
        console.log('Server unavailable - skipping reconnection attempt');
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