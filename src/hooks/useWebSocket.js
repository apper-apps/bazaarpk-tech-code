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
export const useWebSocket = (url, options = {}) => {
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
    // Check if WebSocket is intentionally disabled
    const isWebSocketDisabled = import.meta.env.VITE_DISABLE_WEBSOCKET === 'true';
    const defaultUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const finalUrl = url || defaultUrl;
if (isWebSocketDisabled) {
      setConnectionStatus('disabled');
      if (showConnectionToasts && connectionStatus === 'connecting') {
        showToast('WebSocket disabled - app working offline (all features available)', 'info');
      }
      return;
    }

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
await webSocketService.connect(finalUrl);
    } catch (error) {
      // Enhanced error handling for better UX
      const isDevelopment = import.meta.env?.DEV || false;
      const errorCategory = error?.category || 'unknown';
      const isServerUnavailable = errorCategory === 'server_unavailable' || errorCategory === 'development';
      
// Enhanced toast messaging with better development context
      if (showConnectionToasts && connectionStatus === 'connecting') {
        let message = 'App running offline - all features available';
        
        if (isDevelopment && errorCategory === 'disabled') {
          message = 'WebSocket disabled - app working offline (all features available)';
        } else if (isDevelopment && errorCategory === 'development') {
          message = 'Development mode - WebSocket server not running (working offline)';
        } else if (isDevelopment && errorCategory === 'server_unavailable') {
          message = 'Development mode - WebSocket server unavailable (working offline)';
        } else if (isServerUnavailable) {
          message = 'Working offline - all features available';
        }
        
        showToast(message, 'info');
      }

      // Enhanced development logging with actionable guidance
      if (isDevelopment && errorCategory === 'disabled') {
        console.info('📡 WebSocket disabled via VITE_DISABLE_WEBSOCKET=true');
      } else if (isDevelopment && !finalUrl) {
        console.info('📡 WebSocket disabled - set VITE_WS_URL in .env to enable');
      } else if (isDevelopment && (isServerUnavailable || errorCategory === 'development')) {
        console.info(`📡 WebSocket server unavailable: ${finalUrl || 'No URL configured'}\n💡 Start WebSocket server or configure VITE_WS_URL for remote connection`);
      }
      
      // Enhanced connection status with more specific states
      const newStatus = errorCategory === 'disabled' ? 'disabled' : 
                       errorCategory === 'development' ? 'development' :
                       isServerUnavailable ? 'server_unavailable' : 'disconnected';
      setConnectionStatus(newStatus);
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
    // Enhanced service availability check
    if (!webSocketService || typeof webSocketService.on !== 'function') {
      console.warn('📡 WebSocket service not available, connection status will remain disconnected');
      setConnectionStatus('service_unavailable');
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
          case 'offline':
          case 'error':
          case 'parse_error':
          case 'invalid':
          case 'disabled':
          case 'development':
          case 'server_unavailable':
            // Enhanced error handling with comprehensive development support
            const isDevelopment = import.meta.env?.DEV || false;
            const errorCategory = data?.category || 'network';
            let shouldShowToast = false;
            
            // Enhanced error message extraction and improvement
            let errorMessage = data?.message || 'App working offline';
            if (typeof data?.error === 'string') {
              errorMessage = data.error;
            } else if (data?.error?.message) {
              errorMessage = data.error.message;
            }
            
            // Comprehensive context-aware messaging
            if (errorCategory === 'disabled') {
              errorMessage = 'WebSocket disabled - app working offline (all features available)';
            } else if (errorCategory === 'development') {
              errorMessage = 'Development mode - WebSocket server not running (working offline)';
            } else if (errorCategory === 'server_unavailable') {
              errorMessage = isDevelopment 
                ? 'Development mode - WebSocket server unavailable (working offline)' 
                : 'Working offline - all features available';
            } else if (errorMessage.includes('localhost:8080') && isDevelopment) {
              errorMessage = 'Development mode - WebSocket server not running on localhost:8080 (working offline)';
            } else if (errorMessage.includes('localhost') && isDevelopment) {
              errorMessage = 'Development mode - local WebSocket server unavailable (working offline)';
            } else if (errorMessage.includes('Connection lost') || errorMessage.includes('interrupted')) {
              errorMessage = 'Working offline - all features available';
            } else if (errorMessage.includes('WebSocket error') && isDevelopment) {
              errorMessage = 'Development mode - WebSocket server connection failed (working offline)';
            } else if (errorMessage.includes('Connection lost (ws://localhost')) {
              errorMessage = isDevelopment 
                ? 'Development mode - local WebSocket server not running (working offline)'
                : 'Working offline - all features available';
            }
            
            // Enhanced toast display logic with better development experience
            const isTransitioningFromConnected = connectionStatus === 'connected';
            const isFirstError = connectionStatus === 'connecting';
            const isDevelopmentError = isDevelopment && (errorCategory === 'development' || errorCategory === 'server_unavailable' || errorCategory === 'disabled');
            
            if (data?.status === 'error' && isTransitioningFromConnected && !isDevelopmentError) {
              shouldShowToast = true;
            } else if (data?.status === 'offline' && isFirstError && !isDevelopment) {
              shouldShowToast = true;
            } else if (isDevelopmentError && isFirstError) {
              // Show informative toast for development issues
              shouldShowToast = true;
            }
            
            if (shouldShowToast) {
              const toastType = (data?.status === 'error' && !isDevelopmentError) ? 'warning' : 'info';
              showToast(errorMessage, toastType);
            }
            
            // Enhanced error callback with comprehensive error context
            onError?.({
              status: data?.status || 'offline',
              message: errorMessage,
              category: errorCategory,
              canRetry: data?.canRetry ?? (errorCategory !== 'disabled'),
              isDevelopment: isDevelopment,
              isLocalhost: data?.isLocalhost ?? false,
              serverAvailable: data?.serverAvailable ?? true,
              timestamp: new Date().toISOString(),
              originalError: data?.error,
              suggestion: data?.suggestion || (isDevelopment ? 'Start WebSocket server or configure VITE_WS_URL' : 'Check internet connection')
            });
            break;
        }
      }
    });
    
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [showConnectionToasts, showToast, onConnect, onDisconnect, onError, connectionStatus]);

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
if (connectionStatus === 'disconnected' && isOnline && 
          connectionStatus !== 'server_unavailable' && connectionStatus !== 'disabled') {
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
    isConnecting: connectionStatus === 'connecting',
    isDisabled: connectionStatus === 'disabled'
  };
};

export default useWebSocket;