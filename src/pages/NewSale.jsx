import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box } from '@mui/material';
import PageHeader from '../components/PageHeader';
import ProductCard from '../components/ProductCard';

const NewSale = () => {
  const products = useLiveQuery(() => db.products.orderBy('createdAt').reverse().toArray(), []);

  return (
    <Box>
      <PageHeader title="记账" />
      <Box sx={{ 
        p: 2,
        columnCount: 2,
        columnGap: '16px',
       }}>
        {products && products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Box>
    </Box>
  );
};

export default NewSale;
