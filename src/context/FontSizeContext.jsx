// src/context/FontSizeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// Three steps: small = 90%, medium = 100%, large = 112%
const SIZE_STEPS = ['small', 'medium', 'large'];
const ZOOM_MAP   = { small: 0.98, medium: 1.08, large: 1.18 };
const LABEL_MAP  = { small: 'Small', medium: 'Medium', large: 'Large' };
const STORAGE_KEY = 'icl_font_size';

const FontSizeContext = createContext(null);

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SIZE_STEPS.includes(saved) ? saved : 'medium';
  });

  // Persist whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  const zoom = ZOOM_MAP[fontSize];

  const cycleSize = () => {
    const idx = SIZE_STEPS.indexOf(fontSize);
    setFontSize(SIZE_STEPS[(idx + 1) % SIZE_STEPS.length]);
  };

  const setSize = (size) => {
    if (SIZE_STEPS.includes(size)) setFontSize(size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, zoom, label: LABEL_MAP[fontSize], cycleSize, setSize, SIZE_STEPS }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize must be used inside FontSizeProvider');
  return ctx;
};