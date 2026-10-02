import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import toast, { Toaster, useToasterStore } from "react-hot-toast";

function ToastLimit({ max = 1 }) {
  const { toasts } = useToasterStore()

  useEffect(() => {
    toasts
      .filter(t => t.visible)
      .filter((_, i) => i >= max) // newest come first, so this dismisses the oldest
      .forEach(t => toast.dismiss(t.id))
  }, [toasts, max])

  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-center" containerStyle={{ bottom: 100 }} />
    <ToastLimit max={1} />
  </StrictMode>,
)
