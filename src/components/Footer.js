import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { useThemeContext } from '../ToggleColorMode';

const Footer = () => {
  const { mode } = useThemeContext();

  return (
    <Box sx={{
      bgcolor: mode === 'dark' ? '#121212' : '#FFFFFF',
      color: mode === 'dark' ? '#FFFFFF' : '#000000',
      py: 3,
      mt: 'auto',
      borderTop: '1px solid',
      borderColor: mode === 'dark' ? '#444444' : '#DDDDDD',
      boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <Typography variant="body1" align="center" sx={{ fontFamily: 'Roboto' }}>
        Connect with me on: <Link href="https://github.com/SDev6699" color="inherit" target="_blank" rel="noopener noreferrer">GitHub</Link> | <Link href="https://www.linkedin.com/in/sahil-atul-darandale-16b0a31a0/" color="inherit" target="_blank" rel="noopener noreferrer">LinkedIn</Link>
      </Typography>
      <Typography variant="body2" align="center" sx={{ mt: 2, fontFamily: 'Roboto' }}>
        <Link href="privacy-policy.html" target="_blank" rel="noopener noreferrer" color="inherit">Privacy Policy</Link>
      </Typography>
    </Box>
  );
};

export default Footer;