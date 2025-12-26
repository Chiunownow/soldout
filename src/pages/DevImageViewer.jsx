import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Box, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import PageHeader from '../components/PageHeader';

const DevImageViewer = () => {
  const images = useLiveQuery(() => db.productImages.toArray(), []);
  const [imageUrls, setImageUrls] = useState([]);

  useEffect(() => {
    if (images) {
      const urls = images.map(img => ({
        productId: img.productId,
        url: URL.createObjectURL(img.imageData),
      }));
      setImageUrls(urls);
    }

    // Cleanup function to revoke object URLs
    return () => {
      imageUrls.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [images]);

  return (
    <>
      <PageHeader title="开发者 - 图片浏览器" />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          已存储的商品图片 ({imageUrls.length} 张)
        </Typography>
        {imageUrls.length > 0 ? (
          <Grid container spacing={2}>
            {imageUrls.map(image => (
              <Grid item xs={6} sm={4} md={3} key={image.productId}>
                <Card>
                  <CardMedia
                    component="img"
                    image={image.url}
                    alt={`Product ${image.productId}`}
                    sx={{ height: 140, objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      产品 ID: {image.productId}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>数据库中没有图片。</Typography>
        )}
      </Box>
    </>
  );
};

export default DevImageViewer;
