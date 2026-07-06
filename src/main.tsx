import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { I18nProvider } from './i18n'
import { ToastProvider } from './components/Toast'

// 전역 스타일 (기존 사이트 CSS 이식)
import './styles/responsive.css'
import './styles/themes.css'
import './styles/movie.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
