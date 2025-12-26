import React from 'react';
import { Card, CardActionArea, CardMedia, CardContent, Typography } from '@mui/material';
import useProductWithImage from '../hooks/useProductWithImage';

const ProductCard = ({ product }) => {
  const productWithImage = useProductWithImage(product);

  if (!productWithImage) {
    return (
      <Card sx={{ breakInside: 'avoid-column', mb: 2 }}>
        {/* You can put a placeholder/skeleton loader here */}
      </Card>
    );
  }

  return (
    <Card sx={{ breakInside: 'avoid-column', mb: 2 }}>
      <CardActionArea>
        {productWithImage.imageUrl && (
          <CardMedia
            component="img"
            height="140"
            image={productWithImage.imageUrl}
            alt={productWithImage.name}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {productWithImage.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            库存: {productWithImage.stock}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;
