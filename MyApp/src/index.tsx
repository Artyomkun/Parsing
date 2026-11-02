import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '..';

const root = document.getElementById('root');
if (!root) {throw new Error('Root element not found');}
const isProduction = process.env.NODE_ENV === 'production';
console.log(`${isProduction ? 'Production' : 'Development'} mode: React app is starting`);

ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
