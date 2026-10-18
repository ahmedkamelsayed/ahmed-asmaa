import { createContext, useContext } from 'react';
import { config } from '../config.js';

export const LangContext = createContext('ar');

/** Current language code plus its wording from config.content. */
export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: config.content[lang] };
}
