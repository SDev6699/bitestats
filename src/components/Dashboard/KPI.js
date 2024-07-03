import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const KPI = ({ title, value, Icon }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', bgcolor: 'background.paper', color: 'text.primary', fontFamily: 'Roboto' }}>
      {Icon && (
        <Box sx={{ mb: 1 }}>
          <Icon sx={{ fontSize: 40 }} />
        </Box>
      )}
      <Typography 
        variant="h6" 
        component="h2" 
        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h4" 
        component="p" 
        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

export default KPI;