import React from 'react';
import ReactDOM from 'react-dom/client';
import MyApp from '@/renderer/MyApp/index';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
if (import.meta.env.DEV) {
  console.log('Development mode: React app is starting');
} else {
  console.log('Production mode: React app is starting');
}
if (import.meta.env.PROD) {
  console.log('Production mode: React app is running');
} else {
  console.log('Development mode: React app is running');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MyApp />
  </React.StrictMode>
);