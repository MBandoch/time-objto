import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import './themes.css';
import App from './App.jsx';
import { MiniWidget } from './views/MiniWidget.jsx';

// Em qual janela estamos? A janela flutuante tem label "widget".
function currentWindowLabel() {
  try {
    return window.__TAURI_INTERNALS__?.metadata?.currentWindow?.label || 'main';
  } catch {
    return 'main';
  }
}

const isWidgetWindow = currentWindowLabel() === 'widget';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isWidgetWindow ? <MiniWidget /> : <App />}
  </StrictMode>
);
