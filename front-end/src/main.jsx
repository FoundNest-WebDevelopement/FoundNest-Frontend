import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from "react-hot-toast";
import Admin from './Admin.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <Admin/>
    <Toaster position="bottom-center" 
      containerStyle={{
    bottom: 100, 
  }}/>
  </StrictMode>,
)
