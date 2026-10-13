import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from "react-hot-toast";
import ToastLimit from './components/ToastLimit.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster position="bottom-center" containerStyle={{ bottom: 100 }} />
    <ToastLimit max={0} /> 
  </StrictMode>, 
)
 