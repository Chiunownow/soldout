import React from 'react';
import { Box, Typography } from '@mui/material';

const PageHeader = ({ title }) => {
  return (
    <Box sx={{
      padding: '16px',
      borderBottom: '1px solid #eee',
      backgroundColor: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex', // Use flexbox
      justifyContent: 'space-between', // Space out items
      alignItems: 'center', // Vertically align items
    }}>
      <Typography variant="h6" component="h1" sx={{ textAlign: 'left', flexGrow: 1 }}>
        {title}
      </Typography>
      <img src="/favicon.svg" alt="App Favicon" style={{ height: '32px', width: '32px', marginLeft: '16px' }} />
    </Box>
  );
};

export default PageHeader;
