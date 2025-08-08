import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

// Global spacebar enabler for all input fields
function enableSpacebar() {
  document.querySelectorAll('input, textarea, [contenteditable]').forEach(el => {
    // Remove existing listeners to prevent duplicates
    el.removeEventListener('keydown', handleSpacebarKeydown);
    
    // Add the spacebar handler
    el.addEventListener('keydown', handleSpacebarKeydown, true);
  });
}

// Spacebar keydown handler
function handleSpacebarKeydown(e) {
  const activeElement = document.activeElement;
  const isTextInput = activeElement.tagName === 'INPUT' || 
                     activeElement.tagName === 'TEXTAREA' || 
                     activeElement.isContentEditable;
  
  if (e.key === ' ' && isTextInput) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    // Allow default spacebar behavior
    return true;
  }
}

// Run on initial load
document.addEventListener('DOMContentLoaded', enableSpacebar);

// Handle dynamically added content
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(() => {
    // Debounce the enableSpacebar calls
    clearTimeout(window.spacebarTimeout);
    window.spacebarTimeout = setTimeout(enableSpacebar, 100);
  });
  
  // Start observing once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable']
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
)