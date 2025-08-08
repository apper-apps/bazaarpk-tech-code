import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/useToast";
import webSocketService from "@/services/api/WebSocketService";
import { Error as ErrorComponent } from "@/components/ui/Error";

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
      // Extract clean error message with comprehensive type checking
      let userMessage = 'Connection failed - will retry automatically';
      
      // Handle Error instances
      if (error instanceof Error) {
        userMessage = error.message || 'WebSocket connection error';
      } 
      // Handle DOMException separately
      else if (typeof window !== 'undefined' && window.DOMException && error instanceof window.DOMException) {
        userMessage = `Network error: ${error.message || 'Connection failed'}`;
      }
      // Handle string errors
      else if (typeof error === 'string') {
        userMessage = error;
      }
      // Handle object errors with safe property access
      else if (error && typeof error === 'object') {
        userMessage = error.message || error.error || error.type || 'WebSocket connection error';
      }
      
      // Comprehensive sanitization to prevent object leakage
      userMessage = String(userMessage)
        .replace(/\[object\s+\w+\]/gi, 'WebSocket connection error')
        .replace(/^\s*error\s*error/i, 'WebSocket error')
        .replace(/\s{2,}/g, ' ')
        .trim();
      
      // Fallback for empty messages
      if (!userMessage) {
        userMessage = 'WebSocket connection failed';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, 'error');
      }
      
      // Safe error logging
      console.error('WebSocket connection failed:', {
        originalErrorType: typeof error,
        errorConstructor: error?.constructor?.name || 'Unknown',
        cleanMessage: userMessage,
        timestamp: new Date().toISOString()
      });
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
            // Handle error case with comprehensive message cleaning
            let safeError = 'Connection error occurred';
            
            if (data.error) {
              if (typeof data.error === 'string') {
                safeError = data.error;
              } else if (data.error instanceof Error) {
                safeError = data.error.message || 'WebSocket error';
              } else if (typeof data.error === 'object' && data.error !== null) {
                // Safe property access for objects
                safeError = data.error.message || 
                           data.error.type || 
                           data.error.code ||
                           'WebSocket connection error';
              }
            }
            
            // Comprehensive cleaning of error messages
            const cleanError = String(safeError)
              .replace(/\[object\s+\w+\]/gi, 'WebSocket connection error')
              .replace(/^\s*error\s*error/i, 'WebSocket error')
              .replace(/\s{2,}/g, ' ')
              .trim();
              
            setConnectionStatus('error');
            
            // Ensure we have a valid error message
            const finalError = cleanError || 'Connection error occurred';
            
            if (showConnectionToasts) {
              showToast(finalError, 'error');
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