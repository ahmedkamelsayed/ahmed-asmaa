import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export function render(lang) {
  return renderToString(
    <StrictMode>
      <App lang={lang} />
    </StrictMode>,
  );
}
