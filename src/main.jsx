import "./index.css"
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
// Clean spacebar functionality fix for text inputs
// Ensures spacebar works properly without interfering with React state management
document.addEventListener('keydown', function(e) {
  // Only handle spacebar in text input fields
  if (e.key === ' ') {
    const activeElement = document.activeElement;
    const isTextInput = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.isContentEditable
    );
    
    // For text inputs, ensure spacebar propagation is not blocked
    if (isTextInput) {
      e.stopImmediatePropagation();
      // Allow default behavior - don't preventDefault
      return true;
    }
  }
}, { capture: true });

// Backup handler to ensure spacebar works in dynamically created inputs
function ensureSpacebarWorks() {
  document.querySelectorAll('input, textarea, [contenteditable]').forEach(input => {
    // Remove any conflicting event handlers
    input.style.pointerEvents = '';
    input.style.userSelect = '';
    
    // Ensure input can receive focus and handle spacebar
    if (!input.hasAttribute('data-spacebar-fixed')) {
      input.setAttribute('data-spacebar-fixed', 'true');
      
      input.addEventListener('keydown', function(e) {
        if (e.key === ' ') {
          // Prevent any parent handlers from interfering
          e.stopImmediatePropagation();
        }
      }, { capture: true });
    }
  });
}

// Apply fix on DOM load and for dynamic content
document.addEventListener('DOMContentLoaded', ensureSpacebarWorks);
window.addEventListener('load', ensureSpacebarWorks);

// Monitor for dynamically added inputs
// Monitor for dynamically added inputs
if (typeof MutationObserver !== 'undefined') {
  // Add MutationObserver for dynamic content
  const observer = new MutationObserver(ensureSpacebarWorks);
  observer.observe(document.body, {
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['contenteditable']
});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);