import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3200,
        style: {
          borderRadius: '14px',
          background: 'rgba(15, 23, 42, 0.92)',
          color: '#f8fafc',
          border: '1px solid rgba(148, 163, 184, 0.25)',
        },
      }}
    />
  </StrictMode>,
)
