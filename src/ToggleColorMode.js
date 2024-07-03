import React, { createContext, useMemo, useState, useContext } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import '@fontsource/roboto';

const ColorModeContext = createContext();

export function useThemeContext() {
  return useContext(ColorModeContext);
}

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6200EE',
    },
    secondary: {
      main: '#03DAC6',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
    },
    divider: '#DDDDDD',
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    divider: '#444444',
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default function ToggleColorMode({ children }) {
  const [mode, setMode] = useState('light');

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
    mode,
  }), [mode]);

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}