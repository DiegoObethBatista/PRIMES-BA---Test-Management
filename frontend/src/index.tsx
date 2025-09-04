import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Get the root element
const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

// Create React root and render the app
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);