import React, { useState, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

const AddChannelDialog = React.memo(({ open, onClose, onAdd }) => {
  const [name, setName] = useState('');

  const handleAdd = useCallback(() => {
    onAdd(name);
    setName('');
  }, [name, onAdd]);

  const handleClose = useCallback(() => {
    onClose();
    setName('');
  }, [onClose]);
  
  const handleNameChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>添加新支付渠道</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="渠道名称"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={handleNameChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button onClick={handleAdd} disabled={!name.trim()}>添加</Button>
      </DialogActions>
    </Dialog>
  );
});

export default AddChannelDialog;
