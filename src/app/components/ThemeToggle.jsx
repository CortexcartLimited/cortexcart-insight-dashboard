// src/app/components/ThemeToggle.jsx
'use client';

import { useTheme } from './ThemeProvider'; // Import our custom hook
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6" /> // Show moon icon in light mode
      ) : (
        <SunIcon className="h-6 w-6" /> // Show sun icon in dark mode
      )}
    </button>
  );
};

export default ThemeToggle;