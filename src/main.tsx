import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AuthWrapper from './AuthWrapper.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthWrapper />
  </StrictMode>
);
