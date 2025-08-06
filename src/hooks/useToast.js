import { toast } from "react-toastify";
import React from "react";

export const useToast = () => {
  const showToast = (message, type = "info", debugInfo = null) => {
    // Enhanced logging for debugging
    if (debugInfo || type === "error") {
      console.group(`🔔 Toast Notification: ${type.toUpperCase()}`);
      console.log('Message:', message);
      console.log('Type:', type);
      console.log('Timestamp:', new Date().toISOString());
      
      if (debugInfo) {
        console.log('Debug Info:', debugInfo);
      }
      
      // Log error context for admin-related errors
      if (message?.includes('admin') || message?.includes('mask') || debugInfo?.category === 'admin') {
        console.log('Admin Error Context:', {
          currentRoute: window.location.pathname,
          adminState: document.body.classList.contains('admin-accessing'),
          overlayCount: document.querySelectorAll('.overlay-mask, .modal-backdrop').length,
          adminElementCount: document.querySelectorAll('.admin-dashboard').length
        });
      }
      
      console.groupEnd();
      
// Fire debug event for error tracking
      if (type === "error" && typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new window.CustomEvent('admin_debug_log', {
          detail: {
            type: 'toast_error',
            severity: 'medium',
            data: { message, debugInfo }
          }
        }));
      }
    }
    
    const options = {
      position: "top-right",
      autoClose: type === "error" ? 5000 : 3000, // Longer duration for errors
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      case "warning":
        toast.warning(message, options);
        break;
      case "info":
      default:
        toast.info(message, options);
        break;
    }
  };

  // Enhanced showToast with debug capabilities
  const showDebugToast = (message, type = "info", debugInfo = {}) => {
    showToast(message, type, debugInfo);
  };

  return { 
    showToast, 
    showDebugToast 
  };
};