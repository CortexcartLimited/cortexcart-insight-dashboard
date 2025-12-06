// src/app/components/ThemeProvider.js
'use client';

import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // FIX 1: Force default state to 'light'
  const [theme, setTheme] = useState('light'); 

  useEffect(() => {
    // FIX 2: Ignore local storage or force it to light
    // const savedTheme = localStorage.getItem('theme'); <-- Ignore old preferences
    setTheme('light');
  }, []);

  useEffect(() => {
    // FIX 3: CRITICAL - Always REMOVE the 'dark' class
    // This ensures that even if a stray 'dark' preference exists, we kill it.
    document.documentElement.classList.remove('dark');
    
    // Optional: Enforce light mode in storage too
    localStorage.setItem('theme', 'light');
    
  }, [theme]);

  // Helper to keep the API valid but do nothing
  const toggleTheme = () => {
    setTheme('light'); 
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}