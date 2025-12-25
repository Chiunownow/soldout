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
    }}>
      <Typography variant="h6" component="h1" sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
    </Box>
  );
};

export default PageHeader;
