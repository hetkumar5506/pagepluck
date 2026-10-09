import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyTheme, storedTheme } from '@/lib/theme';
import './style.css';

applyTheme(storedTheme()); // Paint the stored theme before React mounts, so light never flashes dark.

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
