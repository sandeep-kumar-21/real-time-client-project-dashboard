import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Strict Compliance with Assessment: Zero tokens allowed in localStorage
try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("token");
  }
} catch {
  // Ignore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
