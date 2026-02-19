import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ActiveClientProvider } from './context/ActiveClientProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ActiveClientProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ActiveClientProvider>
    </AuthProvider>
  </StrictMode>,
)
