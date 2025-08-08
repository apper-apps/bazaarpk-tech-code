import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

// Nuclear fallback solution for spacebar functionality
// This is the most aggressive approach to ensure spaces work in all text inputs
document.addEventListener('keydown', function(e) {
  const active = document.activeElement;
  if (e.key === ' ' && (active.tagName === 'INPUT' || 
                       active.tagName === 'TEXTAREA' || 
                       active.isContentEditable)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    
    const start = active.selectionStart;
    const end = active.selectionEnd;
    const value = active.value || active.innerText;
    
    const newValue = value.substring(0, start) + ' ' + value.substring(end);
    
    if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') {
      active.value = newValue;
    } else {
      active.innerText = newValue;
    }
    
    // Set cursor position
    active.selectionStart = active.selectionEnd = start + 1;
    
    // Trigger input event for React state updates
    const inputEvent = new Event('input', { bubbles: true });
    active.dispatchEvent(inputEvent);
  }
}, true);

// Global spacebar enabler for all input fields (enhanced backup)
function enableSpacebar() {
  document.querySelectorAll('input, textarea, [contenteditable]').forEach(el => {
    // Remove existing listeners to prevent duplicates
    el.removeEventListener('keydown', handleSpacebarKeydown);
    
    // Add the spacebar handler
    el.addEventListener('keydown', handleSpacebarKeydown, true);
  });
}

// Enhanced spacebar keydown handler
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