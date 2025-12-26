import { useState, useEffect } from 'react';
import { db } from '../db';

const useProductWithImage = (product) => {
  const [productWithImage, setProductWithImage] = useState(null);

  useEffect(() => {
    if (!product) return;

    let imageUrl = null;
    let isCancelled = false;

    const fetchImage = async () => {
      const imageRecord = await db.productImages.get(product.id);
      if (!isCancelled && imageRecord && imageRecord.imageData) {
        imageUrl = URL.createObjectURL(imageRecord.imageData);
        setProductWithImage({ ...product, imageUrl });
      } else if (!isCancelled) {
        setProductWithImage({ ...product, imageUrl: null });
      }
    };

    fetchImage();

    return () => {
      isCancelled = true;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [product]);

  return productWithImage;
};

export default useProductWithImage;
