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
      // Enhanced error handling with server availability distinction
      let userMessage = 'Working in offline mode';
      let toastType = 'info';
      let shouldRetry = true;
      
      // Categorize errors for appropriate user feedback
      if (error?.category === 'server_unavailable' || error?.code === 'SERVER_DOWN') {
        userMessage = 'Server is currently down - all features available offline';
        toastType = 'info';
        shouldRetry = false; // Don't retry if server is confirmed down
      } else if (error?.category === 'connection' || error?.code === 'CONNECTION_FAILED') {
        userMessage = 'Connection issue - working in offline mode';
        toastType = 'warning';
        shouldRetry = true;
      } else if (error?.category === 'timeout') {
        userMessage = 'Connection timeout - trying offline mode';
        toastType = 'warning';
        shouldRetry = true;
      } else {
        // Generic handling for unknown errors
        if (error?.message && typeof error.message === 'string') {
          userMessage = error.message;
        } else if (typeof error === 'string') {
          userMessage = error;
        } else if (error instanceof Error) {
          userMessage = error.message || 'Connection unavailable';
        }
        
        // Clean technical jargon and ensure reasonable length
        userMessage = userMessage
          .replace(/WebSocket/gi, 'Real-time updates')
          .replace(/ECONNREFUSED|Connection refused/gi, 'Service unavailable')
          .replace(/ETIMEDOUT/gi, 'Connection timeout')
          .replace(/failed to connect/gi, 'unavailable')
          .substring(0, 70);
          
        if (!userMessage.includes('offline') && !userMessage.includes('unavailable')) {
          userMessage += ' - working offline';
        }
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, toastType);
      }

      // Safe error logging with object serialization protection
      const safeErrorLog = {
        category: error?.category || 'unknown',
        canRetry: shouldRetry,
        url: url,
        timestamp: new Date().toISOString()
      };
      
      // Extract error message safely without "[object Object]"
      if (error?.message && typeof error.message === 'string') {
        safeErrorLog.error = error.message;
      } else if (typeof error === 'string') {
        safeErrorLog.error = error;
      } else if (error instanceof Error) {
        safeErrorLog.error = error.message || error.name || 'Connection Error';
      } else if (error && typeof error === 'object') {
        safeErrorLog.error = error.reason || error.statusText || error.type || 'Connection failed';
      } else {
        safeErrorLog.error = 'Unknown connection error';
      }
      
      console.error('WebSocket connection failed:', safeErrorLog);
      
      // Store retry status for reconnection logic
      if (!shouldRetry) {
        // Mark connection as permanently failed to prevent reconnection attempts
        setConnectionStatus('server_unavailable');
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
            // Enhanced error message handling for different error types
            let errorMessage = 'Working offline';
            let toastType = 'info';
            let shouldShowToast = true;
            
            // Categorize and handle different error types appropriately
            try {
              if (data?.status === 'server_unavailable' || data?.type === 'server_unavailable') {
                errorMessage = 'Server unavailable - all features work offline';
                toastType = 'info';
                shouldShowToast = true;
              } else if (data?.status === 'parse_error') {
                errorMessage = 'Connection unstable - working in offline mode';
                toastType = 'warning';
              } else if (data?.type === 'invalid') {
                errorMessage = 'Data sync issue - offline mode active';
                shouldShowToast = false; // Don't spam with parsing errors
              } else if (data?.code === 'WEBSOCKET_ERROR') {
                errorMessage = 'Real-time updates unavailable - offline mode active';
                toastType = 'info';
              } else {
                // Generic connection error
                errorMessage = 'Connection lost - working offline';
                toastType = 'warning';
              }
              
            } catch (msgError) {
              console.warn('Error processing WebSocket status:', msgError);
              errorMessage = 'Working in offline mode';
              toastType = 'info';
            }
            
            // Safe error logging without object serialization issues
            const safeLogData = {
              status: data?.status || 'unknown',
              type: data?.type || 'unknown', 
              code: data?.code || null,
              hasError: !!data?.error,
              timestamp: new Date().toISOString(),
              url: url
            };
            
            // Extract error message safely
            if (data?.error) {
              if (typeof data.error === 'string') {
                safeLogData.errorMessage = data.error.substring(0, 100);
              } else if (data.error?.message) {
                safeLogData.errorMessage = data.error.message.substring(0, 100);
              } else {
                safeLogData.errorMessage = 'Error object provided but no readable message';
              }
            }
            
            console.error('WebSocket Hook Error:', safeLogData);
            
            if (shouldShowToast) {
              showToast(errorMessage, toastType);
            }
            
            // Safe error callback invocation with sanitized data
            try {
              const callbackData = {
                status: data?.status,
                type: data?.type,
                code: data?.code,
                message: errorMessage,
                timestamp: new Date().toISOString(),
                canRetry: data?.status !== 'server_unavailable'
              };
              onError?.(callbackData);
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