import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { watchInstallPrompt } from '@/lib/installPrompt'
import { registerServiceWorker } from '@/lib/serviceWorker'
import '@/styles/folio.css'
import '@/styles/index.css'
import '@/styles/install-prompt.css'

// Before the first render: `beforeinstallprompt` fires at most once and is never
// replayed, so the listener has to be in place ahead of React's effects.
watchInstallPrompt()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(<App />)
