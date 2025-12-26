import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNotification } from '../../NotificationContext';

const CategoryManagerDialog = ({ open, onClose }) => {
  const { showNotification } = useNotification();
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName) {
      try {
        await db.categories.add({ name: trimmedName });
        setNewCategoryName('');
        showNotification('分类已添加', 'success');
      } catch (error) {
        if (error.name === 'ConstraintError') {
          showNotification('该分类已存在', 'error');
        } else {
          showNotification('添加失败', 'error');
          console.error(error);
        }
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await db.categories.delete(id);
      showNotification('分类已删除', 'success');
    } catch (error) {
      showNotification('删除失败', 'error');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>分类管理</DialogTitle>
      <DialogContent>
        <List>
          {categories?.map(cat => (
            <ListItem
              key={cat.id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(cat.id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={cat.name} />
            </ListItem>
          ))}
        </List>
        <TextField
          autoFocus
          margin="dense"
          label="新分类名称"
          type="text"
          fullWidth
          variant="outlined"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
        <Button onClick={handleAddCategory} variant="contained">添加</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryManagerDialog;
