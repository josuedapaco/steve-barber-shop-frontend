import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from './app/page';
import Staff from './app/staff/page';
import { LanguageProvider } from './components/language';
import './app/globals.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><LanguageProvider>{location.pathname.replace(/\/$/, '') === '/staff' ? <Staff /> : <Home />}</LanguageProvider></React.StrictMode>);
