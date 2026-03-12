import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { SettingsProvider } from './context/SettingsContext.tsx';
import { SelectionProvider } from './context/SelectionContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <SelectionProvider>
        <App />
      </SelectionProvider>
    </SettingsProvider>
  </StrictMode>,
);
