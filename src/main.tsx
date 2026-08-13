import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './lib/theme';
import './index.css';

// Prevent noisy console popups from benign Vite HMR WebSocket connection failures in sandboxed environment
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    (event.reason.message?.includes('WebSocket closed') ||
     event.reason?.toString?.().includes('WebSocket'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

