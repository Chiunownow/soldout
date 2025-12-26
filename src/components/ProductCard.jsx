import React from 'react';
import { Card, CardActionArea, CardMedia, CardContent, Typography, Box } from '@mui/material';

const ProductCard = ({ product }) => {
  return (
    <Card sx={{ breakInside: 'avoid-column', mb: 2 }}>
      <CardActionArea>
        <CardMedia
          component="img"
          height="140"
          image={product.imageUrl}
          alt={product.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            库存: {product.stock}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;
