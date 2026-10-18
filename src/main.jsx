import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/great-vibes/400.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import '@fontsource/aref-ruqaa/400.css';
import '@fontsource/aref-ruqaa/700.css';
import '@fontsource/reem-kufi/400.css';
import '@fontsource/reem-kufi/500.css';
import './styles.css';
import App from './App.jsx';

// The page's <html lang> decides the version: index.html = ar, en.html = en.
const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
const container = document.getElementById('root');
const app = (
  <StrictMode>
    <App lang={lang} />
  </StrictMode>
);

// Production HTML is prerendered (see scripts/prerender.mjs); dev starts empty.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
