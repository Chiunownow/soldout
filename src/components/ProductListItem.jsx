import React from 'react';
import { ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ProductListItem = React.memo(({ product, categoryName, onEdit, onDelete }) => {
  return (
    <ListItem 
      divider
      sx={{ pr: '96px' }} // Add padding to the right to avoid overlap with secondary action
    >
      <ListItemText
        primary={product.name}
        secondary={
          <Box component="span">
            {product.description && (
              <Typography component="p" variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {product.description}
              </Typography>
            )}
            <Typography component="span" variant="body2" color="text.primary">
              总库存: {product.stock || 0}
              {categoryName && ` | 分类: ${categoryName}`}
            </Typography>
            {product.variants && product.variants.length > 0 ? (
              <Box component="div" sx={{ mt: 1, pl: 1, borderLeft: '2px solid #eee' }}>
                {product.variants.map((variant, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography component="span" variant="body2" color="text.secondary">
                      {variant.name}
                    </Typography>
                    <Typography component="span" variant="body2" color="text.secondary">
                      库存: {variant.stock}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
      />
      <ListItemSecondaryAction>
        <IconButton edge="end" aria-label="edit" onClick={() => onEdit(product)}>
          <EditIcon />
        </IconButton>
        <IconButton edge="end" aria-label="delete" onClick={() => onDelete(product.id)}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
});

export default ProductListItem;
