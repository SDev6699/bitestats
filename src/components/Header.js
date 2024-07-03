import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useThemeContext } from '../ToggleColorMode';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const Header = () => {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Box sx={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '16px 32px',
      backgroundColor: mode === 'dark' ? '#1E1E1E' : '#F5F5F5',
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      borderBottom: '1px solid',
      borderColor: mode === 'dark' ? '#444444' : '#DDDDDD',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontFamily: 'Roboto' }}>
        BiteStats Dashboard
      </Typography>
      <IconButton onClick={toggleColorMode} color="inherit" sx={{ position: 'absolute', right: 16 }}>
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Box>
  );
};

export default Header;