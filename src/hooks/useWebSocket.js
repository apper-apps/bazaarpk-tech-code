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
      // Advanced error object sanitization
      const sanitizeErrorMessage = (errorObj) => {
        const visited = new WeakSet();
        
        const extractMessage = (obj, depth = 0) => {
          if (depth > 2 || !obj || visited.has(obj)) return null;
          if (typeof obj === 'string' && obj.trim()) return obj.trim();
          if (typeof obj === 'number') return `Error ${obj}`;
          
          if (typeof obj === 'object') {
            visited.add(obj);
            
            // Priority order for error properties
            const props = ['message', 'error', 'description', 'detail', 'reason', 'type', 'code'];
            
            for (const prop of props) {
              try {
                const value = obj[prop];
                const result = extractMessage(value, depth + 1);
                if (result && !result.includes('[object')) return result;
              } catch (e) {
                // Ignore property access errors
              }
            }
            
            // Try toString safely
            try {
              if (obj.toString && typeof obj.toString === 'function') {
                const str = obj.toString();
                if (str && !str.includes('[object') && str !== obj) {
                  return str;
                }
              }
            } catch (e) {
              // Ignore toString errors
            }
          }
          
          return null;
        };
        
        return extractMessage(errorObj);
      };
      
      // Multi-stage error message extraction
      let userMessage = 'Connection failed - will retry automatically';
      
      try {
        // First attempt - direct error analysis
        if (error instanceof Error && error.message) {
          userMessage = error.message;
        } else if (typeof error === 'string' && error.trim()) {
          userMessage = error.trim();
        } else {
          // Deep sanitization attempt
          const sanitized = sanitizeErrorMessage(error);
          if (sanitized) {
            userMessage = sanitized;
          }
        }
        
        // Handle common WebSocket error patterns
        if (error && typeof error === 'object') {
          // Check for specific WebSocket error indicators
          if (error.code === 'WEBSOCKET_ERROR' || error.type === 'error') {
            userMessage = 'Unable to establish WebSocket connection';
          } else if (error.name === 'NetworkError') {
            userMessage = 'Network error - check your connection';
          } else if (error.name === 'SecurityError') {
            userMessage = 'Connection blocked by security policy';
          }
        }
        
        // Validate and sanitize the final message
        if (typeof userMessage !== 'string' || 
            userMessage.includes('[object') || 
            userMessage === '[object Object]' ||
            userMessage.includes('toString') ||
            !userMessage.trim()) {
          userMessage = 'WebSocket connection failed - please try again';
        }
        
        // Ensure reasonable message length
        if (userMessage.length > 150) {
          userMessage = userMessage.substring(0, 150) + '...';
        }
        
      } catch (sanitizationError) {
        console.warn('Error sanitization failed:', sanitizationError);
        userMessage = 'Connection error occurred - will retry automatically';
      }
      
      if (showConnectionToasts) {
        showToast(userMessage, 'error');
      }
      
      // Enhanced error logging with safe serialization
      console.error('WebSocket connection failed:', {
        processedMessage: userMessage,
        errorType: typeof error,
        errorName: error?.constructor?.name,
        errorString: String(error).substring(0, 200), // Limit length
        hasMessage: !!(error?.message),
        url: url
      });
      
      // Additional debug info for object errors
      if (error && typeof error === 'object' && error !== null) {
        try {
          const safeKeys = Object.keys(error).slice(0, 10);
          console.error('Error object keys:', safeKeys);
          
          // Try to identify the problematic structure
          const errorAnalysis = {
            isError: error instanceof Error,
            hasMessage: 'message' in error,
            hasCode: 'code' in error,
            hasType: 'type' in error,
            constructorName: error.constructor?.name
          };
          console.error('Error analysis:', errorAnalysis);
        } catch (e) {
          console.error('Could not analyze error object safely');
        }
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
            // Ultra-comprehensive error message sanitization
            const extractCleanErrorMessage = (errorData) => {
              const visited = new WeakSet();
              
              const deepExtract = (obj, path = [], depth = 0) => {
                if (depth > 3 || !obj || visited.has(obj)) return null;
                
                // Handle direct string values
                if (typeof obj === 'string' && obj.trim()) {
                  const cleaned = obj.trim();
                  if (!cleaned.includes('[object') && cleaned !== '[object Object]') {
                    return cleaned;
                  }
                  return null;
                }
                
                // Handle primitive types
                if (typeof obj === 'number') return `Error ${obj}`;
                if (typeof obj === 'boolean') return null;
                
                // Handle objects
                if (typeof obj === 'object' && obj !== null) {
                  visited.add(obj);
                  
                  // Prioritized property extraction
                  const propertyPriority = [
                    'message', 'error', 'description', 'detail', 'reason', 
                    'statusText', 'responseText', 'data', 'cause', 'type', 'code'
                  ];
                  
                  // Try each property in priority order
                  for (const prop of propertyPriority) {
                    try {
                      if (prop in obj && obj[prop] !== undefined && obj[prop] !== null) {
                        const result = deepExtract(obj[prop], [...path, prop], depth + 1);
                        if (result) return result;
                      }
                    } catch (e) {
                      // Skip inaccessible properties
                    }
                  }
                  
                  // Try safe toString
                  try {
                    if (obj.toString && typeof obj.toString === 'function') {
                      const str = obj.toString();
                      if (str && 
                          typeof str === 'string' && 
                          !str.includes('[object') && 
                          str !== '[object Object]' &&
                          str !== obj) {
                        return str;
                      }
                    }
                  } catch (e) {
                    // Ignore toString errors
                  }
                  
                  // For Error instances, try name + message combination
                  if (obj instanceof Error) {
                    const name = obj.name || 'Error';
                    const msg = obj.message || '';
                    if (msg && !msg.includes('[object')) {
                      return name === 'Error' ? msg : `${name}: ${msg}`;
                    }
                  }
                }
                
                return null;
              };
              
              return deepExtract(errorData);
            };
            
            let errorMessage = 'Connection error occurred';
            
            try {
              // Multi-source error message extraction
              const sources = [
                data.error,
                data.originalMessage,
                data.message,
                data
              ];
              
              for (const source of sources) {
                if (source) {
                  const extracted = extractCleanErrorMessage(source);
                  if (extracted && extracted.length > 0) {
                    errorMessage = extracted;
                    break;
                  }
                }
              }
              
              // Context-specific error messages
              if (data.readyState !== undefined) {
                const stateMessages = {
                  0: 'Connection is being established',
                  1: 'Connection is open',
                  2: 'Connection is closing', 
                  3: 'Connection is closed or failed'
                };
                
                const stateMsg = stateMessages[data.readyState];
                if (stateMsg && data.readyState === 3) {
                  errorMessage = 'Connection lost - attempting to reconnect';
                }
              }
              
              // Final validation and cleaning
              if (typeof errorMessage !== 'string' ||
                  errorMessage.includes('[object') ||
                  errorMessage === '[object Object]' ||
                  errorMessage.includes('toString') ||
                  !errorMessage.trim()) {
                errorMessage = 'WebSocket connection error - please try again';
              }
              
              // Reasonable length limit
              if (errorMessage.length > 120) {
                errorMessage = errorMessage.substring(0, 120) + '...';
              }
              
            } catch (extractionError) {
              console.warn('Advanced error extraction failed:', extractionError);
              errorMessage = 'Connection error - will attempt to reconnect';
            }
            
            setConnectionStatus('error');
            
            if (showConnectionToasts) {
              showToast(errorMessage, 'error');
            }
            
            // Enhanced debug logging
            console.error('WebSocket error status received:', {
              sanitizedMessage: errorMessage,
              dataKeys: data ? Object.keys(data).slice(0, 10) : [],
              readyState: data?.readyState,
              hasError: !!(data?.error),
              errorType: typeof data?.error,
              timestamp: data?.timestamp
            });
            
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