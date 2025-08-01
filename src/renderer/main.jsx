import React from 'react';
import ReactDOM from 'react-dom/client';
import MyApp from '@/renderer/MyApp/index';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MyApp />
  </React.StrictMode>
);